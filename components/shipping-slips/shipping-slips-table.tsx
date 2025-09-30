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
import { Link } from "@/i18n/routing";
import { useShippingSlipsStore } from "@/lib/stores/parcels/shipping-slips.store";
import {
  ShippingSlip,
  ShippingSlipStatus,
} from "@/lib/types/parcels/shipping-slips.types";
import { cn } from "@/lib/utils/ui.utils";

interface ShippingSlipsTableProps {
  shippingSlips: ShippingSlip[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  isLoading: boolean;
  onPageChange: (page: number) => void;
  canUpdate: boolean;
  canDelete: boolean;
  canBulkActions: boolean;
}

const statusConfig = {
  [ShippingSlipStatus.PENDING]: {
    label: "Pending",
    color: "bg-yellow-100 text-yellow-800",
    icon: "heroicons:clock",
  },
  [ShippingSlipStatus.SHIPPED]: {
    label: "Shipped",
    color: "bg-blue-100 text-blue-800",
    icon: "heroicons:truck",
  },
  [ShippingSlipStatus.RECEIVED]: {
    label: "Received",
    color: "bg-green-100 text-green-800",
    icon: "heroicons:check-circle",
  },
  [ShippingSlipStatus.CANCELLED]: {
    label: "Cancelled",
    color: "bg-red-100 text-red-800",
    icon: "heroicons:x-circle",
  },
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const ShippingSlipsTable: React.FC<ShippingSlipsTableProps> = ({
  shippingSlips,
  pagination,
  isLoading,
  onPageChange,
  canUpdate,
  canDelete,
  canBulkActions,
}) => {
  const {
    selectedSlipIds,
    setSelectedSlipIds,
    markAsShipped,
    markAsReceived,
    cancelShippingSlip,
    deleteShippingSlip,
  } = useShippingSlipsStore();

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedSlipIds(shippingSlips.map((slip) => slip.id));
    } else {
      setSelectedSlipIds([]);
    }
  };

  const handleSelectSlip = (slipId: string, checked: boolean) => {
    if (checked) {
      setSelectedSlipIds([...selectedSlipIds, slipId]);
    } else {
      setSelectedSlipIds(selectedSlipIds.filter((id) => id !== slipId));
    }
  };

  const handleMarkAsShipped = async (slipId: string) => {
    await markAsShipped(slipId);
  };

  const handleMarkAsReceived = async (slipId: string) => {
    await markAsReceived(slipId);
  };

  const handleCancelSlip = async (slipId: string) => {
    if (window.confirm("Are you sure you want to cancel this shipping slip?")) {
      await cancelShippingSlip(slipId);
    }
  };

  const handleDeleteSlip = async (slipId: string) => {
    if (window.confirm("Are you sure you want to delete this shipping slip?")) {
      await deleteShippingSlip(slipId);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {canBulkActions && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={
                      shippingSlips.length > 0 &&
                      selectedSlipIds.length === shippingSlips.length
                    }
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
              )}
              <TableHead>Reference</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Destination Zone</TableHead>
              <TableHead>Parcels</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Total Value</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shippingSlips.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={canBulkActions ? 9 : 8}
                  className="text-center py-8"
                >
                  <div className="space-y-2">
                    <Icon
                      icon="heroicons:truck"
                      className="w-12 h-12 text-muted-foreground mx-auto"
                    />
                    <p className="text-muted-foreground">
                      No shipping slips found
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              shippingSlips.map((slip) => {
                const statusInfo = statusConfig[slip.status];
                const canModify = slip.status === ShippingSlipStatus.PENDING;
                const canShip = slip.status === ShippingSlipStatus.PENDING;
                const canReceive = slip.status === ShippingSlipStatus.SHIPPED;
                const progressPercent =
                  slip._count && slip._count.items > 0
                    ? Math.round(
                        (slip._count.scannedItems / slip._count.items) * 100
                      )
                    : 0;

                return (
                  <TableRow key={slip.id}>
                    {canBulkActions && (
                      <TableCell>
                        <Checkbox
                          checked={selectedSlipIds.includes(slip.id)}
                          onCheckedChange={(checked) =>
                            handleSelectSlip(slip.id, checked as boolean)
                          }
                        />
                      </TableCell>
                    )}
                    <TableCell>
                      <Link
                        href={`/shipping-slips/${slip.id}`}
                        className="hover:underline"
                      >
                        <code className="text-sm font-medium text-primary">
                          {slip.reference}
                        </code>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("text-xs", statusInfo.color)}>
                        <Icon icon={statusInfo.icon} className="w-3 h-3 mr-1" />
                        {statusInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(slip.createdAt.toString())}
                    </TableCell>
                    <TableCell>
                      {slip.destinationZone ? (
                        <Badge color="primary" className="text-xs">
                          {slip.destinationZone.name}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Not specified
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <span className="font-medium">
                          {slip._count?.items || 0}
                        </span>
                        <span className="text-muted-foreground"> total</span>
                      </div>
                      {slip._count && slip._count.scannedItems > 0 && (
                        <div className="text-xs text-green-600">
                          {slip._count.scannedItems} scanned
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-primary h-1.5 rounded-full"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground min-w-[35px]">
                          {progressPercent}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge color="primary" className="text-xs">
                        {slip._count?.totalValue?.toFixed(2) || "0.00"} DH
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
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
                            <Link href={`/shipping-slips/${slip.id}`}>
                              <Icon
                                icon="heroicons:eye"
                                className="mr-2 h-4 w-4"
                              />
                              View Details
                            </Link>
                          </DropdownMenuItem>

                          {canUpdate && canModify && (
                            <DropdownMenuItem asChild>
                              <Link href={`/shipping-slips/${slip.id}/edit`}>
                                <Icon
                                  icon="heroicons:pencil-square"
                                  className="mr-2 h-4 w-4"
                                />
                                Edit Slip
                              </Link>
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuItem asChild>
                            <Link href={`/shipping-slips/${slip.id}/scan`}>
                              <Icon
                                icon="heroicons:qr-code"
                                className="mr-2 h-4 w-4"
                              />
                              Scan Parcels
                            </Link>
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          {canShip && (
                            <DropdownMenuItem
                              onClick={() => handleMarkAsShipped(slip.id)}
                            >
                              <Icon
                                icon="heroicons:truck"
                                className="mr-2 h-4 w-4 text-blue-600"
                              />
                              Mark as Shipped
                            </DropdownMenuItem>
                          )}

                          {canReceive && (
                            <DropdownMenuItem
                              onClick={() => handleMarkAsReceived(slip.id)}
                            >
                              <Icon
                                icon="heroicons:check"
                                className="mr-2 h-4 w-4 text-green-600"
                              />
                              Mark as Received
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuItem>
                            <Icon
                              icon="heroicons:document-arrow-down"
                              className="mr-2 h-4 w-4"
                            />
                            Download PDF
                          </DropdownMenuItem>

                          {slip.status !== ShippingSlipStatus.RECEIVED && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-yellow-600 focus:text-yellow-600"
                                onClick={() => handleCancelSlip(slip.id)}
                              >
                                <Icon
                                  icon="heroicons:x-circle"
                                  className="mr-2 h-4 w-4"
                                />
                                Cancel Slip
                              </DropdownMenuItem>
                            </>
                          )}

                          {canDelete && canModify && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                onClick={() => handleDeleteSlip(slip.id)}
                              >
                                <Icon
                                  icon="heroicons:trash"
                                  className="mr-2 h-4 w-4"
                                />
                                Delete Slip
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t">
          <div className="text-sm text-muted-foreground">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total} results
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={!pagination.hasPrev}
            >
              <Icon icon="heroicons:chevron-left" className="w-4 h-4" />
              Previous
            </Button>

            <div className="flex items-center gap-1">
              {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                const pageNum = Math.max(
                  1,
                  Math.min(
                    pagination.page - 2 + i,
                    pagination.totalPages - 4 + i
                  )
                );

                if (pageNum > pagination.totalPages) return null;

                return (
                  <Button
                    key={pageNum}
                    variant={
                      pageNum === pagination.page ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => onPageChange(pageNum)}
                    className="w-8 h-8 p-0"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={!pagination.hasNext}
            >
              Next
              <Icon icon="heroicons:chevron-right" className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
