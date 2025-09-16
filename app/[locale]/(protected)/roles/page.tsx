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
import { ProtectedRoute } from "@/components/route/protected-route";
import {
  ROLE_PERMISSIONS,
  ADMIN_PERMISSIONS,
} from "@/lib/constants/permissions";
import { rolesApiClient } from "@/lib/api/clients/roles.client";
import { toast } from "sonner";

interface RoleStats {
  total: number;
  active: number;
  inactive: number;
  userCount: number;
  byUserType: Record<string, number>;
  categories: string[];
  visibleRoles: number; // New field for roles visible to current user
  managedUserTypes: string[]; // User types the current user can manage
}

const RolesPageContent = () => {
  const { hasPermission, user, hasAnyPermission } = useAuthStore();
  const [stats, setStats] = useState<RoleStats | null>(null);
  const [availablePermissions, setAvailablePermissions] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Permission checks - using the constants
  const canViewRoles = hasPermission(ROLE_PERMISSIONS.READ_ROLES);
  const canCreateRoles = hasPermission(ROLE_PERMISSIONS.CREATE_ROLE);
  const canUpdateRoles = hasPermission(ROLE_PERMISSIONS.UPDATE_ROLE);
  const canDeleteRoles = hasPermission(ROLE_PERMISSIONS.DELETE_ROLE);
  const canAssignPermissions = hasPermission(
    ROLE_PERMISSIONS.ASSIGN_PERMISSIONS
  );
  const hasAdminAccess = hasPermission(ADMIN_PERMISSIONS.FULL_ACCESS);

  // Check if user can view specific role based on hierarchy
  const canViewRole = (role: any) => {
    if (!role || !user) return false;

    // Admins can view all roles
    if (hasAdminAccess || user.userType === "ADMIN") return true;

    // Managers can view roles for user types they can manage
    if (user.userType === "MANAGER") {
      const managedUserTypes = [
        "MANAGER",
        "SUPPORT",
        "SELLER",
        "LIVREUR",
        "CUSTOMER",
        "BUYER",
        "VENDOR",
        "WAREHOUSE",
        "DISPATCHER",
      ];
      return role.userTypes.some((userType: string) =>
        managedUserTypes.includes(userType)
      );
    }

    // Support can view customer roles
    if (user.userType === "SUPPORT") {
      return role.userTypes.includes("CUSTOMER");
    }

    // Other users can only view roles that apply to their own user type
    return role.userTypes.includes(user.userType);
  };

  // Check if user can view specific user type
  const canViewUserType = (userType: string) => {
    if (!user) return false;

    if (hasAdminAccess || user.userType === "ADMIN") return true;

    if (user.userType === "MANAGER") {
      return [
        "MANAGER",
        "SUPPORT",
        "SELLER",
        "LIVREUR",
        "CUSTOMER",
        "BUYER",
        "VENDOR",
        "WAREHOUSE",
        "DISPATCHER",
      ].includes(userType);
    }

    if (user.userType === "SUPPORT") {
      return ["CUSTOMER"].includes(userType);
    }

    return userType === user.userType;
  };

  // Check if user can view specific permission category
  const canViewCategory = (category: string) => {
    if (!user) return false;

    // Admin categories only for admins
    if (
      ["admin", "tenants"].includes(category.toLowerCase()) &&
      user.userType !== "ADMIN"
    ) {
      return false;
    }

    return true;
  };

  // Get user types the current user can manage
  const getManagedUserTypes = () => {
    if (!user) return [];

    if (hasAdminAccess || user.userType === "ADMIN") {
      return [
        "ADMIN",
        "MANAGER",
        "SUPPORT",
        "SELLER",
        "LIVREUR",
        "CUSTOMER",
        "BUYER",
        "VENDOR",
        "WAREHOUSE",
        "DISPATCHER",
      ];
    }

    if (user.userType === "MANAGER") {
      return [
        "MANAGER",
        "SUPPORT",
        "SELLER",
        "LIVREUR",
        "CUSTOMER",
        "BUYER",
        "VENDOR",
        "WAREHOUSE",
        "DISPATCHER",
      ];
    }

    if (user.userType === "SUPPORT") {
      return ["CUSTOMER"];
    }

    return [user.userType];
  };

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
          const allRoles = rolesResult.data[0].data;
          const visibleRoles = allRoles.filter((role: any) =>
            canViewRole(role)
          );
          const managedUserTypes = getManagedUserTypes();

          // Calculate statistics
          const roleStats: RoleStats = {
            total: allRoles.length,
            active: allRoles.filter((r: any) => r.isActive).length,
            inactive: allRoles.filter((r: any) => !r.isActive).length,
            userCount: allRoles.reduce(
              (sum: number, r: any) => sum + r.userCount,
              0
            ),
            visibleRoles: visibleRoles.length,
            managedUserTypes: managedUserTypes,
            byUserType: {},
            categories: [],
          };

          // Count roles by user type (only visible ones)
          visibleRoles.forEach((role: any) => {
            role.userTypes.forEach((userType: string) => {
              if (canViewUserType(userType)) {
                roleStats.byUserType[userType] =
                  (roleStats.byUserType[userType] || 0) + 1;
              }
            });
          });

          // Get visible permission categories
          if (permissionsResult.success) {
            roleStats.categories = permissionsResult.data.categories.filter(
              (category: string) => canViewCategory(category)
            );
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
  }, [canViewRoles, user]);

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

  const hasAnyRolePermissions = hasAnyPermission([
    ROLE_PERMISSIONS.READ_ROLES,
    ROLE_PERMISSIONS.CREATE_ROLE,
    ROLE_PERMISSIONS.UPDATE_ROLE,
    ROLE_PERMISSIONS.DELETE_ROLE,
    ROLE_PERMISSIONS.ASSIGN_PERMISSIONS,
  ]);

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
          {user?.userType !== "ADMIN" && (
            <p className="text-sm text-muted-foreground mt-1">
              Showing roles within your management scope ({user?.userType})
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {canViewRoles && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button color="primary" asChild>
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
          )}

          {canCreateRoles && (
            <Button asChild>
              <Link href="/roles/create">
                <Icon icon="heroicons:plus" className="w-4 h-4 mr-2" />
                Create Role
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Permission Level Indicator */}
      {user?.userType !== "ADMIN" && (
        <Alert color="info" variant="soft">
          <Icon icon="heroicons:information-circle" className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <div className="font-medium">Your Access Level</div>
              <div className="text-sm">
                {user?.userType === "MANAGER" &&
                  "As a Manager, you can view and manage roles for most user types (excluding ADMIN)."}
                {user?.userType === "SUPPORT" &&
                  "As Support staff, you can view customer-related roles and permissions."}
                {!["ADMIN", "MANAGER", "SUPPORT"].includes(
                  user?.userType || ""
                ) && "You can view roles that apply to your user type."}
              </div>
              <div className="flex gap-2 mt-2">
                <Badge color={canCreateRoles ? "success" : "secondary"}>
                  {canCreateRoles ? "Can Create Roles" : "View Only"}
                </Badge>
                <Badge color={canAssignPermissions ? "success" : "secondary"}>
                  {canAssignPermissions
                    ? "Can Assign Permissions"
                    : "Limited Permission Access"}
                </Badge>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* No Permissions Warning */}
      {!hasAnyRolePermissions && (
        <Alert color="warning">
          <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
          <AlertDescription>
            You have very limited access to role management features. Contact
            your administrator for additional permissions.
          </AlertDescription>
        </Alert>
      )}

      {/* Development Mode - Permissions Info */}
      {process.env.NODE_ENV === "development" && (
        <Alert color="secondary" variant="soft">
          <Icon icon="heroicons:code-bracket" className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <div className="font-medium">
                Dev Info - Your Role Permissions
              </div>
              <div className="text-xs space-y-1">
                <div>Can View Roles: {canViewRoles ? "✅" : "❌"}</div>
                <div>Can Create Roles: {canCreateRoles ? "✅" : "❌"}</div>
                <div>Can Update Roles: {canUpdateRoles ? "✅" : "❌"}</div>
                <div>Can Delete Roles: {canDeleteRoles ? "✅" : "❌"}</div>
                <div>
                  Can Assign Permissions: {canAssignPermissions ? "✅" : "❌"}
                </div>
                <div>
                  Managed User Types: {stats?.managedUserTypes.length || 0}
                </div>
                <div>Your Type: {user?.userType}</div>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {user?.userType === "ADMIN" ? "Total Roles" : "Visible Roles"}
              </CardTitle>
              <Icon
                icon="heroicons:identification"
                className="h-4 w-4 text-muted-foreground"
              />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {user?.userType === "ADMIN" ? stats.total : stats.visibleRoles}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {user?.userType === "ADMIN" ? (
                  <>
                    <span className="text-green-600">
                      {stats.active} active
                    </span>
                    <span>•</span>
                    <span className="text-red-600">
                      {stats.inactive} inactive
                    </span>
                  </>
                ) : (
                  <span>Within your access scope</span>
                )}
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
                {user?.userType === "ADMIN"
                  ? "Available permission types"
                  : "Accessible categories"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Managed User Types
              </CardTitle>
              <Icon
                icon="heroicons:user-group"
                className="h-4 w-4 text-muted-foreground"
              />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.managedUserTypes.length}
              </div>
              <p className="text-xs text-muted-foreground">
                User types you can manage
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Your Management Scope */}
      {stats &&
        stats.managedUserTypes.length > 0 &&
        user?.userType !== "ADMIN" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon icon="heroicons:shield-check" className="w-5 h-5" />
                Your Management Scope
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  You can view and manage roles for the following user types:
                </div>
                <div className="flex flex-wrap gap-2">
                  {stats.managedUserTypes.map((userType) => {
                    const config =
                      userTypeConfig[userType as keyof typeof userTypeConfig];
                    const roleCount = stats.byUserType[userType] || 0;
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
                              {roleCount > 0 && (
                                <Badge color="primary" className="ml-1">
                                  {roleCount}
                                </Badge>
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              {roleCount > 0
                                ? `${roleCount} role(s) available for ${
                                    config?.label || userType
                                  } users`
                                : `No roles currently defined for ${
                                    config?.label || userType
                                  } users`}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

      {/* User Types Distribution */}
      {stats && Object.keys(stats.byUserType).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon icon="heroicons:chart-bar" className="w-5 h-5" />
              {user?.userType === "ADMIN"
                ? "Roles Distribution by User Type"
                : "Accessible Roles by User Type"}
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
                          <Badge color="primary" className="ml-1">
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
      {availablePermissions && stats && stats.categories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon icon="heroicons:key" className="w-5 h-5" />
              {user?.userType === "ADMIN"
                ? "Available Permission Categories"
                : "Accessible Permission Categories"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {stats.categories.map((category: string) => {
                const categoryPermissions =
                  availablePermissions.permissions.filter(
                    (p: any) =>
                      p.category.toLowerCase() === category.toLowerCase()
                  );
                const isRestricted =
                  ["admin", "tenants"].includes(category.toLowerCase()) &&
                  user?.userType !== "ADMIN";
                return (
                  <TooltipProvider key={category}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className={`flex items-center gap-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer ${
                            isRestricted ? "opacity-75" : ""
                          }`}
                        >
                          <Icon
                            icon="heroicons:folder"
                            className="w-4 h-4 text-blue-600"
                          />
                          <div>
                            <div className="font-medium capitalize flex items-center gap-1">
                              {category}
                              {isRestricted && (
                                <Icon
                                  icon="heroicons:lock-closed"
                                  className="w-3 h-3 text-yellow-600"
                                />
                              )}
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
                          {isRestricted && (
                            <div className="text-xs text-yellow-600 mt-2">
                              Limited access to this category
                            </div>
                          )}
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

      {/* Quick Actions for Non-Admins */}
      {user?.userType !== "ADMIN" && hasAnyRolePermissions && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon icon="heroicons:bolt" className="w-5 h-5" />
              Available Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {canViewRoles && (
                <div className="flex items-center gap-2 text-sm">
                  <Icon
                    icon="heroicons:eye"
                    className="w-4 h-4 text-green-600"
                  />
                  <span>View Roles</span>
                </div>
              )}
              {canCreateRoles && (
                <div className="flex items-center gap-2 text-sm">
                  <Icon
                    icon="heroicons:plus"
                    className="w-4 h-4 text-green-600"
                  />
                  <span>Create Roles</span>
                </div>
              )}
              {canUpdateRoles && (
                <div className="flex items-center gap-2 text-sm">
                  <Icon
                    icon="heroicons:pencil"
                    className="w-4 h-4 text-green-600"
                  />
                  <span>Edit Roles</span>
                </div>
              )}
              {canAssignPermissions && (
                <div className="flex items-center gap-2 text-sm">
                  <Icon
                    icon="heroicons:key"
                    className="w-4 h-4 text-green-600"
                  />
                  <span>Assign Permissions</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Roles Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon icon="heroicons:identification" className="w-5 h-5" />
            {user?.userType === "ADMIN" ? "All Roles" : "Accessible Roles"}
            {stats && (
              <Badge color="primary">
                {user?.userType === "ADMIN" ? stats.total : stats.visibleRoles}{" "}
                roles
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <RolesTable
            canEdit={canUpdateRoles}
            canDelete={canDeleteRoles}
            canAssignPermissions={canAssignPermissions}
            userType={user?.userType}
          />
        </CardContent>
      </Card>
    </div>
  );
};

// Main component wrapped with ProtectedRoute
const RolesPage = () => {
  return (
    <ProtectedRoute
      requiredPermissions={[ROLE_PERMISSIONS.READ_ROLES]}
      requiredAccessLevel="LIMITED"
      allowedAccountStatuses={["ACTIVE"]}
    >
      <RolesPageContent />
    </ProtectedRoute>
  );
};

export default RolesPage;
