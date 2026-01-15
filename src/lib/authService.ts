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

class AuthService {
  private refreshPromise: Promise<string> | null = null;

  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/user/login/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Login failed");
    }

    return response.json();
  }

  async refreshToken(refreshToken: string): Promise<string> {
    // If there's already a refresh in progress, wait for it
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.performRefresh(refreshToken);

    try {
      const newAccessToken = await this.refreshPromise;
      return newAccessToken;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async performRefresh(refreshToken: string): Promise<string> {
    const response = await fetch(`${API_BASE_URL}/user/token/refresh/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!response.ok) {
      // If refresh fails, logout the user
      window.location.href = "/logout";
      throw new Error("Token refresh failed");
    }

    const data: RefreshResponse = await response.json();

    // Update tokens in store
    useAuthStore.getState().setTokens(data.access, refreshToken);

    return data.access;
  }

  async makeAuthenticatedRequest(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const { accessToken, refreshToken } = useAuthStore.getState();

    if (!accessToken || !refreshToken) {
      throw new Error("No authentication tokens available");
    }

    // Try the request with current access token
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${accessToken}`,
      },
    });

    // If token is expired, try to refresh
    if (response.status === 401) {
      try {
        const newAccessToken = await this.refreshToken(refreshToken);

        // Retry the original request with new token
        return fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            Authorization: `Bearer ${newAccessToken}`,
          },
        });
      } catch (error) {
        // Refresh failed, logout user
        window.location.href = "/logout";
        throw error;
      }
    }

    return response;
  }

  logout(): void {
    useAuthStore.getState().logout();
  }

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
