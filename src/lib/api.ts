import { RequestInit } from "next/dist/server/web/spec-extension/request";

import { useAuthStore } from "@/stores/authStore";

export async function apiFetch<T>(url: string, options: RequestInit = {}) {
  const { accessToken } = useAuthStore.getState();
  if (!accessToken) throw new Error("No access token");

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}${url}`, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

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
