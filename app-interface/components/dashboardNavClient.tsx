"use client";

import {
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import {
  Trophy,
  Store,
  FlaskConical,
  BarChart3,
  Users,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSidebar } from "@/components/ui/sidebar";
import Image from "next/image";
import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useWallet } from "@solana/wallet-adapter-react";
import { useConnection } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";

export function DashboardSidebarNavClient() {
  const { open } = useSidebar();
  const router = useRouter();
  const pathname = usePathname();
  const { connected, publicKey, disconnect } = useWallet();
  const { connection } = useConnection();
  const { setVisible } = useWalletModal();
  const [balanceSol, setBalanceSol] = useState<string | null>(null);
  const [isBalanceLoading, setIsBalanceLoading] = useState(false);

  const shortAddress = useMemo(() => {
    const base58 = publicKey?.toBase58();
    return base58 ? `${base58.slice(0, 6)}...${base58.slice(-4)}` : null;
  }, [publicKey]);

  useEffect(() => {
    let cancelled = false;
    async function loadBalance() {
      if (!publicKey) {
        setBalanceSol(null);
        return;
      }
      setIsBalanceLoading(true);
      try {
        const lamports = await connection.getBalance(publicKey, { commitment: "confirmed" });
        if (!cancelled) {
          const sol = lamports / 1_000_000_000;
          setBalanceSol(sol.toFixed(3) + " SOL");
        }
      } catch {
        if (!cancelled) setBalanceSol(null);
      } finally {
        if (!cancelled) setIsBalanceLoading(false);
      }
    }
    void loadBalance();
    return () => {
      cancelled = true;
    };
  }, [publicKey, connection]);

  const isActive = (path: string) => {
    if (path === "/app") {
      return pathname === "/app";
    }
    return pathname.startsWith(path);
  };

  return (
    <>
      <SidebarHeader className="p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center">
            <Image
              className="cursor-pointer"
              onClick={() => router.push("/app")}
              src="/Whale.png"
              alt="Spout Finance logo"
              width={32}
              height={32}
            />
          </div>
          {open && (
            <h1
              onClick={() => router.push("/app")}
              className="text-lg font-semibold text-gray-900 cursor-pointer"
            >
              Spout Finance
            </h1>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent className="px-2 py-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive("/app/trade")}>
              <Link href="/app/trade" className="flex items-center gap-3">
                <FlaskConical className="h-4 w-4" />
                <span>Trade</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive("/app/portfolio")}>
              <Link href="/app/portfolio" className="flex items-center gap-3">
                <Trophy className="h-4 w-4" />
                <span>Portfolio</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton className="flex items-center gap-3 opacity-75 cursor-not-allowed">
              <BarChart3 className="h-4 w-4" />
              <span>Earn</span>
              <Badge
                variant="secondary"
                className="ml-auto bg-secondary/20 text-[#004040] border border-secondary"
              >
                Soon
              </Badge>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive("/app/proof-of-reserve")}
              className="flex items-center gap-3 opacity-75 cursor-not-allowed"
            >
              <Link
                href="/app"
                className="flex items-center gap-3"
              >
                <TrendingUp className="h-4 w-4" />
                <span>Proof of Reserve</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton className="flex items-center gap-3 opacity-75 cursor-not-allowed">
              <Store className="h-4 w-4" />
              <span>Markets</span>
              <Badge
                variant="secondary"
                className="ml-auto bg-secondary/20 text-[#004040] border border-secondary"
              >
                Soon
              </Badge>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton className="flex items-center gap-3 ">
              <Link href="/app/profile" className="flex items-center gap-3">
                <Users className="h-4 w-4" />
                <span>Profile</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t">
        <div className="space-y-3">
          {/* Solana connect button or wallet pill */}
          {!connected ? (
            <Button
              onClick={() => setVisible(true)}
              className="mt-3 bg-black text-white text-sm rounded-none px-4 py-2 border border-gray-600/50 hover:bg-black/90 focus:outline-none w-full justify-center"
            >
              Connect Wallet
            </Button>
          ) : (
            <div className="mt-3 flex items-center justify-between gap-3 rounded-none border border-gray-200 bg-gray-50 px-3 py-2">
              <div className="flex min-w-0 items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <div className="flex flex-col min-w-0">
                  <span className="text-xs text-gray-600 truncate">
                    {shortAddress}
                  </span>
                  <span className="text-xs font-medium text-gray-900">
                    {isBalanceLoading ? "Loading…" : balanceSol ?? "—"}
                  </span>
                </div>
              </div>
              <Button
                variant="secondary"
                onClick={() => disconnect()}
                className="shrink-0 text-xs rounded-none"
              >
                Disconnect
              </Button>
            </div>
          )}
          {/* <SignOutButton className="w-full flex items-center gap-3 px-2 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-none transition-colors">
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </SignOutButton> */}
          <div className="text-xs text-gray-500 text-center pt-2 border-t">
            © 2024 Spout Finance
          </div>
        </div>
      </SidebarFooter>
    </>
  );
}

export function DashboardNavbarHeaderClient() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === "/app") {
      return pathname === "/app";
    }
    return pathname.startsWith(path);
  };

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b bg-white px-4">
      <div className="flex items-center gap-2">
        <div className="md:hidden">
          <SidebarTrigger />
        </div>
        <Link
          href="/app"
          className={`ml-2 text-sm cursor-pointer ${
            isActive("/app")
              ? "text-gray-900 font-medium"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Dashboard
        </Link>
      </div>
    </header>
  );
}
