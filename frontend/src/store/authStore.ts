"use client";

import { create } from "zustand";
import { login as apiLogin, logout as apiLogout, getCurrentUser, type UserSession } from "@/lib/auth";

// ============================================================
// Auth Store — Reactive authentication state management
// ============================================================

interface AuthState {
  session: UserSession | null;
  isLoading: boolean;
  isInitialized: boolean;
  login: (org: string, user: string, pass: string) => Promise<UserSession>;
  logout: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  isLoading: false,
  isInitialized: false,

  initialize: () => {
    const current = getCurrentUser();
    set({ session: current, isInitialized: true });
  },

  login: async (org: string, user: string, pass: string) => {
    set({ isLoading: true });
    try {
      const session = await apiLogin(org, user, pass);
      set({ session, isLoading: false, isInitialized: true });
      return session;
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  logout: () => {
    apiLogout();
    set({ session: null, isInitialized: true });
  },
}));
