"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Icon } from "@iconify/react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { WarehouseFilters, WarehouseSortOptions } from "@/lib/types/warehouse.types";

interface WarehouseFiltersComponentProps {
  filters: WarehouseFilters;
  sort: WarehouseSortOptions;
  onFiltersChange: (filters: WarehouseFilters) => void;
  onSortChange: (sort: WarehouseSortOptions) => void;
  onReset: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function WarehouseFiltersComponent({
  filters,
  sort,
  onFiltersChange,
  onSortChange,
  onReset,
  isCollapsed = false,
  onToggleCollapse,
}: WarehouseFiltersComponentProps) {
  const [localFilters, setLocalFilters] = useState<WarehouseFilters>(filters);

  const handleFilterChange = (key: keyof WarehouseFilters, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleSortChange = (field: WarehouseSortOptions['field'], direction: WarehouseSortOptions['direction']) => {
    onSortChange({ field, direction });
  };

  const handleReset = () => {
    setLocalFilters({});
    onReset();
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== undefined && value !== null && value !== ''
  );

  return (
    <Card>
      <Collapsible open={!isCollapsed} onOpenChange={onToggleCollapse}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Icon icon="heroicons:funnel" className="h-5 w-5" />
                Filters & Sorting
                {hasActiveFilters && (
                  <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">
                    Active
                  </span>
                )}
              </CardTitle>
              <Icon 
                icon={isCollapsed ? "heroicons:chevron-down" : "heroicons:chevron-up"} 
                className="h-4 w-4" 
              />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <Input
                  id="search"
                  placeholder="Search warehouses..."
                  value={localFilters.search || ''}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </div>

              {/* Has Stocks Filter */}
              <div className="space-y-2">
                <Label>Stock Status</Label>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasStocks"
                    checked={localFilters.hasStocks === true}
                    onCheckedChange={(checked) => 
                      handleFilterChange('hasStocks', checked ? true : undefined)
                    }
                  />
                  <Label htmlFor="hasStocks" className="text-sm">
                    Has Stock Items
                  </Label>
                </div>
              </div>

              {/* Stock Level Filter */}
              <div className="space-y-2">
                <Label htmlFor="stockStatus">Stock Level</Label>
                <Select
                  value={localFilters.stockStatus || undefined}
                  onValueChange={(value) => 
                    handleFilterChange('stockStatus', value === 'all' ? undefined : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All levels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All levels</SelectItem>
                    <SelectItem value="high_stock">High Stock (100+)</SelectItem>
                    <SelectItem value="low_stock">Low Stock (1-100)</SelectItem>
                    <SelectItem value="no_stock">No Stock (0)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort Options */}
              <div className="space-y-2">
                <Label htmlFor="sort">Sort By</Label>
                <div className="flex gap-2">
                  <Select
                    value={sort.field}
                    onValueChange={(value) => 
                      handleSortChange(value as WarehouseSortOptions['field'], sort.direction)
                    }
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="location">Location</SelectItem>
                      <SelectItem value="createdAt">Created Date</SelectItem>
                      <SelectItem value="updatedAt">Updated Date</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => 
                      handleSortChange(sort.field, sort.direction === 'asc' ? 'desc' : 'asc')
                    }
                  >
                    <Icon 
                      icon={sort.direction === 'asc' ? "heroicons:arrow-up" : "heroicons:arrow-down"} 
                      className="h-4 w-4" 
                    />
                  </Button>
                </div>
              </div>
            </div>

            {/* Filter Actions */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                {hasActiveFilters ? 'Filters applied' : 'No filters applied'}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleReset}>
                  <Icon icon="heroicons:arrow-path" className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
