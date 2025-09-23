"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "@/i18n/routing";
import { usePickupCitiesStore } from "@/lib/stores/settings/pickup-cities.store";
import { useAuthStore } from "@/lib/stores/auth/auth.store";
import { ProtectedRoute } from "@/components/route/protected-route";
import { SETTINGS_PERMISSIONS } from "@/lib/constants/settings";
import PickupCitiesTable from "@/components/settings/pickup-cities/pickup-cities-table";
import PickupCityStatsCards from "@/components/settings/pickup-cities/pickup-city-stats-cards";
import { toast } from "sonner";
import { cn } from "@/lib/utils/ui.utils";

const PickupCitiesPageContent = () => {
  const router = useRouter();
  const { hasPermission } = useAuthStore();

  // Store state
  const {
    pickupCities,
    statistics,
    isLoading,
    error,
    pagination,
    filters,
    selectedIds,
    setFilters,
    clearFilters,
    setSelectedIds,
    clearSelectedIds,
    fetchPickupCities,
    fetchStatistics,
    deletePickupCity,
    bulkDeletePickupCities,
    bulkToggleStatus,
    togglePickupCityStatus,
    clearError,
  } = usePickupCitiesStore();

  // Local state for UI
  const [searchValue, setSearchValue] = useState(filters.search || "");
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    id: string | null;
  }>({
    open: false,
    id: null,
  });
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  // Permissions
  const canCreate = hasPermission(SETTINGS_PERMISSIONS.CREATE_PICKUP_CITY);
  const canUpdate = hasPermission(SETTINGS_PERMISSIONS.UPDATE_PICKUP_CITY);
  const canDelete = hasPermission(SETTINGS_PERMISSIONS.DELETE_PICKUP_CITY);
  const canExport = hasPermission(SETTINGS_PERMISSIONS.EXPORT_DATA);

  // Initialize data on mount
  useEffect(() => {
    fetchPickupCities();
    fetchStatistics();
  }, []);

  // Handle search with debouncing
  const searchTimerRef = React.useRef<NodeJS.Timeout>();
  const handleSearchChange = (value: string) => {
    setSearchValue(value);

    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    searchTimerRef.current = setTimeout(() => {
      setFilters({ search: value, page: 1 });
    }, 500);
  };

  // Handle filter changes
  const handleStatusFilter = (status: string) => {
    const statusValue = status === "all" ? undefined : status === "true";
    setFilters({ status: statusValue, page: 1 });
  };

  const handleSortChange = (value: string) => {
    const [sortBy, sortOrder] = value.split("-") as [
      "name" | "ref" | "createdAt",
      "asc" | "desc"
    ];
    setFilters({ sortBy, sortOrder });
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setFilters({ page });
  };

  const handlePageSizeChange = (limit: number) => {
    setFilters({ limit, page: 1 });
  };

  // Handle selection
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(pickupCities.map((city) => city.id));
    } else {
      clearSelectedIds();
    }
  };

  const handleSelectItem = (id: string, checked: boolean) => {
    const newSelectedIds = checked
      ? [...selectedIds, id]
      : selectedIds.filter((selectedId) => selectedId !== id);
    setSelectedIds(newSelectedIds);
  };

  // Handle single delete
  const handleDelete = async () => {
    if (!deleteDialog.id) return;

    const success = await deletePickupCity(deleteDialog.id);
    if (success) {
      setDeleteDialog({ open: false, id: null });
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    const success = await bulkDeletePickupCities(selectedIds);
    if (success) {
      setBulkDeleteDialog(false);
      clearSelectedIds();
    }
  };

  // Handle bulk status toggle
  const handleBulkStatusToggle = async (status: boolean) => {
    const success = await bulkToggleStatus(selectedIds, status);
    if (success) {
      clearSelectedIds();
    }
  };

  // Handle single status toggle
  const handleStatusToggle = async (id: string) => {
    await togglePickupCityStatus(id);
  };

  // Handle export
  const handleExport = async () => {
    setExportLoading(true);
    try {
      // This would typically download a file or open a new tab
      // For now, we'll show a success message
      toast.success("Export initiated. Your file will be ready shortly.");
    } catch (error) {
      toast.error("Failed to export pickup cities");
    } finally {
      setExportLoading(false);
    }
  };

  // Calculated values
  const allSelected =
    selectedIds.length === pickupCities.length && pickupCities.length > 0;
  const someSelected =
    selectedIds.length > 0 && selectedIds.length < pickupCities.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-default-900">
            Pickup Cities Management
          </h1>
          <p className="text-default-600">
            Manage pickup locations for your logistics operations
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canExport && (
            <Button
              variant="outline"
              onClick={handleExport}
              disabled={exportLoading}
              className="hidden sm:flex"
            >
              <Icon
                icon={
                  exportLoading
                    ? "heroicons:arrow-path"
                    : "heroicons:arrow-down-tray"
                }
                className={cn("h-4 w-4 mr-2", exportLoading && "animate-spin")}
              />
              Export
            </Button>
          )}

          {canCreate && (
            <Link href="/settings/pickup-cities/create">
              <Button>
                <Icon icon="heroicons:plus" className="h-4 w-4 mr-2" />
                Add Pickup City
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <PickupCityStatsCards statistics={statistics} isLoading={isLoading} />

      {/* Error Alert */}
      {error && (
        <Alert color="destructive">
          <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            {error}
            <Button variant="ghost" size="md" onClick={clearError}>
              <Icon icon="heroicons:x-mark" className="h-4 w-4" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Filters and Actions */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle className="text-lg">Pickup Cities</CardTitle>

            {/* Bulk Actions */}
            {selectedIds.length > 0 && (
              <div className="flex items-center gap-2">
                <Badge color="secondary" className="px-2 py-1">
                  {selectedIds.length} selected
                </Badge>

                {canUpdate && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="md">
                        <Icon
                          icon="heroicons:chevron-down"
                          className="h-4 w-4 ml-1"
                        />
                        Bulk Actions
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem
                        onClick={() => handleBulkStatusToggle(true)}
                      >
                        <Icon
                          icon="heroicons:check-circle"
                          className="h-4 w-4 mr-2"
                        />
                        Activate Selected
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleBulkStatusToggle(false)}
                      >
                        <Icon
                          icon="heroicons:x-circle"
                          className="h-4 w-4 mr-2"
                        />
                        Deactivate Selected
                      </DropdownMenuItem>
                      {canDelete && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setBulkDeleteDialog(true)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Icon
                              icon="heroicons:trash"
                              className="h-4 w-4 mr-2"
                            />
                            Delete Selected
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                <Button variant="ghost" size="md" onClick={clearSelectedIds}>
                  <Icon icon="heroicons:x-mark" className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex-1">
              <Input
                placeholder="Search pickup cities..."
                value={searchValue}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="max-w-sm"
              />
            </div>

            <div className="flex items-center gap-2">
              <Select
                value={
                  filters.status === undefined
                    ? "all"
                    : filters.status.toString()
                }
                onValueChange={handleStatusFilter}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={`${filters.sortBy}-${filters.sortOrder}`}
                onValueChange={handleSortChange}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name-asc">Name A-Z</SelectItem>
                  <SelectItem value="name-desc">Name Z-A</SelectItem>
                  <SelectItem value="ref-asc">Reference A-Z</SelectItem>
                  <SelectItem value="ref-desc">Reference Z-A</SelectItem>
                  <SelectItem value="createdAt-desc">Newest First</SelectItem>
                  <SelectItem value="createdAt-asc">Oldest First</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="ghost" onClick={clearFilters} className="px-2">
                <Icon icon="heroicons:x-mark" className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Table */}
          <PickupCitiesTable
            data={pickupCities}
            loading={isLoading}
            pagination={pagination}
            selectedIds={selectedIds}
            onSelectAll={handleSelectAll}
            onSelectItem={handleSelectItem}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            onEdit={(id) => router.push(`/settings/pickup-cities/${id}/edit`)}
            onView={(id) => router.push(`/settings/pickup-cities/${id}`)}
            onDelete={(id) => setDeleteDialog({ open: true, id })}
            onToggleStatus={handleStatusToggle}
            canUpdate={canUpdate}
            canDelete={canDelete}
          />
        </CardContent>
      </Card>

      {/* Single Delete Dialog */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, id: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Pickup City</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this pickup city? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Dialog */}
      <AlertDialog open={bulkDeleteDialog} onOpenChange={setBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Selected Pickup Cities</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedIds.length} selected
              pickup cities? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Delete {selectedIds.length} Cities
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// Main component with protection
const PickupCitiesPage = () => {
  return (
    <ProtectedRoute
      requiredPermissions={[SETTINGS_PERMISSIONS.READ_PICKUP_CITIES]}
      requiredAccessLevel="FULL"
      allowedAccountStatuses={["ACTIVE"]}
      requireValidation={true}
    >
      <PickupCitiesPageContent />
    </ProtectedRoute>
  );
};

export default PickupCitiesPage;
