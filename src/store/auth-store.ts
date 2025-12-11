"use client";

import { create } from "zustand";

interface AuthState {
  isLoggingIn: boolean;
  setIsLoggingIn: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isLoggingIn: false,
  setIsLoggingIn: (value) => set({ isLoggingIn: value }),
}));
