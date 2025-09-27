"use client";

import React, { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCitiesStore } from "@/lib/stores/parcels/cities.store";
import { cn } from "@/lib/utils/ui.utils";

export default function CitiesStats() {
  const { cities, zoneStats, isLoading, fetchZoneStats } = useCitiesStore();

  useEffect(() => {
    fetchZoneStats();
  }, [fetchZoneStats]);

  // Calculate statistics from cities data
  const stats = React.useMemo(() => {
    if (!cities.length) {
      return {
        total: 0,
        active: 0,
        inactive: 0,
        pickupCities: 0,
        nonPickupCities: 0,
        byZone: {},
      };
    }

    const total = cities.length;
    const active = cities.filter((city) => city.status).length;
    const inactive = total - active;
    const pickupCities = cities.filter((city) => city.pickupCity).length;
    const nonPickupCities = total - pickupCities;

    // Group by zone
    const byZone = cities.reduce((acc, city) => {
      acc[city.zone] = (acc[city.zone] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      active,
      inactive,
      pickupCities,
      nonPickupCities,
      byZone,
    };
  }, [cities]);

  const getZoneColor = (zone: string) => {
    switch (zone) {
      case "Zone A":
        return "bg-blue-500";
      case "Zone B":
        return "bg-green-500";
      case "Zone C":
        return "bg-yellow-500";
      case "Zone D":
        return "bg-purple-500";
      default:
        return "bg-gray-500";
    }
  };

  const getZoneTextColor = (zone: string) => {
    switch (zone) {
      case "Zone A":
        return "text-blue-700";
      case "Zone B":
        return "text-green-700";
      case "Zone C":
        return "text-yellow-700";
      case "Zone D":
        return "text-purple-700";
      default:
        return "text-gray-700";
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Cities */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Cities
                </p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Icon
                  icon="heroicons:map-pin"
                  className="h-4 w-4 text-blue-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Cities */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Active Cities
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.active}
                </p>
                {stats.total > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {Math.round((stats.active / stats.total) * 100)}% of total
                  </p>
                )}
              </div>
              <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center">
                <Icon
                  icon="heroicons:check-circle"
                  className="h-4 w-4 text-green-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inactive Cities */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Inactive Cities
                </p>
                <p className="text-2xl font-bold text-gray-600">
                  {stats.inactive}
                </p>
                {stats.total > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {Math.round((stats.inactive / stats.total) * 100)}% of total
                  </p>
                )}
              </div>
              <div className="h-8 w-8 rounded-full bg-gray-500/10 flex items-center justify-center">
                <Icon
                  icon="heroicons:pause-circle"
                  className="h-4 w-4 text-gray-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pickup Cities */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Pickup Cities
                </p>
                <p className="text-2xl font-bold text-orange-600">
                  {stats.pickupCities}
                </p>
                {stats.total > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {Math.round((stats.pickupCities / stats.total) * 100)}% of
                    total
                  </p>
                )}
              </div>
              <div className="h-8 w-8 rounded-full bg-orange-500/10 flex items-center justify-center">
                <Icon
                  icon="heroicons:truck"
                  className="h-4 w-4 text-orange-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Zone Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon icon="heroicons:chart-pie" className="w-5 h-5" />
            Zone Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(stats.byZone).length > 0 ? (
            <div className="space-y-4">
              {/* Zone Bars */}
              <div className="space-y-3">
                {Object.entries(stats.byZone)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([zone, count]) => {
                    const percentage =
                      stats.total > 0 ? (count / stats.total) * 100 : 0;

                    return (
                      <div key={zone} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                "w-3 h-3 rounded-full",
                                getZoneColor(zone)
                              )}
                            />
                            <span className="font-medium">{zone}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "font-medium",
                                getZoneTextColor(zone)
                              )}
                            >
                              {count} cities
                            </span>
                            <Badge color="secondary" className="text-xs">
                              {percentage.toFixed(1)}%
                            </Badge>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={cn(
                              "h-2 rounded-full transition-all duration-300",
                              getZoneColor(zone)
                            )}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Zone Summary */}
              <div className="pt-4 border-t">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(stats.byZone)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([zone, count]) => (
                      <TooltipProvider key={zone}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="text-center p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors cursor-default">
                              <div
                                className={cn(
                                  "w-4 h-4 rounded-full mx-auto mb-2",
                                  getZoneColor(zone)
                                )}
                              />
                              <p className="text-sm font-medium">{zone}</p>
                              <p className="text-lg font-bold">{count}</p>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              {count} cities in {zone}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Icon
                icon="heroicons:chart-pie"
                className="w-12 h-12 mx-auto mb-4 opacity-50"
              />
              <p>No cities data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Status Ratio */}
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-4 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-sm">Active</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-400" />
                  <span className="text-sm">Inactive</span>
                </div>
              </div>
              <div className="flex h-2 rounded-full overflow-hidden bg-gray-200">
                <div
                  className="bg-green-500 transition-all duration-300"
                  style={{
                    width: `${
                      stats.total > 0 ? (stats.active / stats.total) * 100 : 0
                    }%`,
                  }}
                />
                <div
                  className="bg-gray-400 transition-all duration-300"
                  style={{
                    width: `${
                      stats.total > 0 ? (stats.inactive / stats.total) * 100 : 0
                    }%`,
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {stats.active} active, {stats.inactive} inactive
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Pickup Ratio */}
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-4 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500" />
                  <span className="text-sm">Pickup</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-400" />
                  <span className="text-sm">Regular</span>
                </div>
              </div>
              <div className="flex h-2 rounded-full overflow-hidden bg-gray-200">
                <div
                  className="bg-orange-500 transition-all duration-300"
                  style={{
                    width: `${
                      stats.total > 0
                        ? (stats.pickupCities / stats.total) * 100
                        : 0
                    }%`,
                  }}
                />
                <div
                  className="bg-blue-400 transition-all duration-300"
                  style={{
                    width: `${
                      stats.total > 0
                        ? (stats.nonPickupCities / stats.total) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {stats.pickupCities} pickup, {stats.nonPickupCities} regular
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Total Coverage */}
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">
                Total Coverage
              </p>
              <p className="text-3xl font-bold text-blue-600">
                {Object.keys(stats.byZone).length}
              </p>
              <p className="text-xs text-muted-foreground">
                {Object.keys(stats.byZone).length === 1 ? "Zone" : "Zones"}{" "}
                covered
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
