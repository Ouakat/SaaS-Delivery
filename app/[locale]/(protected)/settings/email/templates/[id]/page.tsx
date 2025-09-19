"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Link } from "@/i18n/routing";
import { ProtectedRoute } from "@/components/route/protected-route";
import { useAuthStore } from "@/lib/stores/auth/auth.store";
import { useEmailSettingsStore } from "@/lib/stores/settings/email-settings.store";
import { EMAIL_TEMPLATE_CATEGORIES } from "@/lib/types/settings/email.types";
import { SETTINGS_PERMISSIONS } from "@/lib/constants/settings";

const ViewTemplatePageContent = () => {
  const params = useParams();
  const router = useRouter();
  const templateId = params?.id as string;
  const { hasPermission } = useAuthStore();
  const {
    selectedTemplate,
    selectedTemplateLoading,
    fetchTemplateById,
    deleteEmailTemplate,
    toggleTemplateStatus,
    duplicateTemplate,
  } = useEmailSettingsStore();

  const [error, setError] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

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

  const handleDelete = async () => {
    if (!selectedTemplate) return;

    setActionLoading(true);
    const success = await deleteEmailTemplate(selectedTemplate.id);
    setActionLoading(false);

    if (success) {
      router.push("/settings/email/templates");
    }
    setDeleteDialog(false);
  };

  const handleToggleStatus = async () => {
    if (!selectedTemplate) return;

    setActionLoading(true);
    await toggleTemplateStatus(selectedTemplate.id);
    setActionLoading(false);
  };

  const handleDuplicate = async () => {
    if (!selectedTemplate) return;

    setActionLoading(true);
    const success = await duplicateTemplate(
      selectedTemplate.id,
      `${selectedTemplate.name} (Copy)`
    );
    setActionLoading(false);

    if (success) {
      router.push("/settings/email/templates");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!canManageEmailSettings) {
    return (
      <div className="space-y-6">
        <Alert color="destructive">
          <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <div className="font-medium">Access Denied</div>
              <div>
                You don't have permission to view email templates. Please
                contact your administrator to request access.
              </div>
            </div>
          </AlertDescription>
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

  if (error || !selectedTemplate) {
    return (
      <div className="space-y-6">
        <Alert color="destructive">
          <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
          <AlertDescription>
            {error || "Template not found or has been deleted."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const categoryConfig = EMAIL_TEMPLATE_CATEGORIES[selectedTemplate.category];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold text-default-900">
                {selectedTemplate.name}
              </h1>
              {!selectedTemplate.enabled && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Icon
                        icon="heroicons:pause-circle"
                        className="w-6 h-6 text-gray-500"
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Template is disabled</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <p className="text-lg text-default-600">
              {selectedTemplate.subject}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Badge
                className={`bg-${categoryConfig.color}-100 text-${categoryConfig.color}-800 border-${categoryConfig.color}-200`}
              >
                <Icon icon={categoryConfig.icon} className="w-3 h-3 mr-1" />
                {categoryConfig.label}
              </Badge>
              <Badge color={selectedTemplate.enabled ? "success" : "secondary"}>
                {selectedTemplate.enabled ? "Active" : "Disabled"}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button disabled={actionLoading}>
                <Icon
                  icon="heroicons:ellipsis-horizontal"
                  className="w-4 h-4 mr-2"
                />
                Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link
                  href={`/settings/email/templates/${selectedTemplate.id}/edit`}
                >
                  <Icon
                    icon="heroicons:pencil-square"
                    className="mr-2 h-4 w-4"
                  />
                  Edit Template
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem onClick={handleDuplicate}>
                <Icon
                  icon="heroicons:document-duplicate"
                  className="mr-2 h-4 w-4"
                />
                Duplicate Template
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={handleToggleStatus}>
                <Icon
                  icon={
                    selectedTemplate.enabled
                      ? "heroicons:pause"
                      : "heroicons:play"
                  }
                  className="mr-2 h-4 w-4"
                />
                {selectedTemplate.enabled
                  ? "Disable Template"
                  : "Enable Template"}
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                className="text-red-600 focus:text-red-600"
                onClick={() => setDeleteDialog(true)}
              >
                <Icon icon="heroicons:trash" className="mr-2 h-4 w-4" />
                Delete Template
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Link href="/settings/email/templates">
            <Button variant="outline">
              <Icon icon="heroicons:arrow-left" className="w-4 h-4 mr-2" />
              Back to Templates
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Subject Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon icon="heroicons:at-symbol" className="w-5 h-5" />
                Subject Line
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-muted rounded-lg border text-lg">
                {selectedTemplate.subject}
              </div>
            </CardContent>
          </Card>

          {/* HTML Content Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon icon="heroicons:code-bracket" className="w-5 h-5" />
                HTML Content Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <iframe
                  srcDoc={selectedTemplate.htmlContent}
                  className="w-full h-96"
                  title="HTML Preview"
                  sandbox="allow-same-origin"
                />
              </div>
              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                  View HTML Source
                </summary>
                <div className="mt-2 p-4 bg-muted rounded-lg">
                  <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
                    {selectedTemplate.htmlContent}
                  </pre>
                </div>
              </details>
            </CardContent>
          </Card>

          {/* Text Content */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon icon="heroicons:document-text" className="w-5 h-5" />
                Text Content
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-muted rounded-lg border whitespace-pre-wrap text-sm max-h-64 overflow-y-auto">
                {selectedTemplate.textContent}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Template Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon icon="heroicons:information-circle" className="w-5 h-5" />
                Template Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-default-900">Category</h4>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    className={`bg-${categoryConfig.color}-100 text-${categoryConfig.color}-800 border-${categoryConfig.color}-200`}
                  >
                    <Icon icon={categoryConfig.icon} className="w-3 h-3 mr-1" />
                    {categoryConfig.label}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {categoryConfig.description}
                </p>
              </div>

              <div>
                <h4 className="font-medium text-default-900">Status</h4>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    color={selectedTemplate.enabled ? "success" : "secondary"}
                  >
                    <Icon
                      icon={
                        selectedTemplate.enabled
                          ? "heroicons:check-circle"
                          : "heroicons:pause-circle"
                      }
                      className="w-3 h-3 mr-1"
                    />
                    {selectedTemplate.enabled ? "Active" : "Disabled"}
                  </Badge>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-default-900">Placeholders</h4>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedTemplate.placeholders.length > 0 ? (
                    selectedTemplate.placeholders.map((placeholder) => (
                      <Badge
                        key={placeholder}
                        color="primary"
                        className="text-xs"
                      >
                        {placeholder}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      No placeholders
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon icon="heroicons:calendar" className="w-5 h-5" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-default-900">Created</h4>
                <p className="text-sm text-default-600">
                  {formatDate(selectedTemplate.createdAt)}
                </p>
              </div>

              <div>
                <h4 className="font-medium text-default-900">Last Updated</h4>
                <p className="text-sm text-default-600">
                  {formatDate(selectedTemplate.updatedAt)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon icon="heroicons:bolt" className="w-5 h-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link
                href={`/settings/email/templates/${selectedTemplate.id}/edit`}
              >
                <Button variant="outline" className="w-full justify-start">
                  <Icon
                    icon="heroicons:pencil-square"
                    className="w-4 h-4 mr-2"
                  />
                  Edit Template
                </Button>
              </Link>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleDuplicate}
                disabled={actionLoading}
              >
                <Icon
                  icon="heroicons:document-duplicate"
                  className="w-4 h-4 mr-2"
                />
                Duplicate Template
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleToggleStatus}
                disabled={actionLoading}
              >
                <Icon
                  icon={
                    selectedTemplate.enabled
                      ? "heroicons:pause"
                      : "heroicons:play"
                  }
                  className="w-4 h-4 mr-2"
                />
                {selectedTemplate.enabled ? "Disable" : "Enable"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the template "
              {selectedTemplate.name}"? This action cannot be undone and any
              automation using this template will stop working.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={actionLoading}
            >
              {actionLoading && (
                <Icon
                  icon="heroicons:arrow-path"
                  className="mr-2 h-4 w-4 animate-spin"
                />
              )}
              Delete Template
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// Main component wrapped with ProtectedRoute
const ViewTemplatePage = () => {
  return (
    <ProtectedRoute
      requiredPermissions={[SETTINGS_PERMISSIONS.MANAGE_SETTINGS]}
      requiredAccessLevel="FULL"
      allowedAccountStatuses={["ACTIVE"]}
      requireValidation={true}
    >
      <ViewTemplatePageContent />
    </ProtectedRoute>
  );
};

export default ViewTemplatePage;
