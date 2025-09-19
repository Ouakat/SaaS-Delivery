"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Icon } from "@/components/ui/icon";
import { useCitiesStore } from "@/lib/stores/settings/cities.store";
import type {
  City,
  CreateCityRequest,
  UpdateCityRequest,
} from "@/lib/types/settings/cities.types";
import { CITY_ZONES } from "@/lib/constants/cities";
import { toast } from "sonner";
import { cn } from "@/lib/utils/ui.utils";

// Validation schema
const citySchema = z.object({
  ref: z
    .string()
    .min(2, "Reference must be at least 2 characters")
    .max(10, "Reference must be at most 10 characters")
    .regex(
      /^[A-Z0-9_-]+$/i,
      "Reference can only contain letters, numbers, hyphens, and underscores"
    ),
  name: z
    .string()
    .min(2, "City name must be at least 2 characters")
    .max(100, "City name must be at most 100 characters"),
  zone: z.string().min(1, "Please select a zone"),
  pickupCity: z.boolean().default(false),
  status: z.boolean().default(true),
});

type CityFormData = z.infer<typeof citySchema>;

interface CityFormProps {
  city?: City | null;
  onSuccess?: (city: City) => void;
  onCancel?: () => void;
  mode?: "create" | "edit";
}

export default function CityForm({
  city,
  onSuccess,
  onCancel,
  mode = "create",
}: CityFormProps) {
  const { isLoading, createCity, updateCity, validateCityRef } =
    useCitiesStore();

  const [refValidation, setRefValidation] = useState<{
    isValidating: boolean;
    isValid: boolean | null;
    message: string;
  }>({
    isValidating: false,
    isValid: null,
    message: "",
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    clearErrors,
    formState: { errors, isDirty, isSubmitting },
    reset,
  } = useForm<CityFormData>({
    resolver: zodResolver(citySchema),
    defaultValues: {
      ref: "",
      name: "",
      zone: "",
      pickupCity: false,
      status: true,
    },
  });

  const watchedRef = watch("ref");

  // Populate form when editing
  useEffect(() => {
    if (city && mode === "edit") {
      reset({
        ref: city.ref,
        name: city.name,
        zone: city.zone,
        pickupCity: city.pickupCity,
        status: city.status,
      });
    }
  }, [city, mode, reset]);

  // Validate reference uniqueness with debouncing
  useEffect(() => {
    if (!watchedRef || watchedRef.length < 2) {
      setRefValidation({
        isValidating: false,
        isValid: null,
        message: "",
      });
      return;
    }

    const timeoutId = setTimeout(async () => {
      setRefValidation({
        isValidating: true,
        isValid: null,
        message: "",
      });

      try {
        const isUnique = await validateCityRef(watchedRef, city?.id);

        if (isUnique) {
          setRefValidation({
            isValidating: false,
            isValid: true,
            message: "Reference is available",
          });
          clearErrors("ref");
        } else {
          setRefValidation({
            isValidating: false,
            isValid: false,
            message: "This reference is already in use",
          });
          setError("ref", {
            type: "manual",
            message: "This reference is already in use",
          });
        }
      } catch (error) {
        setRefValidation({
          isValidating: false,
          isValid: null,
          message: "Failed to validate reference",
        });
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [watchedRef, city?.id, validateCityRef, setError, clearErrors]);

  // Handle form submission
  const onSubmit = async (data: CityFormData) => {
    // Check reference validation
    if (refValidation.isValid === false) {
      toast.error("Please fix the reference validation error");
      return;
    }

    try {
      let success = false;
      let resultCity: City | undefined;

      if (mode === "create") {
        const createData: CreateCityRequest = {
          ref: data.ref,
          name: data.name,
          zone: data.zone,
          pickupCity: data.pickupCity,
          status: data.status,
        };
        success = await createCity(createData);
      } else if (city) {
        const updateData: UpdateCityRequest = {
          ref: data.ref !== city.ref ? data.ref : undefined,
          name: data.name !== city.name ? data.name : undefined,
          zone: data.zone !== city.zone ? data.zone : undefined,
          pickupCity:
            data.pickupCity !== city.pickupCity ? data.pickupCity : undefined,
          status: data.status !== city.status ? data.status : undefined,
        };

        // Only update if there are actual changes
        if (Object.values(updateData).some((value) => value !== undefined)) {
          success = await updateCity(city.id, updateData);
        } else {
          toast.info("No changes detected");
          return;
        }
      }

      if (success && onSuccess) {
        onSuccess(resultCity || city!);
      }
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error("An unexpected error occurred");
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (isDirty) {
      const confirmLeave = window.confirm(
        "You have unsaved changes. Are you sure you want to leave?"
      );
      if (!confirmLeave) return;
    }

    if (onCancel) {
      onCancel();
    } else {
      reset();
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon
            icon={mode === "create" ? "heroicons:plus" : "heroicons:pencil"}
            className="w-5 h-5"
          />
          {mode === "create" ? "Create New City" : "Edit City"}
        </CardTitle>
        {mode === "edit" && city && (
          <div className="text-sm text-muted-foreground">
            Last updated: {new Date(city.updatedAt).toLocaleDateString()}
          </div>
        )}
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Reference */}
          <div className="space-y-2">
            <Label
              htmlFor="ref"
              className={cn("", { "text-destructive": errors.ref })}
            >
              Reference *
            </Label>
            <div className="relative">
              <Input
                id="ref"
                {...register("ref")}
                placeholder="e.g., CAS, RAB, MAR"
                className={cn("pr-10", {
                  "border-destructive focus:border-destructive":
                    errors.ref || refValidation.isValid === false,
                  "border-green-500 focus:border-green-500":
                    refValidation.isValid === true,
                })}
                disabled={isSubmitting || isLoading}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                {refValidation.isValidating ? (
                  <Icon
                    icon="heroicons:arrow-path"
                    className="w-4 h-4 animate-spin text-muted-foreground"
                  />
                ) : refValidation.isValid === true ? (
                  <Icon
                    icon="heroicons:check-circle"
                    className="w-4 h-4 text-green-500"
                  />
                ) : refValidation.isValid === false ? (
                  <Icon
                    icon="heroicons:x-circle"
                    className="w-4 h-4 text-red-500"
                  />
                ) : null}
              </div>
            </div>
            {errors.ref && (
              <p className="text-xs text-destructive">{errors.ref.message}</p>
            )}
            {refValidation.message && (
              <p
                className={cn("text-xs", {
                  "text-green-600": refValidation.isValid === true,
                  "text-red-600": refValidation.isValid === false,
                  "text-muted-foreground": refValidation.isValid === null,
                })}
              >
                {refValidation.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              A unique identifier for the city (3-10 characters, letters and
              numbers only)
            </p>
          </div>

          {/* City Name */}
          <div className="space-y-2">
            <Label
              htmlFor="name"
              className={cn("", { "text-destructive": errors.name })}
            >
              City Name *
            </Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="e.g., Casablanca, Rabat, Marrakech"
              className={cn("", {
                "border-destructive focus:border-destructive": errors.name,
              })}
              disabled={isSubmitting || isLoading}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Zone */}
          <div className="space-y-2">
            <Label className={cn("", { "text-destructive": errors.zone })}>
              Zone *
            </Label>
            <Select
              value={watch("zone")}
              onValueChange={(value) =>
                setValue("zone", value, { shouldDirty: true })
              }
              disabled={isSubmitting || isLoading}
            >
              <SelectTrigger
                className={cn("", {
                  "border-destructive focus:border-destructive": errors.zone,
                })}
              >
                <SelectValue placeholder="Select a zone" />
              </SelectTrigger>
              <SelectContent>
                {CITY_ZONES.map((zone) => (
                  <SelectItem key={zone.value} value={zone.value}>
                    <div className="flex items-center gap-2">
                      <div
                        className={cn("w-2 h-2 rounded-full", {
                          "bg-blue-500": zone.value === "Zone A",
                          "bg-green-500": zone.value === "Zone B",
                          "bg-yellow-500": zone.value === "Zone C",
                          "bg-purple-500": zone.value === "Zone D",
                        })}
                      />
                      {zone.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.zone && (
              <p className="text-xs text-destructive">{errors.zone.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Zone classification affects shipping rates and delivery times
            </p>
          </div>

          {/* Pickup City Toggle */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <Label htmlFor="pickupCity" className="text-sm font-medium">
                Pickup City
              </Label>
              <p className="text-xs text-muted-foreground">
                Enable if this city can be used as a pickup location for parcels
              </p>
            </div>
            <Switch
              id="pickupCity"
              {...register("pickupCity")}
              disabled={isSubmitting || isLoading}
            />
          </div>

          {/* Status Toggle */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <Label htmlFor="status" className="text-sm font-medium">
                Active Status
              </Label>
              <p className="text-xs text-muted-foreground">
                Inactive cities will not be available for new parcel creation
              </p>
            </div>
            <Switch
              id="status"
              {...register("status")}
              disabled={isSubmitting || isLoading}
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-4 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting || isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                isLoading ||
                refValidation.isValidating ||
                refValidation.isValid === false ||
                (!isDirty && mode === "edit")
              }
            >
              {(isSubmitting || isLoading) && (
                <Icon
                  icon="heroicons:arrow-path"
                  className="mr-2 h-4 w-4 animate-spin"
                />
              )}
              {mode === "create" ? "Create City" : "Update City"}
            </Button>
          </div>

          {/* Help Text */}
          <Alert color="default">
            <Icon icon="heroicons:information-circle" className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">Tips for creating cities:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>
                    Use clear, recognizable references (e.g., CAS for
                    Casablanca)
                  </li>
                  <li>
                    Zone classification affects shipping rates and delivery
                    times
                  </li>
                  <li>
                    Pickup cities can be used as origin points for parcels
                  </li>
                  <li>
                    Inactive cities won't appear in dropdowns for new parcels
                  </li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        </form>
      </CardContent>
    </Card>
  );
}
