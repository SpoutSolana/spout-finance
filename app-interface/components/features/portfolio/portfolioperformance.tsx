import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import React from "react";
import Image from "next/image";

type Holding = {
  symbol: string;
  name: string;
  shares: number;
  avgPrice: number;
  currentPrice: number;
  value: number;
  dayChange: number;
  totalReturn: number;
  allocation: number;
};

type Returns = {
  thirtyDayReturn: number;
  ninetyDayReturn: number;
  yearReturn: number;
};

type PortfolioPerformanceProps = {
  holdings: Holding[];
  returns: Returns;
  formatPercent: (num: number) => string;
};

const PortfolioPerformance: React.FC<PortfolioPerformanceProps> = ({
  holdings,
  returns,
  formatPercent,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Portfolio Allocation</CardTitle>
          <CardDescription>Distribution by holdings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {holdings.map((holding, index) => (
              <div
                key={holding.symbol}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-none"
              >
                <div className="flex items-center space-x-3">
                  {holding.symbol === "SLQD" ? (
                    <div className="w-4 h-4 relative">
                      <Image
                        src="/SLQD.png"
                        alt="SLQD logo"
                        fill
                        style={{ objectFit: "contain" }}
                        className="rounded-none"
                      />
                    </div>
                  ) : (
                    <div
                      className={`w-4 h-4 rounded-full ${
                        index === 0
                          ? "bg-blue-500"
                          : index === 1
                            ? "bg-emerald-500"
                            : index === 2
                              ? "bg-purple-500"
                              : "bg-orange-500"
                      }`}
                    ></div>
                  )}
                  <span className="text-sm font-medium">{holding.symbol}</span>
                </div>
                <span className="text-sm text-gray-600 font-semibold">
                  {holding.allocation}%
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
          <CardDescription>Key portfolio statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between p-3 bg-slate-50 rounded-none">
              <span className="text-sm text-gray-600">30-Day Return</span>
              <span
                className={`text-sm font-medium ${returns.thirtyDayReturn >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                {returns.thirtyDayReturn >= 0 ? "+" : ""}
                {formatPercent(returns.thirtyDayReturn)}%
              </span>
            </div>
            <div className="flex justify-between p-3 bg-slate-50 rounded-none">
              <span className="text-sm text-gray-600">90-Day Return</span>
              <span
                className={`text-sm font-medium ${returns.ninetyDayReturn >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                {returns.ninetyDayReturn >= 0 ? "+" : ""}
                {formatPercent(returns.ninetyDayReturn)}%
              </span>
            </div>
            <div className="flex justify-between p-3 bg-slate-50 rounded-none">
              <span className="text-sm text-gray-600">1-Year Return</span>
              <span
                className={`text-sm font-medium ${returns.yearReturn >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                {returns.yearReturn >= 0 ? "+" : ""}
                {formatPercent(returns.yearReturn)}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PortfolioPerformance;
