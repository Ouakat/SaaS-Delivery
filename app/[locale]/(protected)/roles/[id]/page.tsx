"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

// Permission category colors
const getPermissionColor = (permission: string) => {
  const category = permission.split(":")[0];
  const colors = {
    users: "bg-blue-100 text-blue-800",
    roles: "bg-purple-100 text-purple-800",
    parcels: "bg-green-100 text-green-800",
    tracking: "bg-yellow-100 text-yellow-800",
    invoices: "bg-red-100 text-red-800",
    claims: "bg-orange-100 text-orange-800",
    reports: "bg-indigo-100 text-indigo-800",
    analytics: "bg-pink-100 text-pink-800",
    rates: "bg-emerald-100 text-emerald-800",
    warehouse: "bg-teal-100 text-teal-800",
    tenants: "bg-violet-100 text-violet-800",
  };
  return colors[category as keyof typeof colors] || "bg-gray-100 text-gray-800";
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const RoleDetailsPage = () => {
  const router = useRouter();
  const params = useParams();
  const roleId = params?.id as string;
  const { hasPermission } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<any>(null);
  const [roleUsers, setRoleUsers] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [duplicateDialog, setDuplicateDialog] = useState(false);
  const [duplicateName, setDuplicateName] = useState("");

  // Check permissions
  const canViewRoles = hasPermission("roles:view");
  const canUpdateRoles = hasPermission("roles:update");
  const canDeleteRoles = hasPermission("roles:delete");
  const canCreateRoles = hasPermission("roles:create");

  // Fetch role data
  useEffect(() => {
    const fetchRoleData = async () => {
      if (!roleId) return;

      try {
        setLoading(true);

        // Fetch role details
        const roleResult = await rolesApiClient.getRoleById(roleId);
        if (roleResult.success) {
          setRole(roleResult.data);
          setDuplicateName(`${roleResult.data.name} Copy`);
        } else {
          toast.error("Failed to fetch role data");
          router.push("/roles");
          return;
        }

        // Fetch role users if allowed
        if (canViewRoles) {
          try {
            const usersResult = await rolesApiClient.getRoleUsers(roleId);
            if (usersResult.success) {
              setRoleUsers(usersResult.data);
            }
          } catch (error) {
            console.error("Error fetching role users:", error);
          }
        }
      } catch (error) {
        console.error("Error fetching role data:", error);
        toast.error("An error occurred while fetching role data");
        router.push("/roles");
      } finally {
        setLoading(false);
      }
    };

    if (canViewRoles) {
      fetchRoleData();
    }
  }, [roleId, canViewRoles, router]);

  // Handle role actions
  const handleDeactivateRole = async () => {
    setActionLoading(true);
    try {
      const result = await rolesApiClient.deactivateRole(roleId);
      if (result.success) {
        setRole(result.data);
        toast.success("Role deactivated successfully");
      } else {
        toast.error(result.error?.message || "Failed to deactivate role");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivateRole = async () => {
    setActionLoading(true);
    try {
      const result = await rolesApiClient.reactivateRole(roleId);
      if (result.success) {
        setRole(result.data);
        toast.success("Role reactivated successfully");
      } else {
        toast.error(result.error?.message || "Failed to reactivate role");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteRole = async () => {
    try {
      const result = await rolesApiClient.deleteRole(roleId);
      if (result.success) {
        toast.success("Role deleted successfully");
        router.push("/roles");
      } else {
        toast.error(result.error?.message || "Failed to delete role");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setDeleteDialog(false);
    }
  };

  const handleDuplicateRole = async () => {
    if (!duplicateName.trim()) {
      toast.error("Please enter a name for the duplicated role");
      return;
    }

    setActionLoading(true);
    try {
      const result = await rolesApiClient.duplicateRole(roleId, {
        name: duplicateName.trim(),
      });

      if (result.success) {
        toast.success("Role duplicated successfully");
        router.push(`/roles/${result.data.id}`);
      } else {
        toast.error(result.error?.message || "Failed to duplicate role");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setActionLoading(false);
      setDuplicateDialog(false);
    }
  };

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
              <span>Loading role details...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!canViewRoles) {
    return (
      <div className="container mx-auto py-8">
        <Alert color="destructive">
          <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to view role details.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!role) {
    return (
      <div className="container mx-auto py-8">
        <Alert color="destructive">
          <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
          <AlertDescription>
            Role not found or has been deleted.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const permissionsByCategory = role.permissions.reduce(
    (acc: any, permission: string) => {
      const category = permission.split(":")[0];
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(permission);
      return acc;
    },
    {}
  );

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center ${
              role.isActive ? "bg-green-100" : "bg-gray-100"
            }`}
          >
            <Icon
              icon={role.isActive ? "heroicons:check" : "heroicons:pause"}
              className={`w-6 h-6 ${
                role.isActive ? "text-green-600" : "text-gray-400"
              }`}
            />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-default-900">{role.name}</h1>
            {role.description && (
              <p className="text-lg text-default-600">{role.description}</p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <Badge color={role.isActive ? "success" : "secondary"}>
                {role.isActive ? "Active" : "Inactive"}
              </Badge>
              <Badge variant="outline">{role.userCount} users assigned</Badge>
              <Badge variant="outline">
                {role.permissions.length} permissions
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Action Dropdown */}
          {(canUpdateRoles || canDeleteRoles || canCreateRoles) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button disabled={actionLoading}>
                  <Icon
                    icon="heroicons:ellipsis-horizontal"
                    className="w-4 h-4 mr-2"
                  />
                  Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canUpdateRoles && (
                  <DropdownMenuItem asChild>
                    <Link href={`/roles/${roleId}/edit`}>
                      <Icon
                        icon="heroicons:pencil-square"
                        className="mr-2 h-4 w-4"
                      />
                      Edit Role
                    </Link>
                  </DropdownMenuItem>
                )}

                {canCreateRoles && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setDuplicateDialog(true)}>
                      <Icon
                        icon="heroicons:document-duplicate"
                        className="mr-2 h-4 w-4"
                      />
                      Duplicate Role
                    </DropdownMenuItem>
                  </>
                )}

                {canUpdateRoles && (
                  <>
                    <DropdownMenuSeparator />
                    {role.isActive ? (
                      <DropdownMenuItem onClick={handleDeactivateRole}>
                        <Icon
                          icon="heroicons:pause"
                          className="mr-2 h-4 w-4 text-orange-600"
                        />
                        Deactivate Role
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onClick={handleReactivateRole}>
                        <Icon
                          icon="heroicons:play"
                          className="mr-2 h-4 w-4 text-green-600"
                        />
                        Reactivate Role
                      </DropdownMenuItem>
                    )}
                  </>
                )}

                {canDeleteRoles && role.userCount === 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-600"
                      onClick={() => setDeleteDialog(true)}
                    >
                      <Icon icon="heroicons:trash" className="mr-2 h-4 w-4" />
                      Delete Role
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <Link href="/roles">
            <Button variant="outline">
              <Icon icon="heroicons:arrow-left" className="w-4 h-4 mr-2" />
              Back to Roles
            </Button>
          </Link>
        </div>
      </div>

      {/* Status Alert */}
      {!role.isActive && (
        <Alert color="warning" variant="soft">
          <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
          <AlertDescription>
            <strong>Inactive Role:</strong> This role is currently inactive and
            cannot be assigned to new users.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* User Types */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon icon="heroicons:user-group" className="w-5 h-5" />
                Applicable User Types
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {role.userTypes.map((userType: string) => {
                  const config =
                    userTypeConfig[userType as keyof typeof userTypeConfig];
                  return (
                    <TooltipProvider key={userType}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className={`flex items-center gap-3 p-3 border rounded-lg ${
                              config?.color || "bg-gray-100 text-gray-800"
                            }`}
                          >
                            <Icon
                              icon={config?.icon || "heroicons:user"}
                              className="w-5 h-5"
                            />
                            <div>
                              <div className="font-medium">
                                {config?.label || userType}
                              </div>
                              <div className="text-xs opacity-75 truncate">
                                {config?.description || "User type description"}
                              </div>
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">
                            {config?.description || "User type description"}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Permissions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon icon="heroicons:key" className="w-5 h-5" />
                Permissions ({role.permissions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(permissionsByCategory).map(
                  ([category, permissions]: [string, any]) => (
                    <div key={category} className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Icon
                          icon="heroicons:folder"
                          className="w-4 h-4 text-blue-600"
                        />
                        <h3 className="font-medium capitalize">{category}</h3>
                        <Badge variant="outline">{permissions.length}</Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {permissions.map((permission: string) => (
                          <TooltipProvider key={permission}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div
                                  className={`px-3 py-2 rounded text-sm ${getPermissionColor(
                                    permission
                                  )}`}
                                >
                                  {permission}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Permission: {permission}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ))}
                      </div>
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>

          {/* Assigned Users */}
          {roleUsers && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon icon="heroicons:users" className="w-5 h-5" />
                  Assigned Users ({roleUsers.totalUsers})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {roleUsers.totalUsers > 0 ? (
                  <div className="space-y-3">
                    {roleUsers.users.slice(0, 10).map((user: any) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar size="sm">
                            <AvatarImage src={user.avatar} alt={user.name} />
                            <AvatarFallback>
                              {user.name?.charAt(0)?.toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-gray-500">
                              {user.email}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              userTypeConfig[
                                user.userType as keyof typeof userTypeConfig
                              ]?.color || "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {userTypeConfig[
                              user.userType as keyof typeof userTypeConfig
                            ]?.label || user.userType}
                          </span>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              user.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {user.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>
                    ))}
                    {roleUsers.totalUsers > 10 && (
                      <div className="text-center text-sm text-gray-500 py-2">
                        +{roleUsers.totalUsers - 10} more users...
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Icon
                      icon="heroicons:users"
                      className="w-12 h-12 mx-auto mb-2 opacity-50"
                    />
                    <p>No users assigned to this role</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Role Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon icon="heroicons:information-circle" className="w-5 h-5" />
                Role Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-default-900">Status</h4>
                <div className="flex items-center gap-2 mt-1">
                  <Badge color={role.isActive ? "success" : "secondary"}>
                    {role.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-default-900">Created</h4>
                <p className="text-default-600 text-sm">
                  {formatDate(role.createdAt)}
                </p>
              </div>

              <div>
                <h4 className="font-medium text-default-900">Last Updated</h4>
                <p className="text-default-600 text-sm">
                  {formatDate(role.updatedAt)}
                </p>
              </div>

              <div>
                <h4 className="font-medium text-default-900">Assigned Users</h4>
                <p className="text-default-600 text-sm">
                  {role.userCount} users
                </p>
              </div>

              <div>
                <h4 className="font-medium text-default-900">Permissions</h4>
                <p className="text-default-600 text-sm">
                  {role.permissions.length} permissions
                </p>
              </div>

              <div>
                <h4 className="font-medium text-default-900">User Types</h4>
                <p className="text-default-600 text-sm">
                  {role.userTypes.length} user types
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          {roleUsers && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon icon="heroicons:chart-bar" className="w-5 h-5" />
                  User Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(roleUsers.usersByType || {}).map(
                    ([userType, users]: [string, any]) => {
                      const config =
                        userTypeConfig[userType as keyof typeof userTypeConfig];
                      return (
                        <div
                          key={userType}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <Icon
                              icon={config?.icon || "heroicons:user"}
                              className="w-4 h-4"
                            />
                            <span className="text-sm">
                              {config?.label || userType}
                            </span>
                          </div>
                          <Badge variant="outline">{users.length}</Badge>
                        </div>
                      );
                    }
                  )}
                  {Object.keys(roleUsers.usersByType || {}).length === 0 && (
                    <p className="text-sm text-gray-500">No users assigned</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Organization */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon icon="heroicons:building-office" className="w-5 h-5" />
                Organization
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <h4 className="font-medium text-default-900">
                  {role.tenant?.name}
                </h4>
                <p className="text-sm text-default-500">{role.tenant?.slug}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the role{" "}
              <strong>{role.name}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRole}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Delete Role
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Duplicate Role Dialog */}
      <Dialog open={duplicateDialog} onOpenChange={setDuplicateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duplicate Role</DialogTitle>
            <DialogDescription>
              Create a copy of "{role.name}" with a new name.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label>New Role Name</Label>
            <Input
              value={duplicateName}
              onChange={(e) => setDuplicateName(e.target.value)}
              placeholder="Enter new role name"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDuplicateDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleDuplicateRole}
              disabled={actionLoading || !duplicateName.trim()}
            >
              {actionLoading && (
                <Icon
                  icon="heroicons:arrow-path"
                  className="mr-2 h-4 w-4 animate-spin"
                />
              )}
              Duplicate Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RoleDetailsPage;
