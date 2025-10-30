"use client";

import { useState, useEffect } from "react";
import { clientCacheHelpers } from "@/lib/cache/client-cache";

// This matches what our API returns
interface MarketDataResponse {
  symbol: string;
  price: number; // Ask price from Alpaca (no mid price calculation)
  askPrice: number; // Original ask price from Alpaca
  bidPrice: number; // Original bid price from Alpaca
  timestamp: string;
  previousClose: number; // Previous day's closing price
  yield: number; // Current yield percentage
}

interface MarketDataError {
  error: string;
}

export function useMarketData(symbol: string) {
  const [data, setData] = useState<MarketDataResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      if (!symbol) return;

      try {
        setIsLoading(true);
        const marketData = await clientCacheHelpers.fetchMarketData(symbol);

        if (mounted) {
          setData(marketData);
          setError(null);
        }
      } catch (err) {
        console.error("Error fetching market data:", err);
        if (mounted) {
          setError(err instanceof Error ? err : new Error("Unknown error"));
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    fetchData();
    // Refresh every 10 minutes to reduce Vercel compute usage
    const interval = setInterval(fetchData, 10 * 60 * 1000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [symbol]); // Keep symbol dependency but ensure fetchData is stable

  // Calculate daily change percentage
  const dailyChangePercent =
    data?.price && data?.previousClose
      ? ((data.price - data.previousClose) / data.previousClose) * 100
      : 0;

  return {
    data,
    isLoading,
    error,
    // These values come from our API's transformed response
    price: data?.price ?? null, // Ask price from Alpaca
    askPrice: data?.askPrice ?? null, // Original ask price
    bidPrice: data?.bidPrice ?? null, // Original bid price
    timestamp: data?.timestamp ?? null,
    previousClose: data?.previousClose ?? null,
    yield: data?.yield ?? null,
    dailyChangePercent,
  };
}
