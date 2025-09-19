"use client";
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";

interface SmsUsageStatsProps {
  totalSent: number;
  thisMonth: number;
  lastMonth: number;
  successRate: number;
  averageCost: number;
}

export const SmsUsageStats: React.FC<SmsUsageStatsProps> = ({
  totalSent,
  thisMonth,
  lastMonth,
  successRate,
  averageCost,
}) => {
  const formatNumber = (num: number) => new Intl.NumberFormat().format(num);
  const formatPercentage = (num: number) => `${num.toFixed(1)}%`;
  const formatCurrency = (num: number) => `$${num.toFixed(2)}`;

  const stats = [
    {
      label: "Total Sent",
      value: formatNumber(totalSent),
      icon: "heroicons:chart-bar-square",
      color: "text-blue-500",
    },
    {
      label: "This Month",
      value: formatNumber(thisMonth),
      icon: "heroicons:calendar-days",
      color: "text-green-500",
    },
    {
      label: "Last Month",
      value: formatNumber(lastMonth),
      icon: "heroicons:clock",
      color: "text-purple-500",
    },
    {
      label: "Success Rate",
      value: formatPercentage(successRate),
      icon: "heroicons:check-circle",
      color: "text-green-500",
    },
    {
      label: "Avg Cost",
      value: formatCurrency(averageCost),
      icon: "heroicons:currency-dollar",
      color: "text-orange-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </p>
                <p className="text-xl font-bold">{stat.value}</p>
              </div>
              <Icon icon={stat.icon} className={`w-6 h-6 ${stat.color}`} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
