import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Clock,
  Zap,
  Target,
  Shield,
  Users,
} from "lucide-react";
import { Suspense } from "react";

function EarnPage() {
  const comingSoonFeatures = [
    {
      icon: BarChart3,
      title: "Yield Farming",
      description: "Earn rewards by providing liquidity to trading pairs",
      apy: "12-18%",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      icon: TrendingUp,
      title: "Staking Rewards",
      description: "Stake your tokens for passive income generation",
      apy: "8-15%",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      icon: DollarSign,
      title: "Dividend Tokens",
      description: "Receive regular dividend payments from RWA holdings",
      apy: "5-10%",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      icon: Target,
      title: "Auto-Compounding",
      description: "Automatically reinvest earnings for maximum returns",
      apy: "15-25%",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  const benefits = [
    {
      icon: Shield,
      title: "Secure Protocols",
      description: "Bank-level security for all earning strategies",
    },
    {
      icon: Clock,
      title: "Flexible Terms",
      description: "Choose from various lock-up periods",
    },
    {
      icon: Users,
      title: "Community Driven",
      description: "Governed by token holders",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-orange-600 via-orange-700 to-orange-800 rounded-none p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_60%,rgba(255,255,255,0.1),transparent_50%)]"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <Badge
              variant="secondary"
              className="bg-white/20 text-white border-white/30"
            >
              <Zap className="w-4 h-4 mr-2" />
              Coming Soon
            </Badge>
          </div>
          <h1 className="text-4xl font-bold mb-3">Earn Passive Income</h1>
          <p className="text-orange-100 text-lg mb-6 max-w-2xl">
            Maximize your returns through various DeFi earning strategies.
            Stake, farm, and earn dividends from your RWA holdings.
          </p>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-300" />
              <span className="text-sm">Audited Protocols</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-300" />
              <span className="text-sm">Up to 25% APY</span>
            </div>
          </div>
        </div>
      </div>

      {/* Coming Soon Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {comingSoonFeatures.map((feature, index) => {
          const IconComponent = feature.icon;
          return (
            <Card key={index} className="border-0 shadow-md group">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className={`p-3 ${feature.bgColor} rounded-none`}>
                    <IconComponent className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-emerald-100 text-emerald-700 font-semibold"
                  >
                    {feature.apy} APY
                  </Badge>
                </div>
                <div className="space-y-2">
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription className="text-slate-600">
                    {feature.description}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <Button
                  isDisabled
                  variant="ghost"
                  className="w-full opacity-60 !bg-transparent hover:!bg-transparent active:!bg-transparent focus:!bg-transparent [&_*]:!bg-transparent cursor-default select-none"
                >
                  Coming Soon
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Benefits Section */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl">
            Why Choose Our Earning Platform?
          </CardTitle>
          <CardDescription>
            Built with security, flexibility, and community in mind
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => {
              const IconComponent = benefit.icon;
              return (
                <div
                  key={index}
                  className="text-center p-6 bg-slate-50 rounded-none hover:bg-slate-100 transition-colors"
                >
                  <div className="w-16 h-16 bg-emerald-100 rounded-none flex items-center justify-center mx-auto mb-4">
                    <IconComponent className="h-8 w-8 text-emerald-600" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-sm text-gray-600">{benefit.description}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Roadmap */}
      <Card className="border-0 shadow-md bg-gradient-to-br from-slate-50 to-slate-100">
        <CardHeader>
          <CardTitle className="text-2xl">Development Roadmap</CardTitle>
          <CardDescription>
            Our planned rollout of earning features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-white rounded-none">
              <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
              <div className="flex-1">
                <h4 className="font-semibold">Q1 2024 - Basic Staking</h4>
                <p className="text-sm text-gray-600">
                  Simple token staking with fixed APY rewards
                </p>
              </div>
              <Badge
                variant="secondary"
                className="bg-emerald-100 text-emerald-700"
              >
                In Progress
              </Badge>
            </div>
            <div className="flex items-center gap-4 p-4 bg-white rounded-none">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <h4 className="font-semibold">Q2 2024 - Yield Farming</h4>
                <p className="text-sm text-gray-600">
                  Liquidity provision and farming rewards
                </p>
              </div>
              <Badge variant="secondary">Planned</Badge>
            </div>
            <div className="flex items-center gap-4 p-4 bg-white rounded-none">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <div className="flex-1">
                <h4 className="font-semibold">Q3 2024 - RWA Dividends</h4>
                <p className="text-sm text-gray-600">
                  Real-world asset dividend distribution
                </p>
              </div>
              <Badge variant="secondary">Planned</Badge>
            </div>
            <div className="flex items-center gap-4 p-4 bg-white rounded-none">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <div className="flex-1">
                <h4 className="font-semibold">Q4 2024 - Advanced Strategies</h4>
                <p className="text-sm text-gray-600">
                  Auto-compounding and strategy optimization
                </p>
              </div>
              <Badge variant="secondary">Planned</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Newsletter Signup */}
      <Card className="border-0 shadow-md bg-gradient-to-r from-emerald-600 to-emerald-700 text-white">
        <CardContent className="p-8 text-center">
          <h3 className="text-2xl font-bold mb-3">Stay Updated</h3>
          <p className="text-emerald-100 mb-6 max-w-md mx-auto">
            Be the first to know when our earning features go live. Get
            exclusive early access and bonus rewards.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-none text-gray-900 placeholder-gray-500"
            />
            <Button className="bg-white text-emerald-600 hover:bg-emerald-50 font-semibold px-6">
              Notify Me
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function EarnPageWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EarnPage />
    </Suspense>
  );
}
