"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api, VolunteerTask } from "@/lib/api";
import {
  Bike,
  MapPin,
  Clock,
  CheckCircle2,
  Package,
  ArrowRight,
  ShieldCheck,
  AlertCircle
} from "lucide-react";

export default function VolunteerPortalPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [tasks, setTasks] = useState<VolunteerTask[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = () => {
    setLoading(true);
    api.getVolunteerTasks()
      .then(setTasks)
      .catch(() => setTasks([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (user) {
      fetchTasks();
    }
  }, [user, authLoading]);

  const handleAcceptTask = async (taskId: number) => {
    try {
      await api.acceptVolunteerTask(taskId);
      alert("You have claimed this delivery task! The donor and recipient have been notified.");
      fetchTasks();
    } catch (err: any) {
      alert(err.message || "Failed to claim task");
    }
  };

  const handleStatusUpdate = async (taskId: number, status: string) => {
    try {
      await api.updateVolunteerTaskStatus(taskId, status);
      fetchTasks();
    } catch (err: any) {
      alert(err.message || "Failed to update delivery status");
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Title */}
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white p-8 rounded-3xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2">
            <Bike className="w-5 h-5 text-indigo-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
              Community Delivery Corps
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">
            Volunteer Logistics Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Help transport donations to elderly, disabled, or transport-constrained neighbors.
          </p>
        </div>

        <div className="bg-white/10 px-5 py-3 rounded-2xl border border-white/20 text-center">
          <span className="text-[10px] uppercase font-bold text-indigo-300 block">
            Your Contributed Hours
          </span>
          <span className="text-2xl font-black text-white">
            14.5 <span className="text-xs font-normal">hrs</span>
          </span>
        </div>
      </div>

      {/* Available Delivery Requests */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Package className="w-5 h-5 text-emerald-600" />
          Active Delivery Runs Needing Transport ({tasks.length})
        </h2>

        {loading ? (
          <div className="text-center py-12 text-slate-500">Loading delivery tasks...</div>
        ) : tasks.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-xs text-slate-500 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <p className="font-semibold text-slate-700">No pending delivery runs in your radius right now.</p>
            <p>Check back soon when mutual handovers requesting volunteer transport are confirmed.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-indigo-600 flex items-center gap-1">
                      <Bike className="w-3.5 h-3.5" />
                      {task.distance_km} km run (~{task.estimated_hours} hrs)
                    </span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {task.status}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-xs">
                    <p className="text-slate-600">
                      <strong>Pickup:</strong> {task.pickup_address}
                    </p>
                    <p className="text-slate-600">
                      <strong>Dropoff:</strong> {task.dropoff_address}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  {task.status === "available" ? (
                    <button
                      onClick={() => handleAcceptTask(task.id)}
                      className="w-full py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition"
                    >
                      Accept Delivery Run
                    </button>
                  ) : task.volunteer_id === user?.id ? (
                    <div className="flex gap-2 w-full">
                      {task.status === "accepted" && (
                        <button
                          onClick={() => handleStatusUpdate(task.id, "picked_up")}
                          className="flex-1 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-bold hover:bg-amber-600"
                        >
                          Mark Picked Up
                        </button>
                      )}
                      {task.status === "picked_up" && (
                        <button
                          onClick={() => handleStatusUpdate(task.id, "in_transit")}
                          className="flex-1 py-1.5 bg-cyan-600 text-white rounded-lg text-xs font-bold hover:bg-cyan-700"
                        >
                          Mark In Transit
                        </button>
                      )}
                      {task.status === "in_transit" && (
                        <button
                          onClick={() => handleStatusUpdate(task.id, "delivered")}
                          className="flex-1 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700"
                        >
                          Confirm Delivered
                        </button>
                      )}
                      <Link
                        href={`/handover/${task.handover_id}`}
                        className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-200"
                      >
                        OTP Portal
                      </Link>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">Claimed by another volunteer</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
