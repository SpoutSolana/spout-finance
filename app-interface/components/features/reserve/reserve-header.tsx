import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";

interface ReserveHeaderProps {
  onRequestReserves: () => void;
  isRequestPending: boolean;
}

export function ReserveHeader({
  onRequestReserves,
  isRequestPending,
}: ReserveHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Proof of Reserve
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Real-time verification of our reserve holdings and backing
        </p>
      </div>
      {/* <div className="flex items-center space-x-4">
        <Button
          onClick={onRequestReserves}
          className="flex items-center space-x-2"
          variant="outline"
        >
          <RefreshCcw
            className={`h-4 w-4 ${isRequestPending ? "animate-spin" : ""}`}
          />
          <span>{isRequestPending ? "Requesting..." : "Request Reserves"}</span>
        </Button>
      </div> */}
    </div>
  );
}
