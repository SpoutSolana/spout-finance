import { useCallback, useMemo, useState, useEffect } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress } from "@solana/spl-token";

export type UseTokenBalanceResult = {
  amountRaw: string | null;
  decimals: number | null;
  amountUi: string | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export function useBalanceUSDC(mint: PublicKey | null, owner: PublicKey | null): UseTokenBalanceResult {
  const { connection } = useConnection();
  const [amountRaw, setAmountRaw] = useState<string | null>(null);
  const [decimals, setDecimals] = useState<number | null>(null);
  const [amountUi, setAmountUi] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ataPromise = useMemo(() => {
    if (!mint || !owner) return null;
    return getAssociatedTokenAddress(mint, owner);
  }, [mint, owner]);

  const fetchBalance = useCallback(async () => {
    if (!ataPromise) { setAmountRaw(null); setAmountUi(null); setDecimals(null); return; }
    setIsLoading(true); setError(null);
    try {
      const ata = await ataPromise;
      const { value } = await connection.getTokenAccountBalance(ata, "confirmed");
      setAmountRaw(value.amount);
      setDecimals(value.decimals);
      setAmountUi(value.uiAmountString ?? null);
    } catch (e: any) {
      setError(e?.message ?? "Failed to fetch token balance");
      setAmountRaw(null); setAmountUi(null); setDecimals(null);
    } finally {
      setIsLoading(false);
    }
  }, [connection, ataPromise]);

  useEffect(() => { if (mint && owner) fetchBalance(); }, [mint, owner, fetchBalance]);

  return { amountRaw, decimals, amountUi, isLoading, error, refetch: fetchBalance };
}

export default useBalanceUSDC;
