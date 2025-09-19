"use client";
import React, { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "@/i18n/routing";
import { ProtectedRoute } from "@/components/route/protected-route";
import { SETTINGS_PERMISSIONS } from "@/lib/constants/settings";
import { useTariffsStore } from "@/lib/stores/settings/tariffs.store";
import { useCitiesStore } from "@/lib/stores/settings/cities.store";
import { usePickupCitiesStore } from "@/lib/stores/settings/pickup-cities.store";
import TariffForm from "@/components/settings/tariffs/tariff-form";

const EditTariffPageContent = () => {
  const router = useRouter();
  const params = useParams();
  const tariffId = params?.id as string;

  const { currentTariff, updateTariff, fetchTariffById, isLoading, error } =
    useTariffsStore();
  const { cities, fetchCities } = useCitiesStore();
  const { pickupCities, fetchActivePickupCities } = usePickupCitiesStore();

  useEffect(() => {
    if (tariffId) {
      fetchTariffById(tariffId);
    }
    fetchCities();
    fetchActivePickupCities();
  }, [tariffId, fetchTariffById, fetchCities, fetchActivePickupCities]);

  const handleSubmit = async (data: any) => {
    if (!tariffId) return;

    const success = await updateTariff(tariffId, data);
    if (success) {
      router.push("/settings/tariffs");
    }
  };

  const handleCancel = () => {
    router.push("/settings/tariffs");
  };

  if (!currentTariff && !isLoading) {
    return (
      <ProtectedRoute
        requiredPermissions={[SETTINGS_PERMISSIONS.READ_TARIFFS]}
        requiredAccessLevel="FULL"
        requireValidation={true}
      >
        <div className="space-y-6">
          <Alert color="destructive">
            <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
            <AlertDescription>
              Tariff not found or you don't have permission to edit it.
            </AlertDescription>
          </Alert>
          <Link href="/settings/tariffs">
            <Button>
              <Icon icon="heroicons:arrow-left" className="w-4 h-4 mr-2" />
              Back to Tariffs
            </Button>
          </Link>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute
      requiredPermissions={[SETTINGS_PERMISSIONS.READ_TARIFFS]}
      requiredAccessLevel="FULL"
      requireValidation={true}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-default-900">Edit Tariff</h1>
            <p className="text-default-600">
              Modify shipping tariff configuration
            </p>
            {currentTariff && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm text-muted-foreground">Route:</span>
                <span className="text-sm font-medium">
                  {currentTariff.pickupCity.name} →{" "}
                  {currentTariff.destinationCity.name}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/settings/tariffs/${tariffId}`}>
              <Button variant="outline" size="sm">
                <Icon icon="heroicons:eye" className="w-4 h-4 mr-2" />
                View Details
              </Button>
            </Link>
            <Link href="/settings/tariffs">
              <Button variant="outline">
                <Icon icon="heroicons:arrow-left" className="w-4 h-4 mr-2" />
                Back to Tariffs
              </Button>
            </Link>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <Card>
            <CardContent className="p-8">
              <div className="flex items-center justify-center space-x-2">
                <Icon
                  icon="heroicons:arrow-path"
                  className="w-5 h-5 animate-spin"
                />
                <span>Loading tariff data...</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Alert */}
        {error && (
          <Alert color="destructive">
            <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Form Card */}
        {currentTariff && (
          <Card>
            <CardHeader>
              <CardTitle>Update Tariff Information</CardTitle>
            </CardHeader>
            <CardContent>
              <TariffForm
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                isLoading={isLoading}
                cities={cities}
                pickupCities={pickupCities}
                initialData={currentTariff}
                isEditing={true}
              />
            </CardContent>
          </Card>
        )}

        {/* Current Configuration Display */}
        {currentTariff && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon icon="heroicons:information-circle" className="w-5 h-5" />
                Current Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-default-900">
                      Route Information
                    </h4>
                    <div className="mt-2 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Pickup City:
                        </span>
                        <span className="font-medium">
                          {currentTariff.pickupCity.name} (
                          {currentTariff.pickupCity.ref})
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Destination City:
                        </span>
                        <span className="font-medium">
                          {currentTariff.destinationCity.name} (
                          {currentTariff.destinationCity.ref})
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Delivery Delay:
                        </span>
                        <span className="font-medium">
                          {currentTariff.deliveryDelay} days
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-default-900">
                      Pricing Information
                    </h4>
                    <div className="mt-2 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Delivery Price:
                        </span>
                        <span className="font-medium text-green-600">
                          ${currentTariff.deliveryPrice}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Return Price:
                        </span>
                        <span className="font-medium text-orange-600">
                          ${currentTariff.returnPrice}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Refusal Price:
                        </span>
                        <span className="font-medium text-red-600">
                          ${currentTariff.refusalPrice}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    Created:{" "}
                    {new Date(currentTariff.createdAt).toLocaleDateString()}
                    {currentTariff.createdBy &&
                      ` by ${currentTariff.createdBy}`}
                  </span>
                  <span>
                    Updated:{" "}
                    {new Date(currentTariff.updatedAt).toLocaleDateString()}
                    {currentTariff.updatedBy &&
                      ` by ${currentTariff.updatedBy}`}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Help Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon icon="heroicons:question-mark-circle" className="w-5 h-5" />
              Edit Guidelines
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-default-900 mb-2">
                  Price Updates
                </h4>
                <ul className="space-y-1 text-sm text-default-600">
                  <li>• Price changes affect new shipments immediately</li>
                  <li>• Existing shipments keep original pricing</li>
                  <li>
                    • Consider gradual price increases for customer retention
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-default-900 mb-2">
                  Route Changes
                </h4>
                <ul className="space-y-1 text-sm text-default-600">
                  <li>• Changing route creates validation checks</li>
                  <li>• New route must not conflict with existing tariffs</li>
                  <li>• Delivery delay changes affect customer expectations</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
};

export default EditTariffPageContent;
