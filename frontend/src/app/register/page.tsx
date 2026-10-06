"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { HeartHandshake, Lock, Mail, User as UserIcon, Phone, MapPin, Building2, Bike } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { register, userLocation, requestLocation } = useAuth();
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"donor_recipient" | "volunteer" | "ngo">("donor_recipient");
  const [organizationName, setOrganizationName] = useState("");
  const [approxAddress, setApproxAddress] = useState(userLocation.address || "Mission District, San Francisco, CA");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await register({
        name,
        email,
        password,
        phone: phone || undefined,
        role,
        organization_name: role === "ngo" ? organizationName : undefined,
        approx_lat: userLocation.lat,
        approx_lng: userLocation.lng,
        approx_address: approxAddress,
      });
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white mx-auto shadow-md shadow-emerald-500/20">
          <HeartHandshake className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Join GiveNearby</h1>
        <p className="text-xs text-slate-500">
          Donate goods, request supplies, or volunteer for local delivery runs.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        {/* Role Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">How would you like to participate?</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setRole("donor_recipient")}
              className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                role === "donor_recipient"
                  ? "border-emerald-600 bg-emerald-50 text-emerald-800 font-bold"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <HeartHandshake className="w-4 h-4 text-emerald-600" />
              <span className="text-[11px]">Neighbor</span>
            </button>

            <button
              type="button"
              onClick={() => setRole("volunteer")}
              className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                role === "volunteer"
                  ? "border-emerald-600 bg-emerald-50 text-emerald-800 font-bold"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Bike className="w-4 h-4 text-indigo-600" />
              <span className="text-[11px]">Volunteer</span>
            </button>

            <button
              type="button"
              onClick={() => setRole("ngo")}
              className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                role === "ngo"
                  ? "border-emerald-600 bg-emerald-50 text-emerald-800 font-bold"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Building2 className="w-4 h-4 text-teal-600" />
              <span className="text-[11px]">NGO / Org</span>
            </button>
          </div>
        </div>

        {role === "ngo" && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Organization / Shelter Name</label>
            <input
              type="text"
              required
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              placeholder="e.g. Hope Community Food Pantry"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
          <div className="relative">
            <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@example.org"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Phone (Optional)</label>
          <div className="relative">
            <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1-555-0100"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-xs font-semibold text-slate-700">General Neighborhood</label>
            <button
              type="button"
              onClick={requestLocation}
              className="text-[11px] text-emerald-600 font-semibold hover:underline"
            >
              Use GPS Area
            </button>
          </div>
          <div className="relative">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            <input
              type="text"
              required
              value={approxAddress}
              onChange={(e) => setApproxAddress(e.target.value)}
              placeholder="e.g. Valencia Corridor, San Francisco"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            🔒 Privacy Guarantee: Your exact address is never public. Only this general neighborhood centroid is shown.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 transition disabled:opacity-50 shadow-md shadow-emerald-600/20"
        >
          {loading ? "Creating Account..." : "Complete Registration"}
        </button>
      </form>

      <div className="text-center text-xs text-slate-500">
        Already registered?{" "}
        <Link href="/login" className="text-emerald-600 font-semibold hover:underline">
          Log in here
        </Link>
      </div>
    </div>
  );
}
