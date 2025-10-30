"use client";
import {
  Navbar as ResizableNavbar,
  NavBody,
  NavItems,
  NavbarLogo,
  MobileNav,
  MobileNavHeader,
  MobileNavMenu,
} from "./ui/resizable-navbar";
import React, { useState } from "react";
import Link from "next/link";
import { useAuthContext } from "@/context/AuthContext";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { LogOut } from "lucide-react";
import { signOut } from "@/lib/supabase/auth";
const navItems = [
  { name: "Home", link: "/" },
  { name: "About Us", link: "/company" },
  { name: "Earn", link: "/app/earn", soon: true },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, profile } = useAuthContext();

  const handleSignOut = async () => {
    await signOut();
    window.location.reload();
  };

  const displayName = profile?.first_name
    ? `${profile.first_name} ${profile.last_name ?? ""}`
    : user?.email;

  return (
    <ResizableNavbar>
      <NavBody>
        <NavbarLogo />
        <NavItems items={navItems} />
        {!user && (
          <Link
            href="/auth/login"
            style={{ position: "relative", zIndex: 50 }}
            className="px-4 py-2 rounded-none bg-teal-700 text-white hover:bg-teal-800 transition-colors font-semibold"
          >
            Get Started
          </Link>
        )}
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="px-4 py-2 z-50 rounded-none bg-emerald-50 text-emerald-700 font-semibold hover:bg-emerald-100 transition-colors focus:outline-none">
                {displayName}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem
                onClick={handleSignOut}
                className="text-red-600 cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" /> Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </NavBody>
      <MobileNav>
        <MobileNavHeader>
          <NavbarLogo />
          {/* <MobileNavToggle
            isOpen={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
          /> */}
        </MobileNavHeader>
        <MobileNavMenu isOpen={mobileOpen} onClose={() => setMobileOpen(false)}>
          <NavItems items={navItems} onItemClick={() => setMobileOpen(false)} />
          {/*
          {!user && (
            <Link
              href="/auth/login"
              style={{ position: "relative", zIndex: 50 }}
              className="px-4 py-2 rounded-none bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
            >
              Login
            </Link>
          )}
          */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="block w-full px-4 py-2 rounded-none bg-emerald-50 text-emerald-700 font-semibold mt-2 text-left hover:bg-emerald-100 transition-colors focus:outline-none">
                  {displayName}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="text-red-600 cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </MobileNavMenu>
      </MobileNav>
    </ResizableNavbar>
  );
}
