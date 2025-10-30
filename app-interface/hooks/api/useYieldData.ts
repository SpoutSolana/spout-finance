"use client";

import { useState, useEffect } from "react";
import { clientCacheHelpers } from "@/lib/cache/client-cache";

interface YieldData {
  symbol: string;
  yield: number;
  timestamp: string;
  note?: string;
}

export function useYieldData(symbol: string) {
  const [data, setData] = useState<YieldData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchYieldData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const yieldData = await clientCacheHelpers.fetchYieldData(symbol);
        setData(yieldData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchYieldData();
  }, [symbol]);

  return { data, isLoading, error };
}
