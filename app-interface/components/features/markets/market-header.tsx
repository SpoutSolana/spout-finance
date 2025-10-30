"use client";

import { Badge } from "@/components/ui/badge";
import { Zap } from "lucide-react";

interface MarketHeaderProps {
  lastUpdated: Date | null;
}

export function MarketHeader({ lastUpdated }: MarketHeaderProps) {
  return (
    <div className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-emerald-800 rounded-none p-8 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.1),transparent_50%)]"></div>
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <Badge
            variant="secondary"
            className="bg-white/20 text-white border-white/30 hover:bg-white/20 hover:text-white hover:border-white/30"
          >
            <Zap className="w-4 h-4 mr-2" />
            Live Markets
          </Badge>
        </div>
        <h1 className="text-4xl font-bold mb-3">Stock Markets</h1>
        <p className="text-emerald-100 text-lg mb-6 max-w-2xl">
          Track real-time stock prices and market data. Professional-grade
          analytics and insights for informed trading decisions.
        </p>
        {lastUpdated && (
          <p className="text-emerald-200 text-sm">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        )}
      </div>
    </div>
  );
}
