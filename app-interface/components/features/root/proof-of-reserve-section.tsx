import { Waves } from "@/components/wave-background";

export function ProofOfReserveSection() {
  return (
      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-serif font-medium text-slate-900 mb-6">
            Proof of Reserve
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto font-light">
            Every token is fully backed 1:1 by investment-grade bond ETFs, held
            by qualified U.S. custodians for maximum security.
          </p>
        </div>
      </div>
  );
}
