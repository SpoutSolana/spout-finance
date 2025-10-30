import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface InvestmentCardProps {
  title: string;
  subtitle: string;
  value: string;
  apy?: string;
  icon?: React.ReactNode;
  className?: string;
  variant?: "default" | "success" | "warning";
}

export function InvestmentCard({
  title,
  subtitle,
  value,
  apy,
  icon,
  className,
  variant = "default",
}: InvestmentCardProps) {
  const variantStyles = {
    default: "border-gray-200 bg-white",
    success: "border-green-200 bg-green-50",
    warning: "border-yellow-200 bg-yellow-50",
  };

  return (
    <Card className={cn("p-4 border-2 transition-all duration-200 hover:shadow-md", variantStyles[variant], className)}>
      <CardContent className="p-0">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="w-8 h-8 flex items-center justify-center text-gray-600">
                {icon}
              </div>
            )}
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
              <p className="text-xs text-gray-600">{subtitle}</p>
            </div>
          </div>
          {apy && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
              {apy}
            </Badge>
          )}
        </div>
        <div className="text-right">
          <p className="text-base font-bold text-gray-900">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
