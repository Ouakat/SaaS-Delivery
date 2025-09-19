// app/[locale]/(protected)/settings/pickup-cities/[id]/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "@/i18n/routing";
import { usePickupCitiesStore } from "@/lib/stores/settings/pickup-cities.store";
import { useAuthStore } from "@/lib/stores/auth/auth.store";
import { ProtectedRoute } from "@/components/route/protected-route";
import { SETTINGS_PERMISSIONS } from "@/lib/constants/settings";
import type { PickupCity } from "@/lib/types/settings/pickup-cities.types";
import { color } from "../../../../../../lib/types/ui/template";

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const ViewPickupCityPageContent = () => {
  const params = useParams();
  const router = useRouter();
  const pickupCityId = params?.id as string;
  const { hasPermission } = useAuthStore();

  const {
    selectedPickupCity,
    isLoading,
    error,
    fetchPickupCityById,
    deletePickupCity,
    togglePickupCityStatus,
    isDeleting,
  } = usePickupCitiesStore();

  const [deleteDialog, setDeleteDialog] = useState(false);

  // Permissions
  const canUpdate = hasPermission(SETTINGS_PERMISSIONS.UPDATE_PICKUP_CITY);
  const canDelete = hasPermission(SETTINGS_PERMISSIONS.DELETE_PICKUP_CITY);

  // Fetch pickup city data
  useEffect(() => {
    if (pickupCityId) {
      fetchPickupCityById(pickupCityId);
    }
  }, [pickupCityId, fetchPickupCityById]);

  const handleDelete = async () => {
    if (!selectedPickupCity) return;

    const success = await deletePickupCity(selectedPickupCity.id);
    if (success) {
      router.push("/settings/pickup-cities");
    }
    setDeleteDialog(false);
  };

  const handleToggleStatus = async () => {
    if (!selectedPickupCity) return;
    await togglePickupCityStatus(selectedPickupCity.id);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="w-64 h-8 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="w-48 h-4 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="w-32 h-10 bg-gray-200 rounded animate-pulse" />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="w-32 h-5 bg-gray-200 rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="w-full h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="w-3/4 h-4 bg-gray-200 rounded animate-pulse" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !selectedPickupCity) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-default-900">
              Pickup City Not Found
            </h1>
          </div>
          <Link href="/settings/pickup-cities">
            <Button variant="outline">
              <Icon icon="heroicons:arrow-left" className="w-4 h-4 mr-2" />
              Back to Pickup Cities
            </Button>
          </Link>
        </div>

        <Alert color="destructive">
          <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
          <AlertDescription>
            {error || "The requested pickup city could not be found."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const pickupCity = selectedPickupCity;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-default-900 flex items-center gap-3">
            {pickupCity.name}
            <Badge color={pickupCity.status ? "success" : "secondary"}>
              <Icon
                icon={
                  pickupCity.status
                    ? "heroicons:check-circle"
                    : "heroicons:x-circle"
                }
                className="w-3 h-3 mr-1"
              />
              {pickupCity.status ? "Active" : "Inactive"}
            </Badge>
          </h1>
          <p className="text-default-600">
            Pickup City Details • Reference: {pickupCity.ref}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <Icon icon="heroicons:cog-6-tooth" className="w-4 h-4 mr-2" />
                Actions
                <Icon icon="heroicons:chevron-down" className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canUpdate && (
                <>
                  <DropdownMenuItem asChild>
                    <Link
                      href={`/settings/pickup-cities/${pickupCity.id}/edit`}
                    >
                      <Icon
                        icon="heroicons:pencil-square"
                        className="h-4 w-4 mr-2"
                      />
                      Edit Pickup City
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem onClick={handleToggleStatus}>
                    <Icon
                      icon={
                        pickupCity.status
                          ? "heroicons:x-circle"
                          : "heroicons:check-circle"
                      }
                      className="h-4 w-4 mr-2"
                    />
                    {pickupCity.status ? "Deactivate" : "Activate"}
                  </DropdownMenuItem>
                </>
              )}

              {canDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setDeleteDialog(true)}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Icon icon="heroicons:trash" className="h-4 w-4 mr-2" />
                    Delete Pickup City
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Link href="/settings/pickup-cities">
            <Button variant="outline">
              <Icon icon="heroicons:arrow-left" className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>
      </div>

      {/* Breadcrumb */}
      <nav className="flex" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-4">
          <li>
            <Link
              href="/settings"
              className="text-default-600 hover:text-default-900"
            >
              Settings
            </Link>
          </li>
          <li>
            <Icon
              icon="heroicons:chevron-right"
              className="w-4 h-4 text-default-400"
            />
          </li>
          <li>
            <Link
              href="/settings/pickup-cities"
              className="text-default-600 hover:text-default-900"
            >
              Pickup Cities
            </Link>
          </li>
          <li>
            <Icon
              icon="heroicons:chevron-right"
              className="w-4 h-4 text-default-400"
            />
          </li>
          <li>
            <span className="text-default-900 font-medium">
              {pickupCity.name}
            </span>
          </li>
        </ol>
      </nav>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon icon="heroicons:information-circle" className="w-5 h-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <span className="text-sm font-medium text-gray-600">
                Reference Code
              </span>
              <p className="font-mono text-lg">{pickupCity.ref}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Name</span>
              <p className="text-lg">{pickupCity.name}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Status</span>
              <div className="flex items-center gap-2 mt-1">
                <Badge color={pickupCity.status ? "success" : "secondary"}>
                  <Icon
                    icon={
                      pickupCity.status
                        ? "heroicons:check-circle"
                        : "heroicons:x-circle"
                    }
                    className="w-3 h-3 mr-1"
                  />
                  {pickupCity.status ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon icon="heroicons:chart-bar" className="w-5 h-5" />
              Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <span className="text-sm font-medium text-gray-600">
                Associated Tariffs
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-bold">
                  {pickupCity._count?.tariffs || 0}
                </span>
                {pickupCity._count?.tariffs === 0 && (
                  <Badge color="warning" className="text-xs">
                    <Icon
                      icon="heroicons:exclamation-triangle"
                      className="w-3 h-3 mr-1"
                    />
                    No tariffs
                  </Badge>
                )}
              </div>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">ID</span>
              <p className="font-mono text-sm text-gray-500">{pickupCity.id}</p>
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
              <span className="text-sm font-medium text-gray-600">Created</span>
              <p className="text-sm">{formatDate(pickupCity.createdAt)}</p>
              {pickupCity.createdBy && (
                <p className="text-xs text-gray-500">
                  by {pickupCity.createdBy}
                </p>
              )}
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">
                Last Updated
              </span>
              <p className="text-sm">{formatDate(pickupCity.updatedAt)}</p>
              {pickupCity.updatedBy && (
                <p className="text-xs text-gray-500">
                  by {pickupCity.updatedBy}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actions Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon icon="heroicons:wrench-screwdriver" className="w-5 h-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {canUpdate && (
              <>
                <Link
                  href={`/settings/pickup-cities/${pickupCity.id}/edit`}
                  className="block"
                >
                  <Button variant="outline" className="w-full justify-start">
                    <Icon
                      icon="heroicons:pencil-square"
                      className="w-4 h-4 mr-2"
                    />
                    Edit Pickup City
                  </Button>
                </Link>

                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleToggleStatus}
                >
                  <Icon
                    icon={
                      pickupCity.status
                        ? "heroicons:x-circle"
                        : "heroicons:check-circle"
                    }
                    className="w-4 h-4 mr-2"
                  />
                  {pickupCity.status ? "Deactivate" : "Activate"}
                </Button>
              </>
            )}

            <Link
              href={`/settings/tariffs?pickupCityId=${pickupCity.id}`}
              className="block"
            >
              <Button variant="outline" className="w-full justify-start">
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Pickup City</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{pickupCity.name}"? This action
              cannot be undone. Any associated tariffs will also be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Icon
                  icon="heroicons:arrow-path"
                  className="w-4 h-4 mr-2 animate-spin"
                />
              ) : (
                <Icon icon="heroicons:trash" className="w-4 h-4 mr-2" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// Main component with protection
const ViewPickupCityPage = () => {
  return (
    <ProtectedRoute
      requiredPermissions={[SETTINGS_PERMISSIONS.READ_PICKUP_CITIES]}
      requiredAccessLevel="FULL"
      allowedAccountStatuses={["ACTIVE"]}
      requireValidation={true}
    >
      <ViewPickupCityPageContent />
    </ProtectedRoute>
  );
};

export default ViewPickupCityPage;
