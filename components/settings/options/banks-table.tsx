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
import type { Bank } from "@/lib/types/settings/options.types";
import BankForm from "./bank-form";

const BanksTable: React.FC = () => {
  const {
    banks,
    banksLoading,
    deleteBank,
    toggleBankStatus,
    bulkDeleteBanks,
    bulkToggleBanks,
  } = useOptionsStore();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState({});
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    bank: Bank | null;
  }>({ open: false, bank: null });
  const [editDialog, setEditDialog] = useState<{
    open: boolean;
    bank: Bank | null;
  }>({ open: false, bank: null });

  const handleDelete = async (bank: Bank) => {
    const success = await deleteBank(bank.id);
    if (success) {
      setDeleteDialog({ open: false, bank: null });
    }
  };

  const handleToggleStatus = async (bank: Bank) => {
    await toggleBankStatus(bank.id);
  };

  const handleBulkDelete = async () => {
    const selectedIds = Object.keys(rowSelection);
    const success = await bulkDeleteBanks(selectedIds);
    if (success) {
      setRowSelection({});
    }
  };

  const handleBulkToggle = async () => {
    const selectedIds = Object.keys(rowSelection);
    const success = await bulkToggleBanks(selectedIds);
    if (success) {
      setRowSelection({});
    }
  };

  const columns: ColumnDef<Bank>[] = [
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
      header: "Bank Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
            <Icon
              icon="heroicons:building-library"
              className="h-4 w-4 text-purple-600"
            />
          </div>
          <div>
            <div className="font-medium">{row.getValue("name")}</div>
            <div className="text-sm text-muted-foreground">
              Banking institution
            </div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "code",
      header: "Bank Code",
      cell: ({ row }) => (
        <code className="px-2 py-1 bg-muted rounded text-sm font-mono">
          {row.getValue("code")}
        </code>
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
        const bank = row.original;
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
                onClick={() => setEditDialog({ open: true, bank })}
              >
                <Icon icon="heroicons:pencil" className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => handleToggleStatus(bank)}>
                <Icon
                  icon={bank.status ? "heroicons:eye-slash" : "heroicons:eye"}
                  className="mr-2 h-4 w-4"
                />
                {bank.status ? "Deactivate" : "Activate"}
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => setDeleteDialog({ open: true, bank })}
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
    data: banks,
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

  if (banksLoading) {
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

        {banks.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            <Icon
              icon="heroicons:building-library"
              className="w-12 h-12 mx-auto mb-4 opacity-50"
            />
            <p className="text-lg font-medium mb-2">No banks found</p>
            <p className="text-sm">
              Add your first bank to get started with payment processing
            </p>
          </div>
        )}
      </div>

      {/* Delete Dialog */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, bank: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Bank</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteDialog.bank?.name}"? This
              action cannot be undone and may affect existing payment records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteDialog.bank && handleDelete(deleteDialog.bank)
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      {editDialog.bank && (
        <BankForm
          open={editDialog.open}
          onClose={() => setEditDialog({ open: false, bank: null })}
          bank={editDialog.bank}
          onSuccess={() => setEditDialog({ open: false, bank: null })}
        />
      )}
    </div>
  );
};

export default BanksTable;
