"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils/ui.utils";
import { Stock, Warehouse } from "@/lib/types/product.types";
import { StockDisplayCard, StockDisplayTable } from "@/components/stock/stock-display-card";

interface WarehouseStockOverviewProps {
  warehouse: Warehouse;
  stocks: Stock[];
  onManageDefective?: (stock: Stock) => void;
  onViewStock?: (stock: Stock) => void;
}

export function WarehouseStockOverview({
  warehouse,
  stocks,
  onManageDefective,
  onViewStock,
}: WarehouseStockOverviewProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [filterDefective, setFilterDefective] = useState(false);

  // Calculate warehouse metrics
  const metrics = stocks.reduce(
    (acc, stock) => {
      const available = stock.quantity - stock.reserved;
      const total = stock.quantity + stock.defective;

      acc.totalItems += total;
      acc.goodItems += stock.quantity;
      acc.availableItems += available;
      acc.reservedItems += stock.reserved;
      acc.defectiveItems += stock.defective;
      acc.totalValue += stock.quantity * 10; // Placeholder price calculation
      acc.defectiveValue += stock.defective * 10;

      if (available === 0) acc.outOfStock++;
      else if (available <= 10) acc.lowStock++;
      else acc.inStock++;

      if (stock.defective > 0) acc.itemsWithDefects++;

      return acc;
    },
    {
      totalItems: 0,
      goodItems: 0,
      availableItems: 0,
      reservedItems: 0,
      defectiveItems: 0,
      totalValue: 0,
      defectiveValue: 0,
      inStock: 0,
      lowStock: 0,
      outOfStock: 0,
      itemsWithDefects: 0,
    }
  );

  const defectiveRate = metrics.totalItems > 0 ? (metrics.defectiveItems / metrics.totalItems) * 100 : 0;
  const utilizationRate = metrics.goodItems > 0 ? (metrics.reservedItems / metrics.goodItems) * 100 : 0;
  const stockHealthScore = Math.max(0, 100 - defectiveRate - (metrics.outOfStock * 10) - (metrics.lowStock * 5));

  const filteredStocks = filterDefective
    ? stocks.filter(stock => stock.defective > 0)
    : stocks;

  return (
    <div className="space-y-6">
      {/* Warehouse Header */}
      {/* <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Icon icon="heroicons:building-storefront" className="h-5 w-5" />
                {warehouse.name}
              </CardTitle>
              {warehouse.location && (
                <p className="text-sm text-muted-foreground mt-1">
                  <Icon icon="heroicons:map-pin" className="h-4 w-4 inline mr-1" />
                  {warehouse.location}
                </p>
              )}
            </div>
            <Badge
              variant={stockHealthScore >= 80 ? "default" : stockHealthScore >= 60 ? "secondary" : "destructive"}
              className="text-lg px-4 py-2"
            >
              Health: {stockHealthScore.toFixed(0)}%
            </Badge>
          </div>
        </CardHeader>
      </Card> */}

      {/* Key Metrics */}
      {/* <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Items</p>
                <p className="text-2xl font-bold">{metrics.totalItems.toLocaleString()}</p>
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
                <p className="text-2xl font-bold text-green-600">{metrics.availableItems.toLocaleString()}</p>
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
                <p className="text-2xl font-bold text-blue-600">{metrics.reservedItems.toLocaleString()}</p>
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
                <p className="text-2xl font-bold text-red-600">{metrics.defectiveItems.toLocaleString()}</p>
              </div>
              <Icon icon="heroicons:exclamation-triangle" className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div> */}

      {/* Health Dashboard */}
      {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Stock Status Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm">In Stock</span>
                </div>
                <span className="font-medium">{metrics.inStock}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm">Low Stock</span>
                </div>
                <span className="font-medium">{metrics.lowStock}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm">Out of Stock</span>
                </div>
                <span className="font-medium">{metrics.outOfStock}</span>
              </div>
            </div>

            <div className="pt-2">
              <div className="flex justify-between text-sm mb-2">
                <span>Stock Health</span>
                <span>{stockHealthScore.toFixed(0)}%</span>
              </div>
              <Progress
                value={stockHealthScore}
                className="h-3"
                indicatorClassName={stockHealthScore >= 80 ? "bg-green-500" : stockHealthScore >= 60 ? "bg-yellow-500" : "bg-red-500"}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quality Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {(100 - defectiveRate).toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">Quality Rate</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {defectiveRate.toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">Defect Rate</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Items with Defects</span>
                <span className="font-medium">{metrics.itemsWithDefects} / {stocks.length}</span>
              </div>
              <Progress
                value={stocks.length > 0 ? ((stocks.length - metrics.itemsWithDefects) / stocks.length) * 100 : 100}
                className="h-2"
                indicatorClassName="bg-green-500"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Utilization Rate</span>
                <span className="font-medium">{utilizationRate.toFixed(1)}%</span>
              </div>
              <Progress
                value={utilizationRate}
                className="h-2"
                indicatorClassName={utilizationRate > 80 ? "bg-red-500" : utilizationRate > 60 ? "bg-yellow-500" : "bg-green-500"}
              />
            </div>
          </CardContent>
        </Card>
      </div> */}

      {/* Stock Items Tabs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Stock Items</CardTitle>
            <div className="flex gap-2">
              <Button
                variant={filterDefective ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterDefective(!filterDefective)}
              >
                <Icon icon="heroicons:funnel" className="h-4 w-4 mr-2" />
                {filterDefective ? "Show All" : "Defective Only"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
              <StockDisplayTable
                stocks={filteredStocks.slice(0, 10)}
                onManageDefective={onManageDefective}
                onViewStock={onViewStock}
                showDefectiveRate={true}
                showActions={true}
              />
              {filteredStocks.length > 10 && (
                <div className="text-center pt-4">
                  <Button variant="outline" onClick={() => setActiveTab("grid")}>
                    View All {filteredStocks.length} Items
                  </Button>
                </div>
              )}
        </CardContent>
      </Card>
    </div>
  );
}