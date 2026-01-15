"use client";
import { PencilIcon } from "lucide-react";
import { Trash2Icon } from "lucide-react";
import { useEffect, useState } from "react";
import swal from "sweetalert";

import { Badge } from "@/components/ui/badge";
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
import { deleteProfessor } from "@/lib/apiActions";
import { PaginatedResponse, Professor, Student } from "@/types/api";

import { TeacherModal } from "./TeacherModal";

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Professor[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<{ open: boolean; data: Professor | null }>(
    {
      open: false,
      data: null,
    }
  );
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [deleteLoadingId, setDeleteLoadingId] = useState<number | null>(null);

  async function fetchTeachers(page: number) {
    setLoading(true);
    try {
      const res: PaginatedResponse<Professor> = await apiFetch(
        `/user/users/?role=professor&page=${page}`
      );
      setTeachers(res.results);
      setCount(res.count);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTeachers(page);
  }, [page]);

  const openAdd = () => setModal({ open: true, data: null });
  const openEdit = (teacher: Professor) =>
    setModal({ open: true, data: teacher });

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
      await fetchTeachers(page);
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

  const handleDeleteProfessor = async (prof: Professor) => {
    const confirm = await swal({
      title: "Are you sure?",
      text: `This will permanently delete the professor ${prof.full_name}.`,
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
      await fetchTeachers(page);
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

  const totalPages = Math.ceil(count / 10); // assuming 10 per page

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2>Teachers</h2>
        <Button onClick={openAdd} className="cursor-pointer">
          Add Teacher
        </Button>
      </div>
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
                <TableHead>Used Hours</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Approval</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teachers.map((teacher) => (
                <TableRow key={teacher.email}>
                  <TableCell>{teacher.email}</TableCell>
                  <TableCell>{teacher.full_name}</TableCell>
                  <TableCell>{teacher.role}</TableCell>
                  <TableCell>{teacher.city || "-"}</TableCell>
                  <TableCell>
                    {(teacher.students as Student[]) &&
                    (teacher.students as Student[]).length > 0 ? (
                      <div className="max-h-24 overflow-y-auto space-y-1 pr-2">
                        {(teacher.students as Student[]).map((student) => (
                          <div
                            key={student.id}
                            className="bg-muted rounded px-2 py-1 text-xs whitespace-nowrap"
                          >
                            {student.full_name}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span>-</span>
                    )}
                  </TableCell>
                  <TableCell>{teacher.contact_number || "-"}</TableCell>
                  <TableCell>{teacher.remaining_hours}</TableCell>
                  <TableCell>{teacher.used_hours}</TableCell>
                  <TableCell>
                    {teacher.is_active ? (
                      <Badge
                        variant="secondary"
                        className="bg-green-500 text-white border-green-500"
                      >
                        Active
                      </Badge>
                    ) : (
                      <Badge
                        variant="destructive"
                        className="bg-red-500 text-white border-red-500"
                      >
                        Inactive
                      </Badge>
                    )}
                  </TableCell>

                  <TableCell>
                    {teacher.is_active ? (
                      <Button
                        className="cursor-pointer"
                        variant="destructive"
                        size="sm"
                        disabled={actionLoadingId === teacher.id}
                        onClick={() => handleApproval(teacher.id!, false)}
                      >
                        {actionLoadingId === teacher.id
                          ? "Cancelling..."
                          : "Cancel Approval"}
                      </Button>
                    ) : (
                      <Button
                        className="cursor-pointer"
                        variant="secondary"
                        size="sm"
                        disabled={actionLoadingId === teacher.id}
                        onClick={() => handleApproval(teacher.id!, true)}
                      >
                        {actionLoadingId === teacher.id
                          ? "Approving..."
                          : "Approve"}
                      </Button>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="cursor-pointer"
                        onClick={() => openEdit(teacher)}
                      >
                        <PencilIcon className="w-4 h-4" /> Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-500 text-red-600 hover:bg-red-500 hover:text-white hover:border-red-500 cursor-pointer"
                        disabled={deleteLoadingId === teacher.id}
                        onClick={() => handleDeleteProfessor(teacher)}
                      >
                        {deleteLoadingId === teacher.id ? (
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
              ))}
            </TableBody>
          </Table>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
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
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </>
      )}
      <TeacherModal
        open={modal.open}
        onOpenChange={(open) =>
          setModal({ open, data: open ? modal.data : null })
        }
        onSuccess={() => fetchTeachers(page)}
        initialData={modal.data}
      />
    </div>
  );
}
