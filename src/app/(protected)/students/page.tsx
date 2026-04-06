"use client";

import { PencilIcon, Trash2Icon } from "lucide-react";
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
import { deleteStudent } from "@/lib/apiActions";
import { PaginatedResponse, Student } from "@/types/api";

import { StudentModal } from "./StudentModal";

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [prevUrl, setPrevUrl] = useState<string | null>(null);

  const [modal, setModal] = useState<{ open: boolean; data: Student | null }>({
    open: false,
    data: null,
  });

  const [loading, setLoading] = useState(true);
  const [deleteLoadingId, setDeleteLoadingId] = useState<number | null>(null);

  // ✅ Fetch Students (Backend Controlled)
  async function fetchStudents(url: string = "/user/students/") {
    setLoading(true);
    try {
      const res: PaginatedResponse<Student> = await apiFetch(url);

      setStudents(res.results);
      setNextUrl(res.next);
      setPrevUrl(res.previous);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStudents();
  }, []);

  const openAdd = () => setModal({ open: true, data: null });

  const openEdit = (student: Student) =>
    setModal({ open: true, data: student });

  const handleDeleteStudent = async (student: Student) => {
    const confirm = await swal({
      title: "Are you sure?",
      text: `This will permanently delete ${student.full_name}.`,
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

      // ✅ Refresh current page (use prev/next safe fallback)
      fetchStudents(prevUrl || "/user/students/");
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
    <div className="p-2">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold px-2">Students</h2>
        <Button onClick={openAdd}>Add Student</Button>
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
                <TableHead>Email</TableHead>
                <TableHead>Full Name</TableHead>
                <TableHead>Contact Number</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    No students found
                  </TableCell>
                </TableRow>
              ) : (
                students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>{student.email}</TableCell>
                    <TableCell>{student.full_name}</TableCell>
                    <TableCell>{student.contact_number || "-"}</TableCell>

                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEdit(student)}
                        >
                          <PencilIcon className="w-4 h-4" /> Edit
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-500 text-red-600 hover:bg-red-500 hover:text-white"
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
                ))
              )}
            </TableBody>
          </Table>

          {/* ✅ Pagination (Backend Controlled Only) */}
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (prevUrl) fetchStudents(prevUrl);
                  }}
                  className={!prevUrl ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (nextUrl) fetchStudents(nextUrl);
                  }}
                  className={!nextUrl ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </>
      )}

      {/* Modal */}
      {modal.open && (
        <StudentModal
          open={modal.open}
          onOpenChange={(open) =>
            setModal({ open, data: open ? modal.data : null })
          }
          onSuccess={() => fetchStudents()}
          initialData={modal.data}
        />
      )}
    </div>
  );
}
