"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Icon } from "@iconify/react";
import { Stock } from "@/lib/types/product.types";
import { cn } from "@/lib/utils/ui.utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface StockDisplayTableProps {
  stocks: Stock[];
  showDefectiveRate?: boolean;
  showActions?: boolean;
  onManageDefective?: (stock: Stock) => void;
  onViewStock?: (stock: Stock) => void;
  className?: string;
}

export function StockDisplayTable({
  stocks,
  showDefectiveRate = true,
  showActions = true,
  onManageDefective,
  onViewStock,
  className,
}: StockDisplayTableProps) {
  const getStockStatus = (stock: Stock) => {
    const availableQuantity = stock.quantity - stock.reserved;
    if (availableQuantity === 0) return { status: "out", color: "destructive", icon: "heroicons:x-circle", label: "OUT" };
    if (availableQuantity <= 10) return { status: "low", color: "warning", icon: "heroicons:exclamation-triangle", label: "LOW" };
    return { status: "good", color: "success", icon: "heroicons:check-circle", label: "GOOD" };
  };

  const getDefectiveStatus = (defectiveRate: number) => {
    if (defectiveRate === 0) return { color: "success", label: "No defects" };
    if (defectiveRate < 5) return { color: "warning", label: "Low defects" };
    if (defectiveRate < 15) return { color: "orange", label: "Medium defects" };
    return { color: "destructive", label: "High defects" };
  };

  return (
    <div className={cn("rounded-md border", className)}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Variant</TableHead>
            <TableHead className="text-center">Available</TableHead>
            <TableHead className="text-center">Reserved</TableHead>
            <TableHead className="text-center">Good Stock</TableHead>
            <TableHead className="text-center">Defective</TableHead>
            <TableHead className="text-center">Total</TableHead>
            {showDefectiveRate && <TableHead className="text-center">Quality</TableHead>}
            <TableHead className="text-center">Status</TableHead>
            {showActions && <TableHead className="text-center">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {stocks.map((stock) => {
            const availableQuantity = stock.quantity - stock.reserved;
            const totalPhysical = stock.quantity + (stock.defective || 0);
            const defectiveRate = totalPhysical > 0 ? ((stock.defective || 0) / totalPhysical) * 100 : 0;
            const utilizationRate = stock.quantity > 0 ? (stock.reserved / stock.quantity) * 100 : 0;

            const stockStatus = getStockStatus(stock);
            const defectiveStatus = getDefectiveStatus(defectiveRate);

            return (
              <TableRow key={stock.id} className="hover:bg-muted/50">
                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    <span>{stock.product?.name || "Unknown Product"}</span>
                  </div>
                </TableCell>

                <TableCell>
                  {stock.variant ? (
                    <span className="text-sm">{stock.variant.name}</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Base Product</span>
                  )}
                </TableCell>

                <TableCell className="text-center">
                  <span className={cn(
                    "font-medium",
                    availableQuantity > 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {availableQuantity}
                  </span>
                </TableCell>

                <TableCell className="text-center">
                  <span className="font-medium text-blue-600">{stock.reserved}</span>
                </TableCell>

                <TableCell className="text-center">
                  <span className="font-medium">{stock.quantity}</span>
                </TableCell>

                <TableCell className="text-center">
                  <span className={cn(
                    "font-medium",
                    (stock.defective || 0) > 0 ? "text-red-600" : "text-muted-foreground"
                  )}>
                    {stock.defective || 0}
                  </span>
                </TableCell>

                <TableCell className="text-center">
                  <span className="font-medium">{totalPhysical}</span>
                </TableCell>

                {showDefectiveRate && (
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center gap-1">
                      <Badge
                        variant={defectiveStatus.color === "destructive" ? "destructive" : "secondary"}
                        className="text-xs"
                      >
                        {(100 - defectiveRate).toFixed(1)}%
                      </Badge>
                      {totalPhysical > 0 && (
                        <Progress
                          value={100 - defectiveRate}
                          className="h-1 w-16"
                          indicatorClassName={defectiveRate < 5 ? "bg-green-500" : defectiveRate < 15 ? "bg-yellow-500" : "bg-red-500"}
                        />
                      )}
                    </div>
                  </TableCell>
                )}

                <TableCell className="text-center">
                  <Badge
                    variant={stockStatus.color === "destructive" ? "destructive" :
                            stockStatus.color === "warning" ? "secondary" : "default"}
                    className="flex items-center gap-1 w-fit mx-auto"
                  >
                    <Icon icon={stockStatus.icon} className="h-3 w-3" />
                    {stockStatus.label}
                  </Badge>
                </TableCell>

                {showActions && (
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      {(stock.defective || 0) > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onManageDefective?.(stock)}
                          className="h-7 px-2"
                        >
                          <Icon icon="heroicons:wrench-screwdriver" className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewStock?.(stock)}
                        className="h-7 px-2"
                      >
                        <Icon icon="heroicons:eye" className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {stocks.length === 0 && (
        <div className="text-center py-8">
          <Icon icon="heroicons:cube" className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No stock items found</p>
        </div>
      )}
    </div>
  );
}

// Keep the original card component for backward compatibility
interface StockDisplayCardProps {
  stock: Stock;
  showDefectiveRate?: boolean;
  showActions?: boolean;
  onManageDefective?: (stock: Stock) => void;
  className?: string;
}

export function StockDisplayCard({
  stock,
  showDefectiveRate = true,
  showActions = true,
  onManageDefective,
  className,
}: StockDisplayCardProps) {
  return (
    <StockDisplayTable
      stocks={[stock]}
      showDefectiveRate={showDefectiveRate}
      showActions={showActions}
      onManageDefective={onManageDefective}
      className={className}
    />
  );
}