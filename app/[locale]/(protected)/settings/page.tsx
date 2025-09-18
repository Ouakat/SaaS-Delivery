import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Link } from "@/i18n/routing";
import { ProtectedRoute } from "@/components/route/protected-route";
import { USER_PERMISSIONS } from "@/lib/constants/auth";

const settingsModules = [
  {
    title: "General Settings",
    description: "Company information, branding, and basic configuration",
    href: "/settings/general",
    icon: "heroicons:building-office",
    permission: "settings:manage_general",
  },
  {
    title: "Cities Management",
    description: "Manage delivery cities and zones",
    href: "/settings/cities",
    icon: "heroicons:map-pin",
    permission: "settings:manage_cities",
  },
  // Add other modules...
];

export default function SettingsPage() {
  return (
    <ProtectedRoute
      requiredPermissions={["settings:read"]}
      requiredAccessLevel="FULL"
    >
      <div className="container mx-auto py-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Configure your system settings and preferences
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {settingsModules.map((module) => (
            <Card
              key={module.href}
              className="hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon icon={module.icon} className="w-5 h-5" />
                  {module.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {module.description}
                </p>
                <Link href={module.href}>
                  <Button className="w-full">
                    Configure
                    <Icon
                      icon="heroicons:arrow-right"
                      className="w-4 h-4 ml-2"
                    />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </ProtectedRoute>
  );
}
