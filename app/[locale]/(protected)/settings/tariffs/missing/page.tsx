"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/routing";
import { ProtectedRoute } from "@/components/route/protected-route";
import { SETTINGS_PERMISSIONS } from "@/lib/constants/settings";
import { useTariffsStore } from "@/lib/stores/settings/tariffs.store";
import { useCitiesStore } from "@/lib/stores/settings/cities.store";
import { usePickupCitiesStore } from "@/lib/stores/settings/pickup-cities.store";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";

const MissingTariffsPageContent = () => {
  const router = useRouter();

  // Local state for filtering
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPickupCity, setSelectedPickupCity] = useState<string>("all");
  const [selectedDestinationCity, setSelectedDestinationCity] =
    useState<string>("all");
  const [selectedRoutes, setSelectedRoutes] = useState<Set<string>>(new Set());

  // Store states
  const { missingTariffs, fetchMissingTariffs, isLoading, stats, fetchStats } =
    useTariffsStore();

  const { cities, fetchCities } = useCitiesStore();
  const { pickupCities, fetchActivePickupCities } = usePickupCitiesStore();

  // Fetch data on mount
  useEffect(() => {
    fetchMissingTariffs();
    fetchStats();
    fetchCities();
    fetchActivePickupCities();
  }, [fetchMissingTariffs, fetchStats, fetchCities, fetchActivePickupCities]);

  // Filter missing tariffs based on search and selections
  const filteredMissingTariffs = useMemo(() => {
    let filtered = missingTariffs;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (tariff) =>
          tariff.pickupCity.name.toLowerCase().includes(term) ||
          tariff.destinationCity.name.toLowerCase().includes(term) ||
          tariff.pickupCity.ref.toLowerCase().includes(term) ||
          tariff.destinationCity.ref.toLowerCase().includes(term) ||
          tariff.route.toLowerCase().includes(term)
      );
    }

    // Pickup city filter
    if (selectedPickupCity !== "all") {
      filtered = filtered.filter(
        (tariff) => tariff.pickupCityId === selectedPickupCity
      );
    }

    // Destination city filter
    if (selectedDestinationCity !== "all") {
      filtered = filtered.filter(
        (tariff) => tariff.destinationCityId === selectedDestinationCity
      );
    }

    return filtered;
  }, [missingTariffs, searchTerm, selectedPickupCity, selectedDestinationCity]);

  // Handle route selection
  const handleRouteSelect = (routeId: string, checked: boolean) => {
    const newSelected = new Set(selectedRoutes);
    if (checked) {
      newSelected.add(routeId);
    } else {
      newSelected.delete(routeId);
    }
    setSelectedRoutes(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedRoutes.size === filteredMissingTariffs.length) {
      setSelectedRoutes(new Set());
    } else {
      const allRouteIds = filteredMissingTariffs.map(
        (tariff) => `${tariff.pickupCityId}-${tariff.destinationCityId}`
      );
      setSelectedRoutes(new Set(allRouteIds));
    }
  };

  // Handle bulk create navigation
  const handleBulkCreate = () => {
    if (selectedRoutes.size === 0) {
      toast.error("Please select at least one route to create tariffs for");
      return;
    }

    const selectedTariffs = filteredMissingTariffs.filter((tariff) =>
      selectedRoutes.has(`${tariff.pickupCityId}-${tariff.destinationCityId}`)
    );

    // Navigate to bulk import with pre-selected routes
    const routeParams = selectedTariffs
      .map((t) => `${t.pickupCityId},${t.destinationCityId}`)
      .join("|");

    router.push(
      `/settings/tariffs/bulk-import?routes=${encodeURIComponent(routeParams)}`
    );
  };

  // Handle single tariff creation
  const handleCreateSingle = (tariff: (typeof missingTariffs)[0]) => {
    const params = new URLSearchParams({
      pickupCityId: tariff.pickupCityId,
      destinationCityId: tariff.destinationCityId,
    });
    router.push(`/settings/tariffs/create?${params.toString()}`);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setSelectedPickupCity("all");
    setSelectedDestinationCity("all");
    setSelectedRoutes(new Set());
  };

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4 p-4">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
  );

  return (
    <ProtectedRoute
      requiredPermissions={[SETTINGS_PERMISSIONS.READ_SETTINGS]}
      requiredAccessLevel="FULL"
      requireValidation={true}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link
                href="/settings/tariffs"
                className="text-muted-foreground hover:text-foreground"
              >
                <Icon icon="heroicons:arrow-left" className="w-4 h-4" />
              </Link>
              <h1 className="text-2xl font-bold text-default-900">
                Missing Tariffs
              </h1>
            </div>
            <p className="text-default-600">
              Configure tariffs for routes that don't have pricing yet
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="md"
              onClick={() => fetchMissingTariffs()}
              disabled={isLoading}
            >
              <Icon icon="heroicons:arrow-path" className="w-4 h-4 mr-2" />
              Refresh
            </Button>

            {selectedRoutes.size > 0 && (
              <Button onClick={handleBulkCreate}>
                <Icon icon="heroicons:plus" className="w-4 h-4 mr-2" />
                Create Selected ({selectedRoutes.size})
              </Button>
            )}

            <Link href="/settings/tariffs/bulk-import">
              <Button variant="outline">
                <Icon
                  icon="heroicons:document-arrow-up"
                  className="w-4 h-4 mr-2"
                />
                Bulk Import
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Missing Routes
                    </p>
                    <p className="text-2xl font-bold text-red-600">
                      {missingTariffs.length}
                    </p>
                  </div>
                  <Icon
                    icon="heroicons:exclamation-triangle"
                    className="w-8 h-8 text-red-600"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Configured</p>
                    <p className="text-2xl font-bold text-green-600">
                      {stats.cityPairCoverage.configuredPairs}
                    </p>
                  </div>
                  <Icon
                    icon="heroicons:check-circle"
                    className="w-8 h-8 text-green-600"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Coverage</p>
                    <p
                      className={`text-2xl font-bold ${
                        stats.cityPairCoverage.coveragePercentage >= 80
                          ? "text-green-600"
                          : stats.cityPairCoverage.coveragePercentage >= 50
                          ? "text-yellow-600"
                          : "text-red-600"
                      }`}
                    >
                      {stats.cityPairCoverage.coveragePercentage.toFixed(1)}%
                    </p>
                  </div>
                  <Icon
                    icon="heroicons:map"
                    className="w-8 h-8 text-blue-600"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Total Possible
                    </p>
                    <p className="text-2xl font-bold">
                      {stats.cityPairCoverage.totalPossiblePairs}
                    </p>
                  </div>
                  <Icon
                    icon="heroicons:building-office"
                    className="w-8 h-8 text-gray-600"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Coverage Alert */}
        {stats && stats.cityPairCoverage.coveragePercentage < 80 && (
          <Alert color="warning">
            <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <div>
                  <strong>
                    {stats.cityPairCoverage.coveragePercentage < 50
                      ? "Low coverage detected"
                      : "Coverage can be improved"}
                  </strong>
                </div>
                <p className="text-sm">
                  {missingTariffs.length} routes still need tariff configuration
                  to improve shipping coverage. Consider bulk importing tariffs
                  for commonly used routes.
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Filter Missing Routes</span>
              <div className="flex items-center gap-2">
                {(searchTerm ||
                  selectedPickupCity !== "all" ||
                  selectedDestinationCity !== "all") && (
                  <Button variant="outline" size="md" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                )}
                <Badge color="secondary">
                  {filteredMissingTariffs.length} of {missingTariffs.length}{" "}
                  routes
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Search Routes</label>
                <Input
                  placeholder="Search by city name or ref..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Pickup City Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Pickup City</label>
                <Select
                  value={selectedPickupCity}
                  onValueChange={setSelectedPickupCity}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All pickup cities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Pickup Cities</SelectItem>
                    {pickupCities.map((city) => (
                      <SelectItem key={city.id} value={city.id}>
                        {city.name} ({city.ref})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Destination City Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Destination City</label>
                <Select
                  value={selectedDestinationCity}
                  onValueChange={setSelectedDestinationCity}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All destinations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Destinations</SelectItem>
                    {cities.map((city) => (
                      <SelectItem key={city.id} value={city.id}>
                        {city.name} ({city.ref})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Missing Tariffs Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Missing Route Configurations</span>
              {filteredMissingTariffs.length > 0 && (
                <Button variant="outline" size="md" onClick={handleSelectAll}>
                  {selectedRoutes.size === filteredMissingTariffs.length
                    ? "Deselect All"
                    : "Select All"}
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <LoadingSkeleton />
            ) : filteredMissingTariffs.length === 0 ? (
              <div className="text-center py-12">
                <Icon
                  icon="heroicons:check-circle"
                  className="w-16 h-16 text-green-500 mx-auto mb-4"
                />
                <h3 className="text-lg font-semibold mb-2">
                  {missingTariffs.length === 0
                    ? "All Routes Configured!"
                    : "No Routes Match Filters"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {missingTariffs.length === 0
                    ? "Congratulations! All possible city pair routes have configured tariffs."
                    : "Try adjusting your filters to see more missing routes."}
                </p>
                {missingTariffs.length === 0 && (
                  <Link href="/settings/tariffs">
                    <Button>
                      <Icon
                        icon="heroicons:arrow-left"
                        className="w-4 h-4 mr-2"
                      />
                      Back to Tariffs
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={
                          selectedRoutes.size ===
                            filteredMissingTariffs.length &&
                          filteredMissingTariffs.length > 0
                        }
                        onChange={handleSelectAll}
                        className="rounded"
                      />
                    </TableHead>
                    <TableHead>Pickup City</TableHead>
                    <TableHead>Ref</TableHead>
                    <TableHead>Destination City</TableHead>
                    <TableHead>Ref</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMissingTariffs.map((tariff) => {
                    const routeId = `${tariff.pickupCityId}-${tariff.destinationCityId}`;
                    const isSelected = selectedRoutes.has(routeId);

                    return (
                      <TableRow key={routeId}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) =>
                              handleRouteSelect(routeId, e.target.checked)
                            }
                            className="rounded"
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {tariff.pickupCity.name}
                        </TableCell>
                        <TableCell>
                          <Badge color="primary" className="font-mono text-xs">
                            {tariff.pickupCity.ref}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {tariff.destinationCity.name}
                        </TableCell>
                        <TableCell>
                          <Badge color="primary" className="font-mono text-xs">
                            {tariff.destinationCity.ref}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Icon
                              icon="heroicons:arrow-right"
                              className="w-4 h-4 text-muted-foreground"
                            />
                            <span className="text-sm text-muted-foreground">
                              {tariff.route}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="md"
                            onClick={() => handleCreateSingle(tariff)}
                          >
                            <Icon
                              icon="heroicons:plus"
                              className="w-4 h-4 mr-1"
                            />
                            Create
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Bulk Actions Footer */}
        {selectedRoutes.size > 0 && (
          <Card className="border-primary bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {selectedRoutes.size} route
                    {selectedRoutes.size > 1 ? "s" : ""} selected
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Create tariffs for all selected routes at once
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedRoutes(new Set())}
                  >
                    Clear Selection
                  </Button>
                  <Button onClick={handleBulkCreate}>
                    <Icon icon="heroicons:plus" className="w-4 h-4 mr-2" />
                    Create {selectedRoutes.size} Tariff
                    {selectedRoutes.size > 1 ? "s" : ""}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ProtectedRoute>
  );
};

export default MissingTariffsPageContent;
