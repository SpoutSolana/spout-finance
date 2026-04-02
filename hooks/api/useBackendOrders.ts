"use client";

import { useState, useEffect, useCallback } from "react";

const BACKEND_BASE = "https://spout-backend-solana-mge4.onrender.com";

// --- Types ---

export interface BackendOrder {
  order_id: string;
  [key: string]: any; // other fields from backend response
}

interface BackendOrdersResponse {
  orders: BackendOrder[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// --- Fetch user orders from backend ---

export async function fetchUserOrders(
  userPubkey: string,
  page = 1,
  limit = 10
): Promise<BackendOrdersResponse> {
  const res = await fetch(
    `${BACKEND_BASE}/orders/${userPubkey}?page=${page}&limit=${limit}`
  );
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(body.error || `Failed to fetch orders (${res.status})`);
  }
  return res.json();
}

// --- Cancel order via backend Alpaca route ---

export async function cancelBackendOrder(orderId: string): Promise<void> {
  const res = await fetch(`${BACKEND_BASE}/alpaca/orders/${orderId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(body.error || `Failed to cancel order (${res.status})`);
  }
}

// --- Hook: poll user orders ---

export function useBackendOrders(
  userPubkey: string | null,
  options?: { pollInterval?: number; limit?: number }
) {
  const pollInterval = options?.pollInterval ?? 15_000;
  const limit = options?.limit ?? 10;

  const [orders, setOrders] = useState<BackendOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!userPubkey) {
      setOrders([]);
      setIsLoading(false);
      return;
    }

    try {
      const data = await fetchUserOrders(userPubkey, 1, limit);
      setOrders(data.orders);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch backend orders:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [userPubkey, limit]);

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
