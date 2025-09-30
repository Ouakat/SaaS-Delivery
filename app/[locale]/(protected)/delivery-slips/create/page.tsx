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
import { Switch } from "@/components/ui/switch";
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
import { toast } from "sonner";
import { cn } from "@/lib/utils/ui.utils";

// Form schema for creating delivery slip
const createDeliverySlipSchema = z.object({
  cityId: z.string().optional(),
  parcelIds: z.array(z.string()).optional(),
  notes: z.string().max(500).optional(),
  autoReceive: z.boolean().default(false),
});

type CreateDeliverySlipFormData = z.infer<typeof createDeliverySlipSchema>;

const CreateDeliverySlipPageContent = () => {
  const router = useRouter();
  const { hasPermission, user } = useAuthStore();
  const {
    createDeliverySlip,
    fetchAvailableParcels,
    availableParcels,
    isCreating,
    error,
  } = useDeliverySlipsStore();
  const { cities, fetchCities } = useCitiesStore();

  const [selectedParcels, setSelectedParcels] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

  // Check permissions
  const canCreateSlips = hasPermission(
    PARCELS_PERMISSIONS.DELIVERY_SLIPS_CREATE
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
    reset,
  } = useForm<CreateDeliverySlipFormData>({
    resolver: zodResolver(createDeliverySlipSchema),
    defaultValues: {
      autoReceive: false,
      parcelIds: [],
    },
  });

  const watchedCityId = watch("cityId");
  const watchedAutoReceive = watch("autoReceive");

  // Initialize data
  useEffect(() => {
    if (canCreateSlips) {
      fetchCities();
      fetchAvailableParcels();
    }
  }, [canCreateSlips, fetchCities, fetchAvailableParcels]);

  // Update available parcels when city filter changes
  useEffect(() => {
    if (selectedCity) {
      fetchAvailableParcels(selectedCity);
    } else {
      fetchAvailableParcels();
    }
  }, [selectedCity, fetchAvailableParcels]);

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

  const handleCityFilter = (cityId: string) => {
    setSelectedCity(cityId === "all" ? "" : cityId);
  };

  // Filter parcels based on search term
  const filteredParcels = availableParcels.filter(
    (parcel) =>
      parcel.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      parcel.recipientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      parcel.recipientPhone.includes(searchTerm)
  );

  const onSubmit = async (data: CreateDeliverySlipFormData) => {
    if (!canCreateSlips) {
      toast.error("You don't have permission to create delivery slips");
      return;
    }

    const deliverySlip = await createDeliverySlip({
      cityId: data.cityId,
      parcelIds: selectedParcels,
      notes: data.notes,
      autoReceive: data.autoReceive,
    });

    if (deliverySlip) {
      toast.success("Delivery slip created successfully");
      router.push(`/delivery-slips/${deliverySlip.id}`);
    }
  };

  if (!canCreateSlips) {
    return (
      <div className="container mx-auto py-8">
        <Alert color="destructive">
          <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to create delivery slips. Please contact
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
            Create Delivery Slip
          </h1>
          <p className="text-default-600">
            Create a new delivery slip to group parcels for collection
          </p>
        </div>
        <Link href="/delivery-slips">
          <Button variant="outline">
            <Icon icon="heroicons:arrow-left" className="w-4 h-4 mr-2" />
            Back to Delivery Slips
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
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon icon="heroicons:document-text" className="w-5 h-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* City Selection */}
              <div className="space-y-2">
                <Label htmlFor="cityId">Collection City (Optional)</Label>
                <Select
                  value={watchedCityId || ""}
                  onValueChange={(value) =>
                    setValue("cityId", value || undefined)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select collection city" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No specific city</SelectItem>
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

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  {...register("notes")}
                  placeholder="Add any special instructions or notes..."
                  rows={3}
                />
                {errors.notes && (
                  <p className="text-xs text-destructive">
                    {errors.notes.message}
                  </p>
                )}
              </div>

              {/* Auto-receive option */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label>Auto-receive slip</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically mark this slip as received upon creation
                  </p>
                </div>
                <Switch
                  {...register("autoReceive")}
                  checked={watchedAutoReceive}
                  onCheckedChange={(checked) =>
                    setValue("autoReceive", checked)
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Parcel Selection */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Icon icon="heroicons:cube" className="w-5 h-5" />
                  Select Parcels
                </CardTitle>
                <Badge color="primary">{selectedParcels.length} selected</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search by code, recipient name, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div>
                  <Select
                    value={selectedCity || "all"}
                    onValueChange={handleCityFilter}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Filter by pickup city" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All cities</SelectItem>
                      {cities
                        .filter((city) => city.pickupCity && city.status)
                        .map((city) => (
                          <SelectItem key={city.id} value={city.id}>
                            {city.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
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
                      {searchTerm || selectedCity
                        ? "No parcels match your filters"
                        : "No available parcels for delivery slips"}
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
                  <span>Collection city:</span>
                  <span className="font-medium">
                    {watchedCityId
                      ? cities.find((c) => c.id === watchedCityId)?.name ||
                        "Unknown"
                      : "Not specified"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Auto-receive:</span>
                  <span className="font-medium">
                    {watchedAutoReceive ? "Yes" : "No"}
                  </span>
                </div>
              </div>

              {watchedAutoReceive && (
                <Alert color="info" variant="soft">
                  <Icon
                    icon="heroicons:information-circle"
                    className="h-4 w-4"
                  />
                  <AlertDescription>
                    The slip will be automatically marked as received and
                    parcels will have their status updated.
                  </AlertDescription>
                </Alert>
              )}
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
                disabled={isCreating || selectedParcels.length === 0}
                className="w-full"
              >
                {isCreating && (
                  <Icon
                    icon="heroicons:arrow-path"
                    className="mr-2 h-4 w-4 animate-spin"
                  />
                )}
                Create Delivery Slip
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  reset();
                  setSelectedParcels([]);
                  setSelectedCity("");
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
                <p className="font-medium">What is a delivery slip?</p>
                <p className="text-muted-foreground">
                  A delivery slip groups multiple parcels for efficient pickup
                  operations. It serves as a collection document.
                </p>
              </div>
              <div className="text-sm space-y-2">
                <p className="font-medium">Parcel status changes:</p>
                <ul className="text-muted-foreground space-y-1">
                  <li>• Same city: NEW_PACKAGE → RECEIVED</li>
                  <li>• Different city: NEW_PACKAGE → COLLECTED</li>
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
const CreateDeliverySlipPage = () => {
  return (
    <ProtectedRoute
      requiredPermissions={[PARCELS_PERMISSIONS.DELIVERY_SLIPS_CREATE]}
      requiredAccessLevel="LIMITED"
      allowedAccountStatuses={["ACTIVE"]}
    >
      <CreateDeliverySlipPageContent />
    </ProtectedRoute>
  );
};

export default CreateDeliverySlipPage;
