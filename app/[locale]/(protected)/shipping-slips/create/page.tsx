"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
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
import { useShippingSlipsStore } from "@/lib/stores/parcels/shipping-slips.store";
import { useZonesStore } from "@/lib/stores/parcels/zones.store";
import { useAuthStore } from "@/lib/stores/auth/auth.store";
import { ProtectedRoute } from "@/components/route/protected-route";
import { PARCELS_PERMISSIONS } from "@/lib/constants/parcels";
import { toast } from "sonner";
import { cn } from "@/lib/utils/ui.utils";

// Form schema
const createShippingSlipSchema = z.object({
  destinationZoneId: z.string().min(1, "Destination zone is required"),
  parcelIds: z.array(z.string()).optional(),
});

type CreateShippingSlipFormData = z.infer<typeof createShippingSlipSchema>;

const CreateShippingSlipPageContent = () => {
  const router = useRouter();
  const { hasPermission } = useAuthStore();

  const {
    createShippingSlip,
    fetchAvailableParcels,
    availableParcels,
    isCreating,
    error,
  } = useShippingSlipsStore();

  const { zones, fetchZones } = useZonesStore();

  const [selectedParcels, setSelectedParcels] = useState<string[]>([]);
  const [selectedZone, setSelectedZone] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

  const canCreateSlips = hasPermission(
    PARCELS_PERMISSIONS.SHIPPING_SLIPS_CREATE
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
    reset,
  } = useForm<CreateShippingSlipFormData>({
    resolver: zodResolver(createShippingSlipSchema),
    defaultValues: {
      parcelIds: [],
    },
  });

  const watchedZoneId = watch("destinationZoneId");

  // Initialize data
  useEffect(() => {
    if (canCreateSlips) {
      fetchZones();
    }
  }, [canCreateSlips, fetchZones]);

  // Update available parcels when zone changes
  useEffect(() => {
    if (selectedZone) {
      fetchAvailableParcels(selectedZone);
    }
  }, [selectedZone, fetchAvailableParcels]);

  // Update form when parcels selection changes
  useEffect(() => {
    setValue("parcelIds", selectedParcels, { shouldDirty: true });
  }, [selectedParcels, setValue]);

  const handleParcelSelection = (parcelId: string, checked: boolean) => {
    if (checked) {
      setSelectedParcels((prev) => [...prev, parcelId]);
    } else {
      setSelectedParcels((prev) => prev.filter((id) => id !== parcelId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allParcelIds = filteredParcels.map((parcel) => parcel.id);
      setSelectedParcels(allParcelIds);
    } else {
      setSelectedParcels([]);
    }
  };

  const handleZoneSelection = (zoneId: string) => {
    setSelectedZone(zoneId);
    setValue("destinationZoneId", zoneId);
    setSelectedParcels([]); // Clear selected parcels when zone changes
  };

  // Filter parcels based on search term
  const filteredParcels = availableParcels.filter(
    (parcel) =>
      parcel.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      parcel.recipientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      parcel.recipientPhone.includes(searchTerm)
  );

  const onSubmit = async (data: CreateShippingSlipFormData) => {
    if (!canCreateSlips) {
      toast.error("You don't have permission to create shipping slips");
      return;
    }

    const shippingSlip = await createShippingSlip({
      destinationZoneId: data.destinationZoneId,
      parcelIds: selectedParcels,
    });

    if (shippingSlip) {
      toast.success("Shipping slip created successfully");
      router.push(`/shipping-slips/${shippingSlip.id}`);
    }
  };

  if (!canCreateSlips) {
    return (
      <div className="container mx-auto py-8">
        <Alert color="destructive">
          <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to create shipping slips. Please contact
            your administrator.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const totalValue = filteredParcels
    .filter((parcel) => selectedParcels.includes(parcel.id))
    .reduce((sum, parcel) => sum + Number(parcel.price), 0);

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-default-900">
            Create Shipping Slip
          </h1>
          <p className="text-default-600">
            Create a new shipping slip for inter-zone parcel transfer
          </p>
        </div>
        <Link href="/shipping-slips">
          <Button variant="outline">
            <Icon icon="heroicons:arrow-left" className="w-4 h-4 mr-2" />
            Back to Shipping Slips
          </Button>
        </Link>
      </div>

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
          {/* Zone Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon icon="heroicons:map-pin" className="w-5 h-5" />
                Destination Zone
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="destinationZoneId">
                  Select Destination Zone
                </Label>
                <Select
                  value={watchedZoneId || ""}
                  onValueChange={handleZoneSelection}
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
                {errors.destinationZoneId && (
                  <p className="text-xs text-destructive">
                    {errors.destinationZoneId.message}
                  </p>
                )}
              </div>

              {watchedZoneId && (
                <Alert color="info" variant="soft">
                  <Icon
                    icon="heroicons:information-circle"
                    className="h-4 w-4"
                  />
                  <AlertDescription>
                    Only parcels with destination cities in this zone will be
                    available for selection.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Parcel Selection */}
          {watchedZoneId && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Icon icon="heroicons:cube" className="w-5 h-5" />
                    Select Parcels
                  </CardTitle>
                  <Badge color="primary">
                    {selectedParcels.length} selected
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search by code, recipient name, or phone..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                {/* Select All */}
                {filteredParcels.length > 0 && (
                  <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
                    <Checkbox
                      id="select-all"
                      checked={
                        filteredParcels.length > 0 &&
                        filteredParcels.every((parcel) =>
                          selectedParcels.includes(parcel.id)
                        )
                      }
                      onCheckedChange={handleSelectAll}
                    />
                    <Label htmlFor="select-all" className="text-sm font-medium">
                      Select all visible parcels ({filteredParcels.length})
                    </Label>
                  </div>
                )}

                {/* Parcels List */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredParcels.length === 0 ? (
                    <div className="text-center py-8">
                      <Icon
                        icon="heroicons:inbox"
                        className="w-12 h-12 text-muted-foreground mx-auto mb-4"
                      />
                      <p className="text-muted-foreground">
                        {searchTerm
                          ? "No parcels match your search"
                          : "No available parcels for this zone"}
                      </p>
                    </div>
                  ) : (
                    filteredParcels.map((parcel) => (
                      <div
                        key={parcel.id}
                        className={cn(
                          "flex items-center space-x-3 p-3 border rounded-lg",
                          selectedParcels.includes(parcel.id)
                            ? "bg-primary/5 border-primary"
                            : "hover:bg-muted/50"
                        )}
                      >
                        <Checkbox
                          checked={selectedParcels.includes(parcel.id)}
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
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Selected parcels:</span>
                  <span className="font-medium">{selectedParcels.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total value:</span>
                  <span className="font-medium">
                    {totalValue.toFixed(2)} DH
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Destination zone:</span>
                  <span className="font-medium">
                    {watchedZoneId
                      ? zones.find((z) => z.id === watchedZoneId)?.name ||
                        "Unknown"
                      : "Not selected"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon icon="heroicons:cog-6-tooth" className="w-5 h-5" />
                Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={handleSubmit(onSubmit)}
                disabled={isCreating || !watchedZoneId}
                className="w-full"
              >
                {isCreating && (
                  <Icon
                    icon="heroicons:arrow-path"
                    className="mr-2 h-4 w-4 animate-spin"
                  />
                )}
                Create Shipping Slip
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  reset();
                  setSelectedParcels([]);
                  setSelectedZone("");
                  setSearchTerm("");
                }}
                disabled={isCreating || !isDirty}
                className="w-full"
              >
                Reset Form
              </Button>
            </CardContent>
          </Card>

          {/* Help */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon
                  icon="heroicons:question-mark-circle"
                  className="w-5 h-5"
                />
                Help
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm space-y-2">
                <p className="font-medium">What is a shipping slip?</p>
                <p className="text-muted-foreground">
                  A shipping slip groups parcels for inter-zone transfer. It
                  tracks packages moving between different operational zones.
                </p>
              </div>
              <div className="text-sm space-y-2">
                <p className="font-medium">Parcel status changes:</p>
                <ul className="text-muted-foreground space-y-1">
                  <li>• COLLECTED → DISPATCHED (when added to slip)</li>
                  <li>• DISPATCHED → PUT_IN_DISTRIBUTION (when received)</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

// Main component wrapped with ProtectedRoute
const CreateShippingSlipPage = () => {
  return (
    <ProtectedRoute
      requiredPermissions={[PARCELS_PERMISSIONS.SHIPPING_SLIPS_CREATE]}
      requiredAccessLevel="LIMITED"
      allowedAccountStatuses={["ACTIVE"]}
    >
      <CreateShippingSlipPageContent />
    </ProtectedRoute>
  );
};

export default CreateShippingSlipPage;
