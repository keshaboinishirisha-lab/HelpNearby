"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api, MatchItem } from "@/lib/api";
import {
  KeyRound,
  ShieldCheck,
  MapPin,
  CheckCircle2,
  Clock,
  ArrowRight,
  ArrowLeft,
  HeartHandshake
} from "lucide-react";

export default function HandoversListPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [confirmedMatches, setConfirmedMatches] = useState<MatchItem[]>([]);
  const [completedMatches, setCompletedMatches] = useState<MatchItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (user) {
      api.getMatches()
        .then((items) => {
          setConfirmedMatches(items.filter((m) => m.status === "confirmed"));
          setCompletedMatches(items.filter((m) => m.status === "completed"));
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-slate-500">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        Loading your handovers...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      <div>
        <div className="flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-emerald-600" />
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
            Safe Handover Exchange Portal
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
          Your Scheduled & Completed Handovers
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Verify physical exchanges using secure one-time cryptographic 6-digit OTP codes.
        </p>
      </div>

      {/* Active Scheduled Handovers */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Clock className="w-4 h-4 text-teal-600" />
          Active In-Progress Handovers ({confirmedMatches.length})
        </h2>

        {confirmedMatches.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
            No active handovers currently in progress. When you and another community member accept a match, your secure handover room will appear here.
          </div>
        ) : (
          <div className="space-y-3">
            {confirmedMatches.map((m) => (
              <div
                key={m.id}
                className="bg-white p-5 rounded-2xl border border-teal-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-teal-400 transition"
              >
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                    Ready for OTP Verification
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-1.5">
                    {m.donation?.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Donor: <strong>{m.donation?.donor_name}</strong> • Recipient: <strong>{m.request?.requester_name}</strong>
                  </p>
                </div>

                <Link
                  href={`/handover/${m.id}`}
                  className="px-5 py-2.5 rounded-xl bg-teal-600 text-white font-bold text-xs hover:bg-teal-700 transition flex items-center gap-1.5 shadow-sm"
                >
                  <KeyRound className="w-4 h-4" />
                  Open Handover Room →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed Handovers */}
      <div className="space-y-4 pt-4 border-t border-slate-100">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          Completed Transfers ({completedMatches.length})
        </h2>

        {completedMatches.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
            No completed handovers yet.
          </div>
        ) : (
          <div className="space-y-3">
            {completedMatches.map((m) => (
              <div
                key={m.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
              >
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    ✓ Handover Completed
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-1.5">
                    {m.donation?.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Completed on {new Date(m.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Link
                    href={`/ratings/${m.id}`}
                    className="px-4 py-2 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 font-semibold text-xs hover:bg-amber-100 transition"
                  >
                    Feedback
                  </Link>
                  <Link
                    href={`/handover/${m.id}`}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition"
                  >
                    View Record
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
