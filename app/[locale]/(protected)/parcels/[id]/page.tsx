"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Link } from "@/i18n/routing";
import { ProtectedRoute } from "@/components/route/protected-route";
import { PARCELS_PERMISSIONS } from "@/lib/constants/parcels";
import { useParcelsStore } from "@/lib/stores/parcels/parcels.store";
import { useAuthStore } from "@/lib/stores/auth/auth.store";
import { toast } from "sonner";
import {
  PARCEL_STATUS_COLORS,
  PARCEL_STATUS_LABELS,
  PAYMENT_STATUS_COLORS,
  PAYMENT_STATUS_LABELS,
} from "@/lib/types/parcels/parcels.types";

// Status configurations
const getStatusConfig = (statusCode: string) => ({
  label: PARCEL_STATUS_LABELS[statusCode] || statusCode,
  color: PARCEL_STATUS_COLORS[statusCode] || "#6B7280",
});

const getPaymentStatusConfig = (paymentStatus: string) => ({
  label: PAYMENT_STATUS_LABELS[paymentStatus] || paymentStatus,
  color: PAYMENT_STATUS_COLORS[paymentStatus] || "#6B7280",
});

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
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const ParcelDetailsPage = () => {
  const router = useRouter();
  const params = useParams();
  const parcelId = params?.id as string;
  const { hasPermission } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [parcel, setParcel] = useState<any>(null);
  const [statusHistory, setStatusHistory] = useState<any[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);

  const { fetchParcelById, deleteParcel, changeParcelStatus } =
    useParcelsStore();

  const canUpdateParcels = hasPermission(PARCELS_PERMISSIONS.PARCELS_UPDATE);
  const canDeleteParcels = hasPermission(PARCELS_PERMISSIONS.PARCELS_DELETE);

  // Fetch parcel data
  useEffect(() => {
    const fetchParcelData = async () => {
      if (!parcelId) return;

      try {
        setLoading(true);
        const parcelResult = await fetchParcelById(parcelId);
        if (parcelResult) {
          setParcel(parcelResult);
          // TODO: Fetch status history
          setStatusHistory([]);
        } else {
          toast.error("Failed to fetch parcel data");
          router.push("/parcels");
          return;
        }
      } catch (error) {
        console.error("Error fetching parcel data:", error);
        toast.error("An error occurred while fetching parcel data");
        router.push("/parcels");
      } finally {
        setLoading(false);
      }
    };

    fetchParcelData();
  }, [parcelId, router, fetchParcelById]);

  const handleDeleteParcel = async () => {
    try {
      const success = await deleteParcel(parcelId);
      if (success) {
        toast.success("Parcel deleted successfully");
        router.push("/parcels");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setDeleteDialog(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute
        requiredPermissions={[PARCELS_PERMISSIONS.PARCELS_READ]}
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
                <span>Loading parcel details...</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </ProtectedRoute>
    );
  }

  if (!parcel) {
    return (
      <ProtectedRoute
        requiredPermissions={[PARCELS_PERMISSIONS.PARCELS_READ]}
        requiredAccessLevel="LIMITED"
      >
        <div className="container mx-auto py-8">
          <Alert color="destructive">
            <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
            <AlertDescription>
              Parcel not found or has been deleted.
            </AlertDescription>
          </Alert>
        </div>
      </ProtectedRoute>
    );
  }

  const statusInfo = getStatusConfig(parcel.parcelStatusCode);
  const paymentInfo = getPaymentStatusConfig(parcel.paymentStatus);

  return (
    <ProtectedRoute
      requiredPermissions={[PARCELS_PERMISSIONS.PARCELS_READ]}
      requiredAccessLevel="LIMITED"
    >
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Icon icon="heroicons:cube" className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold text-default-900">
                  {parcel.code}
                </h1>
                {parcel.trackingCode && (
                  <Badge color="primary" className="text-xs">
                    Track: {parcel.trackingCode}
                  </Badge>
                )}
              </div>
              <p className="text-lg text-default-600">{parcel.recipientName}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge
                  style={{
                    backgroundColor: statusInfo.color + "20",
                    color: statusInfo.color,
                    borderColor: statusInfo.color,
                  }}
                  className="border"
                >
                  {statusInfo.label}
                </Badge>
                <Badge
                  style={{
                    backgroundColor: paymentInfo.color + "20",
                    color: paymentInfo.color,
                    borderColor: paymentInfo.color,
                  }}
                  className="border"
                >
                  {paymentInfo.label}
                </Badge>
                {parcel.cannotOpen && (
                  <Badge color="warning" className="text-xs">
                    Cannot Open
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Actions Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button disabled={actionLoading}>
                  <Icon
                    icon="heroicons:ellipsis-horizontal"
                    className="w-4 h-4 mr-2"
                  />
                  Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canUpdateParcels && (
                  <DropdownMenuItem asChild>
                    <Link href={`/parcels/${parcelId}/edit`}>
                      <Icon
                        icon="heroicons:pencil-square"
                        className="mr-2 h-4 w-4"
                      />
                      Edit Parcel
                    </Link>
                  </DropdownMenuItem>
                )}

                <DropdownMenuItem asChild>
                  <Link href={`/parcels/${parcelId}/duplicate`}>
                    <Icon
                      icon="heroicons:document-duplicate"
                      className="mr-2 h-4 w-4"
                    />
                    Duplicate Parcel
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem asChild>
                  <Link href={`/parcels/${parcelId}/history`}>
                    <Icon icon="heroicons:clock" className="mr-2 h-4 w-4" />
                    View History
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem>
                  <Icon icon="heroicons:printer" className="mr-2 h-4 w-4" />
                  Print Label
                </DropdownMenuItem>

                {canDeleteParcels &&
                  parcel.parcelStatusCode === "NEW_PACKAGE" && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600"
                        onClick={() => setDeleteDialog(true)}
                      >
                        <Icon icon="heroicons:trash" className="mr-2 h-4 w-4" />
                        Delete Parcel
                      </DropdownMenuItem>
                    </>
                  )}
              </DropdownMenuContent>
            </DropdownMenu>

            <Link href="/parcels">
              <Button variant="outline">
                <Icon icon="heroicons:arrow-left" className="w-4 h-4 mr-2" />
                Back to Parcels
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recipient Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon icon="heroicons:user" className="w-5 h-5" />
                  Recipient Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-default-900">Full Name</h4>
                    <p className="text-default-600">{parcel.recipientName}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-default-900">Phone</h4>
                    <p className="text-default-600">{parcel.recipientPhone}</p>
                  </div>
                  {parcel.alternativePhone && (
                    <div>
                      <h4 className="font-medium text-default-900">
                        Alternative Phone
                      </h4>
                      <p className="text-default-600">
                        {parcel.alternativePhone}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="font-medium text-default-900">
                    Delivery Address
                  </h4>
                  <p className="text-default-600">{parcel.recipientAddress}</p>
                </div>

                {parcel.comment && (
                  <div>
                    <h4 className="font-medium text-default-900">
                      Special Instructions
                    </h4>
                    <p className="text-default-600">{parcel.comment}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Route & Pricing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon icon="heroicons:map" className="w-5 h-5" />
                  Route & Pricing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-default-900">
                      Pickup City
                    </h4>
                    <div className="flex items-center gap-2">
                      <Badge color="primary">{parcel.pickupCity?.ref}</Badge>
                      <span>{parcel.pickupCity?.name}</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-default-900">
                      Destination City
                    </h4>
                    <div className="flex items-center gap-2">
                      <Badge color="primary">
                        {parcel.destinationCity?.ref}
                      </Badge>
                      <span>{parcel.destinationCity?.name}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <h4 className="font-medium text-default-900">COD Amount</h4>
                    <p className="text-lg font-bold text-green-600">
                      {parcel.price} DH
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-default-900">
                      Delivery Fee
                    </h4>
                    <p className="text-default-600">
                      {parcel.deliveryPrice} DH
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-default-900">Return Fee</h4>
                    <p className="text-default-600">{parcel.returnPrice} DH</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-default-900">
                      Delivery Time
                    </h4>
                    <p className="text-default-600">
                      {parcel.deliveryDelay} days
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Product Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon icon="heroicons:cube" className="w-5 h-5" />
                  Product Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h4 className="font-medium text-default-900">
                      Product Name
                    </h4>
                    <p className="text-default-600">
                      {parcel.productName || "Not specified"}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-default-900">Quantity</h4>
                    <p className="text-default-600">{parcel.quantity || 1}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-default-900">
                      Special Options
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {parcel.cannotOpen && (
                        <Badge color="warning" className="text-xs">
                          Cannot Open
                        </Badge>
                      )}
                      {parcel.canReplace && (
                        <Badge color="info" className="text-xs">
                          Can Replace
                        </Badge>
                      )}
                      {parcel.isStock && (
                        <Badge color="secondary" className="text-xs">
                          Stock Item
                        </Badge>
                      )}
                      {!parcel.cannotOpen &&
                        !parcel.canReplace &&
                        !parcel.isStock && (
                          <span className="text-sm text-muted-foreground">
                            None
                          </span>
                        )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Delivery Information */}
            {(parcel.deliveryAttempts > 0 ||
              parcel.deliveredAt ||
              parcel.returnedAt) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon icon="heroicons:truck" className="w-5 h-5" />
                    Delivery Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h4 className="font-medium text-default-900">
                        Delivery Attempts
                      </h4>
                      <p className="text-default-600">
                        {parcel.deliveryAttempts}
                      </p>
                    </div>
                    {parcel.lastAttemptDate && (
                      <div>
                        <h4 className="font-medium text-default-900">
                          Last Attempt
                        </h4>
                        <p className="text-default-600">
                          {formatDate(parcel.lastAttemptDate, "long")}
                        </p>
                      </div>
                    )}
                    {parcel.deliveredAt && (
                      <div>
                        <h4 className="font-medium text-default-900">
                          Delivered At
                        </h4>
                        <p className="text-green-600">
                          {formatDate(parcel.deliveredAt, "long")}
                        </p>
                      </div>
                    )}
                  </div>

                  {parcel.returnReason && (
                    <div>
                      <h4 className="font-medium text-default-900">
                        Return Reason
                      </h4>
                      <p className="text-default-600">{parcel.returnReason}</p>
                    </div>
                  )}

                  {parcel.refusalReason && (
                    <div>
                      <h4 className="font-medium text-default-900">
                        Refusal Reason
                      </h4>
                      <p className="text-default-600">{parcel.refusalReason}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Recent Status History */}
            {statusHistory.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon icon="heroicons:clock" className="w-5 h-5" />
                    Recent Status History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {statusHistory.slice(0, 5).map((history) => (
                      <div
                        key={history.id}
                        className="flex items-start gap-3 p-3 bg-default-50 rounded-lg"
                      >
                        <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {PARCEL_STATUS_LABELS[history.statusCode] ||
                              history.statusCode}
                          </p>
                          <p className="text-xs text-default-500">
                            {formatDate(history.changedAt, "long")}
                            {history.changedBy && ` by ${history.changedBy}`}
                          </p>
                          {history.comment && (
                            <p className="text-xs text-default-600 mt-1">
                              {history.comment}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {statusHistory.length > 5 && (
                    <div className="mt-4 text-center">
                      <Link href={`/parcels/${parcelId}/history`}>
                        <Button variant="outline" size="sm">
                          View Full History
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon
                    icon="heroicons:information-circle"
                    className="w-5 h-5"
                  />
                  Status Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-default-900">
                    Current Status
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      style={{
                        backgroundColor: statusInfo.color + "20",
                        color: statusInfo.color,
                        borderColor: statusInfo.color,
                      }}
                      className="border"
                    >
                      {statusInfo.label}
                    </Badge>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-default-900">
                    Payment Status
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      style={{
                        backgroundColor: paymentInfo.color + "20",
                        color: paymentInfo.color,
                        borderColor: paymentInfo.color,
                      }}
                      className="border"
                    >
                      {paymentInfo.label}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Parcel Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon icon="heroicons:calendar" className="w-5 h-5" />
                  Parcel Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-default-900">Created</h4>
                  <p className="text-sm text-default-600">
                    {formatDate(parcel.createdAt, "long")}
                  </p>
                  {parcel.createdBy && (
                    <p className="text-xs text-default-500">
                      by {parcel.createdBy}
                    </p>
                  )}
                </div>

                <div>
                  <h4 className="font-medium text-default-900">Last Updated</h4>
                  <p className="text-sm text-default-600">
                    {formatDate(parcel.updatedAt, "long")}
                  </p>
                </div>

                {parcel.deliveredAt && (
                  <div>
                    <h4 className="font-medium text-default-900">Delivered</h4>
                    <p className="text-sm text-green-600">
                      {formatDate(parcel.deliveredAt, "long")}
                    </p>
                    {parcel.deliveredBy && (
                      <p className="text-xs text-default-500">
                        by {parcel.deliveredBy}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon icon="heroicons:bolt" className="w-5 h-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full" variant="outline" size="sm">
                  <Icon icon="heroicons:phone" className="w-4 h-4 mr-2" />
                  Call Customer
                </Button>

                <Button className="w-full" variant="outline" size="sm">
                  <Icon icon="heroicons:envelope" className="w-4 h-4 mr-2" />
                  Send SMS
                </Button>

                <Button className="w-full" variant="outline" size="sm">
                  <Icon icon="heroicons:printer" className="w-4 h-4 mr-2" />
                  Print Label
                </Button>

                <Button className="w-full" variant="outline" size="sm">
                  <Icon icon="heroicons:share" className="w-4 h-4 mr-2" />
                  Share Tracking
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Parcel</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete parcel{" "}
                <strong>{parcel.code}</strong>? This action cannot be undone and
                will permanently remove all parcel data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteParcel}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                Delete Parcel
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ProtectedRoute>
  );
};

export default ParcelDetailsPage;
