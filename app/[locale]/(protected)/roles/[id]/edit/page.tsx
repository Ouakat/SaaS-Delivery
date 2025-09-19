"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Link } from "@/i18n/routing";
import { rolesApiClient } from "@/lib/api/clients/auth/roles.client";
import { useAuthStore } from "@/lib/stores/auth/auth.store";
import { ProtectedRoute } from "@/components/route/protected-route";
import { ROLE_PERMISSIONS, ADMIN_PERMISSIONS } from "@/lib/constants/auth";
import { toast } from "sonner";
import { cn } from "@/lib/utils/ui.utils";

// Form schema
const updateRoleSchema = z.object({
  name: z
    .string()
    .min(2, "Role name must be at least 2 characters")
    .max(100, "Role name too long"),
  description: z.string().max(500, "Description too long").optional(),
  permissions: z
    .array(z.string())
    .min(1, "At least one permission is required"),
  userTypes: z.array(z.string()).min(1, "At least one user type is required"),
  isActive: z.boolean().default(true),
});

type UpdateRoleFormData = z.infer<typeof updateRoleSchema>;

// User type configurations with permission hierarchy
const userTypeConfig = {
  ADMIN: {
    label: "Administrator",
    color: "bg-red-100 text-red-800",
    icon: "heroicons:shield-check",
    description: "Platform administrator with full system access",
    restrictedTo: ["ADMIN"], // Only ADMINs can edit ADMIN roles
  },
  MANAGER: {
    label: "Manager",
    color: "bg-orange-100 text-orange-800",
    icon: "heroicons:user-group",
    description: "Platform manager handling business operations",
    restrictedTo: ["ADMIN", "MANAGER"], // ADMINs and MANAGERs can edit MANAGER roles
  },
  SUPPORT: {
    label: "Support Staff",
    color: "bg-blue-100 text-blue-800",
    icon: "heroicons:chat-bubble-left-right",
    description: "Customer support staff handling claims and issues",
    restrictedTo: ["ADMIN", "MANAGER"],
  },
  SELLER: {
    label: "Seller/Shipper",
    color: "bg-green-100 text-green-800",
    icon: "heroicons:currency-dollar",
    description: "Marketplace seller or shipper creating shipments",
    restrictedTo: ["ADMIN", "MANAGER"],
  },
  LIVREUR: {
    label: "Delivery Agent",
    color: "bg-purple-100 text-purple-800",
    icon: "heroicons:truck",
    description: "Delivery agent handling package deliveries",
    restrictedTo: ["ADMIN", "MANAGER"],
  },
  CUSTOMER: {
    label: "Customer",
    color: "bg-indigo-100 text-indigo-800",
    icon: "heroicons:user",
    description: "End customer receiving packages",
    restrictedTo: ["ADMIN", "MANAGER", "SUPPORT"],
  },
  BUYER: {
    label: "Buyer",
    color: "bg-green-100 text-green-800",
    icon: "heroicons:shopping-cart",
    description: "Marketplace buyer ordering from sellers",
    restrictedTo: ["ADMIN", "MANAGER"],
  },
  VENDOR: {
    label: "Vendor",
    color: "bg-yellow-100 text-yellow-800",
    icon: "heroicons:building-storefront",
    description: "Vendor or supplier in B2B relationships",
    restrictedTo: ["ADMIN", "MANAGER"],
  },
  WAREHOUSE: {
    label: "Warehouse Staff",
    color: "bg-gray-100 text-gray-800",
    icon: "heroicons:building-office-2",
    description: "Warehouse staff managing inventory",
    restrictedTo: ["ADMIN", "MANAGER"],
  },
  DISPATCHER: {
    label: "Dispatcher",
    color: "bg-cyan-100 text-cyan-800",
    icon: "heroicons:map",
    description: "Dispatch coordinator managing logistics",
    restrictedTo: ["ADMIN", "MANAGER"],
  },
};

const EditRolePageContent = () => {
  const router = useRouter();
  const params = useParams();
  const roleId = params?.id as string;
  const { hasPermission, user, hasAnyPermission } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [role, setRole] = useState<any>(null);
  const [availablePermissions, setAvailablePermissions] = useState<any>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );
  const [showUsersWarning, setShowUsersWarning] = useState(false);
  const [incompatibleUsers, setIncompatibleUsers] = useState<any[]>([]);

  // Check permissions - using the constants
  const canUpdateRoles = hasPermission(ROLE_PERMISSIONS.UPDATE_ROLE);
  const canAssignPermissions = hasPermission(
    ROLE_PERMISSIONS.ASSIGN_PERMISSIONS
  );
  const hasAdminAccess = hasPermission(ADMIN_PERMISSIONS.FULL_ACCESS);

  // Check if user can edit this specific role based on hierarchy
  const canEditRole = (roleData: any) => {
    if (!canUpdateRoles || !roleData || !user) return false;

    // Admins can edit all roles
    if (hasAdminAccess || user.userType === "ADMIN") return true;

    // Managers can edit roles for user types they manage (but not ADMIN roles)
    if (user.userType === "MANAGER") {
      const managedUserTypes = [
        "SUPPORT",
        "SELLER",
        "LIVREUR",
        "CUSTOMER",
        "BUYER",
        "VENDOR",
        "WAREHOUSE",
        "DISPATCHER",
      ];
      return roleData.userTypes.every((userType: string) =>
        managedUserTypes.includes(userType)
      );
    }

    return false;
  };

  // Check if user can assign specific user type to role
  const canAssignUserType = (userType: string) => {
    if (!user) return false;

    const config = userTypeConfig[userType as keyof typeof userTypeConfig];
    return config?.restrictedTo.includes(user.userType) || false;
  };

  // Check if user can assign specific permission
  const canAssignPermission = (permission: string, userTypes: string[]) => {
    if (!canAssignPermissions || !user) return false;

    // Check if the permission applies to user types the current user can manage
    const managedUserTypes =
      user.userType === "ADMIN"
        ? Object.keys(userTypeConfig)
        : user.userType === "MANAGER"
        ? [
            "SUPPORT",
            "SELLER",
            "LIVREUR",
            "CUSTOMER",
            "BUYER",
            "VENDOR",
            "WAREHOUSE",
            "DISPATCHER",
          ]
        : [];

    // For admin-only permissions, only admins can assign them
    if (permission.includes("admin:") && user.userType !== "ADMIN") {
      return false;
    }

    // Check if any of the role's user types are manageable by current user
    return userTypes.some((userType) => managedUserTypes.includes(userType));
  };

  // Get available user types for current user
  const getAvailableUserTypes = () => {
    if (!user) return [];

    return Object.entries(userTypeConfig).filter(([userType, config]) =>
      canAssignUserType(userType)
    );
  };

  // Get filtered permissions based on user's capabilities
  const getFilteredPermissions = (
    permissions: any[],
    selectedUserTypes: string[]
  ) => {
    if (!permissions) return [];

    return permissions.filter((permission: any) =>
      canAssignPermission(permission.key, selectedUserTypes)
    );
  };

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
    reset,
  } = useForm<UpdateRoleFormData>({
    resolver: zodResolver(updateRoleSchema),
  });

  const watchedPermissions = watch("permissions");
  const watchedUserTypes = watch("userTypes");
  const watchedName = watch("name");

  // Fetch role data and available permissions
  useEffect(() => {
    const fetchData = async () => {
      if (!roleId || !canUpdateRoles) return;

      try {
        setFetchLoading(true);

        // Fetch role details
        const roleResult: any = await rolesApiClient.getRoleById(roleId);
        if (roleResult.success) {
          const roleData: any = roleResult.data;

          // Check if user can edit this specific role
          if (!canEditRole(roleData)) {
            toast.error("You don't have permission to edit this role");
            router.push(`/roles/${roleId}`);
            return;
          }

          setRole(roleData);

          // Populate form with role data
          reset({
            name: roleData.name || "",
            description: roleData.description || "",
            permissions: roleData.permissions || [],
            userTypes: roleData.userTypes || [],
            isActive: roleData.isActive,
          });
        } else {
          toast.error("Failed to fetch role data");
          router.push("/roles");
          return;
        }

        // Fetch available permissions
        const permissionsResult =
          await rolesApiClient.getAvailablePermissions();
        if (permissionsResult.success) {
          setAvailablePermissions(permissionsResult.data);
          // Auto-expand categories that have selected permissions
          const selectedCategories = new Set<string>();
          roleResult.data.permissions.forEach((permission: string) => {
            const category = permission.split(":")[0];
            selectedCategories.add(category);
          });
          setExpandedCategories(selectedCategories);
        }
      } catch (error) {
        console.error("Error fetching role data:", error);
        toast.error("An error occurred while fetching role data");
        router.push("/roles");
      } finally {
        setFetchLoading(false);
      }
    };

    fetchData();
  }, [roleId, canUpdateRoles, reset, router]);

  // Check for incompatible users when user types change
  useEffect(() => {
    const checkIncompatibleUsers = async () => {
      if (!role || !watchedUserTypes || watchedUserTypes.length === 0) return;

      try {
        const usersResult: any = await rolesApiClient.getRoleUsers(roleId);
        if (usersResult.success) {
          const users = usersResult.data.users || [];
          const incompatible = users.filter(
            (user: any) => !watchedUserTypes.includes(user.userType)
          );

          setIncompatibleUsers(incompatible);
          setShowUsersWarning(incompatible.length > 0);
        }
      } catch (error) {
        console.error("Error checking users:", error);
      }
    };

    if (role && isDirty) {
      checkIncompatibleUsers();
    }
  }, [watchedUserTypes, role, roleId, isDirty]);

  const onSubmit = async (data: UpdateRoleFormData) => {
    if (!canUpdateRoles) {
      toast.error("You don't have permission to update roles");
      return;
    }

    if (!canEditRole(role)) {
      toast.error("You don't have permission to edit this role");
      return;
    }

    // Validate user types
    const invalidUserTypes = data.userTypes.filter(
      (userType) => !canAssignUserType(userType)
    );
    if (invalidUserTypes.length > 0) {
      toast.error(
        `You cannot assign these user types: ${invalidUserTypes.join(", ")}`
      );
      return;
    }

    // Validate permissions
    const invalidPermissions = data.permissions.filter(
      (permission) => !canAssignPermission(permission, data.userTypes)
    );
    if (invalidPermissions.length > 0) {
      toast.error(
        `You cannot assign some of these permissions with the selected user types`
      );
      return;
    }

    setLoading(true);
    try {
      const result = await rolesApiClient.updateRole(roleId, data);

      if (result.success) {
        toast.success("Role updated successfully!");
        setRole(result.data);
        reset(data); // Reset dirty state
      } else {
        toast.error(result.error?.message || "Failed to update role");
      }
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = () => {
    handleSubmit(onSubmit)();
  };

  // Handle permission selection with validation
  const handlePermissionChange = (permission: string, checked: boolean) => {
    const currentPermissions = watchedPermissions || [];
    const currentUserTypes = watchedUserTypes || [];

    if (checked) {
      // Check if user can assign this permission
      if (!canAssignPermission(permission, currentUserTypes)) {
        toast.error("You don't have permission to assign this permission");
        return;
      }

      setValue("permissions", [...currentPermissions, permission], {
        shouldValidate: true,
        shouldDirty: true,
      });
    } else {
      setValue(
        "permissions",
        currentPermissions.filter((p) => p !== permission),
        { shouldValidate: true, shouldDirty: true }
      );
    }
  };

  // Handle user type selection with validation
  const handleUserTypeChange = (userType: string, checked: boolean) => {
    if (checked && !canAssignUserType(userType)) {
      toast.error(`You don't have permission to assign ${userType} user type`);
      return;
    }

    const currentUserTypes = watchedUserTypes || [];
    if (checked) {
      setValue("userTypes", [...currentUserTypes, userType], {
        shouldValidate: true,
        shouldDirty: true,
      });
    } else {
      const newUserTypes = currentUserTypes.filter((ut) => ut !== userType);
      setValue("userTypes", newUserTypes, {
        shouldValidate: true,
        shouldDirty: true,
      });

      // Remove permissions that are no longer valid for remaining user types
      const currentPermissions = watchedPermissions || [];
      const validPermissions = currentPermissions.filter((permission) =>
        canAssignPermission(permission, newUserTypes)
      );

      if (validPermissions.length !== currentPermissions.length) {
        setValue("permissions", validPermissions, {
          shouldValidate: true,
          shouldDirty: true,
        });
        const removedCount =
          currentPermissions.length - validPermissions.length;
        toast.info(
          `${removedCount} permissions removed due to user type restriction`
        );
      }
    }
  };

  // Handle select all permissions in category with validation
  const handleSelectAllInCategory = (category: string) => {
    if (!availablePermissions) return;

    const categoryPermissions = availablePermissions.permissions
      .filter((p: any) => p.category.toLowerCase() === category.toLowerCase())
      .filter((p: any) => canAssignPermission(p.key, watchedUserTypes || []))
      .map((p: any) => p.key);

    const currentPermissions = watchedPermissions || [];
    const allSelected = categoryPermissions.every((p: string) =>
      currentPermissions.includes(p)
    );

    if (allSelected) {
      setValue(
        "permissions",
        currentPermissions.filter((p) => !categoryPermissions.includes(p)),
        { shouldValidate: true, shouldDirty: true }
      );
    } else {
      const newPermissions = [
        ...new Set([...currentPermissions, ...categoryPermissions]),
      ];
      setValue("permissions", newPermissions, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  };

  // Get recommended permissions for selected user types (filtered by permissions)
  const getRecommendedPermissions = () => {
    if (!availablePermissions || !watchedUserTypes) return [];

    const recommended = new Set<string>();
    watchedUserTypes.forEach((userType: string) => {
      const userTypeInfo = availablePermissions.userTypes.find(
        (ut: any) => ut.type === userType
      );
      if (userTypeInfo) {
        userTypeInfo.defaultPermissions
          .filter((p: string) => canAssignPermission(p, watchedUserTypes))
          .forEach((p: string) => recommended.add(p));
      }
    });

    return Array.from(recommended);
  };

  // Apply recommended permissions
  const handleApplyRecommended = () => {
    const recommended = getRecommendedPermissions();
    setValue("permissions", recommended, {
      shouldValidate: true,
      shouldDirty: true,
    });
    toast.success(`Applied ${recommended.length} recommended permissions`);
  };

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

  if (fetchLoading) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center justify-center space-x-2">
              <Icon
                icon="heroicons:arrow-path"
                className="w-5 h-5 animate-spin"
              />
              <span>Loading role data...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!canUpdateRoles) {
    return (
      <div className="container mx-auto py-8">
        <Alert color="destructive">
          <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to update roles. Please contact your
            administrator.
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

  if (!canEditRole(role)) {
    return (
      <div className="container mx-auto py-8">
        <Alert color="destructive">
          <Icon icon="heroicons:shield-exclamation" className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <div className="font-medium">Edit Access Denied</div>
              <div>
                You don't have permission to edit this role. This role applies
                to user types outside your management scope.
              </div>
              <div className="text-sm">
                <strong>Role applies to:</strong> {role.userTypes.join(", ")}
              </div>
              <div className="text-sm">
                <strong>Your user type:</strong> {user?.userType}
              </div>
            </div>
          </AlertDescription>
        </Alert>

        <div className="mt-4 flex gap-2">
          <Link href={`/roles/${roleId}`}>
            <Button variant="outline">
              <Icon icon="heroicons:eye" className="w-4 h-4 mr-2" />
              View Role Details
            </Button>
          </Link>
          <Link href="/roles">
            <Button variant="outline">
              <Icon icon="heroicons:arrow-left" className="w-4 h-4 mr-2" />
              Back to Roles
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const availableUserTypes = getAvailableUserTypes();
  const filteredPermissions = availablePermissions
    ? getFilteredPermissions(
        availablePermissions.permissions,
        watchedUserTypes || []
      )
    : [];
  const recommendedPermissions = getRecommendedPermissions();

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-default-900">Edit Role</h1>
          <p className="text-default-600">
            Update "{role.name}" role permissions and user types
          </p>
          <div className="flex items-center gap-2 mt-1">
            <Badge color={role.isActive ? "success" : "secondary"}>
              {role.isActive ? "Active" : "Inactive"}
            </Badge>
            <Badge color="primary">{role.userCount} users assigned</Badge>
            {user?.userType !== "ADMIN" && role.userTypes.includes("ADMIN") && (
              <Badge color="warning">Limited Edit Access</Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/roles/${roleId}`}>
            <Button variant="outline">
              <Icon icon="heroicons:eye" className="w-4 h-4 mr-2" />
              View Details
            </Button>
          </Link>
          <Link href="/roles">
            <Button variant="outline">
              <Icon icon="heroicons:arrow-left" className="w-4 h-4 mr-2" />
              Back to Roles
            </Button>
          </Link>
        </div>
      </div>

      {/* Permission Warnings */}
      {user?.userType === "MANAGER" && role.userTypes.includes("ADMIN") && (
        <Alert color="warning" variant="soft">
          <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <div className="font-medium">Limited Edit Access</div>
              <div className="text-sm">
                As a Manager, you cannot assign ADMIN user types or admin-level
                permissions. Some options may be restricted.
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Unsaved Changes Warning */}
      {isDirty && (
        <Alert color="warning" variant="soft">
          <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
          <AlertDescription>
            You have unsaved changes. Don't forget to save your updates.
          </AlertDescription>
        </Alert>
      )}

      {/* Users Warning */}
      {showUsersWarning && (
        <Alert color="warning">
          <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
          <AlertDescription>
            <strong>Warning:</strong> {incompatibleUsers.length} user(s) will
            become incompatible with the new user type restrictions:
            <div className="mt-2 space-y-1">
              {incompatibleUsers.slice(0, 3).map((user: any) => (
                <div key={user.id} className="text-xs">
                  {user.name} ({user.email}) - {user.userType}
                </div>
              ))}
              {incompatibleUsers.length > 3 && (
                <div className="text-xs">
                  +{incompatibleUsers.length - 3} more users...
                </div>
              )}
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
                Dev Info - Your Edit Permissions
              </div>
              <div className="text-xs space-y-1">
                <div>Can Edit Role: {canEditRole(role) ? "✅" : "❌"}</div>
                <div>
                  Can Assign Permissions: {canAssignPermissions ? "✅" : "❌"}
                </div>
                <div>
                  Available User Types: {availableUserTypes.length}/
                  {Object.keys(userTypeConfig).length}
                </div>
                <div>
                  Your Type: {user?.userType} | Role Types:{" "}
                  {role.userTypes.join(", ")}
                </div>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon icon="heroicons:identification" className="w-5 h-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Role Name */}
              <div className="space-y-2">
                <Label
                  htmlFor="name"
                  className={cn("", { "text-destructive": errors.name })}
                >
                  Role Name *
                </Label>
                <Input
                  id="name"
                  {...register("name")}
                  placeholder="e.g., Senior Delivery Agent"
                  className={cn("", {
                    "border-destructive focus:border-destructive": errors.name,
                  })}
                />
                {errors.name && (
                  <p className="text-xs text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...register("description")}
                  placeholder="Describe the role and its responsibilities..."
                  rows={3}
                />
                {errors.description && (
                  <p className="text-xs text-destructive">
                    {errors.description.message}
                  </p>
                )}
              </div>

              {/* Active Status */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Active Role</Label>
                  <p className="text-xs text-muted-foreground">
                    Allow this role to be assigned to users
                  </p>
                </div>
                <Switch
                  {...register("isActive")}
                  onCheckedChange={(checked) =>
                    setValue("isActive", checked, { shouldDirty: true })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* User Types Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon icon="heroicons:user-group" className="w-5 h-5" />
                Applicable User Types
                <Badge color="primary" className="ml-2">
                  {watchedUserTypes?.length || 0} selected
                </Badge>
                {role.userCount > 0 && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Icon
                          icon="heroicons:exclamation-triangle"
                          className="w-4 h-4 text-yellow-600"
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          This role has {role.userCount} assigned users. Changes
                          may affect their access.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {availableUserTypes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {availableUserTypes.map(([type, config]) => {
                    const isRestricted = !canAssignUserType(type);
                    return (
                      <TooltipProvider key={type}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <label
                              className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                                isRestricted
                                  ? "opacity-50 cursor-not-allowed"
                                  : ""
                              }`}
                            >
                              <Checkbox
                                checked={
                                  watchedUserTypes?.includes(type) || false
                                }
                                onCheckedChange={(checked) =>
                                  handleUserTypeChange(type, !!checked)
                                }
                                disabled={isRestricted}
                              />
                              <div className="flex items-center gap-2 flex-1">
                                <Icon icon={config.icon} className="w-4 h-4" />
                                <div>
                                  <div className="font-medium">
                                    {config.label}
                                  </div>
                                  <div className="text-xs text-muted-foreground truncate">
                                    {config.description}
                                  </div>
                                </div>
                              </div>
                              {isRestricted && (
                                <Icon
                                  icon="heroicons:lock-closed"
                                  className="w-4 h-4 text-gray-400"
                                />
                              )}
                            </label>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">
                              {isRestricted
                                ? `You don't have permission to assign ${config.label} user type`
                                : config.description}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })}
                </div>
              ) : (
                <Alert color="warning">
                  <Icon
                    icon="heroicons:exclamation-triangle"
                    className="h-4 w-4"
                  />
                  <AlertDescription>
                    You don't have permission to assign any user types. Please
                    contact your administrator.
                  </AlertDescription>
                </Alert>
              )}
              {errors.userTypes && (
                <p className="text-xs text-destructive mt-2">
                  {errors.userTypes.message}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Permissions Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon icon="heroicons:key" className="w-5 h-5" />
                  Permissions
                  <Badge color="primary" className="ml-2">
                    {watchedPermissions?.length || 0} selected
                  </Badge>
                  {!canAssignPermissions && (
                    <Badge color="warning" className="text-xs">
                      Limited Access
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {recommendedPermissions.length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleApplyRecommended}
                    >
                      <Icon
                        icon="heroicons:sparkles"
                        className="w-4 h-4 mr-2"
                      />
                      Apply Recommended ({recommendedPermissions.length})
                    </Button>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!canAssignPermissions && (
                <Alert color="warning" variant="soft" className="mb-4">
                  <Icon
                    icon="heroicons:information-circle"
                    className="h-4 w-4"
                  />
                  <AlertDescription>
                    You have limited permission assignment capabilities. Some
                    permissions may not be available.
                  </AlertDescription>
                </Alert>
              )}

              {availablePermissions ? (
                <div className="space-y-4">
                  {availablePermissions.categories.map((category: string) => {
                    const categoryPermissions =
                      availablePermissions.permissions.filter(
                        (p: any) =>
                          p.category.toLowerCase() === category.toLowerCase()
                      );

                    const availableCategoryPermissions =
                      categoryPermissions.filter((p: any) =>
                        canAssignPermission(p.key, watchedUserTypes || [])
                      );

                    const selectedInCategory =
                      availableCategoryPermissions.filter((p: any) =>
                        watchedPermissions?.includes(p.key)
                      ).length;

                    const isExpanded = expandedCategories.has(category);

                    // Don't show categories with no available permissions
                    if (availableCategoryPermissions.length === 0) return null;

                    return (
                      <Collapsible
                        key={category}
                        open={isExpanded}
                        onOpenChange={() => toggleCategory(category)}
                      >
                        <CollapsibleTrigger asChild>
                          <div className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                            <div className="flex items-center gap-3">
                              <Icon
                                icon={
                                  isExpanded
                                    ? "heroicons:chevron-down"
                                    : "heroicons:chevron-right"
                                }
                                className="w-4 h-4"
                              />
                              <Icon
                                icon="heroicons:folder"
                                className="w-4 h-4 text-blue-600"
                              />
                              <div>
                                <div className="font-medium capitalize">
                                  {category}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {selectedInCategory}/
                                  {availableCategoryPermissions.length}{" "}
                                  permissions selected
                                  {categoryPermissions.length !==
                                    availableCategoryPermissions.length &&
                                    ` (${
                                      categoryPermissions.length -
                                      availableCategoryPermissions.length
                                    } restricted)`}
                                </div>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectAllInCategory(category);
                              }}
                            >
                              {selectedInCategory ===
                              availableCategoryPermissions.length
                                ? "Deselect All"
                                : "Select All"}
                            </Button>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="mt-2 ml-4 space-y-2">
                            {availableCategoryPermissions.map(
                              (permission: any) => (
                                <label
                                  key={permission.key}
                                  className="flex items-start space-x-3 p-2 rounded hover:bg-gray-50 cursor-pointer"
                                >
                                  <Checkbox
                                    checked={
                                      watchedPermissions?.includes(
                                        permission.key
                                      ) || false
                                    }
                                    onCheckedChange={(checked) =>
                                      handlePermissionChange(
                                        permission.key,
                                        !!checked
                                      )
                                    }
                                  />
                                  <div className="flex-1">
                                    <div className="font-medium text-sm">
                                      {permission.key}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {permission.description}
                                    </div>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {permission.applicableUserTypes.map(
                                        (userType: string) => {
                                          const config =
                                            userTypeConfig[
                                              userType as keyof typeof userTypeConfig
                                            ];
                                          return (
                                            <span
                                              key={userType}
                                              className={`text-xs px-1 py-0.5 rounded ${
                                                config?.color ||
                                                "bg-gray-100 text-gray-800"
                                              }`}
                                            >
                                              {config?.label || userType}
                                            </span>
                                          );
                                        }
                                      )}
                                    </div>
                                  </div>
                                </label>
                              )
                            )}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center py-8">
                  <Icon
                    icon="heroicons:arrow-path"
                    className="w-5 h-5 animate-spin mr-2"
                  />
                  Loading permissions...
                </div>
              )}
              {errors.permissions && (
                <p className="text-xs text-destructive mt-2">
                  {errors.permissions.message}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Current Role Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon icon="heroicons:information-circle" className="w-5 h-5" />
                Current Role Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h4 className="font-medium text-sm">Created</h4>
                <p className="text-sm text-muted-foreground">
                  {new Date(role.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div>
                <h4 className="font-medium text-sm">Last Updated</h4>
                <p className="text-sm text-muted-foreground">
                  {new Date(role.updatedAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div>
                <h4 className="font-medium text-sm">Assigned Users</h4>
                <p className="text-sm text-muted-foreground">
                  {role.userCount} users
                </p>
              </div>
              <div>
                <h4 className="font-medium text-sm">Your Edit Access</h4>
                <Badge color={canEditRole(role) ? "success" : "warning"}>
                  {canEditRole(role) ? "Full Access" : "Limited"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon icon="heroicons:document-text" className="w-5 h-5" />
                Role Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-sm">User Types</h4>
                <div className="flex flex-wrap gap-1 mt-1">
                  {watchedUserTypes?.map((type) => {
                    const config =
                      userTypeConfig[type as keyof typeof userTypeConfig];
                    return (
                      <span
                        key={type}
                        className={`text-xs px-2 py-1 rounded-full ${
                          config?.color || "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {config?.label || type}
                      </span>
                    );
                  })}
                  {(!watchedUserTypes || watchedUserTypes.length === 0) && (
                    <span className="text-xs text-muted-foreground">
                      No user types selected
                    </span>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-sm">Permissions</h4>
                <div className="text-sm text-muted-foreground">
                  {watchedPermissions?.length || 0} permissions selected
                </div>
                {watchedPermissions && watchedPermissions.length > 0 && (
                  <div className="mt-2">
                    <div className="text-xs space-y-1 max-h-32 overflow-y-auto">
                      {watchedPermissions.slice(0, 10).map((permission) => (
                        <div key={permission} className="text-xs">
                          {permission}
                        </div>
                      ))}
                      {watchedPermissions.length > 10 && (
                        <div className="text-xs text-muted-foreground">
                          +{watchedPermissions.length - 10} more...
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Your Permissions Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon icon="heroicons:shield-check" className="w-5 h-5" />
                Your Permissions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm">
                <span className="text-muted-foreground">Your User Type:</span>
                <Badge color="primary" className="ml-2">
                  {user?.userType}
                </Badge>
              </div>

              <div className="text-sm">
                <span className="text-muted-foreground">
                  Can Assign User Types:
                </span>
                <div className="mt-1 text-xs">
                  {availableUserTypes.length}/
                  {Object.keys(userTypeConfig).length} types
                </div>
              </div>

              <div className="text-sm">
                <span className="text-muted-foreground">
                  Permission Assignment:
                </span>
                <Badge
                  color={canAssignPermissions ? "success" : "warning"}
                  className="ml-2 text-xs"
                >
                  {canAssignPermissions ? "Full Access" : "Limited"}
                </Badge>
              </div>

              <div className="pt-3 border-t text-xs text-muted-foreground">
                Your permission scope is determined by your user type and role
                hierarchy.
              </div>
            </CardContent>
          </Card>

          {/* Recommended Permissions */}
          {recommendedPermissions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon icon="heroicons:sparkles" className="w-5 h-5" />
                  Recommended
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Based on selected user types, we recommend these permissions:
                </p>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {recommendedPermissions.map((permission) => (
                    <div key={permission} className="text-xs">
                      {permission}
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleApplyRecommended}
                  className="w-full mt-3"
                >
                  Apply Recommended
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-4 pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/roles/${roleId}`)}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => reset()}
          disabled={loading || !isDirty}
        >
          Reset Changes
        </Button>
        <Button
          type="button"
          onClick={handleFormSubmit}
          disabled={loading || !isDirty}
        >
          {loading && (
            <Icon
              icon="heroicons:arrow-path"
              className="mr-2 h-4 w-4 animate-spin"
            />
          )}
          Save Changes
        </Button>
      </div>
    </div>
  );
};

// Main component wrapped with ProtectedRoute
const EditRolePage = () => {
  return (
    <ProtectedRoute
      requiredPermissions={[ROLE_PERMISSIONS.UPDATE_ROLE]}
      requiredAccessLevel="FULL"
      allowedAccountStatuses={["ACTIVE"]}
      requireValidation={true}
    >
      <EditRolePageContent />
    </ProtectedRoute>
  );
};

export default EditRolePage;
