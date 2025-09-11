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
import { rolesApiClient } from "@/lib/api/clients/roles.client";
import { useAuthStore } from "@/lib/stores/auth.store";
import { toast } from "sonner";

// User type configurations
const userTypeConfig = {
  ADMIN: {
    label: "Administrator",
    color: "bg-red-100 text-red-800",
    icon: "heroicons:shield-check",
    description: "Platform administrator with full system access",
  },
  MANAGER: {
    label: "Manager",
    color: "bg-orange-100 text-orange-800",
    icon: "heroicons:user-group",
    description: "Platform manager handling business operations",
  },
  SUPPORT: {
    label: "Support Staff",
    color: "bg-blue-100 text-blue-800",
    icon: "heroicons:chat-bubble-left-right",
    description: "Customer support staff handling claims and issues",
  },
  SELLER: {
    label: "Seller/Shipper",
    color: "bg-green-100 text-green-800",
    icon: "heroicons:currency-dollar",
    description: "Marketplace seller or shipper creating shipments",
  },
  LIVREUR: {
    label: "Delivery Agent",
    color: "bg-purple-100 text-purple-800",
    icon: "heroicons:truck",
    description: "Delivery agent handling package deliveries",
  },
  CUSTOMER: {
    label: "Customer",
    color: "bg-indigo-100 text-indigo-800",
    icon: "heroicons:user",
    description: "End customer receiving packages",
  },
  BUYER: {
    label: "Buyer",
    color: "bg-green-100 text-green-800",
    icon: "heroicons:shopping-cart",
    description: "Marketplace buyer ordering from sellers",
  },
  VENDOR: {
    label: "Vendor",
    color: "bg-yellow-100 text-yellow-800",
    icon: "heroicons:building-storefront",
    description: "Vendor or supplier in B2B relationships",
  },
  WAREHOUSE: {
    label: "Warehouse Staff",
    color: "bg-gray-100 text-gray-800",
    icon: "heroicons:building-office-2",
    description: "Warehouse staff managing inventory",
  },
  DISPATCHER: {
    label: "Dispatcher",
    color: "bg-cyan-100 text-cyan-800",
    icon: "heroicons:map",
    description: "Dispatch coordinator managing logistics",
  },
};

// Permission category colors and icons
const categoryConfig = {
  users: {
    color: "bg-blue-100 text-blue-800",
    icon: "heroicons:users",
    description: "User management and administration",
  },
  roles: {
    color: "bg-purple-100 text-purple-800",
    icon: "heroicons:identification",
    description: "Role and permission management",
  },
  parcels: {
    color: "bg-green-100 text-green-800",
    icon: "heroicons:cube",
    description: "Package and shipment management",
  },
  tracking: {
    color: "bg-yellow-100 text-yellow-800",
    icon: "heroicons:map-pin",
    description: "Tracking and location services",
  },
  invoices: {
    color: "bg-red-100 text-red-800",
    icon: "heroicons:document-text",
    description: "Invoice and billing management",
  },
  claims: {
    color: "bg-orange-100 text-orange-800",
    icon: "heroicons:exclamation-triangle",
    description: "Customer claims and disputes",
  },
  reports: {
    color: "bg-indigo-100 text-indigo-800",
    icon: "heroicons:chart-bar",
    description: "Reporting and documentation",
  },
  analytics: {
    color: "bg-pink-100 text-pink-800",
    icon: "heroicons:chart-pie",
    description: "Analytics and insights",
  },
  rates: {
    color: "bg-emerald-100 text-emerald-800",
    icon: "heroicons:currency-dollar",
    description: "Pricing and rate management",
  },
  warehouse: {
    color: "bg-teal-100 text-teal-800",
    icon: "heroicons:building-office-2",
    description: "Warehouse and inventory operations",
  },
  tenants: {
    color: "bg-violet-100 text-violet-800",
    icon: "heroicons:building-office",
    description: "Tenant and organization settings",
  },
};

const ViewPermissionsPage = () => {
  const { hasPermission } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [availablePermissions, setAvailablePermissions] = useState<any>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedUserType, setSelectedUserType] = useState("all");

  // Check permissions
  const canViewRoles = hasPermission("roles:view");

  // Fetch available permissions
  useEffect(() => {
    const fetchPermissions = async () => {
      if (!canViewRoles) return;

      try {
        setLoading(true);
        const result = await rolesApiClient.getAvailablePermissions();
        if (result.success) {
          setAvailablePermissions(result.data);
          // Auto-expand all categories initially
          setExpandedCategories(new Set(result.data.categories));
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
  }, [canViewRoles]);

  // Filter permissions based on search and filters
  const filteredPermissions = React.useMemo(() => {
    if (!availablePermissions) return {};

    let permissions = availablePermissions.permissions;

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

    // Filter by user type
    if (selectedUserType !== "all") {
      permissions = permissions.filter((p: any) =>
        p.applicableUserTypes.includes(selectedUserType)
      );
    }

    // Group by category
    return permissions.reduce((acc: any, permission: any) => {
      const category = permission.category.toLowerCase();
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(permission);
      return acc;
    }, {});
  }, [availablePermissions, searchTerm, selectedCategory, selectedUserType]);

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

  // Expand all categories
  const expandAll = () => {
    if (availablePermissions) {
      setExpandedCategories(new Set(Object.keys(filteredPermissions)));
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

  const totalPermissions = availablePermissions.permissions.length;
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
            View all available permissions, their descriptions, and applicable
            user types
          </p>
        </div>
        <Link href="/roles">
          <Button variant="outline">
            <Icon icon="heroicons:arrow-left" className="w-4 h-4 mr-2" />
            Back to Roles
          </Button>
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Permissions
            </CardTitle>
            <Icon
              icon="heroicons:key"
              className="h-4 w-4 text-muted-foreground"
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPermissions}</div>
            <p className="text-xs text-muted-foreground">
              Across all categories
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
            <div className="text-2xl font-bold">
              {availablePermissions.categories.length}
            </div>
            <p className="text-xs text-muted-foreground">Permission groups</p>
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
              {availablePermissions.userTypes.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Supported user types
            </p>
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

      {/* User Types Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon icon="heroicons:user-group" className="w-5 h-5" />
            User Types Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availablePermissions.userTypes.map((userType: any) => {
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
                              {userType.defaultPermissions.length} default
                              permissions
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
                          <strong>Default permissions:</strong>{" "}
                          {userType.defaultPermissions.length}
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
                {availablePermissions.categories.map((category: string) => (
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
                {Object.entries(userTypeConfig).map(([type, config]) => (
                  <SelectItem key={type} value={type}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={expandAll}>
                <Icon
                  icon="heroicons:arrows-pointing-out"
                  className="w-4 h-4 mr-2"
                />
                Expand All
              </Button>
              <Button variant="outline" size="sm" onClick={collapseAll}>
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
            <Badge variant="outline">{filteredCount} permissions</Badge>
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
                Try adjusting your search terms or filters
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
                                <div className="font-medium text-sm mb-1">
                                  {permission.key}
                                </div>
                                <div className="text-sm text-muted-foreground mb-3">
                                  {permission.description}
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {permission.applicableUserTypes.map(
                                    (userType: string) => {
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
                                    }
                                  )}
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
                  • <code className="bg-gray-100 px-1 rounded">users:view</code>{" "}
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
              <h3 className="font-medium mb-2">User Type Compatibility</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Each permission shows which user types can be granted that
                permission.
              </p>
              <div className="space-y-2 text-sm">
                <div>• Admin permissions are restricted to ADMIN users</div>
                <div>• Customer permissions work with CUSTOMER users</div>
                <div>• Some permissions work with multiple user types</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ViewPermissionsPage;
