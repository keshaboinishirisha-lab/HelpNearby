"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { HeartHandshake, Lock, Mail, ArrowRight, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to log in");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (demoEmail: string, demoPass: string = "Password123!") => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
    setLoading(true);
    try {
      await login(demoEmail, demoPass);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Demo login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white mx-auto shadow-md shadow-emerald-500/20">
          <HeartHandshake className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Welcome Back</h1>
        <p className="text-xs text-slate-500">
          Log in to manage your donations, track requests, and verify handovers.
        </p>
      </div>

      {/* One-Click Quick Role Switcher for instant evaluation */}
      <div className="bg-slate-100 p-4 rounded-2xl border border-slate-200 space-y-2">
        <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
          ⚡ 1-Click Role Switcher (Seeded Demo Accounts):
        </span>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => handleQuickDemoLogin("donor@givenearby.org")}
            className="p-2 bg-white rounded-xl border border-slate-200 font-medium text-slate-800 hover:border-emerald-500 hover:text-emerald-700 transition text-left"
          >
            <strong>Elena</strong> (Donor)
          </button>
          <button
            type="button"
            onClick={() => handleQuickDemoLogin("requester@givenearby.org")}
            className="p-2 bg-white rounded-xl border border-slate-200 font-medium text-slate-800 hover:border-emerald-500 hover:text-emerald-700 transition text-left"
          >
            <strong>Marcus</strong> (Requester)
          </button>
          <button
            type="button"
            onClick={() => handleQuickDemoLogin("volunteer@givenearby.org")}
            className="p-2 bg-white rounded-xl border border-slate-200 font-medium text-slate-800 hover:border-emerald-500 hover:text-emerald-700 transition text-left"
          >
            <strong>Sarah</strong> (Volunteer)
          </button>
          <button
            type="button"
            onClick={() => handleQuickDemoLogin("ngo@givenearby.org")}
            className="p-2 bg-white rounded-xl border border-slate-200 font-medium text-slate-800 hover:border-emerald-500 hover:text-emerald-700 transition text-left"
          >
            <strong>Hope NGO</strong> (Shelter)
          </button>
          <button
            type="button"
            onClick={() => handleQuickDemoLogin("admin@givenearby.org", "AdminSecurePassword2026!")}
            className="col-span-2 p-2 bg-slate-900 rounded-xl font-medium text-white hover:bg-slate-800 transition text-center text-xs"
          >
            🛡️ Login as Platform Admin
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
          {error}
        </div>
      )}

      {/* Main Login Form */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.org"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 transition disabled:opacity-50 shadow-md shadow-emerald-600/20"
        >
          {loading ? "Signing In..." : "Sign In to GiveNearby"}
        </button>
      </form>

      <div className="text-center text-xs text-slate-500">
        Don&apos;t have an account yet?{" "}
        <Link href="/register" className="text-emerald-600 font-semibold hover:underline">
          Create an account
        </Link>
      </div>
    </div>
  );
}
