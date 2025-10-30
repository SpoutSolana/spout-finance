"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Plus,
  Zap,
  Clock,
} from "lucide-react";
import { LoadingSpinner } from "@/components/loadingSpinner";
import Link from "next/link";
import { useTokenBalance } from "@/hooks/aptos/useTokenBalance";
import { useMarketData } from "@/hooks/api/useMarketData";
import { useAptosWallet } from "@/hooks/aptos/useAptosWallet";
import { useFaBalance } from "@/hooks/aptos/useFaBalance";
import { useCurrentUser } from "@/hooks/auth/useCurrentUser";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { useReturns } from "@/hooks/api/useReturns";
import PortfolioPerformance from "@/components/features/portfolio/portfolioperformance";
import PortfolioActivity from "@/components/features/portfolio/portfolioactivity";

export default function PortfolioPage() {
  const { address: userAddress } = useAptosWallet();
  const {
    balance: tokenBalance,
    isLoading: balanceLoading,
    isError: balanceError,
  } = useTokenBalance(userAddress || undefined);

  const {
    price: currentPrice,
    previousClose,
    isLoading: priceLoading,
    error: priceError,
  } = useMarketData("LQD"); // Use LQD as price reference

  const { returns, isLoading: returnsLoading } = useReturns("SLQD");

  const { username, loading } = useCurrentUser();

  // Additional token balances via FA view (module SpoutTokenV2)
  const { formatted: lqdBal } = useFaBalance(userAddress || undefined, "LQD");
  const { formatted: tslaBal } = useFaBalance(userAddress || undefined, "TSLA");
  const { formatted: aaplBal } = useFaBalance(userAddress || undefined, "AAPL");
  const { formatted: goldBal } = useFaBalance(userAddress || undefined, "GOLD");

  // Recent activity temporarily disabled - will implement with Aptos hooks
  const activities: any[] = [];
  const activitiesLoading = false;
  const hasMore = false;
  const loadMore = () => {};

  // Format number to 3 decimals, matching holdings value
  const formatNumber = (num: number) => {
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    });
  };

  // Format percentage to 2 decimal places for cleaner display
  const formatPercent = (num: number) => {
    return num.toFixed(2);
  };

  // Holdings derived below will be used to compute portfolio summaries

  console.log("Portfolio return information", {
    tokenBalance,
    currentPrice,
    previousClose,
  });

  type HoldingBase = {
    symbol: string;
    name: string;
    shares: number;
    avgPrice: number;
    currentPrice: number;
    value: number;
  };

  type Holding = HoldingBase & {
    dayChange: number;
    totalReturn: number;
    allocation: number;
  };

  const baseHoldings: HoldingBase[] = [
    {
      symbol: "LQD",
      name: "Spout US Corporate Bond Token",
      shares: Number(lqdBal || 0),
      avgPrice: previousClose || 0,
      currentPrice: currentPrice ?? 0,
      value: (Number(lqdBal || 0)) * (currentPrice ?? 0),
    },
    {
      symbol: "TSLA",
      name: "Tesla Synthetic",
      shares: Number(tslaBal || 0),
      avgPrice: previousClose || 0,
      currentPrice: currentPrice ?? 0,
      value: (Number(tslaBal || 0)) * (currentPrice ?? 0),
    },
    {
      symbol: "AAPL",
      name: "Apple Synthetic",
      shares: Number(aaplBal || 0),
      avgPrice: previousClose || 0,
      currentPrice: currentPrice ?? 0,
      value: (Number(aaplBal || 0)) * (currentPrice ?? 0),
    },
    {
      symbol: "GOLD",
      name: "Gold Synthetic",
      shares: Number(goldBal || 0),
      avgPrice: previousClose || 0,
      currentPrice: currentPrice ?? 0,
      value: (Number(goldBal || 0)) * (currentPrice ?? 0),
    },
  ];

  // Compute totals from all holdings
  const portfolioValue: number = baseHoldings.reduce((sum: number, h: HoldingBase) => sum + (h.value || 0), 0);
  const previousDayValue: number = baseHoldings.reduce(
    (sum: number, h: HoldingBase) => sum + (h.shares || 0) * (h.avgPrice || 0),
    0,
  );
  const dayChange: number = portfolioValue - previousDayValue;
  const dayChangePercent: number = previousDayValue > 0 ? (dayChange / previousDayValue) * 100 : 0;
  const totalReturn: number = dayChange;
  const totalReturnPercent: number = dayChangePercent;

  // Compute allocation based on value proportion
  const totalVal: number = portfolioValue || 1; // prevent division by zero
  const holdings: Holding[] = baseHoldings.map((h) => ({
    ...h,
    dayChange: dayChangePercent,
    totalReturn: totalReturnPercent,
    allocation: totalVal > 0 ? Math.round(((h.value || 0) / totalVal) * 100) : 0,
  }));

  // Show loading spinner overlay but keep the blue dashboard background
  const isLoading = balanceLoading || priceLoading || returnsLoading;

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.1),transparent_50%)]"></div>
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <div className="inline-flex items-center space-x-2">
                <Badge variant="outline" className="text-white border-white/20">
                  Live Portfolio
                </Badge>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-white hover:text-white/80"
                        aria-label="Refresh"
                        onClick={() => window.location.reload()}
                      ></Button>
                    </TooltipTrigger>
                    <TooltipContent>Refresh</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <h1 className="text-2xl font-bold mt-2">
                {username
                  ? `Welcome back${username ? ", " + username : ""}`
                  : "Portfolio Overview"}
              </h1>
            </div>
            <div className="mt-6 md:mt-0 text-right">
              <div className="text-3xl font-bold mb-2">
                ${formatNumber(portfolioValue)}
              </div>
              <div
                className={`flex items-center justify-end text-lg ${dayChange >= 0 ? "text-green-300" : "text-red-300"}`}
              >
                {dayChange >= 0 ? (
                  <TrendingUp className="h-5 w-5 mr-2" />
                ) : (
                  <TrendingDown className="h-5 w-5 mr-2" />
                )}
                ${formatNumber(Math.abs(dayChange))} (
                {dayChangePercent >= 0 ? "+" : ""}
                {formatPercent(dayChangePercent)}%)
              </div>
            </div>
          </div>
          <div className="flex gap-4 mt-6">
            <Link href="/app/trade">
              <Button variant="white" className="text-blue-600 font-semibold">
                <Plus className="h-4 w-4 mr-2" />
                Add Position
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Loading spinner/message below the blue dashboard header */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="text-gray-600 mt-4">Loading your portfolio...</p>
          </div>
        </div>
      )}

      {!isLoading && (
        <>
          {/* Portfolio Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Total Value Card */}
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Value
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${formatNumber(portfolioValue)}
                </div>
                <div
                  className={`flex items-center text-xs ${dayChange >= 0 ? "text-green-600" : "text-red-600"}`}
                >
                  {dayChange >= 0 ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  ${formatNumber(Math.abs(dayChange))} (
                  {dayChangePercent >= 0 ? "+" : ""}
                  {formatPercent(dayChangePercent)}%) today
                </div>
              </CardContent>
            </Card>

            {/* Total Return Card */}
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Return
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold ${totalReturn >= 0 ? "text-green-600" : "text-red-600"}`}
                >
                  {totalReturn >= 0 ? "+" : "-"}$
                  {formatNumber(Math.abs(totalReturn))}
                </div>
                <div
                  className={`flex items-center text-xs ${totalReturn >= 0 ? "text-green-600" : "text-red-600"}`}
                >
                  {totalReturn >= 0 ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  {totalReturnPercent >= 0 ? "+" : ""}
                  {formatPercent(totalReturnPercent)}% all time
                </div>
              </CardContent>
            </Card>

            {/* Positions Card */}
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Positions</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{holdings.length}</div>
                <p className="text-xs text-muted-foreground">Active holdings</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="holdings" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-slate-100">
              <TabsTrigger
                value="holdings"
                className="data-[state=active]:bg-white"
              >
                Holdings
              </TabsTrigger>
              <TabsTrigger
                value="performance"
                className="data-[state=active]:bg-white"
              >
                Performance
              </TabsTrigger>
              <TabsTrigger
                value="activity"
                className="data-[state=active]:bg-white"
              >
                Activity
              </TabsTrigger>
            </TabsList>

            {/* Holdings Tab */}
            <TabsContent value="holdings" className="space-y-6">
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Your Holdings</CardTitle>
                      <CardDescription>
                        Current positions in your portfolio
                      </CardDescription>
                    </div>
                    <Badge
                      variant="secondary"
                      className="bg-emerald-50 text-emerald-700"
                    >
                      <Zap className="w-3 h-3 mr-1" />
                      Live Prices
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {holdings.map((holding) => (
                      <div
                        key={holding.symbol}
                        className="flex items-center justify-between p-6 bg-slate-50 rounded-2xlhover:bg-slate-100 transition-colors"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rrounded-2xllex items-center justify-center">
                            <span className="font-bold text-white text-lg">
                              {holding.symbol[0]}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">
                              {holding.symbol}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {holding.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatNumber(holding.shares)} shares @ $
                              {holding.currentPrice}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-lg">
                            ${formatNumber(holding.value)}
                          </p>
                          <p
                            className={`text-sm font-medium ${holding.dayChange >= 0 ? "text-green-600" : "text-red-600"}`}
                          >
                            {holding.dayChange >= 0 ? "+" : ""}
                            {formatPercent(holding.dayChange)}%
                          </p>
                          <p className="text-xs text-gray-500">
                            {holding.allocation}% of portfolio
                          </p>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Link href="/app/trade">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="hover:bg-blue-50"
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </Link>
                              </TooltipTrigger>
                              <TooltipContent>Trade</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Performance Tab */}
            <TabsContent value="performance" className="space-y-6">
              <PortfolioPerformance
                holdings={holdings}
                returns={returns}
                formatPercent={formatPercent}
              />
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity" className="space-y-6">
              <PortfolioActivity
                activities={activities}
                activitiesLoading={activitiesLoading}
                hasMore={hasMore}
                loadMore={loadMore}
              />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
