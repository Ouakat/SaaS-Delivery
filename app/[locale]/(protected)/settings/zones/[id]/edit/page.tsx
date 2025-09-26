"use client";

import React, { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/routing";
import { useZonesStore } from "@/lib/stores/parcels/zones.store";
import { useAuthStore } from "@/lib/stores/auth/auth.store";
import ZoneForm from "@/components/settings/zones/zone-form";
import { ProtectedRoute } from "@/components/route/protected-route";
import { SETTINGS_PERMISSIONS } from "@/lib/constants/settings";
import { toast } from "sonner";
import type { UpdateZoneRequest } from "@/lib/types/parcels/zones.types";

const EditZonePageContent = () => {
  const router = useRouter();
  const params = useParams();
  const zoneId = params?.id as string;

  const { hasPermission } = useAuthStore();
  const {
    currentZone,
    loading,
    availableCities,
    fetchZoneById,
    updateZone,
    fetchAvailableCities,
  } = useZonesStore();

  const canUpdateZones = hasPermission(SETTINGS_PERMISSIONS.UPDATE_ZONE);

  // Initialize data
  useEffect(() => {
    if (zoneId) {
      fetchZoneById(zoneId);
    }
    fetchAvailableCities();
  }, [zoneId, fetchZoneById, fetchAvailableCities]);

  // Handle form submission
  const handleSubmit = async (data: UpdateZoneRequest) => {
    if (!canUpdateZones) {
      toast.error("You don't have permission to update zones");
      return;
    }

    if (!zoneId) {
      toast.error("Zone ID not found");
      return;
    }

    try {
      const updatedZone = await updateZone(zoneId, data);

      if (updatedZone) {
        // Redirect to zone view page
        router.push(`/settings/zones/${zoneId}`);
      }
    } catch (error) {
      console.error("Failed to update zone:", error);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    router.push(`/settings/zones/${zoneId}`);
  };

  if (!canUpdateZones) {
    return (
      <div className="container mx-auto py-8">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-red-800">
              <Icon icon="heroicons:exclamation-triangle" className="w-6 h-6" />
              <div>
                <h3 className="font-semibold">Access Denied</h3>
                <p className="text-sm">
                  You don't have permission to edit zones. Please contact your
                  administrator.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-10 bg-gray-200 rounded animate-pulse"
              ></div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentZone) {
    return (
      <div className="space-y-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-red-800">
              <Icon icon="heroicons:exclamation-triangle" className="w-6 h-6" />
              <div>
                <h3 className="font-semibold">Zone Not Found</h3>
                <p className="text-sm">
                  The zone you're trying to edit doesn't exist or has been
                  deleted.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center">
          <Link href="/settings/zones">
            <Button>
              <Icon icon="heroicons:arrow-left" className="w-4 h-4 mr-2" />
              Back to Zones
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-default-900">
              Edit Zone: {currentZone.name}
            </h1>
            <Badge color={currentZone.status ? "success" : "secondary"}>
              {currentZone.status ? "Active" : "Inactive"}
            </Badge>
          </div>
          <p className="text-default-600">
            Update zone information and manage assigned cities
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/settings/zones/${currentZone.id}`}>
            <Button variant="outline">
              <Icon icon="heroicons:eye" className="w-4 h-4 mr-2" />
              View Zone
            </Button>
          </Link>

          <Link href="/settings/zones">
            <Button variant="outline">
              <Icon icon="heroicons:arrow-left" className="w-4 h-4 mr-2" />
              Back to Zones
            </Button>
          </Link>
        </div>
      </div>

      {/* Current Zone Info */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Icon
              icon="heroicons:information-circle"
              className="w-5 h-5 text-blue-600 mt-0.5"
            />
            <div className="text-blue-900">
              <h4 className="font-medium mb-1">Current Zone Information</h4>
              <div className="text-sm space-y-1">
                <div>
                  <strong>Name:</strong> {currentZone.name}
                </div>
                <div>
                  <strong>Status:</strong>{" "}
                  {currentZone.status ? "Active" : "Inactive"}
                </div>
                <div>
                  <strong>Cities:</strong>{" "}
                  {currentZone._count?.cities ||
                    currentZone.cities?.length ||
                    0}{" "}
                  assigned
                </div>
                <div>
                  <strong>Created:</strong>{" "}
                  {new Date(currentZone.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Form Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon icon="heroicons:pencil-square" className="w-5 h-5" />
            Edit Zone Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ZoneForm
            mode="edit"
            initialData={{
              name: currentZone.name,
              cityIds: currentZone.cities?.map((city) => city.id) || [],
              status: currentZone.status,
            }}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            loading={loading}
            availableCities={availableCities}
          />
        </CardContent>
      </Card>

      {/* Tips for Editing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon icon="heroicons:light-bulb" className="w-5 h-5" />
            Editing Tips
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-default-900 mb-2">
                Zone Management
              </h4>
              <ul className="text-sm text-default-600 space-y-1">
                <li>• You can add or remove cities from this zone</li>
                <li>• Deactivating a zone will affect delivery calculations</li>
                <li>• Zone name changes will be reflected in all tariffs</li>
                <li>• Cities can only belong to one zone at a time</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-default-900 mb-2">
                Impact Considerations
              </h4>
              <ul className="text-sm text-default-600 space-y-1">
                <li>• Existing tariffs using this zone will be updated</li>
                <li>• Active shipments may be affected by city changes</li>
                <li>• Reports and analytics will reflect the changes</li>
                <li>• Consider notifying relevant team members</li>
              </ul>
            </div>
          </div>

          <div className="pt-4 border-t">
            <div className="flex items-start gap-2 text-sm text-default-600">
              <Icon
                icon="heroicons:exclamation-triangle"
                className="w-4 h-4 text-yellow-600 mt-0.5"
              />
              <div>
                <strong>Important:</strong> Changes to zones that are actively
                used in tariff calculations may affect shipping costs and
                delivery estimates for ongoing parcels. Review your tariffs
                after making significant changes to ensure pricing accuracy.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Zone Usage Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon icon="heroicons:chart-bar" className="w-5 h-5" />
            Zone Usage Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <Icon
                icon="heroicons:truck"
                className="w-8 h-8 text-blue-600 mx-auto mb-2"
              />
              <h4 className="font-medium text-default-900">Delivery Tariffs</h4>
              <p className="text-sm text-default-600">
                Used in shipping calculations
              </p>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <Icon
                icon="heroicons:map-pin"
                className="w-8 h-8 text-green-600 mx-auto mb-2"
              />
              <h4 className="font-medium text-default-900">
                Geographic Coverage
              </h4>
              <p className="text-sm text-default-600">
                Organizes delivery regions
              </p>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <Icon
                icon="heroicons:document-chart-bar"
                className="w-8 h-8 text-purple-600 mx-auto mb-2"
              />
              <h4 className="font-medium text-default-900">
                Analytics & Reports
              </h4>
              <p className="text-sm text-default-600">
                Performance tracking by zone
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Main component wrapped with ProtectedRoute
const EditZonePage = () => {
  return (
    <ProtectedRoute
      requiredPermissions={[SETTINGS_PERMISSIONS.UPDATE_ZONE]}
      requiredAccessLevel="FULL"
      allowedAccountStatuses={["ACTIVE"]}
      requireValidation={true}
    >
      <EditZonePageContent />
    </ProtectedRoute>
  );
};

export default EditZonePage;
