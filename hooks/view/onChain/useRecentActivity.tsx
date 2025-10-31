import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Connection } from "@solana/web3.js";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useRef, useEffect, useState } from "react";
import { AnchorProvider, Program, EventParser } from "@coral-xyz/anchor";
import idl from "@/idl/spoutsolana.json";

export const PROGRAM_ID = new PublicKey("EkU7xRmBhVyHdwtRZ4SJ9D3Nz6SeAvymft7nz3CL2XXB");

type ActivityItem = {
  id: string;
  action: "Purchased" | "Sold";
  transactionType: "BUY" | "SELL";
  ticker: string;
  amount: string;
  value: string;
  time: string;
  timestamp: number;
};

export interface TransactionHistoryItem {
  type: "buy" | "sell";
  user: string;
  ticker: string;
  usdcAmount: number;
  assetAmount: number;
  price: number;
  oracleTimestamp: number;
  createdAt: number;
  signature: string;
  slot: number;
}

// Helper to delay requests
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchTransactionHistory(
  connection: Connection,
  program: Program,
  options: {
    limit?: number;
    before?: string;
    user?: PublicKey;
    ticker?: string;
  } = {}
): Promise<TransactionHistoryItem[]> {
  const { limit = 1000, before, user, ticker } = options;
  const events: TransactionHistoryItem[] = [];
  const eventParser = new EventParser(program.programId, program.coder);

  // Get signatures for recent transactions
  const signatures = await connection.getSignaturesForAddress(
    PROGRAM_ID,
    { limit, before }
  );

  // Process transactions in batches with delays to avoid rate limiting
  const BATCH_SIZE = 10;
  const DELAY_MS = 500; // Delay between batches

  for (let i = 0; i < signatures.length; i += BATCH_SIZE) {
    const batch = signatures.slice(i, i + BATCH_SIZE);

    // Process batch in parallel
    const batchPromises = batch.map(async (sigInfo) => {
      let retries = 3;
      while (retries > 0) {
        try {
          const tx = await connection.getTransaction(sigInfo.signature, {
            commitment: "confirmed",
            maxSupportedTransactionVersion: 0,
          });

          if (!tx || !tx.meta || tx.meta.err) {
            return null;
          }

          // Parse events from transaction logs
          const parsedEvents = Array.from(
            eventParser.parseLogs(tx.meta.logMessages || [])
          );

          for (const event of parsedEvents) {
            if (
              event.name === "BuyOrderCreated" ||
              event.name === "buyOrderCreated"
            ) {
              const data = event.data as any;

              // Filter by user if specified
              if (user && !data.user.equals(user)) {
                continue;
              }

              // Filter by ticker if specified
              if (ticker && data.ticker !== ticker) {
                continue;
              }

              return {
                type: "buy" as const,
                user: data.user.toString(),
                ticker: data.ticker,
                usdcAmount: data.usdcAmount.toNumber(),
                assetAmount: data.assetAmount.toNumber(),
                price: data.price.toNumber(),
                oracleTimestamp: data.oracleTimestamp.toNumber(),
                createdAt:
                  data.createdAt?.toNumber() ||
                  data.oracleTimestamp?.toNumber() ||
                  Date.now() / 1000,
                signature: sigInfo.signature,
                slot: tx.slot,
              };
            } else if (
              event.name === "SellOrderCreated" ||
              event.name === "sellOrderCreated"
            ) {
              const data = event.data as any;

              // Filter by user if specified
              if (user && !data.user.equals(user)) {
                continue;
              }

              // Filter by ticker if specified
              if (ticker && data.ticker !== ticker) {
                continue;
              }

              return {
                type: "sell" as const,
                user: data.user.toString(),
                ticker: data.ticker,
                usdcAmount: data.usdcAmount.toNumber(),
                assetAmount: data.assetAmount.toNumber(),
                price: data.price.toNumber(),
                oracleTimestamp: data.oracleTimestamp.toNumber(),
                createdAt:
                  data.createdAt?.toNumber() ||
                  data.oracleTimestamp?.toNumber() ||
                  Date.now() / 1000,
                signature: sigInfo.signature,
                slot: tx.slot,
              };
            }
          }
          return null;
        } catch (err: any) {
          retries--;
          if (retries === 0) {
            console.error(
              `Error processing transaction ${sigInfo.signature}:`,
              err?.message || err
            );
            return null;
          }
          // Wait before retrying
          await sleep(1000 * (4 - retries));
        }
      }
      return null;
    });

    const batchResults = await Promise.all(batchPromises);
    const validEvents = batchResults.filter(
      (e): e is TransactionHistoryItem => e !== null
    );
    events.push(...validEvents);

    // Delay between batches to avoid rate limiting
    if (i + BATCH_SIZE < signatures.length) {
      await sleep(DELAY_MS);
    }
  }

  // Sort by created_at timestamp (newest first)
  events.sort((a, b) => b.createdAt - a.createdAt);

  return events;
}

/**
 * Listen for new order events in real-time
 *
 * @param connection - Solana RPC connection
 * @param program - Anchor program instance
 * @param callback - Callback function to handle new events
 * @returns Function to stop listening
 */
export function listenForOrderEvents(
  connection: Connection,
  program: Program,
  callback: (event: TransactionHistoryItem) => void
): () => void {
  const eventParser = new EventParser(program.programId, program.coder);

  const listenerId = connection.onProgramAccountChange(
    PROGRAM_ID,
    async (accountInfo) => {
      // Parse events from account data if needed
      // For events, we typically parse from transaction logs
    },
    "confirmed"
  );

  // Alternative: Listen to transaction logs directly
  // This is more efficient for events
  const logsListenerId = connection.onLogs(
    PROGRAM_ID,
    async (logs, context) => {
      if (logs.err) return;

      try {
        const parsedEvents = Array.from(eventParser.parseLogs(logs.logs));

        for (const event of parsedEvents) {
          if (
            event.name === "BuyOrderCreated" ||
            event.name === "buyOrderCreated" ||
            event.name === "SellOrderCreated" ||
            event.name === "sellOrderCreated"
          ) {
            const data = event.data as any;
            const isBuy =
              event.name === "BuyOrderCreated" ||
              event.name === "buyOrderCreated";

            const item: TransactionHistoryItem = {
              type: isBuy ? "buy" : "sell",
              user: data.user.toString(),
              ticker: data.ticker,
              usdcAmount: data.usdcAmount.toNumber(),
              assetAmount: data.assetAmount.toNumber(),
              price: data.price.toNumber(),
              oracleTimestamp: data.oracleTimestamp.toNumber(),
              createdAt:
                data.createdAt?.toNumber() ||
                data.oracleTimestamp?.toNumber() ||
                Date.now() / 1000,
              signature: logs.signature || "",
              slot: context.slot,
            };

            callback(item);
          }
        }
      } catch (err) {
        console.error("Error parsing event:", err);
      }
    },
    "confirmed"
  );

  return () => {
    connection.removeOnLogsListener(logsListenerId);
    connection.removeProgramAccountChangeListener(listenerId);
  };
}

export function useRecentActivity(userAddress: string | null) {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const queryClient = useQueryClient();
  const hasFetchedRef = useRef<Set<string>>(new Set());
  const [isFetchingOnce, setIsFetchingOnce] = useState(false);

  const shouldFetch = useMemo(() => {
    return !!(connection && (userAddress || publicKey));
  }, [connection, userAddress, publicKey]);

  const userPk = useMemo(() => {
    if (userAddress) {
      try {
        return new PublicKey(userAddress);
      } catch {
        return null;
      }
    }
    return publicKey || null;
  }, [userAddress, publicKey]);

  const userKey = useMemo(() => {
    return userAddress || publicKey?.toBase58() || null;
  }, [userAddress, publicKey]);

  // Fetching disabled - no longer fetching transaction history
  // useEffect(() => {
  //   if (!connection || !shouldFetch || !userKey || !userPk || hasFetchedRef.current.has(userKey) || isFetchingOnce) {
  //     return;
  //   }

  //   setIsFetchingOnce(true);
  //   hasFetchedRef.current.add(userKey);

  //   (async () => {
  //     try {
  //       // Create a dummy wallet for Anchor provider (we only need it for reading)
  //       const dummyWallet = {
  //         publicKey: publicKey || PublicKey.default,
  //         signTransaction: async (tx: any) => tx,
  //         signAllTransactions: async (txs: any[]) => txs,
  //       };

  //       const provider = new AnchorProvider(
  //         connection,
  //         dummyWallet as any,
  //         { commitment: "confirmed" }
  //       );

  //       const program = new Program(idl as any, provider);

  //       // Fetch transaction history from events
  //       const history = await fetchTransactionHistory(connection, program, {
  //         limit: 1000,
  //         user: userPk || undefined,
  //       });

  //       // Convert to activity items
  //       const activities: ActivityItem[] = history.map((item) => {
  //         // Format amounts (assuming 6 decimals for USDC, 9 for assets)
  //         const usdcAmount = item.usdcAmount / 1e6;
  //         const assetAmount = item.assetAmount / 1e9;

  //         // Format time
  //         const timestamp = item.createdAt * 1000; // Convert to milliseconds
  //         const now = Date.now();
  //         const diffMs = now - timestamp;
  //         const diffMins = Math.floor(diffMs / 60000);
  //         const diffHours = Math.floor(diffMs / 3600000);
  //         const diffDays = Math.floor(diffMs / 86400000);

  //         let timeStr = "Just now";
  //         if (diffDays > 0) {
  //           timeStr = `${diffDays}d`;
  //         } else if (diffHours > 0) {
  //           timeStr = `${diffHours}h`;
  //         } else if (diffMins > 0) {
  //           timeStr = `${diffMins}m`;
  //         }

  //         return {
  //           id: `${item.signature}-${item.type}`,
  //           action: item.type === "buy" ? "Purchased" : "Sold",
  //           transactionType: item.type === "buy" ? "BUY" : "SELL",
  //           ticker: item.ticker || "LQD",
  //           amount: assetAmount.toFixed(3),
  //           value: `$${usdcAmount.toFixed(2)}`,
  //           time: timeStr,
  //           timestamp,
  //         };
  //       });

  //       // Set the data directly in React Query cache
  //       queryClient.setQueryData<ActivityItem[]>(["recentActivity", userKey], activities);
  //       setIsFetchingOnce(false);
  //     } catch (err) {
  //       console.error("Error fetching transaction history:", err);
  //       queryClient.setQueryData<ActivityItem[]>(["recentActivity", userKey], []);
  //       setIsFetchingOnce(false);
  //     }
  //   })();
  // }, [connection, shouldFetch, userKey, userPk, publicKey, queryClient]);

  // Use React Query ONLY to read cached data - NEVER to fetch
  // Since fetching is disabled, always return empty array
  const { data, isLoading, error } = useQuery<ActivityItem[]>({
    queryKey: ["recentActivity", userKey],
    queryFn: () => {
      // Always return empty array - no fetching
      return [];
    },
    enabled: false, // Disabled - no fetching
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    refetchInterval: false,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
    networkMode: "offlineFirst",
    initialData: [],
  });

  return {
    activities: [], // Always return empty - no fetching
    isLoading: false, // Not loading since we're not fetching
    error: null,
    hasMore: false,
    loadMore: () => {}, // Can be implemented for pagination later
  };
}

