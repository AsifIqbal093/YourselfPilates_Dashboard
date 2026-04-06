"use client";

import { PencilIcon } from "lucide-react";
import { useEffect, useState } from "react";
import swal from "sweetalert";

import { Badge } from "@/components/ui/badge";
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
import { deleteProfessor } from "@/lib/apiActions";
import { PaginatedResponse, Professor, Student } from "@/types/api";

import { TeacherModal } from "./TeacherModal";

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Professor[]>([]);

  // ✅ Backend pagination state
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [prevUrl, setPrevUrl] = useState<string | null>(null);

  const [modal, setModal] = useState<{ open: boolean; data: Professor | null }>(
    {
      open: false,
      data: null,
    }
  );

  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [deleteLoadingId, setDeleteLoadingId] = useState<number | null>(null);

  // ✅ Fetch (Backend Controlled)
  async function fetchTeachers(url: string = "/user/users/?role=professor") {
    setLoading(true);
    try {
      const res: PaginatedResponse<Professor> = await apiFetch(url);

      setTeachers(res.results);
      setNextUrl(res.next);
      setPrevUrl(res.previous);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTeachers();
  }, []);

  const openAdd = () => setModal({ open: true, data: null });

  const openEdit = (teacher: Professor) =>
    setModal({ open: true, data: teacher });

  // ✅ Approval Logic
  const handleApproval = async (userId: number, approve: boolean) => {
    setActionLoadingId(userId);
    try {
      const endpoint = approve
        ? `/user/users/approve/?user_id=${userId}`
        : `/user/users/cancel/?user_id=${userId}`;

      await apiFetch(endpoint, { method: "GET" });

      swal({
        title: approve ? "Approved!" : "Approval Cancelled!",
        text: approve
          ? "User approved successfully!"
          : "Approval cancelled successfully!",
        icon: "success",
      });

      fetchTeachers();
    } catch (error: unknown) {
      swal({
        title: "Error!",
        text: (error as Error)?.message || "Action failed",
        icon: "error",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // ✅ Delete Logic
  const handleDeleteProfessor = async (prof: Professor) => {
    const confirm = await swal({
      title: "Are you sure?",
      text: `This will permanently delete ${prof.full_name}.`,
      icon: "warning",
      buttons: ["Cancel", "Delete"],
      dangerMode: true,
    });

    if (!confirm) return;

    setDeleteLoadingId(prof.id ?? null);

    try {
      await deleteProfessor(prof.id!);

      swal({
        title: "Deleted!",
        text: "Professor deleted successfully!",
        icon: "success",
      });

      fetchTeachers();
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
      <div className="flex justify-between items-center mb-4 mx-2">
        <h2 className="text-2xl font-bold">Professors</h2>
        <Button onClick={openAdd}>Add Professor</Button>
      </div>

      {/* Loader */}
      {loading ? (
        <TableLoader />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Full Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Students</TableHead>
                <TableHead>Contact Number</TableHead>
                <TableHead>Purchased Hours</TableHead>
                <TableHead>Remaining Hours</TableHead>
                <TableHead>Used Hours</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Approval</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {teachers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} className="text-center">
                    No professors found
                  </TableCell>
                </TableRow>
              ) : (
                teachers.map((teacher) => (
                  <TableRow key={teacher.id}>
                    <TableCell>{teacher.email}</TableCell>
                    <TableCell>{teacher.full_name}</TableCell>
                    <TableCell>{teacher.role}</TableCell>
                    <TableCell>{teacher.city || "-"}</TableCell>

                    <TableCell>
                      {(teacher.students as Student[])?.length ? (
                        <div className="max-h-24 overflow-y-auto space-y-1 pr-2">
                          {(teacher.students as Student[]).map((student) => (
                            <div
                              key={student.id}
                              className="bg-muted rounded px-2 py-1 text-xs"
                            >
                              {student.full_name}
                            </div>
                          ))}
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>

                    <TableCell>{teacher.contact_number || "-"}</TableCell>
                    <TableCell>
                      {teacher.total_purchased_hours ?? "-"}
                    </TableCell>
                    <TableCell>{teacher.remaining_hours}</TableCell>
                    <TableCell>{teacher.used_hours}</TableCell>

                    <TableCell>
                      {teacher.is_active ? (
                        <Badge className="bg-green-500 text-white">
                          Active
                        </Badge>
                      ) : (
                        <Badge className="bg-red-500 text-white">
                          Inactive
                        </Badge>
                      )}
                    </TableCell>

                    {/* Approval */}
                    <TableCell>
                      <Button
                        size="sm"
                        disabled={actionLoadingId === teacher.id}
                        variant={
                          teacher.is_active ? "destructive" : "secondary"
                        }
                        onClick={() =>
                          handleApproval(teacher.id!, !teacher.is_active)
                        }
                      >
                        {actionLoadingId === teacher.id
                          ? "Processing..."
                          : teacher.is_active
                            ? "Cancel Approval"
                            : "Approve"}
                      </Button>
                    </TableCell>

                    {/* Actions */}
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEdit(teacher)}
                        >
                          <PencilIcon className="w-4 h-4" /> Edit
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-500 text-red-600 hover:bg-red-500 hover:text-white"
                          disabled={deleteLoadingId === teacher.id}
                          onClick={() => handleDeleteProfessor(teacher)}
                        >
                          {deleteLoadingId === teacher.id
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
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (prevUrl) fetchTeachers(prevUrl);
                  }}
                  className={!prevUrl ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (nextUrl) fetchTeachers(nextUrl);
                  }}
                  className={!nextUrl ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </>
      )}

      {/* Modal */}
      <TeacherModal
        open={modal.open}
        onOpenChange={(open) =>
          setModal({ open, data: open ? modal.data : null })
        }
        onSuccess={() => fetchTeachers()}
        initialData={modal.data}
      />
    </div>
  );
}
