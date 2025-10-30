"use client";

import React, { useState, useEffect } from "react";
import { clientCacheHelpers } from "@/lib/cache/client-cache";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Image from "next/image";

export default function Swapinterface() {
  const [swapMode, setSwapMode] = useState<"buy" | "sell">("buy");
  const [sellAmount, setSellAmount] = useState("");
  const [buyAmount, setBuyAmount] = useState("");
  const [sellToken, setSellToken] = useState("RWA");
  const [buyToken, setBuyToken] = useState("USDC");

  // Custom hook to fetch ask price for LQD
  const [askPrice, setAskPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAskPrice = async () => {
      setLoading(true);
      try {
        const data = await clientCacheHelpers.fetchMarketData("SLQD");
        const askPrice = data?.askPrice;
        if (typeof askPrice === "number") {
          setAskPrice(askPrice);
        } else {
          setError("Ask price not found");
        }
      } catch (err) {
        console.error("Error fetching market data:", err);
        setError("Failed to fetch market data");
      } finally {
        setLoading(false);
      }
    };

    fetchAskPrice();
  }, []);

  const handleSwapTokens = () => {
    const tempToken = sellToken;
    const tempAmount = sellAmount;
    setSellToken(buyToken);
    setBuyToken(tempToken);
    setSellAmount(buyAmount);
    setBuyAmount(tempAmount);
  };

  const handleTabChange = (value: string) => {
    setSwapMode(value as "buy" | "sell");
    if (value === "buy") {
      setSellToken("USDC");
      setBuyToken("RWA");
    } else {
      setSellToken("RWA");
      setBuyToken("USDC");
    }
    setSellAmount("");
    setBuyAmount("");
  };
  return (
    <>
      {/* Swap Interface */}
      <Card>
        <CardHeader>
          <CardTitle>Token Swap</CardTitle>
          <CardDescription>
            Swap between SUSC tokens and USDC instantly
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={swapMode}
            onValueChange={handleTabChange}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="buy">Buy SUSC</TabsTrigger>
              <TabsTrigger value="sell">Sell SUSC</TabsTrigger>
            </TabsList>

            <TabsContent value="buy" className="space-y-4 mt-6">
              <div className="space-y-4">
                {/* Sell Section */}
                <div className="bg-gray-50 rounded-none p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-600">
                      You pay
                    </span>
                    <span className="text-sm text-gray-500">
                      Balance: 500.00
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Input
                      placeholder="0"
                      value={sellAmount}
                      onChange={(e) => setSellAmount(e.target.value)}
                      className="text-2xl font-semibold border-0 bg-transparent p-0 h-auto"
                    />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          className="flex items-center space-x-2"
                        >
                          {sellToken === "USDC" ? (
                            <Image
                              src="/USD.png"
                              alt="USDC"
                              width={24}
                              height={24}
                              className="rounded-full w-6 h-6 object-cover"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-purple-500"></div>
                          )}
                          <span>{sellToken}</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem disabled>
                          Only switchable via swap or tab
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    ≈ ${sellAmount || "0.00"}
                  </div>
                </div>

                {/* Swap Arrow */}
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full"
                    onClick={handleSwapTokens}
                  >
                    <ArrowUpDown className="w-4 h-4" />
                  </Button>
                </div>

                {/* Buy Section */}
                <div className="bg-gray-50 rounded-none p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-600">
                      You receive
                    </span>
                    <span className="text-sm text-gray-500">
                      Balance: 1,250.00
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Input
                      placeholder="0"
                      value={buyAmount}
                      onChange={(e) => setBuyAmount(e.target.value)}
                      className="text-2xl font-semibold border-0 bg-transparent p-0 h-auto"
                    />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          className="flex items-center space-x-2"
                        >
                          {buyToken === "USDC" ? (
                            <Image
                              src="/USD.png"
                              alt="USDC"
                              width={24}
                              height={24}
                              className="rounded-full w-6 h-6 object-cover"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-purple-500"></div>
                          )}
                          <span>{buyToken}</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem disabled>
                          Only switchable via swap or tab
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    ≈ ${buyAmount || "0.00"}
                  </div>
                </div>

                <Button className="w-full h-12 text-lg font-semibold">
                  Buy SUSC Tokens
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="sell" className="space-y-4 mt-6">
              <div className="space-y-4">
                {/* Sell Section */}
                <div className="bg-gray-50 rounded-none p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-600">
                      You pay
                    </span>
                    <span className="text-sm text-gray-500">
                      Balance: 1,250.00
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Input
                      placeholder="0"
                      value={sellAmount}
                      onChange={(e) => setSellAmount(e.target.value)}
                      className="text-2xl font-semibold border-0 bg-transparent p-0 h-auto"
                    />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          className="flex items-center space-x-2"
                        >
                          {sellToken === "USDC" ? (
                            <Image
                              src="/USD.png"
                              alt="USDC"
                              width={24}
                              height={24}
                              className="rounded-full w-6 h-6 object-cover"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-purple-500"></div>
                          )}
                          <span>{sellToken}</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem disabled>
                          Only switchable via swap or tab
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    ≈ ${sellAmount || "0.00"}
                  </div>
                </div>

                {/* Swap Arrow */}
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full"
                    onClick={handleSwapTokens}
                  >
                    <ArrowUpDown className="w-4 h-4" />
                  </Button>
                </div>

                {/* Buy Section */}
                <div className="bg-gray-50 rounded-none p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-600">
                      You receive
                    </span>
                    <span className="text-sm text-gray-500">
                      Balance: 500.00
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Input
                      placeholder="0"
                      value={buyAmount}
                      onChange={(e) => setBuyAmount(e.target.value)}
                      className="text-2xl font-semibold border-0 bg-transparent p-0 h-auto"
                    />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          className="flex items-center space-x-2"
                        >
                          {buyToken === "USDC" ? (
                            <Image
                              src="/USD.png"
                              alt="USDC"
                              width={24}
                              height={24}
                              className="rounded-full w-6 h-6 object-cover"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-purple-500"></div>
                          )}
                          <span>{buyToken}</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem disabled>
                          Only switchable via swap or tab
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    ≈ ${buyAmount || "0.00"}
                  </div>
                </div>

                <Button
                  className="w-full h-12 text-lg font-semibold"
                  variant="destructive"
                >
                  Sell SUSC Tokens
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          {/* Swap Info */}
          <div className="mt-6 p-4 bg-blue-50 rounded-none">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Exchange Rate</span>
              <span className="font-medium">
                {loading && "Loading..."}
                {error && `Error: ${error}`}
                {askPrice !== null &&
                  !loading &&
                  !error &&
                  `1 S${buyToken} = ${askPrice} USD`}
              </span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-600">Network Fee</span>
              <span className="font-medium">~$0.50</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
