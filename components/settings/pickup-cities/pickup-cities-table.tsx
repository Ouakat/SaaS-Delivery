"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Icon } from "@/components/ui/icon";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { PickupCity } from "@/lib/types/settings/pickup-cities.types";
import { cn } from "@/lib/utils/ui.utils";

interface PickupCitiesTableProps {
  data: PickupCity[];
  loading: boolean;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  selectedIds: string[];
  onSelectAll: (checked: boolean) => void;
  onSelectItem: (id: string, checked: boolean) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (limit: number) => void;
  onEdit: (id: string) => void;
  onView: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
  canUpdate: boolean;
  canDelete: boolean;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const PickupCitiesTable: React.FC<PickupCitiesTableProps> = ({
  data,
  loading,
  pagination,
  selectedIds,
  onSelectAll,
  onSelectItem,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onView,
  onDelete,
  onToggleStatus,
  canUpdate,
  canDelete,
}) => {
  const allSelected = selectedIds.length === data.length && data.length > 0;
  const someSelected =
    selectedIds.length > 0 && selectedIds.length < data.length;

  if (loading) {
    return (
      <div className="space-y-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
              </TableHead>
              <TableHead>
                <div className="w-20 h-4 bg-gray-200 rounded animate-pulse" />
              </TableHead>
              <TableHead>
                <div className="w-32 h-4 bg-gray-200 rounded animate-pulse" />
              </TableHead>
              <TableHead>
                <div className="w-16 h-4 bg-gray-200 rounded animate-pulse" />
              </TableHead>
              <TableHead>
                <div className="w-20 h-4 bg-gray-200 rounded animate-pulse" />
              </TableHead>
              <TableHead>
                <div className="w-24 h-4 bg-gray-200 rounded animate-pulse" />
              </TableHead>
              <TableHead className="w-12">
                <div className="w-8 h-4 bg-gray-200 rounded animate-pulse" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
                </TableCell>
                <TableCell>
                  <div className="w-16 h-4 bg-gray-200 rounded animate-pulse" />
                </TableCell>
                <TableCell>
                  <div className="w-40 h-4 bg-gray-200 rounded animate-pulse" />
                </TableCell>
                <TableCell>
                  <div className="w-12 h-6 bg-gray-200 rounded-full animate-pulse" />
                </TableCell>
                <TableCell>
                  <div className="w-8 h-4 bg-gray-200 rounded animate-pulse" />
                </TableCell>
                <TableCell>
                  <div className="w-24 h-4 bg-gray-200 rounded animate-pulse" />
                </TableCell>
                <TableCell>
                  <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
          <Icon icon="heroicons:building-office" className="w-full h-full" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No pickup cities found
        </h3>
        <p className="text-gray-600 mb-6">
          Get started by creating your first pickup city.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-12">
                <Checkbox
                  checked={allSelected}
                  ref={(ref: any) => {
                    if (ref) ref.indeterminate = someSelected && !allSelected;
                  }}
                  onCheckedChange={(checked) => onSelectAll(!!checked)}
                  aria-label="Select all pickup cities"
                />
              </TableHead>
              <TableHead className="font-semibold">Reference</TableHead>
              <TableHead className="font-semibold">Name</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Tariffs</TableHead>
              <TableHead className="font-semibold">Created</TableHead>
              <TableHead className="w-12 font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((pickupCity) => (
              <TableRow
                key={pickupCity.id}
                className={cn(
                  "hover:bg-gray-50 transition-colors",
                  selectedIds.includes(pickupCity.id) && "bg-blue-50"
                )}
              >
                <TableCell>
                  <Checkbox
                    checked={selectedIds.includes(pickupCity.id)}
                    onCheckedChange={(checked) =>
                      onSelectItem(pickupCity.id, !!checked)
                    }
                    aria-label={`Select ${pickupCity.name}`}
                  />
                </TableCell>

                <TableCell className="font-mono">
                  <span className="text-sm font-medium">{pickupCity.ref}</span>
                </TableCell>

                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-900">
                      {pickupCity.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      ID: {pickupCity.id.slice(-8)}
                    </span>
                  </div>
                </TableCell>

                <TableCell>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <Badge
                            color={pickupCity.status ? "success" : "secondary"}
                            className="cursor-pointer"
                          >
                            <Icon
                              icon={
                                pickupCity.status
                                  ? "heroicons:check-circle"
                                  : "heroicons:x-circle"
                              }
                              className="w-3 h-3 mr-1"
                            />
                            {pickupCity.status ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          Click to{" "}
                          {pickupCity.status ? "deactivate" : "activate"}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {pickupCity._count?.tariffs || 0}
                    </span>
                    {pickupCity._count?.tariffs === 0 && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Icon
                              icon="heroicons:exclamation-triangle"
                              className="w-4 h-4 text-orange-500"
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>No tariffs configured</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </TableCell>

                <TableCell>
                  <div className="text-sm text-gray-600">
                    {formatDate(pickupCity.createdAt)}
                  </div>
                </TableCell>

                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="md">
                        <Icon
                          icon="heroicons:ellipsis-vertical"
                          className="h-4 w-4"
                        />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onView(pickupCity.id)}>
                        <Icon icon="heroicons:eye" className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>

                      {canUpdate && (
                        <>
                          <DropdownMenuItem
                            onClick={() => onEdit(pickupCity.id)}
                          >
                            <Icon
                              icon="heroicons:pencil-square"
                              className="h-4 w-4 mr-2"
                            />
                            Edit
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            onClick={() => onToggleStatus(pickupCity.id)}
                          >
                            <Icon
                              icon={
                                pickupCity.status
                                  ? "heroicons:x-circle"
                                  : "heroicons:check-circle"
                              }
                              className="h-4 w-4 mr-2"
                            />
                            {pickupCity.status ? "Deactivate" : "Activate"}
                          </DropdownMenuItem>
                        </>
                      )}

                      {canDelete && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onDelete(pickupCity.id)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Icon
                              icon="heroicons:trash"
                              className="h-4 w-4 mr-2"
                            />
                            Delete
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
        <div className="text-sm text-gray-600">
          Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
          {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
          {pagination.total} pickup cities
        </div>

        <div className="flex items-center gap-4">
          {/* Page Size Selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Rows per page:</span>
            <Select
              value={pagination.limit.toString()}
              onValueChange={(value) => onPageSizeChange(parseInt(value))}
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

          {/* Page Navigation */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="md"
              onClick={() => onPageChange(1)}
              disabled={pagination.page === 1}
            >
              <Icon icon="heroicons:chevron-double-left" className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="md"
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={!pagination.hasPrev}
            >
              <Icon icon="heroicons:chevron-left" className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-1">
              <span className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.totalPages}
              </span>
            </div>

            <Button
              variant="outline"
              size="md"
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={!pagination.hasNext}
            >
              <Icon icon="heroicons:chevron-right" className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="md"
              onClick={() => onPageChange(pagination.totalPages)}
              disabled={pagination.page === pagination.totalPages}
            >
              <Icon icon="heroicons:chevron-double-right" className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PickupCitiesTable;
