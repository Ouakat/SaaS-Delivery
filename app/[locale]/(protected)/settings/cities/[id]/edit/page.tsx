"use client";

import React, { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/routing";
import { ProtectedRoute } from "@/components/route/protected-route";
import { useCitiesStore } from "@/lib/stores/cities.store";
import { SETTINGS_PERMISSIONS } from "@/lib/constants/settings";
import CityForm from "@/components/settings/cities/city-form";
import type { City } from "@/lib/types/settings/cities.types";

const EditCityPageContent = () => {
  const params = useParams();
  const router = useRouter();
  const cityId = params?.id as string;

  const { currentCity, isLoading, error, fetchCityById, setCurrentCity } =
    useCitiesStore();

  // Load city data
  useEffect(() => {
    if (cityId) {
      fetchCityById(cityId);
    }

    // Cleanup on unmount
    return () => {
      setCurrentCity(null);
    };
  }, [cityId, fetchCityById, setCurrentCity]);

  const handleSuccess = (city: City) => {
    // Redirect to the city's detail page
    router.push(`/settings/cities/${city.id}`);
  };

  const handleCancel = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="p-8 text-center">
            <Icon
              icon="heroicons:arrow-path"
              className="w-8 h-8 animate-spin mx-auto mb-4"
            />
            <p>Loading city data...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !currentCity) {
    return (
      <div className="container mx-auto py-6">
        <Alert color="destructive">
          <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
          <AlertDescription>{error || "City not found"}</AlertDescription>
        </Alert>
      </div>
    );
  }

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
            <Link href={`/settings/cities/${currentCity.id}`}>
              <Button variant="ghost" size="sm" className="text-gray-500">
                {currentCity.name}
              </Button>
            </Link>
            <Icon
              icon="heroicons:chevron-right"
              className="w-4 h-4 text-gray-400"
            />
            <span className="text-sm text-gray-500">Edit</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Edit {currentCity.name}
          </h1>
          <p className="text-gray-600 mt-1">
            Update city information and settings
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl">
        <CityForm
          city={currentCity}
          mode="edit"
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
};

// Main component with protection
const EditCityPage = () => {
  return (
    <ProtectedRoute
      requiredPermissions={[SETTINGS_PERMISSIONS.MANAGE_CITIES]}
      requiredAccessLevel="FULL"
      allowedAccountStatuses={["ACTIVE"]}
      requireValidation={true}
    >
      <EditCityPageContent />
    </ProtectedRoute>
  );
};

export default EditCityPage;
