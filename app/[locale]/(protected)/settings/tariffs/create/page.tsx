"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "@/i18n/routing";
import { ProtectedRoute } from "@/components/route/protected-route";
import { SETTINGS_PERMISSIONS } from "@/lib/constants/settings";
import { useTariffsStore } from "@/lib/stores/tariffs.store";
import { useCitiesStore } from "@/lib/stores/cities.store";
import { usePickupCitiesStore } from "@/lib/stores/pickup-cities.store";
import TariffForm from "@/components/settings/tariffs/tariff-form";

const CreateTariffPageContent = () => {
  const router = useRouter();
  const { createTariff, isLoading, error } = useTariffsStore();
  const { cities, fetchCities } = useCitiesStore();
  const { pickupCities, fetchActivePickupCities } = usePickupCitiesStore();

  useEffect(() => {
    fetchCities();
    fetchActivePickupCities();
  }, [fetchCities, fetchActivePickupCities]);

  const handleSubmit = async (data: any) => {
    const success = await createTariff(data);
    if (success) {
      router.push("/settings/tariffs");
    }
  };

  const handleCancel = () => {
    router.push("/settings/tariffs");
  };

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
            <h1 className="text-2xl font-bold text-default-900">
              Create New Tariff
            </h1>
            <p className="text-default-600">
              Configure shipping tariff between pickup and destination cities
            </p>
          </div>
          <Link href="/settings/tariffs">
            <Button variant="outline">
              <Icon icon="heroicons:arrow-left" className="w-4 h-4 mr-2" />
              Back to Tariffs
            </Button>
          </Link>
        </div>

        {/* Requirements Alert */}
        {(!cities.length || !pickupCities.length) && (
          <Alert color="warning">
            <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p>
                  <strong>Prerequisites:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {!cities.length && (
                    <li>
                      You need to configure cities first.
                      <Link
                        href="/settings/cities"
                        className="ml-1 text-primary underline"
                      >
                        Go to Cities
                      </Link>
                    </li>
                  )}
                  {!pickupCities.length && (
                    <li>
                      You need to configure pickup cities first.
                      <Link
                        href="/settings/pickup-cities"
                        className="ml-1 text-primary underline"
                      >
                        Go to Pickup Cities
                      </Link>
                    </li>
                  )}
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Error Alert */}
        {error && (
          <Alert color="destructive">
            <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Form Card */}
        <Card>
          <CardHeader>
            <CardTitle>Tariff Information</CardTitle>
          </CardHeader>
          <CardContent>
            <TariffForm
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isLoading={isLoading}
              cities={cities}
              pickupCities={pickupCities}
            />
          </CardContent>
        </Card>

        {/* Help Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon icon="heroicons:information-circle" className="w-5 h-5" />
              Tariff Configuration Help
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-default-900 mb-2">
                  Price Configuration
                </h4>
                <ul className="space-y-1 text-sm text-default-600">
                  <li>
                    <strong>Delivery Price:</strong> Cost for successful
                    delivery
                  </li>
                  <li>
                    <strong>Return Price:</strong> Cost when package is returned
                  </li>
                  <li>
                    <strong>Refusal Price:</strong> Cost when package is refused
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-default-900 mb-2">
                  Delivery Configuration
                </h4>
                <ul className="space-y-1 text-sm text-default-600">
                  <li>
                    <strong>Delivery Delay:</strong> Expected delivery time in
                    days
                  </li>
                  <li>
                    <strong>Route:</strong> Pickup city to destination city
                  </li>
                  <li>
                    <strong>Unique Routes:</strong> Each route can have only one
                    tariff
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
};

export default CreateTariffPageContent;
