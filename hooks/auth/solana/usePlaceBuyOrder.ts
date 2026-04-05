import { useCallback, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountIdempotentInstruction,
} from "@solana/spl-token";
import {
  SPOUT_ORDERS_PROGRAM_ID,
  USDC_MINT,
  FEED_ID_SPY,
  // CHAINLINK_VERIFIER_PROGRAM,
  // CHAINLINK_ACCESS_CONTROLLER,
  deriveOrderConfig,
  deriveOracleConfig,
  deriveUsdcEscrow,
  deriveOrdersAuthority,
  derivePendingOrder,
  deriveIdentity,
  // deriveVerifierConfig,
  // deriveReportConfig,
} from "@/lib/solana/spoutOrders";
// import { fetchChainlinkReport } from "@/lib/solana/fetchChainlinkReport";
import { buildMockReportV11 } from "@/lib/solana/buildMockReport";

// IDL discriminator for place_buy_order
const PLACE_BUY_ORDER_DISCRIMINATOR = Buffer.from([
  47, 253, 241, 214, 167, 204, 11, 39,
]);

export type PlaceBuyOrderArgs = {
  ticker: string;
  usdcAmount: number; // in USDC smallest units (6 decimals), e.g. 1_000_000 = $1
  limitPrice?: number; // 0 = market order
  tokenMint: PublicKey; // the security token mint (needed for oracle config PDA)
  feedId?: string; // Chainlink Data Streams feed ID (defaults to SPY)
};

type PlaceBuyOrderResult = {
  signature: string;
  orderId: bigint;
};

type UsePlaceBuyOrderResult = {
  placeBuyOrder: (args: PlaceBuyOrderArgs) => Promise<PlaceBuyOrderResult>;
  isSubmitting: boolean;
  error: string | null;
};

/**
 * Serialize place_buy_order instruction data matching the IDL:
 *   order_id: u64, ticker: String, usdc_amount: u64,
 *   limit_price: u128, identity_bump: u8, signed_report: Vec<u8>
 */
function serializeBuyOrderData(
  orderId: bigint,
  ticker: string,
  usdcAmount: bigint,
  limitPrice: bigint,
  identityBump: number,
  signedReport: Buffer
): Buffer {
  const tickerBytes = Buffer.from(ticker, "utf8");

  // Calculate total size:
  // 8 (discriminator) + 8 (order_id) + 4+len (ticker) + 8 (usdc_amount)
  // + 16 (limit_price u128) + 1 (identity_bump) + 4+len (signed_report)
  const totalSize =
    8 + 8 + (4 + tickerBytes.length) + 8 + 16 + 1 + (4 + signedReport.length);
  const buf = Buffer.alloc(totalSize);
  let offset = 0;

  // Discriminator
  PLACE_BUY_ORDER_DISCRIMINATOR.copy(buf, offset);
  offset += 8;

  // order_id: u64 LE
  buf.writeBigUInt64LE(orderId, offset);
  offset += 8;

  // ticker: String (4-byte LE length + UTF-8 bytes)
  buf.writeUInt32LE(tickerBytes.length, offset);
  offset += 4;
  tickerBytes.copy(buf, offset);
  offset += tickerBytes.length;

  // usdc_amount: u64 LE
  buf.writeBigUInt64LE(usdcAmount, offset);
  offset += 8;

  // limit_price: u128 LE (16 bytes)
  let lp = limitPrice;
  for (let i = 0; i < 16; i++) {
    buf[offset + i] = Number(lp & BigInt(0xff));
    lp >>= BigInt(8);
  }
  offset += 16;

  // identity_bump: u8
  buf.writeUInt8(identityBump, offset);
  offset += 1;

  // signed_report: Vec<u8> (4-byte LE length + bytes)
  buf.writeUInt32LE(signedReport.length, offset);
  offset += 4;
  signedReport.copy(buf, offset);

  return buf;
}

export function usePlaceBuyOrder(): UsePlaceBuyOrderResult {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const placeBuyOrder = useCallback(
    async (args: PlaceBuyOrderArgs): Promise<PlaceBuyOrderResult> => {
      if (!publicKey) throw new Error("Wallet not connected");

      setIsSubmitting(true);
      setError(null);

      try {
        // --- 1. Generate unique order ID ---
        const orderId = BigInt(Date.now());

        // --- 2. Derive all PDA accounts ---
        const [orderConfigPda] = deriveOrderConfig();
        const [oracleConfigPda] = deriveOracleConfig(args.tokenMint);
        const [usdcEscrowPda] = deriveUsdcEscrow();
        const [ordersAuthorityPda] = deriveOrdersAuthority();
        const [pendingOrderPda] = derivePendingOrder(publicKey, orderId);
        const [identityPda, identityBump] = deriveIdentity(publicKey);

        // --- 3. Build mock signed report (V11) ---
        const feedIdHex = (args.feedId ?? FEED_ID_SPY).replace("0x", "");
        const feedIdBuf = Buffer.from(feedIdHex, "hex");
        // Use limit price if set, otherwise default to $655 (current SPY range)
        const mockPrice = args.limitPrice
          ? BigInt(args.limitPrice)
          : BigInt("655000000000000000000");
        const mockReport = buildMockReportV11(feedIdBuf, mockPrice);
        console.log("Built mock report V11:", mockReport.length, "bytes, price:", mockPrice.toString());

        // --- 4. User USDC ATA ---
        const userUsdcAta = getAssociatedTokenAddressSync(USDC_MINT, publicKey);

        // --- 5. Serialize instruction data (matches IDL exactly) ---
        const instructionData = serializeBuyOrderData(
          orderId,
          args.ticker,
          BigInt(args.usdcAmount),
          BigInt(args.limitPrice ?? 0),
          identityBump,
          mockReport
        );

        // --- 6. Accounts array (mock mode — pass SystemProgram for Chainlink accounts) ---
        const keys = [
          { pubkey: orderConfigPda, isSigner: false, isWritable: false },              // order_config
          { pubkey: oracleConfigPda, isSigner: false, isWritable: false },             // oracle_config
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },     // chainlink_verifier_program (mock)
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },     // verifier_config_pda (mock)
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },     // access_controller (mock)
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },     // report_config_pda (mock)
          { pubkey: pendingOrderPda, isSigner: false, isWritable: true },              // pending_order
          { pubkey: userUsdcAta, isSigner: false, isWritable: true },                  // user_usdc_account
          { pubkey: usdcEscrowPda, isSigner: false, isWritable: true },                // usdc_escrow
          { pubkey: identityPda, isSigner: false, isWritable: false },                 // identity
          { pubkey: publicKey, isSigner: true, isWritable: false },                    // user
          { pubkey: ordersAuthorityPda, isSigner: false, isWritable: true },           // orders_authority
          { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },            // token_program
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },     // system_program
        ];

        const ix = new TransactionInstruction({
          keys,
          programId: SPOUT_ORDERS_PROGRAM_ID,
          data: instructionData,
        });

        // --- 8. Build transaction ---
        const { blockhash, lastValidBlockHeight } =
          await connection.getLatestBlockhash("finalized");

        const tx = new Transaction({
          feePayer: publicKey,
          recentBlockhash: blockhash,
        });

        // Ensure user USDC ATA exists
        tx.add(
          createAssociatedTokenAccountIdempotentInstruction(
            publicKey,
            userUsdcAta,
            publicKey,
            USDC_MINT,
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID
          )
        );

        tx.add(ix);

        // --- 9. Simulate ---
        console.log("Simulating place_buy_order...");
        const simulation = await connection.simulateTransaction(tx);
        if (simulation.value.err) {
          const logs = simulation.value.logs ?? [];
          console.error("Simulation failed:", simulation.value.err);
          console.error("Logs:", logs);
          // Find the program error line in logs for a readable message
          const programError = logs.find(
            (l: string) => l.includes("Error") || l.includes("failed") || l.includes("custom program error")
          );
          throw new Error(
            programError || `Simulation failed: ${JSON.stringify(simulation.value.err)}`
          );
        }

        // --- 10. Send and confirm ---
        const sig = await sendTransaction(tx, connection, {
          skipPreflight: false,
          preflightCommitment: "confirmed",
        });

        console.log("place_buy_order tx sent:", sig);

        await connection.confirmTransaction(
          { signature: sig, blockhash, lastValidBlockHeight },
          "confirmed"
        );

        console.log("place_buy_order confirmed:", sig);
        return { signature: sig, orderId };
      } catch (e: any) {
        const errorMsg = e?.message || String(e);
        setError(errorMsg);
        throw e;
      } finally {
        setIsSubmitting(false);
      }
    },
    [publicKey, sendTransaction, connection]
  );

  return { placeBuyOrder, isSubmitting, error };
}
