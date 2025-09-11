"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Link } from "@/i18n/routing";
import RolesTable from "@/components/roles/roles-table";
import { useAuthStore } from "@/lib/stores/auth.store";
import { rolesApiClient } from "@/lib/api/clients/roles.client";
import { toast } from "sonner";

interface RoleStats {
  total: number;
  active: number;
  inactive: number;
  userCount: number;
  byUserType: Record<string, number>;
  categories: string[];
}

const RolesPage = () => {
  const { hasPermission } = useAuthStore();
  const [stats, setStats] = useState<RoleStats | null>(null);
  const [availablePermissions, setAvailablePermissions] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Permission checks
  const canViewRoles = hasPermission("roles:view");
  const canCreateRoles = hasPermission("roles:create");

  // Fetch roles statistics and available permissions
  useEffect(() => {
    const fetchData = async () => {
      if (!canViewRoles) return;

      try {
        setLoading(true);

        // Fetch available permissions
        const permissionsResult =
          await rolesApiClient.getAvailablePermissions();
        if (permissionsResult.success) {
          setAvailablePermissions(permissionsResult.data);
        }

        // Fetch roles to calculate stats
        const rolesResult = await rolesApiClient.getRoles({ limit: 100 });
        if (rolesResult.success && rolesResult.data[0]) {
          const roles = rolesResult.data[0].data;

          // Calculate statistics
          const roleStats: RoleStats = {
            total: roles.length,
            active: roles.filter((r: any) => r.isActive).length,
            inactive: roles.filter((r: any) => !r.isActive).length,
            userCount: roles.reduce(
              (sum: number, r: any) => sum + r.userCount,
              0
            ),
            byUserType: {},
            categories: [],
          };

          // Count roles by user type
          roles.forEach((role: any) => {
            role.userTypes.forEach((userType: string) => {
              roleStats.byUserType[userType] =
                (roleStats.byUserType[userType] || 0) + 1;
            });
          });

          // Get permission categories
          if (permissionsResult.success) {
            roleStats.categories = permissionsResult.data.categories || [];
          }

          setStats(roleStats);
        }
      } catch (error) {
        console.error("Error fetching roles data:", error);
        toast.error("Failed to fetch roles data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [canViewRoles]);

  if (!canViewRoles) {
    return (
      <div className="container mx-auto py-8">
        <Alert color="destructive">
          <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to view roles. Please contact your
            administrator.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const userTypeConfig = {
    ADMIN: {
      label: "Admin",
      color: "bg-red-100 text-red-800",
      icon: "heroicons:shield-check",
    },
    MANAGER: {
      label: "Manager",
      color: "bg-orange-100 text-orange-800",
      icon: "heroicons:user-group",
    },
    SUPPORT: {
      label: "Support",
      color: "bg-blue-100 text-blue-800",
      icon: "heroicons:chat-bubble-left-right",
    },
    SELLER: {
      label: "Seller",
      color: "bg-green-100 text-green-800",
      icon: "heroicons:currency-dollar",
    },
    LIVREUR: {
      label: "Delivery",
      color: "bg-purple-100 text-purple-800",
      icon: "heroicons:truck",
    },
    CUSTOMER: {
      label: "Customer",
      color: "bg-indigo-100 text-indigo-800",
      icon: "heroicons:user",
    },
    BUYER: {
      label: "Buyer",
      color: "bg-green-100 text-green-800",
      icon: "heroicons:shopping-cart",
    },
    VENDOR: {
      label: "Vendor",
      color: "bg-yellow-100 text-yellow-800",
      icon: "heroicons:building-storefront",
    },
    WAREHOUSE: {
      label: "Warehouse",
      color: "bg-gray-100 text-gray-800",
      icon: "heroicons:building-office-2",
    },
    DISPATCHER: {
      label: "Dispatcher",
      color: "bg-cyan-100 text-cyan-800",
      icon: "heroicons:map",
    },
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-default-900">
            Roles & Permissions Management
          </h1>
          <p className="text-default-600">
            Manage user roles, permissions, and access control for your
            organization
          </p>
        </div>

        {canCreateRoles && (
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" asChild>
                    <Link href="/roles/permissions">
                      <Icon icon="heroicons:key" className="w-4 h-4 mr-2" />
                      View Permissions
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>View all available permissions and categories</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Button asChild>
              <Link href="/roles/create">
                <Icon icon="heroicons:plus" className="w-4 h-4 mr-2" />
                Create Role
              </Link>
            </Button>
          </div>
        )}
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Roles</CardTitle>
              <Icon
                icon="heroicons:identification"
                className="h-4 w-4 text-muted-foreground"
              />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="text-green-600">{stats.active} active</span>
                <span>•</span>
                <span className="text-red-600">{stats.inactive} inactive</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Icon
                icon="heroicons:users"
                className="h-4 w-4 text-muted-foreground"
              />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.userCount}</div>
              <p className="text-xs text-muted-foreground">
                Users with assigned roles
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Permission Categories
              </CardTitle>
              <Icon
                icon="heroicons:key"
                className="h-4 w-4 text-muted-foreground"
              />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.categories.length}
              </div>
              <p className="text-xs text-muted-foreground">
                Available permission types
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">User Types</CardTitle>
              <Icon
                icon="heroicons:user-group"
                className="h-4 w-4 text-muted-foreground"
              />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Object.keys(stats.byUserType).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Different user types configured
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* User Types Distribution */}
      {stats && Object.keys(stats.byUserType).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon icon="heroicons:chart-bar" className="w-5 h-5" />
              Roles Distribution by User Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.byUserType).map(([userType, count]) => {
                const config =
                  userTypeConfig[userType as keyof typeof userTypeConfig];
                return (
                  <TooltipProvider key={userType}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                            config?.color || "bg-gray-100 text-gray-800"
                          }`}
                        >
                          <Icon
                            icon={config?.icon || "heroicons:user"}
                            className="w-4 h-4"
                          />
                          <span className="font-medium">
                            {config?.label || userType}
                          </span>
                          <Badge variant="outline" className="ml-1">
                            {count}
                          </Badge>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          {count} role(s) available for{" "}
                          {config?.label || userType} users
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Permission Categories Overview */}
      {availablePermissions && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon icon="heroicons:key" className="w-5 h-5" />
              Available Permission Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {availablePermissions.categories.map((category: string) => {
                const categoryPermissions =
                  availablePermissions.permissions.filter(
                    (p: any) =>
                      p.category.toLowerCase() === category.toLowerCase()
                  );
                return (
                  <TooltipProvider key={category}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                          <Icon
                            icon="heroicons:folder"
                            className="w-4 h-4 text-blue-600"
                          />
                          <div>
                            <div className="font-medium capitalize">
                              {category}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {categoryPermissions.length} permissions
                            </div>
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="max-w-xs">
                          <div className="font-medium mb-2">
                            {category} Permissions:
                          </div>
                          <div className="space-y-1">
                            {categoryPermissions.slice(0, 5).map((p: any) => (
                              <div key={p.key} className="text-xs">
                                {p.key}
                              </div>
                            ))}
                            {categoryPermissions.length > 5 && (
                              <div className="text-xs text-muted-foreground">
                                +{categoryPermissions.length - 5} more...
                              </div>
                            )}
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Roles Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon icon="heroicons:identification" className="w-5 h-5" />
            All Roles
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <RolesTable />
        </CardContent>
      </Card>
    </div>
  );
};

export default RolesPage;
