"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Fetches the latest price from Chainlink Data Streams V11 via our API route.
 * Polls every 30 seconds for fresh prices.
 */

interface ChainlinkPriceData {
  /** Mid price as a human-readable number (e.g. 650.30) */
  price: number;
  /** Raw mid price string (18 decimals) */
  rawMidPrice: string;
  /** Market status: 1=closed, 2=open, 3=unknown */
  marketStatus: number;
}

// Map token symbols to their Chainlink Data Streams V11 feed IDs
const FEED_IDS: Record<string, string> = {
  SPY: "000b220be6fe94b85d6d8e8d5d4d212f5b86a644cbcc1dbf28b9e77b6810a5ec",
};

export function useChainlinkPrice(symbol: string) {
  const [data, setData] = useState<ChainlinkPriceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPrice = useCallback(async () => {
    const feedId = FEED_IDS[symbol];
    if (!feedId) {
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/chainlink/report?feedId=${feedId}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(body.error || `HTTP ${res.status}`);
      }

      const json = await res.json();
      const price = Number(BigInt(json.midPrice)) / 1e18;

      setData({
        price,
        rawMidPrice: json.midPrice,
        marketStatus: json.marketStatus,
      });
      setError(null);
    } catch (err) {
      console.error("Chainlink price fetch failed:", err);
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setIsLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    setIsLoading(true);
    fetchPrice();

    // Refresh every 30 seconds
    const interval = setInterval(fetchPrice, 30_000);
    return () => clearInterval(interval);
  }, [fetchPrice]);

  return {
    price: data?.price ?? null,
    marketStatus: data?.marketStatus ?? null,
    isLoading,
    error,
    refetch: fetchPrice,
  };
}
