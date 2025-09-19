"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Link } from "@/i18n/routing";
import { ProtectedRoute } from "@/components/route/protected-route";
import { SETTINGS_PERMISSIONS } from "@/lib/constants/settings";
import { smsSettingsApiClient } from "@/lib/api/clients/settings/sms-settings.client";
import { useAuthStore } from "@/lib/stores/auth/auth.store";
import { toast } from "sonner";
import SmsTemplateForm from "@/components/settings/sms/sms-template-form";
import type {
  SmsTemplate,
  SmsTemplateFilters,
} from "@/lib/types/settings/sms.types";

// Simple Table Components
const Table = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <table className={`w-full text-left border-collapse ${className}`}>
    {children}
  </table>
);

const TableHeader = ({ children }: { children: React.ReactNode }) => (
  <thead className="bg-gray-50">{children}</thead>
);

const TableBody = ({ children }: { children: React.ReactNode }) => (
  <tbody>{children}</tbody>
);

const TableRow = ({
  children,
  className = "",
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
}) => (
  <tr className={`border-b hover:bg-gray-50 ${className}`} {...props}>
    {children}
  </tr>
);

const TableHead = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <th
    className={`px-4 py-3 text-left text-sm font-medium text-gray-900 ${className}`}
  >
    {children}
  </th>
);

const TableCell = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <td className={`px-4 py-3 text-sm text-gray-700 ${className}`}>{children}</td>
);

const SmsTemplatesPageContent = () => {
  const { hasPermission } = useAuthStore();

  // State
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<SmsTemplate[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // Filters
  const [filters, setFilters] = useState<SmsTemplateFilters>({
    search: "",
    status: undefined,
    page: 1,
    limit: 10,
  });

  // Dialog states
  const [createDialog, setCreateDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    template: SmsTemplate | null;
  }>({ open: false, template: null });
  const [selectedTemplate, setSelectedTemplate] = useState<SmsTemplate | null>(
    null
  );

  // Permissions
  const canManageTemplates = hasPermission(
    SETTINGS_PERMISSIONS.MANAGE_SETTINGS
  );
  const canViewTemplates = hasPermission(SETTINGS_PERMISSIONS.READ_SETTINGS);

  // Fetch templates
  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const result = await smsSettingsApiClient.getSmsTemplates(filters);

      if (result.success && result.data) {
        setTemplates(result.data.data);
        setPagination({
          page: result.data.meta.page,
          limit: result.data.meta.limit,
          total: result.data.meta.total,
          totalPages: result.data.meta.totalPages,
        });
      } else {
        toast.error("Failed to fetch SMS templates");
      }
    } catch (error) {
      console.error("Error fetching SMS templates:", error);
      toast.error("An error occurred while fetching templates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canViewTemplates) {
      fetchTemplates();
    }
  }, [filters, canViewTemplates]);

  // Handle filter changes
  const handleFilterChange = (key: keyof SmsTemplateFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: key !== "page" ? 1 : value, // Reset to page 1 when other filters change
    }));
  };

  // Handle search with debouncing
  const searchTimeoutRef = React.useRef<NodeJS.Timeout>();
  const handleSearchChange = (value: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      handleFilterChange("search", value);
    }, 500);
  };

  // Handle create template
  const handleCreateTemplate = async (templateData: any) => {
    try {
      const result = await smsSettingsApiClient.createSmsTemplate(templateData);

      if (result.success) {
        toast.success("SMS template created successfully");
        setCreateDialog(false);
        fetchTemplates();
      } else {
        toast.error(result.error?.message || "Failed to create template");
      }
    } catch (error) {
      console.error("Error creating template:", error);
      toast.error("An error occurred while creating template");
    }
  };

  // Handle update template
  const handleUpdateTemplate = async (templateData: any) => {
    if (!selectedTemplate) return;

    try {
      const result = await smsSettingsApiClient.updateSmsTemplate(
        selectedTemplate.id,
        templateData
      );

      if (result.success) {
        toast.success("SMS template updated successfully");
        setEditDialog(false);
        setSelectedTemplate(null);
        fetchTemplates();
      } else {
        toast.error(result.error?.message || "Failed to update template");
      }
    } catch (error) {
      console.error("Error updating template:", error);
      toast.error("An error occurred while updating template");
    }
  };

  // Handle delete template
  const handleDeleteTemplate = async (template: SmsTemplate) => {
    try {
      const result = await smsSettingsApiClient.deleteSmsTemplate(template.id);

      if (result.success) {
        toast.success("SMS template deleted successfully");
        setDeleteDialog({ open: false, template: null });
        fetchTemplates();
      } else {
        toast.error(result.error?.message || "Failed to delete template");
      }
    } catch (error) {
      console.error("Error deleting template:", error);
      toast.error("An error occurred while deleting template");
    }
  };

  // Handle toggle status
  const handleToggleStatus = async (template: SmsTemplate) => {
    try {
      const result = await smsSettingsApiClient.toggleSmsTemplateStatus(
        template.id
      );

      if (result.success) {
        toast.success(
          `Template ${result.data.status ? "enabled" : "disabled"} successfully`
        );
        fetchTemplates();
      } else {
        toast.error("Failed to update template status");
      }
    } catch (error) {
      console.error("Error toggling template status:", error);
      toast.error("An error occurred while updating status");
    }
  };

  // Handle duplicate template
  const handleDuplicateTemplate = async (template: SmsTemplate) => {
    try {
      const result = await smsSettingsApiClient.duplicateSmsTemplate(
        template.id,
        `${template.name} (Copy)`
      );

      if (result.success) {
        toast.success("SMS template duplicated successfully");
        fetchTemplates();
      } else {
        toast.error(result.error?.message || "Failed to duplicate template");
      }
    } catch (error) {
      console.error("Error duplicating template:", error);
      toast.error("An error occurred while duplicating template");
    }
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    handleFilterChange("page", page);
  };

  const handlePageSizeChange = (limit: number) => {
    setFilters((prev) => ({ ...prev, limit, page: 1 }));
  };

  // Format content preview
  const formatContentPreview = (content: string, maxLength = 50) => {
    return content.length > maxLength
      ? `${content.substring(0, maxLength)}...`
      : content;
  };

  // Get placeholder badges
  const getPlaceholderBadges = (placeholders: string[]) => {
    return placeholders.slice(0, 3).map((placeholder) => (
      <Badge key={placeholder} color="primary" className="text-xs">
        {placeholder}
      </Badge>
    ));
  };

  if (!canViewTemplates) {
    return (
      <div className="container mx-auto py-8">
        <Alert color="destructive">
          <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to view SMS templates.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-default-900">SMS Templates</h1>
          <p className="text-default-600">
            Manage SMS notification templates with dynamic placeholders
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canManageTemplates && (
            <Button onClick={() => setCreateDialog(true)}>
              <Icon icon="heroicons:plus" className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          )}
          <Link href="/settings/sms">
            <Button variant="outline">
              <Icon icon="heroicons:arrow-left" className="w-4 h-4 mr-2" />
              Back to SMS Settings
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search templates..."
            onChange={(e) => handleSearchChange(e.target.value)}
            className="max-w-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={filters.status?.toString() || "all"}
            onValueChange={(value) =>
              handleFilterChange(
                "status",
                value === "all" ? undefined : value === "true"
              )
            }
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="true">Active</SelectItem>
              <SelectItem value="false">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Templates Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>SMS Templates ({pagination.total})</span>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>
                Page {pagination.page} of {pagination.totalPages}
              </span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Template</TableHead>
                  <TableHead>Content</TableHead>
                  <TableHead>Placeholders</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      {Array.from({ length: 6 }).map((_, cellIndex) => (
                        <TableCell key={cellIndex}>
                          <div className="h-4 bg-gray-200 rounded animate-pulse" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : templates.length > 0 ? (
                  templates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{template.name}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="text-sm text-gray-600">
                            {formatContentPreview(template.content, 60)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {getPlaceholderBadges(template.placeholders)}
                          {template.placeholders.length > 3 && (
                            <Badge color="primary" className="text-xs">
                              +{template.placeholders.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          color={template.status ? "success" : "secondary"}
                        >
                          {template.status ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600">
                          {new Date(template.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Icon
                                icon="heroicons:ellipsis-horizontal"
                                className="h-4 w-4"
                              />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {canManageTemplates && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedTemplate(template);
                                    setEditDialog(true);
                                  }}
                                >
                                  <Icon
                                    icon="heroicons:pencil-square"
                                    className="mr-2 h-4 w-4"
                                  />
                                  Edit Template
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleDuplicateTemplate(template)
                                  }
                                >
                                  <Icon
                                    icon="heroicons:document-duplicate"
                                    className="mr-2 h-4 w-4"
                                  />
                                  Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleToggleStatus(template)}
                                >
                                  <Icon
                                    icon={
                                      template.status
                                        ? "heroicons:eye-slash"
                                        : "heroicons:eye"
                                    }
                                    className="mr-2 h-4 w-4"
                                  />
                                  {template.status ? "Disable" : "Enable"}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600 focus:text-red-600"
                                  onClick={() =>
                                    setDeleteDialog({ open: true, template })
                                  }
                                >
                                  <Icon
                                    icon="heroicons:trash"
                                    className="mr-2 h-4 w-4"
                                  />
                                  Delete Template
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Icon
                          icon="heroicons:document-text"
                          className="w-8 h-8 text-gray-400"
                        />
                        <div className="text-sm text-gray-500">
                          No SMS templates found
                        </div>
                        {canManageTemplates && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCreateDialog(true)}
                          >
                            Create your first template
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t">
              <div className="text-sm text-gray-600">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
                of {pagination.total} templates
              </div>

              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2">
                  <span className="text-sm">Rows per page:</span>
                  <Select
                    value={pagination.limit.toString()}
                    onValueChange={(value) =>
                      handlePageSizeChange(Number(value))
                    }
                  >
                    <SelectTrigger className="w-16">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(1)}
                    disabled={pagination.page === 1}
                  >
                    <Icon
                      icon="heroicons:chevron-double-left"
                      className="h-4 w-4"
                    />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                  >
                    <Icon icon="heroicons:chevron-left" className="h-4 w-4" />
                  </Button>

                  <span className="px-3 py-1 text-sm">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                  >
                    <Icon icon="heroicons:chevron-right" className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.totalPages)}
                    disabled={pagination.page >= pagination.totalPages}
                  >
                    <Icon
                      icon="heroicons:chevron-double-right"
                      className="h-4 w-4"
                    />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Template Dialog */}
      <SmsTemplateForm
        open={createDialog}
        onOpenChange={setCreateDialog}
        onSubmit={handleCreateTemplate}
        title="Create SMS Template"
        submitLabel="Create Template"
      />

      {/* Edit Template Dialog */}
      <SmsTemplateForm
        open={editDialog}
        onOpenChange={(open) => {
          setEditDialog(open);
          if (!open) setSelectedTemplate(null);
        }}
        onSubmit={handleUpdateTemplate}
        title="Edit SMS Template"
        submitLabel="Update Template"
        initialData={selectedTemplate}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, template: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete SMS Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the template "
              {deleteDialog.template?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteDialog.template &&
                handleDeleteTemplate(deleteDialog.template)
              }
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Delete Template
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const SmsTemplatesPage = () => {
  return (
    <ProtectedRoute
      requiredPermissions={[SETTINGS_PERMISSIONS.READ_SETTINGS]}
      requiredAccessLevel="FULL"
    >
      <SmsTemplatesPageContent />
    </ProtectedRoute>
  );
};

export default SmsTemplatesPage;
