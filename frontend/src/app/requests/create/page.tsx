"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api, Category } from "@/lib/api";
import {
  Sparkles,
  MapPin,
  Lock,
  Clock,
  AlertCircle,
  Award,
  Layers
} from "lucide-react";

export default function CreateRequestPage() {
  const router = useRouter();
  const { user, userLocation } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState("items");
  const [urgency, setUrgency] = useState<"low" | "medium" | "high" | "emergency">("high");
  const [maxDistanceKm, setMaxDistanceKm] = useState(15);

  const [exactAddress, setExactAddress] = useState(userLocation.address || "550 Dolores St, San Francisco, CA");
  const [exactLat, setExactLat] = useState(userLocation.lat);
  const [exactLng, setExactLng] = useState(userLocation.lng);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    api.getCategories().then((cats) => {
      setCategories(cats);
      if (cats.length > 0) setCategoryId(cats[0].id);
    }).catch(() => []);
  }, [user, router]);

  // Compute live preview of estimated Need Priority Score
  const getEstimatedNeedScore = () => {
    let score = 0;
    if (urgency === "emergency") score += 35;
    else if (urgency === "high") score += 27;
    else if (urgency === "medium") score += 18;
    else score += 10;

    const cat = categories.find((c) => c.id === categoryId);
    if (cat) {
      if (cat.slug === "packaged-food" || cat.slug === "medical-accessibility") score += 25;
      else if (cat.slug === "educational-materials") score += 20;
      else if (cat.slug === "clothes") score += 17;
      else score += 15;
    }

    if (quantity <= 5) score += 10;
    else score += 5;

    score += 5; // Base waiting & role
    return Math.min(100, score);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId) return;
    setError(null);
    setLoading(true);

    try {
      await api.createRequest({
        category_id: categoryId,
        title,
        description,
        quantity: Number(quantity),
        unit,
        urgency,
        max_distance_km: Number(maxDistanceKm),
        exact_lat: Number(exactLat),
        exact_lng: Number(exactLng),
        exact_address: exactAddress,
      });
      router.push("/matches");
    } catch (err: any) {
      setError(err.message || "Failed to create request");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
            Community Assistance
          </span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 mt-1">
          Post What You Need
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          GiveNearby prioritizes genuine needs objectively and matches them with available resources nearby.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1.5">
            What item or resource do you need? <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. 8th Grade Math Study Book, Winter Coat for Teen, Diabetic Test Strips"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Category & Urgency */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Category <span className="text-rose-500">*</span>
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(Number(e.target.value))}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Urgency Level <span className="text-rose-500">*</span>
            </label>
            <select
              value={urgency}
              onChange={(e) => setUrgency(e.target.value as any)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white capitalize"
            >
              <option value="emergency">Emergency (Immediate 24h Need)</option>
              <option value="high">High Urgency (Needed This Week)</option>
              <option value="medium">Medium (Needed Within Two Weeks)</option>
              <option value="low">Low (Flexible Timeline)</option>
            </select>
          </div>
        </div>

        {/* Live Need Priority Score Estimation Badge */}
        <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-2xl flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-600" />
              Estimated Need Priority Score
            </span>
            <p className="text-[11px] text-amber-800">
              Computed objectively based on urgency, item necessity, and quantity scale.
            </p>
          </div>
          <div className="text-2xl font-black text-amber-700 bg-white px-3 py-1 rounded-xl border border-amber-200 shadow-sm">
            {getEstimatedNeedScore()}/100
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1.5">
            Details & Purpose <span className="text-rose-500">*</span>
          </label>
          <textarea
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Explain why you or your family need this item, preferred specifications, or deadlines..."
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Quantity, Unit & Max Distance */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">Quantity</label>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">Unit</label>
            <input
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="e.g. books, items, kg"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label className="block text-xs font-bold text-slate-800 mb-1.5">Max Travel Distance</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={50}
                value={maxDistanceKm}
                onChange={(e) => setMaxDistanceKm(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-xs text-slate-500 font-medium shrink-0">km</span>
            </div>
          </div>
        </div>

        {/* Location & Zero-Leak Privacy */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex justify-between items-center">
            <label className="block text-xs font-bold text-slate-800">
              Your Safe Meeting Location / Address <span className="text-rose-500">*</span>
            </label>
            <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
              <Lock className="w-3 h-3 text-emerald-600" />
              Protected & Never Public
            </span>
          </div>
          <div className="relative">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            <input
              type="text"
              required
              value={exactAddress}
              onChange={(e) => setExactAddress(e.target.value)}
              placeholder="e.g. 550 Dolores St, San Francisco, CA"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <p className="text-[11px] text-slate-500">
            🔒 Only approximate neighborhood centroid is shown publicly until you accept a match.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-2xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition shadow-lg disabled:opacity-50"
        >
          {loading ? "Calculating Need Priority & Matching..." : "Post Community Request"}
        </button>
      </form>
    </div>
  );
}
