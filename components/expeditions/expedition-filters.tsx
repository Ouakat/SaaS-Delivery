"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Icon } from "@iconify/react";
import { format } from "date-fns";
import { cn } from "@/lib/utils/ui.utils";
import {
  ExpeditionFilters as FilterType,
  ExpeditionStatus,
  TransportMode,
  TRANSPORT_MODE_LABELS,
} from "@/lib/types/expedition.types";

interface ExpeditionFiltersProps {
  filters: FilterType;
  onFiltersChange: (filters: FilterType) => void;
}

export function ExpeditionFilters({
  filters,
  onFiltersChange,
}: ExpeditionFiltersProps) {
  const t = useTranslations("Expeditions");
  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value });
  };

  const handleStatusChange = (value: string) => {
    onFiltersChange({
      ...filters,
      status: value === "all" ? undefined : (value as ExpeditionStatus),
    });
  };

  const handleTransportModeChange = (value: string) => {
    onFiltersChange({
      ...filters,
      transportMode: value === "all" ? undefined : (value as TransportMode),
    });
  };

  const handleDateRangeChange = (type: "start" | "end", date: Date | undefined) => {
    if (!date) {
      onFiltersChange({ ...filters, dateRange: undefined });
      return;
    }

    const newDateRange = {
      start: type === "start" ? date : (filters.dateRange?.start || new Date()),
      end: type === "end" ? date : (filters.dateRange?.end || new Date()),
    };

    onFiltersChange({ ...filters, dateRange: newDateRange });
  };

  const handleArrivalDateRangeChange = (type: "start" | "end", date: Date | undefined) => {
    if (!date) {
      onFiltersChange({ ...filters, arrivalDateRange: undefined });
      return;
    }

    const newArrivalDateRange = {
      start: type === "start" ? date : (filters.arrivalDateRange?.start || new Date()),
      end: type === "end" ? date : (filters.arrivalDateRange?.end || new Date()),
    };

    onFiltersChange({ ...filters, arrivalDateRange: newArrivalDateRange });
  };

  const handleReset = () => {
    onFiltersChange({});
  };

  const statusOptions: { value: ExpeditionStatus | "all"; label: string }[] = [
    { value: "all", label: t("filters.status_all") },
    { value: "expedited", label: t("filters.status_expedited") },
    { value: "prepared", label: t("filters.status_prepared") },
    { value: "pointed", label: t("filters.status_pointed") },
    { value: "received", label: t("filters.status_received") },
    { value: "cancelled", label: t("filters.status_cancelled") },
  ];

  const transportModeOptions: { value: TransportMode | "all"; label: string }[] = [
    { value: "all", label: t("filters.transport_mode_all") },
    { value: "air", label: t("filters.transport_mode_air") },
    { value: "sea", label: t("filters.transport_mode_sea") },
    { value: "road", label: t("filters.transport_mode_road") },
    { value: "rail", label: t("filters.transport_mode_rail") },
    { value: "courier", label: t("filters.transport_mode_courier") },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <div className="space-y-2">
          <Label htmlFor="search">{t("filters.search")}</Label>
          <div className="relative">
            <Icon
              icon="heroicons:magnifying-glass"
              className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground"
            />
            <Input
              id="search"
              placeholder={t("filters.search_placeholder")}
              value={filters.search || ""}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">{t("filters.status")}</Label>
          <Select
            value={filters.status || "all"}
            onValueChange={handleStatusChange}
          >
            <SelectTrigger id="status">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="transportMode">{t("filters.transport_mode")}</Label>
          <Select
            value={filters.transportMode || "all"}
            onValueChange={handleTransportModeChange}
          >
            <SelectTrigger id="transportMode">
              <SelectValue placeholder="Select transport mode" />
            </SelectTrigger>
            <SelectContent>
              {transportModeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{t("filters.created_date_range")}</Label>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "flex-1 justify-start text-left font-normal",
                    !filters.dateRange?.start && "text-muted-foreground"
                  )}
                >
                  <Icon icon="heroicons:calendar" className="mr-2 h-4 w-4" />
                  {filters.dateRange?.start ? (
                    format(filters.dateRange.start, "MMM dd")
                  ) : (
                    t("filters.from")
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.dateRange?.start}
                  onSelect={(date) => handleDateRangeChange("start", date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "flex-1 justify-start text-left font-normal",
                    !filters.dateRange?.end && "text-muted-foreground"
                  )}
                >
                  <Icon icon="heroicons:calendar" className="mr-2 h-4 w-4" />
                  {filters.dateRange?.end ? (
                    format(filters.dateRange.end, "MMM dd")
                  ) : (
                    t("filters.to")
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.dateRange?.end}
                  onSelect={(date) => handleDateRangeChange("end", date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="space-y-2">
          <Label>{t("filters.arrival_date_range")}</Label>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "flex-1 justify-start text-left font-normal",
                    !filters.arrivalDateRange?.start && "text-muted-foreground"
                  )}
                >
                  <Icon icon="heroicons:calendar" className="mr-2 h-4 w-4" />
                  {filters.arrivalDateRange?.start ? (
                    format(filters.arrivalDateRange.start, "MMM dd")
                  ) : (
                    t("filters.from")
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.arrivalDateRange?.start}
                  onSelect={(date) => handleArrivalDateRangeChange("start", date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "flex-1 justify-start text-left font-normal",
                    !filters.arrivalDateRange?.end && "text-muted-foreground"
                  )}
                >
                  <Icon icon="heroicons:calendar" className="mr-2 h-4 w-4" />
                  {filters.arrivalDateRange?.end ? (
                    format(filters.arrivalDateRange.end, "MMM dd")
                  ) : (
                    t("filters.to")
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.arrivalDateRange?.end}
                  onSelect={(date) => handleArrivalDateRangeChange("end", date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={handleReset}
          className="text-xs"
        >
          <Icon icon="heroicons:x-mark" className="h-3 w-3 mr-1" />
          {t("filters.clear_filters")}
        </Button>
      </div>
    </div>
  );
}