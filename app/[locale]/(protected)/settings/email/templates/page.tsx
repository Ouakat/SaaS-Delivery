"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "@/i18n/routing";
import { ProtectedRoute } from "@/components/route/protected-route";
import { useAuthStore } from "@/lib/stores/auth/auth.store";
import EmailTemplatesTable from "@/components/settings/email/email-templates-table";
import { SETTINGS_PERMISSIONS } from "@/lib/constants/settings";

const EmailTemplatesPageContent = () => {
  const { hasPermission } = useAuthStore();

  // Permissions
  const canManageEmailSettings = hasPermission(
    SETTINGS_PERMISSIONS.MANAGE_SETTINGS
  );

  if (!canManageEmailSettings) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-default-900">
              Email Templates
            </h1>
            <p className="text-default-600">
              Manage email templates for automated notifications
            </p>
          </div>
        </div>

        <Alert color="destructive">
          <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <div className="font-medium">Access Denied</div>
              <div>
                You don't have permission to manage email templates. Please
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
            Email Templates
          </h1>
          <p className="text-default-600">
            Create and manage email templates for automated notifications
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/settings/email">
            <Button variant="outline">
              <Icon icon="heroicons:arrow-left" className="w-4 h-4 mr-2" />
              Back to Settings
            </Button>
          </Link>
          <Link href="/settings/email/templates/create">
            <Button>
              <Icon icon="heroicons:plus" className="w-4 h-4 mr-2" />
              New Template
            </Button>
          </Link>
        </div>
      </div>

      {/* Templates Table */}
      <EmailTemplatesTable />

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon icon="heroicons:question-mark-circle" className="w-5 h-5" />
            Need Help?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Using Placeholders</h4>
              <p className="text-sm text-muted-foreground">
                Use placeholders like {"{CLIENT_NAME}"}, {"{TRACKING_NUMBER}"},
                and {"{COMPANY_NAME}"}
                to personalize your emails. Placeholders are automatically
                replaced with actual data when emails are sent.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Template Categories</h4>
              <p className="text-sm text-muted-foreground">
                Organize your templates by category (Parcel, Invoice, Customer,
                etc.) to make them easier to find and manage. Each category has
                its own set of suggested placeholders.
              </p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t">
            <Button variant="outline" size="sm">
              <Icon icon="heroicons:book-open" className="w-4 h-4 mr-2" />
              View Documentation
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Main component wrapped with ProtectedRoute
const EmailTemplatesPage = () => {
  return (
    <ProtectedRoute
      requiredPermissions={[SETTINGS_PERMISSIONS.MANAGE_SETTINGS]}
      requiredAccessLevel="FULL"
      allowedAccountStatuses={["ACTIVE"]}
      requireValidation={true}
    >
      <EmailTemplatesPageContent />
    </ProtectedRoute>
  );
};

export default EmailTemplatesPage;
