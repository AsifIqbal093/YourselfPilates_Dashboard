/* eslint-disable no-console */
"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { ControlledDrawerDialog } from "@/components/ModalDrawer/ModalDrawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api";
import { Professor } from "@/types/api";

interface TeacherModalProps {
  open: boolean;
  // eslint-disable-next-line
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  initialData?: Professor | null;
}

const commonTeacherSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  full_name: z.string().min(1, "Full name is required"),
  contact_number: z.string().optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  zipcode: z.string().min(1, "Zipcode is required"),
  // photo: z.any().optional(),
});

const addTeacherSchema = commonTeacherSchema.extend({
  password: z.string().min(6, "Password is required"),
});

const editTeacherSchema = commonTeacherSchema.extend({
  password: z
    .union([
      z.string().min(6, "Password must be at least 6 characters"),
      z.literal(""),
    ])
    .optional(),
});

type TeacherFormValues = z.infer<typeof editTeacherSchema>;

export function TeacherModal({
  open,
  onOpenChange,
  onSuccess,
  initialData,
}: TeacherModalProps) {
  const isEdit = !!initialData;
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TeacherFormValues>({
    resolver: zodResolver(isEdit ? editTeacherSchema : addTeacherSchema),
    defaultValues: isEdit
      ? {
          email: initialData?.email || "",
          password: "",
          full_name: initialData?.full_name || "",
          contact_number: initialData?.contact_number || "",
          street: initialData?.street || "",
          city: initialData?.city || "",
          state: initialData?.state || "",
          country: initialData?.country || "",
          zipcode: initialData?.zipcode || "",
        }
      : {
          email: "",
          password: "",
          full_name: "",
          contact_number: "",
          street: "",
          city: "",
          state: "",
          country: "",
          zipcode: "",
        },
  });
  const [error, setError] = useState<string | null>(null);
  // const [photoFile, setPhotoFile] = useState<File | null>(null); // commented out, not used

  // Reset form when opening for add/edit
  useEffect(() => {
    reset(
      isEdit
        ? {
            email: initialData?.email || "",
            password: "",
            full_name: initialData?.full_name || "",
            contact_number: initialData?.contact_number || "",
            street: initialData?.street || "",
            city: initialData?.city || "",
            state: initialData?.state || "",
            country: initialData?.country || "",
            zipcode: initialData?.zipcode || "",
          }
        : {
            email: "",
            password: "",
            full_name: "",
            contact_number: "",
            street: "",
            city: "",
            state: "",
            country: "",
            zipcode: "",
          }
    );
    // setPhotoFile(null);
    setError(null);
  }, [initialData, open, reset, isEdit]);

  async function onSubmit(data: TeacherFormValues) {
    setError(null);
    try {
      const payload: Record<string, unknown> = {
        email: data.email,
        full_name: data.full_name,
        role: "professor",
        contact_number: data.contact_number || "",
        street: data.street || "",
        city: data.city || "",
        state: data.state || "",
        country: data.country || "",
        zipcode: data.zipcode || "",
      };
      if (data.password) {
        payload.password = data.password;
      }
      // Add student_ids if needed: payload.student_ids = ...

      if (isEdit) {
        await apiFetch(
          `/user/users/${initialData?.id ?? initialData?.email}/`,
          {
            method: "PATCH",
            body: JSON.stringify(payload),
          }
        );
      } else {
        await apiFetch("/user/users/", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      onSuccess();
      onOpenChange(false);
      // eslint-disable-next-line
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    }
  }

  return (
    <ControlledDrawerDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Edit Teacher" : "Add Teacher"}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label>Full Name</Label>
          <Input {...register("full_name")} />
          {errors.full_name && (
            <span className="text-red-500 text-xs">
              {errors.full_name.message}
            </span>
          )}
        </div>
        <div>
          <Label>Email</Label>
          <Input {...register("email")} disabled={isEdit} />
          {errors.email && (
            <span className="text-red-500 text-xs">{errors.email.message}</span>
          )}
        </div>
        <div>
          <Label>{isEdit ? "Password (optional)" : "Password"}</Label>
          <Input
            type="password"
            placeholder={isEdit ? "Leave blank to keep current password" : ""}
            {...register("password")}
          />
          {errors.password && (
            <span className="text-red-500 text-xs">
              {errors.password.message}
            </span>
          )}
        </div>
        <div>
          <Label>Contact Number</Label>
          <Input {...register("contact_number")} />
        </div>
        <div>
          <Label>Country</Label>
          <Input {...register("country")} />
        </div>
        <div>
          <Label>State</Label>
          <Input {...register("state")} />
        </div>
        <div>
          <Label>City</Label>
          <Input {...register("city")} />
        </div>
        <div>
          <Label>Street</Label>
          <Input {...register("street")} />
        </div>
        <div>
          <Label>Zipcode</Label>
          <Input {...register("zipcode")} />
          {errors.zipcode && (
            <span className="text-red-500 text-xs">
              {errors.zipcode.message}
            </span>
          )}
        </div>
        {/*
        <div>
          <Label>Photo</Label>
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setPhotoFile(e.target.files[0]);
              }
            }}
          />
        </div>
        */}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="cursor-pointer"
        >
          {isEdit ? "Edit Professor" : "Add Professor"}
        </Button>
        {error && <div className="text-red-500">{error}</div>}
      </form>
    </ControlledDrawerDialog>
  );
}
