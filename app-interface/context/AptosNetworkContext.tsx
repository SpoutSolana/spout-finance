"use client";

import { createContext, useContext, useMemo, useState, ReactNode } from "react";

type AptosNetwork = "testnet" | "mainnet";

type AptosNetworkContextValue = {
  network: AptosNetwork;
  setNetwork: (n: AptosNetwork) => void;
  nodeUrl: string;
};

const DEFAULTS: Record<AptosNetwork, string> = {
  testnet: "https://fullnode.testnet.aptoslabs.com/v1",
  mainnet: "https://fullnode.mainnet.aptoslabs.com/v1",
};

const AptosNetworkContext = createContext<AptosNetworkContextValue | undefined>(undefined);

export function AptosNetworkProvider({ children }: { children: ReactNode }) {
  const [network, setNetwork] = useState<AptosNetwork>("testnet");

  const value = useMemo<AptosNetworkContextValue>(() => {
    const nodeUrl = DEFAULTS[network];
    return { network, setNetwork, nodeUrl };
  }, [network]);

  return <AptosNetworkContext.Provider value={value}>{children}</AptosNetworkContext.Provider>;
}

export function useAptosNetwork() {
  const ctx = useContext(AptosNetworkContext);
  if (!ctx) throw new Error("useAptosNetwork must be used within AptosNetworkProvider");
  return ctx;
}


