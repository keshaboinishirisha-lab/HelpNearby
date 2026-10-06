"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { api, MatchItem } from "@/lib/api";
import {
  Sparkles,
  MapPin,
  CheckCircle2,
  XCircle,
  HeartHandshake,
  Award,
  ArrowLeft,
  KeyRound,
  ShieldCheck,
  Clock
} from "lucide-react";

export default function MatchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [match, setMatch] = useState<MatchItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const matchId = Number(params?.id);

  const fetchMatch = () => {
    if (!matchId) return;
    setLoading(true);
    api.getMatch(matchId)
      .then(setMatch)
      .catch(() => setMatch(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMatch();
  }, [matchId]);

  const handleAction = async (action: "accept" | "decline") => {
    if (!match) return;
    setActionLoading(true);
    try {
      const updated = await api.actOnMatch(match.id, action);
      setMatch(updated);
      if (updated.status === "confirmed") {
        router.push(`/handover/${match.id}`);
      }
    } catch (err: any) {
      alert(err.message || "Failed to process match action");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-slate-500">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        Analyzing match parameters...
      </div>
    );
  }

  if (!match) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Match Not Found</h2>
        <p className="text-xs text-slate-500">This match may have expired, or you do not have permission to view it.</p>
        <Link href="/matches" className="inline-block px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold">
          Return to Matches
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back link */}
      <Link
        href="/matches"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to All Matches
      </Link>

      {/* Main Score Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
              Explainable Compatibility Report
            </span>
            <span className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full uppercase">
              Status: {match.status.replace(/_/g, " ")}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Need-Prioritized Match Score: {match.total_score.toFixed(1)} / 100
          </h1>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            Hyperlocal proximity: <strong>{match.distance_km} km away</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          {match.status === "confirmed" ? (
            <Link
              href={`/handover/${match.id}`}
              className="px-5 py-2.5 rounded-2xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition flex items-center gap-2 shadow-md shadow-emerald-600/30"
            >
              <KeyRound className="w-4 h-4" />
              Open Handover & OTP Portal
            </Link>
          ) : match.status !== "declined" && match.status !== "completed" ? (
            <div className="flex gap-2">
              <button
                onClick={() => handleAction("accept")}
                disabled={actionLoading}
                className="px-5 py-2.5 rounded-2xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                Accept Match
              </button>
              <button
                onClick={() => handleAction("decline")}
                disabled={actionLoading}
                className="px-4 py-2.5 rounded-2xl bg-slate-100 text-slate-700 font-semibold text-xs hover:bg-slate-200 transition"
              >
                Decline
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {/* Multi-Factor Score Breakdown */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-600" />
          Transparent Multi-Factor Scoring Weight
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
            <div className="flex justify-between text-xs font-bold text-slate-800">
              <span>Category Compatibility (25%)</span>
              <span className="text-emerald-600">{match.category_score.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${match.category_score}%` }} />
            </div>
            <p className="text-[11px] text-slate-500">Matching resource classification and required conditions.</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
            <div className="flex justify-between text-xs font-bold text-slate-800">
              <span>Distance & Logistics (25%)</span>
              <span className="text-emerald-600">{match.distance_score.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${match.distance_score}%` }} />
            </div>
            <p className="text-[11px] text-slate-500">{match.distance_km} km between approximate neighborhoods.</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
            <div className="flex justify-between text-xs font-bold text-slate-800">
              <span>Need Priority & Urgency (25%)</span>
              <span className="text-amber-600">{match.need_score.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div className="bg-amber-500 h-full rounded-full" style={{ width: `${match.need_score}%` }} />
            </div>
            <p className="text-[11px] text-slate-500">Evaluates urgency, waiting time elapsed, and essentiality.</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
            <div className="flex justify-between text-xs font-bold text-slate-800">
              <span>Community Trust (15%)</span>
              <span className="text-teal-600">{match.trust_score.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div className="bg-teal-500 h-full rounded-full" style={{ width: `${match.trust_score}%` }} />
            </div>
            <p className="text-[11px] text-slate-500">Track record of verified handovers, badges, and positive ratings.</p>
          </div>
        </div>

        {/* Explainable Rationale Bullets */}
        <div className="pt-4 border-t border-slate-100 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Why this match was recommended:
          </h3>
          <ul className="space-y-1.5 text-xs text-slate-700">
            {match.match_rationale?.map((r, i) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{r.replace(/^✓\s*/, "")}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Matched Pair Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Offered Donation</span>
          <h3 className="text-lg font-bold text-slate-900">{match.donation?.title}</h3>
          <p className="text-xs text-slate-600">{match.donation?.description}</p>
          <div className="pt-2 text-xs text-slate-500 space-y-1">
            <p>Condition: <strong className="capitalize">{match.donation?.condition}</strong></p>
            <p>Quantity: <strong>{match.donation?.quantity} {match.donation?.unit}</strong></p>
            <p>Donor: <strong>{match.donation?.donor_name}</strong> ({match.donation?.donor_trust_score?.toFixed(0)} Trust)</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Community Request</span>
          <h3 className="text-lg font-bold text-slate-900">{match.request?.title}</h3>
          <p className="text-xs text-slate-600">{match.request?.description}</p>
          <div className="pt-2 text-xs text-slate-500 space-y-1">
            <p>Urgency: <strong className="uppercase text-amber-600">{match.request?.urgency}</strong></p>
            <p>Requested: <strong>{match.request?.quantity} {match.request?.unit}</strong></p>
            <p>Requester: <strong>{match.request?.requester_name}</strong> ({match.request?.requester_trust_score?.toFixed(0)} Trust)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
