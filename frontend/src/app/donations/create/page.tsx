"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api, Category } from "@/lib/api";
import {
  HeartHandshake,
  Sparkles,
  MapPin,
  Lock,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Package,
  Layers
} from "lucide-react";

export default function CreateDonationPage() {
  const router = useRouter();
  const { user, userLocation } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  
  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [condition, setCondition] = useState<"new" | "like_new" | "good" | "fair">("good");
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState("items");
  const [imageUrl, setImageUrl] = useState("");
  const [pickupRadiusKm, setPickupRadiusKm] = useState(10);
  const [isPerishable, setIsPerishable] = useState(false);
  const [expiresAt, setExpiresAt] = useState("");
  
  // Exact location (Protected)
  const [exactAddress, setExactAddress] = useState(userLocation.address || "1200 Market Street, San Francisco, CA");
  const [exactLat, setExactLat] = useState(userLocation.lat);
  const [exactLng, setExactLng] = useState(userLocation.lng);

  // AI Assist State
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<any | null>(null);

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

  const handleAIAssist = async () => {
    if (!title.trim()) {
      alert("Please enter an item title first to let the AI analyze it.");
      return;
    }
    setAiLoading(true);
    try {
      const res = await api.suggestCategory(title, description);
      setAiSuggestion(res);
      // Automatically map suggested slug to category ID
      const matched = categories.find((c) => c.slug === res.suggested_category_slug);
      if (matched) setCategoryId(matched.id);
      if (["new", "like_new", "good", "fair"].includes(res.suggested_condition)) {
        setCondition(res.suggested_condition as any);
      }
    } catch {
      alert("AI suggestion unavailable right now.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId) return;
    setError(null);
    setLoading(true);

    try {
      await api.createDonation({
        category_id: categoryId,
        title,
        description,
        condition,
        quantity: Number(quantity),
        unit,
        image_url: imageUrl || undefined,
        pickup_radius_km: Number(pickupRadiusKm),
        is_perishable: isPerishable,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : undefined,
        exact_lat: Number(exactLat),
        exact_lng: Number(exactLng),
        exact_address: exactAddress,
      });
      router.push("/matches");
    } catch (err: any) {
      setError(err.message || "Failed to create donation");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2">
          <HeartHandshake className="w-5 h-5 text-emerald-600" />
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
            List a Community Resource
          </span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 mt-1">
          Donate an Item
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          GiveNearby will automatically match your item with nearby requests based on need priority and location proximity.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        {/* Title & AI Assist */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="block text-xs font-bold text-slate-800">
              Item Title <span className="text-rose-500">*</span>
            </label>
            <button
              type="button"
              onClick={handleAIAssist}
              disabled={aiLoading}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200 flex items-center gap-1.5 transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              {aiLoading ? "Analyzing..." : "✨ AI Auto-Categorize"}
            </button>
          </div>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. 8th Grade Mathematics Textbooks, ThinkPad Laptop, Organic Brown Rice"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* AI Suggestion Feedback Box */}
        {aiSuggestion && (
          <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-xs space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-900 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              AI Recommendation Applied ({Math.round(aiSuggestion.confidence * 100)}% confidence)
            </div>
            <p className="text-emerald-800">
              Category: <strong>{aiSuggestion.suggested_category_name}</strong> • Condition: <strong>{aiSuggestion.suggested_condition.replace("_", " ")}</strong>
            </p>
            <p className="text-[11px] text-emerald-700 italic">
              Reasoning: {aiSuggestion.reasoning}
            </p>
          </div>
        )}

        {/* Category & Condition */}
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
                  {c.name} {c.is_perishable ? "(Perishable)" : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Condition <span className="text-rose-500">*</span>
            </label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value as any)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white capitalize"
            >
              <option value="new">Brand New (Unopened)</option>
              <option value="like_new">Like New (Barely Used)</option>
              <option value="good">Good (Fully Functional)</option>
              <option value="fair">Fair (Usable with Wear)</option>
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1.5">
            Description <span className="text-rose-500">*</span>
          </label>
          <textarea
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the items, completeness, dimensions, or instructions..."
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Quantity & Unit */}
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
              placeholder="e.g. items, books, kg, boxes"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label className="block text-xs font-bold text-slate-800 mb-1.5">Pickup Radius</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={50}
                value={pickupRadiusKm}
                onChange={(e) => setPickupRadiusKm(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-xs text-slate-500 font-medium shrink-0">km</span>
            </div>
          </div>
        </div>

        {/* Perishable / Food Safety Settings */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-800 block">Time-Sensitive / Food Item</span>
              <span className="text-[11px] text-slate-500">Enable for packaged meals, bakery, or groceries.</span>
            </div>
            <input
              type="checkbox"
              checked={isPerishable}
              onChange={(e) => setIsPerishable(e.target.checked)}
              className="w-5 h-5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
            />
          </div>

          {isPerishable && (
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Expiration / Best By Date</label>
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>
          )}
        </div>

        {/* Location & Zero-Leak Privacy */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex justify-between items-center">
            <label className="block text-xs font-bold text-slate-800">
              Pickup Meeting Address <span className="text-rose-500">*</span>
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
              placeholder="e.g. 1200 Market Street, San Francisco, CA"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            🛡️ <strong>Zero-Leak Privacy:</strong> Your exact street address is encrypted and only exchanged after you accept a confirmed match. The public map will only display an approximate neighborhood centroid.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-2xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition shadow-lg shadow-emerald-600/30 disabled:opacity-50"
        >
          {loading ? "Publishing Donation & Finding Matches..." : "Publish Donation"}
        </button>
      </form>
    </div>
  );
}
