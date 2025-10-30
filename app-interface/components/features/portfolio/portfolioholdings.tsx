import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Plus } from "lucide-react";
import Link from "next/link";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
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

type PortfolioHoldingsProps = {
  holdings: Holding[];
  formatNumber: (num: number) => string;
};

export default function PortfolioHoldings({
  holdings,
  formatNumber,
}: PortfolioHoldingsProps) {
  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Your Holdings</CardTitle>
            <CardDescription>
              Current positions in your portfolio
            </CardDescription>
          </div>
          <Badge variant="secondary" className="bg-emerald-50 text-emerald-700">
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
              className="flex items-center justify-between p-6 bg-slate-50 rounded-none hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-none flex items-center justify-center relative overflow-hidden">
                  {holding.symbol === "SLQD" ? (
                    <Image
                      src="/SLQD.png"
                      alt="SLQD logo"
                      fill
                      style={{ objectFit: "cover" }}
                      className="rounded-none"
                    />
                  ) : (
                    <span className="font-bold text-white text-lg">
                      {holding.symbol[0]}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{holding.symbol}</h3>
                  <p className="text-sm text-gray-600">{holding.name}</p>
                  <p className="text-xs text-gray-500">
                    {formatNumber(holding.shares)} shares @ $
                    {holding.currentPrice}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-lg">
                  ${holding.value.toLocaleString()}
                </p>
                <p
                  className={`text-sm font-medium ${holding.dayChange >= 0 ? "text-green-600" : "text-red-600"}`}
                >
                  {holding.dayChange >= 0 ? "+" : ""}
                  {holding.dayChange.toFixed(3)}%
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
                        <button className="hover:bg-blue-50 border rounded p-2">
                          <Plus className="h-4 w-4" />
                        </button>
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
  );
}
