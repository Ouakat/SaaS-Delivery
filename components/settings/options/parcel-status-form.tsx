"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Icon } from "@/components/ui/icon";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useParcelStatusesStore } from "@/lib/stores/parcels/parcel-statuses.store"; // Fixed import path
import type { ParcelStatus } from "@/lib/types/parcels/parcel-statuses.types"; // Fixed import path

const parcelStatusSchema = z.object({
  code: z
    .string()
    .min(1, "Code is required")
    .max(50, "Code must be less than 50 characters") // Updated to match backend DTO
    .regex(
      /^[A-Z_]+$/,
      "Code must contain only uppercase letters and underscores"
    ),
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters"), // Updated to match backend DTO
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color"),
  status: z.boolean().default(true),
  isLocked: z.boolean().optional().default(false), // Added for completeness
});

type FormData = z.infer<typeof parcelStatusSchema>;

interface ParcelStatusFormProps {
  open: boolean;
  onClose: () => void;
  status?: ParcelStatus | null;
  onSuccess: () => void;
}

// Predefined color options
const colorOptions = [
  { name: "Blue", value: "#3B82F6" },
  { name: "Green", value: "#10B981" },
  { name: "Red", value: "#EF4444" },
  { name: "Orange", value: "#F97316" },
  { name: "Purple", value: "#8B5CF6" },
  { name: "Yellow", value: "#F59E0B" },
  { name: "Pink", value: "#EC4899" },
  { name: "Indigo", value: "#6366F1" },
  { name: "Teal", value: "#14B8A6" },
  { name: "Gray", value: "#6B7280" },
];

const ParcelStatusForm: React.FC<ParcelStatusFormProps> = ({
  open,
  onClose,
  status,
  onSuccess,
}) => {
  const { createParcelStatus, updateParcelStatus, parcelStatuses } =
    useParcelStatusesStore(); // Fixed store name

  const isEdit = !!status;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(parcelStatusSchema),
    defaultValues: {
      code: "",
      name: "",
      color: "#3B82F6",
      status: true,
      isLocked: false,
    },
  });

  const watchedColor = watch("color");
  const watchedCode = watch("code");

  useEffect(() => {
    if (status) {
      reset({
        code: status.code,
        name: status.name,
        color: status.color,
        status: status.status,
        isLocked: status.isLocked,
      });
    } else {
      reset({
        code: "",
        name: "",
        color: "#3B82F6",
        status: true,
        isLocked: false,
      });
    }
  }, [status, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      let success = false;

      // Remove isLocked from the data being sent (it's managed by backend)
      const { isLocked, ...submitData } = data;

      if (isEdit && status) {
        success = await updateParcelStatus(status.id, submitData);
      } else {
        success = await createParcelStatus(submitData);
      }

      if (success) {
        onSuccess();
        reset();
      }
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  // Check if code already exists (for create mode)
  const codeExists =
    !isEdit &&
    watchedCode &&
    parcelStatuses.some(
      (s) => s.code.toLowerCase() === watchedCode.toLowerCase()
    );

  const generateCodeFromName = (name: string) => {
    return name
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, "")
      .replace(/\s+/g, "_")
      .substring(0, 50); // Updated to match max length
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    if (!isEdit && name) {
      const generatedCode = generateCodeFromName(name);
      setValue("code", generatedCode);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Parcel Status" : "Create Parcel Status"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the parcel status configuration"
              : "Create a new parcel status for tracking deliveries"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* System Status Warning */}
          {isEdit && status?.isLocked && (
            <Alert color="default">
              <Icon icon="heroicons:information-circle" className="h-4 w-4" />
              <AlertDescription>
                This is a system status. Only the name and color can be
                modified.
              </AlertDescription>
            </Alert>
          )}

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Status Name *</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="e.g., Delivered, In Transit"
              onChange={handleNameChange}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Code */}
          <div className="space-y-2">
            <Label htmlFor="code">Status Code *</Label>
            <Input
              id="code"
              {...register("code")}
              placeholder="e.g., DELIVERED, IN_TRANSIT"
              disabled={isEdit && status?.isLocked}
              className="font-mono"
            />
            {errors.code && (
              <p className="text-sm text-destructive">{errors.code.message}</p>
            )}
            {codeExists && (
              <p className="text-sm text-destructive">
                A status with this code already exists
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Must be uppercase letters and underscores only
            </p>
          </div>

          {/* Color */}
          <div className="space-y-2">
            <Label>Status Color *</Label>
            <div className="space-y-3">
              {/* Color Preview */}
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <div
                  className="w-6 h-6 rounded border border-border"
                  style={{ backgroundColor: watchedColor }}
                />
                <div className="flex-1">
                  <div className="font-medium">Preview</div>
                  <div className="text-sm text-muted-foreground font-mono">
                    {watchedColor}
                  </div>
                </div>
              </div>

              {/* Color Options Grid */}
              <div className="grid grid-cols-5 gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    className={`w-10 h-10 rounded border-2 transition-all ${
                      watchedColor === color.value
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-border hover:border-muted-foreground"
                    }`}
                    style={{ backgroundColor: color.value }}
                    onClick={() => setValue("color", color.value)}
                    title={color.name}
                  />
                ))}
              </div>

              {/* Custom Color Input */}
              <div className="space-y-1">
                <Label htmlFor="color" className="text-sm">
                  Custom Color
                </Label>
                <Input
                  id="color"
                  {...register("color")}
                  placeholder="#3B82F6"
                  className="font-mono"
                />
                {errors.color && (
                  <p className="text-sm text-destructive">
                    {errors.color.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Status Toggle */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="space-y-1">
              <Label>Active Status</Label>
              <p className="text-sm text-muted-foreground">
                Enable this status for use in the system
              </p>
            </div>
            <Switch {...register("status")} defaultChecked={true} />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || codeExists}>
              {isSubmitting && (
                <Icon
                  icon="heroicons:arrow-path"
                  className="w-4 h-4 mr-2 animate-spin"
                />
              )}
              {isEdit ? "Update Status" : "Create Status"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ParcelStatusForm;
