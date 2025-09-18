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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCitiesStore } from "@/lib/stores/cities.store";
import { toast } from "sonner";
import { cn } from "@/lib/utils/ui.utils";
import type {
  City,
  CreateCityRequest,
  UpdateCityRequest,
} from "@/lib/types/settings/cities.types";

// Form validation schema
const citySchema = z.object({
  ref: z
    .string()
    .min(1, "Reference is required")
    .max(10, "Reference must be 10 characters or less")
    .regex(
      /^[A-Z0-9_]+$/,
      "Reference must contain only uppercase letters, numbers, and underscores"
    ),
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be 100 characters or less"),
  zone: z.string().min(1, "Zone is required"),
  pickupCity: z.boolean().default(false),
  status: z.boolean().default(true),
});

type CityFormData = z.infer<typeof citySchema>;

interface CityFormProps {
  city?: City;
  mode: "create" | "edit";
  onSuccess?: (city: City) => void;
  onCancel?: () => void;
}

// Common zones for suggestions
const COMMON_ZONES = [
  "Zone A",
  "Zone B",
  "Zone C",
  "Zone D",
  "Zone E",
  "Zone North",
  "Zone South",
  "Zone East",
  "Zone West",
  "Zone Central",
  "Zone Urban",
  "Zone Suburban",
  "Zone Rural",
];

export default function CityForm({
  city,
  mode,
  onSuccess,
  onCancel,
}: CityFormProps) {
  const {
    availableZones,
    isCreating,
    isUpdating,
    error,
    createCity,
    updateCity,
    fetchAvailableZones,
    clearError,
  } = useCitiesStore();

  const isEditing = mode === "edit";
  const isLoading = isCreating || isUpdating;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
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

  // Load available zones
  useEffect(() => {
    fetchAvailableZones();
  }, [fetchAvailableZones]);

  // Populate form when editing
  useEffect(() => {
    if (city && isEditing) {
      reset({
        ref: city.ref,
        name: city.name,
        zone: city.zone,
        pickupCity: city.pickupCity,
        status: city.status,
      });
    }
  }, [city, isEditing, reset]);

  const watchedRef = watch("ref");
  const watchedName = watch("name");

  // Auto-generate ref from name
  const generateRefFromName = (name: string) => {
    return name
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, "")
      .replace(/\s+/g, "_")
      .substring(0, 10);
  };

  // Handle name change to auto-generate ref
  useEffect(() => {
    if (watchedName && !isEditing && !watchedRef) {
      const generatedRef = generateRefFromName(watchedName);
      setValue("ref", generatedRef, { shouldValidate: true });
    }
  }, [watchedName, watchedRef, isEditing, setValue]);

  const onSubmit = async (data: CityFormData) => {
    clearError();

    try {
      let result: City | null = null;

      if (isEditing && city) {
        const updateData: UpdateCityRequest = {
          ref: data.ref,
          name: data.name,
          zone: data.zone,
          pickupCity: data.pickupCity,
          status: data.status,
        };
        result = await updateCity(city.id, updateData);
      } else {
        const createData: CreateCityRequest = {
          ref: data.ref,
          name: data.name,
          zone: data.zone,
          pickupCity: data.pickupCity,
          status: data.status,
        };
        result = await createCity(createData);
      }

      if (result) {
        toast.success(
          isEditing
            ? "City updated successfully!"
            : "City created successfully!"
        );
        onSuccess?.(result);

        if (!isEditing) {
          reset(); // Reset form for new city creation
        }
      }
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error("An unexpected error occurred");
    }
  };

  // Get all available zones (existing + common suggestions)
  const allZones = Array.from(
    new Set([...availableZones, ...COMMON_ZONES])
  ).sort();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon
            icon={isEditing ? "heroicons:pencil-square" : "heroicons:plus"}
            className="w-5 h-5"
          />
          {isEditing ? "Edit City" : "Create New City"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert color="destructive" className="mb-6">
            <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* City Name */}
            <div className="space-y-2">
              <Label
                htmlFor="name"
                className={cn({ "text-destructive": errors.name })}
              >
                City Name *
              </Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="Enter city name"
                className={cn({
                  "border-destructive focus:border-destructive": errors.name,
                })}
              />
              {errors.name && (
                <p className="text-sm text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* City Reference */}
            <div className="space-y-2">
              <Label
                htmlFor="ref"
                className={cn({ "text-destructive": errors.ref })}
              >
                Reference Code *
              </Label>
              <Input
                id="ref"
                {...register("ref")}
                placeholder="CAS, MAR, RAB"
                className={cn({
                  "border-destructive focus:border-destructive": errors.ref,
                  "font-mono": true,
                })}
                style={{ textTransform: "uppercase" }}
              />
              {errors.ref && (
                <p className="text-sm text-destructive">{errors.ref.message}</p>
              )}
              <p className="text-xs text-gray-500">
                Unique identifier for this city (auto-generated from name)
              </p>
            </div>

            {/* Zone */}
            <div className="space-y-2">
              <Label
                htmlFor="zone"
                className={cn({ "text-destructive": errors.zone })}
              >
                Zone *
              </Label>
              <Select
                onValueChange={(value) =>
                  setValue("zone", value, { shouldValidate: true })
                }
              >
                <SelectTrigger
                  className={cn({ "border-destructive": errors.zone })}
                >
                  <SelectValue placeholder="Select or type zone name" />
                </SelectTrigger>
                <SelectContent>
                  {allZones.map((zone) => (
                    <SelectItem key={zone} value={zone}>
                      {zone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                {...register("zone")}
                placeholder="Or enter custom zone name"
                className={cn({
                  "border-destructive focus:border-destructive": errors.zone,
                })}
              />
              {errors.zone && (
                <p className="text-sm text-destructive">
                  {errors.zone.message}
                </p>
              )}
            </div>
          </div>

          {/* Switches */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <Label className="text-base font-medium">Pickup City</Label>
                <p className="text-sm text-gray-500">
                  Enable if this city supports pickup services
                </p>
              </div>
              <Switch
                {...register("pickupCity")}
                defaultChecked={watch("pickupCity")}
                onCheckedChange={(checked) => setValue("pickupCity", checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <Label className="text-base font-medium">Active Status</Label>
                <p className="text-sm text-gray-500">
                  City is available for deliveries and operations
                </p>
              </div>
              <Switch
                {...register("status")}
                defaultChecked={watch("status")}
                onCheckedChange={(checked) => setValue("status", checked)}
              />
            </div>
          </div>

          {/* Preview */}
          {(watch("name") || watch("ref") || watch("zone")) && (
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-900">
                  <Icon icon="heroicons:eye" className="w-5 h-5" />
                  Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-sm text-blue-600">Name:</span>
                    <span className="ml-2 font-medium">
                      {watch("name") || "City Name"}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-blue-600">Ref:</span>
                    <span className="ml-2 font-mono">
                      {watch("ref") || "REF"}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-blue-600">Zone:</span>
                    <span className="ml-2">{watch("zone") || "Zone"}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-sm text-blue-600">Type:</span>
                    <span className="ml-2">
                      {watch("pickupCity")
                        ? "Pickup & Delivery"
                        : "Delivery Only"}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-blue-600">Status:</span>
                    <span className="ml-2">
                      {watch("status") ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
              >
                Cancel
              </Button>
            )}

            <Button
              type="button"
              variant="outline"
              onClick={() => reset()}
              disabled={isLoading || !isDirty}
            >
              Reset
            </Button>

            <Button
              type="submit"
              disabled={isLoading || !isDirty}
              className="min-w-[120px]"
            >
              {isLoading && (
                <Icon
                  icon="heroicons:arrow-path"
                  className="mr-2 h-4 w-4 animate-spin"
                />
              )}
              {isEditing ? "Update City" : "Create City"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
