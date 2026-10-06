"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { api, RequestItem } from "@/lib/api";
import {
  Sparkles,
  MapPin,
  Clock,
  Award,
  HeartHandshake,
  ArrowLeft,
  Lock,
  CheckCircle2
} from "lucide-react";

export default function RequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const requestId = Number(params?.id);
  const [requestItem, setRequestItem] = useState<RequestItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!requestId) return;
    setLoading(true);
    api.getRequest(requestId)
      .then(setRequestItem)
      .catch(() => setRequestItem(null))
      .finally(() => setLoading(false));
  }, [requestId]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-slate-500">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        Loading request details...
      </div>
    );
  }

  if (!requestItem) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Request Not Found</h2>
        <p className="text-xs text-slate-500">This request may have been fulfilled or closed.</p>
        <Link href="/browse/requests" className="inline-block px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold">
          Back to Browse Requests
        </Link>
      </div>
    );
  }

  const isOwner = user?.id === requestItem.requester_id;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <Link
        href="/browse/requests"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Community Requests
      </Link>

      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                  requestItem.urgency === "emergency"
                    ? "bg-rose-100 text-rose-700 animate-pulse"
                    : requestItem.urgency === "high"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                {requestItem.urgency} Urgency
              </span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                Need Priority Score: {requestItem.need_priority_score.toFixed(0)} / 100
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
              {requestItem.title}
            </h1>
          </div>

          <span className="text-xs font-semibold px-3 py-1 rounded-full uppercase bg-slate-100 text-slate-700">
            Status: {requestItem.status}
          </span>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed">
          {requestItem.description}
        </p>

        {/* Breakdown of Need Factor */}
        <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200 space-y-2 text-xs text-amber-900">
          <span className="font-bold flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-600" />
            Why this request has a {requestItem.need_priority_score.toFixed(0)}/100 Need Priority:
          </span>
          <ul className="space-y-1 text-amber-800 list-disc pl-5">
            <li>Urgency classification evaluated as <strong>{requestItem.urgency.toUpperCase()}</strong>.</li>
            <li>Category essentiality for {requestItem.category?.name || "daily living"}.</li>
            <li>Modest, equitable scale ({requestItem.quantity} {requestItem.unit}) to prevent hoarding.</li>
          </ul>
        </div>

        {/* Location & Requester Information */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2 border-t border-slate-100">
          <div className="space-y-1">
            <span className="text-slate-400 font-medium">Approximate Neighborhood</span>
            <p className="font-semibold text-slate-800 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              {requestItem.approx_address}
            </p>
            <p className="text-[10px] text-slate-400">
              🔒 Exact coordinates unlocked upon mutual handover confirmation.
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 font-medium">Requested By</span>
            <p className="font-semibold text-slate-800">
              {requestItem.requester_name || "Community Member"}
              <span className="text-[10px] text-emerald-700 font-bold ml-1.5">
                ({requestItem.requester_trust_score?.toFixed(0)} Trust Score)
              </span>
            </p>
            <p className="text-[10px] text-slate-400">
              Verified community participant.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 border-t border-slate-100">
          {isOwner ? (
            <div className="text-xs text-slate-500 font-medium text-center">
              This is your request. Check your dashboard for incoming donation matches!
            </div>
          ) : (
            <Link
              href="/donations/create"
              className="w-full py-3.5 rounded-2xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2"
            >
              <HeartHandshake className="w-4 h-4" />
              Offer a Donation to Fulfill This Request
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
