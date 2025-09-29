"use client";

import React, { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "@/i18n/routing";
import { useDeliverySlipsStore } from "@/lib/stores/parcels/delivery-slips.store";
import { useAuthStore } from "@/lib/stores/auth/auth.store";
import { ProtectedRoute } from "@/components/route/protected-route";
import { PARCELS_PERMISSIONS } from "@/lib/constants/parcels";
import { DeliverySlipsStats } from "@/components/delivery-slips/delivery-slips-stats";

const StatisticsPageContent = () => {
  const { hasPermission, user } = useAuthStore();
  const { statistics, fetchStatistics, isLoading, error } =
    useDeliverySlipsStore();

  const canReadSlips = hasPermission(PARCELS_PERMISSIONS.DELIVERY_SLIPS_READ);

  useEffect(() => {
    if (canReadSlips) {
      fetchStatistics();
    }
  }, [canReadSlips, fetchStatistics]);

  if (!canReadSlips) {
    return (
      <div className="container mx-auto py-8">
        <Alert color="destructive">
          <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to view delivery slip statistics.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-default-900">
            Delivery Slip Statistics
          </h1>
          <p className="text-default-600">
            Comprehensive analytics and insights about delivery slips
          </p>
        </div>
        <Link href="/delivery-slips">
          <Button variant="outline">
            <Icon icon="heroicons:arrow-left" className="w-4 h-4 mr-2" />
            Back to Delivery Slips
          </Button>
        </Link>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert color="destructive">
          <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && !statistics ? (
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
      ) : statistics ? (
        <>
          {/* Stats Component */}
          <DeliverySlipsStats statistics={statistics} />

          {/* Additional Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Completion Rate */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon icon="heroicons:chart-pie" className="w-5 h-5" />
                  Completion Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Received vs Total
                    </span>
                    <span className="text-2xl font-bold text-green-600">
                      {statistics.totalSlips > 0
                        ? Math.round(
                            (statistics.receivedSlips / statistics.totalSlips) *
                              100
                          )
                        : 0}
                      %
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{
                        width: `${
                          statistics.totalSlips > 0
                            ? (statistics.receivedSlips /
                                statistics.totalSlips) *
                              100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center p-2 bg-green-50 rounded">
                      <div className="font-bold text-green-600">
                        {statistics.receivedSlips}
                      </div>
                      <div className="text-muted-foreground">Received</div>
                    </div>
                    <div className="text-center p-2 bg-yellow-50 rounded">
                      <div className="font-bold text-yellow-600">
                        {statistics.pendingSlips}
                      </div>
                      <div className="text-muted-foreground">Pending</div>
                    </div>
                    <div className="text-center p-2 bg-red-50 rounded">
                      <div className="font-bold text-red-600">
                        {statistics.cancelledSlips}
                      </div>
                      <div className="text-muted-foreground">Cancelled</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Value Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon icon="heroicons:banknotes" className="w-5 h-5" />
                  Value Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Total Value
                    </span>
                    <span className="text-2xl font-bold text-primary">
                      {statistics.totalValueInSlips.toLocaleString()} DH
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Average per Slip
                      </span>
                      <span className="font-medium">
                        {statistics.totalSlips > 0
                          ? (
                              statistics.totalValueInSlips /
                              statistics.totalSlips
                            ).toFixed(2)
                          : 0}{" "}
                        DH
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Average per Parcel
                      </span>
                      <span className="font-medium">
                        {statistics.totalParcelsInSlips > 0
                          ? (
                              statistics.totalValueInSlips /
                              statistics.totalParcelsInSlips
                            ).toFixed(2)
                          : 0}{" "}
                        DH
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Efficiency Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon icon="heroicons:arrow-trending-up" className="w-5 h-5" />
                Efficiency Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600">
                    {statistics.averageParcelsPerSlip.toFixed(1)}
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">
                    Parcels per Slip
                  </div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-3xl font-bold text-green-600">
                    {statistics.totalSlips > 0
                      ? Math.round(
                          (statistics.receivedSlips / statistics.totalSlips) *
                            100
                        )
                      : 0}
                    %
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">
                    Success Rate
                  </div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-3xl font-bold text-purple-600">
                    {statistics.totalParcelsInSlips}
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">
                    Total Parcels
                  </div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-3xl font-bold text-orange-600">
                    {statistics.topCities.length}
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">
                    Active Cities
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Info for Sellers */}
          {user?.userType === "SELLER" && (
            <Alert color="info">
              <Icon icon="heroicons:information-circle" className="h-4 w-4" />
              <AlertDescription>
                These statistics show data for your delivery slips only. Contact
                support if you need additional reports.
              </AlertDescription>
            </Alert>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <Icon
              icon="heroicons:chart-bar"
              className="w-12 h-12 text-muted-foreground mx-auto mb-4"
            />
            <p className="text-muted-foreground">
              No statistics available yet. Create some delivery slips to see
              analytics.
            </p>
            <Link href="/delivery-slips/create">
              <Button className="mt-4">
                <Icon icon="heroicons:plus" className="w-4 h-4 mr-2" />
                Create First Delivery Slip
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const StatisticsPage = () => {
  return (
    <ProtectedRoute
      requiredPermissions={[PARCELS_PERMISSIONS.DELIVERY_SLIPS_READ]}
      requiredAccessLevel="LIMITED"
      allowedAccountStatuses={["ACTIVE"]}
    >
      <StatisticsPageContent />
    </ProtectedRoute>
  );
};

export default StatisticsPage;
