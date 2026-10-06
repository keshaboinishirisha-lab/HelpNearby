"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { api, Donation, RequestItem, Category } from "@/lib/api";
import { ImpactBanner } from "@/components/ImpactBanner";
import {
  HeartHandshake,
  Sparkles,
  MapPin,
  ShieldCheck,
  Compass,
  ArrowRight,
  BookOpen,
  Apple,
  Shirt,
  Laptop,
  HeartPulse,
  Home,
  CheckCircle2,
  Lock,
  Clock,
  Award
} from "lucide-react";

export default function HomePage() {
  const { user, userLocation, requestLocation } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [recentDonations, setRecentDonations] = useState<Donation[]>([]);
  const [urgentRequests, setUrgentRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getCategories().catch(() => []),
      api.getDonations({ status_filter: "available" }).catch(() => []),
      api.getRequests({ status_filter: "open" }).catch(() => []),
    ]).then(([cats, dons, reqs]) => {
      setCategories(cats);
      setRecentDonations(dons.slice(0, 4));
      setUrgentRequests(reqs.slice(0, 4));
      setLoading(false);
    });
  }, []);

  const getCategoryIcon = (slug: string) => {
    switch (slug) {
      case "educational-materials":
        return <BookOpen className="w-5 h-5 text-indigo-500" />;
      case "packaged-food":
        return <Apple className="w-5 h-5 text-emerald-500" />;
      case "clothes":
        return <Shirt className="w-5 h-5 text-amber-500" />;
      case "electronics":
        return <Laptop className="w-5 h-5 text-cyan-500" />;
      case "medical-accessibility":
        return <HeartPulse className="w-5 h-5 text-rose-500" />;
      default:
        return <Home className="w-5 h-5 text-teal-500" />;
    }
  };

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50/70 via-white to-slate-50 pt-16 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              Need-Prioritized Geospatial Matching Platform
            </div>

            <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-tight">
              Donate Anything. <br />
              <span className="text-emerald-600">Help Someone Nearby.</span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-600 font-medium leading-relaxed">
              Don’t just donate nearby. <span className="text-slate-900 font-semibold">Donate where it’s needed most.</span> GiveNearby intelligently connects your pre-loved goods and supplies with the highest-priority local needs through safe, verified handovers.
            </p>

            {/* Quick Action CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                href="/donations/create"
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 transition shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2"
              >
                <HeartHandshake className="w-4 h-4" />
                Donate an Item
              </Link>

              <Link
                href="/requests/create"
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 transition flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                Request What You Need
              </Link>

              <Link
                href="/browse/donations"
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white text-slate-700 font-semibold text-sm hover:bg-slate-100 transition border border-slate-300 flex items-center justify-center gap-2"
              >
                <Compass className="w-4 h-4 text-emerald-600" />
                Browse Nearby
              </Link>
            </div>

            {/* Geolocation Status / Privacy Guarantee */}
            <div className="pt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500">
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  Current Area: <strong className="text-slate-700">{userLocation.address}</strong>
                </span>
                {!userLocation.hasPermission && (
                  <button
                    onClick={requestLocation}
                    className="ml-2 text-emerald-600 font-semibold hover:underline"
                  >
                    (Detect GPS)
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm">
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Zero-Leak Home Privacy (Neighborhood Centroid Only)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Verified Live Impact Banner */}
      <ImpactBanner />

      {/* Differentiator Architecture: 4 Pillars */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
            Why GiveNearby Is Different
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Active Need-Prioritization, Not Just Passive Listings
          </h2>
          <p className="text-slate-600 text-sm mt-2">
            Most platforms leave items sitting on a board. GiveNearby actively evaluates urgency, waiting time, distance, and community trust to route resources where they save the most hardship.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-300 transition">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">1. Need Priority Score</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Objective 0-100 ranking evaluating urgency, waiting time, essentiality, and quantity reasonableness without discriminatory bias.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-300 transition">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">2. Zero-Leak Privacy</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Public listings show only approximate neighborhood areas (~1.2 km grid). Precise coordinates are locked until both parties confirm a handover.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-300 transition">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center mb-4">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">3. Explainable Matching</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Transparent match scores showing exactly why a match was recommended: category compatibility, travel radius, urgency, and verified participant trust.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-300 transition">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">4. Verified Safe Handover</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Safe public meeting point recommendations and a 6-digit cryptographic OTP code handshake guarantee transparent delivery and recorded impact.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Resource Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-6">
          <div>
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
              Community Categories
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">
              Donate or Request Across Essentials
            </h2>
          </div>
          <Link
            href="/browse/donations"
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
          >
            Explore all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/browse/donations?category_id=${cat.id}`}
              className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-400 transition text-center group flex flex-col items-center justify-center"
            >
              <div className="w-12 h-12 rounded-xl bg-slate-50 group-hover:bg-emerald-50 flex items-center justify-center mb-2 transition">
                {getCategoryIcon(cat.slug)}
              </div>
              <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-700 transition line-clamp-1">
                {cat.name}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5">
                {cat.is_perishable ? "Time-Sensitive" : "Multi-Use"}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Urgent Community Needs Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />
              <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">
                Urgent Community Requests
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">
              People Nearby Waiting for Help
            </h2>
          </div>
          <Link
            href="/browse/requests"
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
          >
            View all requests <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {urgentRequests.map((req) => (
            <div
              key={req.id}
              className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start gap-2">
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      req.urgency === "emergency"
                        ? "bg-rose-100 text-rose-700"
                        : req.urgency === "high"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {req.urgency}
                  </span>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    Need Score: {req.need_priority_score.toFixed(0)}/100
                  </span>
                </div>

                <h3 className="font-bold text-sm text-slate-900 mt-2.5 line-clamp-2">
                  {req.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  {req.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  {req.approx_address.split(",")[0]}
                </span>
                <Link
                  href={`/requests/${req.id}`}
                  className="font-semibold text-emerald-600 hover:text-emerald-700"
                >
                  Offer Help →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Available Nearby Donations */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-6">
          <div>
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
              Available Resources
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">
              Items Ready for Local Pickup
            </h2>
          </div>
          <Link
            href="/browse/donations"
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
          >
            Browse all donations <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {recentDonations.map((don) => (
            <div
              key={don.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              {don.image_url ? (
                <div className="h-40 w-full overflow-hidden bg-slate-100">
                  <img
                    src={don.image_url}
                    alt={don.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition"
                  />
                </div>
              ) : (
                <div className="h-40 w-full bg-emerald-50/50 flex items-center justify-center text-emerald-600">
                  <HeartHandshake className="w-10 h-10 opacity-40" />
                </div>
              )}

              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center text-[10px] uppercase font-bold text-slate-400">
                    <span>{don.condition.replace("_", " ")} condition</span>
                    <span className="text-emerald-700 font-semibold flex items-center gap-0.5">
                      <Award className="w-3 h-3 text-emerald-600" />
                      {don.donor_trust_score?.toFixed(0)} Trust
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 mt-1 line-clamp-1">
                    {don.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {don.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    {don.approx_address.split(",")[0]}
                  </span>
                  <Link
                    href={`/donations/${don.id}`}
                    className="font-semibold text-emerald-600 hover:text-emerald-700"
                  >
                    View Item →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Community Call to Action */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 rounded-3xl p-8 sm:p-12 text-white text-center max-w-4xl mx-auto space-y-6">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
            Join The Hyperlocal Movement
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Have Something You Don’t Need? <br />
            Someone Within 2 km Needs It Today.
          </h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto leading-relaxed">
            Free to join. 100% community-driven. Your personal address is never exposed on public maps, and handovers are secured with verified one-time codes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/register"
              className="px-6 py-3 rounded-2xl bg-emerald-500 text-slate-950 font-bold text-sm hover:bg-emerald-400 transition"
            >
              Create Free Account
            </Link>
            <Link
              href="/how-it-works"
              className="px-6 py-3 rounded-2xl bg-white/10 text-white font-medium text-sm hover:bg-white/20 transition border border-white/20"
            >
              Read Safety Protocol
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
