import { useMemo } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress, ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { useQuery } from "@tanstack/react-query";

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

  const mintKey = useMemo(() => mint?.toBase58() || null, [mint]);
  const ownerKey = useMemo(() => owner?.toBase58() || null, [owner]);

  const shouldFetch = useMemo(() => {
    return !!(mint && owner && ataPromise);
  }, [mint, owner, ataPromise]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["balanceToken", mintKey, ownerKey, ownerIsPda],
    queryFn: async () => {
      if (!ataPromise || !connection) {
        return { amountRaw: null, decimals: null, amountUi: null };
      }
      
      try {
        const ata = await ataPromise;
        const { value } = await connection.getTokenAccountBalance(ata, "confirmed");
        // Force UI to use 12-decimal display for SLQD
        const ui = Number(value.amount) / 1_000_000_000_000; // 1e12
        return {
          amountRaw: value.amount,
          decimals: 12,
          amountUi: isFinite(ui) ? ui.toString() : "0",
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

export default useBalanceToken;
