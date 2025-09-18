"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { Progress } from "@/components/ui/progress";

interface TariffStatsProps {
  stats: {
    totalTariffs: number;
    averageDeliveryPrice: number;
    averageReturnPrice: number;
    averageRefusalPrice: number;
    averageDeliveryDelay: number;
    priceRanges: { range: string; count: number }[];
    delayDistribution: { delay: number; count: number }[];
    cityPairCoverage: {
      totalPossiblePairs: number;
      configuredPairs: number;
      coveragePercentage: number;
    };
  };
}

const TariffStats = ({ stats }: TariffStatsProps) => {
  const formatPrice = (price: number) => `$${price.toFixed(2)}`;

  const getCoverageColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-600";
    if (percentage >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const getDelayColor = (delay: number) => {
    if (delay <= 1) return "bg-green-100 text-green-800";
    if (delay <= 3) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Tariffs</p>
                <p className="text-2xl font-bold">{stats.totalTariffs}</p>
              </div>
              <Icon
                icon="heroicons:currency-dollar"
                className="w-8 h-8 text-primary"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Delivery</p>
                <p className="text-2xl font-bold">
                  {formatPrice(stats.averageDeliveryPrice)}
                </p>
              </div>
              <Icon icon="heroicons:truck" className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Delay</p>
                <p className="text-2xl font-bold">
                  {stats.averageDeliveryDelay.toFixed(1)} days
                </p>
              </div>
              <Icon
                icon="heroicons:clock"
                className="w-8 h-8 text-orange-600"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Coverage</p>
                <p
                  className={`text-2xl font-bold ${getCoverageColor(
                    stats.cityPairCoverage.coveragePercentage
                  )}`}
                >
                  {stats.cityPairCoverage.coveragePercentage.toFixed(1)}%
                </p>
              </div>
              <Icon icon="heroicons:map" className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Price Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon icon="heroicons:chart-bar" className="w-5 h-5" />
              Price Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="text-lg font-semibold text-green-700">
                    {formatPrice(stats.averageDeliveryPrice)}
                  </div>
                  <div className="text-xs text-green-600">Avg. Delivery</div>
                </div>
                <div className="p-3 bg-orange-50 rounded-lg">
                  <div className="text-lg font-semibold text-orange-700">
                    {formatPrice(stats.averageReturnPrice)}
                  </div>
                  <div className="text-xs text-orange-600">Avg. Return</div>
                </div>
                <div className="p-3 bg-red-50 rounded-lg">
                  <div className="text-lg font-semibold text-red-700">
                    {formatPrice(stats.averageRefusalPrice)}
                  </div>
                  <div className="text-xs text-red-600">Avg. Refusal</div>
                </div>
              </div>

              {/* Price Ranges */}
              {stats.priceRanges.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">
                    Price Range Distribution
                  </h4>
                  {stats.priceRanges.map((range, index) => {
                    const percentage = (range.count / stats.totalTariffs) * 100;
                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{range.range}</span>
                          <span>
                            {range.count} tariffs ({percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Delivery Delay Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon icon="heroicons:clock" className="w-5 h-5" />
              Delivery Delays
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">
                  {stats.averageDeliveryDelay.toFixed(1)} days
                </div>
                <div className="text-sm text-muted-foreground">
                  Average Delivery Time
                </div>
              </div>

              {/* Delay Distribution */}
              {stats.delayDistribution.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Delay Distribution</h4>
                  <div className="flex flex-wrap gap-2">
                    {stats.delayDistribution.map((item, index) => {
                      const percentage =
                        (item.count / stats.totalTariffs) * 100;
                      return (
                        <div key={index} className="text-center">
                          <Badge
                            className={`${getDelayColor(item.delay)} mb-1`}
                          >
                            {item.delay} day{item.delay > 1 ? "s" : ""}
                          </Badge>
                          <div className="text-xs text-muted-foreground">
                            {item.count} ({percentage.toFixed(0)}%)
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Coverage Analysis */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon icon="heroicons:map" className="w-5 h-5" />
              City Pair Coverage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Coverage Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {stats.cityPairCoverage.totalPossiblePairs}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total Possible Routes
                  </div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {stats.cityPairCoverage.configuredPairs}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Configured Routes
                  </div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div
                    className={`text-2xl font-bold ${getCoverageColor(
                      stats.cityPairCoverage.coveragePercentage
                    )}`}
                  >
                    {stats.cityPairCoverage.coveragePercentage.toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Coverage</div>
                </div>
              </div>

              {/* Coverage Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Route Coverage Progress</span>
                  <span>
                    {stats.cityPairCoverage.configuredPairs} /{" "}
                    {stats.cityPairCoverage.totalPossiblePairs}
                  </span>
                </div>
                <Progress
                  value={stats.cityPairCoverage.coveragePercentage}
                  className="h-3"
                />
              </div>

              {/* Coverage Status */}
              <div className="p-4 rounded-lg border-l-4 border-l-blue-500 bg-blue-50">
                <div className="font-medium text-blue-900">
                  Coverage Analysis
                </div>
                <div className="text-sm text-blue-700 mt-1">
                  {stats.cityPairCoverage.coveragePercentage >= 80
                    ? "Excellent coverage! Most city pairs have configured tariffs."
                    : stats.cityPairCoverage.coveragePercentage >= 50
                    ? "Good coverage, but some routes may still need tariff configuration."
                    : "Low coverage detected. Consider configuring more tariffs for better route coverage."}
                </div>
                <div className="text-sm text-blue-600 mt-2">
                  Missing:{" "}
                  {stats.cityPairCoverage.totalPossiblePairs -
                    stats.cityPairCoverage.configuredPairs}{" "}
                  routes
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon icon="heroicons:light-bulb" className="w-5 h-5" />
            Key Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium">Pricing Insights</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Icon
                    icon="heroicons:arrow-right"
                    className="w-4 h-4 text-muted-foreground mt-0.5"
                  />
                  <span>
                    Average delivery price is{" "}
                    {formatPrice(stats.averageDeliveryPrice)}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon
                    icon="heroicons:arrow-right"
                    className="w-4 h-4 text-muted-foreground mt-0.5"
                  />
                  <span>
                    Return pricing averages{" "}
                    {(
                      (stats.averageReturnPrice / stats.averageDeliveryPrice) *
                      100
                    ).toFixed(0)}
                    % of delivery price
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon
                    icon="heroicons:arrow-right"
                    className="w-4 h-4 text-muted-foreground mt-0.5"
                  />
                  <span>
                    Refusal pricing averages{" "}
                    {(
                      (stats.averageRefusalPrice / stats.averageDeliveryPrice) *
                      100
                    ).toFixed(0)}
                    % of delivery price
                  </span>
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-medium">Operational Insights</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Icon
                    icon="heroicons:arrow-right"
                    className="w-4 h-4 text-muted-foreground mt-0.5"
                  />
                  <span>
                    Average delivery time is{" "}
                    {stats.averageDeliveryDelay.toFixed(1)} days
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon
                    icon="heroicons:arrow-right"
                    className="w-4 h-4 text-muted-foreground mt-0.5"
                  />
                  <span>
                    {stats.cityPairCoverage.coveragePercentage.toFixed(1)}% of
                    possible routes are configured
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon
                    icon="heroicons:arrow-right"
                    className="w-4 h-4 text-muted-foreground mt-0.5"
                  />
                  <span>
                    {stats.cityPairCoverage.totalPossiblePairs -
                      stats.cityPairCoverage.configuredPairs}{" "}
                    routes still need configuration
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TariffStats;
