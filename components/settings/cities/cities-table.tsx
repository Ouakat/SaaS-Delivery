"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  DropdownMenuLabel,
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
import { useCitiesStore } from "@/lib/stores/cities.store";
import type { City } from "@/lib/types/settings/cities.types";
import {
  CITY_ZONES,
  CITY_STATUS_OPTIONS,
  PICKUP_CITY_OPTIONS,
  CITIES_PAGE_SIZE_OPTIONS,
} from "@/lib/constants/cities";
import { toast } from "sonner";
import { cn } from "@/lib/utils/ui.utils";

// Table components
const Table = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={cn("w-full overflow-auto", className)}>
    <table className="w-full caption-bottom text-sm border-collapse">
      {children}
    </table>
  </div>
);

const TableHeader = ({ children }: { children: React.ReactNode }) => (
  <thead className="[&_tr]:border-b">{children}</thead>
);

const TableBody = ({ children }: { children: React.ReactNode }) => (
  <tbody className="[&_tr:last-child]:border-0">{children}</tbody>
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
  <tr
    className={cn("border-b transition-colors hover:bg-muted/50", className)}
    {...props}
  >
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
    className={cn(
      "h-12 px-4 text-left align-middle font-medium text-muted-foreground",
      className
    )}
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
}) => <td className={cn("p-4 align-middle", className)}>{children}</td>;

// Format date utility
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
};

// Zone badge component
const ZoneBadge = ({ zone }: { zone: string }) => {
  const getZoneColor = (zone: string) => {
    switch (zone) {
      case "Zone A":
        return "bg-blue-100 text-blue-800";
      case "Zone B":
        return "bg-green-100 text-green-800";
      case "Zone C":
        return "bg-yellow-100 text-yellow-800";
      case "Zone D":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
        getZoneColor(zone)
      )}
    >
      {zone}
    </span>
  );
};

// Status badge component
const StatusBadge = ({ status }: { status: boolean }) => (
  <Badge color={status ? "default" : "secondary"}>
    {status ? "Active" : "Inactive"}
  </Badge>
);

// Pickup city badge
const PickupBadge = ({ isPickup }: { isPickup: boolean }) =>
  isPickup ? (
    <Badge
      color="secondary"
      className="bg-green-50 text-green-700 border-green-200"
    >
      <Icon icon="heroicons:check-circle" className="w-3 h-3 mr-1" />
      Pickup
    </Badge>
  ) : null;

interface CitiesTableProps {
  onCityEdit?: (city: City) => void;
  onCityDelete?: (city: City) => void;
  showActions?: boolean;
}

export default function CitiesTable({
  onCityEdit,
  onCityDelete,
  showActions = true,
}: CitiesTableProps) {
  const router = useRouter();
  const {
    cities,
    isLoading,
    pagination,
    filters,
    selectedCityIds,
    setFilters,
    setPagination,
    setSelectedCityIds,
    fetchCities,
    deleteCity,
    toggleCityStatus,
    bulkDeleteCities,
    bulkUpdateStatus,
  } = useCitiesStore();

  // Local state
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    city: City | null;
  }>({
    open: false,
    city: null,
  });
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState(false);

  // Fetch data on component mount
  useEffect(() => {
    fetchCities();
  }, [fetchCities]);

  // Create table columns
  const columns: ColumnDef<City>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
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
      accessorKey: "ref",
      header: "Reference",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("ref")}</div>
      ),
    },
    {
      accessorKey: "name",
      header: "City Name",
      cell: ({ row }) => {
        const city = row.original;
        return (
          <div className="flex items-center gap-2">
            <div>
              <div className="font-medium">{city.name}</div>
              <div className="text-sm text-muted-foreground">
                {city._count && (
                  <>
                    {city._count.pickupTariffs} pickup •{" "}
                    {city._count.destinationTariffs} destination tariffs
                  </>
                )}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "zone",
      header: "Zone",
      cell: ({ row }) => <ZoneBadge zone={row.getValue("zone")} />,
    },
    {
      accessorKey: "pickupCity",
      header: "Pickup City",
      cell: ({ row }) => <PickupBadge isPickup={row.getValue("pickupCity")} />,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => (
        <div className="text-sm">
          <div>{formatDate(row.getValue("createdAt"))}</div>
          {row.original.createdBy && (
            <div className="text-muted-foreground">by Admin</div>
          )}
        </div>
      ),
    },
    ...(showActions
      ? [
          {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => {
              const city = row.original;

              return (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <Icon
                        icon="heroicons:ellipsis-horizontal"
                        className="h-4 w-4"
                      />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem
                      onClick={() => navigator.clipboard.writeText(city.id)}
                    >
                      Copy city ID
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href={`/settings/cities/${city.id}`}>
                        <Icon icon="heroicons:eye" className="mr-2 h-4 w-4" />
                        View details
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/settings/cities/${city.id}/edit`}>
                        <Icon
                          icon="heroicons:pencil"
                          className="mr-2 h-4 w-4"
                        />
                        Edit city
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleToggleStatus(city)}>
                      <Icon
                        icon={
                          city.status ? "heroicons:pause" : "heroicons:play"
                        }
                        className="mr-2 h-4 w-4"
                      />
                      {city.status ? "Deactivate" : "Activate"}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => setDeleteDialog({ open: true, city })}
                    >
                      <Icon icon="heroicons:trash" className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            },
          },
        ]
      : []),
  ];

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
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  // Handle status toggle
  const handleToggleStatus = async (city: City) => {
    const success = await toggleCityStatus(city.id);
    if (success) {
      fetchCities(); // Refresh data
    }
  };

  // Handle delete city
  const handleDeleteCity = async () => {
    if (!deleteDialog.city) return;

    const success = await deleteCity(deleteDialog.city.id);
    if (success) {
      setDeleteDialog({ open: false, city: null });
      fetchCities(); // Refresh data
    }
  };

  // Handle bulk operations
  const handleBulkDelete = async () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const ids = selectedRows.map((row) => row.original.id);

    const success = await bulkDeleteCities(ids);
    if (success) {
      setBulkDeleteDialog(false);
      setRowSelection({});
      fetchCities(); // Refresh data
    }
  };

  const handleBulkStatusUpdate = async (status: boolean) => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const ids = selectedRows.map((row) => row.original.id);

    const success = await bulkUpdateStatus(ids, status);
    if (success) {
      setRowSelection({});
      fetchCities(); // Refresh data
    }
  };

  // Handle filter changes
  const handleSearchChange = (value: string) => {
    setFilters({ search: value });
  };

  const handleZoneFilter = (zone: string) => {
    setFilters({ zone: zone === "all" ? undefined : zone });
  };

  const handleStatusFilter = (status: string) => {
    setFilters({
      status: status === "all" ? undefined : status === "true",
    });
  };

  const handlePickupFilter = (pickup: string) => {
    setFilters({
      pickupCity: pickup === "all" ? undefined : pickup === "true",
    });
  };

  const handlePageSizeChange = (limit: number) => {
    setFilters({ limit, page: 1 });
  };

  const handlePageChange = (page: number) => {
    setFilters({ page });
  };

  // Selected rows count
  const selectedRowsCount = table.getFilteredSelectedRowModel().rows.length;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search cities..."
                value={filters.search || ""}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="max-w-sm"
              />
            </div>

            <Select
              value={filters.zone || "all"}
              onValueChange={handleZoneFilter}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All Zones" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Zones</SelectItem>
                {CITY_ZONES.map((zone) => (
                  <SelectItem key={zone.value} value={zone.value}>
                    {zone.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.status?.toString() || "all"}
              onValueChange={handleStatusFilter}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                {CITY_STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.pickupCity?.toString() || "all"}
              onValueChange={handlePickupFilter}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All Cities" />
              </SelectTrigger>
              <SelectContent>
                {PICKUP_CITY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedRowsCount > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {selectedRowsCount} item(s) selected
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkStatusUpdate(true)}
                >
                  <Icon icon="heroicons:check" className="w-4 h-4 mr-2" />
                  Activate
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkStatusUpdate(false)}
                >
                  <Icon icon="heroicons:pause" className="w-4 h-4 mr-2" />
                  Deactivate
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setBulkDeleteDialog(true)}
                >
                  <Icon icon="heroicons:trash" className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
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
                // Loading skeleton
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
                    No cities found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium">Rows per page</p>
              <Select
                value={`${pagination.limit}`}
                onValueChange={(value) => handlePageSizeChange(Number(value))}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue placeholder={pagination.limit} />
                </SelectTrigger>
                <SelectContent side="top">
                  {CITIES_PAGE_SIZE_OPTIONS.map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-6 lg:space-x-8">
              <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                Page {pagination.page} of {pagination.totalPages}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  className="hidden h-8 w-8 p-0 lg:flex"
                  onClick={() => handlePageChange(1)}
                  disabled={!pagination.hasPrev}
                >
                  <span className="sr-only">Go to first page</span>
                  <Icon
                    icon="heroicons:chevron-double-left"
                    className="h-4 w-4"
                  />
                </Button>
                <Button
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={!pagination.hasPrev}
                >
                  <span className="sr-only">Go to previous page</span>
                  <Icon icon="heroicons:chevron-left" className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.hasNext}
                >
                  <span className="sr-only">Go to next page</span>
                  <Icon icon="heroicons:chevron-right" className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="hidden h-8 w-8 p-0 lg:flex"
                  onClick={() => handlePageChange(pagination.totalPages)}
                  disabled={!pagination.hasNext}
                >
                  <span className="sr-only">Go to last page</span>
                  <Icon
                    icon="heroicons:chevron-double-right"
                    className="h-4 w-4"
                  />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, city: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              city
              <strong> {deleteDialog.city?.name}</strong> and remove all
              associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCity}
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
              Are you sure you want to delete {selectedRowsCount} selected
              cities? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Delete {selectedRowsCount} Cities
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
