// lib/authService.ts
import { RequestInit } from "next/dist/server/web/spec-extension/request";

import { useAuthStore } from "@/stores/authStore";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginResponse {
  refresh: string;
  access: string;
  email: string;
  full_name: string;
  role: string;
}

interface RefreshResponse {
  access: string;
}

type AuthRequestInit = RequestInit & {
  _retry?: boolean;
};

class AuthService {
  private refreshPromise: Promise<string> | null = null;

  /* ===================== LOGIN ===================== */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/user/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Login failed");
    }

    return response.json();
  }

  /* ===================== REFRESH TOKEN ===================== */
  async refreshToken(refreshToken: string): Promise<string> {
    // Prevent multiple refresh calls
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.performRefresh(refreshToken);

    try {
      return await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async performRefresh(refreshToken: string): Promise<string> {
    // ⛔ Refresh token already expired → logout immediately
    if (this.isTokenExpired(refreshToken)) {
      useAuthStore.getState().logout();
      throw new Error("Refresh token expired");
    }

    const response = await fetch(`${API_BASE_URL}/user/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!response.ok) {
      useAuthStore.getState().logout();
      throw new Error("Token refresh failed");
    }

    const data: RefreshResponse = await response.json();

    // Update tokens in store
    useAuthStore.getState().setTokens(data.access, refreshToken);

    return data.access;
  }

  /* ===================== AUTH REQUEST ===================== */
  async makeAuthenticatedRequest(
    url: string,
    options: AuthRequestInit = {}
  ): Promise<Response> {
    const { accessToken, refreshToken, logout } = useAuthStore.getState();

    if (!accessToken || !refreshToken) {
      logout();
      throw new Error("No authentication tokens");
    }

    // First request attempt
    const { _retry, ...fetchOptions } = options;
    const response = await fetch(url, {
      ...fetchOptions,
      headers: {
        ...fetchOptions.headers,
        Authorization: `Bearer ${accessToken}`,
      },
    });

    // ⛔ Only ONE retry allowed
    if (response.status === 401 && !_retry) {
      // If refresh token expired → logout
      if (this.isTokenExpired(refreshToken)) {
        logout();
        throw new Error("Session expired");
      }

      try {
        const newAccessToken = await this.refreshToken(refreshToken);

        return fetch(url, {
          ...fetchOptions,
          headers: {
            ...fetchOptions.headers,
            Authorization: `Bearer ${newAccessToken}`,
          },
        });
      } catch {
        logout();
        throw new Error("Session expired");
      }
    }

    return response;
  }

  /* ===================== LOGOUT ===================== */
  logout(): void {
    useAuthStore.getState().logout(true);
  }

  /* ===================== TOKEN EXPIRY ===================== */
  isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch {
      return true;
    }
  }
}
export const authService = new AuthService();
