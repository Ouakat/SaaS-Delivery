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
import ClientTypesTable from "@/components/settings/options/client-types-table";
import ClientTypeForm from "@/components/settings/options/client-type-form";

const ClientTypesPageContent: React.FC = () => {
  const { hasPermission } = useAuthStore();
  const {
    clientTypes,
    clientTypesLoading,
    clientTypesFilters,
    setClientTypesFilters,
    fetchClientTypes,
  } = useOptionsStore();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Permissions
  const canManageOptions = hasPermission(SETTINGS_PERMISSIONS.MANAGE_SETTINGS);

  useEffect(() => {
    if (canManageOptions) {
      fetchClientTypes();
    }
  }, [canManageOptions, fetchClientTypes, clientTypesFilters]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setClientTypesFilters({ ...clientTypesFilters, search: value, page: 1 });
  };

  const handleStatusFilter = (status: string) => {
    const statusValue = status === "all" ? undefined : status === "active";
    setClientTypesFilters({
      ...clientTypesFilters,
      status: statusValue,
      page: 1,
    });
  };

  const activeTypes = clientTypes.filter((type) => type.status);
  const totalTypes = clientTypes.length;

  if (!canManageOptions) {
    return (
      <div className="space-y-6">
        <Alert color="destructive">
          <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to manage client types.
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
              Client Types
            </h1>
          </div>
          <p className="text-default-600">
            Configure different types of clients in your system
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="md"
            onClick={() => fetchClientTypes()}
            disabled={clientTypesLoading}
          >
            <Icon
              icon="heroicons:arrow-path"
              className={`w-4 h-4 mr-2 ${
                clientTypesLoading ? "animate-spin" : ""
              }`}
            />
            Refresh
          </Button>
          <Button size="md" onClick={() => setShowCreateForm(true)}>
            <Icon icon="heroicons:plus" className="w-4 h-4 mr-2" />
            Add Type
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Types</p>
                <p className="text-2xl font-bold">{totalTypes}</p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <Icon
                  icon="heroicons:user-group"
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
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-green-600">
                  {activeTypes.length}
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
                <p className="text-sm text-muted-foreground">Inactive</p>
                <p className="text-2xl font-bold text-gray-600">
                  {totalTypes - activeTypes.length}
                </p>
              </div>
              <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                <Icon
                  icon="heroicons:pause"
                  className="h-4 w-4 text-gray-600"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Usage Rate</p>
                <p className="text-2xl font-bold text-blue-600">
                  {totalTypes > 0
                    ? Math.round((activeTypes.length / totalTypes) * 100)
                    : 0}
                  %
                </p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Icon
                  icon="heroicons:chart-bar"
                  className="h-4 w-4 text-blue-600"
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
                placeholder="Search client types..."
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
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Alert */}
      <Alert color="default">
        <Icon icon="heroicons:information-circle" className="h-4 w-4" />
        <AlertDescription>
          Client types help categorize your customers for better management and
          reporting. You can create custom types based on your business needs.
        </AlertDescription>
      </Alert>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Client Types ({totalTypes})</span>
            <div className="flex gap-2">
              <Badge color="primary" className="text-green-700 bg-green-50">
                {activeTypes.length} Active
              </Badge>
              {totalTypes - activeTypes.length > 0 && (
                <Badge color="primary" className="text-gray-700 bg-gray-50">
                  {totalTypes - activeTypes.length} Inactive
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ClientTypesTable />
        </CardContent>
      </Card>

      {/* Create Form Modal */}
      {showCreateForm && (
        <ClientTypeForm
          open={showCreateForm}
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false);
            fetchClientTypes();
          }}
        />
      )}
    </div>
  );
};

const ClientTypesPage: React.FC = () => {
  return (
    <ProtectedRoute
      requiredPermissions={[SETTINGS_PERMISSIONS.MANAGE_SETTINGS]}
      requiredAccessLevel="FULL"
      allowedAccountStatuses={["ACTIVE"]}
    >
      <ClientTypesPageContent />
    </ProtectedRoute>
  );
};

export default ClientTypesPage;
