"use client";

import React from "react";
import { Suspense } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// Reserve contract hooks temporarily disabled - will implement with Aptos hooks
import { useMarketData } from "@/hooks/api/useMarketData";
import { useYieldData } from "@/hooks/api/useYieldData";
import {
  Shield,
  BarChart3,
  RefreshCw,
  Percent,
  CheckCircle,
  RefreshCcw,
} from "lucide-react";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(amount);
};

const formatNumber = (num: number) => {
  return new Intl.NumberFormat("en-US").format(num);
};

export default function ProofOfReservePage() {
  // Total supply functionality temporarily disabled - will implement with Aptos hooks
  const totalSupply = 1000000; // Placeholder value
  const totalSupplyLoading = false;
  const { price: currentPrice, isLoading: priceLoading } = useMarketData("LQD");
  const { data: lqdYield, isLoading: lqdYieldLoading } = useYieldData("LQD");

  // Use Blocksense feed ID 101001 for LQD Proof of Reserve
  const feedId = 101001;
  // Hardcoded Aptos testnet address for proof of reserve
  const reserveContractAddress = "0x72F88509C53b939a0613c679a0F4768c0444d247" as `0x${string}`;
  // Reserve contract functionality temporarily disabled - will implement with Aptos hooks
  const requestReserves = () => {};
  const isRequestPending = false;
  const totalReserves = 0;
  const refetchReserves = () => {};

  // Use LQD yield directly
  const yieldRate = lqdYield?.yield || 0;

  // Corporate Bonds data using real yield
  const corporateBondsData = {
    rating: "AAA",
    yieldRate: yieldRate,
    lastUpdated: lqdYield?.timestamp || new Date().toISOString(),
    holdings: [
      {
        ticker: "LQD",
        name: "iShares iBoxx $ Investment Grade Corporate Bond ETF",
        yieldRate: yieldRate,
      },
    ],
  };

  const handleRequestReserves = () => {
    // Reserve request functionality temporarily disabled - will implement with Aptos hooks
    console.log("Reserve request functionality coming soon with Aptos integration");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Proof of Reserve
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Real-time verification of our reserve holdings and backing
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            onClick={handleRequestReserves}
            className="flex items-center space-x-2"
            variant="outline"
          >
            <RefreshCcw
              className={`h-4 w-4 ${isRequestPending ? "animate-spin" : ""}`}
            />
            <span>
              {isRequestPending ? "Requesting..." : "Request Reserves"}
            </span>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Reserve Value
            </CardTitle>
            <Shield className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(() => {
                const hasValidPrice = currentPrice !== null && currentPrice > 0;
                const hasValidSupply = totalSupply > 0;
                const isDataLoading =
                  totalSupplyLoading ||
                  priceLoading ||
                  !hasValidPrice ||
                  !hasValidSupply;

                if (isDataLoading) {
                  return (
                    <div className="flex items-center text-gray-500">
                      <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                      <span className="text-lg">Fetching...</span>
                    </div>
                  );
                }

                if (totalReserves) {
                  return formatCurrency(
                    (Number(totalReserves) / 1e6) * currentPrice!,
                  );
                } else {
                  return formatCurrency(totalSupply * currentPrice!);
                }
              })()}
            </div>
            <div className="flex items-center text-xs text-emerald-600">
              <CheckCircle className="h-3 w-3 mr-1" />
              {(() => {
                const hasValidPrice = currentPrice !== null && currentPrice > 0;
                const hasValidSupply = totalSupply > 0;
                const isDataLoading =
                  totalSupplyLoading ||
                  priceLoading ||
                  !hasValidPrice ||
                  !hasValidSupply;

                if (isDataLoading) {
                  return <span className="text-gray-400">Loading...</span>;
                }

                return (
                  <>
                    {formatNumber(totalSupply)} LQD @ $
                    {currentPrice?.toFixed(2) || "0.00"}
                  </>
                );
              })()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reserve Ratio</CardTitle>
            <Percent className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">100%</div>
            <div className="text-xs text-blue-600">1:1 Backing</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Corporate Bonds
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(() => {
                const hasValidPrice = currentPrice !== null && currentPrice > 0;
                const hasValidSupply = totalSupply > 0;
                const isDataLoading =
                  totalSupplyLoading ||
                  priceLoading ||
                  !hasValidPrice ||
                  !hasValidSupply;

                if (isDataLoading) {
                  return (
                    <div className="flex items-center text-gray-500">
                      <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                      <span className="text-lg">Fetching...</span>
                    </div>
                  );
                }

                return formatCurrency(totalSupply * currentPrice!);
              })()}
            </div>
            <div className="flex items-center text-xs text-purple-600">
              <Badge variant="secondary" className="text-xs">
                AAA-Rated
              </Badge>
              <span className="ml-2">
                {(() => {
                  const hasValidPrice =
                    currentPrice !== null && currentPrice > 0;
                  const hasValidSupply = totalSupply > 0;
                  const isDataLoading =
                    totalSupplyLoading ||
                    priceLoading ||
                    !hasValidPrice ||
                    !hasValidSupply;

                  if (isDataLoading) {
                    return <span className="text-gray-400">Loading...</span>;
                  }

                  return `${formatNumber(totalSupply)} LQD`;
                })()}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="corporate-bonds">Corporate Bonds</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Allocation Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Reserve Allocation</CardTitle>
                <CardDescription>
                  Distribution of our reserve holdings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-purple-500 rounded"></div>
                      <span className="text-sm">Corporate Bonds</span>
                    </div>
                    <div className="text-sm font-medium">100%</div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full"
                      style={{ width: "100%" }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reserve Status */}
            <Card>
              <CardHeader>
                <CardTitle>Reserve Status</CardTitle>
                <CardDescription>Current verification status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-none">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-medium">Reserves Verified</span>
                    </div>
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-800"
                    >
                      Active
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-none">
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-blue-600" />
                      <span className="font-medium">Custodian Status</span>
                    </div>
                    <Badge
                      variant="secondary"
                      className="bg-blue-100 text-blue-800"
                    >
                      Secure
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Corporate Bonds Tab */}
        <TabsContent value="corporate-bonds" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Corporate Bonds Holdings</CardTitle>
              <CardDescription>
                AAA-rated investment-grade corporate bond ETFs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-purple-50 rounded-none">
                    <div className="text-2xl font-bold text-purple-600">
                      {totalSupplyLoading || priceLoading ? (
                        <RefreshCw className="h-5 w-5 animate-spin text-gray-400 mx-auto" />
                      ) : (
                        formatCurrency(totalSupply * (currentPrice || 0))
                      )}
                    </div>
                    <div className="text-sm text-gray-600">Total Value</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-none">
                    <div className="text-2xl font-bold text-blue-600">
                      {priceLoading ? (
                        <RefreshCw className="h-5 w-5 animate-spin text-gray-400 mx-auto" />
                      ) : (
                        currentPrice?.toFixed(2)
                      )}
                    </div>
                    <div className="text-sm text-gray-600">Current Price</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-none">
                    <div className="text-2xl font-bold text-green-600">
                      {lqdYieldLoading ? (
                        <RefreshCw className="h-5 w-5 animate-spin text-gray-400 mx-auto" />
                      ) : (
                        `${yieldRate.toFixed(2)}%`
                      )}
                    </div>
                    <div className="text-sm text-gray-600">Current Yield</div>
                  </div>
                </div>

                {/* Holdings Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">
                          Ticker
                        </th>
                        <th className="text-left py-3 px-4 font-medium">
                          Name
                        </th>
                        <th className="text-right py-3 px-4 font-medium">
                          Price
                        </th>
                        <th className="text-right py-3 px-4 font-medium">
                          Yield
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {corporateBondsData.holdings.map((holding, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">
                            {holding.ticker}
                          </td>
                          <td className="py-3 px-4">{holding.name}</td>
                          <td className="py-3 px-4 text-right">
                            {priceLoading ? (
                              <RefreshCw className="h-4 w-4 animate-spin text-gray-400 ml-auto" />
                            ) : (
                              currentPrice?.toFixed(2)
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {lqdYieldLoading ? (
                              <RefreshCw className="h-4 w-4 animate-spin text-gray-400 ml-auto" />
                            ) : (
                              `${holding.yieldRate.toFixed(2)}%`
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Verification Info */}
      <Card>
        <CardHeader>
          <CardTitle>Reserve Verification</CardTitle>
          <CardDescription>
            How we ensure transparency and security
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-row justify-center gap-x-24">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <h4 className="font-semibold mb-2">Daily Audits</h4>
              <p className="text-sm text-gray-600">
                Automated verification of all reserve holdings every 24 hours
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="font-semibold mb-2">Custodian Oversight</h4>
              <p className="text-sm text-gray-600">
                All assets held by qualified U.S. custodians with regulatory
                oversight
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
