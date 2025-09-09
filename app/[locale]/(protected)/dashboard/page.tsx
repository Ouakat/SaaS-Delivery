"use client";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuthStore } from "@/lib/stores/auth.store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LogOut,
  User,
  Settings,
  Package,
  Receipt,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";

export default function DashboardPage() {
  return (
    <ProtectedRoute
      requireAuth
      requireTenant
      allowedUserTypes={["ADMIN", "MANAGER", "SELLER", "LIVREUR", "DISPATCHER"]}
    >
      <DashboardContent />
    </ProtectedRoute>
  );
}

function DashboardContent() {
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Successfully logged out");
    } catch (error) {
      toast.error("Logout failed");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="flex h-16 items-center justify-between px-6">
          <div>
            <h1 className="text-2xl font-bold">Network Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Welcome back, {user?.name || user?.email}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              {user?.userType} • {user?.role?.name}
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* User Info Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                User Information
              </CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Email:</span>
                  <span className="text-sm font-medium">{user?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Role:</span>
                  <span className="text-sm font-medium">
                    {user?.role?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Type:</span>
                  <span className="text-sm font-medium">{user?.userType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <span className="text-sm font-medium text-green-600">
                    {user?.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Quick Actions
              </CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                >
                  <Package className="h-4 w-4 mr-2" />
                  Manage Parcels
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                >
                  <Receipt className="h-4 w-4 mr-2" />
                  View Invoices
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Handle Claims
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Permissions */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Your Permissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {user?.role?.permissions
                  ?.slice(0, 5)
                  .map((permission, index) => (
                    <div
                      key={index}
                      className="text-xs bg-muted px-2 py-1 rounded"
                    >
                      {permission}
                    </div>
                  ))}
                {(user?.role?.permissions?.length || 0) > 5 && (
                  <div className="text-xs text-muted-foreground">
                    +{(user?.role?.permissions?.length || 0) - 5} more...
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Development Info */}
        {process.env.NODE_ENV === "development" && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Development Info
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-muted p-4 rounded overflow-auto">
                {JSON.stringify(
                  {
                    user: {
                      id: user?.id,
                      email: user?.email,
                      userType: user?.userType,
                      role: user?.role?.name,
                      permissions: user?.role?.permissions,
                    },
                  },
                  null,
                  2
                )}
              </pre>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
