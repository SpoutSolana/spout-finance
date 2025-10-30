"use client";

import { useState } from "react";
import { sendPasswordResetEmail } from "@/lib/supabase/auth";
import { Waves } from "@/components/wave-background";
import Image from "next/image";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);
    const result = await sendPasswordResetEmail(email);
    setLoading(false);
    if (result.error) setError(result.error);
    else setMessage("Password reset email sent! Check your inbox.");
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
            Enter your email to receive a password reset link.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-slate-200 rounded-none shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-emerald-50 text-slate-900 text-base"
              placeholder="Enter your email"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 text-white py-3 px-4 rounded-none hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold text-lg shadow-lg"
          >
            {loading ? "Sending..." : "Send Reset Email"}
          </button>
          {message && (
            <div className="text-green-600 text-sm mt-2">{message}</div>
          )}
          {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
        </form>
      </div>
    </div>
  );
}
