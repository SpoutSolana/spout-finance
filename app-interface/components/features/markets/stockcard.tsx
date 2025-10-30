"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StockData {
  ticker: string;
  name: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  volume: string;
  marketCap: string;
  dataSource?: string;
}

interface StockCardProps {
  stock: StockData;
}

export function StockCard({ stock }: StockCardProps) {
  return (
    <Link href={`/app/markets/${stock.ticker}`}>
      <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer relative border-0 shadow-md group">
        {stock.dataSource === "mock" && (
          <div className="absolute top-3 right-3 z-10">
            <Badge
              variant="secondary"
              className="text-xs bg-orange-100 text-orange-700"
            >
              DEMO
            </Badge>
          </div>
        )}
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl font-bold group-hover:text-emerald-600 transition-colors">
                {stock.ticker}
              </CardTitle>
              <CardDescription className="text-sm text-gray-600">
                {stock.name}
              </CardDescription>
            </div>
            <Badge
              variant={
                stock.change && stock.change >= 0 ? "default" : "destructive"
              }
              className={`text-xs ${
                stock.change && stock.change >= 0
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {stock.change && stock.change >= 0 ? (
                <TrendingUp className="w-3 h-3 mr-1" />
              ) : (
                <TrendingDown className="w-3 h-3 mr-1" />
              )}
              {stock.changePercent && stock.changePercent >= 0 ? "+" : ""}
              {stock.changePercent?.toFixed(2)}%
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-2xl font-bold">
                {stock.price !== null
                  ? `$${stock.price.toLocaleString()}`
                  : "N/A"}
              </span>
              <span
                className={`text-sm font-medium ${
                  stock.change && stock.change >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {stock.change && stock.change >= 0 ? "+" : ""}$
                {stock.change?.toFixed(2) ?? "0.00"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-2 bg-slate-50 rounded-none">
                <span className="block text-xs text-slate-500">Volume</span>
                <span className="font-medium text-sm">{stock.volume}</span>
              </div>
              <div className="p-2 bg-slate-50 rounded-none">
                <span className="block text-xs text-slate-500">Market Cap</span>
                <span className="font-medium text-sm">{stock.marketCap}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
