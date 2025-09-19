"use client";

import React, { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Link } from "@/i18n/routing";
import { ProtectedRoute } from "@/components/route/protected-route";
import { useAuthStore } from "@/lib/stores/auth/auth.store";
import { useOptionsStore } from "@/lib/stores/settings/options.store";
import { SETTINGS_PERMISSIONS } from "@/lib/constants/settings";
import type { OptionCategory } from "@/lib/types/settings/options.types";

const optionCategories: OptionCategory[] = [
  {
    id: "parcel-statuses",
    title: "Parcel Statuses",
    description: "Manage parcel delivery statuses and their configurations",
    icon: "heroicons:tag",
    href: "/settings/options/parcel-statuses",
    color: "bg-blue-50 border-blue-200 text-blue-700",
  },
  {
    id: "client-types",
    title: "Client Types",
    description: "Configure different types of clients in your system",
    icon: "heroicons:user-group",
    href: "/settings/options/client-types",
    color: "bg-green-50 border-green-200 text-green-700",
  },
  {
    id: "banks",
    title: "Banks",
    description: "Manage banking institutions for payment processing",
    icon: "heroicons:building-library",
    href: "/settings/options/banks",
    color: "bg-purple-50 border-purple-200 text-purple-700",
  },
];

const OptionsPageContent: React.FC = () => {
  const { hasPermission } = useAuthStore();
  const {
    stats,
    statsLoading,
    parcelStatuses,
    clientTypes,
    banks,
    fetchStats,
    refreshAll,
  } = useOptionsStore();

  // Check permissions
  const canManageOptions = hasPermission(SETTINGS_PERMISSIONS.MANAGE_SETTINGS);

  useEffect(() => {
    if (canManageOptions) {
      fetchStats();
    }
  }, [canManageOptions, fetchStats]);

  const getHealthScore = () => {
    if (!stats) return 0;
    const totalItems =
      stats.totalParcelStatuses + stats.totalClientTypes + stats.totalBanks;
    const activeItems =
      stats.activeParcelStatuses + stats.activeClientTypes + stats.activeBanks;
    return totalItems > 0 ? Math.round((activeItems / totalItems) * 100) : 0;
  };

  const handleRefreshAll = async () => {
    await refreshAll();
  };

  if (!canManageOptions) {
    return (
      <div className="space-y-6">
        <Alert color="destructive">
          <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to access options management.
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
          <h1 className="text-2xl font-bold text-default-900">
            System Options
          </h1>
          <p className="text-default-600">
            Configure parcel statuses, client types, and banking options
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefreshAll}>
            <Icon icon="heroicons:arrow-path" className="w-4 h-4 mr-2" />
            Refresh All
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-default-600">
                    System Health
                  </p>
                  <p className="text-3xl font-bold text-default-900">
                    {getHealthScore()}%
                  </p>
                </div>
                <div className="h-12 w-12 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center">
                  <Icon icon="heroicons:heart" className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="mt-4">
                <Progress
                  value={getHealthScore()}
                  className="h-2"
                  indicatorClassName={
                    getHealthScore() > 80
                      ? "bg-green-500"
                      : getHealthScore() > 60
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-default-600">
                    Parcel Statuses
                  </p>
                  <p className="text-3xl font-bold text-default-900">
                    {stats.activeParcelStatuses}/{stats.totalParcelStatuses}
                  </p>
                </div>
                <div className="h-12 w-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                  <Icon icon="heroicons:tag" className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-default-600">
                    Client Types
                  </p>
                  <p className="text-3xl font-bold text-default-900">
                    {stats.activeClientTypes}/{stats.totalClientTypes}
                  </p>
                </div>
                <div className="h-12 w-12 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center">
                  <Icon
                    icon="heroicons:user-group"
                    className="h-6 w-6 text-white"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-default-600">Banks</p>
                  <p className="text-3xl font-bold text-default-900">
                    {stats.activeBanks}/{stats.totalBanks}
                  </p>
                </div>
                <div className="h-12 w-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center">
                  <Icon
                    icon="heroicons:building-library"
                    className="h-6 w-6 text-white"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Option Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {optionCategories.map((category) => (
          <Card
            key={category.id}
            className="group hover:shadow-md transition-shadow"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className={`p-3 rounded-lg ${category.color}`}>
                  <Icon icon={category.icon} className="h-6 w-6" />
                </div>
                <Link href={category.href}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Icon icon="heroicons:arrow-right" className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
              <CardTitle className="text-lg">{category.title}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-default-600 mb-4">
                {category.description}
              </p>

              {/* Category-specific stats */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {stats && (
                    <>
                      {category.id === "parcel-statuses" && (
                        <Badge color="secondary">
                          {stats.totalParcelStatuses} total
                        </Badge>
                      )}
                      {category.id === "client-types" && (
                        <Badge color="secondary">
                          {stats.totalClientTypes} total
                        </Badge>
                      )}
                      {category.id === "banks" && (
                        <Badge color="secondary">
                          {stats.totalBanks} total
                        </Badge>
                      )}
                    </>
                  )}
                </div>
                <Link href={category.href}>
                  <Button variant="outline" size="sm">
                    Manage
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon icon="heroicons:bolt" className="w-5 h-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Link href="/settings/options/parcel-statuses">
              <div className="p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <Icon
                    icon="heroicons:plus"
                    className="w-5 h-5 text-blue-600"
                  />
                  <div>
                    <div className="font-medium">Add Parcel Status</div>
                    <div className="text-sm text-muted-foreground">
                      Create new status
                    </div>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/settings/options/client-types">
              <div className="p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <Icon
                    icon="heroicons:plus"
                    className="w-5 h-5 text-green-600"
                  />
                  <div>
                    <div className="font-medium">Add Client Type</div>
                    <div className="text-sm text-muted-foreground">
                      Create new type
                    </div>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/settings/options/banks">
              <div className="p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <Icon
                    icon="heroicons:plus"
                    className="w-5 h-5 text-purple-600"
                  />
                  <div>
                    <div className="font-medium">Add Bank</div>
                    <div className="text-sm text-muted-foreground">
                      Add new bank
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon icon="heroicons:clock" className="w-5 h-5" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-sm">Options system operational</span>
              </div>
              <Badge color="secondary" className="text-green-700 bg-green-50">
                Active
              </Badge>
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <span className="text-sm">All categories configured</span>
              </div>
              <Badge color="secondary" className="text-blue-700 bg-blue-50">
                Ready
              </Badge>
            </div>

            {stats && getHealthScore() < 80 && (
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                  <span className="text-sm">
                    Some options may need attention
                  </span>
                </div>
                <Badge
                  color="secondary"
                  className="text-yellow-700 bg-yellow-50"
                >
                  Warning
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const OptionsPage: React.FC = () => {
  return (
    <ProtectedRoute
      requiredPermissions={[SETTINGS_PERMISSIONS.MANAGE_SETTINGS]}
      requiredAccessLevel="FULL"
      allowedAccountStatuses={["ACTIVE"]}
    >
      <OptionsPageContent />
    </ProtectedRoute>
  );
};

export default OptionsPage;
