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
import { useDeliverySlipsStore } from "@/lib/stores/parcels/delivery-slips.store";
import {
  DeliverySlip,
  DeliverySlipStatus,
} from "@/lib/types/parcels/delivery-slips.types";
import { cn } from "@/lib/utils/ui.utils";

interface DeliverySlipsTableProps {
  deliverySlips: DeliverySlip[];
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
  [DeliverySlipStatus.PENDING]: {
    label: "Pending",
    color: "bg-yellow-100 text-yellow-800",
    icon: "heroicons:clock",
  },
  [DeliverySlipStatus.RECEIVED]: {
    label: "Received",
    color: "bg-green-100 text-green-800",
    icon: "heroicons:check-circle",
  },
  [DeliverySlipStatus.CANCELLED]: {
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

export const DeliverySlipsTable: React.FC<DeliverySlipsTableProps> = ({
  deliverySlips,
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
    receiveSlip,
    deleteDeliverySlip,
  } = useDeliverySlipsStore();

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedSlipIds(deliverySlips.map((slip) => slip.id));
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

  const handleReceiveSlip = async (slipId: string) => {
    await receiveSlip(slipId, {
      notes: "Marked as received from table action",
    });
  };

  const handleDeleteSlip = async (slipId: string) => {
    if (window.confirm("Are you sure you want to delete this delivery slip?")) {
      await deleteDeliverySlip(slipId);
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
                      deliverySlips.length > 0 &&
                      selectedSlipIds.length === deliverySlips.length
                    }
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
              )}
              <TableHead>Reference</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Parcels</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Value</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deliverySlips.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={canBulkActions ? 9 : 8}
                  className="text-center py-8"
                >
                  <div className="space-y-2">
                    <Icon
                      icon="heroicons:document-text"
                      className="w-12 h-12 text-muted-foreground mx-auto"
                    />
                    <p className="text-muted-foreground">
                      No delivery slips found
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              deliverySlips.map((slip) => {
                const statusInfo = statusConfig[slip.status];
                const canModify = slip.status === DeliverySlipStatus.PENDING;
                const progressPercent =
                  slip.summary.totalParcels > 0
                    ? Math.round(
                        (slip.summary.scannedParcels /
                          slip.summary.totalParcels) *
                          100
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
                        href={`/delivery-slips/${slip.id}`}
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
                      {formatDate(slip.createdAt)}
                    </TableCell>
                    <TableCell>
                      {slip.city ? (
                        <Badge color="primary" className="text-xs">
                          {slip.city.name}
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
                          {slip.summary.totalParcels}
                        </span>
                        <span className="text-muted-foreground"> total</span>
                      </div>
                      {slip.summary.scannedParcels > 0 && (
                        <div className="text-xs text-green-600">
                          {slip.summary.scannedParcels} scanned
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
                        {slip.summary.totalValue.toFixed(2)} DH
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
                            <Link href={`/delivery-slips/${slip.id}`}>
                              <Icon
                                icon="heroicons:eye"
                                className="mr-2 h-4 w-4"
                              />
                              View Details
                            </Link>
                          </DropdownMenuItem>

                          {canUpdate && canModify && (
                            <DropdownMenuItem asChild>
                              <Link href={`/delivery-slips/${slip.id}/edit`}>
                                <Icon
                                  icon="heroicons:pencil-square"
                                  className="mr-2 h-4 w-4"
                                />
                                Edit Slip
                              </Link>
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuItem asChild>
                            <Link href={`/delivery-slips/${slip.id}/scan`}>
                              <Icon
                                icon="heroicons:qr-code"
                                className="mr-2 h-4 w-4"
                              />
                              Scan Parcels
                            </Link>
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          {canModify && (
                            <DropdownMenuItem
                              onClick={() => handleReceiveSlip(slip.id)}
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

                          <DropdownMenuItem>
                            <Icon
                              icon="heroicons:tag"
                              className="mr-2 h-4 w-4"
                            />
                            Download Labels
                          </DropdownMenuItem>

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
