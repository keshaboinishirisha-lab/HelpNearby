import React from "react";
import Link from "next/link";
import { ShieldCheck, HeartHandshake, Sparkles, Lock, Users, Award, MapPin } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 space-y-12">
      {/* Title */}
      <div className="text-center space-y-3">
        <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">
          Mission & Architecture
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
          Don’t Just Donate Nearby. <br />
          <span className="text-emerald-600">Donate Where It’s Needed Most.</span>
        </h1>
        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
          GiveNearby is a location-aware, need-prioritized community donation platform that intelligently matches available resources with nearby verified requests while enabling safe and transparent handovers.
        </p>
      </div>

      {/* Honest Positioning & Industry Context */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <HeartHandshake className="w-5 h-5 text-emerald-600" />
          Our Context & Differentiation
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          We recognize that platforms already exist for free-item sharing, food rescue, community gifting, NGO collection, and local reuse. <strong>GiveNearby does not claim to be the first platform to enable local donations.</strong>
        </p>
        <p className="text-sm text-slate-600 leading-relaxed">
          Instead, GiveNearby’s core technological and social differentiation is answering a critical question:
        </p>
        <blockquote className="border-l-4 border-emerald-500 pl-4 py-1 text-slate-800 font-semibold italic text-sm">
          “Who nearby needs this item most, and how can the item safely reach them?”
        </blockquote >
        <p className="text-sm text-slate-600 leading-relaxed">
          Rather than leaving items on passive classified boards where the fastest browser claims them regardless of need, GiveNearby actively calculates multi-factor compatibility between:
          <br />
          <code className="text-xs bg-slate-100 text-slate-800 px-2 py-1 rounded inline-block mt-2 font-mono">
            AVAILABLE RESOURCE + NEARBY NEED + URGENCY + ELIGIBILITY + TRUST + AVAILABILITY + LOGISTICS
          </code>
        </p>
      </div>

      {/* Zero-Leak Privacy Guarantee */}
      <div className="bg-emerald-50/50 rounded-3xl p-8 border border-emerald-200 shadow-sm space-y-4">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Lock className="w-5 h-5 text-emerald-600" />
          Zero-Leak Location Privacy
        </h2>
        <p className="text-sm text-slate-700 leading-relaxed">
          Location privacy is an uncompromising engineering guarantee on GiveNearby. While users may grant browser geolocation to discover nearby items:
        </p>
        <ul className="text-xs sm:text-sm text-slate-700 space-y-2 list-disc pl-5">
          <li><strong>Precise GPS coordinates and home addresses are NEVER shown on public maps or listings.</strong></li>
          <li>Public discovery uses a deterministic ~1.2 km neighborhood centroid.</li>
          <li>Exact handover points and contact details are securely released <strong>only after both parties mutually confirm a match</strong>.</li>
          <li>We proactively encourage meetups at monitored community centers, public libraries, and civic squares.</li>
        </ul>
      </div>

      {/* Ethical Need Scoring */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-500" />
          Ethical, Objective Need Priority Scoring
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          GiveNearby explicitly rejects simplistic or discriminatory algorithms that attempt to assess personal worthiness. Our Need Priority Score (0–100) evaluates:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <strong>Time-Sensitive Urgency:</strong> Critical groceries, emergency winter warmth, and student exam textbooks.
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <strong>Waiting Duration:</strong> Longer-standing unanswered requests gain steady priority over time.
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <strong>Essentiality Weight:</strong> Human survival and educational supplies weighted with transparency.
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <strong>Modest Quantity Focus:</strong> Prioritizing reasonable, single-family quantities to prevent hoarders.
          </div>
        </div>
      </div>

      {/* Call to action */}
      <div className="text-center pt-4">
        <Link
          href="/browse/donations"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 transition shadow-sm"
        >
          Explore Local Resources
        </Link>
      </div>
    </div>
  );
}
