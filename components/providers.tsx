"use client";

import { ReactNode, useMemo } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/context/AuthContext";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import { clusterApiUrl, type Cluster } from "@solana/web3.js";
import { WalletAdapterNetwork, WalletError } from "@solana/wallet-adapter-base";
import "@solana/wallet-adapter-react-ui/styles.css";
import { useCallback } from "react";

const queryClient = new QueryClient();
const network = WalletAdapterNetwork.Devnet;

const Providers = ({ children }: { children: ReactNode }) => {
  const endpoint = useMemo(() => {
    const url = clusterApiUrl(network);
    console.log("[providers] Solana RPC endpoint:", url);
    return url;
  }, []);
  const wallets = useMemo(
    () => [new SolflareWalletAdapter({ network })],
    []
  );

  const onError = useCallback((error: WalletError) => {
    console.error("[providers] WalletProvider onError:", error.name, error.message, error);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ConnectionProvider endpoint={endpoint}>
          <WalletProvider wallets={wallets} autoConnect onError={onError}>
            <WalletModalProvider>{children}</WalletModalProvider>
          </WalletProvider>
        </ConnectionProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export { Providers };
