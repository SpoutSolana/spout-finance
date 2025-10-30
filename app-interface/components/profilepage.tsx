"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { User, Shield } from "lucide-react";
import KYCFlow from "@/components/kycFlow";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function ProfilePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTab = searchParams?.get("tab") || "profile";
  const [tab, setTab] = useState(initialTab);

  // Keep tab in sync with URL
  useEffect(() => {
    setTab(initialTab);
    if (initialTab !== "kyc") {
      router.replace("/app/profile?tab=kyc");
    }
  }, [initialTab, router]);

  const handleTabChange = (value: string) => {
    if (value === "profile") return;
    setTab(value);
    router.replace(`/app/profile?tab=${value}`);
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-slate-600 via-slate-700 to-slate-800 rounded-none p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_60%_40%,rgba(255,255,255,0.1),transparent_50%)]"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <Badge
              variant="secondary"
              className="bg-white/20 text-white border-white/30 hover:bg-white/20"
            >
              <User className="w-4 h-4 mr-2" />
              Profile
            </Badge>
          </div>
          <h1 className="text-4xl font-bold mb-3">Profile</h1>
          <p className="text-slate-200 text-lg">
            Manage your account preferences, security settings, and platform
            configuration
          </p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={handleTabChange} className="space-y-6">
        <div className={`bg-white rounded-none p-2 shadow-md border-0`}>
          <TabsList className="flex justify-center w-full bg-transparent gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger
                    value="profile"
                    className="flex items-center gap-2 data-[state=active]:bg-slate-100 rounded-none opacity-60 cursor-not-allowed"
                    tabIndex={-1}
                    aria-disabled="true"
                  >
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">Profile</span>
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom" align="center">
                  Coming soon
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TabsTrigger
              value="kyc"
              className="flex items-center gap-2 data-[state=active]:bg-slate-100 rounded-none"
            >
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">KYC</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* KYC Tab (was Notifications) */}
        <TabsContent value="kyc" className="space-y-6">
          <KYCFlow />
        </TabsContent>
      </Tabs>
    </div>
  );
}
