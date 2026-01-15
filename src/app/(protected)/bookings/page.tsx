/* eslint-disable no-console */
"use client";
import { PencilIcon } from "lucide-react";
import { Trash2Icon } from "lucide-react";
import { useEffect, useState } from "react";
import swal from "sweetalert";

import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
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
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<{ open: boolean; data: Booking | null }>({
    open: false,
    data: null,
  });
  const [loading, setLoading] = useState(true);

  const [cancelLoadingId, setCancelLoadingId] = useState<number | null>(null);
  const handleCancelBooking = async (bookingId: number) => {
    setCancelLoadingId(bookingId);
    try {
      await cancelBookingById(bookingId);
      await fetchBookings(page);
    } catch (error) {
      // Optionally show error
      console.error(error);
    } finally {
      setCancelLoadingId(null);
    }
  };

  const [deleteLoadingId, setDeleteLoadingId] = useState<number | null>(null);

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
      await fetchBookings(page);
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

  async function fetchBookings(page: number) {
    setLoading(true);
    try {
      const res: PaginatedResponse<Booking> = await apiFetch(
        `/booking/bookings/?page=${page}`
      );
      setBookings(res.results);
      setCount(res.count);
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
      // Fallback to empty array if API fails
      setBookings([]);
      setCount(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchBookings(page);
  }, [page]);

  const openAdd = () => setModal({ open: true, data: null });
  const openEdit = (booking: Booking) =>
    setModal({ open: true, data: booking });

  const totalPages = Math.ceil(count / 10); // assuming 10 per page

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        Loading bookings...
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4 px-4">
        <h2 className="text-2xl font-bold">Bookings</h2>
        <Button onClick={openAdd} className="cursor-pointer">
          Adicionar Nova Marcação
        </Button>
      </div>
      {loading ? (
        <TableLoader />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Booking Title</TableHead>
                <TableHead>Nome Professor</TableHead>
                {/* <TableHead>Teacher Email</TableHead> */}
                <TableHead>Data Marcação</TableHead>
                <TableHead> Data Treino</TableHead>
                {/* <TableHead>Status</TableHead> */}
                <TableHead>Approval</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground"
                  >
                    No bookings found
                  </TableCell>
                </TableRow>
              ) : (
                bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>{booking.title}</TableCell>
                    <TableCell>{booking.professor_details.full_name}</TableCell>
                    {/* <TableCell>{booking.teacher_email}</TableCell> */}
                    <TableCell>
                      {new Date(booking.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {new Date(booking.booking_date).toLocaleDateString()}{" "}
                      {booking.time_slot}
                    </TableCell>

                    {/* <TableCell>
                      <Badge
                        variant={
                          booking?.status === "confirmed"
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        <BadgeCheckIcon />
                        {booking.status}
                      </Badge>
                    </TableCell> */}
                    <TableCell>
                      <Button
                        variant="destructive"
                        className="cursor-pointer"
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
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          className="cursor-pointer"
                          size="sm"
                          variant="outline"
                          onClick={() => openEdit(booking)}
                        >
                          <PencilIcon className="w-4 h-4 mr-1" /> Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-500 text-red-600 hover:bg-red-500 hover:text-white hover:border-red-500 cursor-pointer"
                          disabled={deleteLoadingId === booking.id}
                          onClick={() => handleDeleteBooking(booking.id)}
                        >
                          {deleteLoadingId === booking.id ? (
                            "Deleting..."
                          ) : (
                            <>
                              <Trash2Icon className="w-4 h-4 mr-1" /> Delete
                            </>
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {totalPages > 1 && (
            <Pagination className="mt-4">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className={
                      page === 1 ? "pointer-events-none opacity-50" : ""
                    }
                  />
                </PaginationItem>
                {[...Array(totalPages)].map((_, idx) => (
                  <PaginationItem key={idx}>
                    <PaginationLink
                      href="#"
                      isActive={page === idx + 1}
                      onClick={() => setPage(idx + 1)}
                    >
                      {idx + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className={
                      page === totalPages
                        ? "pointer-events-none opacity-50"
                        : ""
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}
      <BookingModal
        open={modal.open}
        onOpenChange={(open) =>
          setModal({ open, data: open ? modal.data : null })
        }
        onSuccess={() => fetchBookings(page)}
        initialData={modal.data}
      />
    </div>
  );
}
