"use client";

import { Button } from "@/components/ui/button";
import { InvestmentCard } from "@/components/ui/investment-card";
import { Badge } from "@/components/ui/badge";
import { Play, Folder, CheckCircle, TrendingUp, DollarSign } from "lucide-react";

export default function HowSpoutWorksPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-teal-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl md:text-4xl font-serif font-bold text-teal-800 mb-4">
                How Spout Works
              </h1>
              <p className="text-base text-gray-600 max-w-3xl">
                Spout bridges the gap between traditional finance and DeFi by tokenizing investment-grade corporate bonds, 
                providing stable yields while maintaining the benefits of blockchain technology.
              </p>
            </div>
            <Button className="bg-teal-700 hover:bg-teal-800 text-white px-6 py-3 rounded-none">
              <Play className="w-4 h-4 mr-2" />
              Watch Demo
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        {/* Step 1 */}
        <div className="mb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-4 mb-6">
                <Badge className="bg-blue-100 text-blue-800 px-3 py-1 text-sm font-medium">
                  STEP 1
                </Badge>
                <h2 className="text-2xl font-serif font-bold text-teal-800">
                  Total Reserve Value
                </h2>
              </div>
              <p className="text-base text-gray-600 mb-8">
                Connect your wallet and complete KYC verification to access investment-grade assets.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <InvestmentCard
                title="CORPORATE-A-RATED"
                subtitle="$25.7M Available"
                value="6.2% APY"
                icon={<Folder className="w-5 h-5" />}
                variant="default"
              />
              <InvestmentCard
                title="TREASURY-BOND-2024"
                subtitle="$18.3M Available"
                value="5.8% APY"
                icon={<Folder className="w-5 h-5" />}
                variant="default"
              />
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="mb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <div className="grid grid-cols-1 gap-4">
                <InvestmentCard
                  title="CORP-DEBT-A1"
                  subtitle="$12.4M Total Value"
                  value=""
                  icon={<CheckCircle className="w-5 h-5" />}
                  variant="success"
                />
                <InvestmentCard
                  title="BOND-MS-2024"
                  subtitle="$2.1M Total Value"
                  value=""
                  icon={<CheckCircle className="w-5 h-5" />}
                  variant="success"
                />
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="flex items-center gap-4 mb-6">
                <Badge className="bg-blue-100 text-blue-800 px-3 py-1 text-sm font-medium">
                  STEP 2
                </Badge>
                <h2 className="text-2xl font-serif font-bold text-teal-800">
                  Access Public Equities
                </h2>
              </div>
              <p className="text-base text-gray-600 mb-8">
                Browse and select from a curated portfolio of investment-grade corporate bonds.
              </p>
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="mb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-4 mb-6">
                <Badge className="bg-blue-100 text-blue-800 px-3 py-1 text-sm font-medium">
                  STEP 3
                </Badge>
                <h2 className="text-2xl font-serif font-bold text-teal-800">
                  Earn Stable Yields
                </h2>
              </div>
              <p className="text-base text-gray-600 mb-8">
                Receive consistent returns from underlying bond interest payments.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <InvestmentCard
                title="ANALYTICS-DASH-01"
                subtitle="Portfolio Up"
                value="12.4%"
                icon={<TrendingUp className="w-5 h-5" />}
                variant="success"
              />
              <InvestmentCard
                title="PERFORMANCE-VIEW-2"
                subtitle="Risk Score"
                value="Low"
                icon={<TrendingUp className="w-5 h-5" />}
                variant="default"
              />
            </div>
          </div>
        </div>

        {/* Step 4 */}
        <div className="mb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <div className="grid grid-cols-1 gap-4">
                <InvestmentCard
                  title="BORROW-POSITION-B2"
                  subtitle="$45K Borrowed Against"
                  value="65% LTV Ratio"
                  icon={<DollarSign className="w-5 h-5" />}
                  variant="warning"
                />
                <InvestmentCard
                  title="YIELD-FARMING-X1"
                  subtitle="$156K Staked"
                  value="11.7% Combined APY"
                  icon={<DollarSign className="w-5 h-5" />}
                  variant="success"
                />
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="flex items-center gap-4 mb-6">
                <Badge className="bg-blue-100 text-blue-800 px-3 py-1 text-sm font-medium">
                  STEP 4
                </Badge>
                <h2 className="text-2xl font-serif font-bold text-teal-800">
                  Track Performance
                </h2>
              </div>
              <p className="text-base text-gray-600 mb-8">
                Monitor your portfolio with real-time analytics and transparent reporting.
              </p>
            </div>
          </div>
        </div>

        {/* Step 5 */}
        <div className="mb-20">
          <div className="text-center">
            <div className="flex items-center justify-center gap-4 mb-6">
              <Badge className="bg-blue-100 text-blue-800 px-3 py-1 text-sm font-medium">
                STEP 5
              </Badge>
              <h2 className="text-2xl font-serif font-bold text-teal-800">
                Utilize in DeFi
              </h2>
            </div>
            <p className="text-base text-gray-600 max-w-3xl mx-auto">
              Use your tokenized assets in DeFi protocols for lending, borrowing, and yield farming.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
