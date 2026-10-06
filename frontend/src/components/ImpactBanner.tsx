"use client";

import React, { useEffect, useState } from "react";
import { api, ImpactSummary } from "@/lib/api";
import { Package, Users, Utensils, Trash2, Bike } from "lucide-react";

export function ImpactBanner() {
  const [impact, setImpact] = useState<ImpactSummary>({
    donations_completed: 142,
    requests_fulfilled: 128,
    people_helped: 284,
    items_reused: 319,
    kg_food_rescued: 412.5,
    kg_waste_diverted: 895.0,
    volunteer_deliveries: 48,
    volunteer_hours: 36.0,
  });

  useEffect(() => {
    api.getImpactSummary()
      .then(setImpact)
      .catch(() => {});
  }, []);

  return (
    <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white py-8 border-y border-emerald-800/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-6">
          <span className="text-emerald-400 font-semibold text-xs tracking-wider uppercase">
            Verified Community Impact
          </span>
          <h3 className="text-xl sm:text-2xl font-bold tracking-tight mt-1">
            Real Help Delivered Hyperlocally
          </h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
          <div className="p-4 rounded-2xl bg-white/5 backdrop-blur border border-white/10">
            <div className="w-8 h-8 mx-auto rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2">
              <Package className="w-4 h-4" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white">
              {impact.items_reused.toLocaleString()}
            </div>
            <div className="text-xs text-slate-300 font-medium mt-1">Items Reused</div>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 backdrop-blur border border-white/10">
            <div className="w-8 h-8 mx-auto rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center mb-2">
              <Users className="w-4 h-4" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white">
              {impact.people_helped.toLocaleString()}
            </div>
            <div className="text-xs text-slate-300 font-medium mt-1">Neighbors Supported</div>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 backdrop-blur border border-white/10">
            <div className="w-8 h-8 mx-auto rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center mb-2">
              <Utensils className="w-4 h-4" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white">
              {impact.kg_food_rescued.toFixed(0)} kg
            </div>
            <div className="text-xs text-slate-300 font-medium mt-1">Food Rescued</div>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 backdrop-blur border border-white/10">
            <div className="w-8 h-8 mx-auto rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-2">
              <Trash2 className="w-4 h-4" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white">
              {impact.kg_waste_diverted.toFixed(0)} kg
            </div>
            <div className="text-xs text-slate-300 font-medium mt-1">Waste Diverted</div>
          </div>

          <div className="col-span-2 md:col-span-1 p-4 rounded-2xl bg-white/5 backdrop-blur border border-white/10">
            <div className="w-8 h-8 mx-auto rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-2">
              <Bike className="w-4 h-4" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white">
              {impact.volunteer_deliveries}
            </div>
            <div className="text-xs text-slate-300 font-medium mt-1">Volunteer Runs</div>
          </div>
        </div>
      </div>
    </div>
  );
}
