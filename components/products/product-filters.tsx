"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@iconify/react";
import { ProductFilters, ProductSortOptions } from "@/lib/types/product.types";

interface ProductFiltersProps {
  filters: ProductFilters;
  sort: ProductSortOptions;
  onFiltersChange: (filters: ProductFilters) => void;
  onSortChange: (sort: ProductSortOptions) => void;
  onReset: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function ProductFiltersComponent({
  filters,
  sort,
  onFiltersChange,
  onSortChange,
  onReset,
  isCollapsed = false,
  onToggleCollapse,
}: ProductFiltersProps) {
  const [localFilters, setLocalFilters] = useState<ProductFilters>(filters);

  const handleFilterChange = (key: keyof ProductFilters, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handlePriceChange = (type: 'min' | 'max', value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value);
    if (type === 'min') {
      handleFilterChange('priceMin', numValue);
    } else {
      handleFilterChange('priceMax', numValue);
    }
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.hasVariants !== undefined) count++;
    if (filters.priceMin !== undefined) count++;
    if (filters.priceMax !== undefined) count++;
    if (filters.stockStatus !== undefined) count++;
    if (filters.search && filters.search.trim() !== '') count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  if (isCollapsed) {
    return (
      <div className="flex items-center gap-2 mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleCollapse}
          className="flex items-center gap-2"
        >
          <Icon icon="heroicons:funnel" className="h-4 w-4" />
          Filters
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
        
        <Select
          value={`${sort.field}-${sort.direction}`}
          onValueChange={(value) => {
            const [field, direction] = value.split('-') as [ProductSortOptions['field'], ProductSortOptions['direction']];
            onSortChange({ field, direction });
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name-asc">Name (A-Z)</SelectItem>
            <SelectItem value="name-desc">Name (Z-A)</SelectItem>
            <SelectItem value="basePrice-asc">Price (Low to High)</SelectItem>
            <SelectItem value="basePrice-desc">Price (High to Low)</SelectItem>
            <SelectItem value="createdAt-desc">Newest First</SelectItem>
            <SelectItem value="createdAt-asc">Oldest First</SelectItem>
            <SelectItem value="updatedAt-desc">Recently Updated</SelectItem>
          </SelectContent>
        </Select>

        {activeFiltersCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onReset}>
            <Icon icon="heroicons:x-mark" className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Icon icon="heroicons:funnel" className="h-5 w-5" />
            Filters & Sorting
            {activeFiltersCount > 0 && (
              <Badge variant="secondary">
                {activeFiltersCount} active
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onReset}>
              <Icon icon="heroicons:arrow-path" className="h-4 w-4 mr-1" />
              Reset
            </Button>
            {onToggleCollapse && (
              <Button variant="ghost" size="sm" onClick={onToggleCollapse}>
                <Icon icon="heroicons:chevron-up" className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Search */}
        <div className="space-y-2">
          <Label htmlFor="search">Search Products</Label>
          <div className="relative">
            <Icon
              icon="heroicons:magnifying-glass"
              className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground"
            />
            <Input
              id="search"
              placeholder="Search by product name..."
              value={localFilters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Has Variants Filter */}
          <div className="space-y-2">
            <Label>Product Type</Label>
            <Select
              value={localFilters.hasVariants === undefined ? 'all' : localFilters.hasVariants.toString()}
              onValueChange={(value) => {
                const hasVariants = value === 'all' ? undefined : value === 'true';
                handleFilterChange('hasVariants', hasVariants);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                <SelectItem value="true">With Variants</SelectItem>
                <SelectItem value="false">Simple Products</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Stock Status Filter */}
          <div className="space-y-2">
            <Label>Stock Status</Label>
            <Select
              value={localFilters.stockStatus || 'all'}
              onValueChange={(value) => {
                const stockStatus = value === 'all' ? undefined : value as ProductFilters['stockStatus'];
                handleFilterChange('stockStatus', stockStatus);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="in_stock">In Stock</SelectItem>
                <SelectItem value="low_stock">Low Stock</SelectItem>
                <SelectItem value="out_of_stock">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Price Range */}
          <div className="space-y-2">
            <Label>Min Price</Label>
            <Input
              type="number"
              placeholder="0.00"
              value={localFilters.priceMin || ''}
              onChange={(e) => handlePriceChange('min', e.target.value)}
              min="0"
              step="0.01"
            />
          </div>

          <div className="space-y-2">
            <Label>Max Price</Label>
            <Input
              type="number"
              placeholder="999.99"
              value={localFilters.priceMax || ''}
              onChange={(e) => handlePriceChange('max', e.target.value)}
              min="0"
              step="0.01"
            />
          </div>
        </div>

        {/* Sorting */}
        <div className="space-y-2">
          <Label>Sort By</Label>
          <div className="flex gap-2">
            <Select
              value={sort.field}
              onValueChange={(value) => onSortChange({ ...sort, field: value as ProductSortOptions['field'] })}
            >
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="basePrice">Price</SelectItem>
                <SelectItem value="createdAt">Created Date</SelectItem>
                <SelectItem value="updatedAt">Updated Date</SelectItem>
              </SelectContent>
            </Select>
            
            <Select
              value={sort.direction}
              onValueChange={(value) => onSortChange({ ...sort, direction: value as ProductSortOptions['direction'] })}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">
                  <div className="flex items-center gap-2">
                    <Icon icon="heroicons:arrow-up" className="h-4 w-4" />
                    Asc
                  </div>
                </SelectItem>
                <SelectItem value="desc">
                  <div className="flex items-center gap-2">
                    <Icon icon="heroicons:arrow-down" className="h-4 w-4" />
                    Desc
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
