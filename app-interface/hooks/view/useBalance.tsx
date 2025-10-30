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

// Generic balance hook (classic defaults)
export function useTokenBalance(mint: PublicKey | null, owner: PublicKey | null): UseTokenBalanceResult {
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
    if (!ataPromise) {
      setAmountRaw(null); setAmountUi(null); setDecimals(null);
      return;
    }
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

  useEffect(() => {
    if (mint && owner) fetchBalance();
  }, [mint, owner, fetchBalance]);

  return { amountRaw, decimals, amountUi, isLoading, error, refetch: fetchBalance };
}

// Convenience: Classic SPL Token (USDC) balance
export function useUsdcBalance(mint: PublicKey | null, owner: PublicKey | null): UseTokenBalanceResult {
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
    } finally { setIsLoading(false); }
  }, [connection, ataPromise]);

  useEffect(() => { if (mint && owner) fetchBalance(); }, [mint, owner, fetchBalance]);
  return { amountRaw, decimals, amountUi, isLoading, error, refetch: fetchBalance };
}

// Convenience: Token-2022 (SLQD) balance
export function useSlqdBalance(mint: PublicKey | null, owner: PublicKey | null, ownerIsPda = false): UseTokenBalanceResult {
  const { connection } = useConnection();
  const [amountRaw, setAmountRaw] = useState<string | null>(null);
  const [decimals, setDecimals] = useState<number | null>(null);
  const [amountUi, setAmountUi] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ataPromise = useMemo(() => {
    if (!mint || !owner) return null;
    // Token-2022: pass program ids explicitly; allow owner off curve if PDA
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
      setAmountRaw(value.amount);
      setDecimals(value.decimals);
      setAmountUi(value.uiAmountString ?? null);
    } catch (e: any) {
      setError(e?.message ?? "Failed to fetch token balance");
      setAmountRaw(null); setAmountUi(null); setDecimals(null);
    } finally { setIsLoading(false); }
  }, [connection, ataPromise]);

  useEffect(() => { if (mint && owner) fetchBalance(); }, [mint, owner, fetchBalance]);
  return { amountRaw, decimals, amountUi, isLoading, error, refetch: fetchBalance };
}