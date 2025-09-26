"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "@/i18n/routing";
import { ProtectedRoute } from "@/components/route/protected-route";
import { useAuthStore } from "@/lib/stores/auth/auth.store";
import { useCitiesStore } from "@/lib/stores/parcels/cities.store";
import CitiesTable from "@/components/settings/cities/cities-table";
import CitiesStats from "@/components/settings/cities/cities-stats";
import { toast } from "sonner";

const CitiesPageContent = () => {
  const router = useRouter();
  const { hasPermission } = useAuthStore();
  const {
    cities,
    pickupCities,
    zoneStats,
    isLoading,
    error,
    fetchCities,
    fetchPickupCities,
    fetchZoneStats,
    clearError,
  } = useCitiesStore();

  // Check permissions
  const canCreateCities = hasPermission("cities:create");
  const canUpdateCities = hasPermission("cities:update");
  const canDeleteCities = hasPermission("cities:delete");
  const canManageCities = hasPermission("cities:read");

  // Initialize data
  useEffect(() => {
    const initializeData = async () => {
      try {
        await Promise.all([
          fetchCities(),
          fetchPickupCities(),
          fetchZoneStats(),
        ]);
      } catch (error) {
        console.error("Failed to initialize cities data:", error);
      }
    };

    initializeData();
  }, [fetchCities, fetchPickupCities, fetchZoneStats]);

  // Handle export
  const handleExport = async () => {
    try {
      // This would typically call an export API
      toast.success("Export started! You'll receive a download link shortly.");
    } catch (error) {
      toast.error("Failed to export cities data");
    }
  };

  // Handle import
  const handleImport = () => {
    // Navigate to import page or open import dialog
    router.push("/settings/cities/import");
  };

  // Quick stats from current data
  const quickStats = React.useMemo(() => {
    return {
      total: cities.length,
      active: cities.filter((city) => city.status).length,
      pickup: pickupCities.length,
      zones: zoneStats.length,
    };
  }, [cities, pickupCities, zoneStats]);

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-default-900">
            Cities Management
          </h1>
          <p className="text-default-600 mt-1">
            Manage cities, zones, and pickup locations for your logistics
            network
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="md">
                <Icon
                  icon="heroicons:ellipsis-horizontal"
                  className="w-4 h-4 mr-2"
                />
                Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Bulk Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={handleExport}>
                <Icon
                  icon="heroicons:document-arrow-down"
                  className="w-4 h-4 mr-2"
                />
                Export Cities
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleImport}>
                <Icon
                  icon="heroicons:document-arrow-up"
                  className="w-4 h-4 mr-2"
                />
                Import Cities
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings/cities/zones">
                  <Icon icon="heroicons:map" className="w-4 h-4 mr-2" />
                  Manage Zones
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Create City Button */}
          {canCreateCities && (
            <Link href="/settings/cities/create">
              <Button size="md">
                <Icon icon="heroicons:plus" className="w-4 h-4 mr-2" />
                Add City
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Icon
                icon="heroicons:exclamation-triangle"
                className="w-5 h-5 text-red-600"
              />
              <div className="flex-1">
                <p className="text-red-800 font-medium">
                  Error loading cities data
                </p>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
              <Button
                size="md"
                variant="outline"
                onClick={() => {
                  clearError();
                  fetchCities();
                }}
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Cities
                </p>
                <p className="text-2xl font-bold">{quickStats.total}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Icon
                  icon="heroicons:map-pin"
                  className="h-4 w-4 text-blue-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Active Cities
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {quickStats.active}
                </p>
              </div>
              <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center">
                <Icon
                  icon="heroicons:check-circle"
                  className="h-4 w-4 text-green-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Pickup Locations
                </p>
                <p className="text-2xl font-bold text-orange-600">
                  {quickStats.pickup}
                </p>
              </div>
              <div className="h-8 w-8 rounded-full bg-orange-500/10 flex items-center justify-center">
                <Icon
                  icon="heroicons:truck"
                  className="h-4 w-4 text-orange-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Coverage Zones
                </p>
                <p className="text-2xl font-bold text-purple-600">
                  {quickStats.zones}
                </p>
              </div>
              <div className="h-8 w-8 rounded-full bg-purple-500/10 flex items-center justify-center">
                <Icon
                  icon="heroicons:map"
                  className="h-4 w-4 text-purple-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="cities" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="cities" className="flex items-center gap-2">
            <Icon icon="heroicons:building-office-2" className="w-4 h-4" />
            Cities List
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <Icon icon="heroicons:chart-bar" className="w-4 h-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Cities Table Tab */}
        <TabsContent value="cities" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Icon
                    icon="heroicons:building-office-2"
                    className="w-5 h-5"
                  />
                  Cities Directory
                </CardTitle>
                <div className="flex items-center gap-2">
                  {isLoading && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Icon
                        icon="heroicons:arrow-path"
                        className="w-4 h-4 animate-spin"
                      />
                      <span className="text-sm">Loading...</span>
                    </div>
                  )}
                  <Badge color="primary">{quickStats.total} cities</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <CitiesTable />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <CitiesStats />
        </TabsContent>
      </Tabs>

      {/* Quick Actions Footer */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-blue-900">Need Help?</h3>
              <p className="text-sm text-blue-700">
                Learn how to manage cities, set up zones, and configure pickup
                locations.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="md">
                <Icon icon="heroicons:book-open" className="w-4 h-4 mr-2" />
                Documentation
              </Button>
              <Button variant="outline" size="md">
                <Icon
                  icon="heroicons:chat-bubble-left-right"
                  className="w-4 h-4 mr-2"
                />
                Support
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Main page component with protection
export default function CitiesPage() {
  return (
    <ProtectedRoute
      requiredPermissions={["cities:read"]}
      requiredAccessLevel="LIMITED"
    >
      <CitiesPageContent />
    </ProtectedRoute>
  );
}
