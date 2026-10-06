"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User, api } from "@/lib/api";

interface LocationState {
  lat: number;
  lng: number;
  address?: string;
  hasPermission: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  userLocation: LocationState;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  requestLocation: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [userLocation, setUserLocation] = useState<LocationState>({
    lat: 37.7749,
    lng: -122.4194,
    address: "San Francisco, CA",
    hasPermission: false,
  });

  useEffect(() => {
    const savedToken = localStorage.getItem("givenearby_token");
    if (savedToken) {
      setToken(savedToken);
      api.getMe()
        .then((userData) => {
          setUser(userData);
          if (userData.approx_lat && userData.approx_lng) {
            setUserLocation((prev) => ({
              ...prev,
              lat: userData.approx_lat!,
              lng: userData.approx_lng!,
              address: userData.approx_address || prev.address,
            }));
          }
        })
        .catch(() => {
          localStorage.removeItem("givenearby_token");
          setToken(null);
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const requestLocation = async () => {
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            address: "Current Geolocation Area",
            hasPermission: true,
          });
        },
        (error) => {
          console.warn("Geolocation permission skipped or denied:", error.message);
        },
        { enableHighAccuracy: false, timeout: 8000 }
      );
    }
  };

  const login = async (email: string, password: string) => {
    const res = await api.login({ email, password });
    localStorage.setItem("givenearby_token", res.access_token);
    setToken(res.access_token);
    setUser(res.user);
  };

  const register = async (data: any) => {
    const res = await api.register(data);
    localStorage.setItem("givenearby_token", res.access_token);
    setToken(res.access_token);
    setUser(res.user);
  };

  const logout = () => {
    localStorage.removeItem("givenearby_token");
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const u = await api.getMe();
      setUser(u);
    } catch {
      // ignore
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        userLocation,
        login,
        register,
        logout,
        refreshUser,
        requestLocation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
