"use client";
/* eslint-disable no-console */

import { PencilIcon } from "lucide-react";
import { useEffect, useState } from "react";
import swal from "sweetalert";

import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableLoader } from "@/components/ui/TableLoader";
import { apiFetch } from "@/lib/api";
import { cancelBookingById, deleteBooking } from "@/lib/apiActions";
import { Booking, PaginatedResponse } from "@/types/api";

import { BookingModal } from "./BookingModal";

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);

  // ✅ Backend pagination
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [prevUrl, setPrevUrl] = useState<string | null>(null);

  const [modal, setModal] = useState<{ open: boolean; data: Booking | null }>({
    open: false,
    data: null,
  });

  const [loading, setLoading] = useState(true);
  const [cancelLoadingId, setCancelLoadingId] = useState<number | null>(null);
  const [deleteLoadingId, setDeleteLoadingId] = useState<number | null>(null);

  // ✅ Fetch (Backend Controlled)
  async function fetchBookings(url: string = "/booking/bookings/") {
    setLoading(true);
    try {
      const res: PaginatedResponse<Booking> = await apiFetch(url);

      setBookings(res.results);
      setNextUrl(res.next);
      setPrevUrl(res.previous);
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchBookings();
  }, []);

  const openAdd = () => setModal({ open: true, data: null });
  const openEdit = (booking: Booking) =>
    setModal({ open: true, data: booking });

  // ✅ Cancel Booking
  const handleCancelBooking = async (bookingId: number) => {
    setCancelLoadingId(bookingId);
    try {
      await cancelBookingById(bookingId);
      fetchBookings();
    } catch (error) {
      console.error(error);
    } finally {
      setCancelLoadingId(null);
    }
  };

  // ✅ Delete Booking
  const handleDeleteBooking = async (bookingId: number) => {
    const confirm = await swal({
      title: "Are you sure?",
      text: "This will permanently delete the booking.",
      icon: "warning",
      buttons: ["Cancel", "Delete"],
      dangerMode: true,
    });

    if (!confirm) return;

    setDeleteLoadingId(bookingId);

    try {
      await deleteBooking(bookingId);

      swal({
        title: "Deleted!",
        text: "Booking deleted successfully!",
        icon: "success",
      });

      fetchBookings();
    } catch (error) {
      swal({
        title: "Error!",
        text: (error as Error)?.message || "Delete failed",
        icon: "error",
      });
    } finally {
      setDeleteLoadingId(null);
    }
  };

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Bookings</h2>
        <Button onClick={openAdd}>Adicionar Nova Marcação</Button>
      </div>

      {/* Loader */}
      {loading ? (
        <TableLoader />
      ) : (
        <>
          {/* Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Booking Title</TableHead>
                <TableHead>Nome Professor</TableHead>
                <TableHead>Data Marcação</TableHead>
                <TableHead>Data Treino</TableHead>
                <TableHead>Approval</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {bookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    No bookings found
                  </TableCell>
                </TableRow>
              ) : (
                bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>{booking.title}</TableCell>
                    <TableCell>{booking.professor_details.full_name}</TableCell>

                    <TableCell>
                      {new Date(booking.created_at).toLocaleString()}
                    </TableCell>

                    <TableCell>
                      {new Date(booking.booking_date).toLocaleDateString()}{" "}
                      {booking.time_slot}
                    </TableCell>

                    {/* Cancel */}
                    <TableCell>
                      <Button
                        variant="destructive"
                        disabled={
                          booking.status === "cancelled" ||
                          cancelLoadingId === booking.id
                        }
                        onClick={() => handleCancelBooking(booking.id)}
                      >
                        {booking.status === "cancelled"
                          ? "Cancelled"
                          : cancelLoadingId === booking.id
                            ? "Cancelling..."
                            : "Cancel"}
                      </Button>
                    </TableCell>

                    {/* Actions */}
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEdit(booking)}
                        >
                          <PencilIcon className="w-4 h-4 mr-1" /> Edit
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-500 text-red-600 hover:bg-red-500 hover:text-white"
                          disabled={
                            booking.status !== "cancelled" ||
                            deleteLoadingId === booking.id
                          }
                          onClick={() => handleDeleteBooking(booking.id)}
                        >
                          {deleteLoadingId === booking.id
                            ? "Deleting..."
                            : "Delete"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* ✅ Backend Pagination */}
          <Pagination className="mt-4">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (prevUrl) fetchBookings(prevUrl);
                  }}
                  className={!prevUrl ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (nextUrl) fetchBookings(nextUrl);
                  }}
                  className={!nextUrl ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </>
      )}

      {/* Modal */}
      <BookingModal
        open={modal.open}
        onOpenChange={(open) =>
          setModal({ open, data: open ? modal.data : null })
        }
        onSuccess={() => fetchBookings()}
        initialData={modal.data}
      />
    </div>
  );
}
