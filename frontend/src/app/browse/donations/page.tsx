"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { api, Donation, Category } from "@/lib/api";
import {
  Compass,
  Search,
  Filter,
  MapPin,
  HeartHandshake,
  Award,
  Lock,
  PlusCircle,
  Sparkles,
  ArrowRight
} from "lucide-react";

export default function BrowseDonationsPage() {
  const { userLocation } = useAuth();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState<number | undefined>();
  const [selectedCond, setSelectedCond] = useState<string | undefined>();
  const [radiusKm, setRadiusKm] = useState<number>(25);

  const fetchDonations = () => {
    setLoading(true);
    api.getDonations({
      category_id: selectedCat,
      condition: selectedCond,
      radius_km: radiusKm,
      search: search || undefined,
      lat: userLocation.lat,
      lng: userLocation.lng,
    })
      .then(setDonations)
      .catch(() => setDonations([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => []);
    fetchDonations();
  }, [selectedCat, selectedCond, radiusKm]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDonations();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-emerald-600" />
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
              Hyperlocal Resource Discovery
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Available Donations Nearby
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Items ready for local handover within your community.
          </p>
        </div>

        <Link
          href="/donations/create"
          className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-xs sm:text-sm hover:bg-emerald-700 transition flex items-center gap-2 shadow-sm"
        >
          <PlusCircle className="w-4 h-4" />
          Offer a Donation
        </Link>
      </div>

      {/* Privacy Notice Banner */}
      <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3 text-xs text-emerald-900">
        <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
        <div>
          <strong>Zero-Leak Privacy:</strong> All locations displayed are approximate neighborhood centroids (~1.2 km grid). Precise handover addresses are revealed only after both parties mutually accept a match.
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search books, laptops, winter coats, rice, wheelchair..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs sm:text-sm font-semibold hover:bg-slate-800 transition"
          >
            Search
          </button>
        </form>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-500 mr-2 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Categories:
          </span>
          <button
            onClick={() => setSelectedCat(undefined)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition ${
              selectedCat === undefined
                ? "bg-emerald-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCat(c.id === selectedCat ? undefined : c.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                selectedCat === c.id
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Secondary filters: Condition & Radius */}
        <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-500">Condition:</span>
            {["new", "like_new", "good", "fair"].map((cond) => (
              <button
                key={cond}
                onClick={() => setSelectedCond(selectedCond === cond ? undefined : cond)}
                className={`px-2.5 py-0.5 rounded-md font-medium capitalize ${
                  selectedCond === cond
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cond.replace("_", " ")}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <span className="font-semibold text-slate-500">Radius:</span>
            {[5, 10, 25, 50].map((r) => (
              <button
                key={r}
                onClick={() => setRadiusKm(r)}
                className={`px-2.5 py-0.5 rounded-md font-medium ${
                  radiusKm === r
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {r} km
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Donations Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-64 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : donations.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center max-w-lg mx-auto border border-slate-200 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">No donations found in this radius</h3>
          <p className="text-xs text-slate-500">
            Try expanding your search radius, selecting &quot;All&quot; categories, or be the first in your neighborhood to list an item!
          </p>
          <div className="pt-2">
            <Link
              href="/donations/create"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition"
            >
              Post a Donation Now
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {donations.map((don) => (
            <div
              key={don.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between group"
            >
              {don.image_url ? (
                <div className="h-44 w-full overflow-hidden bg-slate-100">
                  <img
                    src={don.image_url}
                    alt={don.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                </div>
              ) : (
                <div className="h-44 w-full bg-slate-50 flex items-center justify-center text-slate-400">
                  <HeartHandshake className="w-10 h-10 opacity-30" />
                </div>
              )}

              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex justify-between items-center text-[10px] uppercase font-bold text-slate-400">
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                      {don.condition.replace("_", " ")}
                    </span>
                    <span className="text-emerald-700 font-semibold flex items-center gap-0.5">
                      <Award className="w-3 h-3 text-emerald-600" />
                      {don.donor_trust_score?.toFixed(0)} Trust
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 mt-2 line-clamp-1 group-hover:text-emerald-600 transition">
                    {don.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {don.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 flex items-center gap-1 truncate max-w-[150px]">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {don.approx_address.split(",")[0]}
                  </span>
                  <Link
                    href={`/donations/${don.id}`}
                    className="font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5"
                  >
                    Details <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
