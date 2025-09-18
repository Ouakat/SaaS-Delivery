"use client";

import React, { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "@/i18n/routing";
import { ProtectedRoute } from "@/components/route/protected-route";
import { useAuthStore } from "@/lib/stores/auth.store";
import { useCitiesStore } from "@/lib/stores/cities.store";
import { SETTINGS_PERMISSIONS } from "@/lib/constants/settings";
import CitiesTable from "@/components/settings/cities/cities-table";

const CitiesPageContent = () => {
  const { hasPermission } = useAuthStore();
  const {
    statistics,
    zoneStats,
    pickupCities,
    isLoading,
    error,
    fetchCities,
    fetchStatistics,
    fetchZoneStats,
    fetchPickupCities,
    refresh,
    clearError,
  } = useCitiesStore();

  // Permissions
  const canManage = hasPermission(SETTINGS_PERMISSIONS.MANAGE_CITIES);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchCities(),
        fetchStatistics(),
        fetchZoneStats(),
        fetchPickupCities(),
      ]);
    };

    loadData();
  }, [fetchCities, fetchStatistics, fetchZoneStats, fetchPickupCities]);

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
            <span className="text-sm text-gray-500">Cities</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Cities Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage delivery cities, zones, and pickup locations
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={refresh} disabled={isLoading}>
            <Icon
              icon="heroicons:arrow-path"
              className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>

          {canManage && (
            <Link href="/settings/cities/create">
              <Button>
                <Icon icon="heroicons:plus" className="w-4 h-4 mr-2" />
                Add City
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert color="destructive">
          <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            {error}
            <Button variant="outline" size="sm" onClick={clearError}>
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium">Total Cities</CardTitle>
            <Icon
              icon="heroicons:building-office-2"
              className="h-4 w-4 text-muted-foreground"
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics?.totalCities || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {statistics?.activeCities || 0} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium">Pickup Cities</CardTitle>
            <Icon
              icon="heroicons:truck"
              className="h-4 w-4 text-muted-foreground"
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics?.pickupCities || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {pickupCities.length} available
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium">Zones</CardTitle>
            <Icon
              icon="heroicons:map-pin"
              className="h-4 w-4 text-muted-foreground"
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{zoneStats.length}</div>
            <p className="text-xs text-muted-foreground">Different zones</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium">With Tariffs</CardTitle>
            <Icon
              icon="heroicons:currency-dollar"
              className="h-4 w-4 text-muted-foreground"
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics?.citiesWithTariffs || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Avg {statistics?.avgTariffsPerCity?.toFixed(1) || 0} per city
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Zone Distribution */}
      {zoneStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon icon="heroicons:chart-pie" className="w-5 h-5" />
              Zone Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {zoneStats.map((zone) => (
                <div
                  key={zone.zone}
                  className="text-center p-3 bg-gray-50 rounded-lg"
                >
                  <div className="text-lg font-bold text-gray-900">
                    {zone.count}
                  </div>
                  <div className="text-sm text-gray-600">{zone.zone}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Cities Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Icon icon="heroicons:building-office-2" className="w-5 h-5" />
              All Cities
            </CardTitle>

            <div className="flex items-center gap-2">
              {canManage && (
                <>
                  <Link href="/settings/cities/import">
                    <Button variant="outline" size="sm">
                      <Icon
                        icon="heroicons:arrow-up-tray"
                        className="w-4 h-4 mr-2"
                      />
                      Import
                    </Button>
                  </Link>

                  <Button variant="outline" size="sm">
                    <Icon
                      icon="heroicons:arrow-down-tray"
                      className="w-4 h-4 mr-2"
                    />
                    Export
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <CitiesTable />
        </CardContent>
      </Card>

      {/* Quick Access */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon icon="heroicons:truck" className="w-5 h-5" />
              Pickup Cities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Manage cities that support pickup services
            </p>
            <Link href="/settings/pickup-cities">
              <Button variant="outline" className="w-full">
                Manage Pickup Cities
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon icon="heroicons:globe-americas" className="w-5 h-5" />
              Zones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Organize cities into delivery zones
            </p>
            <Link href="/settings/zones">
              <Button variant="outline" className="w-full">
                Manage Zones
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon icon="heroicons:currency-dollar" className="w-5 h-5" />
              Tariffs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Configure pricing between cities
            </p>
            <Link href="/settings/tariffs">
              <Button variant="outline" className="w-full">
                Manage Tariffs
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Main component with protection
const CitiesPage = () => {
  return (
    <ProtectedRoute
      requiredPermissions={[SETTINGS_PERMISSIONS.READ_CITIES]}
      requiredAccessLevel="FULL"
      allowedAccountStatuses={["ACTIVE"]}
      requireValidation={true}
    >
      <CitiesPageContent />
    </ProtectedRoute>
  );
};

export default CitiesPage;
