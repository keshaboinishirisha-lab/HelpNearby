import React from "react";
import Link from "next/link";
import { HeartHandshake, ShieldCheck, MapPin, Sparkles, Lock } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 text-sm border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">
                Give<span className="text-emerald-400">Nearby</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Don’t just donate nearby. Donate where it’s needed most. Hyperlocal need-prioritized community resource exchange.
            </p>
            <div className="pt-2 flex items-center gap-1.5 text-xs text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Zero-Leak Location Privacy Protected</span>
            </div>
          </div>

          {/* Platform Col */}
          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-3">Explore</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/browse/donations" className="hover:text-white transition">Available Donations</Link>
              </li>
              <li>
                <Link href="/browse/requests" className="hover:text-white transition">Community Needs</Link>
              </li>
              <li>
                <Link href="/matches" className="hover:text-white transition">Smart Match Engine</Link>
              </li>
              <li>
                <Link href="/impact" className="hover:text-white transition">Social Impact Dashboard</Link>
              </li>
            </ul>
          </div>

          {/* Portals Col */}
          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-3">Portals</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/volunteer" className="hover:text-white transition">Volunteer Logistics</Link>
              </li>
              <li>
                <Link href="/ngo" className="hover:text-white transition">NGO & Shelter Hub</Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-white transition">Moderation & Security</Link>
              </li>
              <li>
                <Link href="/how-it-works" className="hover:text-white transition">Safe Handover Protocol</Link>
              </li>
            </ul>
          </div>

          {/* Safety & Standards Col */}
          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-3">Safety & Trust</h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-start gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                <span>Exact address shared only upon mutual handover confirmation.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                <span>6-digit cryptographic OTP prevents false handovers.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                <span>Transparent scoring without discriminatory black-boxes.</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500">
          <p>© {new Date().getFullYear()} GiveNearby. Hyperlocal community donation platform.</p>
          <div className="flex space-x-6 mt-4 sm:mt-0">
            <Link href="/about" className="hover:text-slate-400">About</Link>
            <Link href="/how-it-works" className="hover:text-slate-400">Security & Privacy</Link>
            <Link href="/impact" className="hover:text-slate-400">Verified Impact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
