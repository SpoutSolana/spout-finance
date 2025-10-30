import { useMarketData } from "./useMarketData";
import { useYieldData } from "./useYieldData";

export function useReturns(symbol: string) {
  const { data: marketData, isLoading: marketLoading } = useMarketData(symbol);
  const { data: yieldData, isLoading: yieldLoading } = useYieldData(symbol);

  // Calculate returns based on annual yield rate
  const calculateReturn = (days: number) => {
    console.log("🔍 Return calculation debug:", {
      hasMarketData: !!marketData,
      hasYieldData: !!yieldData,
      currentPrice: marketData?.price,
      previousClose: marketData?.previousClose,
      yield: yieldData?.yield,
      symbol,
    });

    // Get the annual yield rate (365 days)
    const annualYieldRate = yieldData?.yield || 4.44; // Default to 4.44% if no yield data

    // Calculate daily yield rate (annual rate / 365 days)
    const dailyYieldRate = annualYieldRate / 365;

    // Calculate yield return for the specified period
    const yieldReturn = dailyYieldRate * days;

    console.log("📊 Yield calculation details:", {
      days,
      annualYieldRate,
      dailyYieldRate,
      yieldReturn,
    });

    return yieldReturn;
  };

  const returns = {
    thirtyDayReturn: calculateReturn(30),
    ninetyDayReturn: calculateReturn(90),
    yearReturn: calculateReturn(365),
  };

  const isLoading = marketLoading || yieldLoading;

  return { returns, isLoading };
}
