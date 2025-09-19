import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import type { ZoneStatistics } from "@/lib/types/settings/zones.types";

interface ZoneStatsCardsProps {
  statistics: ZoneStatistics | null;
  loading?: boolean;
}

export default function ZoneStatsCards({
  statistics,
  loading = false,
}: ZoneStatsCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!statistics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-gray-200">
          <CardContent className="p-6 text-center">
            <Icon
              icon="heroicons:chart-bar"
              className="w-8 h-8 text-gray-400 mx-auto mb-2"
            />
            <p className="text-sm text-gray-600">Statistics not available</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statsCards = [
    {
      title: "Total Zones",
      value: statistics.total,
      icon: "heroicons:map",
      color: "blue",
      description: "All zones in system",
      trend: null,
    },
    {
      title: "Active Zones",
      value: statistics.active,
      icon: "heroicons:check-circle",
      color: "green",
      description: "Available for use",
      trend:
        statistics.total > 0
          ? Math.round((statistics.active / statistics.total) * 100)
          : 0,
    },
    {
      title: "Total Cities",
      value: statistics.totalCities,
      icon: "heroicons:building-office-2",
      color: "purple",
      description: "Cities assigned to zones",
      trend: null,
    },
    {
      title: "Average Cities",
      value: Math.round(statistics.averageCitiesPerZone * 10) / 10,
      icon: "heroicons:chart-bar",
      color: "orange",
      description: "Cities per zone",
      trend: null,
    },
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: {
        icon: "text-blue-600",
        bg: "bg-blue-100",
        badge: "bg-blue-50 text-blue-700",
      },
      green: {
        icon: "text-green-600",
        bg: "bg-green-100",
        badge: "bg-green-50 text-green-700",
      },
      purple: {
        icon: "text-purple-600",
        bg: "bg-purple-100",
        badge: "bg-purple-50 text-purple-700",
      },
      orange: {
        icon: "text-orange-600",
        bg: "bg-orange-100",
        badge: "bg-orange-50 text-orange-700",
      },
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="space-y-4">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat) => {
          const colors = getColorClasses(stat.color);

          return (
            <Card
              key={stat.title}
              className="hover:shadow-md transition-shadow"
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${colors.bg}`}>
                    <Icon
                      icon={stat.icon}
                      className={`w-5 h-5 ${colors.icon}`}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-gray-900">
                    {typeof stat.value === "number"
                      ? stat.value % 1 === 0
                        ? stat.value
                        : stat.value.toFixed(1)
                      : stat.value}
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-600">{stat.description}</p>
                    {stat.trend !== null && (
                      <Badge className={`text-xs ${colors.badge}`}>
                        {stat.trend}%
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Additional Zone Insights */}
      {(statistics.largestZone ||
        statistics.smallestZone ||
        statistics.zonesWithNoCities > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Largest Zone */}
          {statistics.largestZone && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Icon
                      icon="heroicons:trophy"
                      className="w-5 h-5 text-green-600"
                    />
                  </div>
                  <div>
                    <h4 className="font-medium text-green-900">Largest Zone</h4>
                    <p className="text-sm text-green-700">
                      <strong>{statistics.largestZone.name}</strong> with{" "}
                      <strong>{statistics.largestZone.cityCount}</strong> cities
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Smallest Zone */}
          {statistics.smallestZone && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Icon
                      icon="heroicons:arrow-trending-down"
                      className="w-5 h-5 text-blue-600"
                    />
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-900">Smallest Zone</h4>
                    <p className="text-sm text-blue-700">
                      <strong>{statistics.smallestZone.name}</strong> with{" "}
                      <strong>{statistics.smallestZone.cityCount}</strong>{" "}
                      {statistics.smallestZone.cityCount === 1
                        ? "city"
                        : "cities"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Zones with No Cities */}
          {statistics.zonesWithNoCities > 0 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Icon
                      icon="heroicons:exclamation-triangle"
                      className="w-5 h-5 text-orange-600"
                    />
                  </div>
                  <div>
                    <h4 className="font-medium text-orange-900">Empty Zones</h4>
                    <p className="text-sm text-orange-700">
                      <strong>{statistics.zonesWithNoCities}</strong> zone(s)
                      without cities
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Summary Insights */}
      <Card className="border-gray-200 bg-gray-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Icon
              icon="heroicons:lightbulb"
              className="w-5 h-5 text-gray-600 mt-0.5"
            />
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Zone Overview</h4>
              <div className="text-sm text-gray-700 space-y-1">
                <p>
                  You have <strong>{statistics.total}</strong> zone(s) with{" "}
                  <strong>{statistics.active}</strong> currently active.
                </p>
                <p>
                  A total of <strong>{statistics.totalCities}</strong> cities
                  are distributed across your zones, averaging{" "}
                  <strong>{statistics.averageCitiesPerZone.toFixed(1)}</strong>{" "}
                  cities per zone.
                </p>
                {statistics.zonesWithNoCities > 0 && (
                  <p className="text-orange-700">
                    <strong>Note:</strong> {statistics.zonesWithNoCities}{" "}
                    zone(s) don't have any cities assigned and may need
                    attention.
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
