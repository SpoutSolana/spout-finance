import { useCallback, useMemo, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram, Transaction, TransactionInstruction } from "@solana/web3.js";
import { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, createAssociatedTokenAccountIdempotentInstruction } from "@solana/spl-token";
import * as borsh from "@coral-xyz/borsh";
import { BN } from "@coral-xyz/anchor";

const PROGRAM_ID = new PublicKey("EkU7xRmBhVyHdwtRZ4SJ9D3Nz6SeAvymft7nz3CL2XXB");
const ORDER_EVENTS_PDA = new PublicKey("8Xk151dxP3vs9tiR64hPRqNzjrGojvVqWz2vye2tMsrM");
const USDC_MINT = new PublicKey("Bd8tBm8WNPhmW5FjvAkisw4C9G3NEE7NowEW6VUuMHjW");
const SAS_PROGRAM_ID = new PublicKey("22zoJMtdu4tQc2PzL74ZUT7FrwgB1Udec8DdW4yw4BdG");
const CREDENTIAL_PDA = new PublicKey("B4PtmaDJdFQBxpvwdLB3TDXuLd69wnqXexM2uBqqfMXL");
const SCHEMA_PDA = new PublicKey("GvJbCuyqzTiACuYwFzqZt7cEPXSeD5Nq3GeWBobFfU8x");
const DEFAULT_ATTESTATION_PDA = new PublicKey("CCk57tftGZpe6ZPRzqGVmPehTtDDqNwzgwx92qBhQTSh");
const DUMMY_PRICE_FEED = ORDER_EVENTS_PDA;
// Treasury/config PDA (owner of treasury USDC ATA)
const CONFIG_PDA = new PublicKey("Fpyphnx8Hr8eprzcmLnm9yDupRdm4pFtk7KReGibAUbp");

// Instruction discriminator for buy_asset_manual from your IDL
const BUY_ASSET_MANUAL_DISCRIMINATOR = Buffer.from([19, 94, 209, 174, 123, 252, 104, 138]);

type UseBuyManualResult = {
  buyManual: (args?: {
    ticker?: string;
    usdcAmount?: number;
    manualPrice?: number;
    attestationPdaOverride?: PublicKey;
    ordersUsdcAccountOverride?: PublicKey;
  }) => Promise<string>;
  isSubmitting: boolean;
  error: string | null;
};

export function useBuyAssetManual(): UseBuyManualResult {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buyManual = useCallback(async (args?: {
    ticker?: string;
    usdcAmount?: number;
    manualPrice?: number;
    attestationPdaOverride?: PublicKey;
    ordersUsdcAccountOverride?: PublicKey;
  }): Promise<string> => {
    console.log('🚀 buyManual called', { publicKey: publicKey?.toString(), args });
    
    if (!publicKey) {
      const err = "Wallet not connected";
      console.error('❌', err);
      throw new Error(err);
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Check balance for the connected wallet
      console.log('💰 Checking balance for connected wallet:', publicKey.toString());
      try {
        const bal = await connection.getBalance(publicKey);
        console.log('Balance:', bal / 1_000_000_000, 'SOL');
        
        const minLamports = 0.05 * 1_000_000_000;
        if (bal < minLamports) {
          console.log('🪂 Requesting airdrop...');
          const sig = await connection.requestAirdrop(publicKey, 1_000_000_000);
          await connection.confirmTransaction(sig, "confirmed");
          console.log('✅ Airdrop confirmed');
        }
      } catch (airdropError) {
        console.warn('⚠️ Airdrop failed (might be on mainnet):', airdropError);
      }

      const ticker = args?.ticker ?? "LQD";
      const usdcAmount = args?.usdcAmount ?? 1_000_000;
      const manualPrice = args?.manualPrice ?? 1_000_000;

      console.log('📝 Transaction params:', { ticker, usdcAmount, manualPrice });

      const userUsdcAta = getAssociatedTokenAddressSync(USDC_MINT, publicKey);
      // Treasury ATA owned by CONFIG_PDA (PDA owner → allowOwnerOffCurve=true)
      const treasuryUsdcAta = getAssociatedTokenAddressSync(USDC_MINT, CONFIG_PDA, true);
      const ordersUsdcAccount =
        args?.ordersUsdcAccountOverride ?? treasuryUsdcAta;
      // Derive attestation PDA for the connected user (sas-lib uses base58 nonce)
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
        } catch (_) {
          // Fallback to default only if derivation library unavailable
          attestationAccount = DEFAULT_ATTESTATION_PDA;
        }
      }
      const [ordersAuthority] = PublicKey.findProgramAddressSync(
        [Buffer.from("orders_authority")],
        PROGRAM_ID
      );

      console.log('🔑 Account addresses:', {
        user: publicKey.toString(),
        userUsdcAta: userUsdcAta.toString(),
        ordersUsdcAccount: ordersUsdcAccount.toString(),
        ordersAuthority: ordersAuthority.toString(),
      });

      // Build instruction manually using borsh
      console.log('🏗️ Building instruction manually...');
      
      // Define the instruction data layout
      const instructionLayout = borsh.struct([
        borsh.str("ticker"),
        borsh.u64("usdcAmount"),
        borsh.u64("manualPrice"),
      ]);

      // Serialize the instruction data - use BN instead of BigInt
      const data = Buffer.alloc(1000); // Allocate enough space
      const serializedData = {
        ticker,
        usdcAmount: new BN(usdcAmount),
        manualPrice: new BN(manualPrice),
      };
      
      instructionLayout.encode(serializedData, data);
      const dataLen = instructionLayout.getSpan(data);
      const instructionData = Buffer.concat([
        BUY_ASSET_MANUAL_DISCRIMINATOR,
        data.slice(0, dataLen)
      ]);

      console.log('📦 Instruction data:', {
        discriminator: BUY_ASSET_MANUAL_DISCRIMINATOR.toString('hex'),
        dataLength: instructionData.length,
        ticker,
        usdcAmount: usdcAmount.toString(),
        manualPrice: manualPrice.toString(),
      });

      // Build the accounts array
      const keys = [
        { pubkey: publicKey, isSigner: true, isWritable: true },
        { pubkey: userUsdcAta, isSigner: false, isWritable: true },
        { pubkey: ORDER_EVENTS_PDA, isSigner: false, isWritable: true },
        { pubkey: ordersUsdcAccount, isSigner: false, isWritable: true },
        { pubkey: ordersAuthority, isSigner: false, isWritable: false },
        { pubkey: USDC_MINT, isSigner: false, isWritable: false },
        { pubkey: attestationAccount, isSigner: false, isWritable: false },
        { pubkey: SCHEMA_PDA, isSigner: false, isWritable: false },
        { pubkey: CREDENTIAL_PDA, isSigner: false, isWritable: false },
        { pubkey: SAS_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: DUMMY_PRICE_FEED, isSigner: false, isWritable: false },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ];

      const ix = new TransactionInstruction({
        keys,
        programId: PROGRAM_ID,
        data: instructionData,
      });

      console.log('✅ Instruction built successfully');

      // Prepare transaction and ensure ATAs exist (idempotent creates)
      console.log('🔗 Getting latest blockhash...');
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');
      console.log('✅ Blockhash obtained:', blockhash);

      const tx = new Transaction({ feePayer: publicKey, recentBlockhash: blockhash });
      // Create user USDC ATA if missing (idempotent)
      tx.add(
        createAssociatedTokenAccountIdempotentInstruction(
          publicKey, // payer
          userUsdcAta,
          publicKey, // owner
          USDC_MINT,
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        )
      );
      // Create treasury USDC ATA if missing (idempotent; PDA owner off-curve)
      tx.add(
        createAssociatedTokenAccountIdempotentInstruction(
          publicKey, // payer
          treasuryUsdcAta,
          CONFIG_PDA, // owner (PDA)
          USDC_MINT,
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        )
      );
      // Finally, add the program instruction
      tx.add(ix);

      console.log('📤 Sending transaction to wallet for signature...');
      console.log('Transaction details:', {
        feePayer: tx.feePayer?.toString(),
        recentBlockhash: tx.recentBlockhash,
        instructionCount: tx.instructions.length
      });

      // First, simulate the transaction to see if there are any errors
      console.log('🧪 Simulating transaction...');
      try {
        const simulation = await connection.simulateTransaction(tx);
        console.log('Simulation result:', {
          err: simulation.value.err,
          logs: simulation.value.logs,
          unitsConsumed: simulation.value.unitsConsumed
        });
        
        if (simulation.value.err) {
          console.error('❌ Simulation failed:', simulation.value.err);
          console.error('Program logs:', simulation.value.logs);
          throw new Error(`Transaction simulation failed: ${JSON.stringify(simulation.value.err)}`);
        }
      } catch (simError: any) {
        console.error('❌ Simulation error:', simError);
        throw simError;
      }
      
      // This should trigger the wallet popup
      const sig = await sendTransaction(tx, connection, {
        skipPreflight: false,
        preflightCommitment: "confirmed",
      });

      console.log(' Transaction sent! Signature:', sig);
      console.log(' Confirming transaction...');

      await connection.confirmTransaction({ 
        signature: sig, 
        blockhash, 
        lastValidBlockHeight 
      }, "confirmed");

      console.log(' Transaction confirmed!');
      return sig;
    } catch (e: any) {
      console.error('❌ Transaction failed:', e);
      console.log('Full error object:', {
        message: e?.message,
        name: e?.name,
        stack: e?.stack,
        logs: e?.logs
      });
      const errorMsg = e?.message || String(e);
      setError(errorMsg);
      throw e;
    } finally {
      setIsSubmitting(false);
    }
  }, [publicKey, sendTransaction, connection]);

  return { buyManual, isSubmitting, error };
}

export default useBuyAssetManual;