"use client";
import React, { useEffect, useState } from "react";
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
import { Link } from "@/i18n/routing";
import { ProtectedRoute } from "@/components/route/protected-route";
import { SETTINGS_PERMISSIONS } from "@/lib/constants/settings";
import { useTariffsStore } from "@/lib/stores/settings/tariffs.store";
import { useCitiesStore } from "@/lib/stores/settings/cities.store";
import { usePickupCitiesStore } from "@/lib/stores/settings/pickup-cities.store";
import TariffsTable from "@/components/settings/tariffs/tariffs-table";
import TariffCalculator from "@/components/settings/tariffs/tariff-calculator";
import TariffStats from "@/components/settings/tariffs/tariff-stats";

const TariffsPageContent = () => {
  const [showCalculator, setShowCalculator] = useState(false);
  const [showStats, setShowStats] = useState(false);

  const {
    filters,
    setFilters,
    resetFilters,
    stats,
    missingTariffs,
    fetchStats,
    fetchMissingTariffs,
    isLoading,
  } = useTariffsStore();

  const { cities, fetchCities } = useCitiesStore();
  const { pickupCities, fetchActivePickupCities } = usePickupCitiesStore();

  useEffect(() => {
    // Fetch initial data
    fetchCities();
    fetchActivePickupCities();
    fetchStats();
    fetchMissingTariffs();
  }, [fetchCities, fetchActivePickupCities, fetchStats, fetchMissingTariffs]);

  const handleSearchChange = (value: string) => {
    setFilters({ search: value });
  };

  const handlePickupCityFilter = (value: string) => {
    setFilters({ pickupCityId: value === "all" ? "" : value });
  };

  const handleDestinationCityFilter = (value: string) => {
    setFilters({ destinationCityId: value === "all" ? "" : value });
  };

  const handlePriceRangeFilter = (minPrice: string, maxPrice: string) => {
    setFilters({
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
    });
  };

  const handleDelayFilter = (maxDelay: string) => {
    setFilters({
      maxDelay: maxDelay ? parseInt(maxDelay) : undefined,
    });
  };

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
            <h1 className="text-2xl font-bold text-default-900">
              Tariffs Management
            </h1>
            <p className="text-default-600">
              Configure shipping tariffs between pickup and destination cities
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="md"
              onClick={() => setShowCalculator(!showCalculator)}
            >
              <Icon icon="heroicons:calculator" className="w-4 h-4 mr-2" />
              Calculator
            </Button>

            <Button
              variant="outline"
              size="md"
              onClick={() => setShowStats(!showStats)}
            >
              <Icon icon="heroicons:chart-bar" className="w-4 h-4 mr-2" />
              Statistics
            </Button>

            <Link href="/settings/tariffs/bulk-import">
              <Button variant="outline" size="md">
                <Icon
                  icon="heroicons:document-arrow-up"
                  className="w-4 h-4 mr-2"
                />
                Bulk Import
              </Button>
            </Link>

            <Link href="/settings/tariffs/create">
              <Button>
                <Icon icon="heroicons:plus" className="w-4 h-4 mr-2" />
                Create Tariff
              </Button>
            </Link>
          </div>
        </div>

        {/* Quick Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Total Tariffs
                    </p>
                    <p className="text-2xl font-bold">{stats.totalTariffs}</p>
                  </div>
                  <Icon
                    icon="heroicons:currency-dollar"
                    className="w-8 h-8 text-primary"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Avg. Delivery Price
                    </p>
                    <p className="text-2xl font-bold">
                      ${stats.averageDeliveryPrice.toFixed(2)}
                    </p>
                  </div>
                  <Icon
                    icon="heroicons:truck"
                    className="w-8 h-8 text-green-600"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg. Delay</p>
                    <p className="text-2xl font-bold">
                      {stats.averageDeliveryDelay} days
                    </p>
                  </div>
                  <Icon
                    icon="heroicons:clock"
                    className="w-8 h-8 text-orange-600"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Coverage</p>
                    <p className="text-2xl font-bold">
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
          </div>
        )}

        {/* Missing Tariffs Alert */}
        {missingTariffs.length > 0 && (
          <Alert color="warning">
            <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <div>
                  <strong>
                    {missingTariffs.length} missing tariff configurations
                  </strong>
                  <p className="text-sm">
                    Some city pairs don't have configured tariffs yet.
                  </p>
                </div>
                <Link href="/settings/tariffs/missing">
                  <Button variant="outline" size="md">
                    View Missing
                  </Button>
                </Link>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Calculator Card */}
        {showCalculator && (
          <Card>
            <CardHeader>
              <CardTitle>Tariff Calculator</CardTitle>
            </CardHeader>
            <CardContent>
              <TariffCalculator />
            </CardContent>
          </Card>
        )}

        {/* Statistics Card */}
        {showStats && stats && (
          <Card>
            <CardHeader>
              <CardTitle>Tariff Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <TariffStats stats={stats} />
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Filters
              <Button
                variant="outline"
                size="md"
                onClick={resetFilters}
                disabled={isLoading}
              >
                Reset
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Search */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <Input
                  placeholder="Search tariffs..."
                  value={filters.search || ""}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
              </div>

              {/* Pickup City Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Pickup City</label>
                <Select
                  value={filters.pickupCityId || "all"}
                  onValueChange={handlePickupCityFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All pickup cities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Pickup Cities</SelectItem>
                    {cities.map((city) => (
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
                  value={filters.destinationCityId || "all"}
                  onValueChange={handleDestinationCityFilter}
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

              {/* Price Range */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Price Range</label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.minPrice || ""}
                    onChange={(e) =>
                      handlePriceRangeFilter(
                        e.target.value,
                        filters.maxPrice?.toString() || ""
                      )
                    }
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.maxPrice || ""}
                    onChange={(e) =>
                      handlePriceRangeFilter(
                        filters.minPrice?.toString() || "",
                        e.target.value
                      )
                    }
                  />
                </div>
              </div>

              {/* Max Delay */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Max Delay (days)</label>
                <Input
                  type="number"
                  placeholder="Max delay"
                  value={filters.maxDelay || ""}
                  onChange={(e) => handleDelayFilter(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tariffs Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>All Tariffs</span>
              {filters.search && (
                <Badge color="primary">Filtered: {filters.search}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <TariffsTable />
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
};

export default TariffsPageContent;
