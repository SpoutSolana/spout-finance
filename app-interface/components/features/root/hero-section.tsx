"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { JoinMailingList } from "./join-mailing-list";
import { PartnerTicker } from "./partner-ticker";
import { Waves } from "@/components/wave-background";

export function HeroSection() {
  return (
    <section className="w-full flex flex-col items-center justify-center relative min-h-screen bg-white">
      {/* Background grid pattern */}
      {/* <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:20px_20px]"></div> */}
      <Waves />
      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 py-20 flex flex-col items-center justify-center">
        {/* Main content area */}
        <div className="text-center mb-4 mt-20 w-full max-w-4xl">
          <h1 className="text-3xl md:text-5xl font-serif font-medium text-teal-800 mb-8 tracking-tight leading-tight">
            The platform for what&apos;s next in decentralized investing.
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-12 font-light leading-relaxed max-w-3xl mx-auto">
            Spout makes U.S. investment-grade assets like bonds and equities available as secure, yield-bearing tokens, fully backed 1:1 by real ETFs.
          </p>
        </div>

        {/* CTA Button */}
        <div className="flex justify-center mb-20 w-full">
          <Link href="/app">
            <Button
              size="lg"
              className="bg-teal-700 text-white px-10 py-4 text-lg font-semibold rounded-none shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] hover:border-teal-800 border-2 border-teal-700 hover:!bg-teal-800"
            >
              Launch Platform
              <ArrowRight className="ml-3 h-5 w-5" />
            </Button>
          </Link>
        </div>

        {/* Mailing List Section */}
        <div className="w-full max-w-2xl mx-auto mb-20">
          <div className="text-center mb-4">
          <p className="text-base text-gray-700 font-light">
            {"[ JOIN THE PLATFORM THAT\'S MAKING TRADITIONAL FINANCE MORE EFFICIENT ]"}
          </p>
          </div>
          <JoinMailingList />
        </div>

        {/* Partner Ticker */}
        {/* <div className="w-full max-w-5xl mx-auto">
          <PartnerTicker />
        </div> */}
      </div>
    </section>
  );
}
