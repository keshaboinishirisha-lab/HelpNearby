"use client";

import React from "react";
import Link from "next/link";
import { MatchItem } from "@/lib/api";
import { Sparkles, MapPin, CheckCircle2, Shield, HeartHandshake, ArrowRight, XCircle } from "lucide-react";

interface MatchCardProps {
  match: MatchItem;
  currentUserId?: number;
  onAction?: (matchId: number, action: "accept" | "decline") => void;
}

export function MatchCard({ match, currentUserId, onAction }: MatchCardProps) {
  const isHighMatch = match.total_score >= 80;
  const isMedMatch = match.total_score >= 60 && match.total_score < 80;

  const scoreBadgeBg = isHighMatch
    ? "bg-emerald-500 text-white"
    : isMedMatch
    ? "bg-amber-500 text-white"
    : "bg-slate-600 text-white";

  const isConfirmed = match.status === "confirmed";
  const isCompleted = match.status === "completed";

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition p-5 flex flex-col justify-between">
      <div>
        {/* Header: Score & Status */}
        <div className="flex justify-between items-start gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide flex items-center gap-1 shadow-sm ${scoreBadgeBg}`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              {match.total_score.toFixed(0)}% Match
            </span>
            <span className="text-xs font-medium text-slate-500 flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-full">
              <MapPin className="w-3 h-3 text-slate-400" />
              {match.distance_km} km away
            </span>
          </div>

          <span
            className={`text-[11px] font-semibold uppercase px-2.5 py-0.5 rounded-full ${
              isCompleted
                ? "bg-emerald-100 text-emerald-800"
                : isConfirmed
                ? "bg-teal-100 text-teal-800 animate-pulse"
                : match.status === "declined"
                ? "bg-rose-100 text-rose-700"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            {match.status.replace(/_/g, " ")}
          </span>
        </div>

        {/* Matched Pair Presentation */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Available Donation
            </span>
            <p className="text-sm font-semibold text-slate-900 mt-0.5 line-clamp-1">
              {match.donation?.title || "Donated Item"}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Offered by: <span className="font-medium text-slate-700">{match.donation?.donor_name || "Community Donor"}</span>
            </p>
          </div>

          <div className="sm:border-l sm:border-slate-200 sm:pl-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Matched Community Need
            </span>
            <p className="text-sm font-semibold text-slate-900 mt-0.5 line-clamp-1">
              {match.request?.title || "Requested Item"}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Urgency:{" "}
              <span className="font-semibold text-amber-600 uppercase text-[11px]">
                {match.request?.urgency || "Standard"}
              </span>
            </p>
          </div>
        </div>

        {/* Explainable Match Rationale */}
        <div className="mt-3.5 space-y-1.5">
          <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
            Why this match was recommended:
          </span>
          <ul className="text-xs text-slate-600 space-y-1">
            {match.match_rationale && match.match_rationale.length > 0 ? (
              match.match_rationale.map((bullet, idx) => (
                <li key={idx} className="flex items-start gap-1.5 text-slate-700">
                  <span className="text-emerald-600 font-bold shrink-0">✓</span>
                  <span>{bullet.replace(/^✓\s*/, "")}</span>
                </li>
              ))
            ) : (
              <li className="text-slate-400 italic">Compatible category and location proximity.</li>
            )}
          </ul>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-5 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
        {isConfirmed ? (
          <Link
            href={`/handover/${match.id}`}
            className="w-full text-center py-2 px-4 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition flex items-center justify-center gap-1.5 shadow-sm"
          >
            <HeartHandshake className="w-4 h-4" />
            Go to Safe Handover & OTP Portal
          </Link>
        ) : isCompleted ? (
          <div className="text-xs font-medium text-emerald-700 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Handover Verified & Completed!
          </div>
        ) : (
          <>
            {onAction && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => onAction(match.id, "accept")}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition flex items-center justify-center gap-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Accept Match
                </button>
                <button
                  onClick={() => onAction(match.id, "decline")}
                  className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
                  title="Decline"
                >
                  Decline
                </button>
              </div>
            )}
            <Link
              href={`/matches/${match.id}`}
              className="text-xs font-medium text-slate-600 hover:text-emerald-600 flex items-center gap-1 ml-auto"
            >
              View Full Score Analysis <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
