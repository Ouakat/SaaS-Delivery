"use client";

import React, { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "@/i18n/routing";
import { usePickupCitiesStore } from "@/lib/stores/settings/pickup-cities.store";
import { useAuthStore } from "@/lib/stores/auth/auth.store";
import { ProtectedRoute } from "@/components/route/protected-route";
import { SETTINGS_PERMISSIONS } from "@/lib/constants/settings";
import PickupCityForm from "@/components/settings/pickup-cities/pickup-city-form";
import type { UpdatePickupCityRequest } from "@/lib/types/settings/pickup-cities.types";
import { toast } from "sonner";

const EditPickupCityPageContent = () => {
  const params = useParams();
  const router = useRouter();
  const pickupCityId = params?.id as string;

  const {
    selectedPickupCity,
    isLoading,
    isUpdating,
    error,
    fetchPickupCityById,
    updatePickupCity,
  } = usePickupCitiesStore();

  // Fetch pickup city data
  useEffect(() => {
    if (pickupCityId) {
      fetchPickupCityById(pickupCityId);
    }
  }, [pickupCityId, fetchPickupCityById]);

  const handleSubmit = async (data: UpdatePickupCityRequest) => {
    if (!selectedPickupCity) return;

    try {
      const result = await updatePickupCity(selectedPickupCity.id, data);
      if (result) {
        toast.success("Pickup city updated successfully!");
        router.push(`/settings/pickup-cities/${selectedPickupCity.id}`);
      }
    } catch (error) {
      // Error handling is managed by the store and form component
      console.error("Update pickup city error:", error);
    }
  };

  const handleCancel = () => {
    if (selectedPickupCity) {
      router.push(`/settings/pickup-cities/${selectedPickupCity.id}`);
    } else {
      router.push("/settings/pickup-cities");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="w-64 h-8 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="w-48 h-4 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="w-32 h-10 bg-gray-200 rounded animate-pulse" />
        </div>

        <div className="w-full h-96 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  if (error || !selectedPickupCity) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-default-900">
              Edit Pickup City
            </h1>
          </div>
          <Link href="/settings/pickup-cities">
            <Button variant="outline">
              <Icon icon="heroicons:arrow-left" className="w-4 h-4 mr-2" />
              Back to Pickup Cities
            </Button>
          </Link>
        </div>

        <Alert color="destructive">
          <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
          <AlertDescription>
            {error || "The requested pickup city could not be found."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-default-900">
            Edit Pickup City
          </h1>
          <p className="text-default-600">
            Update pickup city information • {selectedPickupCity.name}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/settings/pickup-cities/${selectedPickupCity.id}`}>
            <Button variant="outline">
              <Icon icon="heroicons:eye" className="w-4 h-4 mr-2" />
              View Details
            </Button>
          </Link>

          <Link href="/settings/pickup-cities">
            <Button variant="outline">
              <Icon icon="heroicons:arrow-left" className="w-4 h-4 mr-2" />
              Back to List
            </Button>
          </Link>
        </div>
      </div>

      {/* Breadcrumb */}
      <nav className="flex" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-4">
          <li>
            <Link
              href="/settings"
              className="text-default-600 hover:text-default-900"
            >
              Settings
            </Link>
          </li>
          <li>
            <Icon
              icon="heroicons:chevron-right"
              className="w-4 h-4 text-default-400"
            />
          </li>
          <li>
            <Link
              href="/settings/pickup-cities"
              className="text-default-600 hover:text-default-900"
            >
              Pickup Cities
            </Link>
          </li>
          <li>
            <Icon
              icon="heroicons:chevron-right"
              className="w-4 h-4 text-default-400"
            />
          </li>
          <li>
            <Link
              href={`/settings/pickup-cities/${selectedPickupCity.id}`}
              className="text-default-600 hover:text-default-900"
            >
              {selectedPickupCity.name}
            </Link>
          </li>
          <li>
            <Icon
              icon="heroicons:chevron-right"
              className="w-4 h-4 text-default-400"
            />
          </li>
          <li>
            <span className="text-default-900 font-medium">Edit</span>
          </li>
        </ol>
      </nav>

      {/* Form */}
      <PickupCityForm
        mode="edit"
        initialData={selectedPickupCity}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isUpdating}
      />
    </div>
  );
};

// Main component with protection
const EditPickupCityPage = () => {
  return (
    <ProtectedRoute
      requiredPermissions={[SETTINGS_PERMISSIONS.UPDATE_PICKUP_CITY]}
      requiredAccessLevel="FULL"
      allowedAccountStatuses={["ACTIVE"]}
      requireValidation={true}
    >
      <EditPickupCityPageContent />
    </ProtectedRoute>
  );
};

export default EditPickupCityPage;
