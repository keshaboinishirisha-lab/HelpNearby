"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api, RequestItem } from "@/lib/api";
import {
  Building2,
  Package,
  PlusCircle,
  MapPin,
  CheckCircle2,
  Users,
  Award,
  ArrowRight
} from "lucide-react";

export default function NGOPortalPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (user) {
      api.getMyRequests()
        .then(setRequests)
        .catch(() => setRequests([]))
        .finally(() => setLoading(false));
    }
  }, [user, authLoading]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* NGO Banner */}
      <div className="bg-gradient-to-r from-teal-900 to-slate-900 text-white p-8 rounded-3xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-teal-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-teal-300">
              Verified Organization & Community Collection Point
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">
            {user?.organization_name || user?.name || "Community Outreach Hub"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Coordinate bulk resource drives, manage neighborhood food pantry needs, and direct local volunteers.
          </p>
        </div>

        <Link
          href="/requests/create"
          className="px-5 py-3 rounded-2xl bg-teal-500 text-slate-950 font-bold text-xs sm:text-sm hover:bg-teal-400 transition flex items-center gap-2"
        >
          <PlusCircle className="w-4 h-4" />
          Post Bulk Need
        </Link>
      </div>

      {/* Active Organization Needs */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Package className="w-5 h-5 text-teal-600" />
          Active Organization Resource Requests ({requests.length})
        </h2>

        {loading ? (
          <div className="text-center py-12 text-slate-500">Loading organization requests...</div>
        ) : requests.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-xs text-slate-500 space-y-2">
            <p className="font-semibold text-slate-700">No bulk requests active right now.</p>
            <p>Post a bulk request for non-perishable pantry items, hygiene kits, or blankets.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {requests.map((r) => (
              <div
                key={r.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                      Need Score: {r.need_priority_score.toFixed(0)}/100
                    </span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {r.status}
                    </span>
                  </div>
                  <h3 className="font-bold text-base text-slate-900 mt-2">{r.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{r.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    Target: <strong>{r.quantity} {r.unit}</strong>
                  </span>
                  <Link
                    href={`/requests/${r.id}`}
                    className="font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1"
                  >
                    View Details <ArrowRight className="w-3.5 h-3.5" />
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
