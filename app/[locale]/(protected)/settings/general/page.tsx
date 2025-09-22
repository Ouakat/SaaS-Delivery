"use client";

import React, { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "@/i18n/routing";
import { ProtectedRoute } from "@/components/route/protected-route";
import { useSettingsStore } from "@/lib/stores/settings/settings.store";
import { SETTINGS_PERMISSIONS } from "@/lib/constants/settings";
import GeneralSettingsForm from "@/components/settings/general/general-settings-form";
import BrandingManagement from "@/components/settings/general/branding-upload";

const GeneralSettingsPageContent = () => {
  const {
    generalSettings,
    preview,
    isLoading,
    error,
    fetchGeneralSettings,
    fetchPreview,
  } = useSettingsStore();

  // Load data on mount
  useEffect(() => {
    fetchGeneralSettings();
    fetchPreview();
  }, [fetchGeneralSettings, fetchPreview]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/settings">
              <Button variant="ghost" size="md">
                <Icon icon="heroicons:arrow-left" className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </Link>
            <Icon
              icon="heroicons:chevron-right"
              className="w-4 h-4 text-gray-400"
            />
            <span className="text-sm text-gray-500">General</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">General Settings</h1>
          <p className="text-gray-600 mt-1">
            Configure your company information, branding, and basic system
            settings
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          {generalSettings && (
            <Badge color="secondary" className="text-xs">
              Last updated: {formatDate(generalSettings.updatedAt)}
            </Badge>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Form - Takes 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          <GeneralSettingsForm
            onSuccess={() => {
              fetchPreview();
            }}
          />
        </div>

        {/* Sidebar - Takes 1 column */}
        <div className="space-y-6">
          {/* Current Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon icon="heroicons:information-circle" className="w-5 h-5" />
                Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Configuration</span>
                <Badge color={generalSettings ? "success" : "warning"}>
                  {generalSettings ? "Configured" : "Not Set"}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Company Logo</span>
                <Badge color={generalSettings?.logo ? "success" : "secondary"}>
                  {generalSettings?.logo ? "Uploaded" : "Default"}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Favicon</span>
                <Badge
                  color={generalSettings?.favicon ? "success" : "secondary"}
                >
                  {generalSettings?.favicon ? "Uploaded" : "Default"}
                </Badge>
              </div>

              {generalSettings && (
                <>
                  <div className="pt-3 border-t space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Created:</span>
                      <span>{formatDate(generalSettings.createdAt)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Modified:</span>
                      <span>{formatDate(generalSettings.updatedAt)}</span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Preview Card */}
          {preview && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon icon="heroicons:eye" className="w-5 h-5" />
                  Live Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-4 border rounded-lg bg-gray-50">
                  {preview.logo ? (
                    <img
                      src={preview.logo}
                      alt="Company Logo"
                      className="max-h-16 w-auto mx-auto object-contain"
                    />
                  ) : (
                    <div className="h-16 flex items-center justify-center text-gray-400">
                      <Icon icon="heroicons:photo" className="w-8 h-8" />
                    </div>
                  )}
                  <h3 className="font-semibold text-lg mt-2">
                    {preview.companyName || "Company Name"}
                  </h3>
                  {preview.website && (
                    <p className="text-sm text-blue-600">{preview.website}</p>
                  )}
                </div>

                {Object.keys(preview.socials || {}).length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Social Links:</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(preview.socials || {}).map(
                        ([platform, url]) =>
                          url && (
                            <Badge
                              key={platform}
                              color="primary"
                              className="text-xs"
                            >
                              {platform}
                            </Badge>
                          )
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Help Card */}
          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <Icon
                  icon="heroicons:question-mark-circle"
                  className="w-5 h-5"
                />
                Need Help?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-blue-800 mb-4">
                Configure your company information to personalize the system.
                This information will be used in invoices, emails, and
                throughout the application.
              </p>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="md"
                  className="w-full text-blue-700 border-blue-300"
                >
                  <Icon icon="heroicons:book-open" className="w-4 h-4 mr-2" />
                  Documentation
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  className="w-full text-blue-700 border-blue-300"
                >
                  <Icon
                    icon="heroicons:chat-bubble-left-right"
                    className="w-4 h-4 mr-2"
                  />
                  Contact Support
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Branding Management */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Branding Assets
          </h2>
          <p className="text-gray-600">
            Upload your company logo and favicon to customize the appearance of
            your system
          </p>
        </div>

        <BrandingManagement />
      </div>

      {/* Error Handling */}
      {error && (
        <Alert color="destructive">
          <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

// Main component with protection
const GeneralSettingsPage = () => {
  return (
    <ProtectedRoute
      requiredPermissions={[SETTINGS_PERMISSIONS.READ_SETTINGS]}
      requiredAccessLevel="FULL"
      allowedAccountStatuses={["ACTIVE"]}
      requireValidation={true}
    >
      <GeneralSettingsPageContent />
    </ProtectedRoute>
  );
};

export default GeneralSettingsPage;
