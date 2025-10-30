import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, CheckCircle } from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/utils/formatters";
import { LoadingSpinner } from "@/components/loadingSpinner";

interface CorporateBondsProps {
  totalSupply: number;
  currentPrice: number | null;
  yieldRate: number;
  priceLoading: boolean;
  lqdYieldLoading: boolean;
}

export function CorporateBonds({
  totalSupply,
  currentPrice,
  yieldRate,
  priceLoading,
  lqdYieldLoading,
}: CorporateBondsProps) {
  const corporateBondsData = {
    holdings: [
      {
        ticker: "LQD",
        name: "iShares iBoxx $ Investment Grade Corporate Bond ETF",
        yieldRate: yieldRate,
      },
    ],
  };

  return (
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
                {priceLoading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  formatCurrency(totalSupply * (currentPrice || 0))
                )}
              </div>
              <div className="text-sm text-gray-600">Total Value</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-none">
              <div className="text-2xl font-bold text-blue-600">
                {priceLoading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  currentPrice?.toFixed(2)
                )}
              </div>
              <div className="text-sm text-gray-600">Current Price</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-none">
              <div className="text-2xl font-bold text-green-600">
                {lqdYieldLoading ? (
                  <LoadingSpinner size="sm" />
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
                  <th className="text-left py-3 px-4 font-medium">Ticker</th>
                  <th className="text-left py-3 px-4 font-medium">Name</th>
                  <th className="text-right py-3 px-4 font-medium">Price</th>
                  <th className="text-right py-3 px-4 font-medium">Yield</th>
                </tr>
              </thead>
              <tbody>
                {corporateBondsData.holdings.map((holding, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{holding.ticker}</td>
                    <td className="py-3 px-4">{holding.name}</td>
                    <td className="py-3 px-4 text-right">
                      {priceLoading ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        currentPrice?.toFixed(2)
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {lqdYieldLoading ? (
                        <LoadingSpinner size="sm" />
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
  );
}
