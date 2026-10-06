"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { api, Donation } from "@/lib/api";
import {
  HeartHandshake,
  MapPin,
  Lock,
  Award,
  Calendar,
  Package,
  ShieldCheck,
  ArrowLeft,
  Sparkles
} from "lucide-react";

export default function DonationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const donationId = Number(params?.id);
  const [donation, setDonation] = useState<Donation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!donationId) return;
    setLoading(true);
    api.getDonation(donationId)
      .then(setDonation)
      .catch(() => setDonation(null))
      .finally(() => setLoading(false));
  }, [donationId]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-slate-500">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        Loading donation details...
      </div>
    );
  }

  if (!donation) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Donation Not Found</h2>
        <p className="text-xs text-slate-500">This donation may have been completed or removed.</p>
        <Link href="/browse/donations" className="inline-block px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold">
          Back to Browse
        </Link>
      </div>
    );
  }

  const isOwner = user?.id === donation.donor_id;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <Link
        href="/browse/donations"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Available Donations
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
        {/* Left Col: Image / Graphic */}
        <div className="space-y-4">
          {donation.image_url ? (
            <div className="h-72 w-full rounded-2xl overflow-hidden bg-slate-100">
              <img
                src={donation.image_url}
                alt={donation.title}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="h-72 w-full rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <HeartHandshake className="w-16 h-16 opacity-40" />
            </div>
          )}

          {/* Privacy Map Simulation */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-600" />
                Approximate Neighborhood Centroid
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                Zero-Leak Protected
              </span>
            </div>
            <div className="h-28 bg-emerald-100/60 rounded-xl flex items-center justify-center text-center p-3 text-xs text-emerald-950 font-medium border border-dashed border-emerald-300">
              <span>
                📍 ~1.2 km privacy radius near {donation.approx_address}
                <br />
                <span className="text-[10px] text-emerald-800 font-normal">
                  Exact address unlocked only when handover is confirmed.
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Right Col: Details & Actions */}
        <div className="flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-start gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                {donation.category?.name || "General Community Resource"}
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full uppercase bg-emerald-100 text-emerald-800">
                {donation.status}
              </span>
            </div>

            <h1 className="text-2xl font-extrabold text-slate-900 leading-snug">
              {donation.title}
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {donation.description}
            </p>

            {/* Attributes Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs pt-2">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block font-medium">Condition</span>
                <span className="font-bold text-slate-800 capitalize mt-0.5 block">
                  {donation.condition.replace("_", " ")}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block font-medium">Available Quantity</span>
                <span className="font-bold text-slate-800 mt-0.5 block">
                  {donation.quantity} {donation.unit}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block font-medium">Pickup Radius</span>
                <span className="font-bold text-slate-800 mt-0.5 block">
                  Up to {donation.pickup_radius_km} km
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block font-medium">Offered By</span>
                <span className="font-bold text-slate-800 mt-0.5 block flex items-center gap-1">
                  {donation.donor_name}
                  <span className="text-[10px] text-emerald-600 font-semibold">
                    ({donation.donor_trust_score?.toFixed(0)} Trust)
                  </span>
                </span>
              </div>
            </div>

            {donation.is_perishable && donation.expires_at && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Time-Sensitive Expiration: <strong>{new Date(donation.expires_at).toLocaleDateString()}</strong>
                </span>
              </div>
            )}
          </div>

          {/* Action Button */}
          <div className="pt-4 border-t border-slate-100">
            {isOwner ? (
              <div className="text-xs text-slate-500 font-medium text-center">
                This is your donation. Check your dashboard for incoming matches!
              </div>
            ) : (
              <Link
                href="/requests/create"
                className="w-full py-3.5 rounded-2xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Request This Item via Smart Match
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
