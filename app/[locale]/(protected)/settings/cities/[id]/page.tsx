"use client";

import React, { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Link } from "@/i18n/routing";
import { ProtectedRoute } from "@/components/route/protected-route";
import { useAuthStore } from "@/lib/stores/auth.store";
import { useCitiesStore } from "@/lib/stores/cities.store";
import { SETTINGS_PERMISSIONS } from "@/lib/constants/settings";
import { toast } from "sonner";

const CityDetailsPageContent = () => {
  const params = useParams();
  const router = useRouter();
  const cityId = params?.id as string;

  const { hasPermission } = useAuthStore();
  const {
    currentCity,
    isLoading,
    isDeleting,
    error,
    fetchCityById,
    deleteCity,
    toggleCityStatus,
    setCurrentCity,
  } = useCitiesStore();

  // Permissions
  const canUpdate = hasPermission(SETTINGS_PERMISSIONS.MANAGE_CITIES);
  const canDelete = hasPermission(SETTINGS_PERMISSIONS.MANAGE_CITIES);

  // Local state
  const [deleteDialog, setDeleteDialog] = React.useState(false);

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleToggleStatus = async () => {
    if (!currentCity) return;

    const result = await toggleCityStatus(currentCity.id);
    if (result) {
      toast.success(
        `City ${result.status ? "activated" : "deactivated"} successfully`
      );
    } else {
      toast.error("Failed to toggle city status");
    }
  };

  const handleDelete = async () => {
    if (!currentCity) return;

    const success = await deleteCity(currentCity.id);
    if (success) {
      toast.success("City deleted successfully");
      router.push("/settings/cities");
    } else {
      toast.error("Failed to delete city");
    }
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
            <p>Loading city details...</p>
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
            <span className="text-sm text-gray-500">{currentCity.name}</span>
          </div>

          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {currentCity.name}
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <Badge className="font-mono">{currentCity.ref}</Badge>
                <Badge className="bg-blue-100 text-blue-800">
                  {currentCity.zone}
                </Badge>
                <Badge color={currentCity.status ? "success" : "secondary"}>
                  {currentCity.status ? "Active" : "Inactive"}
                </Badge>
                {currentCity.pickupCity && (
                  <Badge color="info">Pickup Available</Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={isLoading}>
                <Icon
                  icon="heroicons:ellipsis-horizontal"
                  className="w-4 h-4 mr-2"
                />
                Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canUpdate && (
                <DropdownMenuItem asChild>
                  <Link href={`/settings/cities/${currentCity.id}/edit`}>
                    <Icon
                      icon="heroicons:pencil-square"
                      className="mr-2 h-4 w-4"
                    />
                    Edit City
                  </Link>
                </DropdownMenuItem>
              )}

              {canUpdate && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleToggleStatus}
                    disabled={isLoading}
                  >
                    <Icon
                      icon={
                        currentCity.status
                          ? "heroicons:pause"
                          : "heroicons:play"
                      }
                      className="mr-2 h-4 w-4"
                    />
                    {currentCity.status ? "Deactivate" : "Activate"}
                  </DropdownMenuItem>
                </>
              )}

              {canDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-600"
                    onClick={() => setDeleteDialog(true)}
                    disabled={isDeleting}
                  >
                    <Icon icon="heroicons:trash" className="mr-2 h-4 w-4" />
                    Delete City
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon icon="heroicons:information-circle" className="w-5 h-5" />
                City Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900">City Name</h4>
                  <p className="text-gray-600">{currentCity.name}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Reference Code</h4>
                  <p className="font-mono text-gray-600">{currentCity.ref}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Zone</h4>
                  <Badge className="bg-blue-100 text-blue-800">
                    {currentCity.zone}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">City Type</h4>
                  <Badge color={currentCity.pickupCity ? "info" : "secondary"}>
                    {currentCity.pickupCity
                      ? "Pickup & Delivery"
                      : "Delivery Only"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          {currentCity._count && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon icon="heroicons:chart-bar" className="w-5 h-5" />
                  Usage Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">
                      {currentCity._count.pickupTariffs}
                    </div>
                    <div className="text-sm text-gray-600">Pickup Tariffs</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">
                      {currentCity._count.destinationTariffs}
                    </div>
                    <div className="text-sm text-gray-600">
                      Destination Tariffs
                    </div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">
                      {currentCity._count.pickupTariffs +
                        currentCity._count.destinationTariffs}
                    </div>
                    <div className="text-sm text-gray-600">Total Tariffs</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon icon="heroicons:cog-6-tooth" className="w-5 h-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="justify-start" asChild>
                  <Link
                    href={`/settings/tariffs?pickupCityId=${currentCity.id}`}
                  >
                    <Icon
                      icon="heroicons:currency-dollar"
                      className="w-4 h-4 mr-2"
                    />
                    View Pickup Tariffs
                  </Link>
                </Button>

                <Button variant="outline" className="justify-start" asChild>
                  <Link
                    href={`/settings/tariffs?destinationCityId=${currentCity.id}`}
                  >
                    <Icon icon="heroicons:truck" className="w-4 h-4 mr-2" />
                    View Destination Tariffs
                  </Link>
                </Button>

                <Button variant="outline" className="justify-start" asChild>
                  <Link href={`/settings/zones?cityId=${currentCity.id}`}>
                    <Icon
                      icon="heroicons:globe-americas"
                      className="w-4 h-4 mr-2"
                    />
                    Manage Zone
                  </Link>
                </Button>

                {currentCity.pickupCity && (
                  <Button variant="outline" className="justify-start" asChild>
                    <Link
                      href={`/settings/pickup-cities?cityId=${currentCity.id}`}
                    >
                      <Icon icon="heroicons:map-pin" className="w-4 h-4 mr-2" />
                      Pickup Settings
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon icon="heroicons:signal" className="w-5 h-5" />
                Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Active Status</span>
                <Badge color={currentCity.status ? "success" : "secondary"}>
                  {currentCity.status ? "Active" : "Inactive"}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Pickup Available</span>
                <Badge color={currentCity.pickupCity ? "info" : "secondary"}>
                  {currentCity.pickupCity ? "Yes" : "No"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Timestamps */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon icon="heroicons:clock" className="w-5 h-5" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900">Created</h4>
                <p className="text-sm text-gray-600">
                  {formatDate(currentCity.createdAt)}
                </p>
              </div>

              <div>
                <h4 className="font-medium text-gray-900">Last Updated</h4>
                <p className="text-sm text-gray-600">
                  {formatDate(currentCity.updatedAt)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Related Resources */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon icon="heroicons:link" className="w-5 h-5" />
                Related Resources
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link
                href={`/settings/cities?zone=${encodeURIComponent(
                  currentCity.zone
                )}`}
              >
                <Button
                  variant="ghost"
                  className="w-full justify-start text-sm"
                >
                  <Icon
                    icon="heroicons:building-office-2"
                    className="w-4 h-4 mr-2"
                  />
                  Other cities in {currentCity.zone}
                </Button>
              </Link>

              <Link href="/settings/tariffs">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-sm"
                >
                  <Icon
                    icon="heroicons:currency-dollar"
                    className="w-4 h-4 mr-2"
                  />
                  All Tariffs
                </Button>
              </Link>

              <Link href="/settings/zones">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-sm"
                >
                  <Icon
                    icon="heroicons:globe-americas"
                    className="w-4 h-4 mr-2"
                  />
                  Zone Management
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete City</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong>{currentCity.name}</strong>? This action cannot be undone
              and may affect related tariffs and operations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete City"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// Main component with protection
const CityDetailsPage = () => {
  return (
    <ProtectedRoute
      requiredPermissions={[SETTINGS_PERMISSIONS.READ_CITIES]}
      requiredAccessLevel="FULL"
      allowedAccountStatuses={["ACTIVE"]}
      requireValidation={true}
    >
      <CityDetailsPageContent />
    </ProtectedRoute>
  );
};

export default CityDetailsPage;
