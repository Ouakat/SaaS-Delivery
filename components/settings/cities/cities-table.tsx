"use client";

import React, { useMemo, useState } from "react";
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
import { Input } from "@/components/ui/input";
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
import { useCitiesStore } from "@/lib/stores/cities.store";
import { useAuthStore } from "@/lib/stores/auth.store";
import { SETTINGS_PERMISSIONS } from "@/lib/constants/settings";
import { toast } from "sonner";
import type { City } from "@/lib/types/settings/cities.types";

// Table components
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

// Status badge component
const StatusBadge = ({ status }: { status: boolean }) => (
  <Badge color={status ? "success" : "secondary"}>
    {status ? "Active" : "Inactive"}
  </Badge>
);

// Pickup city badge component
const PickupBadge = ({ isPickup }: { isPickup: boolean }) => (
  <Badge color={isPickup ? "info" : "secondary"} className="text-xs">
    {isPickup ? "Pickup" : "Delivery Only"}
  </Badge>
);

// Zone badge component
const ZoneBadge = ({ zone }: { zone: string }) => (
  <Badge className="bg-blue-100 text-blue-800 text-xs">{zone}</Badge>
);

interface CitiesTableProps {
  onCitySelect?: (city: City) => void;
}

export default function CitiesTable({ onCitySelect }: CitiesTableProps) {
  const { hasPermission } = useAuthStore();
  const {
    cities,
    pagination,
    filters,
    selectedCityIds,
    isLoading,
    isDeleting,
    isBulkProcessing,
    availableZones,
    deleteCity,
    toggleCityStatus,
    bulkDeleteCities,
    bulkToggleStatus,
    setFilters,
    setPage,
    setPageSize,
    selectCity,
    deselectCity,
    selectAllCities,
    clearSelection,
    toggleCitySelection,
  } = useCitiesStore();

  // Permissions
  const canUpdate = hasPermission(SETTINGS_PERMISSIONS.MANAGE_CITIES);
  const canDelete = hasPermission(SETTINGS_PERMISSIONS.MANAGE_CITIES);

  // Local state
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    city: City | null;
  }>({
    open: false,
    city: null,
  });
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState(false);

  // Table columns
  const columns = useMemo<ColumnDef<City>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => {
              if (value) {
                selectAllCities();
              } else {
                clearSelection();
              }
              table.toggleAllPageRowsSelected(!!value);
            }}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={selectedCityIds.includes(row.original.id)}
            onCheckedChange={(value) => {
              toggleCitySelection(row.original.id);
              row.toggleSelected(!!value);
            }}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "ref",
        header: "Reference",
        cell: ({ row }) => (
          <div className="font-mono text-sm font-medium">
            {row.original.ref}
          </div>
        ),
      },
      {
        accessorKey: "name",
        header: "City Name",
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.name}</div>
            <div className="text-xs text-gray-500">
              {row.original._count && (
                <>
                  {row.original._count.pickupTariffs +
                    row.original._count.destinationTariffs}{" "}
                  tariffs
                </>
              )}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "zone",
        header: "Zone",
        cell: ({ row }) => <ZoneBadge zone={row.original.zone} />,
      },
      {
        accessorKey: "pickupCity",
        header: "Type",
        cell: ({ row }) => <PickupBadge isPickup={row.original.pickupCity} />,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }) => (
          <div className="text-sm">
            {new Date(row.original.createdAt).toLocaleDateString()}
          </div>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        enableHiding: false,
        cell: ({ row }) => {
          const city = row.original;

          return (
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
                <DropdownMenuItem asChild>
                  <Link href={`/settings/cities/${city.id}`}>
                    <Icon icon="heroicons:eye" className="mr-2 h-4 w-4" />
                    View Details
                  </Link>
                </DropdownMenuItem>

                {canUpdate && (
                  <DropdownMenuItem asChild>
                    <Link href={`/settings/cities/${city.id}/edit`}>
                      <Icon
                        icon="heroicons:pencil-square"
                        className="mr-2 h-4 w-4"
                      />
                      Edit City
                    </Link>
                  </DropdownMenuItem>
                )}

                {canUpdate && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleToggleStatus(city)}
                      disabled={isLoading}
                    >
                      <Icon
                        icon={
                          city.status ? "heroicons:pause" : "heroicons:play"
                        }
                        className="mr-2 h-4 w-4"
                      />
                      {city.status ? "Deactivate" : "Activate"}
                    </DropdownMenuItem>
                  </>
                )}

                {canDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-600"
                      onClick={() => setDeleteDialog({ open: true, city })}
                      disabled={isDeleting}
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
    ],
    [selectedCityIds, canUpdate, canDelete, isLoading, isDeleting]
  );

  // Table configuration
  const table = useReactTable({
    data: cities,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
    manualPagination: true,
    pageCount: pagination.totalPages,
  });

  // Event handlers
  const handleSearch = (value: string) => {
    setFilters({ search: value, page: 1 });
  };

  const handleZoneFilter = (zone: string) => {
    setFilters({ zone: zone === "all" ? undefined : zone, page: 1 });
  };

  const handleStatusFilter = (status: string) => {
    setFilters({
      status: status === "all" ? undefined : status === "active",
      page: 1,
    });
  };

  const handlePickupFilter = (pickup: string) => {
    setFilters({
      pickupCity: pickup === "all" ? undefined : pickup === "true",
      page: 1,
    });
  };

  const handleToggleStatus = async (city: City) => {
    const result = await toggleCityStatus(city.id);
    if (result) {
      toast.success(
        `City ${result.status ? "activated" : "deactivated"} successfully`
      );
    } else {
      toast.error("Failed to toggle city status");
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.city) return;

    const success = await deleteCity(deleteDialog.city.id);
    if (success) {
      toast.success("City deleted successfully");
      setDeleteDialog({ open: false, city: null });
    } else {
      toast.error("Failed to delete city");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedCityIds.length === 0) return;

    const success = await bulkDeleteCities(selectedCityIds);
    if (success) {
      toast.success(`${selectedCityIds.length} cities deleted successfully`);
      setBulkDeleteDialog(false);
      clearSelection();
    } else {
      toast.error("Failed to delete selected cities");
    }
  };

  const handleBulkStatusToggle = async (status: boolean) => {
    if (selectedCityIds.length === 0) return;

    const success = await bulkToggleStatus(selectedCityIds, status);
    if (success) {
      toast.success(
        `${selectedCityIds.length} cities ${
          status ? "activated" : "deactivated"
        } successfully`
      );
      clearSelection();
    } else {
      toast.error("Failed to update selected cities");
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search cities..."
            value={filters.search || ""}
            onChange={(e) => handleSearch(e.target.value)}
            className="max-w-sm"
          />
        </div>

        <div className="flex gap-2">
          <Select
            value={filters.zone || "all"}
            onValueChange={handleZoneFilter}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Zone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Zones</SelectItem>
              {availableZones.map((zone) => (
                <SelectItem key={zone} value={zone}>
                  {zone}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={
              filters.pickupCity === undefined
                ? "all"
                : filters.pickupCity.toString()
            }
            onValueChange={handlePickupFilter}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="true">Pickup Cities</SelectItem>
              <SelectItem value="false">Delivery Only</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={
              filters.status === undefined ? "all" : filters.status.toString()
            }
            onValueChange={handleStatusFilter}
          >
            <SelectTrigger className="w-[120px]">
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

      {/* Bulk Actions */}
      {selectedCityIds.length > 0 && canUpdate && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <span className="text-sm text-blue-800">
            {selectedCityIds.length} cities selected
          </span>
          <div className="flex gap-2 ml-auto">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkStatusToggle(true)}
              disabled={isBulkProcessing}
            >
              <Icon icon="heroicons:play" className="w-4 h-4 mr-1" />
              Activate
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkStatusToggle(false)}
              disabled={isBulkProcessing}
            >
              <Icon icon="heroicons:pause" className="w-4 h-4 mr-1" />
              Deactivate
            </Button>
            {canDelete && (
              <Button
                size="sm"
                variant="outline"
                className="text-red-600 hover:text-red-700"
                onClick={() => setBulkDeleteDialog(true)}
                disabled={isBulkProcessing}
              >
                <Icon icon="heroicons:trash" className="w-4 h-4 mr-1" />
                Delete
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Table */}
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
            {isLoading ? (
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
                  className={
                    selectedCityIds.includes(row.original.id)
                      ? "bg-blue-50"
                      : ""
                  }
                  onClick={() => onCitySelect?.(row.original)}
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
                  No cities found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
          {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
          {pagination.total} cities
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            <span className="text-sm">Rows per page:</span>
            <Select
              value={pagination.limit.toString()}
              onValueChange={(value) => setPageSize(Number(value))}
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
              onClick={() => setPage(1)}
              disabled={pagination.page === 1}
            >
              <Icon icon="heroicons:chevron-double-left" className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(pagination.page - 1)}
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
              onClick={() => setPage(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
            >
              <Icon icon="heroicons:chevron-right" className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(pagination.totalPages)}
              disabled={pagination.page >= pagination.totalPages}
            >
              <Icon icon="heroicons:chevron-double-right" className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Dialog */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, city: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete City</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong>{deleteDialog.city?.name}</strong>? This action cannot be
              undone and may affect related tariffs.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Delete City
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Dialog */}
      <AlertDialog open={bulkDeleteDialog} onOpenChange={setBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Selected Cities</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedCityIds.length} selected
              cities? This action cannot be undone and may affect related
              tariffs.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Delete {selectedCityIds.length} Cities
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
