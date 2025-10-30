import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  text?: string;
  variant?: "spinner" | "dots" | "both" | "whale";
}

const LoadingSpinner = ({
  size = "md",
  className,
  text,
  variant = "spinner",
}: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  const renderSpinner = () => (
    <Loader2 className={cn("animate-spin text-blue-600", sizeClasses[size])} />
  );

  const renderDots = () => (
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
  );

  const renderBoth = () => (
    <div className="flex flex-col items-center space-y-2">
      <Loader2
        className={cn("animate-spin text-blue-600", sizeClasses[size])}
      />
      <div className="flex space-x-1">
        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse"></div>
        <div
          className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse"
          style={{ animationDelay: "0.1s" }}
        ></div>
        <div
          className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse"
          style={{ animationDelay: "0.2s" }}
        ></div>
      </div>
    </div>
  );

  const renderWhale = () => (
    <div className="relative">
      {/* Whale body */}
      <div className="relative w-12 h-6 bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 rounded-full animate-pulse shadow-lg">
        {/* Whale eye */}
        <div className="absolute top-1.5 left-2 w-1.5 h-1.5 bg-white rounded-full animate-pulse shadow-sm">
          <div className="absolute top-0.5 left-0.5 w-0.5 h-0.5 bg-black rounded-full"></div>
        </div>
        {/* Whale spout */}
        <div
          className="absolute -top-1.5 left-4.5 w-0.5 h-2 bg-blue-300 rounded-full animate-bounce shadow-sm"
          style={{ animationDelay: "0.5s" }}
        ></div>
        {/* Water droplets */}
        <div
          className="absolute -top-3 left-4 w-0.5 h-0.5 bg-blue-200 rounded-full animate-bounce opacity-70"
          style={{ animationDelay: "0.3s" }}
        ></div>
        <div
          className="absolute -top-2.5 left-5.5 w-0.5 h-0.5 bg-blue-200 rounded-full animate-bounce opacity-50"
          style={{ animationDelay: "0.7s" }}
        ></div>
        <div
          className="absolute -top-4 left-5 w-0.5 h-0.5 bg-blue-200 rounded-full animate-bounce opacity-90"
          style={{ animationDelay: "0.1s" }}
        ></div>
        {/* Additional smaller droplets */}
        <div
          className="absolute -top-2 left-3.5 w-0.25 h-0.25 bg-blue-100 rounded-full animate-bounce opacity-60"
          style={{ animationDelay: "0.4s" }}
        ></div>
        <div
          className="absolute -top-3.5 left-4.5 w-0.25 h-0.25 bg-blue-100 rounded-full animate-bounce opacity-80"
          style={{ animationDelay: "0.6s" }}
        ></div>
      </div>
      {/* Whale tail */}
      <div
        className="absolute -right-1.5 top-0.5 w-3 h-4 bg-gradient-to-r from-blue-500 to-blue-700 rounded-l-full transform rotate-12 animate-pulse shadow-md"
        style={{ animationDelay: "0.2s" }}
      ></div>
      {/* Whale fin */}
      <div
        className="absolute top-1 left-1 w-1 h-2 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full transform rotate-45 animate-pulse opacity-80"
        style={{ animationDelay: "0.3s" }}
      ></div>
    </div>
  );

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className="flex flex-col items-center space-y-2">
        {variant === "spinner" && renderSpinner()}
        {variant === "dots" && renderDots()}
        {variant === "both" && renderBoth()}
        {variant === "whale" && renderWhale()}
        {text && <p className="text-sm text-gray-600 animate-pulse">{text}</p>}
      </div>
    </div>
  );
};

export { LoadingSpinner };
