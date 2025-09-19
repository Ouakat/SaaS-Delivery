"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Icon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
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
import { Link } from "@/i18n/routing";
import { useZonesStore } from "@/lib/stores/settings/zones.store";
import { useAuthStore } from "@/lib/stores/auth/auth.store";
import ZonesTable from "@/components/settings/zones/zones-table";
import ZoneStatsCards from "@/components/settings/zones/zone-stats-cards";
import { ProtectedRoute } from "@/components/route/protected-route";
import { SETTINGS_PERMISSIONS } from "@/lib/constants/settings";
import { toast } from "sonner";

const ZonesPageContent = () => {
  const { hasPermission } = useAuthStore();
  const {
    zones,
    loading,
    error,
    filters,
    selectedZones,
    statistics,
    setFilters,
    clearFilters,
    clearSelection,
    fetchZones,
    fetchStatistics,
    bulkDeleteZones,
    bulkToggleStatus,
    exportZones,
    refreshData,
  } = useZonesStore();

  // Permission checks
  const canCreateZones = hasPermission(SETTINGS_PERMISSIONS.CREATE_ZONE);
  const canUpdateZones = hasPermission(SETTINGS_PERMISSIONS.UPDATE_ZONE);
  const canDeleteZones = hasPermission(SETTINGS_PERMISSIONS.DELETE_ZONE);
  const canExportZones = hasPermission(SETTINGS_PERMISSIONS.EXPORT_ZONES);

  // Local state
  const [searchTerm, setSearchTerm] = useState(filters.search || "");
  const [statusFilter, setStatusFilter] = useState<string>(
    filters.status !== undefined ? filters.status.toString() : "all"
  );
  const [bulkAction, setBulkAction] = useState<string>("");
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: "delete" | "toggle" | null;
    count: number;
  }>({
    open: false,
    action: null,
    count: 0,
  });

  // Initialize data
  useEffect(() => {
    fetchZones();
    fetchStatistics();
  }, [fetchZones, fetchStatistics]);

  // Handle search with debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== filters.search) {
        setFilters({ search: searchTerm, page: 1 });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, filters.search, setFilters]);

  // Handle status filter change
  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    const statusValue = value === "all" ? undefined : value === "true";
    setFilters({ status: statusValue, page: 1 });
  };

  // Handle bulk actions
  const handleBulkAction = () => {
    if (!selectedZones.length) {
      toast.warning("Please select zones to perform bulk actions");
      return;
    }

    if (!bulkAction) {
      toast.warning("Please select an action");
      return;
    }

    const action = bulkAction as "delete" | "toggle";
    setConfirmDialog({
      open: true,
      action,
      count: selectedZones.length,
    });
  };

  // Execute bulk action
  const executeBulkAction = async () => {
    const { action } = confirmDialog;

    if (!action || !selectedZones.length) return;

    try {
      let success = false;

      if (action === "delete") {
        success = await bulkDeleteZones(selectedZones);
      } else if (action === "toggle") {
        success = await bulkToggleStatus(selectedZones);
      }

      if (success) {
        clearSelection();
        setBulkAction("");
      }
    } catch (error) {
      console.error("Bulk action failed:", error);
    } finally {
      setConfirmDialog({ open: false, action: null, count: 0 });
    }
  };

  // Handle export
  const handleExport = async () => {
    const downloadUrl = await exportZones(filters);
    if (downloadUrl) {
      // Trigger download
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `zones-export-${
        new Date().toISOString().split("T")[0]
      }.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    await refreshData();
    toast.success("Data refreshed successfully");
  };

  const getBulkActionText = () => {
    switch (bulkAction) {
      case "delete":
        return `Delete ${confirmDialog.count} zone(s)`;
      case "toggle":
        return `Toggle status of ${confirmDialog.count} zone(s)`;
      default:
        return "";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-default-900">
            Zones Management
          </h1>
          <p className="text-default-600">
            Manage delivery zones and organize cities by geographical areas
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canExportZones && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={loading}
            >
              <Icon
                icon="heroicons:document-arrow-down"
                className="w-4 h-4 mr-2"
              />
              Export
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
          >
            <Icon
              icon="heroicons:arrow-path"
              className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>

          {canCreateZones && (
            <Link href="/settings/zones/create">
              <Button>
                <Icon icon="heroicons:plus" className="w-4 h-4 mr-2" />
                Create Zone
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <ZoneStatsCards statistics={statistics} loading={loading} />

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Zones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <Input
                placeholder="Search zones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={handleStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="true">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Active
                  </div>
                </SelectItem>
                <SelectItem value="false">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    Inactive
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Clear Filters */}
            {(filters.search || filters.status !== undefined) && (
              <Button
                variant="outline"
                onClick={clearFilters}
                className="shrink-0"
              >
                Clear Filters
              </Button>
            )}
          </div>

          {/* Bulk Actions */}
          {selectedZones.length > 0 && (canUpdateZones || canDeleteZones) && (
            <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Icon
                  icon="heroicons:check-circle"
                  className="w-5 h-5 text-blue-600"
                />
                <span className="text-sm font-medium">
                  {selectedZones.length} zone(s) selected
                </span>
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <Select value={bulkAction} onValueChange={setBulkAction}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Choose bulk action..." />
                  </SelectTrigger>
                  <SelectContent>
                    {canUpdateZones && (
                      <SelectItem value="toggle">
                        <div className="flex items-center gap-2">
                          <Icon
                            icon="heroicons:arrow-path"
                            className="w-4 h-4"
                          />
                          Toggle Status
                        </div>
                      </SelectItem>
                    )}
                    {canDeleteZones && (
                      <SelectItem value="delete">
                        <div className="flex items-center gap-2">
                          <Icon icon="heroicons:trash" className="w-4 h-4" />
                          Delete Zones
                        </div>
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>

                <Button
                  onClick={handleBulkAction}
                  disabled={!bulkAction}
                  size="sm"
                >
                  Execute
                </Button>

                <Button variant="outline" onClick={clearSelection} size="sm">
                  Clear Selection
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-800">
              <Icon icon="heroicons:exclamation-triangle" className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Zones Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              All Zones
              {zones.length > 0 && (
                <Badge color="secondary" className="ml-2">
                  {zones.length}
                </Badge>
              )}
            </CardTitle>

            {zones.length === 0 && !loading && (
              <div className="text-sm text-default-500">No zones found</div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ZonesTable canEdit={canUpdateZones} canDelete={canDeleteZones} />
        </CardContent>
      </Card>

      {/* Bulk Action Confirmation Dialog */}
      <AlertDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Bulk Action</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {getBulkActionText()}? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeBulkAction}
              className={
                confirmDialog.action === "delete"
                  ? "bg-red-600 hover:bg-red-700"
                  : ""
              }
            >
              {getBulkActionText()}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// Main component wrapped with ProtectedRoute
const ZonesPage = () => {
  return (
    <ProtectedRoute
      requiredPermissions={[SETTINGS_PERMISSIONS.READ_ZONES]}
      requiredAccessLevel="FULL"
      allowedAccountStatuses={["ACTIVE"]}
      requireValidation={true}
    >
      <ZonesPageContent />
    </ProtectedRoute>
  );
};

export default ZonesPage;
