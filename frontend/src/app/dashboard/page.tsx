"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api, Donation, RequestItem, MatchItem, Handover } from "@/lib/api";
import { MatchCard } from "@/components/MatchCard";
import {
  HeartHandshake,
  Sparkles,
  PlusCircle,
  Package,
  Clock,
  CheckCircle2,
  MapPin,
  Award,
  KeyRound,
  Shield,
  Truck,
  Building2,
  ArrowRight
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [donations, setDonations] = useState<Donation[]>([]);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    if (user) {
      Promise.all([
        api.getMyDonations().catch(() => []),
        api.getMyRequests().catch(() => []),
        api.getMatches().catch(() => []),
      ]).then(([dons, reqs, matchItems]) => {
        setDonations(dons);
        setRequests(reqs);
        setMatches(matchItems);
        setLoading(false);
      });
    }
  }, [user, authLoading, router]);

  const handleMatchAction = async (matchId: number, action: "accept" | "decline") => {
    try {
      await api.actOnMatch(matchId, action);
      // Refresh matches
      const updated = await api.getMatches();
      setMatches(updated);
    } catch (err: any) {
      alert(err.message || "Failed to process match action");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-500">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        Loading your community dashboard...
      </div>
    );
  }

  const activeDonations = donations.filter((d) => d.status === "available" || d.status === "matched");
  const activeRequests = requests.filter((r) => r.status === "open" || r.status === "matched");
  const pendingHandovers = matches.filter((m) => m.status === "confirmed");
  const suggestedMatches = matches.filter((m) => m.status === "suggested" || m.status === "accepted_by_donor" || m.status === "accepted_by_recipient");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Welcome & Trust Summary */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
              Community Member Portal
            </span>
            <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full capitalize">
              Role: {user?.role.replace("_", " & ")}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-xs text-slate-500 flex items-center gap-1.5 pt-0.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            Area: {user?.approx_address || "San Francisco, CA"}
          </p>
        </div>

        {/* Trust Score Box */}
        <div className="flex items-center gap-4 bg-emerald-50 border border-emerald-200 p-4 rounded-2xl">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
              Verified Trust Score
            </span>
            <span className="text-2xl font-extrabold text-emerald-950">
              {user?.trust_score.toFixed(1)} <span className="text-xs font-normal text-emerald-700">/ 100</span>
            </span>
            <p className="text-[11px] text-emerald-700 font-medium">
              ★ {user?.verification_status.toUpperCase()} Participant
            </p>
          </div>
        </div>
      </div>

      {/* Role-Specific Portal Shortcuts */}
      {(user?.role === "volunteer" || user?.role === "ngo" || user?.role === "admin") && (
        <div className="bg-slate-900 text-white rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              {user.role === "volunteer" && <Truck className="w-5 h-5 text-indigo-400" />}
              {user.role === "ngo" && <Building2 className="w-5 h-5 text-teal-400" />}
              {user.role === "admin" && <Shield className="w-5 h-5 text-emerald-400" />}
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Authorized Organization Portal
              </p>
              <p className="text-sm font-semibold">
                Access your specialized tools for {user.role === "volunteer" ? "Volunteer Delivery Tasks" : user.role === "ngo" ? "NGO Bulk Resources" : "Admin Moderation"}
              </p>
            </div>
          </div>
          <Link
            href={user.role === "volunteer" ? "/volunteer" : user.role === "ngo" ? "/ngo" : "/admin"}
            className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition"
          >
            Open Portal →
          </Link>
        </div>
      )}

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/donations/create"
          className="bg-emerald-600 text-white p-5 rounded-2xl shadow-sm hover:bg-emerald-700 transition flex items-center justify-between group"
        >
          <div>
            <span className="text-xs font-medium text-emerald-100 block">Give an item</span>
            <span className="text-lg font-bold">New Donation</span>
          </div>
          <PlusCircle className="w-8 h-8 text-emerald-200 group-hover:scale-110 transition" />
        </Link>

        <Link
          href="/requests/create"
          className="bg-slate-900 text-white p-5 rounded-2xl shadow-sm hover:bg-slate-800 transition flex items-center justify-between group"
        >
          <div>
            <span className="text-xs font-medium text-slate-300 block">Ask community</span>
            <span className="text-lg font-bold">New Request</span>
          </div>
          <Sparkles className="w-8 h-8 text-amber-400 group-hover:scale-110 transition" />
        </Link>

        <Link
          href="/matches"
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-400 transition flex items-center justify-between group"
        >
          <div>
            <span className="text-xs font-medium text-slate-400 block">Matches Found</span>
            <span className="text-lg font-bold text-slate-900">{suggestedMatches.length} Opportunities</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-sm">
            {suggestedMatches.length}
          </div>
        </Link>

        <Link
          href="/handover"
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-400 transition flex items-center justify-between group"
        >
          <div>
            <span className="text-xs font-medium text-slate-400 block">Pending Handovers</span>
            <span className="text-lg font-bold text-slate-900">{pendingHandovers.length} In Progress</span>
          </div>
          <KeyRound className="w-7 h-7 text-teal-600 group-hover:scale-110 transition" />
        </Link>
      </div>

      {/* Pending Confirmed Handovers Banner */}
      {pendingHandovers.length > 0 && (
        <div className="bg-teal-50 border border-teal-200 rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-teal-700" />
            <h3 className="font-bold text-teal-950 text-base">
              Active Handovers in Progress ({pendingHandovers.length})
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingHandovers.map((m) => (
              <div
                key={m.id}
                className="bg-white p-4 rounded-2xl border border-teal-200 shadow-sm flex justify-between items-center"
              >
                <div>
                  <span className="text-[10px] font-bold uppercase text-teal-700 tracking-wider">
                    Ready for OTP Verification
                  </span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">
                    {m.donation?.title}
                  </p>
                  <p className="text-xs text-slate-500">
                    With: {m.donation?.donor_name} & {m.request?.requester_name}
                  </p>
                </div>
                <Link
                  href={`/handover/${m.id}`}
                  className="px-4 py-2 rounded-xl bg-teal-600 text-white font-semibold text-xs hover:bg-teal-700 transition"
                >
                  Open OTP Portal →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggested Matches Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-end">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                Intelligent Recommendations
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-0.5">
              Smart Matches for Your Listings & Requests
            </h2>
          </div>
          <Link
            href="/matches"
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
          >
            View all ({matches.length}) <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {suggestedMatches.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 text-xs text-slate-500">
            No pending matches right now. When compatible items or needs are posted in your radius, they will appear here with explainable scores.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suggestedMatches.slice(0, 4).map((m) => (
              <MatchCard
                key={m.id}
                match={m}
                currentUserId={user?.id}
                onAction={handleMatchAction}
              />
            ))}
          </div>
        )}
      </div>

      {/* My Active Listings & Needs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Active Donations */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-600" />
              My Donations ({donations.length})
            </h3>
            <Link
              href="/donations/my"
              className="text-xs font-semibold text-emerald-600 hover:underline"
            >
              Manage all
            </Link>
          </div>

          {donations.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
              You haven&apos;t offered any donations yet.
            </div>
          ) : (
            <div className="space-y-3">
              {donations.slice(0, 3).map((don) => (
                <div
                  key={don.id}
                  className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 flex justify-between items-center text-xs"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{don.title}</p>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      {don.quantity} {don.unit} • {don.condition} condition
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-md font-semibold text-[10px] uppercase bg-emerald-100 text-emerald-800">
                    {don.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Requests */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              My Requests ({requests.length})
            </h3>
            <Link
              href="/requests/my"
              className="text-xs font-semibold text-emerald-600 hover:underline"
            >
              Manage all
            </Link>
          </div>

          {requests.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
              You haven&apos;t posted any community requests yet.
            </div>
          ) : (
            <div className="space-y-3">
              {requests.slice(0, 3).map((req) => (
                <div
                  key={req.id}
                  className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 flex justify-between items-center text-xs"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{req.title}</p>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      Urgency: <strong className="uppercase">{req.urgency}</strong> • Score: {req.need_priority_score.toFixed(0)}/100
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-md font-semibold text-[10px] uppercase bg-amber-100 text-amber-800">
                    {req.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
