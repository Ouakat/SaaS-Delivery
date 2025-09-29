"use client";
import React, { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/routing";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeliverySlipsTable } from "@/components/delivery-slips/delivery-slips-table";
import { DeliverySlipsStats } from "@/components/delivery-slips/delivery-slips-stats";
import { BulkActionsBar } from "@/components/delivery-slips/bulk-actions-bar";
import { useDeliverySlipsStore } from "@/lib/stores/parcels/delivery-slips.store";
import { useCitiesStore } from "@/lib/stores/parcels/cities.store";
import { useAuthStore } from "@/lib/stores/auth/auth.store";
import { ProtectedRoute } from "@/components/route/protected-route";
import { PARCELS_PERMISSIONS } from "@/lib/constants/parcels";
import { DeliverySlipStatus } from "@/lib/types/parcels/delivery-slips.types";
import { toast } from "sonner";

const DeliverySlipsPageContent = () => {
  const { hasPermission, user } = useAuthStore();
  const {
    deliverySlips,
    pagination,
    filters,
    statistics,
    selectedSlipIds,
    isLoading,
    error,
    setFilters,
    clearFilters,
    fetchDeliverySlips,
    fetchStatistics,
    clearSelectedSlipIds,
    exportDeliverySlips,
    resetState,
  } = useDeliverySlipsStore();

  const { cities, fetchCities } = useCitiesStore();

  const [showStats, setShowStats] = useState(false);
  const [searchTerm, setSearchTerm] = useState(filters.search || "");
  const [isExporting, setIsExporting] = useState(false);

  // Check permissions
  const canReadSlips = hasPermission(PARCELS_PERMISSIONS.DELIVERY_SLIPS_READ);
  const canCreateSlips = hasPermission(
    PARCELS_PERMISSIONS.DELIVERY_SLIPS_CREATE
  );
  const canUpdateSlips = hasPermission(
    PARCELS_PERMISSIONS.DELIVERY_SLIPS_UPDATE
  );
  const canDeleteSlips = hasPermission(
    PARCELS_PERMISSIONS.DELIVERY_SLIPS_DELETE
  );
  const canBulkActions = hasPermission(PARCELS_PERMISSIONS.DELIVERY_SLIPS_READ);
  const canScanSlips = hasPermission(PARCELS_PERMISSIONS.DELIVERY_SLIPS_READ);

  // Initialize data
  useEffect(() => {
    if (canReadSlips) {
      fetchDeliverySlips();
      fetchCities();
      if (user?.userType !== "SELLER") {
        fetchStatistics();
      }
    }

    // Cleanup on unmount
    return () => {
      resetState();
    };
  }, [
    canReadSlips,
    fetchDeliverySlips,
    fetchCities,
    fetchStatistics,
    user?.userType,
    resetState,
  ]);

  // Handle search with debouncing
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchTerm(value);
      const timeoutId = setTimeout(() => {
        setFilters({ search: value, page: 1 });
      }, 500);
      return () => clearTimeout(timeoutId);
    },
    [setFilters]
  );

  // Handle status filter change
  const handleStatusFilter = (status: string) => {
    setFilters({
      status: status === "all" ? undefined : (status as DeliverySlipStatus),
      page: 1,
    });
  };

  // Handle city filter change
  const handleCityFilter = (cityId: string) => {
    setFilters({
      cityId: cityId === "all" ? undefined : cityId,
      page: 1,
    });
  };

  // Handle date range filters
  const handleDateRangeFilter = (range: string) => {
    const today = new Date();
    let startDate: string | undefined;
    let endDate: string | undefined;

    switch (range) {
      case "today":
        startDate = today.toISOString().split("T")[0];
        endDate = startDate;
        break;
      case "week":
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        startDate = weekAgo.toISOString().split("T")[0];
        endDate = today.toISOString().split("T")[0];
        break;
      case "month":
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        startDate = monthAgo.toISOString().split("T")[0];
        endDate = today.toISOString().split("T")[0];
        break;
      default:
        startDate = undefined;
        endDate = undefined;
    }

    setFilters({ startDate, endDate, page: 1 });
  };

  // Handle export
  const handleExport = async () => {
    setIsExporting(true);
    toast.promise(exportDeliverySlips(filters), {
      loading: "Exporting delivery slips...",
      success: (url) => {
        if (url) {
          window.open(url, "_blank");
          return "Export completed successfully";
        }
        return "Export completed";
      },
      error: "Failed to export delivery slips",
    });
    setIsExporting(false);
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setFilters({ page });
  };

  // Handle clear all filters
  const handleClearAllFilters = () => {
    setSearchTerm("");
    clearFilters();
  };

  if (!canReadSlips) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-default-900">
              Delivery Slips
            </h1>
            <p className="text-default-600">
              Manage package collection documents
            </p>
          </div>
        </div>

        <Alert color="destructive">
          <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to access delivery slips. Please contact
            your administrator.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const activeFiltersCount = Object.values({
    search: filters.search,
    status: filters.status,
    cityId: filters.cityId,
    startDate: filters.startDate,
    endDate: filters.endDate,
  }).filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-default-900">
            Delivery Slips
          </h1>
          <p className="text-default-600">
            Manage package collection documents and track pickup operations
          </p>
          {pagination.total > 0 && (
            <div className="flex items-center gap-4 mt-2 text-sm text-default-500">
              <span>Total: {pagination.total} slips</span>
              {selectedSlipIds.length > 0 && (
                <span>Selected: {selectedSlipIds.length}</span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {statistics && user?.userType !== "SELLER" && (
            <Button
              variant="outline"
              size="md"
              onClick={() => setShowStats(!showStats)}
            >
              <Icon icon="heroicons:chart-bar" className="w-4 h-4 mr-2" />
              {showStats ? "Hide" : "Show"} Stats
            </Button>
          )}

          {canCreateSlips && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button>
                  <Icon icon="heroicons:plus" className="w-4 h-4 mr-2" />
                  Create
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/delivery-slips/create">
                    <Icon
                      icon="heroicons:document-plus"
                      className="mr-2 h-4 w-4"
                    />
                    New Delivery Slip
                  </Link>
                </DropdownMenuItem>
                {canScanSlips && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/delivery-slips/scan">
                        <Icon
                          icon="heroicons:qr-code"
                          className="mr-2 h-4 w-4"
                        />
                        Scanner Interface
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                {canBulkActions && (
                  <DropdownMenuItem asChild>
                    <Link href="/delivery-slips/bulk-receive">
                      <Icon
                        icon="heroicons:check-circle"
                        className="mr-2 h-4 w-4"
                      />
                      Bulk Receive
                    </Link>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Statistics */}
      {showStats && statistics && (
        <DeliverySlipsStats statistics={statistics} />
      )}

      {/* Error Alert */}
      {error && (
        <Alert color="destructive">
          <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              All Delivery Slips
              {activeFiltersCount > 0 && (
                <Badge color="primary" className="ml-2">
                  {activeFiltersCount} filter
                  {activeFiltersCount !== 1 ? "s" : ""} active
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="md"
                onClick={handleExport}
                disabled={isExporting}
              >
                {isExporting ? (
                  <Icon
                    icon="heroicons:arrow-path"
                    className="w-4 h-4 mr-2 animate-spin"
                  />
                ) : (
                  <Icon
                    icon="heroicons:document-arrow-down"
                    className="w-4 h-4 mr-2"
                  />
                )}
                Export
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="md">
                    <Icon icon="heroicons:funnel" className="w-4 h-4 mr-2" />
                    Filters
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => handleDateRangeFilter("today")}
                  >
                    <Icon icon="heroicons:calendar" className="mr-2 h-4 w-4" />
                    Today
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleDateRangeFilter("week")}
                  >
                    <Icon icon="heroicons:calendar" className="mr-2 h-4 w-4" />
                    Last 7 days
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleDateRangeFilter("month")}
                  >
                    <Icon icon="heroicons:calendar" className="mr-2 h-4 w-4" />
                    Last 30 days
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleClearAllFilters}>
                    <Icon icon="heroicons:x-mark" className="mr-2 h-4 w-4" />
                    Clear All Filters
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filter Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <Input
                placeholder="Search by reference, customer name, or phone..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Status Filter */}
            <div>
              <Select
                value={filters.status || "all"}
                onValueChange={handleStatusFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value={DeliverySlipStatus.PENDING}>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-yellow-500" />
                      Pending
                    </div>
                  </SelectItem>
                  <SelectItem value={DeliverySlipStatus.RECEIVED}>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      Received
                    </div>
                  </SelectItem>
                  <SelectItem value={DeliverySlipStatus.CANCELLED}>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      Cancelled
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* City Filter */}
            <div>
              <Select
                value={filters.cityId || "all"}
                onValueChange={handleCityFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Cities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  <SelectItem value="none">No City</SelectItem>
                  {cities
                    .filter((city) => city.pickupCity && city.status)
                    .map((city) => (
                      <SelectItem key={city.id} value={city.id}>
                        {city.name} ({city.ref})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active Filters */}
          {activeFiltersCount > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">
                Active filters:
              </span>
              {filters.search && (
                <Badge color="primary" className="gap-1">
                  Search: {filters.search}
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setFilters({ search: "", page: 1 });
                    }}
                    className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                  >
                    <Icon icon="heroicons:x-mark" className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {filters.status && (
                <Badge color="primary" className="gap-1">
                  Status: {filters.status}
                  <button
                    onClick={() => setFilters({ status: undefined, page: 1 })}
                    className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                  >
                    <Icon icon="heroicons:x-mark" className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {filters.cityId && (
                <Badge color="primary" className="gap-1">
                  City:{" "}
                  {cities.find((c) => c.id === filters.cityId)?.name ||
                    "Unknown"}
                  <button
                    onClick={() => setFilters({ cityId: undefined, page: 1 })}
                    className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                  >
                    <Icon icon="heroicons:x-mark" className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {(filters.startDate || filters.endDate) && (
                <Badge color="primary" className="gap-1">
                  Date Range
                  <button
                    onClick={() =>
                      setFilters({
                        startDate: undefined,
                        endDate: undefined,
                        page: 1,
                      })
                    }
                    className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                  >
                    <Icon icon="heroicons:x-mark" className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAllFilters}
                className="h-6 px-2 text-xs"
              >
                Clear all
              </Button>
            </div>
          )}

          {/* Bulk Actions */}
          {selectedSlipIds.length > 0 && canBulkActions && (
            <BulkActionsBar
              selectedCount={selectedSlipIds.length}
              onClearSelection={clearSelectedSlipIds}
            />
          )}
        </CardContent>
      </Card>

      {/* Delivery Slips Table */}
      <Card>
        <CardContent className="p-0">
          <DeliverySlipsTable
            deliverySlips={deliverySlips}
            pagination={pagination}
            isLoading={isLoading}
            onPageChange={handlePageChange}
            canUpdate={canUpdateSlips}
            canDelete={canDeleteSlips}
            canBulkActions={canBulkActions}
          />
        </CardContent>
      </Card>

      {/* Quick Actions Card */}
      {canCreateSlips && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon icon="heroicons:bolt" className="w-5 h-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/delivery-slips/create">
                <Button variant="outline" className="w-full h-auto p-4">
                  <div className="flex flex-col items-center gap-2">
                    <Icon icon="heroicons:plus-circle" className="w-8 h-8" />
                    <span>Create New Slip</span>
                    <span className="text-xs text-muted-foreground">
                      Start new collection
                    </span>
                  </div>
                </Button>
              </Link>

              {canScanSlips && (
                <Link href="/delivery-slips/scan">
                  <Button variant="outline" className="w-full h-auto p-4">
                    <div className="flex flex-col items-center gap-2">
                      <Icon icon="heroicons:qr-code" className="w-8 h-8" />
                      <span>Scan Parcels</span>
                      <span className="text-xs text-muted-foreground">
                        Use barcode scanner
                      </span>
                    </div>
                  </Button>
                </Link>
              )}

              {canBulkActions && (
                <Link href="/delivery-slips/bulk-receive">
                  <Button variant="outline" className="w-full h-auto p-4">
                    <div className="flex flex-col items-center gap-2">
                      <Icon icon="heroicons:check-circle" className="w-8 h-8" />
                      <span>Bulk Receive</span>
                      <span className="text-xs text-muted-foreground">
                        Process multiple slips
                      </span>
                    </div>
                  </Button>
                </Link>
              )}

              <Button
                variant="outline"
                className="w-full h-auto p-4"
                onClick={handleExport}
                disabled={isExporting}
              >
                <div className="flex flex-col items-center gap-2">
                  <Icon
                    icon="heroicons:document-arrow-down"
                    className="w-8 h-8"
                  />
                  <span>Export Data</span>
                  <span className="text-xs text-muted-foreground">
                    Download as Excel
                  </span>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && deliverySlips.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="space-y-4">
              <Icon
                icon="heroicons:document-text"
                className="w-16 h-16 text-muted-foreground mx-auto"
              />
              <div>
                <h3 className="font-medium text-default-900">
                  No delivery slips found
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {activeFiltersCount > 0
                    ? "Try adjusting your filters or search terms"
                    : "Get started by creating your first delivery slip"}
                </p>
              </div>
              {canCreateSlips && activeFiltersCount === 0 && (
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <Link href="/delivery-slips/create">
                    <Button>
                      <Icon icon="heroicons:plus" className="w-4 h-4 mr-2" />
                      Create First Delivery Slip
                    </Button>
                  </Link>
                  {canScanSlips && (
                    <Link href="/delivery-slips/scan">
                      <Button variant="outline">
                        <Icon
                          icon="heroicons:qr-code"
                          className="w-4 h-4 mr-2"
                        />
                        Open Scanner
                      </Button>
                    </Link>
                  )}
                </div>
              )}
              {activeFiltersCount > 0 && (
                <Button variant="outline" onClick={handleClearAllFilters}>
                  <Icon icon="heroicons:x-mark" className="w-4 h-4 mr-2" />
                  Clear All Filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Main component wrapped with ProtectedRoute
const DeliverySlipsPage = () => {
  return (
    <ProtectedRoute
      requiredPermissions={[PARCELS_PERMISSIONS.DELIVERY_SLIPS_READ]}
      requiredAccessLevel="LIMITED"
      allowedAccountStatuses={["ACTIVE"]}
    >
      <DeliverySlipsPageContent />
    </ProtectedRoute>
  );
};

export default DeliverySlipsPage;
