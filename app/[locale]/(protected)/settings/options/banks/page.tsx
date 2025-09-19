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
import BanksTable from "@/components/settings/options/banks-table";
import BankForm from "@/components/settings/options/bank-form";

const BanksPageContent: React.FC = () => {
  const { hasPermission } = useAuthStore();
  const { banks, banksLoading, banksFilters, setBanksFilters, fetchBanks } =
    useOptionsStore();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Permissions
  const canManageOptions = hasPermission(SETTINGS_PERMISSIONS.MANAGE_SETTINGS);

  useEffect(() => {
    if (canManageOptions) {
      fetchBanks();
    }
  }, [canManageOptions, fetchBanks, banksFilters]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setBanksFilters({ ...banksFilters, search: value, page: 1 });
  };

  const handleStatusFilter = (status: string) => {
    const statusValue = status === "all" ? undefined : status === "active";
    setBanksFilters({ ...banksFilters, status: statusValue, page: 1 });
  };

  const handleCodeFilter = (code: string) => {
    const codeValue = code === "all" ? undefined : code;
    setBanksFilters({ ...banksFilters, code: codeValue, page: 1 });
  };

  const activeBanks = banks.filter((bank) => bank.status);
  const totalBanks = banks.length;
  const uniqueCodes = [...new Set(banks.map((bank) => bank.code))].sort();

  if (!canManageOptions) {
    return (
      <div className="space-y-6">
        <Alert color="destructive">
          <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to manage banks.
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
            <h1 className="text-2xl font-bold text-default-900">Banks</h1>
          </div>
          <p className="text-default-600">
            Manage banking institutions for payment processing
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchBanks()}
            disabled={banksLoading}
          >
            <Icon
              icon="heroicons:arrow-path"
              className={`w-4 h-4 mr-2 ${banksLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setShowCreateForm(true)}>
            <Icon icon="heroicons:plus" className="w-4 h-4 mr-2" />
            Add Bank
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Banks</p>
                <p className="text-2xl font-bold">{totalBanks}</p>
              </div>
              <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                <Icon
                  icon="heroicons:building-library"
                  className="h-4 w-4 text-purple-600"
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
                  {activeBanks.length}
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
                  {totalBanks - activeBanks.length}
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
                <p className="text-sm text-muted-foreground">Unique Codes</p>
                <p className="text-2xl font-bold text-blue-600">
                  {uniqueCodes.length}
                </p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Icon
                  icon="heroicons:hashtag"
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
                placeholder="Search banks by name or code..."
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

              {uniqueCodes.length > 0 && (
                <Select defaultValue="all" onValueChange={handleCodeFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Code" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Codes</SelectItem>
                    {uniqueCodes.map((code) => (
                      <SelectItem key={code} value={code}>
                        {code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Alert */}
      <Alert>
        <Icon icon="heroicons:information-circle" className="h-4 w-4" />
        <AlertDescription>
          Banks are used for payment processing and financial transactions. Each
          bank should have a unique code for identification purposes.
        </AlertDescription>
      </Alert>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Banks ({totalBanks})</span>
            <div className="flex gap-2">
              <Badge color="primary" className="text-green-700 bg-green-50">
                {activeBanks.length} Active
              </Badge>
              {totalBanks - activeBanks.length > 0 && (
                <Badge color="primary" className="text-gray-700 bg-gray-50">
                  {totalBanks - activeBanks.length} Inactive
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <BanksTable />
        </CardContent>
      </Card>

      {/* Create Form Modal */}
      {showCreateForm && (
        <BankForm
          open={showCreateForm}
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false);
            fetchBanks();
          }}
        />
      )}
    </div>
  );
};

const BanksPage: React.FC = () => {
  return (
    <ProtectedRoute
      requiredPermissions={[SETTINGS_PERMISSIONS.MANAGE_SETTINGS]}
      requiredAccessLevel="FULL"
      allowedAccountStatuses={["ACTIVE"]}
    >
      <BanksPageContent />
    </ProtectedRoute>
  );
};

export default BanksPage;
