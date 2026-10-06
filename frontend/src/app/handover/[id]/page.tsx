"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { api, Handover } from "@/lib/api";
import {
  KeyRound,
  ShieldCheck,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Award,
  ArrowRight,
  HeartHandshake,
  Lock,
  Building,
  Star
} from "lucide-react";

export default function HandoverRoomPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const handoverId = Number(params?.id);
  const [handover, setHandover] = useState<Handover | null>(null);
  const [safePoints, setSafePoints] = useState<Array<{ name: string; type: string; note: string }>>([]);
  const [loading, setLoading] = useState(true);

  // Scheduling state
  const [pickupSpot, setPickupSpot] = useState("");
  const [schedDate, setSchedDate] = useState("");
  const [schedLoading, setSchedLoading] = useState(false);

  // OTP Verification state
  const [inputCode, setInputCode] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifySuccess, setVerifySuccess] = useState(false);

  const fetchHandoverData = () => {
    if (!handoverId) return;
    setLoading(true);
    api.getHandover(handoverId)
      .then((h) => {
        setHandover(h);
        setPickupSpot(h.safe_pickup_location);
        if (h.scheduled_time) {
          setSchedDate(new Date(h.scheduled_time).toISOString().slice(0, 16));
        }
        return api.getSafePoints(h.id);
      })
      .then((pts) => setSafePoints(pts.safe_points || []))
      .catch((err) => {
        console.error("Handover fetch error:", err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchHandoverData();
  }, [handoverId]);

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handover) return;
    setSchedLoading(true);
    try {
      const updated = await api.scheduleHandover(handover.id, {
        safe_pickup_location: pickupSpot,
        scheduled_time: schedDate ? new Date(schedDate).toISOString() : undefined,
      });
      setHandover(updated);
      alert("Pickup location & schedule updated!");
    } catch (err: any) {
      alert(err.message || "Failed to update schedule");
    } finally {
      setSchedLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handover) return;
    setVerifyError(null);
    setVerifyLoading(true);

    try {
      const updated = await api.verifyHandover(handover.id, inputCode);
      setHandover(updated);
      setVerifySuccess(true);
    } catch (err: any) {
      setVerifyError(err.message || "Invalid OTP code. Please verify the code with the recipient.");
    } finally {
      setVerifyLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-slate-500">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        Loading Safe Handover Room...
      </div>
    );
  }

  if (!handover) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Handover Not Found</h2>
        <p className="text-xs text-slate-500">Could not find an active handover for this ID.</p>
        <Link href="/dashboard" className="inline-block px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const isDonor = user?.id === handover.donor_id;
  const isRecipient = user?.id === handover.recipient_id;
  const isCompleted = handover.status === "completed";

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Handover Room Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
              Cryptographic Safe Handover Portal
            </span>
            <span
              className={`text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                isCompleted
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-teal-100 text-teal-800 animate-pulse"
              }`}
            >
              {handover.status}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            {handover.donation_title || "Community Handover"}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Donor: <strong>{handover.donor_name}</strong> • Recipient: <strong>{handover.recipient_name}</strong>
          </p>
        </div>

        {isCompleted && (
          <Link
            href={`/ratings/${handover.id}`}
            className="px-5 py-2.5 rounded-2xl bg-amber-500 text-white font-bold text-xs hover:bg-amber-600 transition flex items-center gap-1.5 shadow-md shadow-amber-500/20"
          >
            <Star className="w-4 h-4" />
            Leave Rating & Feedback
          </Link>
        )}
      </div>

      {/* Completion Celebration Banner */}
      {isCompleted && (
        <div className="p-6 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-3xl shadow-lg space-y-3 text-center sm:text-left sm:flex sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center justify-center sm:justify-start gap-2 font-bold text-lg">
              <CheckCircle2 className="w-6 h-6 text-emerald-200" />
              Handover Successfully Verified & Completed!
            </div>
            <p className="text-xs text-emerald-100 mt-1">
              Social impact has been recorded, trust scores incremented (+2.5 pts), and item is marked reused.
            </p>
          </div>
          <Link
            href={`/ratings/${handover.id}`}
            className="inline-block mt-3 sm:mt-0 px-5 py-2.5 bg-white text-emerald-900 rounded-xl font-bold text-xs hover:bg-emerald-50 transition shadow-sm"
          >
            Submit Feedback ★
          </Link>
        </div>
      )}

      {/* Verification Code Box (OTP Exchange) */}
      {!isCompleted && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Recipient View: Shows 6-digit OTP */}
          <div className={`p-6 rounded-3xl border ${isRecipient ? "bg-emerald-50/70 border-emerald-300" : "bg-white border-slate-200"} shadow-sm space-y-4`}>
            <div className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base font-bold text-slate-900">
                Recipient Verification Code (OTP)
              </h2>
            </div>

            {handover.verification_code ? (
              <div className="space-y-3">
                <p className="text-xs text-slate-600 leading-relaxed">
                  When you meet the donor at the pickup location, <strong>show them this 6-digit code</strong>. They will enter it into their device to confirm the handover.
                </p>
                <div className="bg-white p-5 rounded-2xl border-2 border-dashed border-emerald-400 text-center shadow-inner">
                  <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest block mb-1">
                    Your One-Time Code
                  </span>
                  <span className="text-4xl font-mono font-black text-emerald-700 tracking-widest">
                    {handover.verification_code}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 italic text-center">
                  Do not share this code remotely over phone or chat. Only reveal it in person when receiving the item.
                </p>
              </div>
            ) : (
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center text-xs text-slate-500 space-y-2">
                <Lock className="w-6 h-6 text-slate-400 mx-auto" />
                <p className="font-semibold text-slate-700">Code Hidden for Donor</p>
                <p className="text-[11px]">
                  The recipient has this code on their screen. When you physically meet, ask them for their 6-digit code and enter it below.
                </p>
              </div>
            )}
          </div>

          {/* Donor View: Inputs 6-digit OTP to verify */}
          <div className={`p-6 rounded-3xl border ${isDonor ? "bg-slate-900 text-white border-slate-800" : "bg-white border-slate-200"} shadow-sm space-y-4`}>
            <div className="flex items-center gap-2">
              <ShieldCheck className={`w-5 h-5 ${isDonor ? "text-emerald-400" : "text-emerald-600"}`} />
              <h2 className="text-base font-bold">
                Donor Verification Handshake
              </h2>
            </div>

            <p className={`text-xs leading-relaxed ${isDonor ? "text-slate-300" : "text-slate-600"}`}>
              Once the recipient shows you their 6-digit code, enter it below to immediately verify the physical handover.
            </p>

            {verifyError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{verifyError}</span>
              </div>
            )}

            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div>
                <label className={`block text-xs font-bold mb-1.5 ${isDonor ? "text-slate-200" : "text-slate-800"}`}>
                  Enter 6-Digit Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  placeholder="e.g. 849201"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  className={`w-full text-center font-mono text-2xl font-bold tracking-widest px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    isDonor
                      ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500"
                      : "bg-white border-slate-200 text-slate-900"
                  }`}
                />
              </div>

              <button
                type="submit"
                disabled={verifyLoading || inputCode.length < 6}
                className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold text-xs sm:text-sm hover:bg-emerald-700 transition disabled:opacity-50 shadow-md shadow-emerald-600/30"
              >
                {verifyLoading ? "Verifying..." : "Verify Code & Complete Handover"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Meeting Location & Scheduling Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-600" />
              Pickup Location & Schedule
            </h2>
            <p className="text-xs text-slate-500">
              Coordinate a public, well-lit community handover spot.
            </p>
          </div>
        </div>

        <form onSubmit={handleScheduleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Meeting Spot / Address
              </label>
              <input
                type="text"
                required
                value={pickupSpot}
                onChange={(e) => setPickupSpot(e.target.value)}
                placeholder="e.g. Public Library Entrance, Civic Center Lobby"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Scheduled Date & Time
              </label>
              <input
                type="datetime-local"
                value={schedDate}
                onChange={(e) => setSchedDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>
          </div>

          {!isCompleted && (
            <button
              type="submit"
              disabled={schedLoading}
              className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition disabled:opacity-50"
            >
              {schedLoading ? "Updating..." : "Update Meeting Spot"}
            </button>
          )}
        </form>

        {/* Recommended Safe Points */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
            Suggested Safe Public Meeting Points:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {safePoints.map((pt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setPickupSpot(pt.name)}
                className="p-3 bg-slate-50 hover:bg-emerald-50/60 rounded-xl border border-slate-200 text-left transition flex items-start gap-2.5 group"
              >
                <Building className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5 group-hover:scale-110 transition" />
                <div>
                  <span className="text-xs font-bold text-slate-900 group-hover:text-emerald-800 block">
                    {pt.name}
                  </span>
                  <span className="text-[11px] text-slate-500 block">{pt.note}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
