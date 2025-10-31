"use client";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  TrendingUp,
  Wallet,
  User,
  ArrowRight,
  Activity,
  DollarSign,
  PieChart,
  Zap,
} from "lucide-react";
import { useMarketData } from "@/hooks/api/useMarketData";
// import { useRecentActivity } from "@/hooks/view/onChain/useRecentActivity";
import { Suspense } from "react";
// import PortfolioActivity from "@/components/features/portfolio/portfolioactivity";
import { useWallet } from "@solana/wallet-adapter-react";

function DashboardPage() {
  const { publicKey } = useWallet();
  const tokenBalance = 0;
  const {
    price: currentPrice,
    previousClose,
    isLoading: priceLoading,
    error: priceError,
  } = useMarketData("LQD");
  // const {
  //   activities,
  //   isLoading: activitiesLoading,
  //   hasMore,
  //   loadMore,
  // } = useRecentActivity(userAddress);

  // Format number to 3 decimals, matching portfolio holdings
  const formatNumber = (num: number) => {
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    });
  };
  // Format percentage to 2 decimal places
  const formatPercent = (num: number) => {
    return Number(num.toFixed(2));
  };

  // Portfolio data using actual token balance and market price
  const portfolioValue =
    tokenBalance && currentPrice ? tokenBalance * currentPrice : 0;
  // Calculate daily change based on previous close
  const previousDayValue =
    tokenBalance && previousClose ? tokenBalance * previousClose : 0;
  const dayChange = portfolioValue - previousDayValue;
  const dayChangePercent =
    previousDayValue > 0
      ? ((portfolioValue - previousDayValue) / previousDayValue) * 100
      : 0;

  // Holdings logic (single position if tokenBalance > 0)
  const holdings =
    tokenBalance && tokenBalance > 0
      ? [
          {
            symbol: "SUSC",
            shares: tokenBalance,
            value: portfolioValue,
          },
        ]
      : [];

  const features = [
    {
      title: "Markets",
      description: "Real-time stock prices and market analytics",
      icon: BarChart3,
      href: "/app/markets",
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
      stats: "500+ Stocks",
      soon: true,
    },
    {
      title: "Portfolio",
      description: "Track performance and manage investments",
      icon: TrendingUp,
      href: "/app/portfolio",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      stats: `$${formatNumber(portfolioValue)}`,
      soon: false,
    },
    {
      title: "Trade",
      description: "Swap tokens and execute trades instantly",
      icon: Wallet,
      href: "/app/trade",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      stats: "0.1% Fees",
      soon: false,
    },
    {
      title: "Profile",
      description: "Manage your account and preferences",
      icon: User,
      href: "/app/profile?tab=kyc",
      color: "text-slate-600",
      bgColor: "bg-slate-50",
      borderColor: "border-slate-200",
      stats: "Secure",
      soon: false,
    },
  ];

  const quickStats = [
    {
      title: "Portfolio Value",
      value: `$${formatNumber(portfolioValue)}`,
      change: `${dayChange >= 0 ? "+" : "-"}$${formatNumber(Math.abs(dayChange))} (${dayChangePercent >= 0 ? "+" : "-"}${formatPercent(Math.abs(dayChangePercent))}%)`,
      positive: dayChange >= 0,
      icon: DollarSign,
    },
    {
      title: "Active Positions",
      value: holdings.length.toString(),
      change: "Stocks & Tokens",
      positive: null,
      icon: PieChart,
    },
    {
      title: "Today's P&L",
      value: `${dayChange >= 0 ? "+" : "-"}$${formatNumber(Math.abs(dayChange))}`,
      change: `${dayChangePercent >= 0 ? "+" : "-"}${formatPercent(Math.abs(dayChangePercent))}%`,
      positive: dayChange >= 0,
      icon: TrendingUp,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-[#004040] via-[#035a5a] to-[#004040] rounded-none p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1),transparent_50%)]"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <Badge
              variant="static"
              className="bg-white/20 text-white border-white/30"
            >
              <Zap className="w-4 h-4 mr-2" />
              Live Dashboard
            </Badge>
          </div>
          <h1 className="text-4xl font-bold mb-3">Welcome back</h1>
          <p className="text-[#cfe7e7] text-lg mb-6 max-w-2xl">
            Your portfolio is performing well today. Track your investments,
            execute trades, and stay ahead of the market.
          </p>
          <div className="flex gap-4">
            <Link href="/app/trade">
              <Button
                variant="white"
                className="text-[#004040] font-semibold border border-[#004040] hover:bg-[#004040] hover:text-white"
              >
                Start Trading
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            {/* <Link href="/app/markets">
              <Button variant="white-outline">View Markets</Button>
            </Link> */}
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quickStats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <Card
              key={index}
              className="hover:shadow-lg transition-all duration-300 border border-[#004040]/15 shadow-md"
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-[#e6f2f2] rounded-none">
                    <IconComponent className="h-5 w-5 text-[#004040]" />
                  </div>
                  {stat.positive !== null && (
                    <Badge
                      variant={stat.positive ? "default" : "destructive"}
                      className={`text-xs ${stat.positive ? "bg-[#004040]" : "bg-[#a7c6ed]"}`}
                    >
                      {stat.positive ? "↗" : "↘"}
                    </Badge>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-600">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-slate-900">
                    {stat.value}
                  </p>
                  <p
                    className={`text-sm ${
                      stat.positive === true
                        ? "text-[#004040]"
                        : stat.positive === false
                          ? "text-[#a7c6ed]"
                          : "text-slate-500"
                    }`}
                  >
                    {stat.change}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.map((feature) => {
          const IconComponent = feature.icon;
          const cardContent = (
            <Card
              className={`hover:shadow-xl transition-all duration-300 group border border-[#004040]/15 shadow-md ${feature.soon ? "opacity-60 pointer-events-none" : "cursor-pointer"}`}
            >
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div
                    className={`p-3 bg-[#e6f2f2] rounded-none group-hover:scale-110 transition-transform duration-300`}
                  >
                    <IconComponent className={`h-6 w-6 text-[#004040]`} />
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs border border-[#004040]/20">
                      {feature.stats}
                    </Badge>
                    {feature.soon && (
                      <Badge
                        variant="outline"
                        className="text-xs bg-[#f1e7fb] text-[#6c2ab5] border-[#a7c6ed]"
                      >
                        Soon
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <CardTitle className="text-xl group-hover:text-[#004040] transition-colors">
                    {feature.title}
                  </CardTitle>
                  <CardDescription className="text-slate-600">
                    {feature.description}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center text-[#004040] font-medium text-sm group-hover:translate-x-1 transition-transform duration-300">
                  {feature.soon ? "Coming Soon" : `Open ${feature.title}`}
                  {!feature.soon && <ArrowRight className="ml-2 h-4 w-4" />}
                </div>
              </CardContent>
            </Card>
          );
          return feature.soon ? (
            <div key={feature.title}>{cardContent}</div>
          ) : (
            <Link
              key={feature.title}
              href={feature.href}
              tabIndex={0}
              aria-disabled={false}
            >
              {cardContent}
            </Link>
          );
        })}
      </div>

      {/**
      <PortfolioActivity
        activities={activities}
        activitiesLoading={activitiesLoading}
        hasMore={hasMore}
        loadMore={loadMore}
      />
      */}
    </div>
  );
}

export default function AppPageWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardPage />
    </Suspense>
  );
}
