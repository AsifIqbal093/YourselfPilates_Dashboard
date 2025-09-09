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
import { deleteStudent } from "@/lib/apiActions";
import { PaginatedResponse, Student } from "@/types/api";

import { StudentModal } from "./StudentModal";

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<{ open: boolean; data: Student | null }>({
    open: false,
    data: null,
  });
  const [loading, setLoading] = useState(true);
  const [deleteLoadingId, setDeleteLoadingId] = useState<number | null>(null);

  async function fetchStudents(page: number) {
    setLoading(true);
    try {
      const res: PaginatedResponse<Student> = await apiFetch(
        `/user/students/?page=${page}`
      );
      setStudents(res.results);
      setCount(res.count);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStudents(page);
  }, [page]);

  const openAdd = () => setModal({ open: true, data: null });
  const openEdit = (student: Student) =>
    setModal({ open: true, data: student });

  const handleDeleteStudent = async (student: Student) => {
    const confirm = await swal({
      title: "Are you sure?",
      text: `This will permanently delete the student ${student.full_name}.`,
      icon: "warning",
      buttons: ["Cancel", "Delete"],
      dangerMode: true,
    });
    if (!confirm) return;
    setDeleteLoadingId(student.id);
    try {
      await deleteStudent(student.id);
      swal({
        title: "Deleted!",
        text: "Student deleted successfully!",
        icon: "success",
      });
      await fetchStudents(page);
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
        <h2>Students</h2>
        <Button onClick={openAdd} className="cursor-pointer">
          Add Student
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
                {/* <TableHead>Role</TableHead>
                <TableHead>Bio</TableHead> */}
                <TableHead>Contact Number</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>{student.email}</TableCell>
                  <TableCell>{student.full_name}</TableCell>
                  {/* <TableCell>{student.role}</TableCell>
                  <TableCell>{student.bio || "-"}</TableCell> */}
                  <TableCell>{student.contact_number || "-"}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEdit(student)}
                        className="cursor-pointer"
                      >
                        <PencilIcon className="w-4 h-4" /> Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-500 text-red-600 hover:bg-red-500 hover:text-white hover:border-red-500 cursor-pointer"
                        disabled={deleteLoadingId === student.id}
                        onClick={() => handleDeleteStudent(student)}
                      >
                        {deleteLoadingId === student.id ? (
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
      {modal.open && (
        <StudentModal
          open={modal.open}
          onOpenChange={(open) =>
            setModal({ open, data: open ? modal.data : null })
          }
          onSuccess={() => fetchStudents(page)}
          initialData={modal.data}
        />
      )}
    </div>
  );
}
