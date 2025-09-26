"use client";

import React, { useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Icon } from "@/components/ui/icon";
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
import { useParcelStatusesStore } from "@/lib/stores/parcels/parcel-statuses.store"; // Fixed import path
import { toast } from "sonner";
import type { ParcelStatus } from "@/lib/types/parcels/parcel-statuses.types"; // Fixed import path
import ParcelStatusForm from "./parcel-status-form";

// Color preview component
const ColorPreview: React.FC<{ color: string; name: string }> = ({
  color,
  name,
}) => (
  <div className="flex items-center gap-2">
    <div
      className="w-4 h-4 rounded-full border border-border"
      style={{ backgroundColor: color }}
    />
    <span className="text-sm">{name}</span>
  </div>
);

const ParcelStatusesTable: React.FC = () => {
  const {
    parcelStatuses,
    parcelStatusesLoading,
    deleteParcelStatus,
    toggleParcelStatusStatus,
    bulkDeleteParcelStatuses,
    bulkToggleParcelStatuses,
  } = useParcelStatusesStore(); // Fixed store name

  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState({});
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    status: ParcelStatus | null;
  }>({ open: false, status: null });
  const [editDialog, setEditDialog] = useState<{
    open: boolean;
    status: ParcelStatus | null;
  }>({ open: false, status: null });

  const handleDelete = async (status: ParcelStatus) => {
    if (status.isLocked) {
      toast.error("Cannot delete system status");
      return;
    }
    const success = await deleteParcelStatus(status.id);
    if (success) {
      setDeleteDialog({ open: false, status: null });
    }
  };

  const handleToggleStatus = async (status: ParcelStatus) => {
    await toggleParcelStatusStatus(status.id);
  };

  const handleBulkDelete = async () => {
    const selectedIds = Object.keys(rowSelection);
    const selectedStatuses = parcelStatuses.filter((s) =>
      selectedIds.includes(s.id)
    );
    const deletableStatuses = selectedStatuses.filter((s) => !s.isLocked);

    if (deletableStatuses.length === 0) {
      toast.error("Cannot delete system statuses");
      return;
    }

    const success = await bulkDeleteParcelStatuses(
      deletableStatuses.map((s) => s.id)
    );
    if (success) {
      setRowSelection({});
    }
  };

  const handleBulkToggle = async () => {
    const selectedIds = Object.keys(rowSelection);
    const success = await bulkToggleParcelStatuses(selectedIds);
    if (success) {
      setRowSelection({});
    }
  };

  const columns: ColumnDef<ParcelStatus>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
        />
      ),
      enableSorting: false,
    },
    {
      accessorKey: "code",
      header: "Code",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <code className="px-2 py-1 bg-muted rounded text-sm font-mono">
            {row.getValue("code")}
          </code>
          {row.original.isLocked && (
            <Icon
              icon="heroicons:lock-closed"
              className="w-3 h-3 text-muted-foreground"
            />
          )}
        </div>
      ),
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <ColorPreview color={row.original.color} name={row.getValue("name")} />
      ),
    },
    {
      accessorKey: "color",
      header: "Color",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded border border-border"
            style={{ backgroundColor: row.getValue("color") }}
          />
          <code className="text-xs text-muted-foreground">
            {row.getValue("color")}
          </code>
        </div>
      ),
    },
    {
      accessorKey: "isLocked",
      header: "Type",
      cell: ({ row }) => (
        <Badge
          color={row.getValue("isLocked") ? "secondary" : "default"}
          className="text-xs"
        >
          {row.getValue("isLocked") ? "System" : "Custom"}
        </Badge>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          color={row.getValue("status") ? "default" : "secondary"}
          className="text-xs"
        >
          {row.getValue("status") ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => {
        const date = new Date(row.getValue("createdAt"));
        return (
          <div className="text-sm text-muted-foreground">
            {date.toLocaleDateString()}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const status = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="md">
                <Icon
                  icon="heroicons:ellipsis-horizontal"
                  className="h-4 w-4"
                />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => setEditDialog({ open: true, status })}
              >
                <Icon icon="heroicons:pencil" className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => handleToggleStatus(status)}>
                <Icon
                  icon={status.status ? "heroicons:eye-slash" : "heroicons:eye"}
                  className="mr-2 h-4 w-4"
                />
                {status.status ? "Deactivate" : "Activate"}
              </DropdownMenuItem>

              {!status.isLocked && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => setDeleteDialog({ open: true, status })}
                  >
                    <Icon icon="heroicons:trash" className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: parcelStatuses,
    columns,
    state: {
      sorting,
      rowSelection,
    },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const hasSelection = selectedRows.length > 0;
  const canDeleteSelected = selectedRows.some((row) => !row.original.isLocked);

  if (parcelStatusesLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Icon icon="heroicons:arrow-path" className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Bulk Actions */}
      {hasSelection && (
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <span className="text-sm text-muted-foreground">
            {selectedRows.length} item(s) selected
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="md" onClick={handleBulkToggle}>
              <Icon icon="heroicons:eye" className="w-4 h-4 mr-2" />
              Toggle Status
            </Button>
            {canDeleteSelected && (
              <Button
                variant="outline"
                size="md"
                onClick={handleBulkDelete}
                className="text-destructive hover:text-destructive"
              >
                <Icon icon="heroicons:trash" className="w-4 h-4 mr-2" />
                Delete Selected
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg">
        <table className="w-full">
          <thead className="border-b bg-muted/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="p-4 text-left font-medium"
                    onClick={
                      header.column.getCanSort()
                        ? header.column.getToggleSortingHandler()
                        : undefined
                    }
                    style={{
                      cursor: header.column.getCanSort()
                        ? "pointer"
                        : "default",
                    }}
                  >
                    <div className="flex items-center gap-2">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {header.column.getCanSort() && (
                        <Icon
                          icon="heroicons:chevron-up-down"
                          className="w-4 h-4 text-muted-foreground"
                        />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-b hover:bg-muted/50">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="p-4">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {parcelStatuses.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            <Icon
              icon="heroicons:tag"
              className="w-12 h-12 mx-auto mb-4 opacity-50"
            />
            <p>No parcel statuses found</p>
          </div>
        )}
      </div>

      {/* Delete Dialog */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, status: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Parcel Status</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteDialog.status?.name}"?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteDialog.status && handleDelete(deleteDialog.status)
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      {editDialog.status && (
        <ParcelStatusForm
          open={editDialog.open}
          onClose={() => setEditDialog({ open: false, status: null })}
          status={editDialog.status}
          onSuccess={() => setEditDialog({ open: false, status: null })}
        />
      )}
    </div>
  );
};

export default ParcelStatusesTable;
