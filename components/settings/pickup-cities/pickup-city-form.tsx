"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Icon } from "@/components/ui/icon";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type {
  PickupCity,
  CreatePickupCityRequest,
  UpdatePickupCityRequest,
} from "@/lib/types/parcels/pickup-cities.types";
import { cn } from "@/lib/utils/ui.utils";

// Form validation schema
const pickupCitySchema = z.object({
  ref: z
    .string()
    .min(2, "Reference must be at least 2 characters")
    .max(20, "Reference must not exceed 20 characters")
    .regex(
      /^[A-Z0-9_]+$/,
      "Reference must contain only uppercase letters, numbers, and underscores"
    ),
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must not exceed 100 characters"),
  status: z.boolean().default(true),
});

type PickupCityFormData = z.infer<typeof pickupCitySchema>;

interface PickupCityFormProps {
  initialData?: PickupCity | null;
  onSubmit: (
    data: CreatePickupCityRequest | UpdatePickupCityRequest
  ) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  mode: "create" | "edit";
}

const PickupCityForm: React.FC<PickupCityFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  mode,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting },
    reset,
    watch,
    setValue,
  } = useForm<PickupCityFormData>({
    resolver: zodResolver(pickupCitySchema),
    defaultValues: {
      ref: initialData?.ref || "",
      name: initialData?.name || "",
      status: initialData?.status ?? true,
    },
  });

  // Auto-generate reference from name if in create mode
  const watchedName = watch("name");
  const watchedRef = watch("ref");

  useEffect(() => {
    if (mode === "create" && watchedName && !watchedRef) {
      const autoRef = watchedName
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_|_$/g, "")
        .substring(0, 20);

      if (autoRef) {
        setValue("ref", autoRef, { shouldDirty: true });
      }
    }
  }, [watchedName, watchedRef, mode, setValue]);

  // Reset form when initial data changes
  useEffect(() => {
    if (initialData) {
      reset({
        ref: initialData.ref,
        name: initialData.name,
        status: initialData.status,
      });
    }
  }, [initialData, reset]);

  const handleFormSubmit = async (data: PickupCityFormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      // Error handling is managed by the parent component
      console.error("Form submission error:", error);
    }
  };

  const handleReset = () => {
    if (initialData) {
      reset({
        ref: initialData.ref,
        name: initialData.name,
        status: initialData.status,
      });
    } else {
      reset({
        ref: "",
        name: "",
        status: true,
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon
              icon={
                mode === "create"
                  ? "heroicons:plus-circle"
                  : "heroicons:pencil-square"
              }
              className="w-5 h-5"
            />
            {mode === "create" ? "Create New Pickup City" : "Edit Pickup City"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            {/* Reference Field */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label
                  htmlFor="ref"
                  className={cn(errors.ref && "text-destructive")}
                >
                  Reference Code *
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Icon
                        icon="heroicons:information-circle"
                        className="w-4 h-4 text-muted-foreground"
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        Unique identifier for this pickup city (uppercase
                        letters, numbers, and underscores only)
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="ref"
                {...register("ref")}
                placeholder="e.g., CASA_CENTRAL"
                className={cn(
                  errors.ref && "border-destructive focus:border-destructive"
                )}
                disabled={isLoading || isSubmitting}
              />
              {errors.ref && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <Icon
                    icon="heroicons:exclamation-triangle"
                    className="w-3 h-3"
                  />
                  {errors.ref.message}
                </p>
              )}
              {mode === "create" && (
                <p className="text-xs text-muted-foreground">
                  Reference will be auto-generated from the name if left empty
                </p>
              )}
            </div>

            {/* Name Field */}
            <div className="space-y-2">
              <Label
                htmlFor="name"
                className={cn(errors.name && "text-destructive")}
              >
                Name *
              </Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="e.g., Casablanca Central Hub"
                className={cn(
                  errors.name && "border-destructive focus:border-destructive"
                )}
                disabled={isLoading || isSubmitting}
              />
              {errors.name && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <Icon
                    icon="heroicons:exclamation-triangle"
                    className="w-3 h-3"
                  />
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Status Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="status">Status</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable this pickup city for use in the system
                  </p>
                </div>
                <Switch
                  id="status"
                  {...register("status")}
                  disabled={isLoading || isSubmitting}
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-4 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading || isSubmitting}
              >
                Cancel
              </Button>

              {isDirty && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleReset}
                  disabled={isLoading || isSubmitting}
                >
                  Reset
                </Button>
              )}

              <Button
                type="submit"
                disabled={isLoading || isSubmitting || !isDirty}
                className="min-w-24"
              >
                {(isLoading || isSubmitting) && (
                  <Icon
                    icon="heroicons:arrow-path"
                    className="mr-2 h-4 w-4 animate-spin"
                  />
                )}
                {mode === "create" ? "Create" : "Update"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Preview Card */}
      {mode === "create" && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Icon icon="heroicons:eye" className="w-4 h-4" />
              Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-muted-foreground">
                  Reference:
                </span>
                <p className="font-mono">{watchedRef || "AUTO_GENERATED"}</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Name:</span>
                <p>{watchedName || "Pickup City Name"}</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">
                  Status:
                </span>
                <p className="flex items-center gap-1">
                  <Icon
                    icon={
                      watch("status")
                        ? "heroicons:check-circle"
                        : "heroicons:x-circle"
                    }
                    className={cn(
                      "w-3 h-3",
                      watch("status") ? "text-green-600" : "text-red-600"
                    )}
                  />
                  {watch("status") ? "Active" : "Inactive"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2 text-blue-700">
            <Icon icon="heroicons:light-bulb" className="w-4 h-4" />
            Tips
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-700 space-y-2">
          <ul className="list-disc list-inside space-y-1">
            <li>Use clear, descriptive names for easy identification</li>
            <li>
              Reference codes should be unique and follow naming conventions
            </li>
            <li>Inactive pickup cities won&apos;t appear in dropdowns</li>
            <li>You can configure tariffs after creating the pickup city</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default PickupCityForm;
