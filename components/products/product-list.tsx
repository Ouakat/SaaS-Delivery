"use client";

import { useState, useEffect, useMemo } from "react";
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
import { ProductTable } from "./product-table";
import { ProductFiltersComponent } from "./product-filters";
import { Product, ProductFilters, ProductSortOptions } from "@/lib/types/product.types";
import { productApi } from "@/lib/api/clients/product.client";
import { useDebounce } from "@/hooks/use-debounce";

interface ProductListProps {
  onProductSelect?: (product: Product) => void;
  onProductEdit?: (product: Product) => void;
  onProductDelete?: (product: Product) => void;
  showFilters?: boolean;
  showPagination?: boolean;
  pageSize?: number;
}

export function ProductList({
  onProductSelect,
  onProductEdit,
  onProductDelete,
  showFilters = true,
  showPagination = true,
  pageSize = 12,
}: ProductListProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtersCollapsed, setFiltersCollapsed] = useState(false);
  
  // Filter and sort state
  const [filters, setFilters] = useState<ProductFilters>({});
  const [sort, setSort] = useState<ProductSortOptions>({
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

  // Load products
  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build where clause for API filtering
      const where: any = {};

      if (debouncedSearch) {
        where.OR = [
          { name: { contains: debouncedSearch, mode: 'insensitive' } },
          { description: { contains: debouncedSearch, mode: 'insensitive' } }
        ];
      }

      if (filters.hasVariants !== undefined) {
        where.hasVariants = Boolean(filters.hasVariants);
      }

      if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
        where.basePrice = {};
        if (filters.priceMin !== undefined) {
          where.basePrice.gte = String(filters.priceMin);
        }
        if (filters.priceMax !== undefined) {
          where.basePrice.lte = String(filters.priceMax);
        }
      }

      // Build orderBy for API sorting
      const orderBy: any = {};
      if (sort.field && sort.direction) {
        orderBy[sort.field] = sort.direction;
      }

      const params = {
        page: pagination.page,
        limit: pagination.limit,
        where: Object.keys(where).length > 0 ? where : undefined,
        orderBy: Object.keys(orderBy).length > 0 ? orderBy : undefined,
        includeVariants: true,
        includeStocks: true,
      };

      const response = await productApi.getProducts(params);

      // Handle the API response structure
      let products = response.data[0]?.data || [];
      const paginationData = response.data?.pagination || response.pagination;
      console.log({products___:products});
      
      // Apply client-side stock status filtering if needed
      if (filters.stockStatus) {
        products = products.filter((product: Product) => {
          const totalStock = product.stocks?.reduce((sum, stock) => sum + stock.quantity, 0) || 0;
          const totalReserved = product.stocks?.reduce((sum, stock) => sum + stock.reserved, 0) || 0;
          const totalDefective = product.stocks?.reduce((sum, stock) => sum + (stock.defective || 0), 0) || 0;
          const availableStock = totalStock - totalReserved;

          switch (filters.stockStatus) {
            case 'in_stock':
              return availableStock > 10;
            case 'low_stock':
              return availableStock > 0 && availableStock <= 10;
            case 'out_of_stock':
              return availableStock <= 0;
            default:
              return true;
          }
        });
      }
      console.log({products});
      
      setProducts(products);

      if (paginationData) {
        setPagination(prev => ({
          ...prev,
          total: paginationData.total || products.length,
          totalPages: paginationData.totalPages || Math.ceil((paginationData.total || products.length) / pagination.limit),
        }));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  // Reload products when filters, sort, or pagination change
  useEffect(() => {
    loadProducts();
  }, [debouncedSearch, filters.hasVariants, filters.priceMin, filters.priceMax, filters.stockStatus, sort, pagination.page]);

  // Reset pagination when filters change
  useEffect(() => {
    if (pagination.page !== 1) {
      setPagination(prev => ({ ...prev, page: 1 }));
    }
  }, [filters]);

  const handleFiltersChange = (newFilters: ProductFilters) => {
    setFilters(newFilters);
  };

  const handleSortChange = (newSort: ProductSortOptions) => {
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
            <Skeleton className="aspect-square mb-4 rounded-lg" />
            <Skeleton className="h-6 mb-2" />
            <Skeleton className="h-4 mb-2 w-3/4" />
            <Skeleton className="h-5 w-1/2" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // Empty state
  const EmptyState = () => (
    <Card className="text-center py-12">
      <CardContent>
        <Icon icon="heroicons:cube-transparent" className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">No products found</h3>
        <p className="text-muted-foreground mb-4">
          {Object.keys(filters).some(key => filters[key as keyof ProductFilters] !== undefined)
            ? "Try adjusting your filters to see more results."
            : "Get started by adding your first product."}
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
          <h3 className="text-lg font-semibold mb-2">Error loading products</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={loadProducts}>
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
        <ProductFiltersComponent
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
            Showing {products.length} of {pagination.total} products
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

      {/* Product Grid */}
      {loading ? (
        <LoadingSkeleton />
      ) : products.length === 0 ? (
        <EmptyState />
      ) : (
        <ProductTable
          products={products}
          loading={loading}
          onProductSelect={onProductSelect}
          onProductEdit={onProductEdit}
          onProductDelete={onProductDelete}
          onBulkAction={(action, productIds) => {
            console.log(`Bulk ${action} for products:`, productIds);
            // TODO: Implement bulk actions
          }}
        />
      )}

      {/* Pagination */}
      {showPagination && !loading && products.length > 0 && pagination.totalPages > 1 && (
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
