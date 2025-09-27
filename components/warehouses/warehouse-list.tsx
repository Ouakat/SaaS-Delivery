"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Icon } from "@iconify/react";
import { WarehouseTable, WarehouseFiltersComponent } from "./index";
import { Warehouse } from "@/lib/types/product.types";
import { WarehouseFilters, WarehouseSortOptions } from "@/lib/types/warehouse.types";
import { warehouseApi } from "@/lib/api/clients/warehouse.client";
import { useDebounce } from "@/hooks/use-debounce";

interface WarehouseListComponentProps {
  onWarehouseSelect?: (warehouse: Warehouse) => void;
  onWarehouseEdit?: (warehouse: Warehouse) => void;
  onWarehouseDelete?: (warehouse: Warehouse) => void;
  showFilters?: boolean;
  showPagination?: boolean;
  pageSize?: number;
}

export function WarehouseList({
  onWarehouseSelect,
  onWarehouseEdit,
  onWarehouseDelete,
  showFilters = true,
  showPagination = true,
  pageSize = 12,
}: WarehouseListComponentProps) {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtersCollapsed, setFiltersCollapsed] = useState(false);
  
  // Filter and sort state
  const [filters, setFilters] = useState<WarehouseFilters>({});
  const [sort, setSort] = useState<WarehouseSortOptions>({
    field: 'createdAt',
    direction: 'desc',
  });
  
  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: pageSize,
    total: 0,
    totalPages: 0,
  });

  // Debounce search to avoid too many API calls
  const debouncedSearch = useDebounce(filters.search || '', 300);

  // Load warehouses
  const loadWarehouses = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        includeStocks: true,
        search: debouncedSearch || undefined,
      };

      const response = await warehouseApi.getWarehouses(params);
      
      // Apply client-side filtering for complex filters
      let filteredWarehouses = response.data?.data;
      
      if (filters.hasStocks !== undefined) {
        filteredWarehouses = filteredWarehouses.filter(w => 
          filters.hasStocks ? (w.stocks && w.stocks.length > 0) : (!w.stocks || w.stocks.length === 0)
        );
      }
      
      if (filters.stockStatus) {
        filteredWarehouses = filteredWarehouses.filter(warehouse => {
          const totalStock = warehouse.stocks?.reduce((sum, stock) => sum + stock.quantity, 0) || 0;
          const totalReserved = warehouse.stocks?.reduce((sum, stock) => sum + stock.reserved, 0) || 0;
          const availableStock = totalStock - totalReserved;
          
          switch (filters.stockStatus) {
            case 'high_stock':
              return availableStock > 100;
            case 'low_stock':
              return availableStock > 0 && availableStock <= 100;
            case 'no_stock':
              return availableStock <= 0;
            default:
              return true;
          }
        });
      }
    
      setWarehouses(filteredWarehouses);
      setPagination(prev => ({
        ...prev,
        total: response.data?.pagination?.total,
        totalPages: response.data?.pagination?.totalPages,
      }));
    } catch (err: any) {
      setError(err.message || 'Failed to load warehouses');
    } finally {
      setLoading(false);
    }
  };

  // Reload warehouses when filters, sort, or pagination change
  useEffect(() => {
    loadWarehouses();
  }, [debouncedSearch, filters.hasStocks, filters.stockStatus, sort, pagination.page]);

  // Reset pagination when filters change
  useEffect(() => {
    if (pagination.page !== 1) {
      setPagination(prev => ({ ...prev, page: 1 }));
    }
  }, [filters]);

  const handleFiltersChange = (newFilters: WarehouseFilters) => {
    setFilters(newFilters);
  };

  const handleSortChange = (newSort: WarehouseSortOptions) => {
    setSort(newSort);
  };

  const handleResetFilters = () => {
    setFilters({});
    setSort({ field: 'createdAt', direction: 'desc' });
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <Skeleton className="h-6 mb-2" />
            <Skeleton className="h-4 mb-2 w-3/4" />
            <Skeleton className="h-4 mb-4 w-1/2" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-20" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // Empty state
  const EmptyState = () => (
    <Card className="text-center py-12">
      <CardContent>
        <Icon icon="heroicons:building-storefront" className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">No warehouses found</h3>
        <p className="text-muted-foreground mb-4">
          {Object.keys(filters).some(key => filters[key as keyof WarehouseFilters] !== undefined)
            ? "Try adjusting your filters to see more results."
            : "Get started by adding your first warehouse."}
        </p>
        <Button onClick={handleResetFilters} variant="outline">
          <Icon icon="heroicons:arrow-path" className="h-4 w-4 mr-2" />
          Reset Filters
        </Button>
      </CardContent>
    </Card>
  );

  // Error state
  if (error) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <Icon icon="heroicons:exclamation-triangle" className="h-16 w-16 mx-auto mb-4 text-destructive" />
          <h3 className="text-lg font-semibold mb-2">Error loading warehouses</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={loadWarehouses}>
            <Icon icon="heroicons:arrow-path" className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      {showFilters && (
        <WarehouseFiltersComponent
          filters={filters}
          sort={sort}
          onFiltersChange={handleFiltersChange}
          onSortChange={handleSortChange}
          onReset={handleResetFilters}
          isCollapsed={filtersCollapsed}
          onToggleCollapse={() => setFiltersCollapsed(!filtersCollapsed)}
        />
      )}

      {/* Results Summary */}
      {!loading && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {warehouses.length} of {pagination.total} warehouses
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFiltersCollapsed(!filtersCollapsed)}
            >
              <Icon icon="heroicons:funnel" className="h-4 w-4 mr-2" />
              {filtersCollapsed ? 'Show' : 'Hide'} Filters
            </Button>
          </div>
        </div>
      )}

      {/* Warehouse Grid */}
      {loading ? (
        <LoadingSkeleton />
      ) : warehouses.length === 0 ? (
        <EmptyState />
      ) : (
        <WarehouseTable
          warehouses={warehouses}
          loading={loading}
          onWarehouseSelect={onWarehouseSelect}
          onWarehouseEdit={onWarehouseEdit}
          onWarehouseDelete={onWarehouseDelete}
          onBulkAction={(action: string, warehouseIds: string[]) => {
            console.log(`Bulk ${action} for warehouses:`, warehouseIds);
            // TODO: Implement bulk actions
          }}
        />
      )}

      {/* Pagination */}
      {showPagination && !loading && warehouses.length > 0 && pagination.totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => handlePageChange(Math.max(1, pagination.page - 1))}
                  className={pagination.page <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => handlePageChange(page)}
                      isActive={page === pagination.page}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              
              {pagination.totalPages > 5 && <PaginationEllipsis />}
              
              <PaginationItem>
                <PaginationNext
                  onClick={() => handlePageChange(Math.min(pagination.totalPages, pagination.page + 1))}
                  className={pagination.page >= pagination.totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
