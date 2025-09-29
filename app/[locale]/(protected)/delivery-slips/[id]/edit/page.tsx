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
import { Textarea } from "@/components/ui/textarea";
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
import { useDeliverySlipsStore } from "@/lib/stores/parcels/delivery-slips.store";
import { useCitiesStore } from "@/lib/stores/parcels/cities.store";
import { useAuthStore } from "@/lib/stores/auth/auth.store";
import { ProtectedRoute } from "@/components/route/protected-route";
import { PARCELS_PERMISSIONS } from "@/lib/constants/parcels";
import { DeliverySlipStatus } from "@/lib/types/parcels/delivery-slips.types";
import { toast } from "sonner";
import { cn } from "@/lib/utils/ui.utils";

// Form schema for editing delivery slip
const editDeliverySlipSchema = z.object({
  cityId: z.string().optional(),
  notes: z.string().max(500).optional(),
  status: z.nativeEnum(DeliverySlipStatus).optional(),
});

type EditDeliverySlipFormData = z.infer<typeof editDeliverySlipSchema>;

const EditDeliverySlipPageContent = () => {
  const router = useRouter();
  const params = useParams();
  const slipId = params?.id as string;

  const { hasPermission, user } = useAuthStore();
  const {
    currentDeliverySlip,
    fetchDeliverySlipById,
    updateDeliverySlip,
    addParcelsToSlip,
    removeParcelsFromSlip,
    fetchAvailableParcels,
    availableParcels,
    isUpdating,
    isLoading,
    error,
  } = useDeliverySlipsStore();
  const { cities, fetchCities } = useCitiesStore();

  const [selectedNewParcels, setSelectedNewParcels] = useState<string[]>([]);
  const [parcelsToRemove, setParcelsToRemove] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Check permissions
  const canUpdateSlips = hasPermission(
    PARCELS_PERMISSIONS.DELIVERY_SLIPS_UPDATE
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
    reset,
  } = useForm<EditDeliverySlipFormData>({
    resolver: zodResolver(editDeliverySlipSchema),
  });

  const watchedStatus = watch("status");

  // Initialize data
  useEffect(() => {
    if (canUpdateSlips && slipId) {
      fetchDeliverySlipById(slipId);
      fetchCities();
      fetchAvailableParcels();
    }
  }, [
    canUpdateSlips,
    slipId,
    fetchDeliverySlipById,
    fetchCities,
    fetchAvailableParcels,
  ]);

  // Populate form when delivery slip is loaded
  useEffect(() => {
    if (currentDeliverySlip) {
      reset({
        cityId: currentDeliverySlip.cityId || undefined,
        notes: currentDeliverySlip.notes || "",
        status: currentDeliverySlip.status,
      });
    }
  }, [currentDeliverySlip, reset]);

  const canModify = currentDeliverySlip?.status === DeliverySlipStatus.PENDING;

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
    if (!currentDeliverySlip || selectedNewParcels.length === 0) return;

    const success = await addParcelsToSlip(currentDeliverySlip.id, {
      parcelIds: selectedNewParcels,
      markAsScanned: true,
      comment: "Added via edit page",
    });

    if (success) {
      setSelectedNewParcels([]);
      fetchAvailableParcels();
      toast.success("Parcels added successfully");
    }
  };

  const handleRemoveParcels = async () => {
    if (!currentDeliverySlip || parcelsToRemove.length === 0) return;

    const success = await removeParcelsFromSlip(currentDeliverySlip.id, {
      parcelIds: parcelsToRemove,
      reason: "Removed via edit page",
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

  const onSubmit = async (data: EditDeliverySlipFormData) => {
    if (!currentDeliverySlip) return;

    const updatedSlip = await updateDeliverySlip(currentDeliverySlip.id, data);

    if (updatedSlip) {
      toast.success("Delivery slip updated successfully");
      router.push(`/delivery-slips/${currentDeliverySlip.id}`);
    }
  };

  if (!canUpdateSlips) {
    return (
      <div className="container mx-auto py-8">
        <Alert color="destructive">
          <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to edit delivery slips. Please contact
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
              <span>Loading delivery slip...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentDeliverySlip || error) {
    return (
      <div className="container mx-auto py-8">
        <Alert color="destructive">
          <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
          <AlertDescription>
            {error || "Delivery slip not found or has been deleted."}
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
            Edit Delivery Slip
          </h1>
          <p className="text-default-600">
            {currentDeliverySlip.reference} • {currentDeliverySlip.status}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/delivery-slips/${currentDeliverySlip.id}`}>
            <Button variant="outline">
              <Icon icon="heroicons:eye" className="w-4 h-4 mr-2" />
              View Details
            </Button>
          </Link>
          <Link href="/delivery-slips">
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
            This delivery slip has status "{currentDeliverySlip.status}" and
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
                {/* City Selection */}
                <div className="space-y-2">
                  <Label htmlFor="cityId">Collection City</Label>
                  <Select
                    value={watch("cityId") || ""}
                    onValueChange={(value) =>
                      setValue("cityId", value || undefined)
                    }
                    disabled={!canModify}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select collection city" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No specific city</SelectItem>
                      {cities
                        .filter((city) => city.pickupCity && city.status)
                        .map((city) => (
                          <SelectItem key={city.id} value={city.id}>
                            {city.name} ({city.ref})
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
                        setValue("status", value as DeliverySlipStatus)
                      }
                      disabled={!canModify}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={DeliverySlipStatus.PENDING}>
                          Pending
                        </SelectItem>
                        <SelectItem value={DeliverySlipStatus.RECEIVED}>
                          Received
                        </SelectItem>
                        <SelectItem value={DeliverySlipStatus.CANCELLED}>
                          Cancelled
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    {...register("notes")}
                    placeholder="Add any special instructions or notes..."
                    rows={3}
                    disabled={!canModify}
                  />
                  {errors.notes && (
                    <p className="text-xs text-destructive">
                      {errors.notes.message}
                    </p>
                  )}
                </div>

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
                  Current Parcels ({currentDeliverySlip.items.length})
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
              {currentDeliverySlip.items.map((item) => (
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
                        {item.parcel.code}
                      </code>
                      <Badge color="primary" className="text-xs">
                        {item.parcel.price.toFixed(2)} DH
                      </Badge>
                      {item.scanned && (
                        <Badge color="secondary" className="text-xs">
                          Scanned
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {item.parcel.recipientName} • {item.parcel.recipientPhone}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      To: {item.parcel.destinationCity}
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
                    {currentDeliverySlip.summary.totalParcels}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Scanned parcels:</span>
                  <span className="font-medium">
                    {currentDeliverySlip.summary.scannedParcels}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total value:</span>
                  <span className="font-medium">
                    {currentDeliverySlip.summary.totalValue.toFixed(2)} DH
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Status:</span>
                  <Badge color="primary">{currentDeliverySlip.status}</Badge>
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
              <Link href={`/delivery-slips/${currentDeliverySlip.id}/scan`}>
                <Button variant="outline" className="w-full">
                  <Icon icon="heroicons:qr-code" className="w-4 h-4 mr-2" />
                  Scan Parcels
                </Button>
              </Link>

              <Link href={`/delivery-slips/${currentDeliverySlip.id}`}>
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
                      "Are you sure you want to cancel this delivery slip?"
                    );
                    if (confirmed) {
                      setValue("status", DeliverySlipStatus.CANCELLED);
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
const EditDeliverySlipPage = () => {
  return (
    <ProtectedRoute
      requiredPermissions={[PARCELS_PERMISSIONS.DELIVERY_SLIPS_UPDATE]}
      requiredAccessLevel="LIMITED"
      allowedAccountStatuses={["ACTIVE"]}
    >
      <EditDeliverySlipPageContent />
    </ProtectedRoute>
  );
};

export default EditDeliverySlipPage;
