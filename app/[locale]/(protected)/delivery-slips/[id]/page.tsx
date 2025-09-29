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
import { useDeliverySlipsStore } from "@/lib/stores/parcels/delivery-slips.store";
import { useAuthStore } from "@/lib/stores/auth/auth.store";
import { DeliverySlipStatus } from "@/lib/types/parcels/delivery-slips.types";
import { toast } from "sonner";

// Status configurations
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

const DeliverySlipDetailsPage = () => {
  const router = useRouter();
  const params = useParams();
  const slipId = params?.id as string;
  const { hasPermission, user } = useAuthStore();

  const {
    currentDeliverySlip,
    fetchDeliverySlipById,
    updateDeliverySlip,
    deleteDeliverySlip,
    receiveSlip,
    downloadSlipPdf,
    downloadSlipLabels,
    getSlipBarcode,
    isLoading,
    isUpdating,
    isDeleting,
    error,
  } = useDeliverySlipsStore();

  const [deleteDialog, setDeleteDialog] = useState(false);
  const [receiveDialog, setReceiveDialog] = useState(false);
  const [barcodeData, setBarcodeData] = useState<any>(null);
  const [showBarcode, setShowBarcode] = useState(false);

  const canUpdate = hasPermission(PARCELS_PERMISSIONS.DELIVERY_SLIPS_UPDATE);
  const canDelete = hasPermission(PARCELS_PERMISSIONS.DELIVERY_SLIPS_DELETE);
  const canReceive = hasPermission(PARCELS_PERMISSIONS.DELIVERY_SLIPS_RECEIVE);

  // Fetch slip data
  useEffect(() => {
    if (slipId) {
      fetchDeliverySlipById(slipId);
    }
  }, [slipId, fetchDeliverySlipById]);

  // Handle slip actions
  const handleReceiveSlip = async () => {
    if (!currentDeliverySlip) return;

    const success = await receiveSlip(currentDeliverySlip.id, {
      notes: "Slip received via details page",
    });

    if (success) {
      setReceiveDialog(false);
      toast.success("Delivery slip marked as received");
    }
  };

  const handleDeleteSlip = async () => {
    if (!currentDeliverySlip) return;

    const success = await deleteDeliverySlip(currentDeliverySlip.id);

    if (success) {
      setDeleteDialog(false);
      toast.success("Delivery slip deleted successfully");
      router.push("/delivery-slips");
    }
  };

  const handleDownloadPdf = async () => {
    if (!currentDeliverySlip) return;
    await downloadSlipPdf(currentDeliverySlip.id);
  };

  const handleDownloadLabels = async () => {
    if (!currentDeliverySlip) return;
    await downloadSlipLabels(currentDeliverySlip.id);
  };

  const handleShowBarcode = async () => {
    if (!currentDeliverySlip) return;

    if (!barcodeData) {
      const data = await getSlipBarcode(currentDeliverySlip.id);
      setBarcodeData(data);
    }
    setShowBarcode(true);
  };

  if (isLoading) {
    return (
      <ProtectedRoute
        requiredPermissions={[PARCELS_PERMISSIONS.DELIVERY_SLIPS_READ]}
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
                <span>Loading delivery slip details...</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </ProtectedRoute>
    );
  }

  if (!currentDeliverySlip || error) {
    return (
      <ProtectedRoute
        requiredPermissions={[PARCELS_PERMISSIONS.DELIVERY_SLIPS_READ]}
        requiredAccessLevel="LIMITED"
      >
        <div className="container mx-auto py-8">
          <Alert color="destructive">
            <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
            <AlertDescription>
              {error || "Delivery slip not found or has been deleted."}
            </AlertDescription>
          </Alert>
        </div>
      </ProtectedRoute>
    );
  }

  const statusInfo = statusConfig[currentDeliverySlip.status];
  const canModify = currentDeliverySlip.status === DeliverySlipStatus.PENDING;

  return (
    <ProtectedRoute
      requiredPermissions={[PARCELS_PERMISSIONS.DELIVERY_SLIPS_READ]}
      requiredAccessLevel="LIMITED"
    >
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold text-default-900">
                  {currentDeliverySlip.reference}
                </h1>
                <Badge className={statusInfo.color}>
                  <Icon icon={statusInfo.icon} className="w-3 h-3 mr-1" />
                  {statusInfo.label}
                </Badge>
              </div>
              <p className="text-lg text-default-600">Delivery Slip Details</p>
              <div className="flex items-center gap-4 mt-2 text-sm text-default-500">
                <span>
                  Created: {formatDate(currentDeliverySlip.createdAt)}
                </span>
                {currentDeliverySlip.receivedAt && (
                  <span>
                    Received: {formatDate(currentDeliverySlip.receivedAt)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Actions Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button disabled={isUpdating || isDeleting}>
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
                      href={`/delivery-slips/${currentDeliverySlip.id}/edit`}
                    >
                      <Icon
                        icon="heroicons:pencil-square"
                        className="mr-2 h-4 w-4"
                      />
                      Edit Slip
                    </Link>
                  </DropdownMenuItem>
                )}

                {canReceive && canModify && (
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

                <DropdownMenuItem onClick={handleDownloadLabels}>
                  <Icon icon="heroicons:tag" className="mr-2 h-4 w-4" />
                  Download Labels
                </DropdownMenuItem>

                <DropdownMenuItem onClick={handleShowBarcode}>
                  <Icon icon="heroicons:qr-code" className="mr-2 h-4 w-4" />
                  Show Barcode
                </DropdownMenuItem>

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

            <Link href="/delivery-slips">
              <Button variant="outline">
                <Icon icon="heroicons:arrow-left" className="w-4 h-4 mr-2" />
                Back to Delivery Slips
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
                      {currentDeliverySlip.reference}
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
                      Collection City
                    </h4>
                    <p className="text-default-600">
                      {currentDeliverySlip.city?.name || "Not specified"}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-default-900">
                      Total Parcels
                    </h4>
                    <p className="text-default-600">
                      {currentDeliverySlip.summary.totalParcels}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-default-900">
                      Scanned Parcels
                    </h4>
                    <p className="text-default-600">
                      {currentDeliverySlip.summary.scannedParcels} /{" "}
                      {currentDeliverySlip.summary.totalParcels}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-default-900">
                      Total Value
                    </h4>
                    <p className="text-default-600">
                      {currentDeliverySlip.summary.totalValue.toFixed(2)} DH
                    </p>
                  </div>
                </div>

                {currentDeliverySlip.notes && (
                  <div>
                    <h4 className="font-medium text-default-900">Notes</h4>
                    <p className="text-default-600">
                      {currentDeliverySlip.notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Parcels List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon icon="heroicons:cube" className="w-5 h-5" />
                  Parcels ({currentDeliverySlip.items.length})
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
                    {currentDeliverySlip.items.map((item) => (
                      <TableRow key={item.parcelId}>
                        <TableCell>
                          <code className="text-sm font-medium">
                            {item.parcel.code}
                          </code>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {item.parcel.recipientName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {item.parcel.recipientPhone}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{item.parcel.destinationCity}</TableCell>
                        <TableCell>
                          <Badge color="primary">
                            {item.parcel.price.toFixed(2)} DH
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge color="secondary">
                            {item.parcel.statusName}
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
                      {currentDeliverySlip.summary.totalParcels}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Scanned:
                    </span>
                    <span className="font-medium text-green-600">
                      {currentDeliverySlip.summary.scannedParcels}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Pending:
                    </span>
                    <span className="font-medium text-yellow-600">
                      {currentDeliverySlip.summary.unscannedParcels}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-3">
                    <span className="text-sm text-muted-foreground">
                      Total Value:
                    </span>
                    <span className="font-medium">
                      {currentDeliverySlip.summary.totalValue.toFixed(2)} DH
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Scan Progress</span>
                    <span>
                      {Math.round(
                        (currentDeliverySlip.summary.scannedParcels /
                          currentDeliverySlip.summary.totalParcels) *
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
                          (currentDeliverySlip.summary.scannedParcels /
                            currentDeliverySlip.summary.totalParcels) *
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
                        {formatDate(currentDeliverySlip.createdAt, "long")}
                      </p>
                      {currentDeliverySlip.createdBy && (
                        <p className="text-xs text-muted-foreground">
                          by {currentDeliverySlip.createdBy}
                        </p>
                      )}
                    </div>
                  </div>

                  {currentDeliverySlip.receivedAt && (
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
                      <div>
                        <p className="text-sm font-medium">Received</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(currentDeliverySlip.receivedAt, "long")}
                        </p>
                        {currentDeliverySlip.receivedBy && (
                          <p className="text-xs text-muted-foreground">
                            by {currentDeliverySlip.receivedBy}
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
                  {canReceive && (
                    <Button
                      className="w-full"
                      onClick={() => setReceiveDialog(true)}
                      disabled={isUpdating}
                    >
                      <Icon icon="heroicons:check" className="w-4 h-4 mr-2" />
                      Mark as Received
                    </Button>
                  )}

                  {canUpdate && (
                    <Link
                      href={`/delivery-slips/${currentDeliverySlip.id}/edit`}
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

                  <Link href={`/delivery-slips/${currentDeliverySlip.id}/scan`}>
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

        {/* Receive Confirmation Dialog */}
        <AlertDialog open={receiveDialog} onOpenChange={setReceiveDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Mark as Received</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to mark this delivery slip as received?
                This will update the status of all parcels in the slip.
                {currentDeliverySlip.summary.unscannedParcels > 0 && (
                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-sm text-yellow-800">
                      Note: {currentDeliverySlip.summary.unscannedParcels}{" "}
                      parcels have not been scanned yet.
                    </p>
                  </div>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleReceiveSlip}
                disabled={isUpdating}
              >
                {isUpdating && (
                  <Icon
                    icon="heroicons:arrow-path"
                    className="mr-2 h-4 w-4 animate-spin"
                  />
                )}
                Mark as Received
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Delivery Slip</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this delivery slip? This action
                cannot be undone and will reset all parcels back to
                "NEW_PACKAGE" status.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteSlip}
                disabled={isDeleting}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                {isDeleting && (
                  <Icon
                    icon="heroicons:arrow-path"
                    className="mr-2 h-4 w-4 animate-spin"
                  />
                )}
                Delete Slip
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Barcode Dialog */}
        <AlertDialog open={showBarcode} onOpenChange={setShowBarcode}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delivery Slip Barcode</AlertDialogTitle>
              <AlertDialogDescription>
                Scan this barcode to quickly access this delivery slip
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex flex-col items-center space-y-4 py-4">
              {barcodeData && (
                <>
                  <div className="text-center">
                    <p className="font-mono text-lg">{barcodeData.reference}</p>
                  </div>
                  <div className="bg-white p-4 rounded border">
                    {/* Here you would render the actual barcode/QR code */}
                    <div className="w-48 h-48 bg-gray-100 flex items-center justify-center">
                      <Icon
                        icon="heroicons:qr-code"
                        className="w-24 h-24 text-gray-400"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Close</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ProtectedRoute>
  );
};

export default DeliverySlipDetailsPage;
