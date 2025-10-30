"use client";

import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, RefreshCw, BarChart3, Activity } from "lucide-react";

const marketStats = [
  { label: "Total Stocks", value: "500+", icon: BarChart3 },
  { label: "Market Cap", value: "$45.2T", icon: TrendingUp },
  { label: "Active Traders", value: "1,247", icon: Activity },
  { label: "Avg Volume", value: "$2.4B", icon: RefreshCw },
];

export function MarketStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {marketStats.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <Card
            key={index}
            className="border-0 shadow-md hover:shadow-lg transition-all duration-300"
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-emerald-50 rounded-none">
                  <IconComponent className="h-5 w-5 text-emerald-600" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-600">
                  {stat.label}
                </p>
                <p className="text-2xl font-bold text-slate-900">
                  {stat.value}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
