"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clientCacheHelpers } from "@/lib/cache/client-cache";

// Popular stocks with company names - prices will be fetched from API
const popularStocks = [
  {
    ticker: "AAPL",
    name: "Apple Inc.",
    price: 0, // Will be updated from API
    change: 0,
    changePercent: 0,
    volume: "0",
    marketCap: "0",
  },
  {
    ticker: "TSLA",
    name: "Tesla, Inc.",
    price: 0,
    change: 0,
    changePercent: 0,
    volume: "0",
    marketCap: "0",
  },
  {
    ticker: "MSFT",
    name: "Microsoft Corporation",
    price: 0,
    change: 0,
    changePercent: 0,
    volume: "0",
    marketCap: "0",
  },
  {
    ticker: "GOOGL",
    name: "Alphabet Inc.",
    price: 0,
    change: 0,
    changePercent: 0,
    volume: "0",
    marketCap: "0",
  },
  {
    ticker: "AMZN",
    name: "Amazon.com, Inc.",
    price: 0,
    change: 0,
    changePercent: 0,
    volume: "0",
    marketCap: "0",
  },
  {
    ticker: "NVDA",
    name: "NVIDIA Corporation",
    price: 0,
    change: 0,
    changePercent: 0,
    volume: "0",
    marketCap: "0",
  },
  {
    ticker: "META",
    name: "Meta Platforms, Inc.",
    price: 0,
    change: 0,
    changePercent: 0,
    volume: "0",
    marketCap: "0",
  },
  {
    ticker: "IBM",
    name: "IBM Corporation",
    price: 0,
    change: 0,
    changePercent: 0,
    volume: "0",
    marketCap: "0",
  },
];

interface StockData {
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: string;
  marketCap: string;
  dataSource?: string;
}

function MarketsPage() {
  const [stocks, setStocks] = useState<StockData[]>(popularStocks);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const formatMarketCap = (value: number) => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    return `$${value.toLocaleString()}`;
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1e9) return `${(volume / 1e9).toFixed(1)}B`;
    if (volume >= 1e6) return `${(volume / 1e6).toFixed(1)}M`;
    if (volume >= 1e3) return `${(volume / 1e3).toFixed(1)}K`;
    return volume.toString();
  };

  const fetchStockData = async (ticker: string) => {
    try {
      const data = await clientCacheHelpers.fetchStockData(ticker);
      return {
        ticker: data.ticker,
        name: popularStocks.find((s) => s.ticker === ticker)?.name || ticker,
        price: data.currentPrice,
        change: data.priceChange,
        changePercent: data.priceChangePercent,
        volume: formatVolume(data.volume),
        marketCap: formatMarketCap(data.marketCap),
        dataSource: data.dataSource,
      };
    } catch (error) {
      console.error(`Error fetching ${ticker}:`, error);
    }
    return null;
  };

  const fetchAllStocks = useCallback(async () => {
    setRefreshing(true);
    try {
      const promises = popularStocks.map((stock) =>
        fetchStockData(stock.ticker),
      );
      const results = await Promise.all(promises);

      const validStocks = results.filter(
        (stock) => stock !== null,
      ) as StockData[];
      setStocks(validStocks);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching stocks:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchAllStocks();
  }, [fetchAllStocks]);

  return (
    <div className="px-6 py-10 md:p-8 lg:p-12 xl:p-16 max-w-7xl mx-auto w-full">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Markets</h1>
          <p className="text-lg text-gray-600">
            Track real-time stock prices and market data
          </p>
          {lastUpdated && (
            <p className="text-sm text-gray-500 mt-1">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
        <Button
          onClick={fetchAllStocks}
          variant="outline"
          size="sm"
          className={refreshing ? "opacity-50 cursor-not-allowed" : ""}
        >
          <RefreshCw
            className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
          />
          {refreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded w-12"></div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="h-8 bg-gray-200 rounded w-20"></div>
                    <div className="h-4 bg-gray-200 rounded w-12"></div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="h-8 bg-gray-200 rounded"></div>
                    <div className="h-8 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {stocks.map((stock) => (
            <Link href={`/markets/${stock.ticker}`} key={stock.ticker}>
              <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer relative">
                {stock.dataSource === "mock" && (
                  <div className="absolute top-2 right-2 z-10">
                    <Badge variant="secondary" className="text-xs">
                      DEMO
                    </Badge>
                  </div>
                )}
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl font-bold">
                        {stock.ticker}
                      </CardTitle>
                      <CardDescription className="text-sm text-gray-600">
                        {stock.name}
                      </CardDescription>
                    </div>
                    <Badge
                      variant={stock.change >= 0 ? "default" : "destructive"}
                      className="text-xs"
                    >
                      {stock.change >= 0 ? (
                        <TrendingUp className="w-3 h-3 mr-1" />
                      ) : (
                        <TrendingDown className="w-3 h-3 mr-1" />
                      )}
                      {stock.changePercent >= 0 ? "+" : ""}
                      {stock.changePercent.toFixed(2)}%
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold">
                        ${stock.price.toLocaleString()}
                      </span>
                      <span
                        className={`text-sm font-medium ${
                          stock.change >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {stock.change >= 0 ? "+" : ""}${stock.change.toFixed(2)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                      <div>
                        <span className="block">Volume</span>
                        <span className="font-medium">{stock.volume}</span>
                      </div>
                      <div>
                        <span className="block">Market Cap</span>
                        <span className="font-medium">{stock.marketCap}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Market Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">S&P 500</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4,567.89</div>
              <div className="text-green-600 text-sm">+12.34 (+0.27%)</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">NASDAQ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">14,234.56</div>
              <div className="text-red-600 text-sm">-45.67 (-0.32%)</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Dow Jones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">34,789.12</div>
              <div className="text-green-600 text-sm">+89.23 (+0.26%)</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function MarketsPageWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MarketsPage />
    </Suspense>
  );
}
