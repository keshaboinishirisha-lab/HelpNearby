"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { api, Handover } from "@/lib/api";
import { Star, Award, HeartHandshake, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";

export default function RatingPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const handoverId = Number(params?.id);
  const [handover, setHandover] = useState<Handover | null>(null);
  const [rating, setRating] = useState(5);
  const [punctuality, setPunctuality] = useState(5);
  const [itemAccuracy, setItemAccuracy] = useState(5);
  const [kindness, setKindness] = useState(5);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!handoverId) return;
    api.getHandover(handoverId)
      .then(setHandover)
      .catch(() => setHandover(null));
  }, [handoverId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handover || !user) return;
    setError(null);
    setLoading(true);

    const ratedUserId = user.id === handover.donor_id ? handover.recipient_id : handover.donor_id;

    try {
      await api.createRating({
        handover_id: handover.id,
        rated_user_id: ratedUserId,
        rating,
        punctuality,
        item_accuracy: itemAccuracy,
        kindness,
        feedback: feedback || undefined,
      });
      setSuccess(true);
      setTimeout(() => router.push("/dashboard"), 2500);
    } catch (err: any) {
      setError(err.message || "Failed to submit rating");
      setLoading(false);
    }
  };

  if (!handover) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center text-slate-500">
        Loading rating session...
      </div>
    );
  }

  const otherUserName = user?.id === handover.donor_id ? handover.recipient_name : handover.donor_name;

  return (
    <div className="max-w-xl mx-auto px-4 py-12 space-y-6">
      <Link
        href={`/handover/${handover.id}`}
        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Handover
      </Link>

      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto border border-amber-200">
          <Star className="w-6 h-6 fill-amber-400" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Rate Handover Experience</h1>
        <p className="text-xs text-slate-500">
          Your feedback rewards reliable neighbors and helps maintain safety on GiveNearby.
        </p>
      </div>

      {success ? (
        <div className="p-8 bg-white rounded-3xl border border-emerald-200 text-center space-y-3 shadow-sm">
          <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
          <h3 className="font-bold text-slate-900 text-lg">Thank You for Your Feedback!</h3>
          <p className="text-xs text-slate-500">
            Trust scores have been updated. Redirecting you to your dashboard...
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-2 text-center">
              Overall Experience with {otherUserName}
            </label>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setRating(s)}
                  className="p-2 rounded-xl transition hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 ${
                      s <= rating ? "text-amber-400 fill-amber-400" : "text-slate-200"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100 text-xs">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-700">Punctuality:</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    type="button"
                    key={s}
                    onClick={() => setPunctuality(s)}
                    className={`w-7 h-7 rounded-lg font-bold ${
                      s === punctuality ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-700">Item Accuracy:</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    type="button"
                    key={s}
                    onClick={() => setItemAccuracy(s)}
                    className={`w-7 h-7 rounded-lg font-bold ${
                      s === itemAccuracy ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-700">Kindness & Courtesy:</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    type="button"
                    key={s}
                    onClick={() => setKindness(s)}
                    className={`w-7 h-7 rounded-lg font-bold ${
                      s === kindness ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Public Note / Review (Optional)
            </label>
            <textarea
              rows={3}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Was the item in great condition? Was meeting up smooth and communicative?"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold text-xs sm:text-sm hover:bg-emerald-700 transition disabled:opacity-50 shadow-md shadow-emerald-600/30"
          >
            {loading ? "Submitting..." : "Submit Rating & Build Trust"}
          </button>
        </form>
      )}
    </div>
  );
}
