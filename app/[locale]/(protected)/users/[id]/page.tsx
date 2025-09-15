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
import { Link } from "@/i18n/routing";
import { ProtectedRoute } from "@/components/route/protected-route";
import { USER_TYPES, PERMISSIONS } from "@/lib/constants/permissions";
import { usersApiClient } from "@/lib/api/clients/users.client";
import { useAuthStore } from "@/lib/stores/auth.store";
import { toast } from "sonner";

// Status configurations
const userTypeConfig = {
  ADMIN: {
    label: "Admin",
    color: "destructive" as const,
    icon: "heroicons:shield-check",
  },
  MANAGER: {
    label: "Manager",
    color: "warning" as const,
    icon: "heroicons:user-group",
  },
  SUPPORT: {
    label: "Support",
    color: "info" as const,
    icon: "heroicons:chat-bubble-left-right",
  },
  SELLER: {
    label: "Seller",
    color: "success" as const,
    icon: "heroicons:currency-dollar",
  },
  LIVREUR: {
    label: "Delivery",
    color: "secondary" as const,
    icon: "heroicons:truck",
  },
  CUSTOMER: {
    label: "Customer",
    color: "primary" as const,
    icon: "heroicons:user",
  },
  BUYER: {
    label: "Buyer",
    color: "success" as const,
    icon: "heroicons:shopping-cart",
  },
  VENDOR: {
    label: "Vendor",
    color: "warning" as const,
    icon: "heroicons:building-storefront",
  },
  WAREHOUSE: {
    label: "Warehouse",
    color: "secondary" as const,
    icon: "heroicons:building-office-2",
  },
  DISPATCHER: {
    label: "Dispatcher",
    color: "info" as const,
    icon: "heroicons:map",
  },
};

const accountStatusConfig = {
  PENDING: {
    label: "Pending Approval",
    color: "warning" as const,
    icon: "heroicons:clock",
    description: "Awaiting admin approval",
  },
  INACTIVE: {
    label: "Inactive",
    color: "secondary" as const,
    icon: "heroicons:pause",
    description: "Account is inactive",
  },
  PENDING_VALIDATION: {
    label: "Pending Validation",
    color: "info" as const,
    icon: "heroicons:document-check",
    description: "Profile awaiting validation",
  },
  ACTIVE: {
    label: "Active",
    color: "success" as const,
    icon: "heroicons:check-circle",
    description: "Account is active",
  },
  REJECTED: {
    label: "Rejected",
    color: "destructive" as const,
    icon: "heroicons:x-circle",
    description: "Account was rejected",
  },
  SUSPENDED: {
    label: "Suspended",
    color: "destructive" as const,
    icon: "heroicons:no-symbol",
    description: "Account is suspended",
  },
};

const validationStatusConfig = {
  PENDING: {
    label: "Pending",
    color: "warning" as const,
    icon: "heroicons:clock",
  },
  VALIDATED: {
    label: "Validated",
    color: "success" as const,
    icon: "heroicons:shield-check",
  },
  REJECTED: {
    label: "Rejected",
    color: "destructive" as const,
    icon: "heroicons:shield-exclamation",
  },
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

const UserDetailsPage = () => {
  const router = useRouter();
  const params = useParams();
  const userId = params?.id as string;
  const { hasPermission } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userActivity, setUserActivity] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);

  const canUpdateUsers = hasPermission(PERMISSIONS.UPDATE_USER);
  const canDeleteUsers = hasPermission(PERMISSIONS.DELETE_USER);
  const canApproveUsers = hasPermission("users:approve");
  const canValidateUsers = hasPermission("users:validate");

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) return;

      try {
        setLoading(true);

        // Fetch user details
        const userResult = await usersApiClient.getUserById(userId);
        if (userResult.success) {
          setUser(userResult.data);
        } else {
          toast.error("Failed to fetch user data");
          router.push("/users");
          return;
        }

        // Fetch user permissions (no conditional check needed since this is admin-only)
        try {
          const permissionsResult = await usersApiClient.getUserPermissions(
            userId
          );
          if (permissionsResult.success) {
            setPermissions(permissionsResult.data);
          }
        } catch (error) {
          console.error("Error fetching permissions:", error);
        }

        // Fetch user activity (no conditional check needed since this is admin-only)
        try {
          const activityResult: any = await usersApiClient.getUserActivity(
            userId,
            10
          );
          if (activityResult.success) {
            setUserActivity(activityResult.data);
          }
        } catch (error) {
          console.error("Error fetching activity:", error);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast.error("An error occurred while fetching user data");
        router.push("/users");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId, router]);

  // Handle user actions
  const handleApproveRegistration = async () => {
    setActionLoading(true);
    try {
      const result = await usersApiClient.approveRegistration(userId, {
        approve: true,
        message: "Your registration has been approved!",
      });
      if (result.success) {
        setUser(result.data);
        toast.success("Registration approved successfully");
      } else {
        toast.error(result.error?.message || "Failed to approve registration");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setActionLoading(false);
    }
  };

  const handleValidateProfile = async () => {
    setActionLoading(true);
    try {
      const result = await usersApiClient.validateProfile(userId, {
        action: "VALIDATE",
        notes: "Profile validated successfully",
      });
      if (result.success) {
        setUser(result.data);
        toast.success("Profile validated successfully");
      } else {
        toast.error(result.error?.message || "Failed to validate profile");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspendUser = async () => {
    setActionLoading(true);
    try {
      const result = await usersApiClient.suspendUser(userId);
      if (result.success) {
        setUser(result.data);
        toast.success("User suspended successfully");
      } else {
        toast.error(result.error?.message || "Failed to suspend user");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivateUser = async () => {
    setActionLoading(true);
    try {
      const result = await usersApiClient.reactivateUser(userId);
      if (result.success) {
        setUser(result.data);
        toast.success("User reactivated successfully");
      } else {
        toast.error(result.error?.message || "Failed to reactivate user");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    try {
      const result = await usersApiClient.deleteUser(userId);
      if (result.success) {
        toast.success("User deleted successfully");
        router.push("/users");
      } else {
        toast.error(result.error?.message || "Failed to delete user");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setDeleteDialog(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute
        requiredUserTypes={[USER_TYPES.ADMIN]}
        requiredPermissions={[PERMISSIONS.VIEW_USERS]}
        requiredAccessLevel="FULL"
      >
        <div className="container mx-auto py-6">
          <Card>
            <CardContent className="p-8">
              <div className="flex items-center justify-center space-x-2">
                <Icon
                  icon="heroicons:arrow-path"
                  className="w-5 h-5 animate-spin"
                />
                <span>Loading user details...</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </ProtectedRoute>
    );
  }

  if (!user) {
    return (
      <ProtectedRoute
        requiredUserTypes={[USER_TYPES.ADMIN]}
        requiredPermissions={[PERMISSIONS.VIEW_USERS]}
        requiredAccessLevel="FULL"
      >
        <div className="container mx-auto py-8">
          <Alert color="destructive">
            <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
            <AlertDescription>
              User not found or has been deleted.
            </AlertDescription>
          </Alert>
        </div>
      </ProtectedRoute>
    );
  }

  const userTypeInfo =
    userTypeConfig[user.userType as keyof typeof userTypeConfig];
  const accountStatusInfo =
    accountStatusConfig[user.accountStatus as keyof typeof accountStatusConfig];
  const validationStatusInfo =
    validationStatusConfig[
      user.validationStatus as keyof typeof validationStatusConfig
    ];

  return (
    <ProtectedRoute
      requiredUserTypes={[USER_TYPES.ADMIN]}
      requiredPermissions={[PERMISSIONS.VIEW_USERS]}
      requiredAccessLevel="FULL"
    >
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar size="xl">
              <AvatarImage
                src={user.profile?.profilePhoto || user.avatar}
                alt={user.name}
              />
              <AvatarFallback className="text-lg">
                {user.name
                  ?.split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold text-default-900">
                  {user.name}
                </h1>
                {user.validationStatus === "VALIDATED" && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Icon
                          icon="heroicons:shield-check"
                          className="w-6 h-6 text-blue-500"
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Verified Profile</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              <p className="text-lg text-default-600">{user.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge color={userTypeInfo?.color}>
                  <Icon icon={userTypeInfo?.icon} className="w-3 h-3 mr-1" />
                  {userTypeInfo?.label}
                </Badge>
                <Badge color={accountStatusInfo?.color}>
                  <Icon
                    icon={accountStatusInfo?.icon}
                    className="w-3 h-3 mr-1"
                  />
                  {accountStatusInfo?.label}
                </Badge>
                <Badge color={validationStatusInfo?.color}>
                  <Icon
                    icon={validationStatusInfo?.icon}
                    className="w-3 h-3 mr-1"
                  />
                  {validationStatusInfo?.label}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Admin Actions Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button disabled={actionLoading}>
                  <Icon
                    icon="heroicons:ellipsis-horizontal"
                    className="w-4 h-4 mr-2"
                  />
                  Admin Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canUpdateUsers && (
                  <DropdownMenuItem asChild>
                    <Link href={`/users/${userId}/edit`}>
                      <Icon
                        icon="heroicons:pencil-square"
                        className="mr-2 h-4 w-4"
                      />
                      Edit User
                    </Link>
                  </DropdownMenuItem>
                )}

                {/* Admin-specific actions */}
                {canApproveUsers && user.accountStatus === "PENDING" && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleApproveRegistration}>
                      <Icon
                        icon="heroicons:check"
                        className="mr-2 h-4 w-4 text-green-600"
                      />
                      Approve Registration
                    </DropdownMenuItem>
                  </>
                )}

                {canValidateUsers &&
                  user.accountStatus === "PENDING_VALIDATION" && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleValidateProfile}>
                        <Icon
                          icon="heroicons:shield-check"
                          className="mr-2 h-4 w-4 text-blue-600"
                        />
                        Validate Profile
                      </DropdownMenuItem>
                    </>
                  )}

                {canUpdateUsers && (
                  <>
                    <DropdownMenuSeparator />
                    {user.accountStatus === "SUSPENDED" ? (
                      <DropdownMenuItem onClick={handleReactivateUser}>
                        <Icon
                          icon="heroicons:play"
                          className="mr-2 h-4 w-4 text-green-600"
                        />
                        Reactivate User
                      </DropdownMenuItem>
                    ) : (
                      user.accountStatus === "ACTIVE" && (
                        <DropdownMenuItem onClick={handleSuspendUser}>
                          <Icon
                            icon="heroicons:pause"
                            className="mr-2 h-4 w-4 text-orange-600"
                          />
                          Suspend User
                        </DropdownMenuItem>
                      )
                    )}
                  </>
                )}

                {canDeleteUsers && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-600"
                      onClick={() => setDeleteDialog(true)}
                    >
                      <Icon icon="heroicons:trash" className="mr-2 h-4 w-4" />
                      Delete User
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <Link href="/users">
              <Button variant="outline">
                <Icon icon="heroicons:arrow-left" className="w-4 h-4 mr-2" />
                Back to Users
              </Button>
            </Link>
          </div>
        </div>

        {/* Status Alert */}
        {user.accountStatus !== "ACTIVE" && (
          <Alert color={accountStatusInfo?.color} variant="soft">
            <Icon icon={accountStatusInfo?.icon} className="h-4 w-4" />
            <AlertDescription>
              <strong>{accountStatusInfo?.label}:</strong>{" "}
              {accountStatusInfo?.description}
              {user.validationNotes && (
                <span className="block mt-1 text-sm">
                  {user.validationNotes}
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon icon="heroicons:user" className="w-5 h-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-default-900">Full Name</h4>
                    <p className="text-default-600">
                      {user.name || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-default-900">Email</h4>
                    <p className="text-default-600">{user.email}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-default-900">Phone</h4>
                    <p className="text-default-600">
                      {user.phone || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-default-900">City</h4>
                    <p className="text-default-600">
                      {user.city || "Not provided"}
                    </p>
                  </div>
                  {user.profile?.address && (
                    <div className="md:col-span-2">
                      <h4 className="font-medium text-default-900">Address</h4>
                      <p className="text-default-600">{user.profile.address}</p>
                    </div>
                  )}
                  {user.profile?.cin && (
                    <div>
                      <h4 className="font-medium text-default-900">CIN</h4>
                      <p className="text-default-600">{user.profile.cin}</p>
                    </div>
                  )}
                  {user.profile?.department && (
                    <div>
                      <h4 className="font-medium text-default-900">
                        Department
                      </h4>
                      <p className="text-default-600">
                        {user.profile.department}
                      </p>
                    </div>
                  )}
                </div>

                {user.profile?.notes && (
                  <div>
                    <h4 className="font-medium text-default-900">Notes</h4>
                    <p className="text-default-600">{user.profile.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Role & Permissions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon icon="heroicons:identification" className="w-5 h-5" />
                  Role & Permissions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-default-900">User Type</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge color={userTypeInfo?.color}>
                        <Icon
                          icon={userTypeInfo?.icon}
                          className="w-3 h-3 mr-1"
                        />
                        {userTypeInfo?.label}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-default-900">Role</h4>
                    <p className="text-default-600">
                      {user.role?.name || "No role assigned"}
                    </p>
                    {user.role?.description && (
                      <p className="text-sm text-default-500">
                        {user.role.description}
                      </p>
                    )}
                  </div>
                </div>

                {permissions && permissions.permissions && (
                  <div>
                    <h4 className="font-medium text-default-900 mb-2">
                      Permissions
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {permissions.permissions.map((permission: string) => (
                        <Badge key={permission} className="outline text-xs">
                          {permission}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Activity Log */}
            {userActivity.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon icon="heroicons:clock" className="w-5 h-5" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {userActivity.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-start gap-3 p-3 bg-default-50 rounded-lg"
                      >
                        <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {activity.action}
                          </p>
                          <p className="text-xs text-default-500">
                            {formatDate(activity.timestamp)} by{" "}
                            {activity.performedBy?.name}
                          </p>
                          {activity.details && (
                            <p className="text-xs text-default-600 mt-1">
                              {activity.details}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Account Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon
                    icon="heroicons:information-circle"
                    className="w-5 h-5"
                  />
                  Account Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-default-900">
                    Account Status
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge color={accountStatusInfo?.color}>
                      <Icon
                        icon={accountStatusInfo?.icon}
                        className="w-3 h-3 mr-1"
                      />
                      {accountStatusInfo?.label}
                    </Badge>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-default-900">
                    Validation Status
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge color={validationStatusInfo?.color}>
                      <Icon
                        icon={validationStatusInfo?.icon}
                        className="w-3 h-3 mr-1"
                      />
                      {validationStatusInfo?.label}
                    </Badge>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-default-900">
                    Profile Completion
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      color={user.profileCompleted ? "success" : "warning"}
                    >
                      {user.profileCompleted ? "Complete" : "Incomplete"}
                    </Badge>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-default-900">
                    Access Status
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge color={user.isActive ? "success" : "destructive"}>
                      {user.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Account Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon icon="heroicons:calendar" className="w-5 h-5" />
                  Account Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-default-900">Created</h4>
                  <p className="text-sm text-default-600">
                    {formatDate(user.createdAt)}
                  </p>
                  {user.createdBy && (
                    <p className="text-xs text-default-500">
                      by {user.createdBy.name}
                    </p>
                  )}
                </div>

                <div>
                  <h4 className="font-medium text-default-900">Last Updated</h4>
                  <p className="text-sm text-default-600">
                    {formatDate(user.updatedAt)}
                  </p>
                </div>

                {user.validatedAt && (
                  <div>
                    <h4 className="font-medium text-default-900">Validated</h4>
                    <p className="text-sm text-default-600">
                      {formatDate(user.validatedAt)}
                    </p>
                    {user.validatedBy && (
                      <p className="text-xs text-default-500">
                        by {user.validatedBy.name}
                      </p>
                    )}
                  </div>
                )}

                {user.lastLogin && (
                  <div>
                    <h4 className="font-medium text-default-900">Last Login</h4>
                    <p className="text-sm text-default-600">
                      {formatDate(user.lastLogin)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tenant Information */}
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
                    {user.tenant?.name}
                  </h4>
                  <p className="text-sm text-default-500">
                    {user.tenant?.slug}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete User</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete <strong>{user.name}</strong>?
                This action cannot be undone and will permanently remove all
                user data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteUser}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                Delete User
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ProtectedRoute>
  );
};

export default UserDetailsPage;
