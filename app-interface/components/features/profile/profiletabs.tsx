"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Shield } from "lucide-react";
import KYCFlow from "@/components/kycFlow";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function ProfileTabs() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTab = searchParams?.get("tab") || "kyc"; // default to KYC
  const [tab, setTab] = useState(initialTab);

  // Keep tab in sync with URL
  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  const handleTabChange = (value: string) => {
    setTab(value);
    router.replace(`/app/profile?tab=${value}`);
  };

  return (
    <Tabs value={tab} onValueChange={handleTabChange} className="space-y-6">
      <div className={`bg-white rounded-none p-2 shadow-md border-0`}>
        <TabsList className="flex justify-center w-full bg-transparent gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger
                  value="profile"
                  className="flex items-center gap-2 data-[state=active]:bg-[#004040]/10 data-[state=active]:text-[#004040] rounded-none"
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
            className="flex items-center gap-2 data-[state=active]:bg-[#004040]/10 data-[state=active]:text-[#004040] rounded-none"
          >
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Verification</span>
          </TabsTrigger>
        </TabsList>
      </div>

      {/* Profile Tab */}
      <TabsContent value="profile" className="space-y-6">
        <div className="text-center py-8 text-gray-500">
          <User className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium mb-2">Profile Settings</h3>
          <p>Profile management features coming soon.</p>
        </div>
      </TabsContent>

      {/* KYC Tab */}
      <TabsContent value="kyc" className="space-y-6">
        <KYCFlow />
      </TabsContent>
    </Tabs>
  );
}
