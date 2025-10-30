"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Wallet,
  Shield,
  TrendingUp,
  BarChart3,
  ArrowRight,
  CheckCircle,
  Zap,
  DollarSign,
} from "lucide-react";
import Link from "next/link";

export function HowItWorksSection() {
  const steps = [
    {
      icon: Wallet,
      title: "Connect & Verify",
      description:
        "Connect your wallet and complete KYC verification to access investment-grade assets",
      color: "blue",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      iconColor: "text-blue-600",
      iconBg: "bg-blue-100",
    },
    {
      icon: Shield,
      title: "Access Bonds",
      description:
        "Browse and select from a curated portfolio of investment-grade corporate bonds",
      color: "emerald",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
      iconColor: "text-emerald-600",
      iconBg: "bg-emerald-100",
    },
    {
      icon: TrendingUp,
      title: "Earn Stable Yields",
      description:
        "Receive consistent returns from underlying bond interest payments",
      color: "purple",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      iconColor: "text-purple-600",
      iconBg: "bg-purple-100",
    },
    {
      icon: BarChart3,
      title: "Track Performance",
      description:
        "Monitor your portfolio with real-time analytics and transparent reporting",
      color: "orange",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      iconColor: "text-orange-600",
      iconBg: "bg-orange-100",
    },
  ];

  const benefits = [
    {
      icon: DollarSign,
      title: "5-8% APY",
      description: "Stable returns from investment-grade bonds",
      color: "text-emerald-600",
    },
    {
      icon: Shield,
      title: "Regulated Assets",
      description: "Backed by real corporate debt obligations",
      color: "text-blue-600",
    },
    {
      icon: Zap,
      title: "Instant Liquidity",
      description: "Trade tokens 24/7 on decentralized exchanges",
      color: "text-purple-600",
    },
    {
      icon: CheckCircle,
      title: "Transparent",
      description: "Real-time proof of reserves verification",
      color: "text-orange-600",
    },
  ];

  return (
    <section className="py-24 bg-gradient-to-b from-white to-slate-50">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge
            variant="secondary"
            className="mb-4 px-4 py-2 text-sm font-medium bg-emerald-100 text-emerald-800 border-emerald-200"
          >
            <Zap className="w-4 h-4 mr-2" />
            How Spout Works
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
            From Traditional Finance to DeFi
          </h2>
          <p className="text-lg text-slate-600 max-w-3xl mx-auto">
            Spout bridges the gap between traditional finance and DeFi by
            tokenizing investment-grade corporate bonds, providing stable yields
            while maintaining the benefits of blockchain technology.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {steps.map((step, index) => {
            const IconComponent = step.icon;
            return (
              <Card
                key={index}
                className={`${step.bgColor} ${step.borderColor} border-2 hover:shadow-lg transition-all duration-300`}
              >
                <CardHeader className="text-center pb-4">
                  <div
                    className={`w-16 h-16 ${step.iconBg} rounded-full flex items-center justify-center mx-auto mb-4`}
                  >
                    <IconComponent className={`w-8 h-8 ${step.iconColor}`} />
                  </div>
                  <div className="flex items-center justify-center mb-2">
                    <Badge variant="outline" className="text-xs">
                      Step {index + 1}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg font-semibold text-slate-800">
                    {step.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-slate-600 text-sm">{step.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {benefits.map((benefit, index) => {
            const IconComponent = benefit.icon;
            return (
              <div
                key={index}
                className="text-center p-6 bg-white rounded-none border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <IconComponent
                  className={`w-8 h-8 mx-auto mb-3 ${benefit.color}`}
                />
                <h3 className="text-lg font-semibold text-slate-800 mb-2">
                  {benefit.title}
                </h3>
                <p className="text-slate-600 text-sm">{benefit.description}</p>
              </div>
            );
          })}
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-emerald-600 to-blue-600 rounded-none p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">
              Ready to Start Earning Stable Yields?
            </h3>
            <p className="text-emerald-100 mb-6 max-w-2xl mx-auto">
              Join thousands of users who are already earning consistent returns
              from investment-grade corporate bonds on the blockchain.
            </p>
            <Link href="/app">
              <Button
                size="lg"
                variant="white"
                className="text-emerald-600 font-semibold hover:bg-white/90"
              >
                Get Started Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
