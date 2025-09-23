"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils/ui.utils";
import { toast } from "sonner";
import type {
  CreateZoneRequest,
  UpdateZoneRequest,
  AvailableCity,
} from "@/lib/types/settings/zones.types";

// Form validation schema
const zoneFormSchema = z.object({
  name: z
    .string()
    .min(1, "Zone name is required")
    .min(2, "Zone name must be at least 2 characters")
    .max(100, "Zone name must not exceed 100 characters"),
  cityIds: z.array(z.string()).min(1, "At least one city must be selected"),
  status: z.boolean().default(true),
});

type ZoneFormData = z.infer<typeof zoneFormSchema>;

interface ZoneFormProps {
  mode: "create" | "edit";
  initialData?: Partial<ZoneFormData>;
  onSubmit: (data: CreateZoneRequest | UpdateZoneRequest) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  availableCities: AvailableCity[];
}

export default function ZoneForm({
  mode,
  initialData,
  onSubmit,
  onCancel,
  loading = false,
  availableCities,
}: ZoneFormProps) {
  const [selectedCities, setSelectedCities] = useState<string[]>(
    initialData?.cityIds || []
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAssigned, setFilterAssigned] = useState("all");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
    reset,
  } = useForm<ZoneFormData>({
    resolver: zodResolver(zoneFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      cityIds: initialData?.cityIds || [],
      status: initialData?.status !== undefined ? initialData.status : true,
    },
  });

  const watchedStatus = watch("status");

  // Update form when initialData changes
  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name || "",
        cityIds: initialData.cityIds || [],
        status: initialData.status !== undefined ? initialData.status : true,
      });
      setSelectedCities(initialData.cityIds || []);
    }
  }, [initialData, reset]);

  // Update form cityIds when selectedCities changes
  useEffect(() => {
    setValue("cityIds", selectedCities, { shouldDirty: true });
  }, [selectedCities, setValue]);

  // Filter cities based on search and filter
  const filteredCities = React.useMemo(() => {
    let filtered = availableCities;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (city) =>
          city.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          city.ref.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Assignment filter
    if (filterAssigned === "assigned") {
      filtered = filtered.filter((city) => city.zone);
    } else if (filterAssigned === "unassigned") {
      filtered = filtered.filter((city) => !city.zone);
    }

    // Sort by name
    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [availableCities, searchTerm, filterAssigned]);

  // Handle city selection
  const handleCityToggle = (cityId: string) => {
    setSelectedCities((prev) => {
      if (prev.includes(cityId)) {
        return prev.filter((id) => id !== cityId);
      } else {
        return [...prev, cityId];
      }
    });
  };

  // Handle select all visible cities
  const handleSelectAllVisible = () => {
    const visibleUnassignedCities = filteredCities
      .filter((city) => !city.zone || selectedCities.includes(city.id))
      .map((city) => city.id);

    setSelectedCities((prev) => {
      const newSelection = new Set([...prev, ...visibleUnassignedCities]);
      return Array.from(newSelection);
    });
  };

  // Handle deselect all visible cities
  const handleDeselectAllVisible = () => {
    const visibleCityIds = filteredCities.map((city) => city.id);
    setSelectedCities((prev) =>
      prev.filter((id) => !visibleCityIds.includes(id))
    );
  };

  // Handle form submission
  const onFormSubmit = async (data: ZoneFormData) => {
    try {
      await onSubmit({
        name: data.name.trim(),
        cityIds: data.cityIds,
        status: data.status,
      });
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  // Handle reset form
  const handleReset = () => {
    reset();
    setSelectedCities(initialData?.cityIds || []);
    setSearchTerm("");
    setFilterAssigned("all");
  };

  // Get selected cities info
  const selectedCitiesInfo = React.useMemo(() => {
    return availableCities.filter((city) => selectedCities.includes(city.id));
  }, [availableCities, selectedCities]);

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Zone Name */}
          <div className="space-y-2">
            <Label
              htmlFor="name"
              className={cn("", { "text-destructive": errors.name })}
            >
              Zone Name *
            </Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="e.g., Zone A - Major Cities"
              className={cn("", {
                "border-destructive focus:border-destructive": errors.name,
              })}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
            <p className="text-xs text-default-600">
              Choose a descriptive name that reflects the geographical area
            </p>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            <div className="flex items-center space-x-2">
              <Switch
                id="status"
                {...register("status")}
                checked={watchedStatus}
                onCheckedChange={(checked) => setValue("status", checked)}
              />
              <Label
                htmlFor="status"
                className="text-sm font-normal cursor-pointer"
              >
                {watchedStatus ? "Active" : "Inactive"}
              </Label>
            </div>
            <p className="text-xs text-default-600">
              {watchedStatus
                ? "Zone is available for tariff configuration"
                : "Zone will be hidden from tariff options"}
            </p>
          </div>
        </div>
      </div>

      {/* City Selection */}
      <div className="space-y-4">
        <div>
          <Label className={cn("", { "text-destructive": errors.cityIds })}>
            Assign Cities *
          </Label>
          {errors.cityIds && (
            <p className="text-xs text-destructive mt-1">
              {errors.cityIds.message}
            </p>
          )}
        </div>

        {/* Selected Cities Summary */}
        {selectedCities.length > 0 && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-blue-900">
                  Selected Cities ({selectedCities.length})
                </h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  onClick={() => setSelectedCities([])}
                  className="text-blue-700 hover:text-blue-900"
                >
                  <Icon icon="heroicons:x-mark" className="w-4 h-4 mr-1" />
                  Clear All
                </Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {selectedCitiesInfo.map((city) => (
                  <Badge
                    key={city.id}
                    color="secondary"
                    className="text-xs bg-blue-100 text-blue-800 hover:bg-blue-200"
                  >
                    {city.name}
                    <button
                      type="button"
                      className="ml-1 hover:text-blue-900"
                      onClick={() => handleCityToggle(city.id)}
                    >
                      <Icon icon="heroicons:x-mark" className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* City Selection Filters */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1">
            <Input
              placeholder="Search cities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <Select value={filterAssigned} onValueChange={setFilterAssigned}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cities</SelectItem>
              <SelectItem value="unassigned">Unassigned Only</SelectItem>
              <SelectItem value="assigned">Already Assigned</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex gap-1">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={handleSelectAllVisible}
            >
              Select Visible
            </Button>
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={handleDeselectAllVisible}
            >
              Deselect Visible
            </Button>
          </div>
        </div>

        {/* Available Cities List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Available Cities ({filteredCities.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {filteredCities.length > 0 ? (
              <div className="max-h-80 overflow-y-auto">
                <div className="p-4 space-y-2">
                  {filteredCities.map((city) => {
                    const isSelected = selectedCities.includes(city.id);
                    const isAssignedToOtherZone = city.zone && !isSelected;

                    return (
                      <div
                        key={city.id}
                        className={cn(
                          "flex items-center justify-between p-3 border rounded-lg transition-colors",
                          isSelected
                            ? "border-blue-200 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300",
                          isAssignedToOtherZone && "opacity-60"
                        )}
                      >
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleCityToggle(city.id)}
                            disabled={isAssignedToOtherZone}
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{city.name}</span>
                              <Badge color="secondary" className="text-xs">
                                {city.ref}
                              </Badge>
                              {city.pickupCity && (
                                <Badge className="text-xs bg-green-100 text-green-800">
                                  Pickup City
                                </Badge>
                              )}
                            </div>
                            {city.zone && !isSelected && (
                              <p className="text-xs text-gray-500">
                                Already assigned to: {city.zone}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge
                            color={city.status ? "success" : "secondary"}
                            className="text-xs"
                          >
                            {city.status ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center">
                <Icon
                  icon="heroicons:map-pin"
                  className="w-12 h-12 text-gray-400 mx-auto mb-3"
                />
                <h3 className="font-medium text-default-900 mb-1">
                  No cities found
                </h3>
                <p className="text-default-600 text-sm">
                  {searchTerm || filterAssigned !== "all"
                    ? "Try adjusting your search or filter"
                    : "No cities are available for assignment"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-4 pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>

        {mode === "edit" && (
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            disabled={loading || !isDirty}
          >
            Reset Changes
          </Button>
        )}

        <Button type="submit" disabled={loading || selectedCities.length === 0}>
          {loading && (
            <Icon
              icon="heroicons:arrow-path"
              className="mr-2 h-4 w-4 animate-spin"
            />
          )}
          {mode === "create" ? "Create Zone" : "Update Zone"}
        </Button>
      </div>

      {/* Form Status */}
      {mode === "edit" && isDirty && (
        <div className="text-sm text-orange-600 text-center">
          You have unsaved changes
        </div>
      )}
    </form>
  );
}
