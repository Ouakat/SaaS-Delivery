"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Link } from "@/i18n/routing";
import { ProtectedRoute } from "@/components/route/protected-route";
import { SETTINGS_PERMISSIONS } from "@/lib/constants/settings";
import CityForm from "@/components/settings/cities/city-form";
import type { City } from "@/lib/types/settings/cities.types";

const CreateCityPageContent = () => {
  const router = useRouter();

  const handleSuccess = (city: City) => {
    // Redirect to the new city's detail page
    router.push(`/settings/cities/${city.id}`);
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/settings">
              <Button variant="ghost" size="sm">
                <Icon icon="heroicons:arrow-left" className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </Link>
            <Icon
              icon="heroicons:chevron-right"
              className="w-4 h-4 text-gray-400"
            />
            <Link href="/settings/cities">
              <Button variant="ghost" size="sm" className="text-gray-500">
                Cities
              </Button>
            </Link>
            <Icon
              icon="heroicons:chevron-right"
              className="w-4 h-4 text-gray-400"
            />
            <span className="text-sm text-gray-500">Create</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Create New City</h1>
          <p className="text-gray-600 mt-1">
            Add a new city to your delivery network
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl">
        <CityForm
          mode="create"
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
};

// Main component with protection
const CreateCityPage = () => {
  return (
    <ProtectedRoute
      requiredPermissions={[SETTINGS_PERMISSIONS.MANAGE_CITIES]}
      requiredAccessLevel="FULL"
      allowedAccountStatuses={["ACTIVE"]}
      requireValidation={true}
    >
      <CreateCityPageContent />
    </ProtectedRoute>
  );
};

export default CreateCityPage;
