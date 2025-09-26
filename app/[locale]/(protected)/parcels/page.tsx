"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/routing";
import ParcelsTable from "@/components/parcels/parcels-table";
import { useAuthStore } from "@/lib/stores/auth/auth.store";
import { useParcelsStore } from "@/lib/stores/parcels/parcels.store";
import { ProtectedRoute } from "@/components/route/protected-route";
import { PARCELS_PERMISSIONS } from "@/lib/constants/parcels";

const ParcelsPageContent = () => {
  const { hasPermission, user, hasAnyPermission } = useAuthStore();
  const { statistics, fetchStatistics } = useParcelsStore();

  // Check individual permissions
  const canViewParcels = hasPermission(PARCELS_PERMISSIONS.PARCELS_READ);
  const canCreateParcels = hasPermission(PARCELS_PERMISSIONS.PARCELS_CREATE);
  const canUpdateParcels = hasPermission(PARCELS_PERMISSIONS.PARCELS_UPDATE);
  const canDeleteParcels = hasPermission(PARCELS_PERMISSIONS.PARCELS_DELETE);
  const canManageParcels = hasPermission(PARCELS_PERMISSIONS.PARCELS_MANAGE);
  const canViewAnalytics = hasPermission(PARCELS_PERMISSIONS.PARCELS_READ);

  // Check if user has any parcel management permissions
  const hasAnyParcelPermissions = hasAnyPermission([
    PARCELS_PERMISSIONS.PARCELS_READ,
    PARCELS_PERMISSIONS.PARCELS_CREATE,
    PARCELS_PERMISSIONS.PARCELS_UPDATE,
    PARCELS_PERMISSIONS.PARCELS_DELETE,
    PARCELS_PERMISSIONS.PARCELS_MANAGE,
    PARCELS_PERMISSIONS.PARCELS_READ,
  ]);

  // Define permission-based features
  const availableFeatures = [
    {
      id: "view",
      label: "View Parcels",
      enabled: canViewParcels,
      icon: "heroicons:eye",
      description: "Browse and search parcels",
    },
    {
      id: "create",
      label: "Create Parcels",
      enabled: canCreateParcels,
      icon: "heroicons:plus",
      description: "Add new parcels to the system",
    },
    {
      id: "update",
      label: "Edit Parcels",
      enabled: canUpdateParcels,
      icon: "heroicons:pencil",
      description: "Modify parcel information",
    },
    {
      id: "delete",
      label: "Delete Parcels",
      enabled: canDeleteParcels,
      icon: "heroicons:trash",
      description: "Remove parcels from the system",
    },
    {
      id: "manage",
      label: "Manage Parcels",
      enabled: canManageParcels,
      icon: "heroicons:cog-6-tooth",
      description: "Advanced parcel management",
    },
    {
      id: "analytics",
      label: "View Analytics",
      enabled: canViewAnalytics,
      icon: "heroicons:chart-bar",
      description: "Access parcel analytics and reports",
    },
  ];

  const enabledFeatures = availableFeatures.filter(
    (feature) => feature.enabled
  );
  const disabledFeatures = availableFeatures.filter(
    (feature) => !feature.enabled
  );

  // Fetch statistics on component mount
  React.useEffect(() => {
    if (canViewAnalytics) {
      fetchStatistics();
    }
  }, [canViewAnalytics, fetchStatistics]);

  // Show error if user has no permissions at all
  if (!hasAnyParcelPermissions) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-default-900">
              Parcels Management
            </h1>
            <p className="text-default-600">
              Manage your parcels, deliveries, and shipments
            </p>
          </div>
        </div>

        <Alert color="destructive">
          <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <div className="font-medium">Access Denied</div>
              <div>
                You don't have permission to access parcel management features.
                Please contact your administrator to request access.
              </div>
              <div className="text-sm">
                <strong>Your user type:</strong> {user?.userType || "Unknown"}
              </div>
            </div>
          </AlertDescription>
        </Alert>

        {/* Contact Support Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon icon="heroicons:question-mark-circle" className="w-5 h-5" />
              Need Access?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              If you believe you should have access to parcel management
              features, please contact your system administrator or support
              team.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="md">
                <Icon
                  icon="heroicons:chat-bubble-left-right"
                  className="w-4 h-4 mr-2"
                />
                Contact Support
              </Button>
              <Link href="/dashboard">
                <Button variant="outline" size="md">
                  <Icon icon="heroicons:home" className="w-4 h-4 mr-2" />
                  Return to Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-default-900">
            Parcels Management
          </h1>
          <p className="text-default-600">
            Manage your parcels, deliveries, and shipments
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canViewAnalytics && (
            <Link href="/parcels/analytics">
              <Button variant="outline" size="md">
                <Icon icon="heroicons:chart-bar" className="w-4 h-4 mr-2" />
                Analytics
              </Button>
            </Link>
          )}

          {canCreateParcels && (
            <Link href="/parcels/create">
              <Button>
                <Icon icon="heroicons:plus" className="w-4 h-4 mr-2" />
                Create Parcel
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      {canViewAnalytics && statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Parcels
              </CardTitle>
              <Icon
                icon="heroicons:cube"
                className="h-4 w-4 text-muted-foreground"
              />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statistics.totalParcels}
              </div>
              <p className="text-xs text-muted-foreground">
                All time parcels created
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Revenue
              </CardTitle>
              <Icon
                icon="heroicons:currency-dollar"
                className="h-4 w-4 text-muted-foreground"
              />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statistics.totalRevenue.toFixed(2)} DH
              </div>
              <p className="text-xs text-muted-foreground">
                Total parcel value
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Delivery Success
              </CardTitle>
              <Icon
                icon="heroicons:check-circle"
                className="h-4 w-4 text-muted-foreground"
              />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statistics.deliverySuccessRate.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Successful deliveries
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Avg. Delivery Time
              </CardTitle>
              <Icon
                icon="heroicons:clock"
                className="h-4 w-4 text-muted-foreground"
              />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statistics.averageDeliveryTime.toFixed(1)} days
              </div>
              <p className="text-xs text-muted-foreground">
                Average time to deliver
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Permissions Overview */}
      {process.env.NODE_ENV === "development" && (
        <Alert color="info" variant="soft">
          <Icon icon="heroicons:information-circle" className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <div className="font-medium">
                Development Info - Your Permissions
              </div>
              <div className="flex flex-wrap gap-1">
                {enabledFeatures.map((feature) => (
                  <Badge key={feature.id} color="info" className="text-xs">
                    <Icon icon={feature.icon} className="w-3 h-3 mr-1" />
                    {feature.label}
                  </Badge>
                ))}
                {disabledFeatures.map((feature) => (
                  <Badge
                    key={feature.id}
                    color="secondary"
                    className="text-xs opacity-50"
                  >
                    <Icon icon={feature.icon} className="w-3 h-3 mr-1" />
                    {feature.label}
                  </Badge>
                ))}
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Limited Access Warning */}
      {hasAnyParcelPermissions &&
        (!canViewParcels || enabledFeatures.length < 3) && (
          <Alert color="warning" variant="soft">
            <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <div className="font-medium">Limited Access</div>
                <div className="text-sm">
                  You have restricted access to parcel management features. Some
                  actions may not be available.
                </div>
                <div className="text-xs mt-2">
                  <strong>Available:</strong>{" "}
                  {enabledFeatures.map((f) => f.label).join(", ")}
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {canCreateParcels && (
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <Link href="/parcels/create">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon
                    icon="heroicons:plus-circle"
                    className="w-5 h-5 text-blue-600"
                  />
                  Create New Parcel
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Create a new delivery parcel with automatic pricing
                </p>
              </CardContent>
            </Link>
          </Card>
        )}

        {canViewParcels && (
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <Link href="/parcels?status=NEW_PACKAGE">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon
                    icon="heroicons:clock"
                    className="w-5 h-5 text-yellow-600"
                  />
                  Pickup Ready
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  View parcels ready for collection
                </p>
              </CardContent>
            </Link>
          </Card>
        )}

        {canViewParcels && (
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <Link href="/parcels?status=OUT_FOR_DELIVERY">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon
                    icon="heroicons:truck"
                    className="w-5 h-5 text-orange-600"
                  />
                  Out for Delivery
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Track parcels currently being delivered
                </p>
              </CardContent>
            </Link>
          </Card>
        )}
      </div>

      {/* Parcels Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>All Parcels</span>
            {canViewParcels && (
              <Badge color="secondary" className="text-xs">
                <Icon icon="heroicons:eye" className="w-3 h-3 mr-1" />
                View Access
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {canViewParcels ? (
            <ParcelsTable isAdminView={true} />
          ) : (
            <div className="p-8 text-center">
              <div className="space-y-4">
                <Icon
                  icon="heroicons:lock-closed"
                  className="w-12 h-12 text-muted-foreground mx-auto"
                />
                <div>
                  <h3 className="font-medium text-default-900">
                    No View Permission
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    You don't have permission to view the parcels list.
                  </p>
                </div>
                {canCreateParcels && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-3">
                      You can still create new parcels:
                    </p>
                    <Link href="/parcels/create">
                      <Button size="md">
                        <Icon icon="heroicons:plus" className="w-4 h-4 mr-2" />
                        Create Parcel
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Main component wrapped with ProtectedRoute
const ParcelsPage = () => {
  return (
    <ProtectedRoute
      requiredPermissions={[PARCELS_PERMISSIONS.PARCELS_READ]}
      requiredAccessLevel="LIMITED"
      allowedAccountStatuses={["ACTIVE"]}
    >
      <ParcelsPageContent />
    </ProtectedRoute>
  );
};

export default ParcelsPage;
