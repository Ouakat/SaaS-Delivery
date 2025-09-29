"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { DeliverySlipStats } from "@/lib/types/parcels/delivery-slips.types";

interface DeliverySlipsStatsProps {
  statistics: DeliverySlipStats;
}

export const DeliverySlipsStats: React.FC<DeliverySlipsStatsProps> = ({
  statistics,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Slips */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Slips</CardTitle>
          <Icon
            icon="heroicons:document-text"
            className="h-4 w-4 text-muted-foreground"
          />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{statistics.totalSlips}</div>
          <div className="text-xs text-muted-foreground mt-1">
            <span className="text-green-600">
              {statistics.receivedSlips} received
            </span>
            {" • "}
            <span className="text-yellow-600">
              {statistics.pendingSlips} pending
            </span>
            {statistics.cancelledSlips > 0 && (
              <>
                {" • "}
                <span className="text-red-600">
                  {statistics.cancelledSlips} cancelled
                </span>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Total Parcels */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Parcels</CardTitle>
          <Icon
            icon="heroicons:cube"
            className="h-4 w-4 text-muted-foreground"
          />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {statistics.totalParcelsInSlips}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Avg {statistics.averageParcelsPerSlip.toFixed(1)} per slip
          </div>
        </CardContent>
      </Card>

      {/* Total Value */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Value</CardTitle>
          <Icon
            icon="heroicons:banknotes"
            className="h-4 w-4 text-muted-foreground"
          />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {statistics.totalValueInSlips.toLocaleString()} DH
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            All delivery slips
          </div>
        </CardContent>
      </Card>

      {/* Processing Rate */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Processing Rate</CardTitle>
          <Icon
            icon="heroicons:chart-bar"
            className="h-4 w-4 text-muted-foreground"
          />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {statistics.totalSlips > 0
              ? Math.round(
                  (statistics.receivedSlips / statistics.totalSlips) * 100
                )
              : 0}
            %
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Slips received
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity Chart */}
      {statistics.recentActivity.length > 0 && (
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Icon icon="heroicons:chart-line" className="h-4 w-4" />
              Recent Activity (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {statistics.recentActivity.slice(0, 5).map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-1"
                >
                  <div className="text-sm">
                    {new Date(activity.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      <span>{activity.slipsCreated} created</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span>{activity.slipsReceived} received</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Cities */}
      {statistics.topCities.length > 0 && (
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Icon icon="heroicons:map-pin" className="h-4 w-4" />
              Top Cities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {statistics.topCities.slice(0, 5).map((city, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-1"
                >
                  <div className="flex items-center gap-2">
                    <Badge color="primary" className="text-xs">
                      #{index + 1}
                    </Badge>
                    <span className="text-sm">{city.cityName}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {city.slipCount} slips • {city.parcelCount} parcels
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
