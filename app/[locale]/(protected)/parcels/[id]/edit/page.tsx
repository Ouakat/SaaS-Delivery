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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "@/i18n/routing";
import { ProtectedRoute } from "@/components/route/protected-route";
import { PARCELS_PERMISSIONS } from "@/lib/constants/parcels";
import { useParcelsStore } from "@/lib/stores/parcels/parcels.store";
import { useCitiesStore } from "@/lib/stores/parcels/cities.store";
import { useAuthStore } from "@/lib/stores/auth/auth.store";
import { toast } from "sonner";
import { cn } from "@/lib/utils/ui.utils";
import {
  PARCEL_STATUS_LABELS,
  PARCEL_STATUS_COLORS,
} from "@/lib/types/parcels/parcels.types";

// Form schema for updating parcel
const updateParcelSchema = z.object({
  recipientName: z
    .string()
    .min(2, "Recipient name must be at least 2 characters"),
  recipientPhone: z.string().min(10, "Please enter a valid phone number"),
  recipientAddress: z.string().min(5, "Please enter a complete address"),
  alternativePhone: z.string().optional(),
  destinationCityId: z.string().min(1, "Please select a destination city"),
  trackingCode: z.string().optional(),
  productName: z.string().optional(),
  quantity: z.number().min(1, "Quantity must be at least 1").optional(),
  price: z.number().min(0.01, "Price must be greater than 0"),
  comment: z.string().optional(),
  cannotOpen: z.boolean().default(false),
  canReplace: z.boolean().default(false),
  isStock: z.boolean().default(false),
});

type UpdateParcelFormData = z.infer<typeof updateParcelSchema>;

const UpdateParcelPage = () => {
  const router = useRouter();
  const params = useParams();
  const parcelId = params?.id as string;
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [parcel, setParcel] = useState<any>(null);

  const { fetchParcelById, updateParcel, isUpdating } = useParcelsStore();
  const { cities, fetchCities } = useCitiesStore();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
    reset,
  } = useForm<UpdateParcelFormData>({
    resolver: zodResolver(updateParcelSchema),
  });

  const watchedDestinationCity = watch("destinationCityId");

  // Fetch parcel and cities on component mount
  useEffect(() => {
    const fetchData = async () => {
      if (!parcelId) return;

      try {
        setFetchLoading(true);

        // Fetch parcel data
        const parcelResult = await fetchParcelById(parcelId);
        if (parcelResult) {
          setParcel(parcelResult);

          // Populate form with parcel data
          reset({
            recipientName: parcelResult.recipientName || "",
            recipientPhone: parcelResult.recipientPhone || "",
            recipientAddress: parcelResult.recipientAddress || "",
            alternativePhone: parcelResult.alternativePhone || "",
            destinationCityId: parcelResult.destinationCityId || "",
            trackingCode: parcelResult.trackingCode || "",
            productName: parcelResult.productName || "",
            quantity: parcelResult.quantity || 1,
            price: parcelResult.price || 0,
            comment: parcelResult.comment || "",
            cannotOpen: parcelResult.cannotOpen || false,
            canReplace: parcelResult.canReplace || false,
            isStock: parcelResult.isStock || false,
          });
        } else {
          toast.error("Failed to fetch parcel data");
          router.push("/parcels");
        }

        // Fetch cities
        await fetchCities();
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("An error occurred while fetching data");
        router.push("/parcels");
      } finally {
        setFetchLoading(false);
      }
    };

    fetchData();
  }, [parcelId, reset, router, fetchParcelById, fetchCities]);

  // Filter cities for destination (all active cities)
  const destinationCities = cities.filter((city) => city.status);

  const onSubmit = async (data: UpdateParcelFormData) => {
    const result = await updateParcel(parcelId, data);
    if (result) {
      toast.success("Parcel updated successfully!");
      router.push(`/parcels/${parcelId}`);
    }
  };

  const handleFormSubmit = () => {
    handleSubmit(onSubmit)();
  };

  if (fetchLoading) {
    return (
      <ProtectedRoute
        requiredPermissions={[PARCELS_PERMISSIONS.PARCELS_UPDATE]}
        requiredAccessLevel="FULL"
      >
        <div className="container mx-auto py-6">
          <Card>
            <CardContent className="p-8">
              <div className="flex items-center justify-center space-x-2">
                <Icon
                  icon="heroicons:arrow-path"
                  className="w-5 h-5 animate-spin"
                />
                <span>Loading parcel data...</span>
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
        requiredPermissions={[PARCELS_PERMISSIONS.PARCELS_UPDATE]}
        requiredAccessLevel="FULL"
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

  // Check if parcel can be edited
  const canEdit = ["NEW_PACKAGE", "RECEIVED"].includes(parcel.parcelStatusCode);
  if (!canEdit) {
    return (
      <ProtectedRoute
        requiredPermissions={[PARCELS_PERMISSIONS.PARCELS_UPDATE]}
        requiredAccessLevel="FULL"
      >
        <div className="container mx-auto py-8">
          <Alert color="warning">
            <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
            <AlertDescription>
              This parcel cannot be edited in its current status:{" "}
              {PARCEL_STATUS_LABELS[parcel.parcelStatusCode] ||
                parcel.parcelStatusCode}
            </AlertDescription>
          </Alert>

          <div className="mt-4">
            <Link href={`/parcels/${parcelId}`}>
              <Button variant="outline">
                <Icon icon="heroicons:arrow-left" className="w-4 h-4 mr-2" />
                Back to Parcel Details
              </Button>
            </Link>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute
      requiredPermissions={[PARCELS_PERMISSIONS.PARCELS_UPDATE]}
      requiredAccessLevel="FULL"
    >
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Icon
                icon="heroicons:pencil-square"
                className="w-6 h-6 text-blue-600"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-default-900">
                Edit Parcel
              </h1>
              <p className="text-default-600">
                {parcel.code} • {parcel.recipientName}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  style={{
                    backgroundColor:
                      PARCEL_STATUS_COLORS[parcel.parcelStatusCode] + "20",
                    color: PARCEL_STATUS_COLORS[parcel.parcelStatusCode],
                    borderColor: PARCEL_STATUS_COLORS[parcel.parcelStatusCode],
                  }}
                  className="border"
                >
                  {PARCEL_STATUS_LABELS[parcel.parcelStatusCode] ||
                    parcel.parcelStatusCode}
                </Badge>
              </div>
            </div>
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

        {/* Unsaved Changes Warning */}
        {isDirty && (
          <Alert color="warning" variant="soft">
            <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
            <AlertDescription>
              You have unsaved changes. Don't forget to save your updates.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form */}
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
                  {/* Recipient Name */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="recipientName"
                      className={cn("", {
                        "text-destructive": errors.recipientName,
                      })}
                    >
                      Recipient Name *
                    </Label>
                    <Input
                      id="recipientName"
                      {...register("recipientName")}
                      placeholder="Enter recipient full name"
                      className={cn("", {
                        "border-destructive focus:border-destructive":
                          errors.recipientName,
                      })}
                    />
                    {errors.recipientName && (
                      <p className="text-xs text-destructive">
                        {errors.recipientName.message}
                      </p>
                    )}
                  </div>

                  {/* Phone Numbers */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="recipientPhone"
                        className={cn("", {
                          "text-destructive": errors.recipientPhone,
                        })}
                      >
                        Phone Number *
                      </Label>
                      <Input
                        id="recipientPhone"
                        {...register("recipientPhone")}
                        placeholder="+212 6XX XXX XXX"
                        className={cn("", {
                          "border-destructive focus:border-destructive":
                            errors.recipientPhone,
                        })}
                      />
                      {errors.recipientPhone && (
                        <p className="text-xs text-destructive">
                          {errors.recipientPhone.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="alternativePhone">
                        Alternative Phone
                      </Label>
                      <Input
                        id="alternativePhone"
                        {...register("alternativePhone")}
                        placeholder="+212 5XX XXX XXX"
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="recipientAddress"
                      className={cn("", {
                        "text-destructive": errors.recipientAddress,
                      })}
                    >
                      Delivery Address *
                    </Label>
                    <Textarea
                      id="recipientAddress"
                      {...register("recipientAddress")}
                      placeholder="Enter complete delivery address with landmarks"
                      rows={3}
                      className={cn("", {
                        "border-destructive focus:border-destructive":
                          errors.recipientAddress,
                      })}
                    />
                    {errors.recipientAddress && (
                      <p className="text-xs text-destructive">
                        {errors.recipientAddress.message}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Route Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon icon="heroicons:map" className="w-5 h-5" />
                    Route Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Pickup City (Read Only)</Label>
                      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md">
                        <Badge color="primary" className="text-xs">
                          {parcel.pickupCity?.ref}
                        </Badge>
                        <span className="font-medium">
                          {parcel.pickupCity?.name}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Pickup city cannot be changed after parcel creation
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label
                        className={cn("", {
                          "text-destructive": errors.destinationCityId,
                        })}
                      >
                        Destination City *
                      </Label>
                      <Select
                        value={watchedDestinationCity}
                        onValueChange={(value) =>
                          setValue("destinationCityId", value)
                        }
                      >
                        <SelectTrigger
                          className={cn("", {
                            "border-destructive": errors.destinationCityId,
                          })}
                        >
                          <SelectValue placeholder="Select destination city" />
                        </SelectTrigger>
                        <SelectContent>
                          {destinationCities.map((city) => (
                            <SelectItem key={city.id} value={city.id}>
                              <div className="flex items-center gap-3">
                                <Badge color="primary" className="text-xs">
                                  {city.ref}
                                </Badge>
                                <span>{city.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.destinationCityId && (
                        <p className="text-xs text-destructive">
                          {errors.destinationCityId.message}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Parcel Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon icon="heroicons:cube" className="w-5 h-5" />
                    Parcel Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="trackingCode">Custom Tracking Code</Label>
                      <Input
                        id="trackingCode"
                        {...register("trackingCode")}
                        placeholder="TRACK123"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="productName">Product Name</Label>
                      <Input
                        id="productName"
                        {...register("productName")}
                        placeholder="Smartphone Case Premium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantity</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        {...register("quantity", { valueAsNumber: true })}
                        placeholder="1"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="price"
                        className={cn("", { "text-destructive": errors.price })}
                      >
                        Price (DH) *
                      </Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        min="0.01"
                        {...register("price", { valueAsNumber: true })}
                        placeholder="350.00"
                        className={cn("", {
                          "border-destructive focus:border-destructive":
                            errors.price,
                        })}
                      />
                      {errors.price && (
                        <p className="text-xs text-destructive">
                          {errors.price.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="comment">Special Instructions</Label>
                    <Textarea
                      id="comment"
                      {...register("comment")}
                      placeholder="Call before delivery - Deliver after 2PM - Handle with care"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Special Options */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon icon="heroicons:cog-6-tooth" className="w-5 h-5" />
                    Special Options
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Cannot Open Package</Label>
                        <p className="text-xs text-muted-foreground">
                          Package cannot be opened for inspection
                        </p>
                      </div>
                      <Switch {...register("cannotOpen")} />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Can Replace Item</Label>
                        <p className="text-xs text-muted-foreground">
                          Can substitute with different item if needed
                        </p>
                      </div>
                      <Switch {...register("canReplace")} />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Stock Item</Label>
                        <p className="text-xs text-muted-foreground">
                          This is a stock/inventory item
                        </p>
                      </div>
                      <Switch {...register("isStock")} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Current Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon
                      icon="heroicons:information-circle"
                      className="w-5 h-5"
                    />
                    Current Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label>Parcel Status</Label>
                    <div className="mt-1">
                      <Badge
                        style={{
                          backgroundColor:
                            PARCEL_STATUS_COLORS[parcel.parcelStatusCode] +
                            "20",
                          color: PARCEL_STATUS_COLORS[parcel.parcelStatusCode],
                          borderColor:
                            PARCEL_STATUS_COLORS[parcel.parcelStatusCode],
                        }}
                        className="border"
                      >
                        {PARCEL_STATUS_LABELS[parcel.parcelStatusCode] ||
                          parcel.parcelStatusCode}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <Label>Parcel Code</Label>
                    <p className="font-mono text-sm mt-1">{parcel.code}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Account Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon icon="heroicons:calendar" className="w-5 h-5" />
                    Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Created:</span>
                    <div className="font-medium">
                      {new Date(parcel.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </div>
                    {parcel.createdBy && (
                      <div className="text-xs text-muted-foreground">
                        by {parcel.createdBy}
                      </div>
                    )}
                  </div>

                  <div className="text-sm">
                    <span className="text-muted-foreground">Last Updated:</span>
                    <div className="font-medium">
                      {new Date(parcel.updatedAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-4 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/parcels/${parcelId}`)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset({
                  recipientName: parcel.recipientName || "",
                  recipientPhone: parcel.recipientPhone || "",
                  recipientAddress: parcel.recipientAddress || "",
                  alternativePhone: parcel.alternativePhone || "",
                  destinationCityId: parcel.destinationCityId || "",
                  trackingCode: parcel.trackingCode || "",
                  productName: parcel.productName || "",
                  quantity: parcel.quantity || 1,
                  price: parcel.price || 0,
                  comment: parcel.comment || "",
                  cannotOpen: parcel.cannotOpen || false,
                  canReplace: parcel.canReplace || false,
                  isStock: parcel.isStock || false,
                });
              }}
              disabled={isUpdating || !isDirty}
            >
              Reset Changes
            </Button>
            <Button
              type="button"
              onClick={handleFormSubmit}
              disabled={isUpdating || !isDirty}
            >
              {isUpdating && (
                <Icon
                  icon="heroicons:arrow-path"
                  className="mr-2 h-4 w-4 animate-spin"
                />
              )}
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default UpdateParcelPage;
