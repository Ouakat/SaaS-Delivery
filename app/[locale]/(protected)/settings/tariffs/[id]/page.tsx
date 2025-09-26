"use client";
import React, { useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Link } from "@/i18n/routing";
import { ProtectedRoute } from "@/components/route/protected-route";
import { SETTINGS_PERMISSIONS } from "@/lib/constants/settings";
import { useTariffsStore } from "@/lib/stores/parcels/tariffs.store";
import { useAuthStore } from "@/lib/stores/auth/auth.store";
import { toast } from "sonner";
import { color } from "../../../../../../lib/types/ui/template";

const TariffDetailsPageContent = () => {
  const params = useParams();
  const tariffId = params?.id as string;
  const { hasPermission } = useAuthStore();

  const {
    currentTariff,
    fetchTariffById,
    deleteTariff,
    duplicateTariff,
    isLoading,
    error,
  } = useTariffsStore();

  const canManageSettings = hasPermission(SETTINGS_PERMISSIONS.MANAGE_SETTINGS);

  useEffect(() => {
    if (tariffId) {
      fetchTariffById(tariffId);
    }
  }, [tariffId, fetchTariffById]);

  const handleDelete = async () => {
    if (!tariffId) return;

    const success = await deleteTariff(tariffId);
    if (success) {
      window.location.href = "/settings/tariffs";
    }
  };

  const handleDuplicate = async () => {
    if (!currentTariff) return;

    // For now, duplicate with same route (will need to be edited)
    const success = await duplicateTariff(
      currentTariff.id,
      currentTariff.pickupCityId,
      currentTariff.destinationCityId
    );

    if (success) {
      toast.success(
        "Tariff duplicated successfully. Please edit the route to avoid conflicts."
      );
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute
        requiredPermissions={[SETTINGS_PERMISSIONS.READ_TARIFFS]}
        requiredAccessLevel="FULL"
        requireValidation={true}
      >
        <div className="space-y-6">
          <Card>
            <CardContent className="p-8">
              <div className="flex items-center justify-center space-x-2">
                <Icon
                  icon="heroicons:arrow-path"
                  className="w-5 h-5 animate-spin"
                />
                <span>Loading tariff details...</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </ProtectedRoute>
    );
  }

  if (!currentTariff) {
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
              Tariff not found or has been deleted.
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
            <h1 className="text-2xl font-bold text-default-900">
              Tariff Details
            </h1>
            <p className="text-default-600">
              View shipping tariff configuration
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Badge color="primary" className="text-sm">
                {currentTariff.pickupCity.name} →{" "}
                {currentTariff.destinationCity.name}
              </Badge>
              <Badge color="primary" className="text-sm">
                {currentTariff.deliveryDelay} days
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canManageSettings && (
              <>
                <Button
                  variant="outline"
                  size="md"
                  onClick={handleDuplicate}
                  disabled={isLoading}
                >
                  <Icon
                    icon="heroicons:document-duplicate"
                    className="w-4 h-4 mr-2"
                  />
                  Duplicate
                </Button>

                <Link href={`/settings/tariffs/${tariffId}/edit`}>
                  <Button variant="outline" size="md">
                    <Icon icon="heroicons:pencil" className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </Link>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="md"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <Icon icon="heroicons:trash" className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Tariff</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this tariff? This action
                        cannot be undone and will affect future shipments on
                        this route.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-red-600 text-white hover:bg-red-700"
                      >
                        Delete Tariff
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}

            <Link href="/settings/tariffs">
              <Button variant="outline">
                <Icon icon="heroicons:arrow-left" className="w-4 h-4 mr-2" />
                Back to Tariffs
              </Button>
            </Link>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert color="destructive">
            <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Route Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon icon="heroicons:map" className="w-5 h-5" />
                  Route Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-center">
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-2">
                        <Icon
                          icon="heroicons:building-office"
                          className="w-8 h-8 text-green-600"
                        />
                      </div>
                      <div className="font-medium">
                        {currentTariff.pickupCity.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        ({currentTariff.pickupCity.ref})
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Pickup
                      </div>
                    </div>

                    <div className="flex-1 flex items-center justify-center">
                      <div className="flex items-center space-x-2">
                        <div className="h-px bg-border flex-1"></div>
                        <Icon
                          icon="heroicons:arrow-right"
                          className="w-6 h-6 text-primary"
                        />
                        <div className="h-px bg-border flex-1"></div>
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                        <Icon
                          icon="heroicons:map-pin"
                          className="w-8 h-8 text-blue-600"
                        />
                      </div>
                      <div className="font-medium">
                        {currentTariff.destinationCity.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        ({currentTariff.destinationCity.ref})
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Destination
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-center">
                    <div className="flex items-center gap-2 text-sm">
                      <Icon
                        icon="heroicons:clock"
                        className="w-4 h-4 text-orange-600"
                      />
                      <span className="font-medium">Delivery Time:</span>
                      <Badge color="primary">
                        {currentTariff.deliveryDelay} days
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pricing Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon icon="heroicons:currency-dollar" className="w-5 h-5" />
                  Pricing Structure
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                    <Icon
                      icon="heroicons:check-circle"
                      className="w-12 h-12 text-green-600 mx-auto mb-3"
                    />
                    <div className="text-2xl font-bold text-green-700 mb-1">
                      ${currentTariff.deliveryPrice}
                    </div>
                    <div className="text-sm font-medium text-green-600">
                      Delivery Price
                    </div>
                    <div className="text-xs text-green-600 mt-1">
                      Successful delivery
                    </div>
                  </div>

                  <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <Icon
                      icon="heroicons:arrow-uturn-left"
                      className="w-12 h-12 text-orange-600 mx-auto mb-3"
                    />
                    <div className="text-2xl font-bold text-orange-700 mb-1">
                      ${currentTariff.returnPrice}
                    </div>
                    <div className="text-sm font-medium text-orange-600">
                      Return Price
                    </div>
                    <div className="text-xs text-orange-600 mt-1">
                      Package returned
                    </div>
                  </div>

                  <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                    <Icon
                      icon="heroicons:x-circle"
                      className="w-12 h-12 text-red-600 mx-auto mb-3"
                    />
                    <div className="text-2xl font-bold text-red-700 mb-1">
                      ${currentTariff.refusalPrice}
                    </div>
                    <div className="text-sm font-medium text-red-600">
                      Refusal Price
                    </div>
                    <div className="text-xs text-red-600 mt-1">
                      Package refused
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Usage Analytics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon icon="heroicons:chart-bar" className="w-5 h-5" />
                  Usage Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Icon
                    icon="heroicons:chart-pie"
                    className="w-16 h-16 mx-auto mb-4 opacity-50"
                  />
                  <p>Usage analytics will be available soon</p>
                  <p className="text-sm">
                    Track how often this tariff is used for shipments
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon icon="heroicons:bolt" className="w-5 h-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {canManageSettings && (
                  <>
                    <Link
                      href={`/settings/tariffs/${tariffId}/edit`}
                      className="block"
                    >
                      <Button variant="outline" className="w-full">
                        <Icon
                          icon="heroicons:pencil"
                          className="w-4 h-4 mr-2"
                        />
                        Edit Tariff
                      </Button>
                    </Link>

                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleDuplicate}
                      disabled={isLoading}
                    >
                      <Icon
                        icon="heroicons:document-duplicate"
                        className="w-4 h-4 mr-2"
                      />
                      Duplicate
                    </Button>
                  </>
                )}

                <Link href="/settings/tariffs/create" className="block">
                  <Button variant="outline" className="w-full">
                    <Icon icon="heroicons:plus" className="w-4 h-4 mr-2" />
                    Create New
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Tariff Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon
                    icon="heroicons:information-circle"
                    className="w-5 h-5"
                  />
                  Tariff Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tariff ID:</span>
                    <span className="font-mono text-xs">
                      {currentTariff.id}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Created:</span>
                    <span>
                      {new Date(currentTariff.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Last Updated:</span>
                    <span>
                      {new Date(currentTariff.updatedAt).toLocaleDateString()}
                    </span>
                  </div>

                  {currentTariff.createdBy && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Created By:</span>
                      <span>{currentTariff.createdBy}</span>
                    </div>
                  )}

                  {currentTariff.updatedBy && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Updated By:</span>
                      <span>{currentTariff.updatedBy}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Related Tariffs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon icon="heroicons:link" className="w-5 h-5" />
                  Related Routes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4 text-muted-foreground">
                  <Icon
                    icon="heroicons:map"
                    className="w-12 h-12 mx-auto mb-2 opacity-50"
                  />
                  <p className="text-sm">Related routes will be shown here</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default TariffDetailsPageContent;
