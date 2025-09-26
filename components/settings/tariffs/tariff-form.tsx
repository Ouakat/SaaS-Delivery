"use client";
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Icon } from "@/components/ui/icon";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTariffsStore } from "@/lib/stores/parcels/tariffs.store";
import type {
  CreateTariffRequest,
  Tariff,
} from "@/lib/types/parcels/tariffs.types";
import type { City } from "@/lib/types/parcels/cities.types";
import { cn } from "@/lib/utils/ui.utils";

const tariffSchema = z
  .object({
    pickupCityId: z.string().min(1, "Please select a pickup city"),
    destinationCityId: z.string().min(1, "Please select a destination city"),
    deliveryPrice: z.number().min(0, "Delivery price must be positive"),
    returnPrice: z.number().min(0, "Return price must be positive"),
    refusalPrice: z.number().min(0, "Refusal price must be positive"),
    deliveryDelay: z
      .number()
      .int()
      .min(1, "Delivery delay must be at least 1 day"),
  })
  .refine((data) => data.pickupCityId !== data.destinationCityId, {
    message: "Pickup and destination cities must be different",
    path: ["destinationCityId"],
  });

type TariffFormData = z.infer<typeof tariffSchema>;

interface TariffFormProps {
  onSubmit: (data: CreateTariffRequest) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  cities: City[];
  pickupCities?: City[];
  initialData?: Tariff;
  isEditing?: boolean;
}

const TariffForm = ({
  onSubmit,
  onCancel,
  isLoading = false,
  cities,
  pickupCities,
  initialData,
  isEditing = false,
}: TariffFormProps) => {
  const [routeValidationError, setRouteValidationError] = useState<
    string | null
  >(null);
  const [isValidatingRoute, setIsValidatingRoute] = useState(false);

  const { validateRoute } = useTariffsStore();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
    reset,
  } = useForm<TariffFormData>({
    resolver: zodResolver(tariffSchema),
    defaultValues: initialData
      ? {
          pickupCityId: initialData.pickupCityId,
          destinationCityId: initialData.destinationCityId,
          deliveryPrice: initialData.deliveryPrice,
          returnPrice: initialData.returnPrice,
          refusalPrice: initialData.refusalPrice,
          deliveryDelay: initialData.deliveryDelay,
        }
      : {
          deliveryPrice: 25,
          returnPrice: 20,
          refusalPrice: 15,
          deliveryDelay: 2,
        },
  });

  const watchedPickupCity = watch("pickupCityId");
  const watchedDestinationCity = watch("destinationCityId");

  // Validate route when both cities are selected
  useEffect(() => {
    const validateRouteAsync = async () => {
      if (
        watchedPickupCity &&
        watchedDestinationCity &&
        watchedPickupCity !== watchedDestinationCity
      ) {
        setIsValidatingRoute(true);
        setRouteValidationError(null);

        try {
          const isValid = await validateRoute(
            watchedPickupCity,
            watchedDestinationCity,
            initialData?.id // Exclude current tariff when editing
          );

          if (!isValid) {
            setRouteValidationError("A tariff already exists for this route");
          }
        } catch (error) {
          console.error("Route validation error:", error);
        } finally {
          setIsValidatingRoute(false);
        }
      } else {
        setRouteValidationError(null);
      }
    };

    validateRouteAsync();
  }, [
    watchedPickupCity,
    watchedDestinationCity,
    validateRoute,
    initialData?.id,
  ]);

  const handleFormSubmit = async (data: TariffFormData) => {
    if (routeValidationError) {
      return;
    }

    try {
      await onSubmit(data);
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  const handleReset = () => {
    reset();
    setRouteValidationError(null);
  };

  // Get available pickup cities (use cities if pickupCities not provided)
  const availablePickupCities = pickupCities?.length
    ? pickupCities
    : cities.filter((city) => city.pickupCity);

  // Get available destination cities (filter out selected pickup city)
  const availableDestinationCities = cities.filter(
    (city) => city.id !== watchedPickupCity
  );

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Route Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label
            htmlFor="pickupCityId"
            className={cn("", { "text-destructive": errors.pickupCityId })}
          >
            Pickup City *
          </Label>
          <Select
            value={watchedPickupCity || ""}
            onValueChange={(value) =>
              setValue("pickupCityId", value, { shouldDirty: true })
            }
            disabled={isLoading}
          >
            <SelectTrigger
              className={cn("", { "border-destructive": errors.pickupCityId })}
            >
              <SelectValue placeholder="Select pickup city" />
            </SelectTrigger>
            <SelectContent>
              {availablePickupCities.map((city) => (
                <SelectItem key={city.id} value={city.id}>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{city.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({city.ref})
                    </span>
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

        <div className="space-y-2">
          <Label
            htmlFor="destinationCityId"
            className={cn("", { "text-destructive": errors.destinationCityId })}
          >
            Destination City *
          </Label>
          <Select
            value={watchedDestinationCity || ""}
            onValueChange={(value) =>
              setValue("destinationCityId", value, { shouldDirty: true })
            }
            disabled={isLoading || !watchedPickupCity}
          >
            <SelectTrigger
              className={cn("", {
                "border-destructive":
                  errors.destinationCityId || routeValidationError,
              })}
            >
              <SelectValue
                placeholder={
                  watchedPickupCity
                    ? "Select destination city"
                    : "Select pickup city first"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {availableDestinationCities.map((city) => (
                <SelectItem key={city.id} value={city.id}>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{city.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({city.ref})
                    </span>
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
          {isValidatingRoute && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Icon
                icon="heroicons:arrow-path"
                className="w-3 h-3 animate-spin"
              />
              Validating route...
            </div>
          )}
          {routeValidationError && (
            <p className="text-xs text-destructive">{routeValidationError}</p>
          )}
        </div>
      </div>

      {/* Route Preview */}
      {watchedPickupCity && watchedDestinationCity && (
        <Alert color="info">
          <Icon icon="heroicons:information-circle" className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center gap-2">
              <span>Route:</span>
              <div className="flex items-center gap-2 font-medium">
                <span>
                  {cities.find((c) => c.id === watchedPickupCity)?.name}
                </span>
                <Icon icon="heroicons:arrow-right" className="w-4 h-4" />
                <span>
                  {cities.find((c) => c.id === watchedDestinationCity)?.name}
                </span>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Pricing Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Pricing Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label
              htmlFor="deliveryPrice"
              className={cn("", { "text-destructive": errors.deliveryPrice })}
            >
              Delivery Price *
            </Label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                $
              </div>
              <Input
                id="deliveryPrice"
                type="number"
                step="0.01"
                min="0"
                {...register("deliveryPrice", {
                  valueAsNumber: true,
                })}
                className={cn("pl-8", {
                  "border-destructive": errors.deliveryPrice,
                })}
                placeholder="25.00"
                disabled={isLoading}
              />
            </div>
            {errors.deliveryPrice && (
              <p className="text-xs text-destructive">
                {errors.deliveryPrice.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Price charged for successful delivery
            </p>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="returnPrice"
              className={cn("", { "text-destructive": errors.returnPrice })}
            >
              Return Price *
            </Label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                $
              </div>
              <Input
                id="returnPrice"
                type="number"
                step="0.01"
                min="0"
                {...register("returnPrice", {
                  valueAsNumber: true,
                })}
                className={cn("pl-8", {
                  "border-destructive": errors.returnPrice,
                })}
                placeholder="20.00"
                disabled={isLoading}
              />
            </div>
            {errors.returnPrice && (
              <p className="text-xs text-destructive">
                {errors.returnPrice.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Price charged when package is returned
            </p>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="refusalPrice"
              className={cn("", { "text-destructive": errors.refusalPrice })}
            >
              Refusal Price *
            </Label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                $
              </div>
              <Input
                id="refusalPrice"
                type="number"
                step="0.01"
                min="0"
                {...register("refusalPrice", {
                  valueAsNumber: true,
                })}
                className={cn("pl-8", {
                  "border-destructive": errors.refusalPrice,
                })}
                placeholder="15.00"
                disabled={isLoading}
              />
            </div>
            {errors.refusalPrice && (
              <p className="text-xs text-destructive">
                {errors.refusalPrice.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Price charged when package is refused
            </p>
          </div>
        </div>
      </div>

      {/* Delivery Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Delivery Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label
              htmlFor="deliveryDelay"
              className={cn("", { "text-destructive": errors.deliveryDelay })}
            >
              Delivery Delay (Days) *
            </Label>
            <Input
              id="deliveryDelay"
              type="number"
              min="1"
              {...register("deliveryDelay", {
                valueAsNumber: true,
              })}
              className={cn("", { "border-destructive": errors.deliveryDelay })}
              placeholder="2"
              disabled={isLoading}
            />
            {errors.deliveryDelay && (
              <p className="text-xs text-destructive">
                {errors.deliveryDelay.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Expected delivery time in business days
            </p>
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-4 pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={handleReset}
          disabled={isLoading || !isDirty}
        >
          Reset
        </Button>

        <Button
          type="submit"
          disabled={isLoading || !!routeValidationError || isValidatingRoute}
        >
          {isLoading && (
            <Icon
              icon="heroicons:arrow-path"
              className="mr-2 h-4 w-4 animate-spin"
            />
          )}
          {isEditing ? "Update Tariff" : "Create Tariff"}
        </Button>
      </div>
    </form>
  );
};

export default TariffForm;
