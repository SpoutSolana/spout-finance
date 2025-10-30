import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Clock } from "lucide-react";

type PortfolioSummaryCardsProps = {
  portfolioValue: number;
  dayChange: number;
  dayChangePercent: number;
  totalReturn: number;
  totalReturnPercent: number;
  holdings: any[]; // Replace with a more specific type if available
};

export default function PortfolioSummaryCards({
  portfolioValue,
  dayChange,
  dayChangePercent,
  totalReturn,
  totalReturnPercent,
  holdings,
}: PortfolioSummaryCardsProps) {
  // Format number to 3 decimals, matching holdings value
  const formatNumber = (num: number) => {
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    });
  };
  const formatPercent = (num: number) => Number(num.toFixed(2));
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Total Value Card */}
      <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Value</CardTitle>
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
          <CardTitle className="text-sm font-medium">Total Return</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div
            className={`text-2xl font-bold ${totalReturn >= 0 ? "text-green-600" : "text-red-600"}`}
          >
            {totalReturn >= 0 ? "+" : "-"}${formatNumber(Math.abs(totalReturn))}
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
  );
}
