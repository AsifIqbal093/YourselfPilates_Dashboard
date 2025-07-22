import { useAuthStore } from "@/stores/authStore";
import { PaginatedVideoResponse, Video } from "@/types/api";

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
