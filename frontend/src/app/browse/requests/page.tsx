"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { api, RequestItem, Category } from "@/lib/api";
import {
  Sparkles,
  Search,
  Filter,
  MapPin,
  Clock,
  PlusCircle,
  Lock,
  ArrowRight,
  Award
} from "lucide-react";

export default function BrowseRequestsPage() {
  const { userLocation } = useAuth();
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState<number | undefined>();
  const [selectedUrgency, setSelectedUrgency] = useState<string | undefined>();
  const [radiusKm, setRadiusKm] = useState<number>(25);

  const fetchRequests = () => {
    setLoading(true);
    api.getRequests({
      category_id: selectedCat,
      urgency: selectedUrgency,
      radius_km: radiusKm,
      search: search || undefined,
      lat: userLocation.lat,
      lng: userLocation.lng,
    })
      .then(setRequests)
      .catch(() => setRequests([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => []);
    fetchRequests();
  }, [selectedCat, selectedUrgency, radiusKm]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRequests();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
              Need-Prioritized Community Requests
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Community Needs Waiting for Support
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Ranked by our objective Need Priority Score (urgency, waiting time, and essentiality).
          </p>
        </div>

        <Link
          href="/requests/create"
          className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-xs sm:text-sm hover:bg-slate-800 transition flex items-center gap-2 shadow-sm"
        >
          <PlusCircle className="w-4 h-4 text-amber-400" />
          Post a Request
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search requested books, winter coats, food supplies, crutches..."
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

        {/* Urgency & Category Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-500 mr-2 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Urgency:
          </span>
          {["emergency", "high", "medium", "low"].map((urg) => (
            <button
              key={urg}
              onClick={() => setSelectedUrgency(selectedUrgency === urg ? undefined : urg)}
              className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider transition ${
                selectedUrgency === urg
                  ? urg === "emergency"
                    ? "bg-rose-600 text-white"
                    : urg === "high"
                    ? "bg-amber-500 text-white"
                    : "bg-slate-800 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {urg}
            </button>
          ))}
        </div>
      </div>

      {/* Requests Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center max-w-lg mx-auto border border-slate-200 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">No open requests in this filter</h3>
          <p className="text-xs text-slate-500">
            All nearby requests might be fulfilled or matched! Check back soon or post a new request.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {requests.map((req) => (
            <div
              key={req.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start gap-2">
                  <span
                    className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                      req.urgency === "emergency"
                        ? "bg-rose-100 text-rose-700 font-extrabold animate-pulse"
                        : req.urgency === "high"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {req.urgency} Urgency
                  </span>

                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                    Need Score: {req.need_priority_score.toFixed(0)}/100
                  </span>
                </div>

                <h3 className="font-bold text-base text-slate-900 mt-3 line-clamp-1">
                  {req.title}
                </h3>
                <p className="text-xs text-slate-600 mt-1 line-clamp-3 leading-relaxed">
                  {req.description}
                </p>

                <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
                  <span>
                    Needed: <strong>{req.quantity} {req.unit}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    By: <strong>{req.requester_name || "Community Member"}</strong>
                  </span>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 flex items-center gap-1 truncate max-w-[150px]">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  {req.approx_address.split(",")[0]}
                </span>
                <Link
                  href={`/requests/${req.id}`}
                  className="font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                >
                  Fulfill Request <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
