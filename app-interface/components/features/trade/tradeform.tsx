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
import useBuyAssetManual from "@/hooks/auth/solana/useBuyAsset";
import useSellAssetManual from "@/hooks/auth/solana/useSellAsset";

type TradeFormProps = {
  tradeType: "buy" | "sell";
  setTradeType: (type: "buy" | "sell") => void;
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

  // Buy asset hook
  const { buyManual, isSubmitting, error: buyError } = useBuyAssetManual();
  const { sellManual, isSubmitting: isSelling, error: sellError } = useSellAssetManual();

  // Compute what is actually pending
  const isOrderPendingFinal = isSubmitting || externalIsOrderPending;

  // Determine if buy button should be disabled
  const isBuyDisabled = !buyUsdc || isSubmitting || isOrderPendingFinal || isKycVerified !== true || kycLoading;

  // Buy handler
  const handleBuy = async () => {
    // Debug: prove click path
    // eslint-disable-next-line no-console
    console.log('handleBuy clicked', { isKycVerified, kycLoading, isSubmitting, buyUsdc, latestPrice });
    if (isBuyDisabled) return;
    if (!buyUsdc || !latestPrice || !selectedToken) return;
    try {
      await buyManual({
        ticker: selectedToken,
        usdcAmount: Math.round(Number(buyUsdc) * 1_000_000), // assuming form value is in human units
        manualPrice: Math.round(Number(latestPrice) * 1_000_000),
      });
    } catch (e) {
      // error is exposed via buyError; no-op here
    }
  };

  // Sell handler
  const handleSellClick = async () => {
    // eslint-disable-next-line no-console
    console.log('handleSell clicked', { isSelling, sellToken, latestPrice, selectedToken });
    if (!sellToken || !latestPrice || !selectedToken || isSelling) return;
    try {
      await sellManual({
        ticker: selectedToken,
        assetAmount: Math.round(Number(sellToken) * 1_000_000),
        manualPrice: Math.round(Number(latestPrice) * 1_000_000),
      });
    } catch (e) {
      // error is surfaced via sellError
    }
  };

  // Display helper: balances are already human-formatted from hooks
  const displayTokenBalance = tokenBalance;

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
                <ArrowUpCircle className="text-[#a7c6ed] w-6 h-6" />
              )}
              <div>
                <CardTitle className="text-xl">
                  {tradeType === "buy" ? "Buy" : "Sell"} S{selectedToken}
                </CardTitle>
                <CardDescription className="text-sm">
                  {tradeType === "buy"
                    ? `Deposit USDC to receive S${selectedToken}`
                    : `Sell S${selectedToken} for USDC`}
                </CardDescription>
              </div>
            </div>
              <div className="text-right">
              <div className="text-xs text-slate-500">
                {tradeType === "buy"
                  ? "USDC Balance"
                  : `S${selectedToken} Balance`}
              </div>
              <div
                className={`font-bold text-base ${
                  tradeType === "buy" ? "text-[#004040]" : "text-[#a7c6ed]"
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
                      : `${displayTokenBalance.toLocaleString()} S${selectedToken}`}
              </div>
              {/* Show secondary balance */}
              <div className="text-xs text-slate-400 mt-1">
                {tradeType === "buy"
                  ? balanceLoading
                    ? "Loading..."
                    : `${displayTokenBalance.toLocaleString()} S${selectedToken}`
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
                  ? "bg-[#a7c6ed] hover:bg-[#9a5fe3] text-white shadow-lg transform scale-[0.98] ring-2 ring-[#a7c6ed]/30 shadow-[#a7c6ed]/25"
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

          {tradeType === "buy" ? (
            <>
              <div className="mb-4">
                <label className="block text-sm text-slate-600 mb-2">
                  USDC Amount
                </label>
                <input
                  type="text"
                  value={buyUsdc}
                  onChange={(e) => setBuyUsdc(e.target.value)}
                  placeholder="Enter USDC amount"
                  className="border border-[#004040]/30 focus:border-[#004040] rounded-none px-4 py-3 w-full bg-white shadow-sm focus:outline-none transition text-lg"
                />
              </div>

              {buyUsdc && latestPrice && latestPrice > 0 && (
                <div className="mb-4 space-y-3">
                  {/* Estimation Summary */}
                  <div className="p-4 rounded-none bg-[#f5faf9] border border-[#004040]/15">
                    <div className="text-sm text-[#004040] mb-3 font-medium">
                      Transaction Summary
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">You pay:</span>
                        <span className="font-semibold">{buyUsdc} USDC</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">
                          Trading fee (0.25%):
                        </span>
                        <span className="font-semibold text-orange-600">
                          -{buyFeeUsdc} USDC
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">
                          You receive (est.):
                        </span>
                        <span className="font-bold text-[#004040]">
                          {netReceiveTokens} S{selectedToken}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Rate:</span>
                        <span className="font-semibold">
                          1 S{selectedToken} = ${latestPrice.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Risk & Slippage Info */}
                  <div className="p-3 rounded-none bg-orange-50 border border-orange-200">
                    <div className="text-xs text-orange-700 space-y-1">
                      <div className="flex justify-between">
                        <span>Max slippage (1%):</span>
                        <span className="font-semibold">
                          {(parseFloat(netReceiveTokens) * 0.99).toFixed(4)} S
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
                {isOrderPendingFinal ? (
                  <>
                    <LoadingSpinner />
                    {"Processing..."}
                  </>
                ) : isKycVerified === false && !kycLoading ? (
                  "KYC Required"
                ) : (
                  `Buy S${selectedToken}`
                )}
              </Button>
              {buyError && (
                <div className="mt-2 text-xs text-red-600 break-all">{buyError}</div>
              )}
            </>
          ) : (
            <>
              <div className="mb-4">
                <label className="block text-sm text-slate-600 mb-2">
                  S{selectedToken} Amount
                </label>
                <input
                  type="text"
                  value={sellToken}
                  onChange={(e) => setSellToken(e.target.value)}
                  placeholder={`Enter S${selectedToken} amount`}
                  className="border border-[#a7c6ed]/40 focus:border-[#a7c6ed] rounded-none px-4 py-3 w-full bg-white shadow-sm focus:outline-none transition text-lg"
                />
              </div>

              {sellToken && latestPrice && latestPrice > 0 && (
                <div className="mb-4 space-y-3">
                  {/* Estimation Summary */}
                  <div className="p-4 rounded-none bg-[#f5eaff] border border-[#a7c6ed]/30">
                    <div className="text-sm text-[#6c2ab5] mb-3 font-medium">
                      Transaction Summary
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">You sell:</span>
                        <span className="font-semibold">
                          {sellToken} S{selectedToken}
                        </span>
                      </div>
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
                        <span className="font-bold text-[#6c2ab5]">
                          {netReceiveUsdc} USDC
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Rate:</span>
                        <span className="font-semibold">
                          1 S{selectedToken} = ${latestPrice.toFixed(2)}
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
                className="w-full mt-4 font-semibold text-lg py-3 bg-[#a7c6ed] hover:bg-[#9a5fe3]"
                onClick={handleSellClick}
                isDisabled={!sellToken || isSelling}
              >
                {isSelling ? (
                  <>
                    <LoadingSpinner />
                    {"Processing..."}
                  </>
                ) : (
                  `Sell S${selectedToken}`
                )}
              </Button>
              {sellError && (
                <div className="mt-2 text-xs text-red-600 break-all">{sellError}</div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default TradeForm;