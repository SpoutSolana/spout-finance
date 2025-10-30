"use client";

import React from "react";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// // import { useReserveContract } from "@/hooks/view/onChain/useReserveContract";
// // import { useTotalSupply } from "@/hooks/view/onChain/useTotalSupply";
// import { useMarketData } from "@/hooks/api/useMarketData";
// import { useYieldData } from "@/hooks/api/useYieldData";
// import {
//   ReserveHeader,
//   ReserveSummary,
//   ReserveOverview,
//   ReserveVerification,
//   CorporateBonds,
// } from "@/components/features/reserve";

function ProofOfReservePage() {
  // // const { totalSupply, isLoading: totalSupplyLoading } = useTotalSupply();
  // const { price: currentPrice, isLoading: priceLoading } = useMarketData("LQD");
  // const { data: lqdYield, isLoading: lqdYieldLoading } = useYieldData("LQD");

  // const RESERVE_CONTRACT_ADDRESS = "0x9D11687f26C27e21771908aE248f13411477B589";
  // const { requestReserves, isRequestPending, totalReserves } =
    // useReserveContract(RESERVE_CONTRACT_ADDRESS);

  // Cast totalReserves to bigint | null for type safety
  // const typedTotalReserves = totalReserves as bigint | null;

  // Use LQD yield directly
  // const yieldRate = lqdYield?.yield || 0;

  // const handleRequestReserves = () => {
  //   requestReserves(379);
  // };

  return (
    <div className="space-y-6">
      {/* Header */}
      {/* <ReserveHeader
        onRequestReserves={handleRequestReserves}
        isRequestPending={isRequestPending}
      /> */}

      {/* Summary Cards */}
      {/* <ReserveSummary
        totalSupply={totalSupply}
        currentPrice={currentPrice}
        totalReserves={typedTotalReserves}
        totalSupplyLoading={totalSupplyLoading}
        priceLoading={priceLoading}
      /> */}

      {/* Detailed Tabs */}
      {/* <Tabs defaultValue="overview" className="space-y-6"> */}
        {/* <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="corporate-bonds">Corporate Bonds</TabsTrigger>
        </TabsList> */}

        {/* Overview Tab */}
        {/* <TabsContent value="overview" className="space-y-6">
          <ReserveOverview />
        </TabsContent> */}

        {/* Corporate Bonds Tab */}
        {/* <TabsContent value="corporate-bonds" className="space-y-6"> */}
          {/* <CorporateBonds
            totalSupply={totalSupply}
            currentPrice={currentPrice}
            yieldRate={yieldRate}
            priceLoading={priceLoading}
            lqdYieldLoading={lqdYieldLoading}
          /> */}
        {/* </TabsContent> */}
      {/* </Tabs> */}

      {/* Verification Info */}
      {/* <ReserveVerification /> */}
      <div>Proof of Reserve</div>
    </div>
  );
}

export default ProofOfReservePage;
