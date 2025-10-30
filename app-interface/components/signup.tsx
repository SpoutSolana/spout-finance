"use client";

import { useForm } from "react-hook-form";
import { signUpWithProfile } from "@/lib/supabase/auth";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Waves } from "@/components/wave-background";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";

interface SignUpFormData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export default function SignupForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormData>();
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (data: SignUpFormData) => {
    setServerError("");
    setSuccess(false);
    setIsLoading(true);

    try {
      const result = await signUpWithProfile(data);
      if (result.error) {
        setServerError(result.error);
      } else {
        setSuccess(true);
        // Redirect to login page after successful signup
        setTimeout(() => {
          router.push("/auth/login");
        }, 2000);
      }
    } catch (error) {
      setServerError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-white to-emerald-50">
      <Waves className="absolute top-0 left-0 w-full h-full" />
      <div className="w-full max-w-md bg-white rounded-none shadow-2xl border border-emerald-100 p-10 relative z-10">
        <div className="text-center flex flex-col items-center mb-8">
          <Image
            src="/Spout_complete.png"
            alt="Spout Logo"
            width={250}
            height={250}
          />
          <p className="text-slate-600 mt-4 text-lg">
            Create your Spout account and start investing today.
          </p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="firstName"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                First Name
              </label>
              <input
                id="firstName"
                type="text"
                {...register("firstName", {
                  required: "First name is required",
                })}
                className="w-full px-4 py-3 border border-slate-200 rounded-none shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-emerald-50 text-slate-900 text-base"
                placeholder="First Name"
              />
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.firstName.message}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="lastName"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Last Name
              </label>
              <input
                id="lastName"
                type="text"
                {...register("lastName", { required: "Last name is required" })}
                className="w-full px-4 py-3 border border-slate-200 rounded-none shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-emerald-50 text-slate-900 text-base"
                placeholder="Last Name"
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.lastName.message}
                </p>
              )}
            </div>
          </div>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-slate-700 mb-2"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Invalid email address",
                },
              })}
              className="w-full px-4 py-3 border border-slate-200 rounded-none shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-emerald-50 text-slate-900 text-base"
              placeholder="Enter your email"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">
                {errors.email.message}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-slate-700 mb-2"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                {...register("password", {
                  required: "Password is required",
                  minLength: {
                    value: 6,
                    message: "Password must be at least 6 characters",
                  },
                })}
                className="w-full px-4 py-3 border border-slate-200 rounded-none shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-emerald-50 text-slate-900 text-base pr-12"
                placeholder="Create a password"
              />
              <button
                type="button"
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600 focus:outline-none"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <Eye className="w-5 h-5" />
                ) : (
                  <EyeOff className="w-5 h-5" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">
                {errors.password.message}
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={isSubmitting || isLoading}
            className="w-full bg-emerald-600 text-white py-3 px-4 rounded-none hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold text-lg shadow-lg"
          >
            {isSubmitting || isLoading
              ? "Creating Account..."
              : "Create Account"}
          </button>
          {serverError && (
            <div className="bg-red-50 border border-red-200 rounded-none p-3">
              <p className="text-sm text-red-600">{serverError}</p>
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-none p-3">
              <p className="text-sm text-green-600">
                Account created successfully! Redirecting to login...
              </p>
            </div>
          )}
        </form>
        <div className="mt-8 text-center">
          <span className="text-slate-700">Already have an account? </span>
          <Link
            href="/auth/login"
            className="font-semibold text-emerald-600 hover:text-emerald-700"
          >
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  );
}
