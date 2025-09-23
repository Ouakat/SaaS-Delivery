"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/routing";
import UsersTable from "@/components/users/users-table";
import { useAuthStore } from "@/lib/stores/auth/auth.store";
import { ProtectedRoute } from "@/components/route/protected-route";
import { USER_PERMISSIONS } from "@/lib/constants/auth";

const UsersPageContent = () => {
  const { hasPermission, user, hasAnyPermission } = useAuthStore();

  // Check individual permissions
  const canViewUsers = hasPermission(USER_PERMISSIONS.READ_USERS);
  const canCreateUsers = hasPermission(USER_PERMISSIONS.CREATE_USER);
  const canUpdateUsers = hasPermission(USER_PERMISSIONS.UPDATE_USER);
  const canDeleteUsers = hasPermission(USER_PERMISSIONS.DELETE_USER);
  const canManageRoles = hasPermission(USER_PERMISSIONS.MANAGE_USER_ROLES);
  const canViewAnalytics = hasPermission(USER_PERMISSIONS.READ_USER_ANALYTICS);

  // Check if user has any user management permissions
  const hasAnyUserPermissions = hasAnyPermission([
    USER_PERMISSIONS.READ_USERS,
    USER_PERMISSIONS.CREATE_USER,
    USER_PERMISSIONS.UPDATE_USER,
    USER_PERMISSIONS.DELETE_USER,
    USER_PERMISSIONS.MANAGE_USER_ROLES,
    USER_PERMISSIONS.READ_USER_ANALYTICS,
  ]);

  // Define permission-based features
  const availableFeatures = [
    {
      id: "view",
      label: "View Users",
      enabled: canViewUsers,
      icon: "heroicons:eye",
      description: "Browse and search users",
    },
    {
      id: "create",
      label: "Create Users",
      enabled: canCreateUsers,
      icon: "heroicons:plus",
      description: "Add new users to the system",
    },
    {
      id: "update",
      label: "Edit Users",
      enabled: canUpdateUsers,
      icon: "heroicons:pencil",
      description: "Modify user information",
    },
    {
      id: "delete",
      label: "Delete Users",
      enabled: canDeleteUsers,
      icon: "heroicons:trash",
      description: "Remove users from the system",
    },
    {
      id: "roles",
      label: "Manage Roles",
      enabled: canManageRoles,
      icon: "heroicons:shield-check",
      description: "Assign and modify user roles",
    },
    {
      id: "analytics",
      label: "View Analytics",
      enabled: canViewAnalytics,
      icon: "heroicons:chart-bar",
      description: "Access user analytics and reports",
    },
  ];

  const enabledFeatures = availableFeatures.filter(
    (feature) => feature.enabled
  );
  const disabledFeatures = availableFeatures.filter(
    (feature) => !feature.enabled
  );

  // Show error if user has no permissions at all
  if (!hasAnyUserPermissions) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-default-900">
              Users Management
            </h1>
            <p className="text-default-600">
              Manage your users, roles, and permissions
            </p>
          </div>
        </div>

        <Alert color="destructive">
          <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <div className="font-medium">Access Denied</div>
              <div>
                You don't have permission to access user management features.
                Please contact your administrator to request access.
              </div>
              <div className="text-sm">
                <strong>Your user type:</strong> {user?.userType || "Unknown"}
              </div>
            </div>
          </AlertDescription>
        </Alert>

        {/* Contact Support Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon icon="heroicons:question-mark-circle" className="w-5 h-5" />
              Need Access?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              If you believe you should have access to user management features,
              please contact your system administrator or support team.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="md">
                <Icon
                  icon="heroicons:chat-bubble-left-right"
                  className="w-4 h-4 mr-2"
                />
                Contact Support
              </Button>
              <Link href="/dashboard">
                <Button variant="outline" size="md">
                  <Icon icon="heroicons:home" className="w-4 h-4 mr-2" />
                  Return to Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-default-900">
            Users Management
          </h1>
          <p className="text-default-600">
            Manage your users, roles, and permissions
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canViewAnalytics && (
            <Link href="/users/analytics">
              <Button variant="outline" size="md">
                <Icon icon="heroicons:chart-bar" className="w-4 h-4 mr-2" />
                Analytics
              </Button>
            </Link>
          )}

          {canCreateUsers && (
            <Link href="/users/create">
              <Button>
                <Icon icon="heroicons:plus" className="w-4 h-4 mr-2" />
                Create User
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Permissions Overview */}
      {process.env.NODE_ENV === "development" && (
        <Alert color="info" variant="soft">
          <Icon icon="heroicons:information-circle" className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <div className="font-medium">
                Development Info - Your Permissions
              </div>
              <div className="flex flex-wrap gap-1">
                {enabledFeatures.map((feature) => (
                  <Badge key={feature.id} color="info" className="text-xs">
                    <Icon icon={feature.icon} className="w-3 h-3 mr-1" />
                    {feature.label}
                  </Badge>
                ))}
                {disabledFeatures.map((feature) => (
                  <Badge
                    key={feature.id}
                    color="secondary"
                    className="text-xs opacity-50"
                  >
                    <Icon icon={feature.icon} className="w-3 h-3 mr-1" />
                    {feature.label}
                  </Badge>
                ))}
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Limited Access Warning */}
      {hasAnyUserPermissions &&
        (!canViewUsers || enabledFeatures.length < 3) && (
          <Alert color="warning" variant="soft">
            <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <div className="font-medium">Limited Access</div>
                <div className="text-sm">
                  You have restricted access to user management features. Some
                  actions may not be available.
                </div>
                <div className="text-xs mt-2">
                  <strong>Available:</strong>{" "}
                  {enabledFeatures.map((f) => f.label).join(", ")}
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>All Users</span>
            {canViewUsers && (
              <Badge color="secondary" className="text-xs">
                <Icon icon="heroicons:eye" className="w-3 h-3 mr-1" />
                View Access
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {canViewUsers ? (
            <UsersTable />
          ) : (
            <div className="p-8 text-center">
              <div className="space-y-4">
                <Icon
                  icon="heroicons:lock-closed"
                  className="w-12 h-12 text-muted-foreground mx-auto"
                />
                <div>
                  <h3 className="font-medium text-default-900">
                    No View Permission
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    You don't have permission to view the users list.
                  </p>
                </div>
                {canCreateUsers && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-3">
                      You can still create new users:
                    </p>
                    <Link href="/users/create">
                      <Button size="md">
                        <Icon icon="heroicons:plus" className="w-4 h-4 mr-2" />
                        Create User
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Main component wrapped with ProtectedRoute
const UsersPage = () => {
  return (
    <ProtectedRoute
      requiredPermissions={[USER_PERMISSIONS.READ_USERS]}
      requiredAccessLevel="LIMITED"
      allowedAccountStatuses={["ACTIVE"]}
    >
      <UsersPageContent />
    </ProtectedRoute>
  );
};

export default UsersPage;
