"use client";

import React from "react";
import RouteGuard from "@/components/auth/route-guard";
import PermissionNav, {
  NAVIGATION_ITEMS,
} from "@/components/navigation/permission-nav";
import { useAuth } from "@/lib/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut, User, Settings } from "lucide-react";
import { toast } from "sonner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RouteGuard
      requireAuth={true}
      requireTenant={true}
      requiredPermissions={["dashboard.view"]}
    >
      <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
        {/* Sidebar */}
        <aside className="w-64 bg-white dark:bg-gray-800 shadow-lg">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Dashboard
            </h1>
          </div>

          {/* Navigation */}
          <div className="p-4">
            <PermissionNav items={NAVIGATION_ITEMS} />
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <DashboardHeader />

          {/* Main content area */}
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </RouteGuard>
  );
}

// Dashboard Header Component
const DashboardHeader: React.FC = () => {
  const { user, currentTenant, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Successfully logged out");
    } catch (error) {
      toast.error("Logout failed");
    }
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Welcome back, {user?.name}
          </h2>
          {currentTenant && (
            <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
              {currentTenant.name}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-4">
          {/* User role badge */}
          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded-full">
            {user?.role}
          </span>

          {/* User menu */}
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm">
              <User className="w-4 h-4 mr-2" />
              Profile
            </Button>

            <Button variant="ghost" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>

            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
