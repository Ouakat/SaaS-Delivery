// components/orders/OrdersFilters.tsx
import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface OrdersFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterCity: string;
  onCityChange: (value: string) => void;
}

export function OrdersFilters({
  searchTerm,
  onSearchChange,
  filterCity,
  onCityChange,
}: OrdersFiltersProps) {
  return (
    <div className="flex items-center gap-3 flex-1">
      <div className="relative flex-1 max-w-sm">
        <Icon 
          icon="heroicons:magnifying-glass" 
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" 
        />
        <Input
          placeholder="Rechercher par code ou client..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
      <Select value={filterCity} onValueChange={onCityChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filtrer par ville" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Toutes les villes</SelectItem>
          <SelectItem value="Casablanca">Casablanca</SelectItem>
          <SelectItem value="Rabat">Rabat</SelectItem>
          <SelectItem value="Marrakech">Marrakech</SelectItem>
        </SelectContent>
      </Select>
      <Button variant="outline" size="sm">
        <Icon icon="heroicons:funnel" className="w-4 h-4 mr-2" />
        Plus de filtres
      </Button>
    </div>
  );
}