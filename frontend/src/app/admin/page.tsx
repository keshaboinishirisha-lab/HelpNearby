"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api, User } from "@/lib/api";
import {
  ShieldCheck,
  Users,
  AlertTriangle,
  Package,
  HeartHandshake,
  CheckCircle2,
  XCircle,
  Award
} from "lucide-react";

export default function AdminPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [stats, setStats] = useState<any>({
    users_count: 0,
    donations_count: 0,
    requests_count: 0,
    matches_count: 0,
    handovers_completed: 0,
    pending_reports_count: 0,
  });
  const [usersList, setUsersList] = useState<User[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAdminData = () => {
    setLoading(true);
    Promise.all([
      api.getAdminStats().catch(() => ({})),
      api.getAdminUsers().catch(() => []),
      api.getReports().catch(() => []),
    ]).then(([s, uList, reps]) => {
      setStats(s);
      setUsersList(uList);
      setReports(reps);
      setLoading(false);
    });
  };

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) {
      router.push("/dashboard");
      return;
    }
    if (user && user.role === "admin") {
      fetchAdminData();
    }
  }, [user, authLoading, router]);

  const handleVerify = async (userId: number, newStatus: string) => {
    try {
      await api.verifyUser(userId, newStatus);
      fetchAdminData();
    } catch (err: any) {
      alert(err.message || "Failed to update verification status");
    }
  };

  const handleResolveReport = async (reportId: number, action: "resolve" | "dismiss") => {
    try {
      await api.resolveReport(reportId, action, "Reviewed and moderated by Admin");
      fetchAdminData();
    } catch (err: any) {
      alert(err.message || "Failed to resolve report");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-500">
        Loading admin oversight console...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
              Platform Governance & Trust Security
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Admin Moderation Center
          </h1>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 text-center">
          <span className="text-2xl font-bold text-slate-900 block">{stats.users_count || 0}</span>
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total Users</span>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-200 text-center">
          <span className="text-2xl font-bold text-slate-900 block">{stats.donations_count || 0}</span>
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Donations</span>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-200 text-center">
          <span className="text-2xl font-bold text-slate-900 block">{stats.requests_count || 0}</span>
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Requests</span>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-200 text-center">
          <span className="text-2xl font-bold text-slate-900 block">{stats.matches_count || 0}</span>
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Matches</span>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-200 text-center">
          <span className="text-2xl font-bold text-emerald-600 block">{stats.handovers_completed || 0}</span>
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Handovers</span>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-200 text-center">
          <span className="text-2xl font-bold text-rose-600 block">{stats.pending_reports_count || 0}</span>
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Reports</span>
        </div>
      </div>

      {/* Reports Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-rose-500" />
          Safety & Content Reports ({reports.length})
        </h2>

        {reports.length === 0 ? (
          <p className="text-xs text-slate-400">No open reports at this time.</p>
        ) : (
          <div className="space-y-3">
            {reports.map((r) => (
              <div
                key={r.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs"
              >
                <div>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                    {r.reason}
                  </span>
                  <p className="font-semibold text-slate-900 mt-1">
                    Entity: {r.entity_type} #{r.entity_id}
                  </p>
                  <p className="text-slate-600 mt-0.5">{r.details}</p>
                </div>

                {r.status === "pending" ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleResolveReport(r.id, "resolve")}
                      className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700"
                    >
                      Resolve
                    </button>
                    <button
                      onClick={() => handleResolveReport(r.id, "dismiss")}
                      className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg font-bold hover:bg-slate-300"
                    >
                      Dismiss
                    </button>
                  </div>
                ) : (
                  <span className="font-bold text-slate-500 uppercase">{r.status}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User Management Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Users className="w-5 h-5 text-emerald-600" />
          User Accounts & Trust Status ({usersList.length})
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th className="p-3">User</th>
                <th className="p-3">Role</th>
                <th className="p-3">Trust Score</th>
                <th className="p-3">Verification</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {usersList.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50">
                  <td className="p-3 font-semibold text-slate-900">
                    {u.name} <br />
                    <span className="text-[11px] font-normal text-slate-400">{u.email}</span>
                  </td>
                  <td className="p-3 uppercase font-medium">{u.role}</td>
                  <td className="p-3 font-bold text-emerald-700">{u.trust_score.toFixed(1)} / 100</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        u.verification_status === "verified"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {u.verification_status}
                    </span>
                  </td>
                  <td className="p-3">
                    {u.verification_status !== "verified" ? (
                      <button
                        onClick={() => handleVerify(u.id, "verified")}
                        className="px-2.5 py-1 bg-emerald-600 text-white rounded-md font-semibold text-[11px] hover:bg-emerald-700"
                      >
                        Grant Verified
                      </button>
                    ) : (
                      <button
                        onClick={() => handleVerify(u.id, "pending")}
                        className="px-2.5 py-1 bg-slate-200 text-slate-700 rounded-md font-semibold text-[11px] hover:bg-slate-300"
                      >
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
