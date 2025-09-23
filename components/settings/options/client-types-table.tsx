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
import { useOptionsStore } from "@/lib/stores/settings/options.store";
import { toast } from "sonner";
import type { ClientType } from "@/lib/types/settings/options.types";
import ClientTypeForm from "./client-type-form";

const ClientTypesTable: React.FC = () => {
  const {
    clientTypes,
    clientTypesLoading,
    deleteClientType,
    toggleClientTypeStatus,
    bulkDeleteClientTypes,
    bulkToggleClientTypes,
  } = useOptionsStore();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState({});
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    clientType: ClientType | null;
  }>({ open: false, clientType: null });
  const [editDialog, setEditDialog] = useState<{
    open: boolean;
    clientType: ClientType | null;
  }>({ open: false, clientType: null });

  const handleDelete = async (clientType: ClientType) => {
    const success = await deleteClientType(clientType.id);
    if (success) {
      setDeleteDialog({ open: false, clientType: null });
    }
  };

  const handleToggleStatus = async (clientType: ClientType) => {
    await toggleClientTypeStatus(clientType.id);
  };

  const handleBulkDelete = async () => {
    const selectedIds = Object.keys(rowSelection);
    const success = await bulkDeleteClientTypes(selectedIds);
    if (success) {
      setRowSelection({});
    }
  };

  const handleBulkToggle = async () => {
    const selectedIds = Object.keys(rowSelection);
    const success = await bulkToggleClientTypes(selectedIds);
    if (success) {
      setRowSelection({});
    }
  };

  const columns: ColumnDef<ClientType>[] = [
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
      accessorKey: "name",
      header: "Client Type",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
            <Icon
              icon="heroicons:user-group"
              className="h-4 w-4 text-green-600"
            />
          </div>
          <div>
            <div className="font-medium">{row.getValue("name")}</div>
            <div className="text-sm text-muted-foreground">Client category</div>
          </div>
        </div>
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
          <div className="text-sm">
            <div>{date.toLocaleDateString()}</div>
            <div className="text-muted-foreground text-xs">
              {date.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
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
            {date.toLocaleDateString()}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const clientType = row.original;
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
                onClick={() => setEditDialog({ open: true, clientType })}
              >
                <Icon icon="heroicons:pencil" className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => handleToggleStatus(clientType)}>
                <Icon
                  icon={
                    clientType.status ? "heroicons:eye-slash" : "heroicons:eye"
                  }
                  className="mr-2 h-4 w-4"
                />
                {clientType.status ? "Deactivate" : "Activate"}
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => setDeleteDialog({ open: true, clientType })}
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

  const table = useReactTable({
    data: clientTypes,
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

  if (clientTypesLoading) {
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
            <Button
              variant="outline"
              size="md"
              onClick={handleBulkDelete}
              className="text-destructive hover:text-destructive"
            >
              <Icon icon="heroicons:trash" className="w-4 h-4 mr-2" />
              Delete Selected
            </Button>
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

        {clientTypes.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            <Icon
              icon="heroicons:user-group"
              className="w-12 h-12 mx-auto mb-4 opacity-50"
            />
            <p className="text-lg font-medium mb-2">No client types found</p>
            <p className="text-sm">
              Create your first client type to get started
            </p>
          </div>
        )}
      </div>

      {/* Delete Dialog */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, clientType: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client Type</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteDialog.clientType?.name}"?
              This action cannot be undone and may affect existing client
              records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteDialog.clientType && handleDelete(deleteDialog.clientType)
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      {editDialog.clientType && (
        <ClientTypeForm
          open={editDialog.open}
          onClose={() => setEditDialog({ open: false, clientType: null })}
          clientType={editDialog.clientType}
          onSuccess={() => setEditDialog({ open: false, clientType: null })}
        />
      )}
    </div>
  );
};

export default ClientTypesTable;
