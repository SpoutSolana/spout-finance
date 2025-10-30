import { useCallback, useMemo, useState, useEffect } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress, ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";

export type UseTokenBalanceResult = {
  amountRaw: string | null;
  decimals: number | null;
  amountUi: string | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

// Token-2022 balance hook; pass ownerIsPda=true if the owner is a PDA
export function useBalanceToken(mint: PublicKey | null, owner: PublicKey | null, ownerIsPda = false): UseTokenBalanceResult {
  const { connection } = useConnection();
  const [amountRaw, setAmountRaw] = useState<string | null>(null);
  const [decimals, setDecimals] = useState<number | null>(null);
  const [amountUi, setAmountUi] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ataPromise = useMemo(() => {
    if (!mint || !owner) return null;
    return getAssociatedTokenAddress(
      mint,
      owner,
      ownerIsPda,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
  }, [mint, owner, ownerIsPda]);

  const fetchBalance = useCallback(async () => {
    if (!ataPromise) { setAmountRaw(null); setAmountUi(null); setDecimals(null); return; }
    setIsLoading(true); setError(null);
    try {
      const ata = await ataPromise;
      const { value } = await connection.getTokenAccountBalance(ata, "confirmed");
      // Force UI to use 12-decimal display for SLQD
      setAmountRaw(value.amount);
      setDecimals(12);
      const ui = Number(value.amount) / 1_000_000_000_000; // 1e12
      setAmountUi(isFinite(ui) ? ui.toString() : "0");
    } catch (e: any) {
      setError(e?.message ?? "Failed to fetch token balance");
      setAmountRaw(null); setAmountUi(null); setDecimals(null);
    } finally { setIsLoading(false); }
  }, [connection, ataPromise]);

  useEffect(() => { if (mint && owner) fetchBalance(); }, [mint, owner, fetchBalance]);

  return { amountRaw, decimals, amountUi, isLoading, error, refetch: fetchBalance };
}

export default useBalanceToken;
