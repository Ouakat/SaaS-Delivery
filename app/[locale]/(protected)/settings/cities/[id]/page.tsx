"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Link } from "@/i18n/routing";
import { ProtectedRoute } from "@/components/route/protected-route";
import { useAuthStore } from "@/lib/stores/auth/auth.store";
import { useCitiesStore } from "@/lib/stores/settings/cities.store";
import { cn } from "@/lib/utils/ui.utils";

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const ZoneBadge = ({ zone }: { zone: string }) => {
  const getZoneColor = (zone: string) => {
    switch (zone) {
      case "Zone A":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Zone B":
        return "bg-green-100 text-green-800 border-green-200";
      case "Zone C":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Zone D":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-sm font-medium border",
        getZoneColor(zone)
      )}
    >
      {zone}
    </span>
  );
};

const CityDetailsPageContent = () => {
  const router = useRouter();
  const params = useParams();
  const cityId = params?.id as string;

  const { hasPermission } = useAuthStore();
  const {
    currentCity,
    isLoading,
    error,
    fetchCityById,
    deleteCity,
    toggleCityStatus,
    clearError,
  } = useCitiesStore();

  const [deleteDialog, setDeleteDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Check permissions
  const canUpdateCities = hasPermission("cities:update");
  const canDeleteCities = hasPermission("cities:delete");

  // Fetch city data
  useEffect(() => {
    if (cityId) {
      fetchCityById(cityId);
    }
  }, [cityId, fetchCityById]);

  // Handle delete city
  const handleDeleteCity = async () => {
    if (!currentCity) return;

    setActionLoading(true);
    try {
      const success = await deleteCity(currentCity.id);
      if (success) {
        setDeleteDialog(false);
        router.push("/settings/cities");
      }
    } finally {
      setActionLoading(false);
    }
  };

  // Handle toggle status
  const handleToggleStatus = async () => {
    if (!currentCity) return;

    setActionLoading(true);
    try {
      await toggleCityStatus(currentCity.id);
      // Refresh the current city data
      fetchCityById(cityId);
    } finally {
      setActionLoading(false);
    }
  };

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
              <span>Loading city details...</span>
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
        <span className="text-foreground">{currentCity.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-default-900">
              {currentCity.name}
            </h1>
            <Badge color={currentCity.status ? "default" : "secondary"}>
              {currentCity.status ? "Active" : "Inactive"}
            </Badge>
            {currentCity.pickupCity && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Badge
                      color="primary"
                      className="bg-orange-50 text-orange-700 border-orange-200"
                    >
                      <Icon icon="heroicons:truck" className="w-3 h-3 mr-1" />
                      Pickup Location
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>This city can be used as a pickup origin</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <p className="text-default-600">
            City reference:{" "}
            <span className="font-mono font-medium">{currentCity.ref}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={actionLoading}>
                <Icon
                  icon="heroicons:ellipsis-horizontal"
                  className="w-4 h-4 mr-2"
                />
                Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>City Actions</DropdownMenuLabel>

              {canUpdateCities && (
                <DropdownMenuItem asChild>
                  <Link href={`/settings/cities/${currentCity.id}/edit`}>
                    <Icon icon="heroicons:pencil" className="mr-2 h-4 w-4" />
                    Edit City
                  </Link>
                </DropdownMenuItem>
              )}

              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(currentCity.id)}
              >
                <Icon icon="heroicons:clipboard" className="mr-2 h-4 w-4" />
                Copy City ID
              </DropdownMenuItem>

              {canUpdateCities && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleToggleStatus}>
                    <Icon
                      icon={
                        currentCity.status
                          ? "heroicons:pause"
                          : "heroicons:play"
                      }
                      className="mr-2 h-4 w-4"
                    />
                    {currentCity.status ? "Deactivate" : "Activate"} City
                  </DropdownMenuItem>
                </>
              )}

              {canDeleteCities && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-600"
                    onClick={() => setDeleteDialog(true)}
                  >
                    <Icon icon="heroicons:trash" className="mr-2 h-4 w-4" />
                    Delete City
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Link href="/settings/cities">
            <Button variant="outline">
              <Icon icon="heroicons:arrow-left" className="w-4 h-4 mr-2" />
              Back to Cities
            </Button>
          </Link>
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
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-default-900">City Name</h4>
                  <p className="text-default-600">{currentCity.name}</p>
                </div>
                <div>
                  <h4 className="font-medium text-default-900">
                    Reference Code
                  </h4>
                  <p className="text-default-600 font-mono">
                    {currentCity.ref}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-default-900">Zone</h4>
                  <div className="mt-1">
                    <ZoneBadge zone={currentCity.zone} />
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-default-900">Status</h4>
                  <div className="mt-1">
                    <Badge color={currentCity.status ? "default" : "secondary"}>
                      {currentCity.status ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-default-900">
                      Pickup Location
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      {currentCity.pickupCity ? (
                        <Badge
                          color="primary"
                          className="bg-green-50 text-green-700 border-green-200"
                        >
                          <Icon
                            icon="heroicons:check-circle"
                            className="w-3 h-3 mr-1"
                          />
                          Enabled
                        </Badge>
                      ) : (
                        <Badge
                          color="primary"
                          className="bg-gray-50 text-gray-600 border-gray-200"
                        >
                          <Icon
                            icon="heroicons:x-circle"
                            className="w-3 h-3 mr-1"
                          />
                          Disabled
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {currentCity.pickupCity
                        ? "Can be used as pickup origin for parcels"
                        : "Cannot be used as pickup origin"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon icon="heroicons:chart-bar" className="w-5 h-5" />
                Usage Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-2">
                    <Icon
                      icon="heroicons:arrow-up"
                      className="h-6 w-6 text-blue-500"
                    />
                  </div>
                  <p className="text-2xl font-bold">
                    {currentCity._count?.pickupTariffs || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Pickup Tariffs
                  </p>
                </div>
                <div className="text-center">
                  <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-2">
                    <Icon
                      icon="heroicons:arrow-down"
                      className="h-6 w-6 text-green-500"
                    />
                  </div>
                  <p className="text-2xl font-bold">
                    {currentCity._count?.destinationTariffs || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Destination Tariffs
                  </p>
                </div>
                <div className="text-center">
                  <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-2">
                    <Icon
                      icon="heroicons:map"
                      className="h-6 w-6 text-purple-500"
                    />
                  </div>
                  <p className="text-2xl font-bold">
                    {currentCity._count?.zones || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Zone Associations
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon icon="heroicons:cog-6-tooth" className="w-5 h-5" />
                Status & Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-default-900">Current Status</h4>
                <div className="mt-2">
                  <Badge
                    color={currentCity.status ? "default" : "secondary"}
                    className="w-full justify-center"
                  >
                    <Icon
                      icon={
                        currentCity.status
                          ? "heroicons:check-circle"
                          : "heroicons:pause-circle"
                      }
                      className="w-3 h-3 mr-1"
                    />
                    {currentCity.status ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {currentCity.status
                    ? "Available for new parcel creation"
                    : "Not available for new parcels"}
                </p>
              </div>

              <div>
                <h4 className="font-medium text-default-900">
                  Pickup Capability
                </h4>
                <div className="mt-2">
                  <Badge
                    color={currentCity.pickupCity ? "default" : "secondary"}
                    className={cn("w-full justify-center", {
                      "bg-orange-50 text-orange-700 border-orange-200":
                        currentCity.pickupCity,
                    })}
                  >
                    <Icon
                      icon={
                        currentCity.pickupCity
                          ? "heroicons:truck"
                          : "heroicons:x-circle"
                      }
                      className="w-3 h-3 mr-1"
                    />
                    {currentCity.pickupCity
                      ? "Pickup Enabled"
                      : "Pickup Disabled"}
                  </Badge>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-default-900">
                  Zone Assignment
                </h4>
                <div className="mt-2">
                  <ZoneBadge zone={currentCity.zone} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timestamps */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon icon="heroicons:calendar" className="w-5 h-5" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-default-900">Created</h4>
                <p className="text-sm text-default-600">
                  {formatDate(currentCity.createdAt)}
                </p>
                {currentCity.createdBy && (
                  <p className="text-xs text-muted-foreground">by Admin User</p>
                )}
              </div>

              <div>
                <h4 className="font-medium text-default-900">Last Updated</h4>
                <p className="text-sm text-default-600">
                  {formatDate(currentCity.updatedAt)}
                </p>
                {currentCity.updatedBy && (
                  <p className="text-xs text-muted-foreground">by Admin User</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon icon="heroicons:bolt" className="w-5 h-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {canUpdateCities && (
                <Link
                  href={`/settings/cities/${currentCity.id}/edit`}
                  className="block"
                >
                  <Button className="w-full" variant="outline">
                    <Icon icon="heroicons:pencil" className="w-4 h-4 mr-2" />
                    Edit City
                  </Button>
                </Link>
              )}

              <Button
                className="w-full"
                variant="outline"
                onClick={() => navigator.clipboard.writeText(currentCity.ref)}
              >
                <Icon icon="heroicons:clipboard" className="w-4 h-4 mr-2" />
                Copy Reference
              </Button>

              <Link href="/settings/tariffs" className="block">
                <Button className="w-full" variant="outline">
                  <Icon
                    icon="heroicons:currency-dollar"
                    className="w-4 h-4 mr-2"
                  />
                  View Tariffs
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete City</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong>{currentCity.name}</strong>? This action cannot be undone
              and will permanently remove the city and all associated tariffs.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCity}
              disabled={actionLoading}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {actionLoading && (
                <Icon
                  icon="heroicons:arrow-path"
                  className="mr-2 h-4 w-4 animate-spin"
                />
              )}
              Delete City
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// Main page component with protection
export default function CityDetailsPage() {
  return (
    <ProtectedRoute
      requiredPermissions={["cities:read"]}
      requiredAccessLevel="LIMITED"
    >
      <CityDetailsPageContent />
    </ProtectedRoute>
  );
}
