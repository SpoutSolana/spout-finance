"use client";

import { Features } from "@/components/features";
import { PixelTrail } from "@/components/ui/pixel-trail";
import { useScreenSize } from "@/hooks/use-screen-size";

export function FeaturesSection() {
  const screenSize = useScreenSize();
  return (
    <section className="relative py-24 w-full bg-white overflow-hidden">
      <PixelTrail
        fadeDuration={1200}
        delay={300}
        pixelClassName="rounded-none bg-emerald-600/15"
        pixelSize={screenSize.lessThan("md") ? 40 : 60}
      />
      {/* <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:20px_20px]"></div> */}
      <Features />
    </section>
  );
}
