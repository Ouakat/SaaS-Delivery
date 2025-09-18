"use client";

import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { Link } from "@/i18n/routing";
import { ProtectedRoute } from "@/components/route/protected-route";
import { useAuthStore } from "@/lib/stores/auth.store";
import {
  SETTINGS_MODULES,
  SETTINGS_CATEGORIES,
  SETTINGS_PERMISSIONS,
} from "@/lib/constants/settings";

const SettingsPageContent = () => {
  const { hasPermission } = useAuthStore();

  // Filter modules based on user permissions
  const availableModules = useMemo(() => {
    return SETTINGS_MODULES.filter((module) =>
      hasPermission(module.permission)
    );
  }, [hasPermission]);

  // Group modules by category
  const modulesByCategory = useMemo(() => {
    const categories: Record<string, typeof availableModules> = {};

    availableModules.forEach((module) => {
      if (!categories[module.category]) {
        categories[module.category] = [];
      }
      categories[module.category].push(module);
    });

    return categories;
  }, [availableModules]);

  // Get category stats
  const categoryStats = useMemo(() => {
    const stats: Record<string, { total: number; available: number }> = {};

    Object.entries(SETTINGS_CATEGORIES).forEach(([categoryKey]) => {
      const totalModules = SETTINGS_MODULES.filter(
        (m) => m.category === categoryKey
      ).length;
      const availableModules = modulesByCategory[categoryKey]?.length || 0;
      stats[categoryKey] = { total: totalModules, available: availableModules };
    });

    return stats;
  }, [modulesByCategory]);

  if (availableModules.length === 0) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <Icon
              icon="heroicons:lock-closed"
              className="w-16 h-16 mx-auto text-gray-400 mb-4"
            />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Access to Settings
            </h3>
            <p className="text-gray-600 mb-4">
              You don't have permission to access any settings modules. Please
              contact your administrator.
            </p>
            <Link href="/dashboard">
              <Button variant="outline">
                <Icon icon="heroicons:arrow-left" className="w-4 h-4 mr-2" />
                Return to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">
            Configure your system settings and preferences
          </p>
        </div>
        <div className="text-sm text-gray-500">
          {availableModules.length} of {SETTINGS_MODULES.length} modules
          available
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {Object.entries(SETTINGS_CATEGORIES).map(
          ([categoryKey, categoryInfo]) => {
            const stats = categoryStats[categoryKey];
            const hasModules =
              (modulesByCategory[categoryKey]?.length || 0) > 0;

            return (
              <Card
                key={categoryKey}
                className={`${
                  hasModules ? "border-primary/20" : "border-gray-200"
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon icon={categoryInfo.icon} className="w-5 h-5" />
                      <div>
                        <p className="text-sm font-medium">
                          {categoryInfo.label}
                        </p>
                        <p className="text-xs text-gray-500">
                          {stats?.available || 0} / {stats?.total || 0}{" "}
                          available
                        </p>
                      </div>
                    </div>
                    <Badge
                      className={
                        hasModules
                          ? categoryInfo.color
                          : "bg-gray-100 text-gray-500"
                      }
                    >
                      {stats?.available || 0}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          }
        )}
      </div>

      {/* Settings Modules by Category */}
      {Object.entries(modulesByCategory).map(([categoryKey, modules]) => {
        const categoryInfo =
          SETTINGS_CATEGORIES[categoryKey as keyof typeof SETTINGS_CATEGORIES];

        if (modules.length === 0) return null;

        return (
          <div key={categoryKey} className="space-y-4">
            <div className="flex items-center gap-3">
              <Icon icon={categoryInfo.icon} className="w-6 h-6" />
              <h2 className="text-xl font-semibold text-gray-900">
                {categoryInfo.label}
              </h2>
              <Badge className={categoryInfo.color}>
                {modules.length} module{modules.length !== 1 ? "s" : ""}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {modules.map((module) => (
                <Card
                  key={module.href}
                  className="hover:shadow-lg transition-all duration-200 hover:border-primary/30"
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Icon
                          icon={module.icon}
                          className="w-5 h-5 text-primary"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="text-base font-semibold">
                          {module.title}
                        </div>
                        <Badge className={`${categoryInfo.color} text-xs mt-1`}>
                          {categoryInfo.label}
                        </Badge>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-gray-600 mb-4 min-h-[2.5rem]">
                      {module.description}
                    </p>
                    <Link href={module.href} className="block">
                      <Button className="w-full group">
                        Configure
                        <Icon
                          icon="heroicons:arrow-right"
                          className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform"
                        />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })}

      {/* Help Section */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-blue-100">
              <Icon
                icon="heroicons:information-circle"
                className="w-6 h-6 text-blue-600"
              />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                Need Help with Settings?
              </h3>
              <p className="text-blue-800 mb-4">
                Configure your system according to your business needs. Each
                module handles specific aspects of your logistics operations.
                Contact support if you need assistance.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-blue-700 border-blue-300"
                >
                  <Icon icon="heroicons:book-open" className="w-4 h-4 mr-2" />
                  Documentation
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-blue-700 border-blue-300"
                >
                  <Icon
                    icon="heroicons:chat-bubble-left-right"
                    className="w-4 h-4 mr-2"
                  />
                  Contact Support
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Main component with protection
const SettingsPage = () => {
  return (
    <ProtectedRoute
      requiredPermissions={[
        SETTINGS_PERMISSIONS.READ_GENERAL_SETTINGS,
        SETTINGS_PERMISSIONS.READ_CITIES,
        SETTINGS_PERMISSIONS.READ_OPTIONS,
      ]}
      requiredAccessLevel="FULL"
      allowedAccountStatuses={["ACTIVE"]}
      requireValidation={true}
    >
      <SettingsPageContent />
    </ProtectedRoute>
  );
};

export default SettingsPage;
