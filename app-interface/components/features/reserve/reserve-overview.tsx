import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Shield } from "lucide-react";

export function ReserveOverview() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Allocation Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Reserve Allocation</CardTitle>
          <CardDescription>
            Distribution of our reserve holdings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-purple-500 rounded"></div>
                <span className="text-sm">Corporate Bonds</span>
              </div>
              <div className="text-sm font-medium">100%</div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-500 h-2 rounded-full"
                style={{ width: "100%" }}
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reserve Status */}
      <Card>
        <CardHeader>
          <CardTitle>Reserve Status</CardTitle>
          <CardDescription>Current verification status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-none">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium">Reserves Verified</span>
              </div>
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-800"
              >
                Active
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-none">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                <span className="font-medium">Custodian Status</span>
              </div>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                Secure
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
