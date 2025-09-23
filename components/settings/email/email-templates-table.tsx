"use client";
import React, { useState, useEffect } from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Icon } from "@/components/ui/icon";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Link } from "@/i18n/routing";
import { useEmailSettingsStore } from "@/lib/stores/settings/email-settings.store";
import { EMAIL_TEMPLATE_CATEGORIES } from "@/lib/types/settings/email.types";
import type {
  EmailTemplate,
  EmailTemplateCategory,
} from "@/lib/types/settings/email.types";
import { toast } from "sonner";

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

// Category Badge Component
const CategoryBadge: React.FC<{ category: EmailTemplateCategory }> = ({
  category,
}) => {
  const config = EMAIL_TEMPLATE_CATEGORIES[category];
  return (
    <Badge
      className={`bg-${config.color}-100 text-${config.color}-800 border-${config.color}-200`}
    >
      <Icon icon={config.icon} className="w-3 h-3 mr-1" />
      {config.label}
    </Badge>
  );
};

// Preview Dialog Component
const PreviewDialog: React.FC<{
  template: EmailTemplate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}> = ({ template, open, onOpenChange }) => {
  if (!template) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon icon="heroicons:eye" className="w-5 h-5" />
            Preview Template: {template.name}
          </DialogTitle>
          <DialogDescription>
            <CategoryBadge category={template.category} />
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Subject */}
          <div>
            <h4 className="font-medium text-sm text-gray-900 mb-2">
              Subject Line
            </h4>
            <div className="p-3 bg-gray-50 rounded border text-sm">
              {template.subject}
            </div>
          </div>

          {/* HTML Content */}
          <div>
            <h4 className="font-medium text-sm text-gray-900 mb-2">
              HTML Content Preview
            </h4>
            <div className="border rounded max-h-96 overflow-y-auto">
              <iframe
                srcDoc={template.htmlContent}
                className="w-full h-96"
                title="Email Preview"
                sandbox="allow-same-origin"
              />
            </div>
          </div>

          {/* Text Content */}
          <div>
            <h4 className="font-medium text-sm text-gray-900 mb-2">
              Text Content
            </h4>
            <div className="p-3 bg-gray-50 rounded border text-sm whitespace-pre-wrap max-h-32 overflow-y-auto">
              {template.textContent}
            </div>
          </div>

          {/* Placeholders */}
          {template.placeholders.length > 0 && (
            <div>
              <h4 className="font-medium text-sm text-gray-900 mb-2">
                Available Placeholders
              </h4>
              <div className="flex flex-wrap gap-1">
                {template.placeholders.map((placeholder) => (
                  <Badge key={placeholder} color="primary" className="text-xs">
                    {placeholder}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Table Columns
const createColumns = (
  onEdit: (template: EmailTemplate) => void,
  onDelete: (template: EmailTemplate) => void,
  onDuplicate: (template: EmailTemplate) => void,
  onToggleStatus: (template: EmailTemplate) => void,
  onPreview: (template: EmailTemplate) => void
): ColumnDef<EmailTemplate>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: "Template",
    cell: ({ row }) => {
      const template = row.original;
      return (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{template.name}</span>
            {!template.enabled && (
              <Badge color="primary" className="text-xs">
                Disabled
              </Badge>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            Subject:{" "}
            {template.subject.length > 50
              ? `${template.subject.substring(0, 50)}...`
              : template.subject}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => <CategoryBadge category={row.getValue("category")} />,
  },
  {
    accessorKey: "placeholders",
    header: "Placeholders",
    cell: ({ row }) => {
      const placeholders = row.getValue("placeholders") as string[];
      return (
        <div className="flex items-center gap-1">
          <span className="text-sm">{placeholders.length}</span>
          {placeholders.length > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Icon
                    icon="heroicons:information-circle"
                    className="w-4 h-4 text-muted-foreground"
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <div className="space-y-1">
                    {placeholders.slice(0, 5).map((placeholder) => (
                      <div key={placeholder} className="text-xs">
                        {placeholder}
                      </div>
                    ))}
                    {placeholders.length > 5 && (
                      <div className="text-xs text-muted-foreground">
                        +{placeholders.length - 5} more
                      </div>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "enabled",
    header: "Status",
    cell: ({ row }) => {
      const enabled = row.getValue("enabled") as boolean;
      return (
        <Badge color={enabled ? "success" : "secondary"}>
          {enabled ? "Active" : "Disabled"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "updatedAt",
    header: "Last Updated",
    cell: ({ row }) => {
      const date = new Date(row.getValue("updatedAt"));
      return (
        <div className="text-sm text-muted-foreground">
          {date.toLocaleDateString("en-US", {
            month: "short",
            day: "2-digit",
            year: "numeric",
          })}
        </div>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    enableHiding: false,
    cell: ({ row }) => {
      const template = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="md">
              <Icon icon="heroicons:ellipsis-horizontal" className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onPreview(template)}>
              <Icon icon="heroicons:eye" className="mr-2 h-4 w-4" />
              Preview
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(template)}>
              <Icon icon="heroicons:pencil-square" className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDuplicate(template)}>
              <Icon
                icon="heroicons:document-duplicate"
                className="mr-2 h-4 w-4"
              />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onToggleStatus(template)}>
              <Icon
                icon={template.enabled ? "heroicons:pause" : "heroicons:play"}
                className="mr-2 h-4 w-4"
              />
              {template.enabled ? "Disable" : "Enable"}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600"
              onClick={() => onDelete(template)}
            >
              <Icon icon="heroicons:trash" className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

const EmailTemplatesTable: React.FC = () => {
  const {
    templates,
    templatesLoading,
    templatesFilters,
    templatesPagination,
    fetchEmailTemplates,
    deleteEmailTemplate,
    duplicateTemplate,
    toggleTemplateStatus,
    bulkDeleteTemplates,
    setTemplatesFilters,
  } = useEmailSettingsStore();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    template: EmailTemplate | null;
  }>({ open: false, template: null });
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(
    null
  );
  const [previewOpen, setPreviewOpen] = useState(false);

  // Load templates on mount
  useEffect(() => {
    fetchEmailTemplates();
  }, [fetchEmailTemplates]);

  // Handle search with debouncing
  const [searchQuery, setSearchQuery] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setTemplatesFilters({
        ...templatesFilters,
        search: searchQuery,
        page: 1,
      });
      fetchEmailTemplates();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter handlers
  const handleCategoryFilter = (category: string) => {
    const categoryValue =
      category === "all" ? undefined : (category as EmailTemplateCategory);
    setTemplatesFilters({
      ...templatesFilters,
      category: categoryValue,
      page: 1,
    });
    fetchEmailTemplates();
  };

  const handleStatusFilter = (status: string) => {
    const statusValue = status === "all" ? undefined : status === "active";
    setTemplatesFilters({ ...templatesFilters, enabled: statusValue, page: 1 });
    fetchEmailTemplates();
  };

  // Action handlers
  const handleEdit = (template: EmailTemplate) => {
    // This will be handled by the parent page to navigate to edit route
    window.location.href = `/settings/email/templates/${template.id}/edit`;
  };

  const handleDelete = async (template: EmailTemplate) => {
    const success = await deleteEmailTemplate(template.id);
    if (success) {
      setDeleteDialog({ open: false, template: null });
    }
  };

  const handleDuplicate = async (template: EmailTemplate) => {
    await duplicateTemplate(template.id, `${template.name} (Copy)`);
  };

  const handleToggleStatus = async (template: EmailTemplate) => {
    await toggleTemplateStatus(template.id);
  };

  const handlePreview = (template: EmailTemplate) => {
    setPreviewTemplate(template);
    setPreviewOpen(true);
  };

  const handleBulkDelete = async () => {
    const selectedIds = Object.keys(rowSelection).filter(
      (key) => rowSelection[key]
    );
    if (selectedIds.length === 0) {
      toast.error("Please select templates to delete");
      return;
    }

    const success = await bulkDeleteTemplates(selectedIds);
    if (success) {
      setRowSelection({});
    }
  };

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setTemplatesFilters({ ...templatesFilters, page });
    fetchEmailTemplates();
  };

  const handlePageSizeChange = (limit: number) => {
    setTemplatesFilters({ ...templatesFilters, limit, page: 1 });
    fetchEmailTemplates();
  };

  // Table configuration
  const columns = React.useMemo(
    () =>
      createColumns(
        handleEdit,
        (template) => setDeleteDialog({ open: true, template }),
        handleDuplicate,
        handleToggleStatus,
        handlePreview
      ),
    []
  );

  const table = useReactTable({
    data: templates,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    manualPagination: true,
    pageCount: templatesPagination.totalPages,
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 space-y-2 sm:space-y-0 sm:flex sm:items-center sm:space-x-2">
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="sm:max-w-sm"
          />

          <Select
            value={templatesFilters.category || "all"}
            onValueChange={handleCategoryFilter}
          >
            <SelectTrigger className="sm:w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {Object.entries(EMAIL_TEMPLATE_CATEGORIES).map(
                ([key, config]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <Icon icon={config.icon} className="w-4 h-4" />
                      {config.label}
                    </div>
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>

          <Select
            value={
              templatesFilters.enabled === undefined
                ? "all"
                : templatesFilters.enabled
                ? "active"
                : "disabled"
            }
            onValueChange={handleStatusFilter}
          >
            <SelectTrigger className="sm:w-[120px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="disabled">Disabled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {templatesLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      {columns.map((_, cellIndex) => (
                        <TableCell key={cellIndex}>
                          <div className="h-4 bg-gray-200 rounded animate-pulse" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Icon
                          icon="heroicons:document-text"
                          className="w-8 h-8 text-muted-foreground"
                        />
                        <span>No templates found.</span>
                        <Link href="/settings/email/templates/create">
                          <Button variant="outline" size="md">
                            <Icon
                              icon="heroicons:plus"
                              className="w-4 h-4 mr-2"
                            />
                            Create your first template
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {templatesPagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-600">
            Showing{" "}
            {(templatesPagination.page - 1) * templatesPagination.limit + 1} to{" "}
            {Math.min(
              templatesPagination.page * templatesPagination.limit,
              templatesPagination.total
            )}{" "}
            of {templatesPagination.total} templates
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              <span className="text-sm">Rows per page:</span>
              <Select
                value={templatesFilters.limit?.toString() || "10"}
                onValueChange={(value) => handlePageSizeChange(Number(value))}
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
                size="md"
                onClick={() => handlePageChange(1)}
                disabled={templatesPagination.page === 1}
              >
                <Icon
                  icon="heroicons:chevron-double-left"
                  className="h-4 w-4"
                />
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={() => handlePageChange(templatesPagination.page - 1)}
                disabled={templatesPagination.page === 1}
              >
                <Icon icon="heroicons:chevron-left" className="h-4 w-4" />
              </Button>

              <span className="px-3 py-1 text-sm">
                Page {templatesPagination.page} of{" "}
                {templatesPagination.totalPages}
              </span>

              <Button
                variant="outline"
                size="md"
                onClick={() => handlePageChange(templatesPagination.page + 1)}
                disabled={
                  templatesPagination.page >= templatesPagination.totalPages
                }
              >
                <Icon icon="heroicons:chevron-right" className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={() => handlePageChange(templatesPagination.totalPages)}
                disabled={
                  templatesPagination.page >= templatesPagination.totalPages
                }
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, template: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the template "
              {deleteDialog.template?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteDialog.template && handleDelete(deleteDialog.template)
              }
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Delete Template
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Preview Dialog */}
      <PreviewDialog
        template={previewTemplate}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />
    </div>
  );
};

export default EmailTemplatesTable;
