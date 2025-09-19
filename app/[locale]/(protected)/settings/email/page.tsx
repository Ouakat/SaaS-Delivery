"use client";
import React, { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "@/i18n/routing";
import { ProtectedRoute } from "@/components/route/protected-route";
import { useAuthStore } from "@/lib/stores/auth/auth.store";
import { useEmailSettingsStore } from "@/lib/stores/settings/email-settings.store";
import { EMAIL_TEMPLATE_CATEGORIES } from "@/lib/types/settings/email.types";
import EmailSettingsForm from "@/components/settings/email/email-settings-form";
import { SETTINGS_PERMISSIONS } from "@/lib/constants/settings";

const EmailSettingsPageContent = () => {
  const { hasPermission } = useAuthStore();
  const {
    emailSettings,
    stats,
    fetchEmailStats,
    settingsLoading,
    statsLoading,
  } = useEmailSettingsStore();

  // Permissions
  const canManageEmailSettings = hasPermission(
    SETTINGS_PERMISSIONS.MANAGE_SETTINGS
  );

  // Load stats on component mount
  useEffect(() => {
    fetchEmailStats();
  }, [fetchEmailStats]);

  const getStatusColor = () => {
    if (!emailSettings) return "secondary";
    return emailSettings.enabled ? "success" : "warning";
  };

  const getStatusLabel = () => {
    if (!emailSettings) return "Not Configured";
    return emailSettings.enabled ? "Active" : "Disabled";
  };

  if (!canManageEmailSettings) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-default-900">
              Email Settings
            </h1>
            <p className="text-default-600">
              Configure email notifications and templates
            </p>
          </div>
        </div>

        <Alert color="destructive">
          <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <div className="font-medium">Access Denied</div>
              <div>
                You don't have permission to manage email settings. Please
                contact your administrator to request access.
              </div>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-default-900">
            Email Settings
          </h1>
          <p className="text-default-600">
            Configure SMTP settings and manage email templates
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge color={getStatusColor()}>{getStatusLabel()}</Badge>
          <Link href="/settings/email/templates">
            <Button variant="outline">
              <Icon icon="heroicons:document-text" className="w-4 h-4 mr-2" />
              Manage Templates
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Icon
                    icon="heroicons:document-text"
                    className="w-6 h-6 text-blue-600"
                  />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Templates
                  </p>
                  <p className="text-2xl font-bold">{stats.totalTemplates}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Icon
                    icon="heroicons:check-circle"
                    className="w-6 h-6 text-green-600"
                  />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    Active Templates
                  </p>
                  <p className="text-2xl font-bold">{stats.activeTemplates}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div
                  className={`p-2 rounded-lg ${
                    emailSettings?.enabled ? "bg-green-100" : "bg-gray-100"
                  }`}
                >
                  <Icon
                    icon="heroicons:cog-6-tooth"
                    className={`w-6 h-6 ${
                      emailSettings?.enabled
                        ? "text-green-600"
                        : "text-gray-600"
                    }`}
                  />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    SMTP Status
                  </p>
                  <p className="text-2xl font-bold">
                    {emailSettings?.enabled ? "Enabled" : "Disabled"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Icon
                    icon="heroicons:tag"
                    className="w-6 h-6 text-purple-600"
                  />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    Categories
                  </p>
                  <p className="text-2xl font-bold">
                    {Object.keys(stats.templatesByCategory).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Categories Overview */}
      {stats && Object.keys(stats.templatesByCategory).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon icon="heroicons:squares-2x2" className="w-5 h-5" />
              Templates by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {Object.entries(EMAIL_TEMPLATE_CATEGORIES).map(
                ([key, config]) => {
                  const count =
                    stats.templatesByCategory[
                      key as keyof typeof stats.templatesByCategory
                    ] || 0;
                  return (
                    <div
                      key={key}
                      className="text-center p-4 border rounded-lg"
                    >
                      <Icon
                        icon={config.icon}
                        className={`w-8 h-8 mx-auto mb-2 text-${config.color}-600`}
                      />
                      <div className="text-2xl font-bold">{count}</div>
                      <div className="text-sm text-muted-foreground">
                        {config.label}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon icon="heroicons:bolt" className="w-5 h-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/settings/email/templates" className="group">
              <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="flex flex-col items-center gap-3 text-center">
                  <Icon
                    icon="heroicons:document-text"
                    className="w-8 h-8 text-blue-600 group-hover:scale-110 transition-transform"
                  />
                  <div>
                    <div className="font-medium">Manage Templates</div>
                    <div className="text-xs text-muted-foreground">
                      View all templates
                    </div>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/settings/email/templates/create" className="group">
              <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="flex flex-col items-center gap-3 text-center">
                  <Icon
                    icon="heroicons:plus"
                    className="w-8 h-8 text-green-600 group-hover:scale-110 transition-transform"
                  />
                  <div>
                    <div className="font-medium">New Template</div>
                    <div className="text-xs text-muted-foreground">
                      Create email template
                    </div>
                  </div>
                </div>
              </div>
            </Link>

            <div className="group cursor-pointer">
              <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex flex-col items-center gap-3 text-center">
                  <Icon
                    icon="heroicons:beaker"
                    className="w-8 h-8 text-purple-600 group-hover:scale-110 transition-transform"
                  />
                  <div>
                    <div className="font-medium">Test Email</div>
                    <div className="text-xs text-muted-foreground">
                      Send test message
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="group cursor-pointer">
              <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex flex-col items-center gap-3 text-center">
                  <Icon
                    icon="heroicons:chart-bar"
                    className="w-8 h-8 text-orange-600 group-hover:scale-110 transition-transform"
                  />
                  <div>
                    <div className="font-medium">Analytics</div>
                    <div className="text-xs text-muted-foreground">
                      Email statistics
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Settings Form */}
      <EmailSettingsForm />

      {/* Configuration Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon icon="heroicons:information-circle" className="w-5 h-5" />
            Configuration Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Icon
                  icon="heroicons:server"
                  className={`w-5 h-5 ${
                    emailSettings?.enabled ? "text-green-600" : "text-gray-400"
                  }`}
                />
                <div>
                  <div className="font-medium">SMTP Configuration</div>
                  <div className="text-sm text-muted-foreground">
                    {emailSettings?.smtpHost
                      ? `${emailSettings.smtpHost}:${emailSettings.smtpPort}`
                      : "Not configured"}
                  </div>
                </div>
              </div>
              <Badge color={emailSettings?.enabled ? "success" : "secondary"}>
                {emailSettings?.enabled ? "Active" : "Inactive"}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Icon
                  icon="heroicons:envelope"
                  className={`w-5 h-5 ${
                    emailSettings?.fromEmail ? "text-blue-600" : "text-gray-400"
                  }`}
                />
                <div>
                  <div className="font-medium">From Address</div>
                  <div className="text-sm text-muted-foreground">
                    {emailSettings?.fromEmail || "Not set"}
                  </div>
                </div>
              </div>
              <Badge color={emailSettings?.fromEmail ? "success" : "secondary"}>
                {emailSettings?.fromEmail ? "Set" : "Missing"}
              </Badge>
            </div>
          </div>

          {stats && stats.lastConfigured && (
            <div className="text-sm text-muted-foreground">
              Last configured: {new Date(stats.lastConfigured).toLocaleString()}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Main component wrapped with ProtectedRoute
const EmailSettingsPage = () => {
  return (
    <ProtectedRoute
      requiredPermissions={[SETTINGS_PERMISSIONS.MANAGE_SETTINGS]}
      requiredAccessLevel="FULL"
      allowedAccountStatuses={["ACTIVE"]}
      requireValidation={true}
    >
      <EmailSettingsPageContent />
    </ProtectedRoute>
  );
};

export default EmailSettingsPage;
