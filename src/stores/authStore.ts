// store/authStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  email: string;
  full_name: string;
  role: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  // eslint-disable-next-line
  login: (tokens: {
    access: string;
    refresh: string;
    email: string;
    full_name: string;
    role: string;
  }) => void;
  // eslint-disable-next-line no-unused-vars
  logout: (_redirect?: boolean) => void;
  // eslint-disable-next-line
  setTokens: (access: string, refresh: string) => void;
  // eslint-disable-next-line
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      login: (tokens) => {
        const user = {
          email: tokens.email,
          full_name: tokens.full_name,
          role: tokens.role,
        };

        set({
          user,
          accessToken: tokens.access,
          refreshToken: tokens.refresh,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      logout: (redirect = true) => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
        });
        // Remove cookie
        document.cookie =
          "auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        // Remove from localStorage if you persist there
        localStorage.removeItem("auth-storage");
        // Redirect if requested
        if (redirect) {
          window.location.href = "/login";
        }
      },

      setTokens: (access, refresh) => {
        set({
          accessToken: access,
          refreshToken: refresh,
        });
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
