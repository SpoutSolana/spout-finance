"use client";
import React, { useEffect, useRef, useState, useMemo } from "react";
import { clientCacheHelpers } from "@/lib/cache/client-cache";
import TradeTokenSelector from "@/components/features/trade/tradetokenselector";
import TradeChart from "@/components/features/trade/tradechart";
import TradeForm from "@/components/features/trade/tradeform";
import TransactionModal from "@/components/ui/transaction-modal";
import { useMarketData } from "@/hooks/api/useMarketData";
import { useChainlinkPrice } from "@/hooks/api/useChainlinkPrice";
import { useWallet } from "@solana/wallet-adapter-react";
import { useBalanceUSDC } from "@/hooks/view/useBalanceUSDC";
import { PublicKey } from "@solana/web3.js";
import { toPk } from "@/helpers/publicKeyConverter";
import { usePlaceBuyOrder } from "@/hooks/auth/solana/usePlaceBuyOrder";
import { usePlaceSellOrder } from "@/hooks/auth/solana/usePlaceSellOrder";
import {
  placeAlpacaOrder,
} from "@/hooks/api/useAlpacaOrders";
import { useBackendOrders, cancelBackendOrder } from "@/hooks/api/useBackendOrders";
import { useMarketStatus } from "@/hooks/view/useMarketStatus";
import { useAlpacaPositions } from "@/hooks/api/useAlpacaPositions";

const MINTS: Record<string, PublicKey | null> = {
  SPY: toPk("8yHaFSWNAfZ8um8x1dxxb6dMf3H1DH29tsZCFoTy7QZ"),
};

const USDC_MINT = toPk("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"); // USDC mint (6 decimals)

const TOKENS = [
  { label: "SPY", value: "SPY" },
];

const TradePage = () => {
  const [selectedToken, setSelectedToken] = useState("SPY");
  const [tokenData, setTokenData] = useState<any[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [priceLoading, setPriceLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [buyUsdc, setBuyUsdc] = useState("");
  const [sellToken, setSellToken] = useState("");
  const [tradeType, setTradeType] = useState<"buy" | "sell">("buy");
  const [orderType, setOrderType] = useState<"market" | "limit">("market");
  const [limitPrice, setLimitPrice] = useState("");
  const [chartDataSource, setChartDataSource] = useState<"real" | "mock">(
    "real",
  );
  const [etfData, setEtfData] = useState<any>(null);

  // Chainlink Data Streams V11 price (primary source for SPY)
  const { price: chainlinkPrice, isLoading: chainlinkLoading } = useChainlinkPrice(selectedToken);

  // Alpaca market data (fallback for tokens without Chainlink feeds)
  const { price: mdPrice, isLoading: mdLoading } = useMarketData(selectedToken);

  // Transaction modal state
  const [transactionModal, setTransactionModal] = useState({
    isOpen: false,
    status: "waiting" as "waiting" | "completed" | "failed",
    transactionType: "buy" as "buy" | "sell",
    amount: "",
    receivedAmount: "",
    error: "",
  });
  const { publicKey } = useWallet();
  const userAddress = publicKey?.toBase58() || null;
 console.log("public key of user is:", userAddress)


  const ownerPk = useMemo(() => publicKey ?? null, [publicKey]);
  const tokenMint = useMemo(() => MINTS[selectedToken] ?? null, [selectedToken]);
  const usdcMint = useMemo(() => USDC_MINT, []);
  const usdcBal = useBalanceUSDC(usdcMint, ownerPk);

  // Alpaca positions (live broker account)
  const { getQty: getAlpacaQty, isLoading: alpacaPositionsLoading, refetch: refetchAlpacaPositions } = useAlpacaPositions(selectedToken);

  // Derived balances for UI — token balance from Alpaca, USDC from on-chain
  const tokenBalance = getAlpacaQty(selectedToken);
  const balanceLoading = alpacaPositionsLoading;
  const usdcBalance = usdcBal.amountUi ? parseFloat(usdcBal.amountUi) : 0;
  const usdcLoading = Boolean(usdcBal.isLoading);
  const usdcError = Boolean(usdcBal.error);
  const refetchTokenBalance = refetchAlpacaPositions;
  const refetchUSDCBalance = usdcBal.refetch;

  // Removed useEffect that auto-triggered balance refetch

  const tokenDecimals = 6; // SPY token uses 6 decimals for on-chain amounts

  // US market status
  const marketStatus = useMarketStatus();

  // SpoutOrders on-chain hooks
  const { placeBuyOrder, isSubmitting: isBuySubmitting } = usePlaceBuyOrder();
  const { placeSellOrder, isSubmitting: isSellSubmitting } = usePlaceSellOrder();
  const [isCancelling, setIsCancelling] = useState(false);
  const isOrderPending = isBuySubmitting || isSellSubmitting || isCancelling;

  // Backend orders (polled every 15s) — used for cancel flow
  const { orders: backendOrders, refetch: refetchBackendOrders } = useBackendOrders(userAddress);

  
  useEffect(() => {
    async function fetchETFData() {
      try {
        const data = await clientCacheHelpers.fetchStockData(selectedToken);
        setEtfData(data);
      } catch (error) {}
    }
    fetchETFData();
  }, [selectedToken]);

  useEffect(() => {
    async function fetchChartData() {
      setLoading(true);
      try {
        const json = await clientCacheHelpers.fetchStockData(selectedToken);
        if (json.error) {
          // Don't use mock data, just keep the loading state
          console.log("📊 Chart data error:", json.error);
          setTokenData([]);
          setChartDataSource("real");
        } else {
          setTokenData(json.data || []);
          setChartDataSource(json.dataSource);
        }
      } catch (e) {
        // Don't use mock data, just keep the loading state
        console.log("📊 Chart data fetch error:", e);
        setTokenData([]);
        setChartDataSource("real");
      } finally {
        setLoading(false);
      }
    }
    fetchChartData();
  }, [selectedToken]);

  useEffect(() => {
    // Chainlink is primary price source for SPY; Alpaca/Gold API for others
    async function loadGold() {
      setPriceLoading(true);
      try {
        const url =
          "https://api.metalpriceapi.com/v1/latest?api_key=54ee16f25dba8e9c04459a5da94d415e&base=USD&currencies=EUR,XAU,XAG";
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error(`gold api ${res.status}`);
        const data = await res.json();
        const xauPerUsd = Number(data?.rates?.XAU || 0);
        const usdPerXau = xauPerUsd > 0 ? 1 / xauPerUsd : null;
        setCurrentPrice(usdPerXau);
      } catch (e) {
        setCurrentPrice(null);
      } finally {
        setPriceLoading(false);
      }
    }

    if (selectedToken === "GOLD") {
      void loadGold();
    } else if (chainlinkPrice !== null) {
      // Use Chainlink Data Streams V11 price (SPY)
      setPriceLoading(chainlinkLoading);
      setCurrentPrice(chainlinkPrice);
    } else {
      // Fallback to Alpaca for tokens without Chainlink feeds
      setPriceLoading(mdLoading);
      setCurrentPrice(mdPrice ?? null);
    }
  }, [mdLoading, mdPrice, chainlinkPrice, chainlinkLoading, selectedToken]);

  // Disable automatic token balance refetches; call refetchTokenBalance manually when needed

  // Use chart data as primary source for price calculations
  const chartLatestPrice =
    tokenData.length > 0 ? tokenData[tokenData.length - 1].close : null;
  const chartPrevPrice =
    tokenData.length > 1 ? tokenData[tokenData.length - 2].close : null;

  // Use currentPrice (from market data API) as fallback only if chart data is not available
  const latestPrice = chartLatestPrice || currentPrice || mdPrice || null;
  const prevPrice =
    chartPrevPrice ||
    (tokenData.length > 0
      ? tokenData[tokenData.length - 1].close
      : latestPrice);

  const priceChange = latestPrice && prevPrice ? latestPrice - prevPrice : 0;
  const priceChangePercent =
    prevPrice > 0 && latestPrice
      ? ((latestPrice - prevPrice) / prevPrice) * 100
      : 0;

  const tradingFee = 0.0025;
  const isLimitBuy = orderType === "limit" && !!limitPrice;
  // For limit buy: buyUsdc = shares, cost = shares * limitPrice
  // For market buy: buyUsdc = USDC amount, tokens = usdc / price
  const buyUsdcCost = isLimitBuy
    ? (buyUsdc ? parseFloat(buyUsdc) * parseFloat(limitPrice) : 0)
    : (buyUsdc ? parseFloat(buyUsdc) : 0);
  const estimatedTokens =
    buyUsdc && latestPrice
      ? isLimitBuy
        ? parseFloat(buyUsdc).toFixed(4)
        : (parseFloat(buyUsdc) / latestPrice).toFixed(4)
      : "";
  const estimatedUsdc =
    sellToken && latestPrice
      ? (parseFloat(sellToken) * latestPrice).toFixed(2)
      : "";
  const buyFeeUsdc = buyUsdcCost > 0
    ? (buyUsdcCost * tradingFee).toFixed(2)
    : "";
  const sellFeeUsdc = estimatedUsdc
    ? (parseFloat(estimatedUsdc) * tradingFee).toFixed(2)
    : "";
  const netReceiveTokens = estimatedTokens
    ? (parseFloat(estimatedTokens) * (1 - tradingFee)).toFixed(4)
    : "";
  const displayNetReceiveTokens = netReceiveTokens;
  const netReceiveUsdc = estimatedUsdc
    ? (parseFloat(estimatedUsdc) * (1 - tradingFee)).toFixed(2)
    : "";

  const handleBuy = async () => {
    if (!userAddress || !buyUsdc || !latestPrice || !tokenMint) return;

    // if (!marketStatus.isOpen) {
    //   setTransactionModal({
    //     isOpen: true,
    //     status: "failed",
    //     transactionType: "buy",
    //     amount: `${buyUsdc} USDC`,
    //     receivedAmount: "",
    //     error: `US market is currently ${marketStatus.label.toLowerCase()}. ${marketStatus.nextEvent}.`,
    //   });
    //   return;
    // }

    // For limit orders, buyUsdc is shares (qty); for market orders, it's USDC amount
    const inputNum = parseFloat(buyUsdc);
    const isLimit = orderType === "limit" && limitPrice;
    const usdcAmountNum = isLimit ? inputNum * parseFloat(limitPrice) : inputNum;
    const qtyNum = isLimit ? inputNum : (latestPrice ? inputNum / latestPrice : 0);
    const usdcSmallestUnits = Math.floor(usdcAmountNum * 1e6); // USDC has 6 decimals

    // Show transaction modal
    setTransactionModal({
      isOpen: true,
      status: "waiting",
      transactionType: "buy",
      amount: isLimit ? `${buyUsdc} ${selectedToken}` : `${buyUsdc} USDC`,
      receivedAmount: isLimit ? `$${usdcAmountNum.toFixed(2)}` : displayNetReceiveTokens,
      error: "",
    });

    try {
      // Convert limit price to 18-decimal u128 (matching oracle price_decimals)
      // 0 = market order
      const limitPriceU128 = isLimit
        ? Math.floor(parseFloat(limitPrice) * 1e18)
        : 0;

      console.log("Order params:", {
        orderType,
        limitPrice,
        limitPriceU128,
        usdcSmallestUnits,
        qtyNum,
        selectedToken,
      });

      // 1. Place on-chain order (escrows USDC)
      const { signature: sig, orderId } = await placeBuyOrder({
        ticker: selectedToken,
        usdcAmount: usdcSmallestUnits,
        limitPrice: limitPriceU128,
        tokenMint,
      });
      console.log("Buy order placed on-chain, tx:", sig, "orderId:", orderId.toString());

      // 2. Place corresponding Alpaca broker order (linked via client_order_id)
      try {
        const alpacaOrder = await placeAlpacaOrder({
          symbol: selectedToken,
          side: "buy",
          type: orderType === "limit" ? "limit" : "market",
          time_in_force: orderType === "limit" ? "gtc" : "day",
          // Limit orders use qty (shares); market orders use notional (dollar amount)
          ...(isLimit
            ? { qty: qtyNum }
            : { notional: usdcAmountNum }),
          limit_price: isLimit ? parseFloat(limitPrice) : undefined,
          client_order_id: orderId.toString(),
        });
        console.log("Alpaca order placed, id:", alpacaOrder.id, "status:", alpacaOrder.status);
        refetchBackendOrders();
      } catch (alpacaErr: any) {
        console.error("Alpaca order failed (on-chain order still placed):", alpacaErr.message);
      }
      refetchBackendOrders();

      setBuyUsdc("");
      setTransactionModal((prev) => ({ ...prev, status: "completed" }));
      refetchUSDCBalance();
    } catch (e: any) {
      setTransactionModal((prev) => ({
        ...prev,
        status: "failed",
        error: e?.message || "Transaction failed",
      }));
    }
  };

  const handleSell = async () => {
    if (!userAddress || !sellToken || !latestPrice || !tokenMint) return;

    const sellTokenAmount = parseFloat(sellToken);
    if (sellTokenAmount > tokenBalance) {
      setTransactionModal({
        isOpen: true,
        status: "failed",
        transactionType: "sell",
        amount: `${sellToken} ${selectedToken}`,
        receivedAmount: "",
        error: "Order exceeds balance.",
      });
      return;
    }

    // Convert to smallest units using token decimals, preserving full precision
    const decimals = tokenDecimals || 9;
    const [whole, frac = ""] = sellToken.split(".");
    const paddedFrac = frac.padEnd(decimals, "0").slice(0, decimals);
    const assetSmallestUnits = Number(whole + paddedFrac);

    // Show transaction modal
    setTransactionModal({
      isOpen: true,
      status: "waiting",
      transactionType: "sell",
      amount: `${sellToken} ${selectedToken}`,
      receivedAmount: netReceiveUsdc,
      error: "",
    });

    try {
      const limitPriceU128 = orderType === "limit" && limitPrice
        ? Math.floor(parseFloat(limitPrice) * 1e18)
        : 0;

      console.log("Sell order params:", {
        orderType,
        limitPrice,
        limitPriceU128,
        assetSmallestUnits,
        selectedToken,
      });

      // 1. Place on-chain order
      const { signature: sig, orderId } = await placeSellOrder({
        ticker: selectedToken,
        assetAmount: assetSmallestUnits,
        limitPrice: limitPriceU128,
        tokenMint,
      });
      console.log("Sell order placed on-chain, tx:", sig, "orderId:", orderId.toString());

      // 2. Place corresponding Alpaca broker order (linked via client_order_id)
      try {
        const alpacaOrder = await placeAlpacaOrder({
          symbol: selectedToken,
          side: "sell",
          type: orderType === "limit" ? "limit" : "market",
          time_in_force: orderType === "limit" ? "gtc" : "day",
          qty: sellTokenAmount,
          limit_price: orderType === "limit" && limitPrice ? parseFloat(limitPrice) : undefined,
          client_order_id: orderId.toString(),
        });
        console.log("Alpaca sell order placed, id:", alpacaOrder.id, "status:", alpacaOrder.status);
        refetchBackendOrders();
      } catch (alpacaErr: any) {
        console.error("Alpaca sell order failed (on-chain order still placed):", alpacaErr.message);
      }
      refetchBackendOrders();

      setSellToken("");
      setTransactionModal((prev) => ({ ...prev, status: "completed" }));
      refetchTokenBalance();
    } catch (e: any) {
      setTransactionModal((prev) => ({
        ...prev,
        status: "failed",
        error: e?.message || "Transaction failed",
      }));
    }
  };

  const closeTransactionModal = () => {
    setTransactionModal((prev) => ({ ...prev, isOpen: false }));
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto px-2 md:px-0">
      {/* Page banner */}
      <div className="bg-gradient-to-r from-[#004040] via-[#035a5a] to-[#004040] rounded-none p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.08),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-bold">Trade</h1>
          <p className="text-sm md:text-base text-[#cfe7e7] mt-1">Swap tokens and execute trades instantly with low fees.</p>
        </div>
      </div>

      {/* Test deposit removed */}

      <TradeTokenSelector
        tokens={TOKENS}
        selectedToken={selectedToken}
        setSelectedToken={setSelectedToken}
      />
      <div className="border border-[#004040]/15 bg-white rounded-none shadow-sm">
        <TradeChart
          loading={loading}
          tokenData={tokenData}
          selectedToken={selectedToken}
        />
      </div>
      <div className="rounded-none shadow-sm">
        <TradeForm
        tradeType={tradeType}
        setTradeType={setTradeType}
        orderType={orderType}
        setOrderType={setOrderType}
        limitPrice={limitPrice}
        setLimitPrice={setLimitPrice}
        selectedToken={selectedToken}
        setSelectedToken={setSelectedToken}
        tokens={TOKENS}
        buyUsdc={buyUsdc}
        setBuyUsdc={setBuyUsdc}
        sellToken={sellToken}
        setSellToken={setSellToken}
        latestPrice={latestPrice}
        priceLoading={priceLoading}
        usdcBalance={usdcBalance}
        tokenBalance={tokenBalance}
        usdcLoading={usdcLoading}
        usdcError={usdcError}
        balanceLoading={balanceLoading}
        isOrderPending={isOrderPending}
        handleBuy={handleBuy}
        handleSell={handleSell}
        buyFeeUsdc={buyFeeUsdc}
        netReceiveTokens={netReceiveTokens}
        sellFeeUsdc={sellFeeUsdc}
        netReceiveUsdc={netReceiveUsdc}
        priceChangePercent={priceChangePercent}
        priceChange={priceChange}
        />
      </div>

      {/* Open Orders (from backend /orders/{pubkey} API) — hide filled/cancelled */}
      {backendOrders.filter((o: any) => o.status !== "filled" && o.status !== "cancelled" && o.status !== "canceled").length > 0 && (
        <div className="border border-[#004040]/15 bg-white rounded-none shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Open Orders</h2>
          <div className="space-y-3">
            {backendOrders.filter((o: any) => o.status !== "filled" && o.status !== "cancelled" && o.status !== "canceled").map((order: any) => {
              const isBuy = order.side === "buy" || order.order_type === 0 || order.order_type === "buy";
              const created = order.created_at ? new Date(order.created_at) : null;

              return (
                <div
                  key={order.order_id}
                  className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200"
                >
                  <div className="flex items-center gap-4">
                    <span
                      className={`text-xs font-bold px-2 py-1 ${
                        isBuy
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-orange-100 text-orange-800"
                      }`}
                    >
                      {isBuy ? "BUY" : "SELL"}
                    </span>
                    {order.type && (
                      <span
                        className={`text-xs px-1.5 py-0.5 ${
                          order.type === "limit"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {order.type.toUpperCase()}
                      </span>
                    )}
                    <div>
                      <p className="text-sm font-medium">
                        {order.symbol || selectedToken}
                        {order.limit_price && (
                          <span className="text-slate-400 ml-1">
                            @ ${(parseFloat(order.limit_price) / 1e18).toFixed(2)}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-slate-500">
                        {order.qty ? `${order.qty} shares` : order.notional ? `$${parseFloat(order.notional).toFixed(2)}` : ""}
                        {order.status && ` - ${order.status}`}
                        {created && ` - ${created.toLocaleString()}`}
                      </p>
                    </div>
                  </div>
                  <button
                    disabled={isCancelling}
                    onClick={async () => {
                      setIsCancelling(true);
                      try {
                        // Cancel via backend Alpaca route using order_id
                        await cancelBackendOrder(order.order_id);
                        console.log("Order cancelled via backend, order_id:", order.order_id);

                        refetchBackendOrders();
                        refetchBackendOrders();
                        refetchUSDCBalance();
                      } catch (err: any) {
                        console.error("Cancel failed:", err.message);
                      } finally {
                        setIsCancelling(false);
                      }
                    }}
                    className="text-xs font-medium px-3 py-1.5 border border-red-300 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCancelling ? "Cancelling..." : "Cancel"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={transactionModal.isOpen}
        onClose={closeTransactionModal}
        status={transactionModal.status}
        transactionType={transactionModal.transactionType}
        tokenSymbol={selectedToken}
        amount={transactionModal.amount}
        receivedAmount={transactionModal.receivedAmount}
        error={transactionModal.error}
      />
    </div>
  );
};

export default TradePage;
