"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api, Donation } from "@/lib/api";
import { Package, PlusCircle, ArrowLeft, ArrowRight, CheckCircle2, Clock } from "lucide-react";

export default function MyDonationsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    api.getMyDonations()
      .then(setDonations)
      .catch(() => setDonations([]))
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
            My Donations ({donations.length})
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your listed items and monitor their fulfillment status.
          </p>
        </div>

        <Link
          href="/donations/create"
          className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold text-xs sm:text-sm hover:bg-emerald-700 transition flex items-center gap-1.5"
        >
          <PlusCircle className="w-4 h-4" /> New Donation
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-500">Loading your donations...</div>
      ) : donations.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3 max-w-md mx-auto">
          <Package className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="font-bold text-slate-800">No donations yet</h3>
          <p className="text-xs text-slate-500">
            Have books, electronics, food, or clothes you don&apos;t use? Share them with a neighbor!
          </p>
          <Link
            href="/donations/create"
            className="inline-block px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold"
          >
            Create Your First Donation
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {donations.map((don) => (
            <div
              key={don.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-emerald-300 transition"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {don.condition.replace("_", " ")}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      don.status === "completed"
                        ? "bg-emerald-100 text-emerald-800"
                        : don.status === "in_handover"
                        ? "bg-teal-100 text-teal-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {don.status}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-1">{don.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {don.quantity} {don.unit} • Pickup Radius: {don.pickup_radius_km} km
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/donations/${don.id}`}
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
