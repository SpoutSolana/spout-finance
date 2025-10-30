import { useCallback, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram, Transaction, TransactionInstruction } from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountIdempotentInstruction,
} from "@solana/spl-token";
import * as borsh from "@coral-xyz/borsh";
import { BN } from "@coral-xyz/anchor";

const PROGRAM_ID = new PublicKey("EkU7xRmBhVyHdwtRZ4SJ9D3Nz6SeAvymft7nz3CL2XXB");
const ORDER_EVENTS_PDA = new PublicKey("8Xk151dxP3vs9tiR64hPRqNzjrGojvVqWz2vye2tMsrM");
const USDC_MINT = new PublicKey("Bd8tBm8WNPhmW5FjvAkisw4C9G3NEE7NowEW6VUuMHjW");

const SAS_PROGRAM_ID = new PublicKey("22zoJMtdu4tQc2PzL74ZUT7FrwgB1Udec8DdW4yw4BdG");
const CREDENTIAL_PDA = new PublicKey("B4PtmaDJdFQBxpvwdLB3TDXuLd69wnqXexM2uBqqfMXL");
const SCHEMA_PDA = new PublicKey("GvJbCuyqzTiACuYwFzqZt7cEPXSeD5Nq3GeWBobFfU8x");

// Use actual attestation per user in app; default here for smoke tests
const DEFAULT_ATTESTATION_PDA = new PublicKey("CCk57tftGZpe6ZPRzqGVmPehTtDDqNwzgwx92qBhQTSh");

// Any account for manual flow (unchecked on-chain)
const DUMMY_PRICE_FEED = ORDER_EVENTS_PDA;

// Treasury owner PDA (config)
const CONFIG_PDA = new PublicKey("Fpyphnx8Hr8eprzcmLnm9yDupRdm4pFtk7KReGibAUbp");

// IDL discriminator for sell_asset_manual
const SELL_ASSET_MANUAL_DISCRIMINATOR = Buffer.from([93, 29, 23, 188, 159, 215, 86, 179]);

type UseSellManualResult = {
  sellManual: (args?: {
    ticker?: string;
    assetAmount?: number;   // amount of asset (6 decimals if your asset uses 6)
    manualPrice?: number;   // price in USDC 6 decimals
    attestationPdaOverride?: PublicKey;
    ordersUsdcAccountOverride?: PublicKey; // treasury ATA override if needed
  }) => Promise<string>;
  isSubmitting: boolean;
  error: string | null;
};

export function useSellAssetManual(): UseSellManualResult {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sellManual = useCallback(async (args?: {
    ticker?: string;
    assetAmount?: number;
    manualPrice?: number;
    attestationPdaOverride?: PublicKey;
    ordersUsdcAccountOverride?: PublicKey;
  }): Promise<string> => {
    if (!publicKey) throw new Error("Wallet not connected");
    setIsSubmitting(true);
    setError(null);
    try {
      const ticker = args?.ticker ?? "LQD";
      const assetAmount = args?.assetAmount ?? 1_000_000;    // 1.0 asset (6d)
      const manualPrice = args?.manualPrice ?? 1_000_000;    // $1.0 (6d)

      // User USDC ATA (destination in sell, if program transfers from treasury → user)
      const userUsdcAta = getAssociatedTokenAddressSync(USDC_MINT, publicKey);

      // Derive orders authority PDA and use it as the treasury USDC ATA owner
      const [ordersAuthority] = PublicKey.findProgramAddressSync(
        [Buffer.from("orders_authority")],
        PROGRAM_ID
      );

      const treasuryUsdcAta = getAssociatedTokenAddressSync(USDC_MINT, ordersAuthority, true);
      const ordersUsdcAccount = args?.ordersUsdcAccountOverride ?? treasuryUsdcAta;

      // Derive attestation PDA for the connected user; fallback only if lib unavailable
      let attestationAccount: PublicKey;
      if (args?.attestationPdaOverride) {
        attestationAccount = args.attestationPdaOverride;
      } else {
        try {
          const sas = await import("sas-lib");
          const nonce = publicKey.toBase58();
          const [attPda] = await (sas as any).deriveAttestationPda({
            credential: CREDENTIAL_PDA.toBase58(),
            schema: SCHEMA_PDA.toBase58(),
            nonce,
          });
          attestationAccount = new PublicKey(attPda);
        } catch {
          attestationAccount = DEFAULT_ATTESTATION_PDA;
        }
      }

      // Encode args: (ticker: string, asset_amount: u64, manual_price: u64)
      const layout = borsh.struct([
        borsh.str("ticker"),
        borsh.u64("assetAmount"),
        borsh.u64("manualPrice"),
      ]);
      const buf = Buffer.alloc(1000);
      layout.encode(
        { ticker, assetAmount: new BN(assetAmount), manualPrice: new BN(manualPrice) },
        buf
      );
      const argLen = layout.getSpan(buf);
      const data = Buffer.concat([SELL_ASSET_MANUAL_DISCRIMINATOR, buf.slice(0, argLen)]);

      // Accounts per IDL order
      const keys = [
        { pubkey: publicKey, isSigner: true, isWritable: true },             // user
        { pubkey: userUsdcAta, isSigner: false, isWritable: true },          // user_usdc_account
        { pubkey: ORDER_EVENTS_PDA, isSigner: false, isWritable: true },     // order_events
        { pubkey: ordersUsdcAccount, isSigner: false, isWritable: true },    // orders_usdc_account (treasury)
        { pubkey: ordersAuthority, isSigner: false, isWritable: false },     // orders_authority
        { pubkey: USDC_MINT, isSigner: false, isWritable: false },           // usdc_mint
        { pubkey: attestationAccount, isSigner: false, isWritable: false },  // attestation_account
        { pubkey: SCHEMA_PDA, isSigner: false, isWritable: false },          // schema_account
        { pubkey: CREDENTIAL_PDA, isSigner: false, isWritable: false },      // credential_account
        { pubkey: SAS_PROGRAM_ID, isSigner: false, isWritable: false },      // sas_program
        { pubkey: DUMMY_PRICE_FEED, isSigner: false, isWritable: false },    // price_feed (unused manual)
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },    // token_program
        { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ];

      const ix = new TransactionInstruction({ programId: PROGRAM_ID, keys, data });

      const tx = new Transaction();

      // Ensure ATAs exist (idempotent)
      tx.add(
        createAssociatedTokenAccountIdempotentInstruction(
          publicKey, userUsdcAta, publicKey, USDC_MINT, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID
        )
      );
      tx.add(
        createAssociatedTokenAccountIdempotentInstruction(
          publicKey, treasuryUsdcAta, ordersAuthority, USDC_MINT, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID
        )
      );

      tx.add(ix);

      // Optional: simulate first
      // const sim = await connection.simulateTransaction(tx);
      // if (sim.value.err) throw new Error(JSON.stringify(sim.value.err));

      const sig = await sendTransaction(tx, connection, {
        skipPreflight: false,
        preflightCommitment: "confirmed",
      });
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, "confirmed");
      return sig;
    } catch (e: any) {
      setError(e?.message || String(e));
      throw e;
    } finally {
      setIsSubmitting(false);
    }
  }, [connection, publicKey, sendTransaction]);

  return { sellManual, isSubmitting, error };
}

export default useSellAssetManual;