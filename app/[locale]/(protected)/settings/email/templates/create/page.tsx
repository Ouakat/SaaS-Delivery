"use client";
import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Icon } from "@/components/ui/icon";
import { ProtectedRoute } from "@/components/route/protected-route";
import { useAuthStore } from "@/lib/stores/auth/auth.store";
import EmailTemplateForm from "@/components/settings/email/email-template-form";
import { SETTINGS_PERMISSIONS } from "@/lib/constants/settings";

const CreateTemplatePageContent = () => {
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
              Create Email Template
            </h1>
            <p className="text-default-600">
              Design a new email template for automated notifications
            </p>
          </div>
        </div>

        <Alert color="destructive">
          <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <div className="font-medium">Access Denied</div>
              <div>
                You don't have permission to create email templates. Please
                contact your administrator to request access.
              </div>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return <EmailTemplateForm mode="create" />;
};

// Main component wrapped with ProtectedRoute
const CreateTemplatePage = () => {
  return (
    <ProtectedRoute
      requiredPermissions={[SETTINGS_PERMISSIONS.MANAGE_SETTINGS]}
      requiredAccessLevel="FULL"
      allowedAccountStatuses={["ACTIVE"]}
      requireValidation={true}
    >
      <CreateTemplatePageContent />
    </ProtectedRoute>
  );
};

export default CreateTemplatePage;
