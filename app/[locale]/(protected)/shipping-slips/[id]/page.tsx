"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "@/i18n/routing";
import { ProtectedRoute } from "@/components/route/protected-route";
import { PARCELS_PERMISSIONS } from "@/lib/constants/parcels";
import { useShippingSlipsStore } from "@/lib/stores/parcels/shipping-slips.store";
import { useAuthStore } from "@/lib/stores/auth/auth.store";
import { ShippingSlipStatus } from "@/lib/types/parcels/shipping-slips.types";
import { toast } from "sonner";

// Status configurations
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

const formatDate = (dateString: string, format: "short" | "long" = "short") => {
  const date = new Date(dateString);
  if (format === "short") {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  }
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const ShippingSlipDetailsPage = () => {
  const router = useRouter();
  const params = useParams();
  const slipId = params?.id as string;
  const { hasPermission, user } = useAuthStore();

  const {
    currentShippingSlip,
    fetchShippingSlipById,
    markAsShipped,
    markAsReceived,
    cancelShippingSlip,
    deleteShippingSlip,
    generatePDF,
    isLoading,
    error,
  } = useShippingSlipsStore();

  const [deleteDialog, setDeleteDialog] = useState(false);
  const [shipDialog, setShipDialog] = useState(false);
  const [receiveDialog, setReceiveDialog] = useState(false);
  const [cancelDialog, setCancelDialog] = useState(false);

  const canUpdate = hasPermission(PARCELS_PERMISSIONS.SHIPPING_SLIPS_UPDATE);
  const canDelete = hasPermission(PARCELS_PERMISSIONS.SHIPPING_SLIPS_DELETE);
  const canShip = hasPermission(PARCELS_PERMISSIONS.SHIPPING_SLIPS_SHIP);
  const canReceive = hasPermission(PARCELS_PERMISSIONS.SHIPPING_SLIPS_RECEIVE);

  // Fetch slip data
  useEffect(() => {
    if (slipId) {
      fetchShippingSlipById(slipId);
    }
  }, [slipId, fetchShippingSlipById]);

  // Handle slip actions
  const handleShipSlip = async () => {
    if (!currentShippingSlip) return;

    const success = await markAsShipped(currentShippingSlip.id);

    if (success) {
      setShipDialog(false);
      toast.success("Shipping slip marked as shipped");
    }
  };

  const handleReceiveSlip = async () => {
    if (!currentShippingSlip) return;

    const success = await markAsReceived(currentShippingSlip.id);

    if (success) {
      setReceiveDialog(false);
      toast.success("Shipping slip marked as received");
    }
  };

  const handleCancelSlip = async () => {
    if (!currentShippingSlip) return;

    const success = await cancelShippingSlip(currentShippingSlip.id);

    if (success) {
      setCancelDialog(false);
      toast.success("Shipping slip cancelled successfully");
    }
  };

  const handleDeleteSlip = async () => {
    if (!currentShippingSlip) return;

    const success = await deleteShippingSlip(currentShippingSlip.id);

    if (success) {
      setDeleteDialog(false);
      toast.success("Shipping slip deleted successfully");
      router.push("/shipping-slips");
    }
  };

  const handleDownloadPdf = async () => {
    if (!currentShippingSlip) return;
    await generatePDF(currentShippingSlip.id);
  };

  if (isLoading) {
    return (
      <ProtectedRoute
        requiredPermissions={[PARCELS_PERMISSIONS.SHIPPING_SLIPS_READ]}
        requiredAccessLevel="LIMITED"
      >
        <div className="container mx-auto py-6">
          <Card>
            <CardContent className="p-8">
              <div className="flex items-center justify-center space-x-2">
                <Icon
                  icon="heroicons:arrow-path"
                  className="w-5 h-5 animate-spin"
                />
                <span>Loading shipping slip details...</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </ProtectedRoute>
    );
  }

  if (!currentShippingSlip || error) {
    return (
      <ProtectedRoute
        requiredPermissions={[PARCELS_PERMISSIONS.SHIPPING_SLIPS_READ]}
        requiredAccessLevel="LIMITED"
      >
        <div className="container mx-auto py-8">
          <Alert color="destructive">
            <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
            <AlertDescription>
              {error || "Shipping slip not found or has been deleted."}
            </AlertDescription>
          </Alert>
        </div>
      </ProtectedRoute>
    );
  }

  const statusInfo = statusConfig[currentShippingSlip.status];
  const canModify = currentShippingSlip.status === ShippingSlipStatus.PENDING;
  const canShipNow = currentShippingSlip.status === ShippingSlipStatus.PENDING;
  const canReceiveNow =
    currentShippingSlip.status === ShippingSlipStatus.SHIPPED;

  return (
    <ProtectedRoute
      requiredPermissions={[PARCELS_PERMISSIONS.SHIPPING_SLIPS_READ]}
      requiredAccessLevel="LIMITED"
    >
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold text-default-900">
                  {currentShippingSlip.reference}
                </h1>
                <Badge className={statusInfo.color}>
                  <Icon icon={statusInfo.icon} className="w-3 h-3 mr-1" />
                  {statusInfo.label}
                </Badge>
              </div>
              <p className="text-lg text-default-600">Shipping Slip Details</p>
              <div className="flex items-center gap-4 mt-2 text-sm text-default-500">
                <span>
                  Created:{" "}
                  {formatDate(currentShippingSlip.createdAt.toString())}
                </span>
                {currentShippingSlip.shippedAt && (
                  <span>
                    Shipped:{" "}
                    {formatDate(currentShippingSlip.shippedAt.toString())}
                  </span>
                )}
                {currentShippingSlip.receivedAt && (
                  <span>
                    Received:{" "}
                    {formatDate(currentShippingSlip.receivedAt.toString())}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Actions Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button>
                  <Icon
                    icon="heroicons:ellipsis-horizontal"
                    className="w-4 h-4 mr-2"
                  />
                  Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canUpdate && canModify && (
                  <DropdownMenuItem asChild>
                    <Link
                      href={`/shipping-slips/${currentShippingSlip.id}/edit`}
                    >
                      <Icon
                        icon="heroicons:pencil-square"
                        className="mr-2 h-4 w-4"
                      />
                      Edit Slip
                    </Link>
                  </DropdownMenuItem>
                )}

                {canShip && canShipNow && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setShipDialog(true)}>
                      <Icon
                        icon="heroicons:truck"
                        className="mr-2 h-4 w-4 text-blue-600"
                      />
                      Mark as Shipped
                    </DropdownMenuItem>
                  </>
                )}

                {canReceive && canReceiveNow && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setReceiveDialog(true)}>
                      <Icon
                        icon="heroicons:check"
                        className="mr-2 h-4 w-4 text-green-600"
                      />
                      Mark as Received
                    </DropdownMenuItem>
                  </>
                )}

                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDownloadPdf}>
                  <Icon
                    icon="heroicons:document-arrow-down"
                    className="mr-2 h-4 w-4"
                  />
                  Download PDF
                </DropdownMenuItem>

                {currentShippingSlip.status !== ShippingSlipStatus.RECEIVED && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-yellow-600 focus:text-yellow-600"
                      onClick={() => setCancelDialog(true)}
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
                      onClick={() => setDeleteDialog(true)}
                    >
                      <Icon icon="heroicons:trash" className="mr-2 h-4 w-4" />
                      Delete Slip
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <Link href="/shipping-slips">
              <Button variant="outline">
                <Icon icon="heroicons:arrow-left" className="w-4 h-4 mr-2" />
                Back to Shipping Slips
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Slip Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon icon="heroicons:document-text" className="w-5 h-5" />
                  Slip Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-default-900">Reference</h4>
                    <p className="text-default-600 font-mono">
                      {currentShippingSlip.reference}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-default-900">Status</h4>
                    <Badge className={statusInfo.color}>
                      <Icon icon={statusInfo.icon} className="w-3 h-3 mr-1" />
                      {statusInfo.label}
                    </Badge>
                  </div>
                  <div>
                    <h4 className="font-medium text-default-900">
                      Destination Zone
                    </h4>
                    <p className="text-default-600">
                      {currentShippingSlip.destinationZone?.name ||
                        "Not specified"}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-default-900">
                      Total Parcels
                    </h4>
                    <p className="text-default-600">
                      {currentShippingSlip._count?.items || 0}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-default-900">
                      Scanned Parcels
                    </h4>
                    <p className="text-default-600">
                      {currentShippingSlip._count?.scannedItems || 0} /{" "}
                      {currentShippingSlip._count?.items || 0}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-default-900">
                      Total Value
                    </h4>
                    <p className="text-default-600">
                      {currentShippingSlip._count?.totalValue?.toFixed(2) ||
                        "0.00"}{" "}
                      DH
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Parcels List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon icon="heroicons:cube" className="w-5 h-5" />
                  Parcels ({currentShippingSlip.items?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Parcel Code</TableHead>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Destination</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Scanned</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentShippingSlip.items?.map((item) => (
                      <TableRow key={item.parcelId}>
                        <TableCell>
                          <code className="text-sm font-medium">
                            {item.parcel?.code}
                          </code>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {item.parcel?.recipientName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {item.parcel?.recipientPhone}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {item.parcel?.destinationCity?.name}
                        </TableCell>
                        <TableCell>
                          <Badge color="primary">
                            {item.parcel?.price?.toFixed(2)} DH
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge color="secondary">
                            {item.parcel?.parcelStatusCode}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {item.scanned ? (
                            <div className="flex items-center gap-1 text-green-600">
                              <Icon
                                icon="heroicons:check-circle"
                                className="w-4 h-4"
                              />
                              <span className="text-sm">
                                {item.scannedAt
                                  ? formatDate(item.scannedAt.toString())
                                  : "Scanned"}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-yellow-600">
                              <Icon
                                icon="heroicons:clock"
                                className="w-4 h-4"
                              />
                              <span className="text-sm">Pending</span>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon
                    icon="heroicons:clipboard-document-list"
                    className="w-5 h-5"
                  />
                  Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Total Parcels:
                    </span>
                    <span className="font-medium">
                      {currentShippingSlip._count?.items || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Scanned:
                    </span>
                    <span className="font-medium text-green-600">
                      {currentShippingSlip._count?.scannedItems || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Pending:
                    </span>
                    <span className="font-medium text-yellow-600">
                      {(currentShippingSlip._count?.items || 0) -
                        (currentShippingSlip._count?.scannedItems || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-3">
                    <span className="text-sm text-muted-foreground">
                      Total Value:
                    </span>
                    <span className="font-medium">
                      {currentShippingSlip._count?.totalValue?.toFixed(2) ||
                        "0.00"}{" "}
                      DH
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Scan Progress</span>
                    <span>
                      {Math.round(
                        ((currentShippingSlip._count?.scannedItems || 0) /
                          (currentShippingSlip._count?.items || 1)) *
                          100
                      )}
                      %
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{
                        width: `${
                          ((currentShippingSlip._count?.scannedItems || 0) /
                            (currentShippingSlip._count?.items || 1)) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon icon="heroicons:clock" className="w-5 h-5" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                    <div>
                      <p className="text-sm font-medium">Created</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(
                          currentShippingSlip.createdAt.toString(),
                          "long"
                        )}
                      </p>
                      {currentShippingSlip.createdBy && (
                        <p className="text-xs text-muted-foreground">
                          by {currentShippingSlip.createdBy}
                        </p>
                      )}
                    </div>
                  </div>

                  {currentShippingSlip.shippedAt && (
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                      <div>
                        <p className="text-sm font-medium">Shipped</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(
                            currentShippingSlip.shippedAt.toString(),
                            "long"
                          )}
                        </p>
                        {currentShippingSlip.shippedBy && (
                          <p className="text-xs text-muted-foreground">
                            by {currentShippingSlip.shippedBy}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {currentShippingSlip.receivedAt && (
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
                      <div>
                        <p className="text-sm font-medium">Received</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(
                            currentShippingSlip.receivedAt.toString(),
                            "long"
                          )}
                        </p>
                        {currentShippingSlip.receivedBy && (
                          <p className="text-xs text-muted-foreground">
                            by {currentShippingSlip.receivedBy}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            {canModify && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon icon="heroicons:bolt" className="w-5 h-5" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {canShip && canShipNow && (
                    <Button
                      className="w-full"
                      onClick={() => setShipDialog(true)}
                    >
                      <Icon icon="heroicons:truck" className="w-4 h-4 mr-2" />
                      Mark as Shipped
                    </Button>
                  )}

                  {canUpdate && (
                    <Link
                      href={`/shipping-slips/${currentShippingSlip.id}/edit`}
                    >
                      <Button variant="outline" className="w-full">
                        <Icon
                          icon="heroicons:pencil"
                          className="w-4 h-4 mr-2"
                        />
                        Edit Slip
                      </Button>
                    </Link>
                  )}

                  <Link href={`/shipping-slips/${currentShippingSlip.id}/scan`}>
                    <Button variant="outline" className="w-full">
                      <Icon icon="heroicons:qr-code" className="w-4 h-4 mr-2" />
                      Scan Parcels
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Ship Confirmation Dialog */}
        <AlertDialog open={shipDialog} onOpenChange={setShipDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Mark as Shipped</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to mark this shipping slip as shipped?
                This indicates the parcels have left for the destination zone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleShipSlip}>
                Mark as Shipped
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Receive Confirmation Dialog */}
        <AlertDialog open={receiveDialog} onOpenChange={setReceiveDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Mark as Received</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to mark this shipping slip as received?
                This will update the status of all parcels in the slip to
                "PUT_IN_DISTRIBUTION".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleReceiveSlip}>
                Mark as Received
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Cancel Confirmation Dialog */}
        <AlertDialog open={cancelDialog} onOpenChange={setCancelDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel Shipping Slip</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to cancel this shipping slip? This will
                revert all parcels back to "COLLECTED" status.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCancelSlip}
                className="bg-yellow-600 text-white hover:bg-yellow-700"
              >
                Cancel Slip
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Shipping Slip</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this shipping slip? This action
                cannot be undone and will reset all parcels back to "COLLECTED"
                status.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteSlip}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                Delete Slip
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ProtectedRoute>
  );
};

export default ShippingSlipDetailsPage;
