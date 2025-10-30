import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle, Shield } from "lucide-react";

export function ReserveVerification() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Reserve Verification</CardTitle>
        <CardDescription>
          How we ensure transparency and security
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-row justify-center gap-x-24">
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <h4 className="font-semibold mb-2">Daily Audits</h4>
            <p className="text-sm text-gray-600">
              Automated verification of all reserve holdings every 24 hours
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <h4 className="font-semibold mb-2">Custodian Oversight</h4>
            <p className="text-sm text-gray-600">
              All assets held by qualified U.S. custodians with regulatory
              oversight
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
