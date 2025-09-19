"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "@/i18n/routing";
import { ProtectedRoute } from "@/components/route/protected-route";
import { useAuthStore } from "@/lib/stores/auth/auth.store";
import { useCitiesStore } from "@/lib/stores/settings/cities.store";
import CityForm from "@/components/settings/cities/city-form";
import type { City } from "@/lib/types/settings/cities.types";

const EditCityPageContent = () => {
  const router = useRouter();
  const params = useParams();
  const cityId = params?.id as string;

  const { hasPermission } = useAuthStore();
  const { currentCity, isLoading, error, fetchCityById, clearError } =
    useCitiesStore();

  // Check permissions
  const canUpdateCities = hasPermission("cities:update");

  // Fetch city data
  useEffect(() => {
    if (cityId) {
      fetchCityById(cityId);
    }
  }, [cityId, fetchCityById]);

  // Handle successful city update
  const handleSuccess = (city: City) => {
    // Redirect to the city details page
    router.push(`/settings/cities/${city.id}`);
  };

  // Handle cancel
  const handleCancel = () => {
    router.push(`/settings/cities/${cityId}`);
  };

  // Check permissions
  if (!canUpdateCities) {
    return (
      <div className="container mx-auto py-8">
        <Alert color="default">
          <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to edit cities. Please contact your
            administrator.
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Link href="/settings/cities">
            <Button>
              <Icon icon="heroicons:arrow-left" className="w-4 h-4 mr-2" />
              Back to Cities
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center justify-center space-x-2">
              <Icon
                icon="heroicons:arrow-path"
                className="w-5 h-5 animate-spin"
              />
              <span>Loading city data...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error || !currentCity) {
    return (
      <div className="container mx-auto py-8">
        <Alert color="default">
          <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
          <AlertDescription>
            {error || "City not found or has been deleted."}
          </AlertDescription>
        </Alert>
        <div className="mt-4 flex gap-2">
          <Button
            onClick={() => {
              clearError();
              if (cityId) fetchCityById(cityId);
            }}
          >
            <Icon icon="heroicons:arrow-path" className="w-4 h-4 mr-2" />
            Retry
          </Button>
          <Link href="/settings/cities">
            <Button variant="outline">
              <Icon icon="heroicons:arrow-left" className="w-4 h-4 mr-2" />
              Back to Cities
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/settings" className="hover:text-foreground">
          Settings
        </Link>
        <Icon icon="heroicons:chevron-right" className="w-4 h-4" />
        <Link href="/settings/cities" className="hover:text-foreground">
          Cities
        </Link>
        <Icon icon="heroicons:chevron-right" className="w-4 h-4" />
        <Link
          href={`/settings/cities/${cityId}`}
          className="hover:text-foreground"
        >
          {currentCity.name}
        </Link>
        <Icon icon="heroicons:chevron-right" className="w-4 h-4" />
        <span className="text-foreground">Edit</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold text-default-900">Edit City</h1>
            <Badge color={currentCity.status ? "default" : "secondary"}>
              {currentCity.status ? "Active" : "Inactive"}
            </Badge>
            {currentCity.pickupCity && (
              <Badge
                color="default"
                className="bg-orange-50 text-orange-700 border-orange-200"
              >
                <Icon icon="heroicons:truck" className="w-3 h-3 mr-1" />
                Pickup Location
              </Badge>
            )}
          </div>
          <p className="text-default-600">
            Update {currentCity.name} ({currentCity.ref}) configuration
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/settings/cities/${cityId}`}>
            <Button variant="outline">
              <Icon icon="heroicons:eye" className="w-4 h-4 mr-2" />
              View Details
            </Button>
          </Link>
          <Link href="/settings/cities">
            <Button variant="outline">
              <Icon icon="heroicons:arrow-left" className="w-4 h-4 mr-2" />
              Back to Cities
            </Button>
          </Link>
        </div>
      </div>

      {/* Current City Info */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-blue-900">
                Current Configuration
              </h3>
              <div className="flex items-center gap-4 mt-2 text-sm text-blue-700">
                <span>
                  Reference:{" "}
                  <span className="font-mono font-medium">
                    {currentCity.ref}
                  </span>
                </span>
                <span>Zone: {currentCity.zone}</span>
                <span>
                  Status: {currentCity.status ? "Active" : "Inactive"}
                </span>
                <span>
                  Pickup: {currentCity.pickupCity ? "Enabled" : "Disabled"}
                </span>
              </div>
            </div>
            <div className="text-blue-600">
              <Icon icon="heroicons:information-circle" className="w-8 h-8" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Warning */}
      {(currentCity._count?.pickupTariffs || 0) > 0 ||
        ((currentCity._count?.destinationTariffs || 0) > 0 && (
          <Alert color="default">
            <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p className="font-medium">This city is currently in use</p>
                <p>
                  This city has {currentCity._count?.pickupTariffs || 0} pickup
                  tariffs and {currentCity._count?.destinationTariffs || 0}{" "}
                  destination tariffs configured. Modifying the zone or
                  disabling the city may affect existing pricing.
                </p>
              </div>
            </AlertDescription>
          </Alert>
        ))}

      {/* Change History Info */}
      <Card className="bg-gradient-to-r from-slate-50 to-gray-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-slate-900">Change History</h3>
              <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                <span>
                  Created:{" "}
                  {new Date(currentCity.createdAt).toLocaleDateString()}
                  {currentCity.createdBy && " by Admin"}
                </span>
                <span>
                  Last updated:{" "}
                  {new Date(currentCity.updatedAt).toLocaleDateString()}
                  {currentCity.updatedBy && " by Admin"}
                </span>
              </div>
            </div>
            <div className="text-slate-500">
              <Icon icon="heroicons:clock" className="w-6 h-6" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Form */}
      <div className="max-w-4xl mx-auto">
        <CityForm
          city={currentCity}
          mode="edit"
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>

      {/* Edit Guidelines */}
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon icon="heroicons:shield-check" className="w-5 h-5" />
            Editing Guidelines
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium text-slate-900 mb-2">
                ⚠️ Important Considerations
              </h4>
              <ul className="space-y-1 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <Icon
                    icon="heroicons:exclamation-triangle"
                    className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0"
                  />
                  Changing the zone may affect existing tariff pricing
                </li>
                <li className="flex items-start gap-2">
                  <Icon
                    icon="heroicons:exclamation-triangle"
                    className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0"
                  />
                  Disabling pickup capability may impact active routes
                </li>
                <li className="flex items-start gap-2">
                  <Icon
                    icon="heroicons:exclamation-triangle"
                    className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0"
                  />
                  Deactivating the city prevents new parcel creation
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-slate-900 mb-2">
                ✅ Safe Changes
              </h4>
              <ul className="space-y-1 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <Icon
                    icon="heroicons:check"
                    className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0"
                  />
                  Updating the city name for clarity
                </li>
                <li className="flex items-start gap-2">
                  <Icon
                    icon="heroicons:check"
                    className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0"
                  />
                  Enabling pickup capability for expansion
                </li>
                <li className="flex items-start gap-2">
                  <Icon
                    icon="heroicons:check"
                    className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0"
                  />
                  Reference changes (if no conflicts)
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-600">
                Need help with city management or have questions about the
                impact of changes?
              </p>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm">
                  <Icon icon="heroicons:book-open" className="w-4 h-4 mr-2" />
                  Documentation
                </Button>
                <Button variant="outline" size="sm">
                  <Icon
                    icon="heroicons:chat-bubble-left-right"
                    className="w-4 h-4 mr-2"
                  />
                  Contact Support
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Main page component with protection
export default function EditCityPage() {
  return (
    <ProtectedRoute
      requiredPermissions={["cities:update"]}
      requiredAccessLevel="FULL"
    >
      <EditCityPageContent />
    </ProtectedRoute>
  );
}
