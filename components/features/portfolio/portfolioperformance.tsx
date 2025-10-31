import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import React from "react";
import { LabelList, Pie, PieChart } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

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
  // Color mapping matching the original design
  const symbolColors: Record<string, string> = {
    LQD: "hsl(217 91% 60%)", // blue-500
    USDC: "hsl(142 71% 45%)", // emerald-500
    TSLA: "hsl(271 91% 65%)", // purple-500
    AAPL: "hsl(25 95% 53%)", // orange-500
    GOLD: "hsl(25 95% 53%)", // orange-500
  };

  // Filter holdings with allocation > 0 for the chart
  const chartData = holdings
    .filter((holding) => holding.allocation > 0)
    .map((holding) => ({
      symbol: holding.symbol,
      allocation: holding.allocation,
      fill: symbolColors[holding.symbol] || "hsl(217 91% 60%)",
    }));

  // Build chart config
  const chartConfig: ChartConfig = {
    allocation: {
      label: "Allocation",
    },
  };

  chartData.forEach((item) => {
    const symbolKey = item.symbol.toLowerCase();
    chartConfig[symbolKey] = {
      label: item.symbol,
      color: item.fill,
    };
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Portfolio Allocation</CardTitle>
          <CardDescription>Distribution by holdings</CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ChartContainer
              config={chartConfig}
              className="[&_.recharts-text]:fill-background mx-auto aspect-square max-h-[250px]"
            >
              <PieChart>
                <ChartTooltip
                  content={<ChartTooltipContent nameKey="symbol" hideLabel />}
                />
                <Pie data={chartData} dataKey="allocation" nameKey="symbol">
                  <LabelList
                    dataKey="symbol"
                    className="fill-background"
                    stroke="none"
                    fontSize={12}
                    formatter={(value: React.ReactNode) => {
                      const valueStr = String(value);
                      const item = chartData.find((d) => d.symbol === valueStr);
                      return item ? `${valueStr} ${item.allocation}%` : valueStr;
                    }}
                  />
                </Pie>
              </PieChart>
            </ChartContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-sm text-gray-500">
              No holdings to display
            </div>
          )}
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
