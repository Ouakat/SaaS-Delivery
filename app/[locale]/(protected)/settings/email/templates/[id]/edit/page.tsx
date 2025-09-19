"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ProtectedRoute } from "@/components/route/protected-route";
import { useAuthStore } from "@/lib/stores/auth/auth.store";
import { useEmailSettingsStore } from "@/lib/stores/settings/email-settings.store";
import EmailTemplateForm from "@/components/settings/email/email-template-form";
import { SETTINGS_PERMISSIONS } from "@/lib/constants/settings";

const EditTemplatePageContent = () => {
  const params = useParams();
  const templateId = params?.id as string;
  const { hasPermission } = useAuthStore();
  const { selectedTemplate, selectedTemplateLoading, fetchTemplateById } =
    useEmailSettingsStore();

  const [error, setError] = useState<string | null>(null);

  // Permissions
  const canManageEmailSettings = hasPermission(
    SETTINGS_PERMISSIONS.MANAGE_SETTINGS
  );

  // Load template on component mount
  useEffect(() => {
    if (templateId) {
      fetchTemplateById(templateId).catch((error) => {
        setError(
          "Failed to load template. It may have been deleted or you don't have permission to access it."
        );
      });
    }
  }, [templateId, fetchTemplateById]);

  if (!canManageEmailSettings) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-default-900">
              Edit Email Template
            </h1>
            <p className="text-default-600">Modify existing email template</p>
          </div>
        </div>

        <Alert color="destructive">
          <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <div className="font-medium">Access Denied</div>
              <div>
                You don't have permission to edit email templates. Please
                contact your administrator to request access.
              </div>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-default-900">
              Edit Email Template
            </h1>
            <p className="text-default-600">Template not found</p>
          </div>
        </div>

        <Alert color="destructive">
          <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (selectedTemplateLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center justify-center space-x-2">
              <Icon
                icon="heroicons:arrow-path"
                className="w-5 h-5 animate-spin"
              />
              <span>Loading template...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!selectedTemplate) {
    return (
      <div className="space-y-6">
        <Alert color="destructive">
          <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
          <AlertDescription>
            Template not found or has been deleted.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return <EmailTemplateForm template={selectedTemplate} mode="edit" />;
};

// Main component wrapped with ProtectedRoute
const EditTemplatePage = () => {
  return (
    <ProtectedRoute
      requiredPermissions={[SETTINGS_PERMISSIONS.MANAGE_SETTINGS]}
      requiredAccessLevel="FULL"
      allowedAccountStatuses={["ACTIVE"]}
      requireValidation={true}
    >
      <EditTemplatePageContent />
    </ProtectedRoute>
  );
};

export default EditTemplatePage;
