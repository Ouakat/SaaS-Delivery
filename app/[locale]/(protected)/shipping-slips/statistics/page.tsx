"use client";

import React, { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "@/i18n/routing";
import { useShippingSlipsStore } from "@/lib/stores/parcels/shipping-slips.store";
import { useAuthStore } from "@/lib/stores/auth/auth.store";
import { ProtectedRoute } from "@/components/route/protected-route";
import { PARCELS_PERMISSIONS } from "@/lib/constants/parcels";

const ShippingSlipsStatsPageContent = () => {
  const { hasPermission, user } = useAuthStore();
  const { statistics, fetchStatistics, isLoading, error } =
    useShippingSlipsStore();

  const canReadStats = hasPermission(PARCELS_PERMISSIONS.SHIPPING_SLIPS_READ);

  useEffect(() => {
    if (canReadStats && user?.userType !== "SELLER") {
      fetchStatistics();
    }
  }, [canReadStats, user?.userType, fetchStatistics]);

  if (!canReadStats) {
    return (
      <div className="container mx-auto py-8">
        <Alert color="destructive">
          <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to view shipping slip statistics.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (user?.userType === "SELLER") {
    return (
      <div className="container mx-auto py-8">
        <Alert color="warning">
          <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
          <AlertDescription>
            Statistics are only available for administrators.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

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
              <span>Loading statistics...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!statistics || error) {
    return (
      <div className="container mx-auto py-8">
        <Alert color="destructive">
          <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
          <AlertDescription>
            {error || "Failed to load shipping slip statistics."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const completionRate =
    statistics.total > 0
      ? Math.round((statistics.completed / statistics.total) * 100)
      : 0;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-default-900">
            Shipping Slip Statistics
          </h1>
          <p className="text-default-600">
            Comprehensive analytics and insights for inter-zone transfers
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => fetchStatistics()}>
            <Icon icon="heroicons:arrow-path" className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Link href="/shipping-slips">
            <Button variant="outline">
              <Icon icon="heroicons:arrow-left" className="w-4 h-4 mr-2" />
              Back to List
            </Button>
          </Link>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Slips */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Slips</CardTitle>
            <Icon
              icon="heroicons:truck"
              className="h-4 w-4 text-muted-foreground"
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.total}</div>
            <div className="text-xs text-muted-foreground mt-1">
              All shipping slips created
            </div>
          </CardContent>
        </Card>

        {/* Pending */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Icon
              icon="heroicons:clock"
              className="h-4 w-4 text-muted-foreground"
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {statistics.pending}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Awaiting shipment
            </div>
          </CardContent>
        </Card>

        {/* In Transit */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Transit</CardTitle>
            <Icon
              icon="heroicons:arrow-path"
              className="h-4 w-4 text-muted-foreground"
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {statistics.inTransit}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Currently shipping
            </div>
          </CardContent>
        </Card>

        {/* Completed */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Icon
              icon="heroicons:check-circle"
              className="h-4 w-4 text-muted-foreground"
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {statistics.completed}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Successfully received
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Stats */}
        <div className="lg:col-span-2 space-y-6">
          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon icon="heroicons:chart-bar" className="w-5 h-5" />
                Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Completion Rate */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Completion Rate</span>
                  <Badge color="primary">{completionRate}%</Badge>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
                <div className="text-xs text-muted-foreground">
                  {statistics.completed} of {statistics.total} slips completed
                </div>
              </div>

              {/* Package Statistics */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <div className="text-2xl font-bold">
                    {statistics.packagesShippedThisMonth}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Packages this month
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {statistics.averagePackagesPerSlip}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Average per slip
                  </div>
                </div>
              </div>

              {/* Status Breakdown */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <span className="text-sm font-medium">Pending</span>
                  <span className="text-lg font-bold text-yellow-600">
                    {statistics.pending}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm font-medium">In Transit</span>
                  <span className="text-lg font-bold text-blue-600">
                    {statistics.inTransit}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <span className="text-sm font-medium">Completed</span>
                  <span className="text-lg font-bold text-green-600">
                    {statistics.completed}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <span className="text-sm font-medium">Cancelled</span>
                  <span className="text-lg font-bold text-red-600">
                    {statistics.cancelled}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Destination Zones */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon icon="heroicons:map-pin" className="w-5 h-5" />
                Top Destination Zones
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statistics.topDestinationZones.length === 0 ? (
                <div className="text-center py-8">
                  <Icon
                    icon="heroicons:inbox"
                    className="w-12 h-12 text-muted-foreground mx-auto mb-4"
                  />
                  <p className="text-muted-foreground">
                    No shipping data available yet
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {statistics.topDestinationZones.map((zone, index) => (
                    <div
                      key={zone.zoneId}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Badge color="primary" className="text-xs">
                          #{index + 1}
                        </Badge>
                        <div>
                          <div className="font-medium">{zone.zoneName}</div>
                          <div className="text-xs text-muted-foreground">
                            {zone.count} shipping slips
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {zone.percentage.toFixed(1)}%
                          </div>
                          <div className="text-xs text-muted-foreground">
                            of total
                          </div>
                        </div>
                        <div className="w-24">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full"
                              style={{ width: `${zone.percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon
                  icon="heroicons:clipboard-document-list"
                  className="w-5 h-5"
                />
                Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total slips:</span>
                  <span className="font-medium">{statistics.total}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Active:</span>
                  <span className="font-medium">
                    {statistics.pending + statistics.inTransit}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Completed:</span>
                  <span className="font-medium text-green-600">
                    {statistics.completed}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Cancelled:</span>
                  <span className="font-medium text-red-600">
                    {statistics.cancelled}
                  </span>
                </div>
                <div className="flex justify-between text-sm border-t pt-3">
                  <span className="text-muted-foreground">Success rate:</span>
                  <Badge color="primary">{completionRate}%</Badge>
                </div>
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
            <CardContent className="space-y-2">
              <Link href="/shipping-slips/create">
                <Button variant="outline" className="w-full">
                  <Icon icon="heroicons:plus" className="w-4 h-4 mr-2" />
                  Create New Slip
                </Button>
              </Link>

              <Link href="/shipping-slips/available-parcels">
                <Button variant="outline" className="w-full">
                  <Icon icon="heroicons:cube" className="w-4 h-4 mr-2" />
                  Available Parcels
                </Button>
              </Link>

              <Link href="/shipping-slips">
                <Button variant="outline" className="w-full">
                  <Icon icon="heroicons:list-bullet" className="w-4 h-4 mr-2" />
                  All Shipping Slips
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Export Options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon
                  icon="heroicons:document-arrow-down"
                  className="w-5 h-5"
                />
                Export Data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full">
                <Icon
                  icon="heroicons:document-chart-bar"
                  className="w-4 h-4 mr-2"
                />
                Export Report (PDF)
              </Button>

              <Button variant="outline" className="w-full">
                <Icon icon="heroicons:table-cells" className="w-4 h-4 mr-2" />
                Export Data (Excel)
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

// Main component wrapped with ProtectedRoute
const ShippingSlipsStatsPage = () => {
  return (
    <ProtectedRoute
      requiredPermissions={[PARCELS_PERMISSIONS.SHIPPING_SLIPS_READ]}
      requiredAccessLevel="LIMITED"
      allowedAccountStatuses={["ACTIVE"]}
    >
      <ShippingSlipsStatsPageContent />
    </ProtectedRoute>
  );
};

export default ShippingSlipsStatsPage;
