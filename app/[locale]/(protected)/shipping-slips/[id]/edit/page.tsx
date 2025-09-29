"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "@/i18n/routing";
import { useShippingSlipsStore } from "@/lib/stores/parcels/shipping-slips.store";
import { useZonesStore } from "@/lib/stores/parcels/zones.store";
import { useAuthStore } from "@/lib/stores/auth/auth.store";
import { ProtectedRoute } from "@/components/route/protected-route";
import { PARCELS_PERMISSIONS } from "@/lib/constants/parcels";
import { ShippingSlipStatus } from "@/lib/types/parcels/shipping-slips.types";
import { toast } from "sonner";
import { cn } from "@/lib/utils/ui.utils";

// Form schema
const editShippingSlipSchema = z.object({
  destinationZoneId: z.string().optional(),
  status: z.nativeEnum(ShippingSlipStatus).optional(),
});

type EditShippingSlipFormData = z.infer<typeof editShippingSlipSchema>;

const EditShippingSlipPageContent = () => {
  const router = useRouter();
  const params = useParams();
  const slipId = params?.id as string;

  const { hasPermission, user } = useAuthStore();
  const {
    currentShippingSlip,
    fetchShippingSlipById,
    updateShippingSlip,
    addParcelsToSlip,
    removeParcelsFromSlip,
    fetchAvailableParcels,
    availableParcels,
    isUpdating,
    isLoading,
    error,
  } = useShippingSlipsStore();
  const { zones, fetchZones } = useZonesStore();

  const [selectedNewParcels, setSelectedNewParcels] = useState<string[]>([]);
  const [parcelsToRemove, setParcelsToRemove] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const canUpdateSlips = hasPermission(
    PARCELS_PERMISSIONS.SHIPPING_SLIPS_UPDATE
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
    reset,
  } = useForm<EditShippingSlipFormData>({
    resolver: zodResolver(editShippingSlipSchema),
  });

  const watchedStatus = watch("status");

  // Initialize data
  useEffect(() => {
    if (canUpdateSlips && slipId) {
      fetchShippingSlipById(slipId);
      fetchZones();
    }
  }, [canUpdateSlips, slipId, fetchShippingSlipById, fetchZones]);

  // Fetch available parcels when slip is loaded
  useEffect(() => {
    if (currentShippingSlip) {
      fetchAvailableParcels(currentShippingSlip.destinationZoneId);
    }
  }, [currentShippingSlip, fetchAvailableParcels]);

  // Populate form when shipping slip is loaded
  useEffect(() => {
    if (currentShippingSlip) {
      reset({
        destinationZoneId: currentShippingSlip.destinationZoneId || undefined,
        status: currentShippingSlip.status,
      });
    }
  }, [currentShippingSlip, reset]);

  const canModify = currentShippingSlip?.status === ShippingSlipStatus.PENDING;

  const handleParcelSelection = (parcelId: string, checked: boolean) => {
    if (checked) {
      setSelectedNewParcels((prev) => [...prev, parcelId]);
    } else {
      setSelectedNewParcels((prev) => prev.filter((id) => id !== parcelId));
    }
  };

  const handleRemoveParcel = (parcelId: string, checked: boolean) => {
    if (checked) {
      setParcelsToRemove((prev) => [...prev, parcelId]);
    } else {
      setParcelsToRemove((prev) => prev.filter((id) => id !== parcelId));
    }
  };

  const handleAddParcels = async () => {
    if (!currentShippingSlip || selectedNewParcels.length === 0) return;

    const success = await addParcelsToSlip(currentShippingSlip.id, {
      parcelIds: selectedNewParcels,
    });

    if (success) {
      setSelectedNewParcels([]);
      fetchAvailableParcels(currentShippingSlip.destinationZoneId);
      toast.success("Parcels added successfully");
    }
  };

  const handleRemoveParcels = async () => {
    if (!currentShippingSlip || parcelsToRemove.length === 0) return;

    const success = await removeParcelsFromSlip(currentShippingSlip.id, {
      parcelIds: parcelsToRemove,
    });

    if (success) {
      setParcelsToRemove([]);
      toast.success("Parcels removed successfully");
    }
  };

  // Filter available parcels
  const filteredAvailableParcels = availableParcels.filter(
    (parcel) =>
      parcel.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      parcel.recipientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      parcel.recipientPhone.includes(searchTerm)
  );

  const onSubmit = async (data: EditShippingSlipFormData) => {
    if (!currentShippingSlip) return;

    const updatedSlip = await updateShippingSlip(currentShippingSlip.id, data);

    if (updatedSlip) {
      toast.success("Shipping slip updated successfully");
      router.push(`/shipping-slips/${currentShippingSlip.id}`);
    }
  };

  if (!canUpdateSlips) {
    return (
      <div className="container mx-auto py-8">
        <Alert color="destructive">
          <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to edit shipping slips. Please contact
            your administrator.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center justify-center space-x-2">
              <Icon
                icon="heroicons:arrow-path"
                className="w-5 h-5 animate-spin"
              />
              <span>Loading shipping slip...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentShippingSlip || error) {
    return (
      <div className="container mx-auto py-8">
        <Alert color="destructive">
          <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
          <AlertDescription>
            {error || "Shipping slip not found or has been deleted."}
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
            Edit Shipping Slip
          </h1>
          <p className="text-default-600">
            {currentShippingSlip.reference} • {currentShippingSlip.status}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/shipping-slips/${currentShippingSlip.id}`}>
            <Button variant="outline">
              <Icon icon="heroicons:eye" className="w-4 h-4 mr-2" />
              View Details
            </Button>
          </Link>
          <Link href="/shipping-slips">
            <Button variant="outline">
              <Icon icon="heroicons:arrow-left" className="w-4 h-4 mr-2" />
              Back to List
            </Button>
          </Link>
        </div>
      </div>

      {/* Status Warning */}
      {!canModify && (
        <Alert color="warning">
          <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
          <AlertDescription>
            This shipping slip has status "{currentShippingSlip.status}" and
            cannot be modified. Only pending slips can be edited.
          </AlertDescription>
        </Alert>
      )}

      {/* Error Alert */}
      {error && (
        <Alert color="destructive">
          <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon icon="heroicons:document-text" className="w-5 h-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Zone Selection */}
                <div className="space-y-2">
                  <Label htmlFor="destinationZoneId">Destination Zone</Label>
                  <Select
                    value={watch("destinationZoneId") || ""}
                    onValueChange={(value) =>
                      setValue("destinationZoneId", value || undefined)
                    }
                    disabled={!canModify}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select destination zone" />
                    </SelectTrigger>
                    <SelectContent>
                      {zones
                        .filter((zone) => zone.status)
                        .map((zone) => (
                          <SelectItem key={zone.id} value={zone.id}>
                            {zone.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Status Selection (Admin only) */}
                {user?.userType !== "SELLER" && (
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={watchedStatus}
                      onValueChange={(value) =>
                        setValue("status", value as ShippingSlipStatus)
                      }
                      disabled={!canModify}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ShippingSlipStatus.PENDING}>
                          Pending
                        </SelectItem>
                        <SelectItem value={ShippingSlipStatus.SHIPPED}>
                          Shipped
                        </SelectItem>
                        <SelectItem value={ShippingSlipStatus.RECEIVED}>
                          Received
                        </SelectItem>
                        <SelectItem value={ShippingSlipStatus.CANCELLED}>
                          Cancelled
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={isUpdating || !isDirty || !canModify}
                  >
                    {isUpdating && (
                      <Icon
                        icon="heroicons:arrow-path"
                        className="mr-2 h-4 w-4 animate-spin"
                      />
                    )}
                    Update Slip
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => reset()}
                    disabled={isUpdating || !isDirty}
                  >
                    Reset Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Current Parcels */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Icon icon="heroicons:cube" className="w-5 h-5" />
                  Current Parcels ({currentShippingSlip.items?.length || 0})
                </CardTitle>
                {canModify && parcelsToRemove.length > 0 && (
                  <Button
                    size="sm"
                    color="destructive"
                    onClick={handleRemoveParcels}
                    disabled={isUpdating}
                  >
                    Remove Selected ({parcelsToRemove.length})
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {currentShippingSlip.items?.map((item) => (
                <div
                  key={item.parcelId}
                  className={cn(
                    "flex items-center space-x-3 p-3 border rounded-lg",
                    parcelsToRemove.includes(item.parcelId)
                      ? "bg-red-50 border-red-200"
                      : "hover:bg-muted/50"
                  )}
                >
                  {canModify && (
                    <Checkbox
                      checked={parcelsToRemove.includes(item.parcelId)}
                      onCheckedChange={(checked) =>
                        handleRemoveParcel(item.parcelId, checked as boolean)
                      }
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-medium">
                        {item.parcel?.code}
                      </code>
                      <Badge color="primary" className="text-xs">
                        {item.parcel?.price?.toFixed(2)} DH
                      </Badge>
                      {item.scanned && (
                        <Badge color="secondary" className="text-xs">
                          Scanned
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {item.parcel?.recipientName} •{" "}
                      {item.parcel?.recipientPhone}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      To: {item.parcel?.destinationCity?.name}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Add New Parcels */}
          {canModify && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Icon icon="heroicons:plus-circle" className="w-5 h-5" />
                    Add Parcels
                  </CardTitle>
                  {selectedNewParcels.length > 0 && (
                    <Button
                      size="sm"
                      onClick={handleAddParcels}
                      disabled={isUpdating}
                    >
                      Add Selected ({selectedNewParcels.length})
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search */}
                <Input
                  placeholder="Search available parcels..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />

                {/* Available Parcels */}
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {filteredAvailableParcels.length === 0 ? (
                    <div className="text-center py-8">
                      <Icon
                        icon="heroicons:inbox"
                        className="w-12 h-12 text-muted-foreground mx-auto mb-4"
                      />
                      <p className="text-muted-foreground">
                        No available parcels found
                      </p>
                    </div>
                  ) : (
                    filteredAvailableParcels.map((parcel) => (
                      <div
                        key={parcel.id}
                        className={cn(
                          "flex items-center space-x-3 p-3 border rounded-lg",
                          selectedNewParcels.includes(parcel.id)
                            ? "bg-primary/5 border-primary"
                            : "hover:bg-muted/50"
                        )}
                      >
                        <Checkbox
                          checked={selectedNewParcels.includes(parcel.id)}
                          onCheckedChange={(checked) =>
                            handleParcelSelection(parcel.id, checked as boolean)
                          }
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <code className="text-sm font-medium">
                              {parcel.code}
                            </code>
                            <Badge color="primary" className="text-xs">
                              {Number(parcel.price).toFixed(2)} DH
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {parcel.recipientName} • {parcel.recipientPhone}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {parcel.pickupCity.name} →{" "}
                            {parcel.destinationCity.name}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Current Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon
                  icon="heroicons:clipboard-document-list"
                  className="w-5 h-5"
                />
                Current Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total parcels:</span>
                  <span className="font-medium">
                    {currentShippingSlip._count?.items || 0}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Scanned parcels:</span>
                  <span className="font-medium">
                    {currentShippingSlip._count?.scannedItems || 0}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total value:</span>
                  <span className="font-medium">
                    {currentShippingSlip._count?.totalValue?.toFixed(2) ||
                      "0.00"}{" "}
                    DH
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Status:</span>
                  <Badge color="primary">{currentShippingSlip.status}</Badge>
                </div>
              </div>
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
              <Link href={`/shipping-slips/${currentShippingSlip.id}/scan`}>
                <Button variant="outline" className="w-full">
                  <Icon icon="heroicons:qr-code" className="w-4 h-4 mr-2" />
                  Scan Parcels
                </Button>
              </Link>

              <Link href={`/shipping-slips/${currentShippingSlip.id}`}>
                <Button variant="outline" className="w-full">
                  <Icon icon="heroicons:eye" className="w-4 h-4 mr-2" />
                  View Details
                </Button>
              </Link>

              {canModify && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    const confirmed = window.confirm(
                      "Are you sure you want to cancel this shipping slip?"
                    );
                    if (confirmed) {
                      setValue("status", ShippingSlipStatus.CANCELLED);
                      handleSubmit(onSubmit)();
                    }
                  }}
                >
                  <Icon icon="heroicons:x-circle" className="w-4 h-4 mr-2" />
                  Cancel Slip
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

// Main component wrapped with ProtectedRoute
const EditShippingSlipPage = () => {
  return (
    <ProtectedRoute
      requiredPermissions={[PARCELS_PERMISSIONS.SHIPPING_SLIPS_UPDATE]}
      requiredAccessLevel="LIMITED"
      allowedAccountStatuses={["ACTIVE"]}
    >
      <EditShippingSlipPageContent />
    </ProtectedRoute>
  );
};

export default EditShippingSlipPage;
