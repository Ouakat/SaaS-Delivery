"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@iconify/react";
import { Warehouse } from "@/lib/types/product.types";
import { format } from "date-fns";

interface WarehouseTableProps {
  warehouses: Warehouse[];
  loading?: boolean;
  onWarehouseSelect?: (warehouse: Warehouse) => void;
  onWarehouseEdit?: (warehouse: Warehouse) => void;
  onWarehouseDelete?: (warehouse: Warehouse) => void;
  onBulkAction?: (action: string, warehouseIds: string[]) => void;
}

export function WarehouseTable({
  warehouses,
  loading = false,
  onWarehouseSelect,
  onWarehouseEdit,
  onWarehouseDelete,
  onBulkAction,
}: WarehouseTableProps) {
  const [selectedWarehouses, setSelectedWarehouses] = useState<string[]>([]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedWarehouses(warehouses.map(w => w.id));
    } else {
      setSelectedWarehouses([]);
    }
  };

  const handleSelectWarehouse = (warehouseId: string, checked: boolean) => {
    if (checked) {
      setSelectedWarehouses(prev => [...prev, warehouseId]);
    } else {
      setSelectedWarehouses(prev => prev.filter(id => id !== warehouseId));
    }
  };

  const getStockStatus = (warehouse: Warehouse) => {
    const totalStock = warehouse.stocks?.reduce((sum, stock) => sum + stock.quantity, 0) || 0;
    const totalReserved = warehouse.stocks?.reduce((sum, stock) => sum + stock.reserved, 0) || 0;
    const availableStock = totalStock - totalReserved;
    
    if (availableStock <= 0) {
      return { label: 'No Stock', variant: 'destructive' as const };
    } else if (availableStock <= 100) {
      return { label: 'Low Stock', variant: 'secondary' as const };
    } else {
      return { label: 'In Stock', variant: 'default' as const };
    }
  };

  const getStockSummary = (warehouse: Warehouse) => {
    const totalStock = warehouse.stocks?.reduce((sum, stock) => sum + stock.quantity, 0) || 0;
    const totalReserved = warehouse.stocks?.reduce((sum, stock) => sum + stock.reserved, 0) || 0;
    const totalDefective = warehouse.stocks?.reduce((sum, stock) => sum + stock.defective, 0) || 0;
    const availableStock = totalStock - totalReserved;
    const uniqueProducts = warehouse.stocks?.length || 0;
    
    return {
      totalStock,
      totalReserved,
      availableStock,
      totalDefective,
      uniqueProducts,
    };
  };

  return (
    <div className="space-y-4">
      {/* Bulk Actions */}
      {selectedWarehouses.length > 0 && (
        <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
          <span className="text-sm font-medium">
            {selectedWarehouses.length} warehouse{selectedWarehouses.length > 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2 ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onBulkAction?.('delete', selectedWarehouses)}
            >
              <Icon icon="heroicons:trash" className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedWarehouses.length === warehouses.length && warehouses.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Stock Status</TableHead>
              <TableHead>Total Stock</TableHead>
              <TableHead>Available</TableHead>
              <TableHead>Reserved</TableHead>
              <TableHead>Defective</TableHead>
              <TableHead>Products</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {warehouses.map((warehouse) => {
              const stockStatus = getStockStatus(warehouse);
              const stockSummary = getStockSummary(warehouse);
              
              return (
                <TableRow
                  key={warehouse.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onWarehouseSelect?.(warehouse)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedWarehouses.includes(warehouse.id)}
                      onCheckedChange={(checked) => 
                        handleSelectWarehouse(warehouse.id, checked as boolean)
                      }
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Icon icon="heroicons:building-storefront" className="h-4 w-4 text-muted-foreground" />
                      {warehouse.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Icon icon="heroicons:map-pin" className="h-4 w-4" />
                      {warehouse.location || 'Not specified'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={stockStatus.variant}>
                      {stockStatus.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono">
                      {stockSummary.totalStock.toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-green-600">
                      {stockSummary.availableStock.toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-orange-300">
                      {stockSummary.totalReserved.toLocaleString()}
                    </span>
                  </TableCell>
                   <TableCell>
                    <span className="font-mono text-orange-600">
                      {stockSummary.totalDefective.toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono">
                      {stockSummary.uniqueProducts}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(warehouse.createdAt), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Icon icon="heroicons:ellipsis-horizontal" className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => onWarehouseSelect?.(warehouse)}>
                          <Icon icon="heroicons:eye" className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onWarehouseEdit?.(warehouse)}>
                          <Icon icon="heroicons:pencil" className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => onWarehouseDelete?.(warehouse)}
                          className="text-destructive"
                        >
                          <Icon icon="heroicons:trash" className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {warehouses.length === 0 && !loading && (
        <div className="text-center py-8 text-muted-foreground">
          No warehouses to display
        </div>
      )}
    </div>
  );
}
