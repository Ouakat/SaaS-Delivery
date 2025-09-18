"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import type { PickupCityStatistics } from "@/lib/types/settings/pickup-cities.types";
import { cn } from "@/lib/utils/ui.utils";

interface PickupCityStatsCardsProps {
  statistics: PickupCityStatistics | null;
  isLoading: boolean;
}

const StatCard: React.FC<{
  title: string;
  value: number | string;
  subtitle?: string;
  icon: string;
  color: "blue" | "green" | "orange" | "red" | "purple";
  loading?: boolean;
}> = ({ title, value, subtitle, icon, color, loading }) => {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    green: "bg-green-50 text-green-700 border-green-200",
    orange: "bg-orange-50 text-orange-700 border-orange-200",
    red: "bg-red-50 text-red-700 border-red-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
  };

  const iconColorClasses = {
    blue: "text-blue-600",
    green: "text-green-600",
    orange: "text-orange-600",
    red: "text-red-600",
    purple: "text-purple-600",
  };

  if (loading) {
    return (
      <Card className="border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            <div className="w-24 h-4 bg-gray-200 rounded animate-pulse" />
          </CardTitle>
          <div className="w-5 h-5 bg-gray-200 rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="w-16 h-8 bg-gray-200 rounded animate-pulse mb-1" />
          <div className="w-20 h-3 bg-gray-200 rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("border", colorClasses[color])}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon icon={icon} className={cn("w-5 h-5", iconColorClasses[color])} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
};

const PickupCityStatsCards: React.FC<PickupCityStatsCardsProps> = ({
  statistics,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <StatCard
            key={index}
            title=""
            value=""
            icon=""
            color="blue"
            loading
          />
        ))}
      </div>
    );
  }

  if (!statistics) {
    return null;
  }

  const activePercentage =
    statistics.total > 0
      ? Math.round((statistics.active / statistics.total) * 100)
      : 0;

  const withTariffsPercentage =
    statistics.total > 0
      ? Math.round((statistics.withTariffs / statistics.total) * 100)
      : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      <StatCard
        title="Total Pickup Cities"
        value={statistics.total}
        subtitle="All pickup locations"
        icon="heroicons:building-office"
        color="blue"
      />

      <StatCard
        title="Active Cities"
        value={statistics.active}
        subtitle={`${activePercentage}% of total`}
        icon="heroicons:check-circle"
        color="green"
      />

      <StatCard
        title="Inactive Cities"
        value={statistics.inactive}
        subtitle={`${100 - activePercentage}% of total`}
        icon="heroicons:x-circle"
        color="orange"
      />

      <StatCard
        title="With Tariffs"
        value={statistics.withTariffs}
        subtitle={`${withTariffsPercentage}% configured`}
        icon="heroicons:currency-dollar"
        color="purple"
      />

      <StatCard
        title="Without Tariffs"
        value={statistics.withoutTariffs}
        subtitle={`${100 - withTariffsPercentage}% need setup`}
        icon="heroicons:exclamation-triangle"
        color="red"
      />
    </div>
  );
};

export default PickupCityStatsCards;
