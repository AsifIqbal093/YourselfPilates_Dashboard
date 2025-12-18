import { useAuthStore } from "@/stores/authStore";
import { PaginatedVideoResponse, Video } from "@/types/api";
import { Order } from "@/types/api";

import { apiFetch } from "./api";

export interface AnalyticsData {
  total_bookings: number;
  total_confirmed_bookings: number;
  total_canceled_bookings: number;
  confirmed_last_7_days: number;
  confirmed_last_30_days: number;
  confirmed_last_3_months: number;
  total_students: number;
  total_teachers: number;
}

interface OrdersResponse {
  results: Order[];
}

export async function cancelBookingById(bookingId: number) {
  return apiFetch(`/booking/bookings/${bookingId}/reject/`, {
    method: "GET",
    credentials: "include", // remove if not needed
  });
}

export async function getAnalytics(): Promise<AnalyticsData> {
  return apiFetch("/dashboard/analytics/");
}

export async function getVideos(): Promise<Video[]> {
  const res: PaginatedVideoResponse = await apiFetch("/dashboard/videos/");
  return res.results;
}

export async function getVideoDetail(id: number): Promise<Video> {
  return apiFetch(`/dashboard/videos/${id}/`);
}

export async function deleteVideo(id: number) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/dashboard/videos/${id}/`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${useAuthStore.getState().accessToken}`,
      },
      credentials: "include",
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to delete video");
  }

  // DELETE requests often return no content, so don't try to parse JSON
  return response;
}

export async function deleteBooking(id: number) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/booking/bookings/${id}/`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${useAuthStore.getState().accessToken}`,
      },
      credentials: "include",
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to delete booking");
  }

  return response;
}

export async function deleteStudent(id: number) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/students/${id}/`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${useAuthStore.getState().accessToken}`,
      },
      credentials: "include",
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to delete student");
  }

  return response;
}

export async function deleteProfessor(id: number) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/users/${id}/`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${useAuthStore.getState().accessToken}`,
      },
      credentials: "include",
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to delete professor");
  }

  return response;
}

export async function uploadVideo({
  file,
  title,
  description,
}: {
  file: File;
  title: string;
  description: string;
}): Promise<Video> {
  const formData = new FormData();
  formData.append("video_file", file);
  formData.append("title", title);
  formData.append("description", description);

  // Use fetch directly for multipart/form-data
  const { accessToken } = useAuthStore.getState();
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/dashboard/videos/`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        // 'Content-Type' should NOT be set for FormData
      },
      body: formData,
      credentials: "include",
    }
  );
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || "Failed to upload video");
  }
  return res.json();
}

export interface Pack {
  id: number;
  title: string;
  description: string;
  image: string;
  active: boolean;
  price: string;
  total_hours?: number;
  created_at?: string;
  updated_at?: string;
}

export interface PaginatedPackResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Pack[];
}

export interface CreatePackPayload {
  title: string;
  description: string;
  image?: File | string;
  active: boolean;
  price: string;
  total_hours?: number;
}

export async function getPacks(page = 1): Promise<PaginatedPackResponse> {
  return apiFetch(`/subscriptions/packs/?page=${page}`);
}

export async function getPackById(id: number): Promise<Pack> {
  return apiFetch(`/subscriptions/packs/${id}/`);
}

export async function createPack(
  payload: CreatePackPayload & { image?: File }
): Promise<Pack> {
  const { accessToken } = useAuthStore.getState();
  if (!accessToken) throw new Error("No access token");

  const formData = new FormData();
  formData.append("title", payload.title);
  formData.append("description", payload.description);
  formData.append("active", payload.active.toString());
  formData.append("price", payload.price);

  if (payload["total_hours"] !== undefined) {
    formData.append("total_hours", payload["total_hours"].toString());
  }

  if (payload.image instanceof File) {
    formData.append("image", payload.image);
  }

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/subscriptions/packs/`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        // Don't set Content-Type for FormData, browser will set it with boundary
      },
      body: formData,
      credentials: "include",
    }
  );

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || "Failed to create pack");
  }

  return res.json();
}

export async function updatePack(
  id: number,
  payload: Partial<CreatePackPayload> & { image?: File }
): Promise<Pack> {
  const { accessToken } = useAuthStore.getState();
  if (!accessToken) throw new Error("No access token");

  const formData = new FormData();

  if (payload.title !== undefined) {
    formData.append("title", payload.title);
  }
  if (payload.description !== undefined) {
    formData.append("description", payload.description);
  }
  if (payload.active !== undefined) {
    formData.append("active", payload.active.toString());
  }
  if (payload.price !== undefined) {
    formData.append("price", payload.price);
  }

  if (payload["total_hours"] !== undefined) {
    formData.append("total_hours", payload["total_hours"].toString());
  }

  if (payload.image instanceof File) {
    formData.append("image", payload.image);
  }

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/subscriptions/packs/${id}/`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        // Don't set Content-Type for FormData, browser will set it with boundary
      },
      body: formData,
      credentials: "include",
    }
  );

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || "Failed to update pack");
  }

  return res.json();
}

export async function deletePack(id: number) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/subscriptions/packs/${id}/`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${useAuthStore.getState().accessToken}`,
      },
      credentials: "include",
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to delete pack");
  }

  return response;
}

export async function subscribeToPack(packId: number) {
  return apiFetch(`/subscriptions/packs/${packId}/subscribe/`, {
    method: "POST",
  });
}

export async function getOrders(): Promise<OrdersResponse> {
  return apiFetch("/subscriptions/orders/", {
    method: "GET",
  });
}
