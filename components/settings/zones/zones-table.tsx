import React, { useState, useMemo } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  SortingState,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
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
import { Link } from "@/i18n/routing";
import { useZonesStore } from "@/lib/stores/zones.store";
import { useAuthStore } from "@/lib/stores/auth.store";
import { toast } from "sonner";
import type { Zone } from "@/lib/types/settings/zones.types";

interface ZonesTableProps {
  canEdit?: boolean;
  canDelete?: boolean;
}

// Simple table components
const Table = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <table className={`w-full border-collapse ${className}`}>{children}</table>
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

export default function ZonesTable({
  canEdit = false,
  canDelete = false,
}: ZonesTableProps) {
  const { hasPermission } = useAuthStore();
  const {
    zones,
    loading,
    pagination,
    selectedZones,
    filters,
    setSelectedZones,
    setFilters,
    deleteZone,
    toggleZoneStatus,
  } = useZonesStore();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    zone: Zone | null;
  }>({ open: false, zone: null });

  // Create table columns
  const columns = useMemo<ColumnDef<Zone>[]>(
    () => [
      // Selection column
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) => {
              table.toggleAllPageRowsSelected(!!value);
              if (value) {
                setSelectedZones(zones.map((zone) => zone.id));
              } else {
                setSelectedZones([]);
              }
            }}
            aria-label="Select all zones"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => {
              row.toggleSelected(!!value);
              const currentSelected = selectedZones;
              if (value) {
                setSelectedZones([...currentSelected, row.original.id]);
              } else {
                setSelectedZones(
                  currentSelected.filter((id) => id !== row.original.id)
                );
              }
            }}
            aria-label="Select zone"
          />
        ),
        enableSorting: false,
        enableHiding: false,
        size: 40,
      },

      // Zone name and info
      {
        accessorKey: "name",
        header: "Zone Name",
        cell: ({ row }) => {
          const zone = row.original;
          return (
            <div>
              <div className="font-medium text-default-900">{zone.name}</div>
              <div className="text-xs text-default-500">
                ID: {zone.id.slice(-8)}
              </div>
            </div>
          );
        },
      },

      // Cities count
      {
        accessorKey: "citiesCount",
        header: "Cities",
        cell: ({ row }) => {
          const zone = row.original;
          const count = zone._count?.cities || zone.cities?.length || 0;
          return (
            <div className="text-center">
              <Badge color={count > 0 ? "secondary" : "default"}>
                {count} {count === 1 ? "city" : "cities"}
              </Badge>
            </div>
          );
        },
        enableSorting: false,
      },

      // Status
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const zone = row.original;
          return (
            <Badge color={zone.status ? "success" : "secondary"}>
              <Icon
                icon={
                  zone.status
                    ? "heroicons:check-circle"
                    : "heroicons:pause-circle"
                }
                className="w-3 h-3 mr-1"
              />
              {zone.status ? "Active" : "Inactive"}
            </Badge>
          );
        },
      },

      // Created date
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }) => {
          const zone = row.original;
          return (
            <div>
              <div className="text-sm">
                {new Date(zone.createdAt).toLocaleDateString()}
              </div>
              <div className="text-xs text-default-500">
                {new Date(zone.createdAt).toLocaleTimeString()}
              </div>
            </div>
          );
        },
      },

      // Actions
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const zone = row.original;

          return (
            <div className="flex items-center gap-2">
              {/* View button */}
              <Link href={`/settings/zones/${zone.id}`}>
                <Button variant="ghost" size="sm">
                  <Icon icon="heroicons:eye" className="w-4 h-4" />
                </Button>
              </Link>

              {/* More actions dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Icon
                      icon="heroicons:ellipsis-horizontal"
                      className="w-4 h-4"
                    />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/settings/zones/${zone.id}`}>
                      <Icon icon="heroicons:eye" className="mr-2 h-4 w-4" />
                      View Details
                    </Link>
                  </DropdownMenuItem>

                  {canEdit && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href={`/settings/zones/${zone.id}/edit`}>
                          <Icon
                            icon="heroicons:pencil-square"
                            className="mr-2 h-4 w-4"
                          />
                          Edit Zone
                        </Link>
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() => handleToggleStatus(zone)}
                      >
                        <Icon
                          icon={
                            zone.status ? "heroicons:pause" : "heroicons:play"
                          }
                          className="mr-2 h-4 w-4"
                        />
                        {zone.status ? "Deactivate" : "Activate"}
                      </DropdownMenuItem>
                    </>
                  )}

                  {canDelete && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600"
                        onClick={() => setDeleteDialog({ open: true, zone })}
                      >
                        <Icon icon="heroicons:trash" className="mr-2 h-4 w-4" />
                        Delete Zone
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
        enableSorting: false,
        size: 100,
      },
    ],
    [zones, selectedZones, canEdit, canDelete, setSelectedZones]
  );

  // Handle toggle status
  const handleToggleStatus = async (zone: Zone) => {
    try {
      await toggleZoneStatus(zone.id);
      toast.success(
        `Zone ${zone.status ? "deactivated" : "activated"} successfully`
      );
    } catch (error) {
      console.error("Failed to toggle zone status:", error);
    }
  };

  // Handle delete zone
  const handleDeleteZone = async () => {
    if (!deleteDialog.zone) return;

    try {
      await deleteZone(deleteDialog.zone.id);
      setDeleteDialog({ open: false, zone: null });
    } catch (error) {
      console.error("Failed to delete zone:", error);
    }
  };

  // Create table instance
  const table = useReactTable({
    data: zones,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
    enableRowSelection: true,
    manualPagination: true,
    pageCount: pagination.totalPages,
  });

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setFilters({ page: newPage });
  };

  // Handle page size change
  const handlePageSizeChange = (newSize: number) => {
    setFilters({ limit: newSize, page: 1 });
  };

  if (loading && zones.length === 0) {
    return (
      <div className="space-y-4">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column, index) => (
                <TableHead key={index}>
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                {columns.map((_, cellIndex) => (
                  <TableCell key={cellIndex}>
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={
                      header.column.columnDef.size
                        ? `w-[${header.column.columnDef.size}px]`
                        : ""
                    }
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        className={`flex items-center gap-2 ${
                          header.column.getCanSort()
                            ? "cursor-pointer select-none"
                            : ""
                        }`}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {header.column.getCanSort() && (
                          <Icon
                            icon={
                              header.column.getIsSorted() === "asc"
                                ? "heroicons:chevron-up"
                                : header.column.getIsSorted() === "desc"
                                ? "heroicons:chevron-down"
                                : "heroicons:chevron-up-down"
                            }
                            className="w-4 h-4"
                          />
                        )}
                      </div>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
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
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <Icon
                      icon="heroicons:map"
                      className="w-12 h-12 text-gray-400"
                    />
                    <div>
                      <h3 className="font-medium text-default-900">
                        No zones found
                      </h3>
                      <p className="text-sm text-default-600">
                        {filters.search || filters.status !== undefined
                          ? "Try adjusting your filters"
                          : "Get started by creating your first zone"}
                      </p>
                    </div>
                    {!filters.search && filters.status === undefined && (
                      <Link href="/settings/zones/create">
                        <Button size="sm">
                          <Icon
                            icon="heroicons:plus"
                            className="w-4 h-4 mr-2"
                          />
                          Create Zone
                        </Button>
                      </Link>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {zones.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-600">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total} zones
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              <span className="text-sm">Rows per page:</span>
              <Select
                value={pagination.limit.toString()}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) =>
          setDeleteDialog({ open, zone: deleteDialog.zone })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Zone</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong>{deleteDialog.zone?.name}</strong>? This action cannot be
              undone and will permanently remove the zone and all its
              associations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteZone}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Delete Zone
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
