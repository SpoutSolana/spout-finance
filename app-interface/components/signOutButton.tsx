"use client";

import { signOut } from "@/lib/supabase/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface SignOutButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export default function SignOutButton({
  className = "",
  children,
}: SignOutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      const result = await signOut();
      if (result.success) {
        // Redirect to login page after successful sign out
        router.push("/auth/login");
      } else {
        console.error("Sign out failed:", result.error);
      }
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleSignOut}
      disabled={isLoading}
      className={`text-left w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {isLoading ? "Signing out..." : children || "Sign Out"}
    </button>
  );
}
