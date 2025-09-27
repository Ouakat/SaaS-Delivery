"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Icon } from "@iconify/react";
import { format } from "date-fns";
import { toast } from "sonner";
import { warehouseApi } from "@/lib/api/clients/warehouse.client";
import { Warehouse, Stock } from "@/lib/types/product.types";
import { WarehouseWithStats, WarehouseStockSummary } from "@/lib/types/warehouse.types";
import { StockTable } from "./stock-table";
import { StockMovementForm } from "./stock-movement-form";
import { WarehouseStockOverview } from "./warehouse-stock-overview";
import { DefectiveStockManager } from "@/components/stock/defective-stock-manager";

interface WarehouseDetailProps {
  warehouseId: string;
  onEdit?: () => void;
  onDelete?: () => void;
  onClose?: () => void;
}

export function WarehouseDetail({
  warehouseId,
  onEdit,
  onDelete,
  onClose,
}: WarehouseDetailProps) {
  const [warehouse, setWarehouse] = useState<Warehouse | null>(null);
  const [warehouseStats, setWarehouseStats] = useState<WarehouseWithStats | null>(null);
  const [stockSummary, setStockSummary] = useState<WarehouseStockSummary | null>(null);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [showStockMovementDialog, setShowStockMovementDialog] = useState(false);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [showDefectiveManager, setShowDefectiveManager] = useState(false);

  useEffect(() => {
    loadWarehouseData();
  }, [warehouseId]);

  const loadWarehouseData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load warehouse basic data
      const [warehouseData, stockSummaryData, stocksData] = await Promise.all([
        warehouseApi.getWarehouse(warehouseId, { includeStocks: true }),
        warehouseApi.getWarehouseStockSummary(warehouseId),
        warehouseApi.getWarehouseStocks(warehouseId, { 
          includeProduct: true, 
          includeVariant: true 
        }),
      ]);
      
      setWarehouse(warehouseData);
      console.log('Stock Summary Data:', stockSummaryData);
      console.log('Warehouse Data:', warehouseData);
      console.log('Stocks Data:', stocksData);
      
      setStockSummary(stockSummaryData);
      // Handle both paginated response format and direct warehouse.stocks format
      if (stocksData?.data) {
        setStocks(stocksData.data.data);
      } else if (stocksData?.warehouse?.stocks) {
        setStocks(stocksData.warehouse.stocks);
      } else if (stockSummaryData?.warehouse?.stocks) {
        setStocks(stockSummaryData.warehouse.stocks);
      } else {
        setStocks([]);
      }

      // Try to get warehouse with stats (might not be available)
      try {
        const statsData = await warehouseApi.getWarehouseWithStats(warehouseId);
        setWarehouseStats(statsData);
      } catch (statsError) {
        console.warn('Warehouse stats not available:', statsError);
      }

    } catch (err: any) {
      setError(err.message || 'Failed to load warehouse data');
      toast.error('Failed to load warehouse data');
    } finally {
      setLoading(false);
    }
  };

  const handleStockMovement = () => {
    // Reload data after stock movement
    loadWarehouseData();
    // Close the dialog
    setShowStockMovementDialog(false);
  };

  const handleManageDefective = (stock: Stock) => {
    setSelectedStock(stock);
    setShowDefectiveManager(true);
  };

  const handleStockUpdate = (updatedStock: Stock) => {
    // Update the stock in the stocks array
    setStocks(prevStocks =>
      prevStocks.map(stock =>
        stock.id === updatedStock.id ? updatedStock : stock
      )
    );
    setShowDefectiveManager(false);
    setSelectedStock(null);
    // Optionally reload all data for accuracy
    loadWarehouseData();
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error || !warehouse) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <Icon icon="heroicons:exclamation-triangle" className="h-16 w-16 mx-auto mb-4 text-destructive" />
          <h3 className="text-lg font-semibold mb-2">Error loading warehouse</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={loadWarehouseData}>
            <Icon icon="heroicons:arrow-path" className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  const getStockStatus = () => {
    if (!stockSummary) return { label: 'Unknown', variant: 'secondary' as const };
    
    const totalQuantity = stockSummary.summary._sum.quantity || 0;
    const reserved = stockSummary.summary._sum.reserved || 0;
    const available = totalQuantity - reserved;
    
    if (available <= 0) {
      return { label: 'No Stock', variant: 'destructive' as const };
    } else if (available <= 10) {
      return { label: 'Low Stock', variant: 'secondary' as const };
    } else {
      return { label: 'In Stock', variant: 'default' as const };
    }
  };

  const stockStatus = getStockStatus();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onClose && (
            <Button variant="outline" size="sm" onClick={onClose}>
              <Icon icon="heroicons:arrow-left" className="h-4 w-4" />
            </Button>
          )}
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Icon icon="heroicons:building-storefront" className="h-8 w-8" />
              {warehouse.name}
            </h1>
            <p className="text-muted-foreground">
              {warehouse.location || 'Location not specified'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {onEdit && (
            <Button variant="outline" onClick={onEdit}>
              <Icon icon="heroicons:pencil" className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
          {onDelete && (
            <Button variant="outline" onClick={onDelete}>
              <Icon icon="heroicons:trash" className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      {stockSummary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Stock</p>
                  <p className="text-2xl font-bold">{(stockSummary.summary._sum.quantity || 0).toLocaleString()}</p>
                </div>
                <Icon icon="heroicons:cube" className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Available</p>
                  <p className="text-2xl font-bold text-green-600">{((stockSummary.summary._sum.quantity || 0) - (stockSummary.summary._sum.reserved || 0)).toLocaleString()}</p>
                </div>
                <Icon icon="heroicons:check-circle" className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Reserved</p>
                  <p className="text-2xl font-bold text-orange-300">{(stockSummary.summary._sum.reserved || 0).toLocaleString()}</p>
                </div>
                <Icon icon="heroicons:clock" className="h-8 w-8 text-orange-300" />
              </div>
            </CardContent>
          </Card>
         <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Defective</p>
                  <p className="text-2xl font-bold text-orange-600">{(stockSummary.summary._sum.defective || 0).toLocaleString()}</p>
                </div>
                <Icon icon="heroicons:broken" className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Stock Items</p>
                  <p className="text-2xl font-bold">{(stockSummary.summary._count.id || 0).toLocaleString()}</p>
                </div>
                <Icon icon="heroicons:squares-2x2" className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="stock">Stock Management</TabsTrigger>
          <TabsTrigger value="movements">Stock Movements</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <WarehouseStockOverview
            warehouse={warehouse}
            stocks={stocks}
            onManageDefective={handleManageDefective}
            onViewStock={(stock) => {
              // Navigate to stock details or open a modal
              console.log('View stock:', stock);
            }}
          />
        </TabsContent>

        <TabsContent value="stock" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Stock Items</h3>
            <Dialog open={showStockMovementDialog} onOpenChange={setShowStockMovementDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Icon icon="heroicons:plus" className="h-4 w-4 mr-2" />
                  Add Stock Movement
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add Stock Movement</DialogTitle>
                </DialogHeader>
                <StockMovementForm 
                  warehouseId={warehouseId}
                  onMovementComplete={handleStockMovement}
                />
              </DialogContent>
            </Dialog>
          </div>
          <StockTable 
            stocks={stocks} 
            warehouseId={warehouseId}
            onStockUpdate={handleStockMovement}
          />
        </TabsContent>

        <TabsContent value="movements" className="space-y-6">
          <StockMovementForm 
            warehouseId={warehouseId}
            onMovementComplete={handleStockMovement}
          />
        </TabsContent>

      </Tabs>

      {/* Defective Stock Manager Dialog */}
      {selectedStock && (
        <DefectiveStockManager
          stock={selectedStock}
          isOpen={showDefectiveManager}
          onClose={() => {
            setShowDefectiveManager(false);
            setSelectedStock(null);
          }}
          onUpdate={handleStockUpdate}
        />
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8" />
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-20" />
        </div>
      </div>

      {/* Stats Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Content Skeleton */}
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
