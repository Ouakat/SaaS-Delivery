"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils/ui.utils";
import { Product, ProductVariant, Stock } from "@/lib/types/product.types";
import { StockDisplayCard } from "@/components/stock/stock-display-card";
import { DefectiveStockManager } from "@/components/stock/defective-stock-manager";

interface ProductStockDetailsProps {
  product: Product;
  stocks: Stock[];
  onUpdateStock?: (stock: Stock) => void;
}

export function ProductStockDetails({
  product,
  stocks,
  onUpdateStock,
}: ProductStockDetailsProps) {
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [showDefectiveManager, setShowDefectiveManager] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Group stocks by warehouse
  const stocksByWarehouse = stocks.reduce((acc, stock) => {
    const warehouseId = stock.warehouseId;
    if (!acc[warehouseId]) {
      acc[warehouseId] = {
        warehouse: stock.warehouse,
        stocks: [],
      };
    }
    acc[warehouseId].stocks.push(stock);
    return acc;
  }, {} as Record<string, { warehouse: any; stocks: Stock[] }>);

  // Calculate overall product metrics
  const productMetrics = stocks.reduce(
    (acc, stock) => {
      const available = stock.quantity - stock.reserved;
      const total = stock.quantity + stock.defective;

      acc.totalItems += total;
      acc.goodItems += stock.quantity;
      acc.availableItems += available;
      acc.reservedItems += stock.reserved;
      acc.defectiveItems += stock.defective;
      acc.warehouseCount = Object.keys(stocksByWarehouse).length;

      if (stock.defective > 0) acc.locationsWithDefects++;

      return acc;
    },
    {
      totalItems: 0,
      goodItems: 0,
      availableItems: 0,
      reservedItems: 0,
      defectiveItems: 0,
      warehouseCount: 0,
      locationsWithDefects: 0,
    }
  );

  const overallDefectiveRate = productMetrics.totalItems > 0
    ? (productMetrics.defectiveItems / productMetrics.totalItems) * 100
    : 0;

  const overallQualityScore = Math.max(0, 100 - overallDefectiveRate);

  const handleManageDefective = (stock: Stock) => {
    setSelectedStock(stock);
    setShowDefectiveManager(true);
  };

  const handleStockUpdate = (updatedStock: Stock) => {
    onUpdateStock?.(updatedStock);
    setShowDefectiveManager(false);
    setSelectedStock(null);
  };

  return (
    <div className="space-y-6">
 

      {/* Overall Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Stock</p>
                <p className="text-2xl font-bold">{productMetrics.totalItems.toLocaleString()}</p>
              </div>
              <Icon icon="heroicons:cube" className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Available</p>
                <p className="text-2xl font-bold text-green-600">{productMetrics.availableItems.toLocaleString()}</p>
              </div>
              <Icon icon="heroicons:check-circle" className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Reserved</p>
                <p className="text-2xl font-bold text-blue-600">{productMetrics.reservedItems.toLocaleString()}</p>
              </div>
              <Icon icon="heroicons:lock-closed" className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Defective</p>
                <p className="text-2xl font-bold text-red-600">{productMetrics.defectiveItems.toLocaleString()}</p>
              </div>
              <Icon icon="heroicons:exclamation-triangle" className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Warehouses</p>
                <p className="text-2xl font-bold">{productMetrics.warehouseCount}</p>
              </div>
              <Icon icon="heroicons:building-storefront" className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stock Details */}
      <Card>
        <CardHeader>
          <CardTitle>Stock Details by Location</CardTitle>
        </CardHeader>
        <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Warehouse</TableHead>
                    <TableHead>Variant</TableHead>
                    <TableHead>Available</TableHead>
                    <TableHead>Reserved</TableHead>
                    <TableHead>Good</TableHead>
                    <TableHead>Defective</TableHead>
                    <TableHead>Quality</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stocks.map((stock) => {
                    console.log(stock);
                    
                    const available = stock.quantity - stock.reserved;
                    const total = stock.quantity + stock.defective;
                    const qualityRate = total > 0 ? ((stock.quantity / total) * 100) : 100;

                    return (
                      <TableRow key={stock.id}>
                        <TableCell className="font-medium">
                          {stock.warehouseId.slice(stock.warehouseId.length - 7,stock.warehouseId.length) || "Unknown"}
                        </TableCell>
                        <TableCell>
                          {stock.variant?.name || "Base Product"}
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-green-600">{available}</span>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-blue-600">{stock.reserved}</span>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{stock.quantity}</span>
                        </TableCell>
                        <TableCell>
                          <span className={cn(
                            "font-medium",
                            stock.defective > 0 ? "text-red-600" : "text-muted-foreground"
                          )}>
                            {stock.defective}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={qualityRate >= 95 ? "default" : qualityRate >= 85 ? "secondary" : "destructive"}
                            className="text-xs"
                          >
                            {qualityRate.toFixed(0)}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {stock.defective > 0 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleManageDefective(stock)}
                              >
                                <Icon icon="heroicons:wrench-screwdriver" className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
        </CardContent>
      </Card>

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