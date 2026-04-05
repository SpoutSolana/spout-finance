import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  TrendingUp,
  Shield,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

import { LoadingSpinner } from "@/components/loadingSpinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import useKycStatus from "@/hooks/view/useVerificationStatus";
import { PublicKey } from "@solana/web3.js";

type TradeFormProps = {
  tradeType: "buy" | "sell";
  setTradeType: (type: "buy" | "sell") => void;
  orderType: "market" | "limit";
  setOrderType: (type: "market" | "limit") => void;
  limitPrice: string;
  setLimitPrice: (v: string) => void;
  selectedToken: string;
  setSelectedToken: (v: string) => void;
  tokens: { label: string; value: string }[];
  buyUsdc: string;
  setBuyUsdc: (v: string) => void;
  sellToken: string;
  setSellToken: (v: string) => void;
  latestPrice: number | null;
  priceLoading: boolean;
  usdcBalance: number;
  tokenBalance: number;
  usdcLoading: boolean;
  usdcError: boolean;
  balanceLoading: boolean;
  isOrderPending: boolean;
  handleBuy: () => void;
  handleSell: () => void;
  buyFeeUsdc: string;
  netReceiveTokens: string;
  sellFeeUsdc: string;
  netReceiveUsdc: string;
  priceChangePercent: number;
  priceChange: number;
  credentialPda?: PublicKey;
  schemaPda?: PublicKey;
  targetUser?: PublicKey;
};

function TradeForm({
  tradeType,
  setTradeType,
  orderType,
  setOrderType,
  limitPrice,
  setLimitPrice,
  selectedToken,
  setSelectedToken,
  tokens,
  buyUsdc,
  setBuyUsdc,
  sellToken,
  setSellToken,
  latestPrice,
  priceLoading,
  usdcBalance,
  tokenBalance,
  usdcLoading,
  usdcError,
  balanceLoading,
  isOrderPending: externalIsOrderPending,
  handleBuy,
  handleSell,
  buyFeeUsdc,
  netReceiveTokens,
  sellFeeUsdc,
  netReceiveUsdc,
  priceChangePercent,
  priceChange,
  credentialPda,
  schemaPda,
  targetUser
}: TradeFormProps) {
  const { publicKey } = useWallet();
  const credPda = credentialPda ?? new PublicKey("B4PtmaDJdFQBxpvwdLB3TDXuLd69wnqXexM2uBqqfMXL");
  const schPda = schemaPda ?? new PublicKey("GvJbCuyqzTiACuYwFzqZt7cEPXSeD5Nq3GeWBobFfU8x");
  const user = targetUser ?? publicKey;
  const { isKycVerified, loading: kycLoading } = useKycStatus({ credentialPda: credPda, schemaPda: schPda, targetUser: user, autoFetch: true });
  const handleVerifyKyc = async () => {
    if (!publicKey) return;
    try {
      await fetch("https://spout-backend-solana.onrender.com/web3/attest-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userPubkey: publicKey.toBase58(),
          attestationData: { kycCompleted: 1 },
        }),
      });
      // Optionally refetch KYC after a brief delay
      setTimeout(() => {
        // soft refresh via window focus or trigger route change if needed
      }, 500);
    } catch (e) {
      // noop UI for now
    }
  };

  // Calculate total cost for buy orders
  const isLimitBuy = orderType === "limit" && !!limitPrice;
  const buyCost = isLimitBuy
    ? (buyUsdc ? parseFloat(buyUsdc) * parseFloat(limitPrice) : 0)
    : (buyUsdc ? parseFloat(buyUsdc) : 0);
  const insufficientBalance = buyUsdc && buyCost > usdcBalance;

  // Use the handlers passed from the trade page (usePlaceBuyOrder / usePlaceSellOrder)
  const isBuyDisabled = !buyUsdc || externalIsOrderPending || isKycVerified !== true || kycLoading || !!insufficientBalance;

  // Display helper: balances are already human-formatted from hooks
  const displayTokenBalance = tokenBalance.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 9 });

  return (
    <div className="w-full max-w-xl mx-auto">
      <Card className="shadow-lg border border-[#004040]/15 bg-white hover:shadow-xl transition-shadow duration-200 rounded-none">
        <CardHeader className="pb-4">
          {/* Buy/Sell Toggle */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {tradeType === "buy" ? (
                <ArrowDownCircle className="text-[#004040] w-6 h-6" />
              ) : (
                <ArrowUpCircle className="text-[#004040] w-6 h-6" />
              )}
              <div>
                <CardTitle className="text-xl">
                  {tradeType === "buy" ? "Buy" : "Sell"} {selectedToken}
                </CardTitle>
                <CardDescription className="text-sm">
                  {tradeType === "buy"
                    ? `Deposit USDC to receive ${selectedToken}`
                    : `Sell ${selectedToken} for USDC`}
                </CardDescription>
              </div>
            </div>
              <div className="text-right">
              <div className="text-xs text-slate-500">
                {tradeType === "buy"
                  ? "USDC Balance"
                  : `${selectedToken} Balance`}
              </div>
              <div
                className={`font-bold text-base ${
                  tradeType === "buy" ? "text-[#004040]" : "text-[#004040]"
                }`}
              >
                {tradeType === "buy"
                  ? usdcLoading
                    ? "Loading..."
                    : usdcError
                      ? "-"
                      : `${usdcBalance.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })} USDC`
                  : balanceLoading
                    ? "Loading..."
                      : `${displayTokenBalance} ${selectedToken}`}
              </div>
              {/* Show secondary balance */}
              <div className="text-xs text-slate-400 mt-1">
                {tradeType === "buy"
                  ? balanceLoading
                    ? "Loading..."
                    : `${displayTokenBalance} ${selectedToken}`
                  : usdcLoading
                    ? "Loading..."
                    : usdcError
                      ? "-"
                      : `${usdcBalance.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })} USDC`}
              </div>
            </div>
          </div>

          {/* Toggle Buttons */}
          <div className="flex bg-[#e6f2f2] rounded-none p-1">
            <Button
              variant={tradeType === "buy" ? "default" : "ghost"}
              onClick={() => setTradeType("buy")}
              className={`flex-1 transition-all duration-200 ${
                tradeType === "buy"
                  ? "bg-[#004040] hover:bg-[#004040] text-white shadow-lg transform scale-[0.98] ring-2 ring-[#004040]/30"
                  : "hover:scale-[1.02]"
              }`}
            >
              <ArrowDownCircle className="w-4 h-4 mr-2" />
              Buy
            </Button>
            <Button
              variant={tradeType === "sell" ? "default" : "ghost"}
              onClick={() => setTradeType("sell")}
              className={`flex-1 transition-all duration-200 ${
                tradeType === "sell"
                  ? "bg-[#004040] hover:bg-[#004040] text-white shadow-lg transform scale-[0.98] ring-2 ring-[#004040]/30"
                  : "text-slate-600 hover:scale-[1.02]"
              }`}
            >
              <ArrowUpCircle className="w-4 h-4 mr-2" />
              Sell
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Asset Select moved below header for cleaner layout */}
          <div className="mb-5">
            <label className="block text-xs text-slate-500 mb-1">Asset</label>
            <Select value={selectedToken} onValueChange={setSelectedToken}>
              <SelectTrigger className="rounded-none border-[#004040]/30 focus:ring-[#004040] w-full bg-white">
                <SelectValue placeholder="Select asset" />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                {tokens.map((t) => (
                  <SelectItem key={t.value} value={t.value} className="cursor-pointer">
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Market Info Bar */}
          <div className="mb-6 p-3 bg-gradient-to-r from-[#f5faf9] to-[#eef6f6] rounded-none border border-[#004040]/15">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-xs text-slate-500">Current Price</p>
                  {priceLoading || !latestPrice || latestPrice === 0 ? (
                    <div className="flex items-center gap-2">
                      <LoadingSpinner />
                      <span className="text-slate-400">Loading...</span>
                    </div>
                  ) : (
                    <p className="font-bold text-lg">
                      ${latestPrice.toFixed(2)}
                    </p>
                  )}
                </div>
                {!priceLoading && latestPrice && latestPrice > 0 && (
                  <div
                    className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      priceChangePercent >= 0
                        ? "bg-[#e6f2f2] text-[#004040]"
                        : "bg-[#f5eaff] text-[#6c2ab5]"
                    }`}
                  >
                    <TrendingUp
                      className={`w-3 h-3 ${priceChangePercent < 0 ? "rotate-180" : ""}`}
                    />
                    {priceChangePercent >= 0 ? "+" : ""}
                    {priceChangePercent.toFixed(2)}%
                  </div>
                )}
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">24h Change</p>
                {priceLoading || !latestPrice || latestPrice === 0 ? (
                  <p className="text-slate-400 text-sm">--</p>
                ) : (
                  <p
                  className={`font-semibold ${
                      priceChangePercent >= 0
                        ? "text-[#004040]"
                        : "text-[#a7c6ed]"
                    }`}
                  >
                    ${priceChange >= 0 ? "+" : ""}
                    {priceChange.toFixed(2)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Order Type Toggle */}
          <div className="mb-5">
            <label className="block text-xs text-slate-500 mb-1">Order Type</label>
            <div className="flex bg-slate-100 rounded-none p-0.5">
              <button
                type="button"
                onClick={() => setOrderType("market")}
                className={`flex-1 text-sm py-1.5 transition-all ${
                  orderType === "market"
                    ? "bg-white shadow-sm font-medium text-[#004040]"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Market
              </button>
              <button
                type="button"
                onClick={() => setOrderType("limit")}
                className={`flex-1 text-sm py-1.5 transition-all ${
                  orderType === "limit"
                    ? "bg-white shadow-sm font-medium text-[#004040]"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Limit
              </button>
            </div>
          </div>

          {/* Limit Price Input */}
          {orderType === "limit" && (
            <div className="mb-5">
              <label className="block text-xs text-slate-500 mb-1">
                Limit Price (USD)
              </label>
              <input
                type="text"
                value={limitPrice}
                onChange={(e) => setLimitPrice(e.target.value)}
                placeholder={latestPrice ? `e.g. ${latestPrice.toFixed(2)}` : "Enter price"}
                className="border border-[#004040]/30 focus:border-[#004040] rounded-none px-4 py-2.5 w-full bg-white shadow-sm focus:outline-none transition"
              />
              {limitPrice && latestPrice && (
                <p className="text-xs text-slate-400 mt-1">
                  {parseFloat(limitPrice) > latestPrice
                    ? `${((parseFloat(limitPrice) / latestPrice - 1) * 100).toFixed(2)}% above market`
                    : parseFloat(limitPrice) < latestPrice
                      ? `${((1 - parseFloat(limitPrice) / latestPrice) * 100).toFixed(2)}% below market`
                      : "At market price"}
                </p>
              )}
            </div>
          )}

          {tradeType === "buy" ? (
            <>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm text-slate-600">
                    {orderType === "limit" ? "Shares" : "USDC Amount"}
                  </label>
                  {orderType === "limit" && limitPrice && parseFloat(limitPrice) > 0 && (
                    <span className="text-xs text-slate-400">
                      Max: {(Math.floor((usdcBalance / parseFloat(limitPrice)) * 1e6) / 1e6).toFixed(6)} shares
                    </span>
                  )}
                  {orderType === "market" && (
                    <button
                      type="button"
                      onClick={() => setBuyUsdc(String(usdcBalance))}
                      className="text-xs font-medium text-[#004040] hover:underline"
                    >
                      Max
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={buyUsdc}
                  onChange={(e) => setBuyUsdc(e.target.value)}
                  placeholder={orderType === "limit" ? "Enter number of shares" : "Enter USDC amount"}
                  className="border border-[#004040]/30 focus:border-[#004040] rounded-none px-4 py-3 w-full bg-white shadow-sm focus:outline-none transition text-lg"
                />
                {orderType === "limit" && limitPrice && parseFloat(limitPrice) > 0 && (
                  <>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={buyUsdc && parseFloat(limitPrice) > 0
                        ? Math.min(100, Math.round((parseFloat(buyUsdc) / (usdcBalance / parseFloat(limitPrice))) * 100))
                        : 0}
                      onChange={(e) => {
                        const pct = parseInt(e.target.value);
                        const maxShares = usdcBalance / parseFloat(limitPrice);
                        const shares = Math.floor((pct / 100) * maxShares * 1e6) / 1e6;
                        setBuyUsdc(shares > 0 ? shares.toFixed(6) : "");
                      }}
                      className="w-full mt-2 accent-[#004040] h-1.5 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                      <span>0%</span>
                      <span>25%</span>
                      <span>50%</span>
                      <span>75%</span>
                      <span>100%</span>
                    </div>
                    {buyUsdc && (
                      <p className="text-xs text-slate-400 mt-1">
                        Estimated cost: ${(Math.floor(parseFloat(buyUsdc) * parseFloat(limitPrice) * 100) / 100).toFixed(2)} USDC
                      </p>
                    )}
                  </>
                )}
              </div>

              {buyUsdc && latestPrice && latestPrice > 0 && (
                <div className="mb-4 space-y-3">
                  {/* Estimation Summary */}
                  <div className="p-4 rounded-none bg-[#f5faf9] border border-[#004040]/15">
                    <div className="text-sm text-[#004040] mb-3 font-medium">
                      Transaction Summary
                      <span className={`ml-2 text-xs px-1.5 py-0.5 ${orderType === "limit" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"}`}>
                        {orderType === "limit" ? "Limit Order" : "Market Order"}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {orderType === "limit" && limitPrice ? (
                        <>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Shares:</span>
                            <span className="font-semibold">{buyUsdc} {selectedToken}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Limit price:</span>
                            <span className="font-semibold text-amber-700">
                              ${parseFloat(limitPrice).toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Total cost:</span>
                            <span className="font-semibold">
                              ${(Math.floor(parseFloat(buyUsdc) * parseFloat(limitPrice) * 100) / 100).toFixed(2)} USDC
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Trading fee (0.25%):</span>
                            <span className="font-semibold text-orange-600">
                              -{buyFeeUsdc} USDC
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">You receive (est.):</span>
                            <span className="font-bold text-[#004040]">
                              {netReceiveTokens} {selectedToken}
                            </span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">You pay:</span>
                            <span className="font-semibold">{buyUsdc} USDC</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Trading fee (0.25%):</span>
                            <span className="font-semibold text-orange-600">
                              -{buyFeeUsdc} USDC
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">You receive (est.):</span>
                            <span className="font-bold text-[#004040]">
                              {netReceiveTokens} {selectedToken}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Rate:</span>
                            <span className="font-semibold">
                              1 {selectedToken} = ${latestPrice.toFixed(2)}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Risk & Slippage Info */}
                  <div className="p-3 rounded-none bg-orange-50 border border-orange-200">
                    <div className="text-xs text-orange-700 space-y-1">
                      <div className="flex justify-between">
                        <span>Max slippage (1%):</span>
                        <span className="font-semibold">
                          {(parseFloat(netReceiveTokens) * 0.99).toFixed(4)}{" "}
                          {selectedToken}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Network fee:</span>
                        <span className="font-semibold">
                          ~$2.50 (estimated)
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Settlement time:</span>
                        <span className="font-semibold">~15 seconds</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Insufficient balance warning */}
              {insufficientBalance && (
                <div className="mb-4 p-3 rounded-none bg-red-50 border border-red-200">
                  <p className="text-xs text-red-700">
                    Insufficient USDC balance. You need ${buyCost.toFixed(2)} USDC but only have {usdcBalance.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })} USDC.
                  </p>
                </div>
              )}

              {/* Verification Warning */}
              {isKycVerified === false && !kycLoading && (
                <div className="mb-4 p-4 rounded-none bg-amber-50 border border-amber-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-amber-600" />
                    <span className="text-sm font-medium text-amber-800">
                      Verification Required
                    </span>
                  </div>
                  <p className="text-xs text-amber-700">
                    You need to complete verification before you can buy tokens.
                    Please complete the verification process in your profile.
                  </p>
                  <div className="mt-2">
                    <Button size="sm" variant="outline" onClick={handleVerifyKyc}>
                      Verify KYC
                    </Button>
                  </div>
                </div>
              )}

              <Button
                className="w-full mt-4 font-semibold text-lg py-3 bg-[#004040] hover:bg-[#004040]"
                onClick={handleBuy}
                isDisabled={isBuyDisabled}
              >
                {externalIsOrderPending ? (
                  <>
                    <LoadingSpinner />
                    {"Processing..."}
                  </>
                ) : insufficientBalance ? (
                  "Insufficient USDC Balance"
                ) : isKycVerified === false && !kycLoading ? (
                  "KYC Required"
                ) : (
                  orderType === "limit" ? `Place Limit Buy ${selectedToken}` : `Buy ${selectedToken}`
                )}
              </Button>
            </>
          ) : (
            <>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm text-slate-600">
                    {selectedToken} Amount
                  </label>
                  <button
                    type="button"
                    onClick={() => setSellToken(String(tokenBalance))}
                    className="text-xs font-medium text-[#004040] hover:underline"
                  >
                    Sell All
                  </button>
                </div>
                <input
                  type="text"
                  value={sellToken}
                  onChange={(e) => setSellToken(e.target.value)}
                  placeholder={`Enter ${selectedToken} amount`}
                  className="border border-[#004040]/30 focus:border-[#004040] rounded-none px-4 py-3 w-full bg-white shadow-sm focus:outline-none transition text-lg"
                />
              </div>

              {sellToken && latestPrice && latestPrice > 0 && (
                <div className="mb-4 space-y-3">
                  {/* Estimation Summary */}
                  <div className="p-4 rounded-none bg-[#f5faf9] border border-[#004040]/15">
                    <div className="text-sm text-[#004040] mb-3 font-medium">
                      Transaction Summary
                      <span className={`ml-2 text-xs px-1.5 py-0.5 ${orderType === "limit" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"}`}>
                        {orderType === "limit" ? "Limit Order" : "Market Order"}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">You sell:</span>
                        <span className="font-semibold">
                          {sellToken} {selectedToken}
                        </span>
                      </div>
                      {orderType === "limit" && limitPrice && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Limit price:</span>
                          <span className="font-semibold text-amber-700">
                            ${parseFloat(limitPrice).toFixed(2)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Gross amount:</span>
                        <span className="font-semibold">
                          {netReceiveUsdc} USDC
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">
                          Trading fee (0.25%):
                        </span>
                        <span className="font-semibold text-orange-600">
                          -{sellFeeUsdc} USDC
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">
                          You receive (net):
                        </span>
                        <span className="font-bold text-[#004040]">
                          {netReceiveUsdc} USDC
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Rate:</span>
                        <span className="font-semibold">
                          1 {selectedToken} = ${latestPrice.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Risk & Slippage Info */}
                  <div className="p-3 rounded-none bg-orange-50 border border-orange-200">
                    <div className="text-xs text-orange-700 space-y-1">
                      <div className="flex justify-between">
                        <span>Min slippage (1%):</span>
                        <span className="font-semibold">
                          {(parseFloat(netReceiveUsdc) * 0.99).toFixed(2)} USDC
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Network fee:</span>
                        <span className="font-semibold">
                          ~$2.50 (estimated)
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Settlement time:</span>
                        <span className="font-semibold">~15 seconds</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <Button
                className="w-full mt-4 font-semibold text-lg py-3 bg-[#004040] hover:bg-[#004040]"
                onClick={handleSell}
                isDisabled={!sellToken || externalIsOrderPending}
              >
                {externalIsOrderPending ? (
                  <>
                    <LoadingSpinner />
                    {"Processing..."}
                  </>
                ) : (
                  orderType === "limit" ? `Place Limit Sell ${selectedToken}` : `Sell ${selectedToken}`
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default TradeForm;