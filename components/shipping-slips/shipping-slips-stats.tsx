"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { ShippingSlipStats } from "@/lib/types/parcels/shipping-slips.types";

interface ShippingSlipsStatsProps {
  statistics: ShippingSlipStats;
}

export const ShippingSlipsStats: React.FC<ShippingSlipsStatsProps> = ({
  statistics,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Slips */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Slips</CardTitle>
          <Icon
            icon="heroicons:truck"
            className="h-4 w-4 text-muted-foreground"
          />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{statistics.total}</div>
          <div className="text-xs text-muted-foreground mt-1">
            <span className="text-blue-600">
              {statistics.inTransit} in transit
            </span>
            {" • "}
            <span className="text-yellow-600">
              {statistics.pending} pending
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Completed Slips */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completed</CardTitle>
          <Icon
            icon="heroicons:check-circle"
            className="h-4 w-4 text-muted-foreground"
          />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{statistics.completed}</div>
          <div className="text-xs text-muted-foreground mt-1">
            Successfully received
          </div>
        </CardContent>
      </Card>

      {/* This Month */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">This Month</CardTitle>
          <Icon
            icon="heroicons:calendar"
            className="h-4 w-4 text-muted-foreground"
          />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {statistics.packagesShippedThisMonth}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Packages shipped
          </div>
        </CardContent>
      </Card>

      {/* Average */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average</CardTitle>
          <Icon
            icon="heroicons:chart-bar"
            className="h-4 w-4 text-muted-foreground"
          />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {statistics.averagePackagesPerSlip}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Packages per slip
          </div>
        </CardContent>
      </Card>

      {/* Top Destination Zones */}
      {statistics.topDestinationZones.length > 0 && (
        <Card className="md:col-span-2 lg:col-span-4">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Icon icon="heroicons:map-pin" className="h-4 w-4" />
              Top Destination Zones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {statistics.topDestinationZones.map((zone, index) => (
                <div
                  key={zone.zoneId}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <Badge color="primary" className="text-xs">
                      #{index + 1}
                    </Badge>
                    <span className="text-sm font-medium">{zone.zoneName}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">
                      {zone.count} slips
                    </span>
                    <Badge color="secondary" className="text-xs">
                      {zone.percentage.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
