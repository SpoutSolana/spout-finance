import { useCallback, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";

import {
  SPOUT_ORDERS_PROGRAM_ID,
  FEED_ID_SPY,
  // CHAINLINK_VERIFIER_PROGRAM,
  // CHAINLINK_ACCESS_CONTROLLER,
  deriveOrderConfig,
  deriveOracleConfig,
  deriveOrdersAuthority,
  derivePendingOrder,
  deriveIdentity,
  // deriveVerifierConfig,
  // deriveReportConfig,
} from "@/lib/solana/spoutOrders";
// import { fetchChainlinkReport } from "@/lib/solana/fetchChainlinkReport";
import { buildMockReportV11 } from "@/lib/solana/buildMockReport";

// IDL discriminator for place_sell_order
const PLACE_SELL_ORDER_DISCRIMINATOR = Buffer.from([
  254, 177, 180, 104, 171, 194, 79, 86,
]);

export type PlaceSellOrderArgs = {
  ticker: string;
  assetAmount: number; // in token smallest units (6 decimals for SPY)
  limitPrice?: number; // 0 = market order
  tokenMint: PublicKey; // the security token mint (needed for oracle config PDA)
  feedId?: string; // Chainlink Data Streams feed ID (defaults to SPY)
};

type PlaceSellOrderResult = {
  signature: string;
  orderId: bigint;
};

type UsePlaceSellOrderResult = {
  placeSellOrder: (args: PlaceSellOrderArgs) => Promise<PlaceSellOrderResult>;
  isSubmitting: boolean;
  error: string | null;
};

/**
 * Serialize place_sell_order instruction data matching the IDL:
 *   order_id: u64, ticker: String, asset_amount: u64,
 *   limit_price: u128, identity_bump: u8, signed_report: Vec<u8>
 */
function serializeSellOrderData(
  orderId: bigint,
  ticker: string,
  assetAmount: bigint,
  limitPrice: bigint,
  identityBump: number,
  signedReport: Buffer
): Buffer {
  const tickerBytes = Buffer.from(ticker, "utf8");

  const totalSize =
    8 + 8 + (4 + tickerBytes.length) + 8 + 16 + 1 + (4 + signedReport.length);
  const buf = Buffer.alloc(totalSize);
  let offset = 0;

  // Discriminator
  PLACE_SELL_ORDER_DISCRIMINATOR.copy(buf, offset);
  offset += 8;

  // order_id: u64 LE
  buf.writeBigUInt64LE(orderId, offset);
  offset += 8;

  // ticker: String (4-byte LE length + UTF-8 bytes)
  buf.writeUInt32LE(tickerBytes.length, offset);
  offset += 4;
  tickerBytes.copy(buf, offset);
  offset += tickerBytes.length;

  // asset_amount: u64 LE
  buf.writeBigUInt64LE(assetAmount, offset);
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

export function usePlaceSellOrder(): UsePlaceSellOrderResult {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const placeSellOrder = useCallback(
    async (args: PlaceSellOrderArgs): Promise<PlaceSellOrderResult> => {
      if (!publicKey) throw new Error("Wallet not connected");

      setIsSubmitting(true);
      setError(null);

      try {
        // --- 1. Generate unique order ID ---
        const orderId = BigInt(Date.now());

        // --- 2. Derive PDA accounts ---
        const [orderConfigPda] = deriveOrderConfig();
        const [oracleConfigPda] = deriveOracleConfig(args.tokenMint);
        const [ordersAuthorityPda] = deriveOrdersAuthority();
        const [pendingOrderPda] = derivePendingOrder(publicKey, orderId);
        const [identityPda, identityBump] = deriveIdentity(publicKey);

        // --- 3. Build mock signed report (V11) ---
        const feedIdHex = (args.feedId ?? FEED_ID_SPY).replace("0x", "");
        const feedIdBuf = Buffer.from(feedIdHex, "hex");
        const mockPrice = args.limitPrice
          ? BigInt(args.limitPrice)
          : BigInt("655000000000000000000");
        const mockReport = buildMockReportV11(feedIdBuf, mockPrice);
        console.log("Built mock report V11:", mockReport.length, "bytes, price:", mockPrice.toString());

        // --- 4. Serialize instruction data (matches IDL exactly) ---
        const instructionData = serializeSellOrderData(
          orderId,
          args.ticker,
          BigInt(args.assetAmount),
          BigInt(args.limitPrice ?? 0),
          identityBump,
          mockReport
        );

        // --- 5. Accounts array (mock mode — pass SystemProgram for Chainlink accounts) ---
        const keys = [
          { pubkey: orderConfigPda, isSigner: false, isWritable: false },              // order_config
          { pubkey: oracleConfigPda, isSigner: false, isWritable: false },             // oracle_config
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },     // chainlink_verifier_program (mock)
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },     // verifier_config_pda (mock)
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },     // access_controller (mock)
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },     // report_config_pda (mock)
          { pubkey: pendingOrderPda, isSigner: false, isWritable: true },              // pending_order
          { pubkey: identityPda, isSigner: false, isWritable: false },                 // identity
          { pubkey: publicKey, isSigner: true, isWritable: false },                    // user
          { pubkey: ordersAuthorityPda, isSigner: false, isWritable: true },           // orders_authority
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },     // system_program
        ];

        const ix = new TransactionInstruction({
          keys,
          programId: SPOUT_ORDERS_PROGRAM_ID,
          data: instructionData,
        });

        // --- 7. Build and send transaction ---
        const { blockhash, lastValidBlockHeight } =
          await connection.getLatestBlockhash("finalized");

        const tx = new Transaction({
          feePayer: publicKey,
          recentBlockhash: blockhash,
        });

        tx.add(ix);

        // --- 8. Simulate ---
        console.log("Simulating place_sell_order...");
        const simulation = await connection.simulateTransaction(tx);
        if (simulation.value.err) {
          console.error("Simulation failed:", simulation.value.err);
          console.error("Logs:", simulation.value.logs);
          throw new Error(
            `Simulation failed: ${JSON.stringify(simulation.value.err)}`
          );
        }

        // --- 9. Send and confirm ---
        const sig = await sendTransaction(tx, connection, {
          skipPreflight: false,
          preflightCommitment: "confirmed",
        });

        console.log("place_sell_order tx sent:", sig);

        await connection.confirmTransaction(
          { signature: sig, blockhash, lastValidBlockHeight },
          "confirmed"
        );

        console.log("place_sell_order confirmed:", sig);
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

  return { placeSellOrder, isSubmitting, error };
}
