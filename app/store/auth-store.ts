import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import type { AuthUser } from "@/lib/api";

type AuthState = {
  user: AuthUser | null;
  token: string | null;
  isLoaded: boolean;
  setAuth: (user: AuthUser, token: string) => void;
  clearAuth: () => void;
  loadFromStorage: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoaded: false,

  setAuth: async (user, token) => {
    await SecureStore.setItemAsync("auth_token", token);
    await SecureStore.setItemAsync("auth_user", JSON.stringify(user));
    set({ user, token });
  },

  clearAuth: async () => {
    await SecureStore.deleteItemAsync("auth_token");
    await SecureStore.deleteItemAsync("auth_user");
    set({ user: null, token: null });
  },

  loadFromStorage: async () => {
    try {
      const [token, userRaw] = await Promise.all([
        SecureStore.getItemAsync("auth_token"),
        SecureStore.getItemAsync("auth_user"),
      ]);
      if (token && userRaw) {
        set({ user: JSON.parse(userRaw), token, isLoaded: true });
      } else {
        set({ isLoaded: true });
      }
    } catch {
      set({ isLoaded: true });
    }
  },
}));
