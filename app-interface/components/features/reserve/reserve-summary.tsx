import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Percent, BarChart3, CheckCircle } from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/utils/formatters";
import { LoadingSpinner } from "@/components/loadingSpinner";

interface ReserveSummaryProps {
  totalSupply: number;
  currentPrice: number | null;
  totalReserves: bigint | null;
  totalSupplyLoading: boolean;
  priceLoading: boolean;
}

export function ReserveSummary({
  totalSupply,
  currentPrice,
  totalReserves,
  totalSupplyLoading,
  priceLoading,
}: ReserveSummaryProps) {
  // Check if we have valid data for calculations
  const hasValidPrice = currentPrice !== null && currentPrice > 0;
  const hasValidSupply = totalSupply > 0;
  const isDataLoading =
    totalSupplyLoading || priceLoading || !hasValidPrice || !hasValidSupply;

  // Calculate reserve value
  const getReserveValue = () => {
    if (isDataLoading) {
      return (
        <div className="flex items-center text-gray-500">
          <LoadingSpinner className="h-5 w-5 animate-spin mr-2" />
          <span className="text-lg">Fetching...</span>
        </div>
      );
    }

    if (totalReserves) {
      return formatCurrency((Number(totalReserves) / 1e6) * currentPrice!);
    } else {
      return formatCurrency(totalSupply * currentPrice!);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Reserve Value
          </CardTitle>
          <Shield className="h-4 w-4 text-emerald-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{getReserveValue()}</div>
          <div className="flex items-center text-xs text-emerald-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            {isDataLoading ? (
              <span className="text-gray-400">Loading...</span>
            ) : (
              <>
                {formatNumber(totalSupply)} LQD @ $
                {currentPrice?.toFixed(2) || "0.00"}
              </>
            )}
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
          <CardTitle className="text-sm font-medium">Corporate Bonds</CardTitle>
          <BarChart3 className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {isDataLoading ? (
              <div className="flex items-center text-gray-500">
                <LoadingSpinner className="h-5 w-5 animate-spin mr-2" />
                <span className="text-lg">Fetching...</span>
              </div>
            ) : (
              formatCurrency(totalSupply * currentPrice!)
            )}
          </div>
          <div className="flex items-center text-xs text-purple-600">
            <Badge variant="secondary" className="text-xs">
              AAA-Rated
            </Badge>
            <span className="ml-2">
              {isDataLoading ? (
                <span className="text-gray-400">Loading...</span>
              ) : (
                `${formatNumber(totalSupply)} LQD`
              )}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
