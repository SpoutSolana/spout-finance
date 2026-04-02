"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Connection } from "@solana/web3.js";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import bs58 from "bs58";
import { SPOUT_ORDERS_PROGRAM_ID } from "@/lib/solana/spoutOrders";

// PendingOrder account discriminator from IDL
const PENDING_ORDER_DISCRIMINATOR = Buffer.from([37, 33, 135, 93, 153, 120, 206, 95]);

export interface PendingOrderAccount {
  pubkey: string;
  user: string;
  orderType: number; // 0 = buy, 1 = sell
  tokenMint: string;
  usdcAmount: bigint;
  assetAmount: bigint;
  price: bigint;
  limitPrice: bigint;
  createdAt: number;
  orderId: bigint;
  bump: number;
}

/**
 * PendingOrder account layout (after 8-byte discriminator):
 *   user:         32 bytes (Pubkey)
 *   order_type:    1 byte  (u8)
 *   token_mint:   32 bytes (Pubkey)
 *   usdc_amount:   8 bytes (u64 LE)
 *   asset_amount:  8 bytes (u64 LE)
 *   price:        16 bytes (u128 LE)
 *   limit_price:  16 bytes (u128 LE)
 *   created_at:    8 bytes (i64 LE)
 *   order_id:      8 bytes (u64 LE)
 *   bump:          1 byte  (u8)
 */
function parsePendingOrder(pubkey: PublicKey, data: Buffer): PendingOrderAccount {
  let offset = 8; // skip discriminator

  const user = new PublicKey(data.subarray(offset, offset + 32)).toBase58();
  offset += 32;

  const orderType = data.readUInt8(offset);
  offset += 1;

  const tokenMint = new PublicKey(data.subarray(offset, offset + 32)).toBase58();
  offset += 32;

  const usdcAmount = data.readBigUInt64LE(offset);
  offset += 8;

  const assetAmount = data.readBigUInt64LE(offset);
  offset += 8;

  // u128 LE
  let price = BigInt(0);
  for (let i = 15; i >= 0; i--) {
    price = (price << BigInt(8)) | BigInt(data[offset + i]);
  }
  offset += 16;

  let limitPrice = BigInt(0);
  for (let i = 15; i >= 0; i--) {
    limitPrice = (limitPrice << BigInt(8)) | BigInt(data[offset + i]);
  }
  offset += 16;

  const createdAt = Number(data.readBigInt64LE(offset));
  offset += 8;

  const orderId = data.readBigUInt64LE(offset);
  offset += 8;

  const bump = data.readUInt8(offset);

  return {
    pubkey: pubkey.toBase58(),
    user,
    orderType,
    tokenMint,
    usdcAmount,
    assetAmount,
    price,
    limitPrice,
    createdAt,
    orderId,
    bump,
  };
}

/** Fetch all PendingOrder accounts for a given user */
export async function fetchPendingOrders(
  connection: Connection,
  user: PublicKey
): Promise<PendingOrderAccount[]> {
  // Filter by discriminator (first 8 bytes) and user pubkey (bytes 8-40)
  const accounts = await connection.getProgramAccounts(SPOUT_ORDERS_PROGRAM_ID, {
    filters: [
      { memcmp: { offset: 0, bytes: bs58.encode(PENDING_ORDER_DISCRIMINATOR) } },
      { memcmp: { offset: 8, bytes: user.toBase58() } },
    ],
  });

  return accounts
    .map((a) => parsePendingOrder(a.pubkey, a.account.data as Buffer))
    .sort((a, b) => b.createdAt - a.createdAt); // newest first
}

/** React hook: fetch pending on-chain orders for the connected wallet */
export function usePendingOrders(options?: { pollInterval?: number }) {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const pollInterval = options?.pollInterval ?? 15_000;

  const userKey = useMemo(
    () => (publicKey ? publicKey.toBase58() : null),
    [publicKey]
  );

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["pendingOrders", userKey],
    queryFn: async () => {
      if (!publicKey) return [];
      return fetchPendingOrders(connection, publicKey);
    },
    enabled: !!publicKey,
    refetchInterval: pollInterval,
    staleTime: 10_000,
    refetchOnWindowFocus: false,
  });

  return {
    orders: data ?? [],
    isLoading,
    error: error ? (error as Error).message : null,
    refetch,
  };
}
