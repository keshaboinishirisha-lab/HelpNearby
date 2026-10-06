"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { api, NotificationItem } from "@/lib/api";
import {
  HeartHandshake,
  Compass,
  Sparkles,
  Bell,
  User as UserIcon,
  LogOut,
  Shield,
  Truck,
  Building2,
  PlusCircle,
  Menu,
  X,
  Award
} from "lucide-react";

export function Navbar() {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifDropdown, setNotifDropdown] = useState(false);

  useEffect(() => {
    if (user) {
      api.getNotifications()
        .then((items) => {
          setNotifications(items);
          setUnreadCount(items.filter((n) => !n.is_read).length);
        })
        .catch(() => {});
    }
  }, [user]);

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {}
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-bold text-slate-900 tracking-tight flex items-center">
                Give<span className="text-emerald-600">Nearby</span>
              </span>
              <span className="block text-[10px] font-medium text-slate-500 tracking-wide uppercase -mt-1">
                Hyperlocal Community Aid
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium text-slate-600">
            <Link href="/browse/donations" className="hover:text-emerald-600 transition flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-emerald-500" />
              Find Donations
            </Link>
            <Link href="/browse/requests" className="hover:text-emerald-600 transition flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Community Requests
            </Link>
            <Link href="/how-it-works" className="hover:text-emerald-600 transition">
              How It Works
            </Link>
            <Link href="/impact" className="hover:text-emerald-600 transition">
              Impact
            </Link>
            <Link href="/about" className="hover:text-emerald-600 transition">
              About
            </Link>
          </nav>

          {/* User Controls */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <Link
                  href="/matches"
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition border border-emerald-200 flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  Smart Matches
                </Link>

                <div className="relative">
                  <button
                    onClick={() => setNotifDropdown(!notifDropdown)}
                    className="p-2 text-slate-600 hover:text-emerald-600 hover:bg-slate-100 rounded-full transition relative"
                    title="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white animate-pulse" />
                    )}
                  </button>

                  {/* Notifications Dropdown */}
                  {notifDropdown && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
                      <div className="px-4 py-2 border-b border-slate-100 flex justify-between items-center">
                        <span className="font-semibold text-xs text-slate-800 uppercase tracking-wider">
                          Notifications ({unreadCount})
                        </span>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            className="text-[11px] text-emerald-600 hover:underline"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                        {notifications.length === 0 ? (
                          <div className="p-4 text-center text-xs text-slate-500">
                            No notifications yet
                          </div>
                        ) : (
                          notifications.slice(0, 5).map((n) => (
                            <Link
                              key={n.id}
                              href={n.link || "/notifications"}
                              onClick={() => setNotifDropdown(false)}
                              className={`block px-4 py-3 hover:bg-slate-50 transition text-left ${
                                !n.is_read ? "bg-emerald-50/50" : ""
                              }`}
                            >
                              <p className="text-xs font-semibold text-slate-900">{n.title}</p>
                              <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">{n.message}</p>
                            </Link>
                          ))
                        )}
                      </div>
                      <div className="px-4 py-2 border-t border-slate-100 text-center">
                        <Link
                          href="/notifications"
                          onClick={() => setNotifDropdown(false)}
                          className="text-xs font-medium text-emerald-600 hover:underline"
                        >
                          View all notifications
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                {/* Dashboard & Role Links */}
                <Link
                  href="/dashboard"
                  className="px-3.5 py-1.5 rounded-lg text-sm font-medium bg-slate-900 text-white hover:bg-slate-800 transition"
                >
                  Dashboard
                </Link>

                {/* User menu / Trust Score */}
                <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
                  <div className="flex flex-col text-right">
                    <span className="text-xs font-semibold text-slate-800 truncate max-w-[120px]">
                      {user.name.split(" ")[0]}
                    </span>
                    <span className="text-[10px] text-emerald-700 font-medium flex items-center justify-end gap-0.5">
                      <Award className="w-3 h-3 text-emerald-600" />
                      {user.trust_score.toFixed(0)} Trust
                    </span>
                  </div>
                  <button
                    onClick={logout}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Log out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  href="/login"
                  className="text-sm font-medium text-slate-700 hover:text-emerald-600 transition"
                >
                  Log In
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition shadow-sm shadow-emerald-600/30"
                >
                  Join GiveNearby
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-6 space-y-3">
          <Link
            href="/browse/donations"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-slate-700 font-medium py-2"
          >
            Find Donations
          </Link>
          <Link
            href="/browse/requests"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-slate-700 font-medium py-2"
          >
            Community Requests
          </Link>
          <Link
            href="/how-it-works"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-slate-700 font-medium py-2"
          >
            How It Works
          </Link>
          <Link
            href="/impact"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-slate-700 font-medium py-2"
          >
            Social Impact
          </Link>

          {user ? (
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-center py-2 bg-slate-900 text-white rounded-lg font-medium text-sm"
              >
                Go to Dashboard
              </Link>
              <Link
                href="/matches"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-center py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-medium text-sm"
              >
                View Smart Matches
              </Link>
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-center py-2 text-rose-600 text-sm font-medium"
              >
                Log Out
              </button>
            </div>
          ) : (
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-center py-2 border border-slate-300 text-slate-800 rounded-lg font-medium text-sm"
              >
                Log In
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-center py-2 bg-emerald-600 text-white rounded-lg font-medium text-sm"
              >
                Join GiveNearby
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
