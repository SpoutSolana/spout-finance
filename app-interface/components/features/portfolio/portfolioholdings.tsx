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
              className="flex items-center gap-2 p-6 bg-slate-50 rounded-none hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center space-x-4 flex-1 min-w-0">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-none flex items-center justify-center relative overflow-hidden flex-shrink-0">
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
                <div className="min-w-0">
                  <h3 className="font-semibold text-lg">{holding.symbol}</h3>
                  <p className="text-sm text-gray-600">{holding.name}</p>
                  <p className="text-xs text-gray-500">
                    {formatNumber(holding.shares)} shares @ $
                    {Number(holding.currentPrice || 0).toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="text-right w-[150px] font-mono flex-shrink-0">
                <p className="font-semibold text-lg tabular-nums whitespace-nowrap">
                  ${Number(holding.value || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                </p>
                <p
                  className={`text-sm font-medium tabular-nums whitespace-nowrap ${holding.dayChange >= 0 ? "text-green-600" : "text-red-600"}`}
                >
                  {holding.dayChange >= 0 ? "+" : ""}
                  {holding.dayChange.toFixed(3)}%
                </p>
                <p className="text-xs text-gray-500 tabular-nums whitespace-nowrap">
                  {holding.allocation}% of portfolio
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
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
