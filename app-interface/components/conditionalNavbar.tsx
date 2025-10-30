"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/navBar";

export function ConditionalNavbar() {
  const pathname = usePathname();

  // Hide navbar when in /app routes
  if (pathname?.startsWith("/app") || pathname?.startsWith("/auth")) {
    return null;
  }

  return <Navbar />;
}

export function ConditionalFooter() {
  const pathname = usePathname();

  // Hide footer when in /app routes
  if (pathname?.startsWith("/app") || pathname?.startsWith("/auth")) {
    return null;
  }

  return null; // Footer is handled in layout
}
