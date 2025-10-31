import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity } from "lucide-react";
import React from "react";

type ActivityType = {
  id: string;
  action: "Purchased" | "Sold";
  transactionType: "BUY" | "SELL";
  ticker: string;
  amount: string;
  value: string;
  time: string;
};

type PortfolioActivityProps = {
  activities: ActivityType[];
  activitiesLoading: boolean;
  hasMore: boolean;
  loadMore: () => void;
};

const PortfolioActivity: React.FC<PortfolioActivityProps> = ({
  activities,
  activitiesLoading,
  hasMore,
  loadMore,
}) => {
  return (
    <Card className="border border-slate-200/60 shadow-sm bg-white">
      <CardHeader className="pb-0 border-b border-slate-100/80">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-8 bg-gradient-to-b from-slate-900 to-slate-700 rounded-full"></div>
              <div>
                <CardTitle className="text-lg font-medium text-slate-900 tracking-tight">
                  Transaction history{" "}
                </CardTitle>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge
              variant="outline"
              className="text-xs text-slate-600 border-slate-300"
            >
              LIVE
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {activitiesLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center space-y-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
                <div
                  className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>
              <span className="text-xs text-slate-500 uppercase tracking-wide">
                LOADING TRANSACTION DATA
              </span>
            </div>
          </div>
        ) : !activities || activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-12 h-12 border-2 border-slate-200 rounded-none flex items-center justify-center mb-4">
              <Activity className="h-5 w-5 text-slate-400" />
            </div>
            <p className="text-sm text-slate-600 font-medium mb-1">
              NO TRANSACTION DATA
            </p>
            <p className="text-xs text-slate-400 uppercase tracking-wide">
              HISTORY WILL POPULATE AFTER FIRST TRANSACTION
            </p>
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50/50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500">
              <div className="col-span-1">TYPE</div>
              <div className="col-span-3">TRANSACTION</div>
              <div className="col-span-2">AMOUNT</div>
              <div className="col-span-2">VALUE (USD)</div>
              <div className="col-span-2">TIME</div>
              <div className="col-span-2">STATUS</div>
            </div>

            {/* Transaction Rows */}
            <div className="divide-y divide-slate-100/60">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-slate-50/30 transition-colors duration-150 group"
                >
                  {/* Type Indicator */}
                  <div className="col-span-1 flex items-center">
                    <div
                      className={`w-3 h-3 rounded-none ${
                        activity.action === "Sold"
                          ? "bg-red-500 shadow-red-500/30"
                          : "bg-emerald-500 shadow-emerald-500/30"
                      } shadow-lg`}
                    ></div>
                  </div>

                  {/* Transaction Details */}
                  <div className="col-span-3 flex flex-col justify-center">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-slate-900">
                        {activity.action === "Sold" ? "SOLD" : "PURCHASED"}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-xs px-1.5 py-0.5 h-auto"
                      >
                        {activity.ticker}
                      </Badge>
                    </div>
                    <span className="text-xs text-slate-500 mt-0.5">
                      {activity.transactionType}
                    </span>
                  </div>

                  {/* Amount */}
                  <div className="col-span-2 flex flex-col justify-center">
                    <span className="text-sm text-slate-900">
                      {activity.amount}
                    </span>
                  </div>

                  {/* USD Value */}
                  <div className="col-span-2 flex flex-col justify-center">
                    <span
                      className={`text-sm font-medium ${
                        activity.action === "Sold"
                          ? "text-red-600"
                          : "text-emerald-600"
                      }`}
                    >
                      {activity.value}
                    </span>
                    <span className="text-xs text-slate-500">USD</span>
                  </div>

                  {/* Time */}
                  <div className="col-span-2 flex flex-col justify-center">
                    <span className="text-sm text-slate-900">
                      {activity.time}
                    </span>
                    <span className="text-xs text-slate-500">AGO</span>
                  </div>

                  {/* Status */}
                  <div className="col-span-2 flex items-center">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-slate-600 uppercase tracking-wide">
                        CONFIRMED
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {hasMore && (
              <div className="border-t border-slate-100 bg-slate-50/30">
                <Button
                  variant="ghost"
                  onClick={loadMore}
                  className="w-full h-12 text-xs uppercase tracking-wider text-slate-600 hover:text-slate-900 hover:bg-slate-100/50 transition-all duration-200"
                >
                  LOAD MORE TRANSACTIONS
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default PortfolioActivity;
