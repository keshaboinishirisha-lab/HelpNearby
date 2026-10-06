import React from "react";
import Link from "next/link";
import {
  HeartHandshake,
  Sparkles,
  MapPin,
  Lock,
  KeyRound,
  CheckCircle2,
  Award,
  ArrowRight,
  ShieldCheck,
  Bike
} from "lucide-react";

export default function HowItWorksPage() {
  const steps = [
    {
      step: "01",
      title: "List an Available Item or Post a Need",
      desc: "Donors upload item details with AI-assisted category & condition suggestions. Requesters indicate what they need and select their urgency level (Emergency, High, Medium, Low).",
      icon: <HeartHandshake className="w-6 h-6 text-emerald-600" />,
      features: [
        "AI-assisted categorization from item title & description",
        "Quantity and expiry date controls for food & perishables",
        "Exact GPS coordinates are secured and stored privately",
      ],
    },
    {
      step: "02",
      title: "Need-Prioritized Geospatial Matching",
      desc: "Our matching engine continuously calculates compatibility across Category, Distance (within pickup radius), Need Priority Score, and Participant Trust.",
      icon: <Sparkles className="w-6 h-6 text-amber-500" />,
      features: [
        "Transparent 0–100 match score with explainable rationale bullets",
        "Zero-leak public privacy: neighborhood centroid (~1.2 km grid) displayed",
        "Urgent requests and longer-waiting families are prioritized",
      ],
    },
    {
      step: "03",
      title: "Mutual Acceptance & Safe Handover Setup",
      desc: "Both donor and recipient review and accept the recommendation. The system generates a cryptographic 6-digit OTP and recommends safe public meeting spots.",
      icon: <KeyRound className="w-6 h-6 text-teal-600" />,
      features: [
        "Recipient receives a unique 6-digit OTP verification code",
        "Safe public pickup point recommendations (community centers, libraries, civic plazas)",
        "Volunteers can optionally accept pickup and transport tasks",
      ],
    },
    {
      step: "04",
      title: "Physical Handover & Verified Impact",
      desc: "At the meeting point, the donor verifies the recipient's 6-digit OTP code. Upon verification, the donation is marked completed, trust scores increase, and environmental impact is recorded.",
      icon: <Award className="w-6 h-6 text-indigo-600" />,
      features: [
        "Immediate tamper-proof completion verification",
        "Real-time impact tracking: items reused, food rescued (kg), waste diverted",
        "Post-handover community ratings reinforce platform trust",
      ],
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-16 space-y-16">
      {/* Title */}
      <div className="text-center space-y-3">
        <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">
          Transparent Architecture
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
          How GiveNearby Works
        </h1>
        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
          From posting an item to the verified 6-digit OTP handover—every step is designed for maximum safety, transparent allocation, and community trust.
        </p>
      </div>

      {/* Step by step flow */}
      <div className="space-y-8">
        {steps.map((s, idx) => (
          <div
            key={idx}
            className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start gap-6 hover:border-emerald-300 transition"
          >
            <div className="flex items-center gap-4 shrink-0">
              <span className="text-3xl font-black text-emerald-600/30 font-mono">
                {s.step}
              </span>
              <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100">
                {s.icon}
              </div>
            </div>

            <div className="flex-1 space-y-3">
              <h3 className="text-xl font-bold text-slate-900">{s.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{s.desc}</p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                {s.features.map((f, fIdx) => (
                  <div
                    key={fIdx}
                    className="flex items-start gap-1.5 text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Safe Handover OTP Flow Diagram */}
      <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
            Cryptographic Handshake
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold">The Safe Handover Lifecycle</h2>
          <p className="text-slate-400 text-xs">
            How GiveNearby prevents phantom donations, protects privacy, and guarantees real help reaches recipients.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-center text-xs">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <span className="font-bold text-emerald-400 block mb-1">1. Match</span>
            <p className="text-slate-300">Intelligent scoring finds highest priority match.</p>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <span className="font-bold text-emerald-400 block mb-1">2. Accept</span>
            <p className="text-slate-300">Both donor & recipient mutually approve the match.</p>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <span className="font-bold text-emerald-400 block mb-1">3. Schedule</span>
            <p className="text-slate-300">Safe public pickup spot selected; 6-digit OTP sent to recipient.</p>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <span className="font-bold text-emerald-400 block mb-1">4. Verify OTP</span>
            <p className="text-slate-300">Donor inputs code shown by recipient during meeting.</p>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <span className="font-bold text-emerald-400 block mb-1">5. Impact</span>
            <p className="text-slate-300">Handover confirmed, trust ratings unlocked, impact tallied.</p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center space-y-4">
        <h3 className="text-xl font-bold text-slate-900">Ready to make a difference in your neighborhood?</h3>
        <div className="flex justify-center gap-3">
          <Link
            href="/donations/create"
            className="px-6 py-3 rounded-2xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 transition"
          >
            Donate an Item
          </Link>
          <Link
            href="/requests/create"
            className="px-6 py-3 rounded-2xl bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 transition"
          >
            Post a Request
          </Link>
        </div>
      </div>
    </div>
  );
}
