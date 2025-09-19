"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
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
import { useAuthStore } from "@/lib/stores/auth/auth.store";
import { useOptionsStore } from "@/lib/stores/settings/options.store";
import { SETTINGS_PERMISSIONS } from "@/lib/constants/settings";
import ParcelStatusesTable from "@/components/settings/options/parcel-statuses-table";
import ParcelStatusForm from "@/components/settings/options/parcel-status-form";

const ParcelStatusesPageContent: React.FC = () => {
  const { hasPermission } = useAuthStore();
  const {
    parcelStatuses,
    parcelStatusesLoading,
    parcelStatusesFilters,
    setParcelStatusesFilters,
    fetchParcelStatuses,
  } = useOptionsStore();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Permissions
  const canManageOptions = hasPermission(SETTINGS_PERMISSIONS.MANAGE_SETTINGS);

  useEffect(() => {
    if (canManageOptions) {
      fetchParcelStatuses();
    }
  }, [canManageOptions, fetchParcelStatuses, parcelStatusesFilters]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setParcelStatusesFilters({
      ...parcelStatusesFilters,
      search: value,
      page: 1,
    });
  };

  const handleStatusFilter = (status: string) => {
    const statusValue = status === "all" ? undefined : status === "active";
    setParcelStatusesFilters({
      ...parcelStatusesFilters,
      status: statusValue,
      page: 1,
    });
  };

  const handleLockedFilter = (locked: string) => {
    const lockedValue = locked === "all" ? undefined : locked === "locked";
    setParcelStatusesFilters({
      ...parcelStatusesFilters,
      isLocked: lockedValue,
      page: 1,
    });
  };

  const activeStatuses = parcelStatuses.filter((status) => status.status);
  const totalStatuses = parcelStatuses.length;

  if (!canManageOptions) {
    return (
      <div className="space-y-6">
        <Alert color="destructive">
          <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to manage parcel statuses.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/settings/options"
              className="text-muted-foreground hover:text-foreground"
            >
              <Icon icon="heroicons:arrow-left" className="h-4 w-4" />
            </Link>
            <h1 className="text-2xl font-bold text-default-900">
              Parcel Statuses
            </h1>
          </div>
          <p className="text-default-600">
            Configure parcel delivery statuses and tracking states
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchParcelStatuses()}
            disabled={parcelStatusesLoading}
          >
            <Icon
              icon="heroicons:arrow-path"
              className={`w-4 h-4 mr-2 ${
                parcelStatusesLoading ? "animate-spin" : ""
              }`}
            />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setShowCreateForm(true)}>
            <Icon icon="heroicons:plus" className="w-4 h-4 mr-2" />
            Add Status
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{totalStatuses}</p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Icon icon="heroicons:tag" className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-green-600">
                  {activeStatuses.length}
                </p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <Icon
                  icon="heroicons:check-circle"
                  className="h-4 w-4 text-green-600"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Locked</p>
                <p className="text-2xl font-bold text-orange-600">
                  {parcelStatuses.filter((s) => s.isLocked).length}
                </p>
              </div>
              <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                <Icon
                  icon="heroicons:lock-closed"
                  className="h-4 w-4 text-orange-600"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Custom</p>
                <p className="text-2xl font-bold text-purple-600">
                  {parcelStatuses.filter((s) => !s.isLocked).length}
                </p>
              </div>
              <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                <Icon
                  icon="heroicons:cog-6-tooth"
                  className="h-4 w-4 text-purple-600"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search parcel statuses..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex gap-2">
              <Select defaultValue="all" onValueChange={handleStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>

              <Select defaultValue="all" onValueChange={handleLockedFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="locked">System</SelectItem>
                  <SelectItem value="unlocked">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Status Info */}
      <Alert>
        <Icon icon="heroicons:information-circle" className="h-4 w-4" />
        <AlertDescription>
          <div className="flex items-center justify-between">
            <span>
              System statuses are locked and cannot be deleted. You can create
              custom statuses for your specific needs.
            </span>
            <div className="flex gap-1">
              <Badge color="secondary" className="text-xs">
                <Icon icon="heroicons:lock-closed" className="w-3 h-3 mr-1" />
                System
              </Badge>
              <Badge color="secondary" className="text-xs">
                <Icon icon="heroicons:cog-6-tooth" className="w-3 h-3 mr-1" />
                Custom
              </Badge>
            </div>
          </div>
        </AlertDescription>
      </Alert>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Parcel Statuses ({totalStatuses})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ParcelStatusesTable />
        </CardContent>
      </Card>

      {/* Create Form Modal */}
      {showCreateForm && (
        <ParcelStatusForm
          open={showCreateForm}
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false);
            fetchParcelStatuses();
          }}
        />
      )}
    </div>
  );
};

const ParcelStatusesPage: React.FC = () => {
  return (
    <ProtectedRoute
      requiredPermissions={[SETTINGS_PERMISSIONS.MANAGE_SETTINGS]}
      requiredAccessLevel="FULL"
      allowedAccountStatuses={["ACTIVE"]}
    >
      <ParcelStatusesPageContent />
    </ProtectedRoute>
  );
};

export default ParcelStatusesPage;
