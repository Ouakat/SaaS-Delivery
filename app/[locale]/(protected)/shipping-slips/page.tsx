"use client";
import React, { useEffect, useState } from "react";
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
import { ShippingSlipsTable } from "@/components/shipping-slips/shipping-slips-table";
import { ShippingSlipsStats } from "@/components/shipping-slips/shipping-slips-stats";
import { BulkActionsBar } from "@/components/shipping-slips/bulk-actions-bar";
import { useShippingSlipsStore } from "@/lib/stores/parcels/shipping-slips.store";
import { useZonesStore } from "@/lib/stores/parcels/zones.store";
import { useAuthStore } from "@/lib/stores/auth/auth.store";
import { ProtectedRoute } from "@/components/route/protected-route";
import { PARCELS_PERMISSIONS } from "@/lib/constants/parcels";
import { ShippingSlipStatus } from "@/lib/types/parcels/shipping-slips.types";

const ShippingSlipsPageContent = () => {
  const { hasPermission, user } = useAuthStore();
  const {
    shippingSlips,
    pagination,
    filters,
    statistics,
    selectedSlipIds,
    isLoading,
    error,
    setFilters,
    clearFilters,
    fetchShippingSlips,
    fetchStatistics,
    clearSelectedSlipIds,
    resetState,
  } = useShippingSlipsStore();

  const { zones, fetchZones } = useZonesStore();

  const [showStats, setShowStats] = useState(false);
  const [searchTerm, setSearchTerm] = useState(filters.search || "");

  // Check permissions
  const canReadSlips = hasPermission(PARCELS_PERMISSIONS.SHIPPING_SLIPS_READ);
  const canCreateSlips = hasPermission(
    PARCELS_PERMISSIONS.SHIPPING_SLIPS_CREATE
  );
  const canUpdateSlips = hasPermission(
    PARCELS_PERMISSIONS.SHIPPING_SLIPS_UPDATE
  );
  const canDeleteSlips = hasPermission(
    PARCELS_PERMISSIONS.SHIPPING_SLIPS_DELETE
  );
  const canBulkActions = hasPermission(PARCELS_PERMISSIONS.SHIPPING_SLIPS_BULK);

  // Initialize data
  useEffect(() => {
    if (canReadSlips) {
      fetchShippingSlips();
      fetchZones();
      if (user?.userType !== "SELLER") {
        fetchStatistics();
      }
    }

    return () => {
      resetState();
    };
  }, [
    canReadSlips,
    fetchShippingSlips,
    fetchZones,
    fetchStatistics,
    user?.userType,
    resetState,
  ]);

  // Handle search with debouncing
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    const timeoutId = setTimeout(() => {
      setFilters({ search: value, page: 1 });
    }, 500);
    return () => clearTimeout(timeoutId);
  };

  // Handle status filter
  const handleStatusFilter = (status: string) => {
    setFilters({
      status: status === "all" ? undefined : (status as ShippingSlipStatus),
      page: 1,
    });
  };

  // Handle zone filter
  const handleZoneFilter = (zoneId: string) => {
    setFilters({
      destinationZoneId: zoneId === "all" ? undefined : zoneId,
      page: 1,
    });
  };

  // Handle date range filters
  const handleDateRangeFilter = (range: string) => {
    const today = new Date();
    let dateFrom: string | undefined;
    let dateTo: string | undefined;

    switch (range) {
      case "today":
        dateFrom = today.toISOString().split("T")[0];
        dateTo = dateFrom;
        break;
      case "week":
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateFrom = weekAgo.toISOString().split("T")[0];
        dateTo = today.toISOString().split("T")[0];
        break;
      case "month":
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        dateFrom = monthAgo.toISOString().split("T")[0];
        dateTo = today.toISOString().split("T")[0];
        break;
      default:
        dateFrom = undefined;
        dateTo = undefined;
    }

    setFilters({ dateFrom, dateTo, page: 1 });
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
              Shipping Slips
            </h1>
            <p className="text-default-600">
              Manage inter-zone package transfers
            </p>
          </div>
        </div>

        <Alert color="destructive">
          <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to access shipping slips. Please contact
            your administrator.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const activeFiltersCount = Object.values({
    search: filters.search,
    status: filters.status,
    destinationZoneId: filters.destinationZoneId,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
  }).filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-default-900">
            Shipping Slips
          </h1>
          <p className="text-default-600">
            Manage inter-zone package transfers and track shipment operations
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
            <Link href="/shipping-slips/create">
              <Button>
                <Icon icon="heroicons:plus" className="w-4 h-4 mr-2" />
                Create Shipping Slip
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Statistics */}
      {showStats && statistics && (
        <ShippingSlipsStats statistics={statistics} />
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
              All Shipping Slips
              {activeFiltersCount > 0 && (
                <Badge color="secondary" className="ml-2">
                  {activeFiltersCount} filter
                  {activeFiltersCount !== 1 ? "s" : ""} active
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
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
                placeholder="Search by reference or zone name..."
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
                  <SelectItem value={ShippingSlipStatus.PENDING}>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-yellow-500" />
                      Pending
                    </div>
                  </SelectItem>
                  <SelectItem value={ShippingSlipStatus.SHIPPED}>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      Shipped
                    </div>
                  </SelectItem>
                  <SelectItem value={ShippingSlipStatus.RECEIVED}>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      Received
                    </div>
                  </SelectItem>
                  <SelectItem value={ShippingSlipStatus.CANCELLED}>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      Cancelled
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Zone Filter */}
            <div>
              <Select
                value={filters.destinationZoneId || "all"}
                onValueChange={handleZoneFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Zones" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Zones</SelectItem>
                  {zones
                    .filter((zone) => zone.status)
                    .map((zone) => (
                      <SelectItem key={zone.id} value={zone.id}>
                        {zone.name}
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
                <Badge color="secondary" className="gap-1">
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
                <Badge color="secondary" className="gap-1">
                  Status: {filters.status}
                  <button
                    onClick={() => setFilters({ status: undefined, page: 1 })}
                    className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                  >
                    <Icon icon="heroicons:x-mark" className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {filters.destinationZoneId && (
                <Badge color="secondary" className="gap-1">
                  Zone:{" "}
                  {zones.find((z) => z.id === filters.destinationZoneId)
                    ?.name || "Unknown"}
                  <button
                    onClick={() =>
                      setFilters({ destinationZoneId: undefined, page: 1 })
                    }
                    className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                  >
                    <Icon icon="heroicons:x-mark" className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {(filters.dateFrom || filters.dateTo) && (
                <Badge color="secondary" className="gap-1">
                  Date Range
                  <button
                    onClick={() =>
                      setFilters({
                        dateFrom: undefined,
                        dateTo: undefined,
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

      {/* Shipping Slips Table */}
      <Card>
        <CardContent className="p-0">
          <ShippingSlipsTable
            shippingSlips={shippingSlips}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link href="/shipping-slips/create">
                <Button variant="outline" className="w-full h-auto p-4">
                  <div className="flex flex-col items-center gap-2">
                    <Icon icon="heroicons:plus-circle" className="w-8 h-8" />
                    <span>Create Shipping Slip</span>
                    <span className="text-xs text-muted-foreground">
                      Start new transfer
                    </span>
                  </div>
                </Button>
              </Link>

              <Link href="/shipping-slips/scan">
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

              <Button variant="outline" className="w-full h-auto p-4">
                <div className="flex flex-col items-center gap-2">
                  <Icon
                    icon="heroicons:document-arrow-down"
                    className="w-8 h-8"
                  />
                  <span>Export Data</span>
                  <span className="text-xs text-muted-foreground">
                    Download reports
                  </span>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && shippingSlips.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="space-y-4">
              <Icon
                icon="heroicons:truck"
                className="w-16 h-16 text-muted-foreground mx-auto"
              />
              <div>
                <h3 className="font-medium text-default-900">
                  No shipping slips found
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {activeFiltersCount > 0
                    ? "Try adjusting your filters or search terms"
                    : "Get started by creating your first shipping slip"}
                </p>
              </div>
              {canCreateSlips && activeFiltersCount === 0 && (
                <Link href="/shipping-slips/create">
                  <Button>
                    <Icon icon="heroicons:plus" className="w-4 h-4 mr-2" />
                    Create First Shipping Slip
                  </Button>
                </Link>
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

// Main component with ProtectedRoute
const ShippingSlipsPage = () => {
  return (
    <ProtectedRoute
      requiredPermissions={[PARCELS_PERMISSIONS.SHIPPING_SLIPS_READ]}
      requiredAccessLevel="LIMITED"
      allowedAccountStatuses={["ACTIVE"]}
    >
      <ShippingSlipsPageContent />
    </ProtectedRoute>
  );
};

export default ShippingSlipsPage;
