"use client";
import React, { useEffect, useRef, useState, useMemo } from "react";
import { clientCacheHelpers } from "@/lib/cache/client-cache";
import TradeTokenSelector from "@/components/features/trade/tradetokenselector";
import TradeChart from "@/components/features/trade/tradechart";
import TradeForm from "@/components/features/trade/tradeform";
import TransactionModal from "@/components/ui/transaction-modal";
import { useMarketData } from "@/hooks/api/useMarketData";
import { useWallet } from "@solana/wallet-adapter-react";
import { useBalanceUSDC } from "@/hooks/view/useBalanceUSDC";
import { useBalanceToken } from "@/hooks/view/useBalanceToken";
import { PublicKey } from "@solana/web3.js";
import { toPk } from "@/helpers/publicKeyConverter";

const MINTS: Record<string, PublicKey | null> = {
  LQD: toPk("ChcZdMV4jwXcvZQUWHEjMqMJBu3v62up2cJqY8CUkSCj"),
  TSLA: null,
  AAPL: null,
  GOLD: null,
};

const USDC_MINT = toPk("Bd8tBm8WNPhmW5FjvAkisw4C9G3NEE7NowEW6VUuMHjW"); // USDC mint (6 decimals)

const TOKENS = [
  { label: "LQD", value: "LQD" },
  { label: "TSLA", value: "TSLA" },
  { label: "AAPL", value: "AAPL" },
  { label: "GOLD", value: "GOLD" },
];

const TradePage = () => {
  const [selectedToken, setSelectedToken] = useState("LQD");
  const [tokenData, setTokenData] = useState<any[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [priceLoading, setPriceLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [buyUsdc, setBuyUsdc] = useState("");
  const [sellToken, setSellToken] = useState("");
  const [tradeType, setTradeType] = useState<"buy" | "sell">("buy");
  const [chartDataSource, setChartDataSource] = useState<"real" | "mock">(
    "real",
  );
  const [etfData, setEtfData] = useState<any>(null);

  // Per-asset market data
  const { price: mdPrice, previousClose: mdPrevClose, isLoading: mdLoading } = useMarketData(selectedToken);

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


  const ownerPk = useMemo(() => publicKey ?? null, [publicKey]);
  const tokenMint = useMemo(() => MINTS[selectedToken] ?? null, [selectedToken]);
  const usdcMint = useMemo(() => USDC_MINT, []);
  const tokenBal = useBalanceToken(tokenMint, ownerPk);
  const usdcBal = useBalanceUSDC(usdcMint, ownerPk);

  // Derived balances for UI
  const tokenBalance = tokenBal.amountUi ? parseFloat(tokenBal.amountUi) : 0;
  const balanceLoading = Boolean(tokenBal.isLoading);
  const usdcBalance = usdcBal.amountUi ? parseFloat(usdcBal.amountUi) : 0;
  const usdcLoading = Boolean(usdcBal.isLoading);
  const usdcError = Boolean(usdcBal.error);
  const refetchTokenBalance = tokenBal.refetch;
  const refetchUSDCBalance = usdcBal.refetch;

  // Removed useEffect that auto-triggered balance refetch

  // Disable on-chain order flow for now; keep form interactions local
  const tokenDecimals = 9;
  const isOrderPending = false;
  const orderError = null as any;

  
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
    // sync local state loading to hook loading for UI
    // Special-case GOLD using Metalprice API if selected
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
    } else {
      setPriceLoading(mdLoading);
      setCurrentPrice(mdPrice ?? null);
    }
  }, [mdLoading, mdPrice, selectedToken]);

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
  const estimatedTokens =
    buyUsdc && latestPrice
      ? (parseFloat(buyUsdc) / latestPrice).toFixed(4)
      : "";
  const estimatedUsdc =
    sellToken && latestPrice
      ? (parseFloat(sellToken) * latestPrice).toFixed(2)
      : "";
  const buyFeeUsdc = buyUsdc
    ? (parseFloat(buyUsdc) * tradingFee).toFixed(2)
    : "";
  const sellFeeUsdc = estimatedUsdc
    ? (parseFloat(estimatedUsdc) * tradingFee).toFixed(2)
    : "";
  const netReceiveTokens = estimatedTokens
    ? (parseFloat(estimatedTokens) * (1 - tradingFee)).toFixed(4)
    : "";
  // Display helper for net received tokens (LQD uses 15 decimals)
  const displayNetReceiveTokens =
    selectedToken === "LQD" && netReceiveTokens
      ? (parseFloat(netReceiveTokens) / 1_000_000_000_000_000).toFixed(6)
      : netReceiveTokens;
  const netReceiveUsdc = estimatedUsdc
    ? (parseFloat(estimatedUsdc) * (1 - tradingFee)).toFixed(2)
    : "";

  const handleBuy = async () => {
    if (!userAddress || !buyUsdc || !latestPrice) return;
    const usdcAmountNum = parseFloat(buyUsdc);
    const amount = BigInt(Math.floor(usdcAmountNum * 1e6));

    const estimatedTokenAmount =
      latestPrice > 0 ? usdcAmountNum / latestPrice : 0;

    // Show transaction modal
    setTransactionModal({
      isOpen: true,
      status: "waiting",
      transactionType: "buy",
      amount: `${buyUsdc} USDC`,
      receivedAmount: displayNetReceiveTokens,
      error: "",
    });

    // Simulate success for demo
    setBuyUsdc("");
    setTransactionModal((prev) => ({ ...prev, status: "completed" }));
    setTimeout(() => {
      setTransactionModal((prev) => ({ ...prev, isOpen: false }));
    }, 3000);
  };

  const handleSell = async () => {
    if (!userAddress || !sellToken || !latestPrice) return;

    // Validate balance before proceeding
    const sellTokenAmount = parseFloat(sellToken);
    if (sellTokenAmount > tokenBalance) {
      console.log("❌ Sell amount exceeds balance:", {
        sellAmount: sellTokenAmount,
        availableBalance: tokenBalance,
      });

      // Show processing status first
      setTransactionModal({
        isOpen: true,
        status: "waiting",
        transactionType: "sell",
        amount: `${sellToken} ${selectedToken}`,
        receivedAmount: "",
        error: "",
      });

      // Wait 3 seconds then show the error
      setTimeout(() => {
        setTransactionModal((prev) => ({
          ...prev,
          status: "failed",
          error:
            "Transaction reverted: Order exceeds balance. You don't have enough SLQD tokens.",
        }));
      }, 3000);

      return;
    }

    // Multiply by token decimals for amount (u128)
    const pow = Math.pow(10, tokenDecimals || 6);
    const tokenAmount = BigInt(Math.floor(sellTokenAmount * pow));

    const estimatedUsdcAmount =
      latestPrice > 0 ? sellTokenAmount * latestPrice : 0;

    // Show transaction modal
    setTransactionModal({
      isOpen: true,
      status: "waiting",
      transactionType: "sell",
      amount: `${sellToken} ${selectedToken}`,
      receivedAmount: netReceiveUsdc,
      error: "",
    });

    // Simulate success for demo
    setSellToken("");
    setTransactionModal((prev) => ({ ...prev, status: "completed" }));
    setTimeout(() => {
      setTransactionModal((prev) => ({ ...prev, isOpen: false }));
    }, 3000);
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
