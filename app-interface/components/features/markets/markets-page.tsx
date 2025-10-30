"use client";

import { MarketHeader, MarketStats, MarketSearch, StockGrid } from "./";
import { useMarketStocks } from "@/hooks/api/useMarketStocks";

export function MarketsPage() {
  const {
    stocks,
    loading,
    refreshing,
    lastUpdated,
    searchTerm,
    setSearchTerm,
    refresh,
  } = useMarketStocks();

  return (
    <div className="space-y-8">
      <MarketHeader lastUpdated={lastUpdated} />
      <MarketStats />
      <MarketSearch
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onRefresh={refresh}
        refreshing={refreshing}
      />
      <StockGrid stocks={stocks} loading={loading} />
    </div>
  );
}
