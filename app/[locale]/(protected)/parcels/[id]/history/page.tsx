"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Link } from "@/i18n/routing";
import { useParcelsStore } from "@/lib/stores/parcels/parcels.store";
import { useAuthStore } from "@/lib/stores/auth/auth.store";
import { ProtectedRoute } from "@/components/route/protected-route";
import { PARCELS_PERMISSIONS } from "@/lib/constants/parcels";
import { toast } from "sonner";
import {
  PARCEL_STATUS_COLORS,
  PARCEL_STATUS_LABELS,
  PAYMENT_STATUS_COLORS,
  PAYMENT_STATUS_LABELS,
} from "@/lib/types/parcels/parcels.types";

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60)
  );

  if (diffInHours < 1) {
    return "Just now";
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
  } else {
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
  }
};

const ParcelStatusBadge = ({ status }: { status: string }) => {
  const statusLabel = PARCEL_STATUS_LABELS[status] || status;
  const statusColor = PARCEL_STATUS_COLORS[status] || "#6B7280";

  return (
    <Badge
      style={{
        backgroundColor: statusColor + "20",
        color: statusColor,
        borderColor: statusColor,
      }}
      className="border"
    >
      {statusLabel}
    </Badge>
  );
};

const PaymentStatusBadge = ({ status }: { status: string }) => {
  const statusLabel = PAYMENT_STATUS_LABELS[status] || status;
  const statusColor = PAYMENT_STATUS_COLORS[status] || "#6B7280";

  return (
    <Badge
      style={{
        backgroundColor: statusColor + "20",
        color: statusColor,
        borderColor: statusColor,
      }}
      className="border"
    >
      {statusLabel}
    </Badge>
  );
};

const HistoryTimeline = ({ history }: { history: any[] }) => {
  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>

      <div className="space-y-6">
        {history.map((item, index) => {
          const statusColor =
            PARCEL_STATUS_COLORS[item.statusCode] || "#6B7280";
          const isLatest = index === 0;

          return (
            <div key={item.id} className="relative flex items-start space-x-4">
              {/* Timeline dot */}
              <div
                className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 bg-white ${
                  isLatest ? "border-blue-500" : "border-gray-300"
                }`}
                style={{
                  borderColor: isLatest ? "#3B82F6" : statusColor,
                  backgroundColor: isLatest ? "#3B82F6" : "white",
                }}
              >
                <Icon
                  icon={getStatusIcon(item.statusCode)}
                  className={`w-4 h-4 ${isLatest ? "text-white" : ""}`}
                  style={{ color: isLatest ? "white" : statusColor }}
                />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pb-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ParcelStatusBadge status={item.statusCode} />
                    {isLatest && (
                      <Badge
                        color="primary"
                        className="text-xs text-blue-600 border-blue-600"
                      >
                        Current
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatRelativeTime(item.changedAt)}
                  </div>
                </div>

                <div className="mt-2">
                  <h4 className="text-sm font-medium text-gray-900">
                    {item.statusName ||
                      PARCEL_STATUS_LABELS[item.statusCode] ||
                      item.statusCode}
                  </h4>

                  {item.comment && (
                    <p className="text-sm text-gray-600 mt-1">{item.comment}</p>
                  )}

                  <div className="text-xs text-gray-500 mt-1">
                    {formatDate(item.changedAt)}
                    {item.changedBy && (
                      <span className="ml-2">• by {item.changedBy}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const getStatusIcon = (statusCode: string) => {
  const iconMap = {
    NEW_PACKAGE: "heroicons:document-plus",
    RECEIVED: "heroicons:inbox-arrow-down",
    COLLECTED: "heroicons:hand-raised",
    DISPATCHED: "heroicons:paper-airplane",
    PUT_IN_DISTRIBUTION: "heroicons:truck",
    OUT_FOR_DELIVERY: "heroicons:map-pin",
    DELIVERED: "heroicons:check-circle",
    RETURNED: "heroicons:arrow-uturn-left",
    REFUSED: "heroicons:x-circle",
    CANCELLED: "heroicons:x-mark",
  };

  return iconMap[statusCode] || "heroicons:clock";
};

const ParcelHistoryPageContent = () => {
  const router = useRouter();
  const params = useParams();
  const parcelId = params?.id as string;
  const { hasPermission } = useAuthStore();
  const {
    currentParcel,
    parcelHistory,
    fetchParcelById,
    fetchParcelHistory,
    isLoading,
    isLoadingHistory,
    error,
  } = useParcelsStore();

  // Check permissions
  const canViewParcels = hasPermission(PARCELS_PERMISSIONS.PARCELS_READ);

  useEffect(() => {
    const fetchData = async () => {
      if (!parcelId) return;

      try {
        // Fetch parcel details and history simultaneously
        await Promise.all([
          fetchParcelById(parcelId),
          fetchParcelHistory(parcelId),
        ]);
      } catch (error) {
        console.error("Error fetching parcel data:", error);
        toast.error("Failed to fetch parcel information");
      }
    };

    fetchData();
  }, [parcelId, fetchParcelById, fetchParcelHistory]);

  if (isLoading || isLoadingHistory) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center justify-center space-x-2">
              <Icon
                icon="heroicons:arrow-path"
                className="w-5 h-5 animate-spin"
              />
              <span>Loading parcel history...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !currentParcel) {
    return (
      <div className="container mx-auto py-8">
        <Alert color="destructive">
          <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
          <AlertDescription>
            {error || "Parcel not found or has been deleted."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-default-900">
            Parcel History
          </h1>
          <p className="text-default-600">
            Complete tracking history for parcel {currentParcel.code}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/parcels/${parcelId}`}>
            <Button variant="outline">
              <Icon icon="heroicons:eye" className="w-4 h-4 mr-2" />
              View Details
            </Button>
          </Link>
          <Link href="/parcels">
            <Button variant="outline">
              <Icon icon="heroicons:arrow-left" className="w-4 h-4 mr-2" />
              Back to Parcels
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main History Timeline */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon icon="heroicons:clock" className="w-5 h-5" />
                Status History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {parcelHistory.length > 0 ? (
                <HistoryTimeline history={parcelHistory} />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Icon
                    icon="heroicons:document-text"
                    className="w-12 h-12 mx-auto mb-4 opacity-50"
                  />
                  <p>No status history available for this parcel.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Rest of your existing sidebar code remains the same */}
        <div className="space-y-6">
          {/* Parcel Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon icon="heroicons:cube" className="w-5 h-5" />
                Parcel Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">Parcel Code</div>
                <div className="font-mono font-medium">
                  {currentParcel.code}
                </div>
              </div>

              <Separator />

              <div>
                <div className="text-sm text-muted-foreground">Recipient</div>
                <div className="font-medium">{currentParcel.recipientName}</div>
                <div className="text-sm text-gray-600">
                  {currentParcel.recipientPhone}
                </div>
              </div>

              <Separator />

              <div>
                <div className="text-sm text-muted-foreground">Route</div>
                <div className="text-sm">
                  <span className="font-medium">
                    {currentParcel.pickupCity?.name}
                  </span>
                  <Icon
                    icon="heroicons:arrow-right"
                    className="mx-1 h-3 w-3 inline"
                  />
                  <span className="font-medium">
                    {currentParcel.destinationCity?.name}
                  </span>
                </div>
              </div>

              <Separator />

              <div>
                <div className="text-sm text-muted-foreground">
                  Current Status
                </div>
                <div className="mt-1">
                  <ParcelStatusBadge status={currentParcel.parcelStatusCode} />
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">
                  Payment Status
                </div>
                <div className="mt-1">
                  <PaymentStatusBadge status={currentParcel.paymentStatus} />
                </div>
              </div>

              <Separator />

              <div>
                <div className="text-sm text-muted-foreground">Amount</div>
                <div className="font-medium">{currentParcel.price} DH</div>
              </div>

              {currentParcel.productName && (
                <div>
                  <div className="text-sm text-muted-foreground">Product</div>
                  <div className="text-sm">{currentParcel.productName}</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Delivery Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon icon="heroicons:truck" className="w-5 h-5" />
                Delivery Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">
                  Delivery Fee
                </div>
                <div className="font-medium">
                  {currentParcel.deliveryPrice} DH
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">
                  Expected Delivery
                </div>
                <div className="font-medium">
                  {currentParcel.deliveryDelay} days
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">
                  Delivery Attempts
                </div>
                <div className="font-medium">
                  {currentParcel.deliveryAttempts}
                </div>
              </div>

              {currentParcel.deliveredAt && (
                <div>
                  <div className="text-sm text-muted-foreground">
                    Delivered At
                  </div>
                  <div className="text-sm">
                    {formatDate(currentParcel.deliveredAt)}
                  </div>
                </div>
              )}

              {currentParcel.comment && (
                <div>
                  <div className="text-sm text-muted-foreground">
                    Special Instructions
                  </div>
                  <div className="text-sm">{currentParcel.comment}</div>
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
            <CardContent className="space-y-2">
              <Link href={`/parcels/${parcelId}/edit`}>
                <Button variant="outline" className="w-full justify-start">
                  <Icon
                    icon="heroicons:pencil-square"
                    className="w-4 h-4 mr-2"
                  />
                  Edit Parcel
                </Button>
              </Link>

              <Link href={`/parcels/${parcelId}/duplicate`}>
                <Button variant="outline" className="w-full justify-start">
                  <Icon
                    icon="heroicons:document-duplicate"
                    className="w-4 h-4 mr-2"
                  />
                  Duplicate Parcel
                </Button>
              </Link>

              <Button variant="outline" className="w-full justify-start">
                <Icon icon="heroicons:printer" className="w-4 h-4 mr-2" />
                Print Label
              </Button>

              <Button variant="outline" className="w-full justify-start">
                <Icon icon="heroicons:share" className="w-4 h-4 mr-2" />
                Share Tracking
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

// Main component wrapped with ProtectedRoute
const ParcelHistoryPage = () => {
  return (
    <ProtectedRoute
      requiredPermissions={[PARCELS_PERMISSIONS.PARCELS_READ]}
      requiredAccessLevel="LIMITED"
      allowedAccountStatuses={["ACTIVE"]}
    >
      <ParcelHistoryPageContent />
    </ProtectedRoute>
  );
};

export default ParcelHistoryPage;
