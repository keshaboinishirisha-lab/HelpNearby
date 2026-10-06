"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api, MatchItem } from "@/lib/api";
import { MatchCard } from "@/components/MatchCard";
import {
  Sparkles,
  Filter,
  HeartHandshake,
  CheckCircle2,
  Clock,
  ArrowRight,
  Info
} from "lucide-react";

export default function MatchesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  const fetchMatches = () => {
    setLoading(true);
    api.getMatches(filter === "all" ? undefined : filter)
      .then(setMatches)
      .catch(() => setMatches([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (user) {
      fetchMatches();
    }
  }, [user, authLoading, filter]);

  const handleAction = async (matchId: number, action: "accept" | "decline") => {
    try {
      await api.actOnMatch(matchId, action);
      fetchMatches();
    } catch (err: any) {
      alert(err.message || "Failed to process match action");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-500">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        Finding intelligent matches...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
              Smart Need-Prioritized Allocation
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Recommended Matches ({matches.length})
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Intelligently scored across Category Compatibility, Distance, Need Urgency, and Community Trust.
          </p>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-sm text-xs font-medium">
          {["all", "suggested", "confirmed", "completed"].map((st) => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`px-3 py-1.5 rounded-lg capitalize transition ${
                filter === st
                  ? "bg-slate-900 text-white font-bold"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Explanatory Banner */}
      <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-emerald-900">
        <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <strong>Transparent Matching:</strong> Matches are computed with a multi-factor formula (Category: 25%, Distance: 25%, Need Priority: 25%, Trust: 15%, Availability: 10%). When both parties accept, a safe handover room is opened with a 6-digit OTP code to verify completion.
        </div>
      </div>

      {/* Matches Grid */}
      {matches.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center max-w-lg mx-auto border border-slate-200 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">No matches found in this category</h3>
          <p className="text-xs text-slate-500">
            Post an item to donate or create a request to trigger new automated matches within your neighborhood radius.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Link
              href="/donations/create"
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition"
            >
              Offer a Donation
            </Link>
            <Link
              href="/requests/create"
              className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition"
            >
              Post a Request
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {matches.map((m) => (
            <MatchCard
              key={m.id}
              match={m}
              currentUserId={user?.id}
              onAction={handleAction}
            />
          ))}
        </div>
      )}
    </div>
  );
}
