"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { UserSession } from "@/types";

interface UserProfileDetails extends UserSession {
  stats?: {
    remindersCount: number;
    memoriesCount: number;
    pendingTasksCount: number;
  };
  telegram?: {
    isConnected: boolean;
    username?: string;
    firstName?: string;
    connectedAt?: string;
    connectionToken?: string;
  };
  profile?: {
    defaultMorningTime: string;
    defaultEveningTime: string;
    defaultOffsetsJson: string;
    notificationPreferences: string;
  };
}

interface AuthContextType {
  user: UserProfileDetails | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refreshUser: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfileDetails | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch("/api/auth/me", { headers });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
      }
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
