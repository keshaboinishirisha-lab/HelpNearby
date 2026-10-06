"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api, RequestItem } from "@/lib/api";
import { Clock, PlusCircle, ArrowLeft, ArrowRight, Sparkles } from "lucide-react";

export default function MyRequestsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    api.getMyRequests()
      .then(setRequests)
      .catch(() => setRequests([]))
      .finally(() => setLoading(false));
  }, [user, router]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            My Community Requests ({requests.length})
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track your open needs and monitor incoming donation matches.
          </p>
        </div>

        <Link
          href="/requests/create"
          className="px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold text-xs sm:text-sm hover:bg-slate-800 transition flex items-center gap-1.5"
        >
          <PlusCircle className="w-4 h-4 text-amber-400" /> New Request
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-500">Loading your requests...</div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3 max-w-md mx-auto">
          <Clock className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="font-bold text-slate-800">No requests posted yet</h3>
          <p className="text-xs text-slate-500">
            If you or your family need items, post an urgent request and our algorithm will match you with nearby donors.
          </p>
          <Link
            href="/requests/create"
            className="inline-block px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold"
          >
            Post Your First Request
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div
              key={req.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-emerald-300 transition"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                    {req.urgency} Urgency
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Need Score: {req.need_priority_score.toFixed(0)}/100
                  </span>
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {req.status}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-1">{req.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Needed: {req.quantity} {req.unit} • Max Radius: {req.max_distance_km} km
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/requests/${req.id}`}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  View Details
                </Link>
                <Link
                  href="/matches"
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold hover:bg-emerald-100"
                >
                  View Matches
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
