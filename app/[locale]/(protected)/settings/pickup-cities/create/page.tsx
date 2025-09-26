"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { usePickupCitiesStore } from "@/lib/stores/parcels/pickup-cities.store";
import { ProtectedRoute } from "@/components/route/protected-route";
import { SETTINGS_PERMISSIONS } from "@/lib/constants/settings";
import PickupCityForm from "@/components/settings/pickup-cities/pickup-city-form";
import type { CreatePickupCityRequest } from "@/lib/types/parcels/pickup-cities.types";
import { toast } from "sonner";

const CreatePickupCityPageContent = () => {
  const router = useRouter();
  const { createPickupCity, isCreating } = usePickupCitiesStore();

  const handleSubmit = async (data: CreatePickupCityRequest) => {
    try {
      const result = await createPickupCity(data);
      if (result) {
        toast.success("Pickup city created successfully!");
        router.push("/settings/pickup-cities");
      }
    } catch (error) {
      // Error handling is managed by the store and form component
      console.error("Create pickup city error:", error);
    }
  };

  const handleCancel = () => {
    router.push("/settings/pickup-cities");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-default-900">
            Create New Pickup City
          </h1>
          <p className="text-default-600">
            Add a new pickup location to your logistics network
          </p>
        </div>

        <Link href="/settings/pickup-cities">
          <Button variant="outline">
            <Icon icon="heroicons:arrow-left" className="w-4 h-4 mr-2" />
            Back to Pickup Cities
          </Button>
        </Link>
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
            <span className="text-default-900 font-medium">Create</span>
          </li>
        </ol>
      </nav>

      {/* Form */}
      <PickupCityForm
        mode="create"
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isCreating}
      />
    </div>
  );
};

// Main component with protection
const CreatePickupCityPage = () => {
  return (
    <ProtectedRoute
      requiredPermissions={[SETTINGS_PERMISSIONS.CREATE_PICKUP_CITY]}
      requiredAccessLevel="FULL"
      allowedAccountStatuses={["ACTIVE"]}
      requireValidation={true}
    >
      <CreatePickupCityPageContent />
    </ProtectedRoute>
  );
};

export default CreatePickupCityPage;
