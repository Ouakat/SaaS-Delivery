"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { useTariffsStore } from "@/lib/stores/tariffs.store";
import { useCitiesStore } from "@/lib/stores/cities.store";
import type { TariffCalculationResult } from "@/lib/types/settings/tariffs.types";

const TariffCalculator = () => {
  const [pickupCityId, setPickupCityId] = useState<string>("");
  const [destinationCityId, setDestinationCityId] = useState<string>("");

  const {
    calculateTariff,
    calculationResult,
    clearCalculationResult,
    isLoading,
  } = useTariffsStore();

  const { cities, fetchCities } = useCitiesStore();

  useEffect(() => {
    fetchCities();
    return () => {
      clearCalculationResult();
    };
  }, [fetchCities, clearCalculationResult]);

  const handleCalculate = async () => {
    if (pickupCityId && destinationCityId) {
      await calculateTariff({
        pickupCityId,
        destinationCityId,
      });
    }
  };

  const handleReset = () => {
    setPickupCityId("");
    setDestinationCityId("");
    clearCalculationResult();
  };

  const availablePickupCities = cities.filter((city) => city.pickupCity);
  const availableDestinationCities = cities.filter(
    (city) => city.id !== pickupCityId
  );

  const formatPrice = (price: number) => `$${price.toFixed(2)}`;

  const getDelayBadgeColor = (delay: number) => {
    if (delay <= 1) return "bg-green-100 text-green-800";
    if (delay <= 3) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  return (
    <div className="space-y-6">
      {/* Route Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">From (Pickup City)</label>
          <Select value={pickupCityId} onValueChange={setPickupCityId}>
            <SelectTrigger>
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
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">To (Destination City)</label>
          <Select
            value={destinationCityId}
            onValueChange={setDestinationCityId}
            disabled={!pickupCityId}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={
                  pickupCityId
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
        </div>
      </div>

      {/* Route Preview */}
      {pickupCityId && destinationCityId && (
        <div className="flex items-center justify-center p-4 bg-muted rounded-lg">
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
                <Icon
                  icon="heroicons:building-office"
                  className="w-6 h-6 text-green-600"
                />
              </div>
              <div className="text-sm font-medium">
                {cities.find((c) => c.id === pickupCityId)?.name}
              </div>
            </div>

            <Icon
              icon="heroicons:arrow-right"
              className="w-6 h-6 text-primary"
            />

            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                <Icon
                  icon="heroicons:map-pin"
                  className="w-6 h-6 text-blue-600"
                />
              </div>
              <div className="text-sm font-medium">
                {cities.find((c) => c.id === destinationCityId)?.name}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-4">
        <Button
          onClick={handleCalculate}
          disabled={!pickupCityId || !destinationCityId || isLoading}
          className="flex-1"
        >
          {isLoading && (
            <Icon
              icon="heroicons:arrow-path"
              className="mr-2 h-4 w-4 animate-spin"
            />
          )}
          Calculate Tariff
        </Button>

        <Button variant="outline" onClick={handleReset} disabled={isLoading}>
          <Icon icon="heroicons:arrow-path" className="w-4 h-4 mr-2" />
          Reset
        </Button>
      </div>

      {/* Calculation Result */}
      {calculationResult && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-6">
              {/* Header */}
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Tariff Details</h3>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <span>{calculationResult.pickupCity}</span>
                  <Icon icon="heroicons:arrow-right" className="w-4 h-4" />
                  <span>{calculationResult.destinationCity}</span>
                  <Badge
                    className={getDelayBadgeColor(
                      calculationResult.deliveryDelay
                    )}
                  >
                    {calculationResult.deliveryDelay} day
                    {calculationResult.deliveryDelay > 1 ? "s" : ""}
                  </Badge>
                </div>
              </div>

              {/* Pricing Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                  <Icon
                    icon="heroicons:check-circle"
                    className="w-8 h-8 text-green-600 mx-auto mb-2"
                  />
                  <div className="text-2xl font-bold text-green-700 mb-1">
                    {formatPrice(calculationResult.deliveryPrice)}
                  </div>
                  <div className="text-sm font-medium text-green-600">
                    Delivery Price
                  </div>
                  <div className="text-xs text-green-600 mt-1">
                    Successful delivery
                  </div>
                </div>

                <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <Icon
                    icon="heroicons:arrow-uturn-left"
                    className="w-8 h-8 text-orange-600 mx-auto mb-2"
                  />
                  <div className="text-2xl font-bold text-orange-700 mb-1">
                    {formatPrice(calculationResult.returnPrice)}
                  </div>
                  <div className="text-sm font-medium text-orange-600">
                    Return Price
                  </div>
                  <div className="text-xs text-orange-600 mt-1">
                    Package returned
                  </div>
                </div>

                <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                  <Icon
                    icon="heroicons:x-circle"
                    className="w-8 h-8 text-red-600 mx-auto mb-2"
                  />
                  <div className="text-2xl font-bold text-red-700 mb-1">
                    {formatPrice(calculationResult.refusalPrice)}
                  </div>
                  <div className="text-sm font-medium text-red-600">
                    Refusal Price
                  </div>
                  <div className="text-xs text-red-600 mt-1">
                    Package refused
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Tariff Found */}
      {!calculationResult &&
        !isLoading &&
        pickupCityId &&
        destinationCityId && (
          <Alert color="warning">
            <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
            <AlertDescription>
              No tariff configuration found for this route. Please configure a
              tariff first.
            </AlertDescription>
          </Alert>
        )}

      {/* Help Text */}
      <div className="text-center text-sm text-muted-foreground">
        Select pickup and destination cities to calculate shipping costs for
        this route.
      </div>
    </div>
  );
};

export default TariffCalculator;
