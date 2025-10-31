import { useMemo } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { useQuery } from "@tanstack/react-query";

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

  const ataPromise = useMemo(() => {
    if (!mint || !owner) return null;
    return getAssociatedTokenAddress(mint, owner);
  }, [mint, owner]);

  const mintKey = useMemo(() => mint?.toBase58() || null, [mint]);
  const ownerKey = useMemo(() => owner?.toBase58() || null, [owner]);

  const shouldFetch = useMemo(() => {
    return !!(mint && owner && ataPromise);
  }, [mint, owner, ataPromise]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["balanceUSDC", mintKey, ownerKey],
    queryFn: async () => {
      if (!ataPromise || !connection) {
        return { amountRaw: null, decimals: null, amountUi: null };
      }
      
      try {
        const ata = await ataPromise;
        const { value } = await connection.getTokenAccountBalance(ata, "confirmed");
        return {
          amountRaw: value.amount,
          decimals: value.decimals,
          amountUi: value.uiAmountString ?? null,
        };
      } catch (e: any) {
        throw new Error(e?.message ?? "Failed to fetch token balance");
      }
    },
    enabled: shouldFetch,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    refetchInterval: false,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
  });

  return {
    amountRaw: data?.amountRaw ?? null,
    decimals: data?.decimals ?? null,
    amountUi: data?.amountUi ?? null,
    isLoading,
    error: error ? (error as Error).message : null,
    refetch: async () => {
      await refetch();
    },
  };
}

export default useBalanceUSDC;
