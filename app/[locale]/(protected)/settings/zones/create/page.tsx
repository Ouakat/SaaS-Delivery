"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Link } from "@/i18n/routing";
import { useZonesStore } from "@/lib/stores/parcels/zones.store";
import { useAuthStore } from "@/lib/stores/auth/auth.store";
import ZoneForm from "@/components/settings/zones/zone-form";
import { ProtectedRoute } from "@/components/route/protected-route";
import { SETTINGS_PERMISSIONS } from "@/lib/constants/settings";
import { toast } from "sonner";
import type { CreateZoneRequest } from "@/lib/types/parcels/zones.types";

const CreateZonePageContent = () => {
  const router = useRouter();
  const { hasPermission } = useAuthStore();
  const { loading, createZone, fetchAvailableCities, availableCities } =
    useZonesStore();

  const canCreateZones = hasPermission(SETTINGS_PERMISSIONS.CREATE_ZONE);

  // Initialize data
  useEffect(() => {
    fetchAvailableCities();
  }, [fetchAvailableCities]);

  // Handle form submission
  const handleSubmit = async (data: CreateZoneRequest) => {
    if (!canCreateZones) {
      toast.error("You don't have permission to create zones");
      return;
    }

    try {
      const newZone = await createZone(data);

      if (newZone) {
        // Redirect to zones list
        router.push("/settings/zones");
      }
    } catch (error) {
      console.error("Failed to create zone:", error);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    router.push("/settings/zones");
  };

  if (!canCreateZones) {
    return (
      <div className="container mx-auto py-8">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-red-800">
              <Icon icon="heroicons:exclamation-triangle" className="w-6 h-6" />
              <div>
                <h3 className="font-semibold">Access Denied</h3>
                <p className="text-sm">
                  You don't have permission to create zones. Please contact your
                  administrator.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-default-900">
            Create New Zone
          </h1>
          <p className="text-default-600">
            Create a new delivery zone and assign cities to it
          </p>
        </div>

        <Link href="/settings/zones">
          <Button variant="outline">
            <Icon icon="heroicons:arrow-left" className="w-4 h-4 mr-2" />
            Back to Zones
          </Button>
        </Link>
      </div>

      {/* Creation Tips */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Icon
              icon="heroicons:information-circle"
              className="w-5 h-5 text-blue-600 mt-0.5"
            />
            <div className="text-blue-900">
              <h4 className="font-medium mb-1">Zone Creation Tips</h4>
              <ul className="text-sm space-y-1">
                <li>
                  • Choose a descriptive name that reflects the geographical
                  area
                </li>
                <li>• Select cities that are logically grouped together</li>
                <li>• You can add more cities to the zone later if needed</li>
                <li>
                  • Active zones will be available for tariff configuration
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon icon="heroicons:map" className="w-5 h-5" />
            Zone Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ZoneForm
            mode="create"
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            loading={loading}
            availableCities={availableCities}
          />
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon icon="heroicons:question-mark-circle" className="w-5 h-5" />
            Need Help?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-default-900 mb-2">
                Zone Organization
              </h4>
              <p className="text-sm text-default-600 mb-2">
                Organize cities into zones based on:
              </p>
              <ul className="text-sm text-default-600 space-y-1">
                <li>• Geographical proximity</li>
                <li>• Delivery logistics</li>
                <li>• Administrative regions</li>
                <li>• Service coverage areas</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-default-900 mb-2">
                Best Practices
              </h4>
              <ul className="text-sm text-default-600 space-y-1">
                <li>• Keep zone names short but descriptive</li>
                <li>• Group cities with similar delivery characteristics</li>
                <li>• Avoid overlapping zones when possible</li>
                <li>• Consider future expansion when creating zones</li>
              </ul>
            </div>
          </div>

          <div className="pt-4 border-t">
            <div className="flex items-center gap-2 text-sm text-default-600">
              <Icon icon="heroicons:light-bulb" className="w-4 h-4" />
              <span>
                Once created, you can manage zone cities and configure delivery
                tariffs between pickup cities and zone destinations.
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Main component wrapped with ProtectedRoute
const CreateZonePage = () => {
  return (
    <ProtectedRoute
      requiredPermissions={[SETTINGS_PERMISSIONS.CREATE_ZONE]}
      requiredAccessLevel="FULL"
      allowedAccountStatuses={["ACTIVE"]}
      requireValidation={true}
    >
      <CreateZonePageContent />
    </ProtectedRoute>
  );
};

export default CreateZonePage;
