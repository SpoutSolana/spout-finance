import { useCallback, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  PublicKey,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

import {
  SPOUT_ORDERS_PROGRAM_ID,
  USDC_MINT,
  deriveOrderConfig,
  deriveUsdcEscrow,
  deriveOrdersAuthority,
  derivePendingOrder,
} from "@/lib/solana/spoutOrders";

// IDL discriminator for cancel_order
const CANCEL_ORDER_DISCRIMINATOR = Buffer.from([
  95, 129, 237, 240, 8, 49, 223, 132,
]);

export type CancelOrderArgs = {
  orderId: bigint;
};

type UseCancelOrderResult = {
  cancelOrder: (args: CancelOrderArgs) => Promise<string>;
  isCancelling: boolean;
  error: string | null;
};

export function useCancelOrder(): UseCancelOrderResult {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cancelOrder = useCallback(
    async (args: CancelOrderArgs): Promise<string> => {
      if (!publicKey) throw new Error("Wallet not connected");

      setIsCancelling(true);
      setError(null);

      try {
        // Derive PDAs
        const [orderConfigPda] = deriveOrderConfig();
        const [pendingOrderPda] = derivePendingOrder(publicKey, args.orderId);
        const [usdcEscrowPda] = deriveUsdcEscrow();
        const [ordersAuthorityPda] = deriveOrdersAuthority();
        const userUsdcAta = getAssociatedTokenAddressSync(USDC_MINT, publicKey);

        // cancel_order has no args — just the discriminator
        const instructionData = CANCEL_ORDER_DISCRIMINATOR;

        // Accounts array (matches IDL cancel_order exactly)
        const keys = [
          { pubkey: orderConfigPda, isSigner: false, isWritable: false },           // order_config
          { pubkey: pendingOrderPda, isSigner: false, isWritable: true },            // pending_order
          { pubkey: usdcEscrowPda, isSigner: false, isWritable: true },              // usdc_escrow
          { pubkey: ordersAuthorityPda, isSigner: false, isWritable: true },         // orders_authority
          { pubkey: userUsdcAta, isSigner: false, isWritable: true },                // user_usdc_account
          { pubkey: publicKey, isSigner: true, isWritable: false },                  // canceller
          { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },          // token_program
        ];

        const ix = new TransactionInstruction({
          keys,
          programId: SPOUT_ORDERS_PROGRAM_ID,
          data: instructionData,
        });

        const { blockhash, lastValidBlockHeight } =
          await connection.getLatestBlockhash("finalized");

        const tx = new Transaction({
          feePayer: publicKey,
          recentBlockhash: blockhash,
        });
        tx.add(ix);

        // Simulate
        console.log("Simulating cancel_order...");
        const simulation = await connection.simulateTransaction(tx);
        if (simulation.value.err) {
          console.error("Simulation failed:", simulation.value.err);
          console.error("Logs:", simulation.value.logs);
          throw new Error(
            `Simulation failed: ${JSON.stringify(simulation.value.err)}`
          );
        }

        // Send
        const sig = await sendTransaction(tx, connection, {
          skipPreflight: false,
          preflightCommitment: "confirmed",
        });

        console.log("cancel_order tx sent:", sig);

        await connection.confirmTransaction(
          { signature: sig, blockhash, lastValidBlockHeight },
          "confirmed"
        );

        console.log("cancel_order confirmed:", sig);
        return sig;
      } catch (e: any) {
        const errorMsg = e?.message || String(e);
        setError(errorMsg);
        throw e;
      } finally {
        setIsCancelling(false);
      }
    },
    [publicKey, sendTransaction, connection]
  );

  return { cancelOrder, isCancelling, error };
}
