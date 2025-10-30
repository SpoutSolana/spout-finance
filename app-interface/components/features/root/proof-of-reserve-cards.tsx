import { Card, CardContent } from "@/components/ui/card";

export function ProofOfReserveCards() {
  return (
    <div className="relative z-10 max-w-6xl mx-auto px-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <Card className="bg-white/90 backdrop-blur-md border-emerald-200/30 hover:bg-white/95 transition-all duration-300 rounded-none shadow-lg">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-2xl font-semibold text-slate-900">$2.4B</div>
                <div className="text-slate-600 text-sm">
                  Total Reserve Value
                </div>
              </div>
              <div className="px-4 py-2 rounded-full text-sm font-bold bg-emerald-100 text-emerald-800">
                Verified
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Backing Ratio</span>
                <span className="font-semibold text-slate-900 text-xl">1:1</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Last Audit</span>
                <span className="font-semibold text-slate-900">Today</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/90 backdrop-blur-md border-emerald-200/30 hover:bg-white/95 transition-all duration-300 rounded-none shadow-lg">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-2xl font-semibold text-slate-900">
                  AAA-Rated
                </div>
                <div className="text-slate-600 text-sm">ETF Backing</div>
              </div>
              <div className="px-4 py-2 rounded-full text-sm font-bold bg-blue-100 text-blue-800">
                LQD
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Primary ETF</span>
                <span className="font-semibold text-slate-900 text-xl">LQD</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Custodian</span>
                <span className="font-semibold text-slate-900">
                  U.S. Qualified
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/90 backdrop-blur-md border-emerald-200/30 hover:bg-white/95 transition-all duration-300 rounded-none shadow-lg">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-2xl font-semibold text-slate-900">100%</div>
                <div className="text-slate-600 text-sm">Collateralized</div>
              </div>
              <div className="px-4 py-2 rounded-full text-sm font-bold bg-green-100 text-green-800">
                Secure
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Reserve Type</span>
                <span className="font-semibold text-slate-900 text-xl">Bonds</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Insurance</span>
                <span className="font-semibold text-slate-900">FDIC</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
