"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { useZonesStore } from "@/lib/stores/settings/zones.store";
import { useAuthStore } from "@/lib/stores/auth/auth.store";
import { ProtectedRoute } from "@/components/route/protected-route";
import { SETTINGS_PERMISSIONS } from "@/lib/constants/settings";
import { toast } from "sonner";

const ZoneViewPageContent = () => {
  const router = useRouter();
  const params = useParams();
  const zoneId = params?.id as string;

  const { hasPermission } = useAuthStore();
  const { currentZone, loading, fetchZoneById, deleteZone, toggleZoneStatus } =
    useZonesStore();

  // Permission checks
  const canUpdateZones = hasPermission(SETTINGS_PERMISSIONS.UPDATE_ZONE);
  const canDeleteZones = hasPermission(SETTINGS_PERMISSIONS.DELETE_ZONE);

  // Local state
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch zone data
  useEffect(() => {
    if (zoneId) {
      fetchZoneById(zoneId);
    }
  }, [zoneId, fetchZoneById]);

  // Handle delete zone
  const handleDeleteZone = async () => {
    if (!currentZone) return;

    setActionLoading(true);
    try {
      const success = await deleteZone(currentZone.id);
      if (success) {
        router.push("/settings/zones");
      }
    } catch (error) {
      console.error("Failed to delete zone:", error);
    } finally {
      setActionLoading(false);
      setDeleteDialog(false);
    }
  };

  // Handle toggle status
  const handleToggleStatus = async () => {
    if (!currentZone) return;

    setActionLoading(true);
    try {
      await toggleZoneStatus(currentZone.id);
    } catch (error) {
      console.error("Failed to toggle zone status:", error);
    } finally {
      setActionLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
              </CardHeader>
              <CardContent className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-4 bg-gray-200 rounded animate-pulse"
                  ></div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
              </CardHeader>
              <CardContent className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-4 bg-gray-200 rounded animate-pulse"
                  ></div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
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
                  The zone you're looking for doesn't exist or has been deleted.
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
              {currentZone.name}
            </h1>
            <Badge color={currentZone.status ? "success" : "secondary"}>
              {currentZone.status ? "Active" : "Inactive"}
            </Badge>
          </div>
          <p className="text-default-600">Zone details and assigned cities</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button disabled={actionLoading}>
                <Icon
                  icon="heroicons:ellipsis-horizontal"
                  className="w-4 h-4 mr-2"
                />
                Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canUpdateZones && (
                <>
                  <DropdownMenuItem asChild>
                    <Link href={`/settings/zones/${currentZone.id}/edit`}>
                      <Icon
                        icon="heroicons:pencil-square"
                        className="mr-2 h-4 w-4"
                      />
                      Edit Zone
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={handleToggleStatus}>
                    <Icon
                      icon={
                        currentZone.status
                          ? "heroicons:pause"
                          : "heroicons:play"
                      }
                      className="mr-2 h-4 w-4"
                    />
                    {currentZone.status ? "Deactivate" : "Activate"} Zone
                  </DropdownMenuItem>
                </>
              )}

              {canDeleteZones && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-600"
                    onClick={() => setDeleteDialog(true)}
                  >
                    <Icon icon="heroicons:trash" className="mr-2 h-4 w-4" />
                    Delete Zone
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Link href="/settings/zones">
            <Button variant="outline">
              <Icon icon="heroicons:arrow-left" className="w-4 h-4 mr-2" />
              Back to Zones
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Zone Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon icon="heroicons:information-circle" className="w-5 h-5" />
                Zone Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-default-900">Zone Name</h4>
                  <p className="text-default-600">{currentZone.name}</p>
                </div>

                <div>
                  <h4 className="font-medium text-default-900">Status</h4>
                  <div className="flex items-center gap-2">
                    <Badge color={currentZone.status ? "success" : "secondary"}>
                      <Icon
                        icon={
                          currentZone.status
                            ? "heroicons:check-circle"
                            : "heroicons:pause-circle"
                        }
                        className="w-3 h-3 mr-1"
                      />
                      {currentZone.status ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-default-900">Cities Count</h4>
                  <p className="text-default-600">
                    {currentZone._count?.cities ||
                      currentZone.cities?.length ||
                      0}{" "}
                    cities
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-default-900">Zone ID</h4>
                  <p className="text-default-600 font-mono text-sm">
                    {currentZone.id}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assigned Cities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon icon="heroicons:map-pin" className="w-5 h-5" />
                Assigned Cities
                {currentZone.cities && currentZone.cities.length > 0 && (
                  <Badge color="secondary">{currentZone.cities.length}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentZone.cities && currentZone.cities.length > 0 ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {currentZone.cities.map((city) => (
                      <div
                        key={city.id}
                        className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50"
                      >
                        <Avatar size="sm">
                          <AvatarFallback className="text-xs">
                            {city.ref ||
                              city.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{city.name}</span>
                            {city.ref && (
                              <Badge color="secondary" className="text-xs">
                                {city.ref}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Icon
                    icon="heroicons:map-pin"
                    className="w-12 h-12 text-gray-400 mx-auto mb-3"
                  />
                  <h3 className="font-medium text-default-900 mb-1">
                    No Cities Assigned
                  </h3>
                  <p className="text-default-600 text-sm mb-4">
                    This zone doesn't have any cities assigned to it yet.
                  </p>
                  {canUpdateZones && (
                    <Link href={`/settings/zones/${currentZone.id}/edit`}>
                      <Button size="sm">
                        <Icon icon="heroicons:plus" className="w-4 h-4 mr-2" />
                        Assign Cities
                      </Button>
                    </Link>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon icon="heroicons:chart-bar" className="w-5 h-5" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-default-600">
                    Cities Assigned
                  </span>
                  <Badge color="secondary">
                    {currentZone._count?.cities ||
                      currentZone.cities?.length ||
                      0}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-default-600">Zone Status</span>
                  <Badge color={currentZone.status ? "success" : "secondary"}>
                    {currentZone.status ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon icon="heroicons:clock" className="w-5 h-5" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-default-900">Created</h4>
                  <p className="text-sm text-default-600">
                    {formatDate(currentZone.createdAt)}
                  </p>
                  {currentZone.createdBy && (
                    <p className="text-xs text-default-500">
                      by {currentZone.createdBy}
                    </p>
                  )}
                </div>

                <div>
                  <h4 className="font-medium text-default-900">Last Updated</h4>
                  <p className="text-sm text-default-600">
                    {formatDate(currentZone.updatedAt)}
                  </p>
                  {currentZone.updatedBy && (
                    <p className="text-xs text-default-500">
                      by {currentZone.updatedBy}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon icon="heroicons:cog-6-tooth" className="w-5 h-5" />
                Zone Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {canUpdateZones && (
                <>
                  <Link
                    href={`/settings/zones/${currentZone.id}/edit`}
                    className="block"
                  >
                    <Button variant="outline" className="w-full justify-start">
                      <Icon
                        icon="heroicons:pencil-square"
                        className="w-4 h-4 mr-2"
                      />
                      Edit Zone Details
                    </Button>
                  </Link>

                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={handleToggleStatus}
                    disabled={actionLoading}
                  >
                    <Icon
                      icon={
                        currentZone.status
                          ? "heroicons:pause"
                          : "heroicons:play"
                      }
                      className="w-4 h-4 mr-2"
                    />
                    {currentZone.status ? "Deactivate" : "Activate"} Zone
                  </Button>
                </>
              )}

              <Link href="/settings/zones" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Icon icon="heroicons:list-bullet" className="w-4 h-4 mr-2" />
                  View All Zones
                </Button>
              </Link>

              {canDeleteZones && (
                <Button
                  variant="outline"
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => setDeleteDialog(true)}
                  disabled={actionLoading}
                >
                  <Icon icon="heroicons:trash" className="w-4 h-4 mr-2" />
                  Delete Zone
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Zone Usage Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon icon="heroicons:information-circle" className="w-5 h-5" />
                Zone Usage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-default-600">
                <div className="flex items-center gap-2">
                  <Icon icon="heroicons:truck" className="w-4 h-4" />
                  <span>Used in delivery tariffs</span>
                </div>
                <div className="flex items-center gap-2">
                  <Icon icon="heroicons:map" className="w-4 h-4" />
                  <span>Geographic organization</span>
                </div>
                <div className="flex items-center gap-2">
                  <Icon icon="heroicons:chart-bar" className="w-4 h-4" />
                  <span>Analytics and reporting</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Zone</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong>{currentZone.name}</strong>? This action cannot be undone
              and will permanently remove the zone and all its associations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteZone}
              disabled={actionLoading}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {actionLoading && (
                <Icon
                  icon="heroicons:arrow-path"
                  className="mr-2 h-4 w-4 animate-spin"
                />
              )}
              Delete Zone
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// Main component wrapped with ProtectedRoute
const ZoneViewPage = () => {
  return (
    <ProtectedRoute
      requiredPermissions={[SETTINGS_PERMISSIONS.READ_ZONES]}
      requiredAccessLevel="FULL"
      allowedAccountStatuses={["ACTIVE"]}
      requireValidation={true}
    >
      <ZoneViewPageContent />
    </ProtectedRoute>
  );
};

export default ZoneViewPage;
