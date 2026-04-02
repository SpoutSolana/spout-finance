"use client";

import { useState, useEffect, useCallback } from "react";

// --- Types matching Alpaca order response ---

export interface AlpacaOrder {
  id: string;
  client_order_id: string;
  status: string;
  symbol: string;
  qty: string | null;
  notional: string | null;
  filled_qty: string;
  filled_avg_price: string | null;
  side: "buy" | "sell";
  type: "market" | "limit" | "stop" | "stop_limit" | "trailing_stop";
  time_in_force: string;
  limit_price: string | null;
  stop_price: string | null;
  created_at: string;
  updated_at: string;
  submitted_at: string;
  filled_at: string | null;
  canceled_at: string | null;
}

// --- Place an order on Alpaca ---

export interface PlaceAlpacaOrderArgs {
  symbol: string;
  side: "buy" | "sell";
  type: "market" | "limit";
  time_in_force: "day" | "gtc" | "ioc" | "fok";
  qty?: number;
  notional?: number;
  limit_price?: number;
  client_order_id?: string;
}

export async function placeAlpacaOrder(
  args: PlaceAlpacaOrderArgs
): Promise<AlpacaOrder> {
  const res = await fetch("/api/alpaca/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Failed to place Alpaca order (${res.status})`);
  }

  return data;
}

// --- Cancel an order on Alpaca ---

export async function cancelAlpacaOrder(orderId: string): Promise<void> {
  const res = await fetch(`/api/alpaca/cancel?orderId=${orderId}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(data.error || `Failed to cancel order (${res.status})`);
  }
}

// --- Hook: fetch open Alpaca orders + poll ---

export function useAlpacaOrders(options?: {
  symbols?: string;
  pollInterval?: number;
}) {
  const symbols = options?.symbols ?? "";
  const pollInterval = options?.pollInterval ?? 15_000;

  const [orders, setOrders] = useState<AlpacaOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const params = new URLSearchParams({ status: "open" });
      if (symbols) params.set("symbols", symbols);

      const res = await fetch(`/api/alpaca/orders?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      setOrders(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch Alpaca orders:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [symbols]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, pollInterval);
    return () => clearInterval(interval);
  }, [fetchOrders, pollInterval]);

  return {
    orders,
    isLoading,
    error,
    refetch: fetchOrders,
  };
}
