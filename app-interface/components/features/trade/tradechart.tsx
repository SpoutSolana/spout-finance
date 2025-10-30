import React from "react";
import StockChart from "@/components/stockChart";
import { LoadingSpinner } from "@/components/loadingSpinner";

type TradeChartProps = {
  loading: boolean;
  tokenData: any[];
  selectedToken: string;
};

export default function TradeChart({
  loading,
  tokenData,
  selectedToken,
}: TradeChartProps) {
  // console.log("tokenData: ", tokenData);
  return (
    <div className="mb-8">
      {loading ? (
        <div className="h-[400px] flex items-center justify-center bg-slate-50 rounded-none">
          <div className="text-center">
            <LoadingSpinner size="lg" text="Loading chart data..." />
          </div>
        </div>
      ) : (
        <StockChart data={tokenData} ticker={selectedToken} />
      )}
    </div>
  );
}
