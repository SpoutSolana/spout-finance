"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { clientCacheHelpers } from "@/lib/cache/client-cache";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Clock,
  DollarSign,
} from "lucide-react";
import StockChart from "@/components/stockChart";

interface StockData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface StockInfo {
  ticker: string;
  data: StockData[];
  currentPrice: number;
  priceChange: number;
  priceChangePercent: number;
  volume: number;
  marketCap: number;
  dataSource?: string;
  lastUpdated?: string;
}

export default function TickerPage() {
  const params = useParams();
  const router = useRouter();
  const ticker = params.ticker as string;
  const [stockInfo, setStockInfo] = useState<StockInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStockData = async () => {
      try {
        setLoading(true);
        const data = await clientCacheHelpers.fetchStockData(ticker);
        setStockInfo(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (ticker) {
      fetchStockData();
    }
  }, [ticker]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">Loading {ticker} data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !stockInfo) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-red-600 text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Error Loading Data
            </h1>
            <p className="text-gray-600 mb-4">
              {error || "Unable to load stock data"}
            </p>
            <Button onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isPositive = stockInfo.priceChange >= 0;
  const formatMarketCap = (value: number) => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    return `$${value.toLocaleString()}`;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/markets">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Markets
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold text-gray-900">
              {stockInfo.ticker}
            </h1>
            {stockInfo.dataSource === "mock" && (
              <Badge variant="secondary">DEMO DATA</Badge>
            )}
            {stockInfo.dataSource === "real" && (
              <Badge variant="default">LIVE DATA</Badge>
            )}
          </div>
          <p className="text-lg text-gray-600">
            Stock Details & Chart
            {stockInfo.lastUpdated && stockInfo.dataSource === "real" && (
              <span className="text-sm text-gray-500">
                {" "}
                • Updated: {stockInfo.lastUpdated}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Price Information */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <DollarSign className="w-4 h-4 mr-1" />
              Current Price
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              ${stockInfo.currentPrice.toLocaleString()}
            </div>
            <div
              className={`flex items-center mt-1 ${isPositive ? "text-green-600" : "text-red-600"}`}
            >
              {isPositive ? (
                <TrendingUp className="w-4 h-4 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 mr-1" />
              )}
              <span className="font-medium">
                {isPositive ? "+" : ""}${stockInfo.priceChange.toFixed(2)} (
                {isPositive ? "+" : ""}
                {stockInfo.priceChangePercent.toFixed(2)}%)
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <BarChart3 className="w-4 h-4 mr-1" />
              Volume
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {(stockInfo.volume / 1000000).toFixed(1)}M
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {stockInfo.volume.toLocaleString()} shares
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Market Cap
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {formatMarketCap(stockInfo.marketCap)}
            </div>
            <div className="text-sm text-gray-600 mt-1">Total market value</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              Last Updated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-gray-900">
              {new Date().toLocaleDateString()}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {new Date().toLocaleTimeString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart Section */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl">
                {stockInfo.ticker} Chart
              </CardTitle>
              <CardDescription>
                Interactive candlestick chart with volume indicator
              </CardDescription>
            </div>
            <Badge variant={isPositive ? "default" : "destructive"}>
              {isPositive ? "BULLISH" : "BEARISH"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="chart" className="w-full">
            <TabsList>
              <TabsTrigger value="chart">Price Chart</TabsTrigger>
              <TabsTrigger value="data">Raw Data</TabsTrigger>
            </TabsList>
            <TabsContent value="chart" className="mt-6">
              <StockChart
                data={stockInfo.data}
                ticker={stockInfo.ticker}
                height={500}
              />
            </TabsContent>
            <TabsContent value="data" className="mt-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Date</th>
                      <th className="text-right p-2">Open</th>
                      <th className="text-right p-2">High</th>
                      <th className="text-right p-2">Low</th>
                      <th className="text-right p-2">Close</th>
                      <th className="text-right p-2">Volume</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockInfo.data
                      .slice(-10)
                      .reverse()
                      .map((item, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="p-2 font-medium">{item.time}</td>
                          <td className="p-2 text-right">
                            ${item.open.toFixed(2)}
                          </td>
                          <td className="p-2 text-right">
                            ${item.high.toFixed(2)}
                          </td>
                          <td className="p-2 text-right">
                            ${item.low.toFixed(2)}
                          </td>
                          <td className="p-2 text-right">
                            ${item.close.toFixed(2)}
                          </td>
                          <td className="p-2 text-right">
                            {item.volume.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Additional Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>About {stockInfo.ticker}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Real-time stock data and interactive charts for {stockInfo.ticker}
              . The chart shows candlestick patterns with volume indicators to
              help you analyze price movements and trading activity.
            </p>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">52-Week High:</span>
                <span className="font-medium">
                  ${Math.max(...stockInfo.data.map((d) => d.high)).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">52-Week Low:</span>
                <span className="font-medium">
                  ${Math.min(...stockInfo.data.map((d) => d.low)).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Average Volume:</span>
                <span className="font-medium">
                  {(
                    stockInfo.data.reduce((sum, d) => sum + d.volume, 0) /
                    stockInfo.data.length /
                    1000000
                  ).toFixed(1)}
                  M
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Trading Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full" size="lg">
              <TrendingUp className="w-4 h-4 mr-2" />
              Buy {stockInfo.ticker}
            </Button>
            <Button variant="outline" className="w-full" size="lg">
              <TrendingDown className="w-4 h-4 mr-2" />
              Sell {stockInfo.ticker}
            </Button>
            <Button variant="secondary" className="w-full" size="lg">
              Add to Watchlist
            </Button>
            <div className="pt-4 border-t">
              <p className="text-xs text-gray-500 text-center">
                This is a demo application. No real trading is conducted.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
