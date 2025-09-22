"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "@/i18n/routing";
import { ProtectedRoute } from "@/components/route/protected-route";
import { useAuthStore } from "@/lib/stores/auth/auth.store";
import CityForm from "@/components/settings/cities/city-form";
import type { City } from "@/lib/types/settings/cities.types";

const CreateCityPageContent = () => {
  const router = useRouter();
  const { hasPermission } = useAuthStore();

  // Check permissions
  const canCreateCities = hasPermission("cities:create");

  // Handle successful city creation
  const handleSuccess = (city: City) => {
    // Redirect to the city details page
    router.push(`/settings/cities/${city.id}`);
  };

  // Handle cancel
  const handleCancel = () => {
    router.back();
  };

  if (!canCreateCities) {
    return (
      <div className="container mx-auto py-8">
        <Alert color="default">
          <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to create cities. Please contact your
            administrator.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/settings" className="hover:text-foreground">
          Settings
        </Link>
        <Icon icon="heroicons:chevron-right" className="w-4 h-4" />
        <Link href="/settings/cities" className="hover:text-foreground">
          Cities
        </Link>
        <Icon icon="heroicons:chevron-right" className="w-4 h-4" />
        <span className="text-foreground">Create City</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-default-900">
            Create New City
          </h1>
          <p className="text-default-600 mt-1">
            Add a new city to your logistics network
          </p>
        </div>

        <Link href="/settings/cities">
          <Button variant="outline">
            <Icon icon="heroicons:arrow-left" className="w-4 h-4 mr-2" />
            Back to Cities
          </Button>
        </Link>
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <Icon
                  icon="heroicons:information-circle"
                  className="h-4 w-4 text-blue-500"
                />
              </div>
              <div>
                <h3 className="font-medium text-blue-900 mb-1">
                  City Reference
                </h3>
                <p className="text-sm text-blue-700">
                  Use a unique 2-10 character code (e.g., CAS, RAB, MAR)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                <Icon icon="heroicons:map" className="h-4 w-4 text-green-500" />
              </div>
              <div>
                <h3 className="font-medium text-green-900 mb-1">
                  Zone Classification
                </h3>
                <p className="text-sm text-green-700">
                  Assign cities to zones for pricing and delivery planning
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                <Icon
                  icon="heroicons:truck"
                  className="h-4 w-4 text-orange-500"
                />
              </div>
              <div>
                <h3 className="font-medium text-orange-900 mb-1">
                  Pickup Location
                </h3>
                <p className="text-sm text-orange-700">
                  Enable if this city can be used as a pickup origin
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Form */}
      <div className="max-w-4xl mx-auto">
        <CityForm
          mode="create"
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>

      {/* Help Section */}
      <Card className="max-w-4xl mx-auto bg-gradient-to-r from-slate-50 to-gray-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <Icon icon="heroicons:light-bulb" className="w-5 h-5" />
            Best Practices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium text-slate-900 mb-2">
                Naming Conventions
              </h4>
              <ul className="space-y-1 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <Icon
                    icon="heroicons:check"
                    className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0"
                  />
                  Use clear, recognizable city names
                </li>
                <li className="flex items-start gap-2">
                  <Icon
                    icon="heroicons:check"
                    className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0"
                  />
                  Keep references short and memorable
                </li>
                <li className="flex items-start gap-2">
                  <Icon
                    icon="heroicons:check"
                    className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0"
                  />
                  Use consistent formatting (e.g., all caps)
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-slate-900 mb-2">Zone Planning</h4>
              <ul className="space-y-1 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <Icon
                    icon="heroicons:check"
                    className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0"
                  />
                  Group cities by geographic proximity
                </li>
                <li className="flex items-start gap-2">
                  <Icon
                    icon="heroicons:check"
                    className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0"
                  />
                  Consider delivery complexity and costs
                </li>
                <li className="flex items-start gap-2">
                  <Icon
                    icon="heroicons:check"
                    className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0"
                  />
                  Plan for future expansion
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-600">
                Need more help setting up your cities and zones?
              </p>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="md">
                  <Icon icon="heroicons:book-open" className="w-4 h-4 mr-2" />
                  Documentation
                </Button>
                <Button variant="outline" size="md">
                  <Icon
                    icon="heroicons:chat-bubble-left-right"
                    className="w-4 h-4 mr-2"
                  />
                  Get Support
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Main page component with protection
export default function CreateCityPage() {
  return (
    <ProtectedRoute
      requiredPermissions={["cities:create"]}
      requiredAccessLevel="FULL"
    >
      <CreateCityPageContent />
    </ProtectedRoute>
  );
}
