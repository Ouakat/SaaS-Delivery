"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
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
import { ExpeditionTable } from "./expedition-table";
import { ExpeditionFilters } from "./expedition-filters";
import { Expedition, ExpeditionFilters as FilterType, ExpeditionStatus } from "@/lib/types/expedition.types";
import { expeditionClient } from "@/lib/api/clients/expedition.client";
import { useDebounce } from "@/hooks/use-debounce";
import { toast } from "sonner";

interface ExpeditionListProps {
  onExpeditionSelect?: (expedition: Expedition) => void;
  onExpeditionEdit?: (expedition: Expedition) => void;
  onExpeditionReceive?: (expedition: Expedition) => void;
  showFilters?: boolean;
  showPagination?: boolean;
  pageSize?: number;
}

export function ExpeditionList({
  onExpeditionSelect,
  onExpeditionEdit,
  onExpeditionReceive,
  showFilters = true,
  showPagination = true,
  pageSize = 12,
}: ExpeditionListProps) {
  const t = useTranslations("Expeditions");
  const [expeditions, setExpeditions] = useState<Expedition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtersCollapsed, setFiltersCollapsed] = useState(false);
  const [selectedExpeditions, setSelectedExpeditions] = useState<string[]>([]);

  // Filter and sort state
  const [filters, setFilters] = useState<FilterType>({});
  const [sort, setSort] = useState<{ field: string; direction: "asc" | "desc" }>({
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

  // Load expeditions
  const loadExpeditions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build where object for Prisma with AND/OR structure
      const conditions: any[] = [];

      // Search condition (OR for multiple fields)
      if (debouncedSearch) {
        conditions.push({
          OR: [
            { trackingNumber: { contains: debouncedSearch, mode: 'insensitive' } },
            { generalNotes: { contains: debouncedSearch, mode: 'insensitive' } }
          ]
        });
      }

      // Status filter
      if (filters.status) {
        conditions.push({ status: filters.status });
      }

      // Warehouse filter
      if (filters.warehouseId) {
        conditions.push({ warehouseId: filters.warehouseId });
      }

      // Seller filter
      if (filters.sellerId) {
        conditions.push({ sellerId: filters.sellerId });
      }

      // Transport mode filter
      if (filters.transportMode) {
        conditions.push({ transportMode: filters.transportMode });
      }

      // Created date range filter
      if (filters.dateRange?.start || filters.dateRange?.end) {
        const createdAtCondition: any = {};
        if (filters.dateRange?.start) {
          createdAtCondition.gte = filters.dateRange.start.toISOString();
        }
        if (filters.dateRange?.end) {
          createdAtCondition.lte = filters.dateRange.end.toISOString();
        }
        conditions.push({ createdAt: createdAtCondition });
      }

      // Arrival date range filter
      if (filters.arrivalDateRange?.start || filters.arrivalDateRange?.end) {
        const arrivalDateCondition: any = {};
        if (filters.arrivalDateRange?.start) {
          arrivalDateCondition.gte = filters.arrivalDateRange.start.toISOString();
        }
        if (filters.arrivalDateRange?.end) {
          arrivalDateCondition.lte = filters.arrivalDateRange.end.toISOString();
        }
        conditions.push({ arrivalDate: arrivalDateCondition });
      }

      // Build final where object
      const where = conditions.length > 0 ? { AND: conditions } : null;

      const params: Record<string, any> = {
        page: pagination.page,
        limit: pagination.limit,
        sortBy: sort.field,
        sortOrder: sort.direction,
      };

      // Only add where parameter if there are conditions
      if (where) {
        params.where = JSON.stringify(where);
      }

      const response = await expeditionClient.getAll(params);
      console.log('Expedition response:', response.data);

      setExpeditions(response.data[0]?.data || []);
      if (response.pagination) {
        setPagination(prev => ({
          ...prev,
          total: response.pagination.total,
          totalPages: response.pagination.totalPages,
        }));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load expeditions');
      toast.error('Failed to load expeditions');
    } finally {
      setLoading(false);
    }
  }, [
    pagination.page,
    pagination.limit,
    debouncedSearch,
    filters.status,
    filters.warehouseId,
    filters.sellerId,
    filters.transportMode,
    filters.dateRange?.start,
    filters.dateRange?.end,
    filters.arrivalDateRange?.start,
    filters.arrivalDateRange?.end,
    sort.field,
    sort.direction,
  ]);

  // Reload expeditions when dependencies change
  useEffect(() => {
    loadExpeditions();
  }, [loadExpeditions]);

  // Reset pagination when filters change (excluding search)
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [
    filters.status,
    filters.warehouseId,
    filters.sellerId,
    filters.transportMode,
    filters.dateRange?.start,
    filters.dateRange?.end,
    filters.arrivalDateRange?.start,
    filters.arrivalDateRange?.end,
  ]);

  // Handle bulk status update
  const handleBulkStatusUpdate = async (status: ExpeditionStatus) => {
    if (selectedExpeditions.length === 0) {
      toast.error("Please select expeditions to update");
      return;
    }

    try {
      const response = await expeditionClient.bulkStatusUpdate({
        expeditionIds: selectedExpeditions,
        status,
      });

      if (response.success) {
        toast.success(`Updated ${response.updated} expeditions`);
        setSelectedExpeditions([]);
        loadExpeditions();
      }

      if (response.failed.length > 0) {
        response.failed.forEach(fail => {
          toast.error(`Failed to update expedition ${fail.expeditionId}: ${fail.reason}`);
        });
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update expeditions");
    }
  };

  const renderPagination = () => {
    const pages = [];
    const maxVisible = 5;
    const halfVisible = Math.floor(maxVisible / 2);

    let startPage = Math.max(1, pagination.page - halfVisible);
    let endPage = Math.min(pagination.totalPages, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    return (
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => pagination.page > 1 && setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              className={pagination.page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>

          {startPage > 1 && (
            <>
              <PaginationItem>
                <PaginationLink onClick={() => setPagination(prev => ({ ...prev, page: 1 }))}>
                  1
                </PaginationLink>
              </PaginationItem>
              {startPage > 2 && <PaginationEllipsis />}
            </>
          )}

          {Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i).map(page => (
            <PaginationItem key={page}>
              <PaginationLink
                onClick={() => setPagination(prev => ({ ...prev, page }))}
                isActive={page === pagination.page}
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          ))}

          {endPage < pagination.totalPages && (
            <>
              {endPage < pagination.totalPages - 1 && <PaginationEllipsis />}
              <PaginationItem>
                <PaginationLink onClick={() => setPagination(prev => ({ ...prev, page: pagination.totalPages }))}>
                  {pagination.totalPages}
                </PaginationLink>
              </PaginationItem>
            </>
          )}

          <PaginationItem>
            <PaginationNext
              onClick={() => pagination.page < pagination.totalPages && setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              className={pagination.page === pagination.totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <Icon icon="heroicons:exclamation-triangle" className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" onClick={loadExpeditions} className="mt-4">
              <Icon icon="heroicons:arrow-path" className="h-4 w-4 mr-2" />
              {t("retry")}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {showFilters && (
        <Card className={filtersCollapsed ? "p-0" : ""}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{t("filters.title")}</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFiltersCollapsed(!filtersCollapsed)}
              >
                <Icon
                  icon={filtersCollapsed ? "heroicons:chevron-down" : "heroicons:chevron-up"}
                  className="h-4 w-4"
                />
              </Button>
            </div>
          </CardHeader>
          {!filtersCollapsed && (
            <CardContent>
              <ExpeditionFilters
                filters={filters}
                onFiltersChange={setFilters}
              />
            </CardContent>
          )}
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>{t("title")}</CardTitle>
            {selectedExpeditions.length > 0 && (
              <div className="flex gap-2">
                <Badge>
                  {selectedExpeditions.length} {t("selected")}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkStatusUpdate("received")}
                >
                  {t("mark_as_received")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkStatusUpdate("cancelled")}
                >
                  {t("cancel")}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <>
              <ExpeditionTable
                expeditions={expeditions}
                selectedExpeditions={selectedExpeditions}
                onSelectionChange={setSelectedExpeditions}
                onExpeditionSelect={onExpeditionSelect}
                onExpeditionEdit={onExpeditionEdit}
                onExpeditionReceive={onExpeditionReceive}
                sort={sort}
                onSortChange={setSort}
              />

              {showPagination && pagination.totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {t("pagination.showing")} {((pagination.page - 1) * pagination.limit) + 1} {t("pagination.to")}{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} {t("pagination.of")}{' '}
                    {pagination.total} {t("pagination.expeditions")}
                  </p>
                  {renderPagination()}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}