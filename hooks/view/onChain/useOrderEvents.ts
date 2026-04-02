"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Connection } from "@solana/web3.js";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useEffect, useCallback, useRef } from "react";
import { AnchorProvider, Program, EventParser } from "@coral-xyz/anchor";
import idl from "@/idl/spoutorders.json";
import { SPOUT_ORDERS_PROGRAM_ID } from "@/lib/solana/spoutOrders";

// --- Event types matching the IDL ---

export type OrderEvent =
  | BuyOrderCreatedEvent
  | SellOrderCreatedEvent
  | BuyOrderFulfilledEvent
  | SellOrderFulfilledEvent
  | OrderCancelledEvent;

export interface BuyOrderCreatedEvent {
  type: "BuyOrderCreated";
  user: string;
  ticker: string;
  tokenMint: string;
  usdcAmount: number; // raw u64
  assetAmount: number; // raw u64
  price: bigint; // u128
  limitPrice: bigint; // u128
  orderId: number; // u64
  createdAt: number; // i64 unix timestamp
  signature: string;
  slot: number;
}

export interface SellOrderCreatedEvent {
  type: "SellOrderCreated";
  user: string;
  ticker: string;
  tokenMint: string;
  usdcAmount: number;
  assetAmount: number;
  price: bigint;
  limitPrice: bigint;
  orderId: number;
  createdAt: number;
  signature: string;
  slot: number;
}

export interface BuyOrderFulfilledEvent {
  type: "BuyOrderFulfilled";
  user: string;
  orderId: number;
  tokenMint: string;
  usdcAmount: number;
  assetAmount: number;
  signature: string;
  slot: number;
}

export interface SellOrderFulfilledEvent {
  type: "SellOrderFulfilled";
  user: string;
  orderId: number;
  tokenMint: string;
  usdcAmount: number;
  assetAmount: number;
  signature: string;
  slot: number;
}

export interface OrderCancelledEvent {
  type: "OrderCancelled";
  user: string;
  orderId: number;
  orderType: number; // 0=buy, 1=sell
  usdcReturned: number;
  signature: string;
  slot: number;
}

// --- Helper to create a read-only Anchor Program ---

function createReadOnlyProgram(connection: Connection, publicKey: PublicKey | null): Program {
  const dummyWallet = {
    publicKey: publicKey ?? PublicKey.default,
    signTransaction: async (tx: any) => tx,
    signAllTransactions: async (txs: any[]) => txs,
  };
  const provider = new AnchorProvider(connection, dummyWallet as any, {
    commitment: "confirmed",
  });
  return new Program(idl as any, provider);
}

// --- Parse a single event from Anchor EventParser output ---

function parseEvent(
  event: { name: string; data: any },
  signature: string,
  slot: number
): OrderEvent | null {
  const d = event.data;

  switch (event.name) {
    case "BuyOrderCreated":
      return {
        type: "BuyOrderCreated",
        user: d.user.toString(),
        ticker: d.ticker,
        tokenMint: d.tokenMint.toString(),
        usdcAmount: typeof d.usdcAmount === "number" ? d.usdcAmount : d.usdcAmount.toNumber(),
        assetAmount: typeof d.assetAmount === "number" ? d.assetAmount : d.assetAmount.toNumber(),
        price: BigInt(d.price.toString()),
        limitPrice: BigInt(d.limitPrice.toString()),
        orderId: typeof d.orderId === "number" ? d.orderId : d.orderId.toNumber(),
        createdAt: typeof d.createdAt === "number" ? d.createdAt : d.createdAt.toNumber(),
        signature,
        slot,
      };

    case "SellOrderCreated":
      return {
        type: "SellOrderCreated",
        user: d.user.toString(),
        ticker: d.ticker,
        tokenMint: d.tokenMint.toString(),
        usdcAmount: typeof d.usdcAmount === "number" ? d.usdcAmount : d.usdcAmount.toNumber(),
        assetAmount: typeof d.assetAmount === "number" ? d.assetAmount : d.assetAmount.toNumber(),
        price: BigInt(d.price.toString()),
        limitPrice: BigInt(d.limitPrice.toString()),
        orderId: typeof d.orderId === "number" ? d.orderId : d.orderId.toNumber(),
        createdAt: typeof d.createdAt === "number" ? d.createdAt : d.createdAt.toNumber(),
        signature,
        slot,
      };

    case "BuyOrderFulfilled":
      return {
        type: "BuyOrderFulfilled",
        user: d.user.toString(),
        orderId: typeof d.orderId === "number" ? d.orderId : d.orderId.toNumber(),
        tokenMint: d.tokenMint.toString(),
        usdcAmount: typeof d.usdcAmount === "number" ? d.usdcAmount : d.usdcAmount.toNumber(),
        assetAmount: typeof d.assetAmount === "number" ? d.assetAmount : d.assetAmount.toNumber(),
        signature,
        slot,
      };

    case "SellOrderFulfilled":
      return {
        type: "SellOrderFulfilled",
        user: d.user.toString(),
        orderId: typeof d.orderId === "number" ? d.orderId : d.orderId.toNumber(),
        tokenMint: d.tokenMint.toString(),
        usdcAmount: typeof d.usdcAmount === "number" ? d.usdcAmount : d.usdcAmount.toNumber(),
        assetAmount: typeof d.assetAmount === "number" ? d.assetAmount : d.assetAmount.toNumber(),
        signature,
        slot,
      };

    case "OrderCancelled":
      return {
        type: "OrderCancelled",
        user: d.user.toString(),
        orderId: typeof d.orderId === "number" ? d.orderId : d.orderId.toNumber(),
        orderType: typeof d.orderType === "number" ? d.orderType : d.orderType.toNumber(),
        usdcReturned: typeof d.usdcReturned === "number" ? d.usdcReturned : d.usdcReturned.toNumber(),
        signature,
        slot,
      };

    default:
      return null;
  }
}

// --- Fetch historical events from transaction signatures ---

export async function fetchOrderEvents(
  connection: Connection,
  program: Program,
  options: { limit?: number; user?: PublicKey } = {}
): Promise<OrderEvent[]> {
  const { limit = 100, user } = options;
  const events: OrderEvent[] = [];
  const eventParser = new EventParser(program.programId, program.coder);

  const signatures = await connection.getSignaturesForAddress(
    SPOUT_ORDERS_PROGRAM_ID,
    { limit }
  );

  // Process in batches of 10
  const BATCH_SIZE = 10;
  for (let i = 0; i < signatures.length; i += BATCH_SIZE) {
    const batch = signatures.slice(i, i + BATCH_SIZE);

    const results = await Promise.all(
      batch.map(async (sigInfo) => {
        try {
          const tx = await connection.getTransaction(sigInfo.signature, {
            commitment: "confirmed",
            maxSupportedTransactionVersion: 0,
          });
          if (!tx?.meta || tx.meta.err) return [];

          const parsed = Array.from(
            eventParser.parseLogs(tx.meta.logMessages || [])
          );
          return parsed
            .map((e) => parseEvent(e, sigInfo.signature, tx.slot))
            .filter((e): e is OrderEvent => e !== null);
        } catch {
          return [];
        }
      })
    );

    for (const batch of results) {
      // Filter by user if specified
      if (user) {
        events.push(
          ...batch.filter((e) => "user" in e && e.user === user.toBase58())
        );
      } else {
        events.push(...batch);
      }
    }
  }

  return events;
}

// --- React hook: fetch historical order events ---

export function useOrderEvents(options?: { userOnly?: boolean; limit?: number }) {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const userOnly = options?.userOnly ?? true;
  const limit = options?.limit ?? 50;

  const program = useMemo(() => {
    if (!connection) return null;
    return createReadOnlyProgram(connection, publicKey);
  }, [connection, publicKey]);

  const userKey = useMemo(
    () => (userOnly && publicKey ? publicKey.toBase58() : null),
    [userOnly, publicKey]
  );

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["orderEvents", userKey, limit],
    queryFn: async () => {
      if (!program) return [];
      return fetchOrderEvents(connection, program, {
        limit,
        user: userOnly && publicKey ? publicKey : undefined,
      });
    },
    enabled: !!program,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  return {
    events: data ?? [],
    isLoading,
    error: error ? (error as Error).message : null,
    refetch,
  };
}

// --- React hook: listen for real-time order events via onLogs ---

export function useOrderEventListener(
  onEvent: (event: OrderEvent) => void
) {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const callbackRef = useRef(onEvent);
  callbackRef.current = onEvent;

  const program = useMemo(() => {
    if (!connection) return null;
    return createReadOnlyProgram(connection, publicKey);
  }, [connection, publicKey]);

  useEffect(() => {
    if (!program) return;

    const eventParser = new EventParser(program.programId, program.coder);

    const listenerId = connection.onLogs(
      SPOUT_ORDERS_PROGRAM_ID,
      (logs, context) => {
        if (logs.err) return;
        try {
          const parsed = Array.from(eventParser.parseLogs(logs.logs));
          for (const e of parsed) {
            const event = parseEvent(e, logs.signature, context.slot);
            if (event) callbackRef.current(event);
          }
        } catch (err) {
          console.error("[orderEvents] parse error:", err);
        }
      },
      "confirmed"
    );

    return () => {
      connection.removeOnLogsListener(listenerId);
    };
  }, [connection, program]);
}
