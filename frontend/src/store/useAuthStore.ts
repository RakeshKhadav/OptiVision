"use client";
import { create } from "zustand";
import { api } from "@/lib/api";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
  hydrateFromStorage: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post("/users/login", { email, password });
      if (res.data.success) {
        const { user, token } = res.data.data;
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        set({ user, token, isLoading: false });
        return true;
      }
      set({ error: res.data.message || "Login failed", isLoading: false });
      return false;
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Login failed. Please try again.";
      set({ error: message, isLoading: false });
      return false;
    }
  },

  register: async (name: string, email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post("/users/register", { name, email, password });
      if (res.data.success) {
        const { newUser, token } = res.data.data;
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(newUser));
        set({ user: newUser, token, isLoading: false });
        return true;
      }
      set({
        error: res.data.message || "Registration failed",
        isLoading: false,
      });
      return false;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        "Registration failed. Please try again.";
      set({ error: message, isLoading: false });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    set({ user: null, token: null });
  },

  clearError: () => set({ error: null }),

  hydrateFromStorage: () => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      const userStr = localStorage.getItem("user");
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          set({ user, token });
        } catch {
          // Invalid stored data, clear it
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        }
      }
    }
  },
}));
