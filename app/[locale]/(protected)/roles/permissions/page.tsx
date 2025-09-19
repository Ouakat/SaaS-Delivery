"use client";

import React, { useState, useEffect } from "react";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Link } from "@/i18n/routing";
import { rolesApiClient } from "@/lib/api/clients/auth/roles.client";
import { useAuthStore } from "@/lib/stores/auth/auth.store";
import { ProtectedRoute } from "@/components/route/protected-route";
import { ROLE_PERMISSIONS, ADMIN_PERMISSIONS } from "@/lib/constants/auth";
import { toast } from "sonner";

// User type configurations with permission hierarchy
const userTypeConfig = {
  ADMIN: {
    label: "Administrator",
    color: "bg-red-100 text-red-800",
    icon: "heroicons:shield-check",
    description: "Platform administrator with full system access",
    canView: ["ADMIN"], // Only ADMINs can see ADMIN-related permissions
  },
  MANAGER: {
    label: "Manager",
    color: "bg-orange-100 text-orange-800",
    icon: "heroicons:user-group",
    description: "Platform manager handling business operations",
    canView: ["ADMIN", "MANAGER"], // ADMINs and MANAGERs can see MANAGER permissions
  },
  SUPPORT: {
    label: "Support Staff",
    color: "bg-blue-100 text-blue-800",
    icon: "heroicons:chat-bubble-left-right",
    description: "Customer support staff handling claims and issues",
    canView: ["ADMIN", "MANAGER", "SUPPORT"],
  },
  SELLER: {
    label: "Seller/Shipper",
    color: "bg-green-100 text-green-800",
    icon: "heroicons:currency-dollar",
    description: "Marketplace seller or shipper creating shipments",
    canView: ["ADMIN", "MANAGER"],
  },
  LIVREUR: {
    label: "Delivery Agent",
    color: "bg-purple-100 text-purple-800",
    icon: "heroicons:truck",
    description: "Delivery agent handling package deliveries",
    canView: ["ADMIN", "MANAGER"],
  },
  CUSTOMER: {
    label: "Customer",
    color: "bg-indigo-100 text-indigo-800",
    icon: "heroicons:user",
    description: "End customer receiving packages",
    canView: ["ADMIN", "MANAGER", "SUPPORT"],
  },
  BUYER: {
    label: "Buyer",
    color: "bg-green-100 text-green-800",
    icon: "heroicons:shopping-cart",
    description: "Marketplace buyer ordering from sellers",
    canView: ["ADMIN", "MANAGER"],
  },
  VENDOR: {
    label: "Vendor",
    color: "bg-yellow-100 text-yellow-800",
    icon: "heroicons:building-storefront",
    description: "Vendor or supplier in B2B relationships",
    canView: ["ADMIN", "MANAGER"],
  },
  WAREHOUSE: {
    label: "Warehouse Staff",
    color: "bg-gray-100 text-gray-800",
    icon: "heroicons:building-office-2",
    description: "Warehouse staff managing inventory",
    canView: ["ADMIN", "MANAGER"],
  },
  DISPATCHER: {
    label: "Dispatcher",
    color: "bg-cyan-100 text-cyan-800",
    icon: "heroicons:map",
    description: "Dispatch coordinator managing logistics",
    canView: ["ADMIN", "MANAGER"],
  },
};

// Permission category colors and icons with access restrictions
const categoryConfig = {
  users: {
    color: "bg-blue-100 text-blue-800",
    icon: "heroicons:users",
    description: "User management and administration",
    restrictedTo: [], // All can view user permissions
  },
  roles: {
    color: "bg-purple-100 text-purple-800",
    icon: "heroicons:identification",
    description: "Role and permission management",
    restrictedTo: [], // All can view role permissions
  },
  parcels: {
    color: "bg-green-100 text-green-800",
    icon: "heroicons:cube",
    description: "Package and shipment management",
    restrictedTo: [],
  },
  tracking: {
    color: "bg-yellow-100 text-yellow-800",
    icon: "heroicons:map-pin",
    description: "Tracking and location services",
    restrictedTo: [],
  },
  invoices: {
    color: "bg-red-100 text-red-800",
    icon: "heroicons:document-text",
    description: "Invoice and billing management",
    restrictedTo: [],
  },
  claims: {
    color: "bg-orange-100 text-orange-800",
    icon: "heroicons:exclamation-triangle",
    description: "Customer claims and disputes",
    restrictedTo: [],
  },
  reports: {
    color: "bg-indigo-100 text-indigo-800",
    icon: "heroicons:chart-bar",
    description: "Reporting and documentation",
    restrictedTo: [],
  },
  analytics: {
    color: "bg-pink-100 text-pink-800",
    icon: "heroicons:chart-pie",
    description: "Analytics and insights",
    restrictedTo: [],
  },
  rates: {
    color: "bg-emerald-100 text-emerald-800",
    icon: "heroicons:currency-dollar",
    description: "Pricing and rate management",
    restrictedTo: [],
  },
  warehouse: {
    color: "bg-teal-100 text-teal-800",
    icon: "heroicons:building-office-2",
    description: "Warehouse and inventory operations",
    restrictedTo: [],
  },
  tenants: {
    color: "bg-violet-100 text-violet-800",
    icon: "heroicons:building-office",
    description: "Tenant and organization settings",
    restrictedTo: ["ADMIN"], // Only ADMINs can see tenant permissions
  },
  admin: {
    color: "bg-red-200 text-red-900",
    icon: "heroicons:shield-exclamation",
    description: "Administrative system controls",
    restrictedTo: ["ADMIN"], // Only ADMINs can see admin permissions
  },
};

const ViewPermissionsPageContent = () => {
  const { hasPermission, user, hasAnyPermission } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [availablePermissions, setAvailablePermissions] = useState<any>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedUserType, setSelectedUserType] = useState("all");

  // Check permissions - using the constants
  const canViewRoles = hasPermission(ROLE_PERMISSIONS.READ_ROLES);
  const canAssignPermissions = hasPermission(
    ROLE_PERMISSIONS.ASSIGN_PERMISSIONS
  );
  const hasAdminAccess = hasPermission(ADMIN_PERMISSIONS.FULL_ACCESS);

  // Check if user can view specific permission based on their role hierarchy
  const canViewPermission = (permission: any) => {
    if (!user) return false;

    // Admins can view all permissions
    if (hasAdminAccess || user.userType === "ADMIN") return true;

    // Check if permission is admin-only
    if (permission.key.includes("admin:") && user.userType !== "ADMIN") {
      return false;
    }

    // Check if permission applies to user types the current user can manage
    const managedUserTypes =
      user.userType === "MANAGER"
        ? [
            "MANAGER",
            "SUPPORT",
            "SELLER",
            "LIVREUR",
            "CUSTOMER",
            "BUYER",
            "VENDOR",
            "WAREHOUSE",
            "DISPATCHER",
          ]
        : user.userType === "SUPPORT"
        ? ["CUSTOMER"]
        : [user.userType]; // Others can only see permissions for their own type

    return permission.applicableUserTypes.some((userType: string) =>
      managedUserTypes.includes(userType)
    );
  };

  // Check if user can view specific user type
  const canViewUserType = (userType: string) => {
    if (!user) return false;

    const config = userTypeConfig[userType as keyof typeof userTypeConfig];
    return config?.canView.includes(user.userType) || false;
  };

  // Check if user can view specific category
  const canViewCategory = (category: string) => {
    if (!user) return false;

    const config = categoryConfig[category as keyof typeof categoryConfig];
    if (!config?.restrictedTo || config.restrictedTo.length === 0) return true;

    return config.restrictedTo.includes(user.userType);
  };

  // Get filtered user types based on user's permissions
  const getVisibleUserTypes = () => {
    if (!availablePermissions) return [];

    return availablePermissions.userTypes.filter((userType: any) =>
      canViewUserType(userType.type)
    );
  };

  // Get filtered categories based on user's permissions
  const getVisibleCategories = () => {
    if (!availablePermissions) return [];

    return availablePermissions.categories.filter((category: string) =>
      canViewCategory(category.toLowerCase())
    );
  };

  // Fetch available permissions
  useEffect(() => {
    const fetchPermissions = async () => {
      if (!canViewRoles) return;

      try {
        setLoading(true);
        const result = await rolesApiClient.getAvailablePermissions();
        if (result.success) {
          setAvailablePermissions(result.data);

          // Auto-expand categories based on user's access level
          const visibleCategories = result.data.categories.filter(
            (cat: string) => canViewCategory(cat.toLowerCase())
          );

          // Expand categories the user has most access to
          const priorityCategories =
            user?.userType === "ADMIN"
              ? ["users", "roles", "admin", "tenants"]
              : user?.userType === "MANAGER"
              ? ["users", "roles", "reports"]
              : ["users"];

          const initialExpanded = new Set(
            priorityCategories.filter((cat) => visibleCategories.includes(cat))
          );
          setExpandedCategories(initialExpanded);
        } else {
          toast.error("Failed to fetch permissions data");
        }
      } catch (error) {
        console.error("Error fetching permissions:", error);
        toast.error("An error occurred while fetching permissions");
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [canViewRoles, user]);

  // Filter permissions based on search and filters with permission checks
  const filteredPermissions = React.useMemo(() => {
    if (!availablePermissions) return {};

    let permissions = availablePermissions.permissions.filter((p: any) =>
      canViewPermission(p)
    );

    // Filter by search term
    if (searchTerm) {
      permissions = permissions.filter(
        (p: any) =>
          p.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== "all") {
      permissions = permissions.filter(
        (p: any) => p.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Filter by user type (only show permissions for user types the current user can view)
    if (selectedUserType !== "all") {
      permissions = permissions.filter(
        (p: any) =>
          p.applicableUserTypes.includes(selectedUserType) &&
          canViewUserType(selectedUserType)
      );
    }

    // Group by category and filter categories by visibility
    return permissions.reduce((acc: any, permission: any) => {
      const category = permission.category.toLowerCase();
      if (canViewCategory(category)) {
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(permission);
      }
      return acc;
    }, {});
  }, [
    availablePermissions,
    searchTerm,
    selectedCategory,
    selectedUserType,
    user,
  ]);

  // Toggle category expansion
  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  // Expand all visible categories
  const expandAll = () => {
    if (availablePermissions) {
      const visibleCategories = Object.keys(filteredPermissions);
      setExpandedCategories(new Set(visibleCategories));
    }
  };

  // Collapse all categories
  const collapseAll = () => {
    setExpandedCategories(new Set());
  };

  if (!canViewRoles) {
    return (
      <div className="container mx-auto py-8">
        <Alert color="destructive">
          <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to view permissions. Please contact your
            administrator.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center justify-center space-x-2">
              <Icon
                icon="heroicons:arrow-path"
                className="w-5 h-5 animate-spin"
              />
              <span>Loading permissions data...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!availablePermissions) {
    return (
      <div className="container mx-auto py-8">
        <Alert color="destructive">
          <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
          <AlertDescription>
            Failed to load permissions data. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const visibleUserTypes = getVisibleUserTypes();
  const visibleCategories = getVisibleCategories();
  const totalVisiblePermissions = availablePermissions.permissions.filter(
    (p: any) => canViewPermission(p)
  ).length;
  const filteredCount = Object.values(filteredPermissions).reduce(
    (sum: number, permissions: any) => sum + permissions.length,
    0
  );

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-default-900">
            System Permissions
          </h1>
          <p className="text-default-600">
            View available permissions, their descriptions, and applicable user
            types
          </p>
          {user?.userType !== "ADMIN" && (
            <p className="text-sm text-muted-foreground mt-1">
              Showing permissions within your access scope ({user?.userType})
            </p>
          )}
        </div>
        <Link href="/roles">
          <Button color="primary">
            <Icon icon="heroicons:arrow-left" className="w-4 h-4 mr-2" />
            Back to Roles
          </Button>
        </Link>
      </div>

      {/* Access Level Warning */}
      {user?.userType !== "ADMIN" && (
        <Alert color="info" variant="soft">
          <Icon icon="heroicons:information-circle" className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <div className="font-medium">Limited View Access</div>
              <div className="text-sm">
                You're seeing permissions relevant to your role (
                {user?.userType}).
                {user?.userType === "MANAGER" &&
                  " As a Manager, you can view permissions for user types you manage."}
                {user?.userType === "SUPPORT" &&
                  " As Support staff, you can view customer-related permissions."}
                {!["ADMIN", "MANAGER", "SUPPORT"].includes(
                  user?.userType || ""
                ) && " You can view permissions that apply to your user type."}
              </div>
            </div>
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
                Dev Info - Your View Permissions
              </div>
              <div className="text-xs space-y-1">
                <div>Can View Roles: {canViewRoles ? "✅" : "❌"}</div>
                <div>
                  Can Assign Permissions: {canAssignPermissions ? "✅" : "❌"}
                </div>
                <div>
                  Visible User Types: {visibleUserTypes.length}/
                  {availablePermissions.userTypes.length}
                </div>
                <div>
                  Visible Categories: {visibleCategories.length}/
                  {availablePermissions.categories.length}
                </div>
                <div>
                  Visible Permissions: {totalVisiblePermissions}/
                  {availablePermissions.permissions.length}
                </div>
                <div>Your Type: {user?.userType}</div>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Visible Permissions
            </CardTitle>
            <Icon
              icon="heroicons:key"
              className="h-4 w-4 text-muted-foreground"
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVisiblePermissions}</div>
            <p className="text-xs text-muted-foreground">
              Within your access scope
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Icon
              icon="heroicons:folder"
              className="h-4 w-4 text-muted-foreground"
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{visibleCategories.length}</div>
            <p className="text-xs text-muted-foreground">
              Accessible categories
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
            <div className="text-2xl font-bold">{visibleUserTypes.length}</div>
            <p className="text-xs text-muted-foreground">Within your scope</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Filtered Results
            </CardTitle>
            <Icon
              icon="heroicons:funnel"
              className="h-4 w-4 text-muted-foreground"
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredCount}</div>
            <p className="text-xs text-muted-foreground">
              Matching your filters
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Your Access Level Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon icon="heroicons:shield-check" className="w-5 h-5" />
            Your Access Level
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-medium text-sm mb-2">Your Role</h4>
              <Badge color="primary">{user?.userType}</Badge>
              <p className="text-xs text-muted-foreground mt-1">
                {
                  userTypeConfig[user?.userType as keyof typeof userTypeConfig]
                    ?.description
                }
              </p>
            </div>
            <div>
              <h4 className="font-medium text-sm mb-2">Permission Access</h4>
              <Badge color={canAssignPermissions ? "success" : "warning"}>
                {canAssignPermissions ? "Full Access" : "View Only"}
              </Badge>
              <p className="text-xs text-muted-foreground mt-1">
                {canAssignPermissions
                  ? "Can assign permissions"
                  : "Can view permissions only"}
              </p>
            </div>
            <div>
              <h4 className="font-medium text-sm mb-2">Scope</h4>
              <Badge color={hasAdminAccess ? "success" : "secondary"}>
                {hasAdminAccess ? "System Wide" : "Limited Scope"}
              </Badge>
              <p className="text-xs text-muted-foreground mt-1">
                {hasAdminAccess
                  ? "All permissions visible"
                  : "Role-based visibility"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Types Overview */}
      {visibleUserTypes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon icon="heroicons:user-group" className="w-5 h-5" />
              Accessible User Types
              <Badge color="primary">{visibleUserTypes.length} visible</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {visibleUserTypes.map((userType: any) => {
                const config =
                  userTypeConfig[userType.type as keyof typeof userTypeConfig];
                return (
                  <TooltipProvider key={userType.type}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className={`p-4 border rounded-lg ${
                            config?.color || "bg-gray-100 text-gray-800"
                          }`}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <Icon
                              icon={config?.icon || "heroicons:user"}
                              className="w-5 h-5"
                            />
                            <div>
                              <div className="font-medium">
                                {config?.label || userType.name}
                              </div>
                              <div className="text-xs opacity-75">
                                {
                                  userType.defaultPermissions.filter(
                                    (p: string) =>
                                      availablePermissions.permissions.some(
                                        (perm: any) =>
                                          perm.key === p &&
                                          canViewPermission(perm)
                                      )
                                  ).length
                                }{" "}
                                visible default permissions
                              </div>
                            </div>
                          </div>
                          <div className="text-xs opacity-75 line-clamp-2">
                            {userType.description}
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="max-w-xs">
                          <div className="font-medium mb-2">
                            {config?.label || userType.name}
                          </div>
                          <div className="text-sm mb-2">
                            {userType.description}
                          </div>
                          <div className="text-xs">
                            <strong>Visible default permissions:</strong>{" "}
                            {
                              userType.defaultPermissions.filter((p: string) =>
                                availablePermissions.permissions.some(
                                  (perm: any) =>
                                    perm.key === p && canViewPermission(perm)
                                )
                              ).length
                            }
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

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon icon="heroicons:funnel" className="w-5 h-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search permissions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>

            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {visibleCategories.map((category: string) => (
                  <SelectItem key={category} value={category.toLowerCase()}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedUserType}
              onValueChange={setSelectedUserType}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="User Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All User Types</SelectItem>
                {visibleUserTypes.map((userType: any) => {
                  const config =
                    userTypeConfig[
                      userType.type as keyof typeof userTypeConfig
                    ];
                  return (
                    <SelectItem key={userType.type} value={userType.type}>
                      {config?.label || userType.type}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button color="primary" size="sm" onClick={expandAll}>
                <Icon
                  icon="heroicons:arrows-pointing-out"
                  className="w-4 h-4 mr-2"
                />
                Expand All
              </Button>
              <Button color="primary" size="sm" onClick={collapseAll}>
                <Icon
                  icon="heroicons:arrows-pointing-in"
                  className="w-4 h-4 mr-2"
                />
                Collapse All
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Permissions by Category */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon icon="heroicons:key" className="w-5 h-5" />
            Permissions by Category
            <Badge color="primary">{filteredCount} permissions</Badge>
            {!canAssignPermissions && (
              <Badge color="secondary" className="text-xs">
                View Only
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(filteredPermissions).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Icon
                icon="heroicons:magnifying-glass"
                className="w-12 h-12 mx-auto mb-2 opacity-50"
              />
              <p>No permissions found matching your filters</p>
              <p className="text-sm">
                Try adjusting your search terms or filters, or check if you have
                access to view those permissions
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(filteredPermissions).map(
                ([category, permissions]: [string, any]) => {
                  const config =
                    categoryConfig[category as keyof typeof categoryConfig];
                  const isExpanded = expandedCategories.has(category);

                  return (
                    <Collapsible
                      key={category}
                      open={isExpanded}
                      onOpenChange={() => toggleCategory(category)}
                    >
                      <CollapsibleTrigger asChild>
                        <div className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                          <div className="flex items-center gap-3">
                            <Icon
                              icon={
                                isExpanded
                                  ? "heroicons:chevron-down"
                                  : "heroicons:chevron-right"
                              }
                              className="w-5 h-5"
                            />
                            <Icon
                              icon={config?.icon || "heroicons:folder"}
                              className="w-5 h-5 text-blue-600"
                            />
                            <div>
                              <div className="font-medium capitalize text-lg">
                                {category}
                                {config?.restrictedTo &&
                                  config.restrictedTo.length > 0 && (
                                    <Icon
                                      icon="heroicons:lock-closed"
                                      className="w-4 h-4 ml-2 inline text-yellow-600"
                                    />
                                  )}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {permissions.length} permissions •{" "}
                                {config?.description || "Permission category"}
                              </div>
                            </div>
                          </div>
                          <Badge
                            className={
                              config?.color || "bg-gray-100 text-gray-800"
                            }
                          >
                            {permissions.length}
                          </Badge>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="mt-4 ml-8 space-y-3">
                          {permissions.map((permission: any) => (
                            <div
                              key={permission.key}
                              className="flex items-start justify-between p-4 border rounded-lg bg-gray-50"
                            >
                              <div className="flex-1">
                                <div className="font-medium text-sm mb-1 flex items-center gap-2">
                                  {permission.key}
                                  {permission.key.includes("admin:") && (
                                    <Badge
                                      color="destructive"
                                      className="text-xs"
                                    >
                                      Admin Only
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-sm text-muted-foreground mb-3">
                                  {permission.description}
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {permission.applicableUserTypes
                                    .filter((userType: string) =>
                                      canViewUserType(userType)
                                    )
                                    .map((userType: string) => {
                                      const config =
                                        userTypeConfig[
                                          userType as keyof typeof userTypeConfig
                                        ];
                                      return (
                                        <TooltipProvider key={userType}>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <span
                                                className={`text-xs px-2 py-1 rounded-full ${
                                                  config?.color ||
                                                  "bg-gray-100 text-gray-800"
                                                }`}
                                              >
                                                <Icon
                                                  icon={
                                                    config?.icon ||
                                                    "heroicons:user"
                                                  }
                                                  className="w-3 h-3 mr-1 inline"
                                                />
                                                {config?.label || userType}
                                              </span>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p>
                                                {config?.description ||
                                                  "User type description"}
                                              </p>
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                      );
                                    })}
                                </div>
                              </div>
                              <div className="ml-4">
                                <Badge
                                  className={
                                    config?.color || "bg-gray-100 text-gray-800"
                                  }
                                >
                                  {category}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  );
                }
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon icon="heroicons:question-mark-circle" className="w-5 h-5" />
            Understanding Permissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-2">Permission Format</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Permissions follow the format{" "}
                <code className="bg-gray-100 px-1 rounded">
                  category:action
                </code>
              </p>
              <div className="space-y-2 text-sm">
                <div>
                  • <code className="bg-gray-100 px-1 rounded">users:read</code>{" "}
                  - View users
                </div>
                <div>
                  •{" "}
                  <code className="bg-gray-100 px-1 rounded">roles:create</code>{" "}
                  - Create roles
                </div>
                <div>
                  •{" "}
                  <code className="bg-gray-100 px-1 rounded">
                    parcels:update
                  </code>{" "}
                  - Update parcels
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-medium mb-2">Your Access Scope</h3>
              <p className="text-sm text-muted-foreground mb-3">
                The permissions you see are filtered based on your user type and
                role.
              </p>
              <div className="space-y-2 text-sm">
                <div>
                  • You can only view permissions within your management scope
                </div>
                <div>• Admin-only permissions require ADMIN user type</div>
                <div>
                  •{" "}
                  {canAssignPermissions
                    ? "You can assign these permissions in roles"
                    : "You can only view these permissions"}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Main component wrapped with ProtectedRoute
const ViewPermissionsPage = () => {
  return (
    <ProtectedRoute
      requiredPermissions={[ROLE_PERMISSIONS.READ_ROLES]}
      requiredAccessLevel="LIMITED"
      allowedAccountStatuses={["ACTIVE"]}
    >
      <ViewPermissionsPageContent />
    </ProtectedRoute>
  );
};

export default ViewPermissionsPage;
