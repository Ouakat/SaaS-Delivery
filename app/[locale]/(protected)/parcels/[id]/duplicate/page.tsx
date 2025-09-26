"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useParams, useRouter } from "next/navigation";
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
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Link } from "@/i18n/routing";
import { useParcelsStore } from "@/lib/stores/parcels/parcels.store";
import { useCitiesStore } from "@/lib/stores/parcels/cities.store";
import { usePickupCitiesStore } from "@/lib/stores/parcels/pickup-cities.store";
import { useAuthStore } from "@/lib/stores/auth/auth.store";
import { toast } from "sonner";
import { cn } from "@/lib/utils/ui.utils";
import { ProtectedRoute } from "@/components/route/protected-route";
import { PARCELS_PERMISSIONS } from "@/lib/constants/parcels";
import type { CreateParcelRequest } from "@/lib/types/parcels/parcels.types";
import {
  PARCEL_STATUS_COLORS,
  PARCEL_STATUS_LABELS,
  PAYMENT_STATUS_COLORS,
  PAYMENT_STATUS_LABELS,
} from "@/lib/types/parcels/parcels.types";

// Form schema for duplicating parcel
const duplicateParcelSchema = z.object({
  recipientName: z
    .string()
    .min(2, "Recipient name must be at least 2 characters"),
  recipientPhone: z.string().min(10, "Please enter a valid phone number"),
  recipientAddress: z.string().min(5, "Please enter a complete address"),
  alternativePhone: z.string().optional(),
  pickupCityId: z.string().min(1, "Please select a pickup city"),
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

type DuplicateParcelFormData = z.infer<typeof duplicateParcelSchema>;

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

const DuplicateParcelPageContent = () => {
  const router = useRouter();
  const params = useParams();
  const parcelId = params?.id as string;
  const { user } = useAuthStore();
  const {
    currentParcel,
    fetchParcelById,
    createParcel,
    isLoading,
    isCreating,
  } = useParcelsStore();
  const { cities, fetchCities } = useCitiesStore();
  const { fetchActivePickupCities } = usePickupCitiesStore();

  const [estimatedCost, setEstimatedCost] = useState<{
    deliveryPrice: number;
    returnPrice: number;
    refusalPrice: number;
    deliveryDelay: number;
  } | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
    reset,
  } = useForm<DuplicateParcelFormData>({
    resolver: zodResolver(duplicateParcelSchema),
  });

  const watchedPickupCity = watch("pickupCityId");
  const watchedDestinationCity = watch("destinationCityId");

  // Fetch original parcel and cities on component mount
  useEffect(() => {
    const fetchData = async () => {
      if (!parcelId) return;

      try {
        await Promise.all([
          fetchParcelById(parcelId),
          fetchActivePickupCities(),
          fetchCities(),
        ]);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load parcel data");
      }
    };

    fetchData();
  }, [parcelId, fetchParcelById, fetchActivePickupCities, fetchCities]);

  // Populate form when original parcel is loaded
  useEffect(() => {
    if (currentParcel) {
      reset({
        recipientName: currentParcel.recipientName,
        recipientPhone: currentParcel.recipientPhone,
        recipientAddress: currentParcel.recipientAddress,
        alternativePhone: currentParcel.alternativePhone,
        pickupCityId: currentParcel.pickupCityId,
        destinationCityId: currentParcel.destinationCityId,
        trackingCode: "", // Clear tracking code for new parcel
        productName: currentParcel.productName,
        quantity: currentParcel.quantity,
        price: currentParcel.price,
        comment: currentParcel.comment,
        cannotOpen: currentParcel.cannotOpen,
        canReplace: currentParcel.canReplace,
        isStock: currentParcel.isStock,
      });
    }
  }, [currentParcel, reset]);

  // Calculate estimated cost when cities change
  useEffect(() => {
    if (watchedPickupCity && watchedDestinationCity) {
      // TODO: Implement cost calculation API call
      // For now, using values from original parcel
      if (currentParcel) {
        setEstimatedCost({
          deliveryPrice: currentParcel.deliveryPrice,
          returnPrice: currentParcel.returnPrice,
          refusalPrice: currentParcel.refusalPrice,
          deliveryDelay: currentParcel.deliveryDelay,
        });
      }
    } else {
      setEstimatedCost(null);
    }
  }, [watchedPickupCity, watchedDestinationCity, currentParcel]);

  // Filter cities for pickup and destination
  const pickupCities = cities.filter((city) => city.pickupCity && city.status);
  const destinationCities = cities.filter((city) => city.status);

  const onSubmit = async (data: DuplicateParcelFormData) => {
    // Validate that pickup and destination are different
    if (data.pickupCityId === data.destinationCityId) {
      toast.error("Pickup and destination cities cannot be the same");
      return;
    }

    const parcelData: CreateParcelRequest = {
      recipientName: data.recipientName,
      recipientPhone: data.recipientPhone,
      recipientAddress: data.recipientAddress,
      alternativePhone: data.alternativePhone,
      pickupCityId: data.pickupCityId,
      destinationCityId: data.destinationCityId,
      trackingCode: data.trackingCode,
      productName: data.productName,
      quantity: data.quantity,
      price: data.price,
      comment: data.comment,
      cannotOpen: data.cannotOpen,
      canReplace: data.canReplace,
      isStock: data.isStock,
    };

    const result = await createParcel(parcelData);
    if (result) {
      toast.success("Parcel duplicated successfully!");
      router.push(`/parcels/${result.id}`);
    }
  };

  const handleFormSubmit = () => {
    handleSubmit(onSubmit)();
  };

  const getPickupCityName = () => {
    const city = pickupCities.find((c) => c.id === watchedPickupCity);
    return city?.name || "";
  };

  const getDestinationCityName = () => {
    const city = destinationCities.find((c) => c.id === watchedDestinationCity);
    return city?.name || "";
  };

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
              <span>Loading parcel data...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentParcel) {
    return (
      <div className="container mx-auto py-8">
        <Alert color="destructive">
          <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
          <AlertDescription>
            Original parcel not found or has been deleted.
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
            Duplicate Parcel
          </h1>
          <p className="text-default-600">
            Create a copy of parcel {currentParcel.code} with new details
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/parcels/${parcelId}`}>
            <Button variant="outline">
              <Icon icon="heroicons:eye" className="w-4 h-4 mr-2" />
              View Original
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

      {/* Info Alert */}
      <Alert color="info" variant="soft">
        <Icon icon="heroicons:information-circle" className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-1">
            <div className="font-medium">Creating a duplicate parcel</div>
            <div>
              A new parcel will be created with the same details as the
              original. You can modify any information before creating the
              duplicate.
            </div>
          </div>
        </AlertDescription>
      </Alert>

      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Original Parcel Info */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon icon="heroicons:document" className="w-5 h-5" />
                  Original Parcel
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm text-muted-foreground">Code</div>
                  <div className="font-mono font-medium">
                    {currentParcel.code}
                  </div>
                </div>

                <Separator />

                <div>
                  <div className="text-sm text-muted-foreground">Status</div>
                  <div className="mt-1">
                    <ParcelStatusBadge
                      status={currentParcel.parcelStatusCode}
                    />
                  </div>
                </div>

                <div>
                  <div className="text-sm text-muted-foreground">Created</div>
                  <div className="text-sm">
                    {formatDate(currentParcel.createdAt)}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-muted-foreground">Amount</div>
                  <div className="font-medium">{currentParcel.price} DH</div>
                </div>

                <Separator />

                <div>
                  <div className="text-sm text-muted-foreground">Route</div>
                  <div className="text-sm">
                    <div>{currentParcel.pickupCity?.name}</div>
                    <Icon
                      icon="heroicons:arrow-down"
                      className="w-3 h-3 mx-auto my-1 text-gray-400"
                    />
                    <div>{currentParcel.destinationCity?.name}</div>
                  </div>
                </div>

                <Separator />

                <div>
                  <div className="text-sm text-muted-foreground">Recipient</div>
                  <div className="text-sm font-medium">
                    {currentParcel.recipientName}
                  </div>
                  <div className="text-xs text-gray-500">
                    {currentParcel.recipientPhone}
                  </div>
                </div>

                {currentParcel.productName && (
                  <div>
                    <div className="text-sm text-muted-foreground">Product</div>
                    <div className="text-sm">{currentParcel.productName}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recipient Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon icon="heroicons:user" className="w-5 h-5" />
                  Recipient Information
                  <Badge color="primary" className="text-xs">
                    Editable
                  </Badge>
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
                    <Label htmlFor="alternativePhone">Alternative Phone</Label>
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

            {/* Route Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon icon="heroicons:map" className="w-5 h-5" />
                  Route Selection
                  <Badge color="primary" className="text-xs">
                    Editable
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Pickup City */}
                  <div className="space-y-2">
                    <Label
                      className={cn("", {
                        "text-destructive": errors.pickupCityId,
                      })}
                    >
                      Pickup City *
                    </Label>
                    <Select
                      value={watchedPickupCity}
                      onValueChange={(value) => setValue("pickupCityId", value)}
                    >
                      <SelectTrigger
                        className={cn("", {
                          "border-destructive": errors.pickupCityId,
                        })}
                      >
                        <SelectValue placeholder="Select pickup city" />
                      </SelectTrigger>
                      <SelectContent>
                        {pickupCities.map((city) => (
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
                    {errors.pickupCityId && (
                      <p className="text-xs text-destructive">
                        {errors.pickupCityId.message}
                      </p>
                    )}
                  </div>

                  {/* Destination City */}
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

                {/* Route Preview */}
                {watchedPickupCity && watchedDestinationCity && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-700">
                      <Icon icon="heroicons:map-pin" className="w-4 h-4" />
                      <span className="font-medium">{getPickupCityName()}</span>
                      <Icon icon="heroicons:arrow-right" className="w-4 h-4" />
                      <span className="font-medium">
                        {getDestinationCityName()}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Parcel Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon icon="heroicons:cube" className="w-5 h-5" />
                  Parcel Details
                  <Badge color="primary" className="text-xs">
                    Editable
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Tracking Code */}
                  <div className="space-y-2">
                    <Label htmlFor="trackingCode">
                      New Tracking Code
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Icon
                              icon="heroicons:information-circle"
                              className="w-4 h-4 ml-1 text-muted-foreground"
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              Enter a new tracking code for the duplicate parcel
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </Label>
                    <Input
                      id="trackingCode"
                      {...register("trackingCode")}
                      placeholder="TRACK124"
                    />
                    <p className="text-xs text-muted-foreground">
                      Leave empty to auto-generate
                    </p>
                  </div>

                  {/* Product Name */}
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
                  {/* Quantity */}
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

                  {/* Price */}
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

                {/* Comment */}
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
                  <Badge color="primary" className="text-xs">
                    Editable
                  </Badge>
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
          <div className="lg:col-span-1 space-y-6">
            {/* Cost Estimation */}
            {estimatedCost && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon icon="heroicons:calculator" className="w-5 h-5" />
                    Cost Estimation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Delivery Fee:</span>
                      <span className="font-medium">
                        {estimatedCost.deliveryPrice} DH
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Return Fee:</span>
                      <span className="font-medium">
                        {estimatedCost.returnPrice} DH
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Refusal Fee:</span>
                      <span className="font-medium">
                        {estimatedCost.refusalPrice} DH
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-sm">Delivery Time:</span>
                      <span className="font-medium">
                        {estimatedCost.deliveryDelay} days
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Comparison */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon icon="heroicons:scale" className="w-5 h-5" />
                  Changes Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm">
                  <div className="text-muted-foreground">Original Code:</div>
                  <div className="font-mono text-xs">{currentParcel.code}</div>
                </div>
                <div className="text-sm">
                  <div className="text-muted-foreground">New Status:</div>
                  <div className="mt-1">
                    <Badge color="primary">Nouveau Colis</Badge>
                  </div>
                </div>
                <div className="text-sm">
                  <div className="text-muted-foreground">Action:</div>
                  <div>Creating duplicate parcel</div>
                </div>
              </CardContent>
            </Card>

            {/* User Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon icon="heroicons:user-circle" className="w-5 h-5" />
                  Created By
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm">
                  <span className="text-muted-foreground">User:</span>
                  <div className="font-medium">{user?.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {user?.email}
                  </div>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">User Type:</span>
                  <div className="font-medium">{user?.userType}</div>
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
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => reset()}
                >
                  <Icon icon="heroicons:arrow-path" className="w-4 h-4 mr-2" />
                  Reset to Original
                </Button>

                <Link href={`/parcels/${parcelId}/history`}>
                  <Button variant="outline" className="w-full justify-start">
                    <Icon icon="heroicons:clock" className="w-4 h-4 mr-2" />
                    View Original History
                  </Button>
                </Link>
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
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => reset()}
            disabled={isCreating}
          >
            Reset Changes
          </Button>
          <Button
            type="button"
            onClick={handleFormSubmit}
            disabled={isCreating || !isDirty}
          >
            {isCreating && (
              <Icon
                icon="heroicons:arrow-path"
                className="mr-2 h-4 w-4 animate-spin"
              />
            )}
            Create Duplicate Parcel
          </Button>
        </div>
      </div>
    </div>
  );
};

// Main component wrapped with ProtectedRoute
const DuplicateParcelPage = () => {
  return (
    <ProtectedRoute
      requiredPermissions={[PARCELS_PERMISSIONS.PARCELS_CREATE]}
      requiredAccessLevel="FULL"
      allowedAccountStatuses={["ACTIVE"]}
      requireValidation={true}
    >
      <DuplicateParcelPageContent />
    </ProtectedRoute>
  );
};

export default DuplicateParcelPage;
