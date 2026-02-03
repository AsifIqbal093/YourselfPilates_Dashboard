import { RequestInit } from "next/dist/server/web/spec-extension/request";

import { authService } from "@/lib/authService";
import { useAuthStore } from "@/stores/authStore";

type ApiFetchOptions = RequestInit & {
  _retry?: boolean;
};

export async function apiFetch<T>(url: string, options: ApiFetchOptions = {}) {
  const { accessToken, refreshToken, logout } = useAuthStore.getState();

  if (!accessToken) {
    logout();
    throw new Error("No access token");
  }

  const { _retry, ...fetchOptions } = options;

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}${url}`, {
    ...fetchOptions,
    headers: {
      ...fetchOptions.headers,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  // Handle 401 Unauthorized - token expired
  if (res.status === 401 && !_retry) {
    // Check if refresh token is still valid
    if (!refreshToken || authService.isTokenExpired(refreshToken)) {
      logout();
      throw new Error("Session expired");
    }

    try {
      // Attempt to refresh the access token
      await authService.refreshToken(refreshToken);
      // Retry the request with the new token (only once)
      return apiFetch<T>(url, { ...fetchOptions, _retry: true });
    } catch {
      // If refresh fails, logout and redirect
      logout();
      throw new Error("Session expired");
    }
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));

    // Handle different error formats from backend
    let errorMessage = "API error";

    if (error.message) {
      errorMessage = error.message;
    } else if (
      error.non_field_errors &&
      Array.isArray(error.non_field_errors)
    ) {
      // Join all non_field_errors if multiple exist
      errorMessage = error.non_field_errors.join(". ");
    } else if (error.detail) {
      errorMessage =
        typeof error.detail === "string"
          ? error.detail
          : JSON.stringify(error.detail);
    } else if (typeof error === "string") {
      errorMessage = error;
    }

    // Create error object with the message and full error data
    const apiError = new Error(errorMessage) as Error & { data?: unknown };
    apiError.data = error;
    throw apiError;
  }
  return res.json() as Promise<T>;
}
