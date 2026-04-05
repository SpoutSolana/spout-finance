"use client";

import { useState, useEffect, useCallback } from "react";

export interface AlpacaPosition {
  symbol: string;
  qty: string;
  qty_available: string;
  avg_entry_price: string;
  market_value: string;
  current_price: string;
  unrealized_pl: string;
  unrealized_plpc: string;
  side: string;
}

export function useAlpacaPositions(symbol?: string, pollInterval = 30_000) {
  const [positions, setPositions] = useState<AlpacaPosition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPositions = useCallback(async () => {
    try {
      const params = symbol ? `?symbol=${symbol}` : "";
      const res = await fetch(`/api/alpaca/positions${params}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      setPositions(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch Alpaca positions:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    fetchPositions();
    const interval = setInterval(fetchPositions, pollInterval);
    return () => clearInterval(interval);
  }, [fetchPositions, pollInterval]);

  // Helper: get qty for a specific symbol
  const getQty = (sym: string): number => {
    const pos = positions.find((p) => p.symbol === sym.toUpperCase());
    return pos ? parseFloat(pos.qty) : 0;
  };

  const getMarketValue = (sym: string): number => {
    const pos = positions.find((p) => p.symbol === sym.toUpperCase());
    return pos ? parseFloat(pos.market_value) : 0;
  };

  return {
    positions,
    isLoading,
    error,
    refetch: fetchPositions,
    getQty,
    getMarketValue,
  };
}
