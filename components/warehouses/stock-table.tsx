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
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Icon } from "@iconify/react";
import { Stock } from "@/lib/types/product.types";
import { format } from "date-fns";
import { toast } from "sonner";
import { warehouseApi } from "@/lib/api/clients/warehouse.client";

interface StockTableProps {
  stocks: Stock[];
  warehouseId: string;
  onStockUpdate?: () => void;
}

export function StockTable({
  stocks,
  warehouseId,
  onStockUpdate,
}: StockTableProps) {
  const [adjustmentDialog, setAdjustmentDialog] = useState<{
    open: boolean;
    stock: Stock | null;
    newQuantity: number;
    reason: string;
  }>({
    open: false,
    stock: null,
    newQuantity: 0,
    reason: '',
  });

  const [reservationDialog, setReservationDialog] = useState<{
    open: boolean;
    stock: Stock | null;
    quantity: number;
    reference: string;
    type: 'reserve' | 'release';
  }>({
    open: false,
    stock: null,
    quantity: 0,
    reference: '',
    type: 'reserve',
  });

  const getStockStatus = (stock: Stock) => {
    const available = stock.quantity - stock.reserved;
    
    if (available <= 0) {
      return { label: 'Out of Stock', variant: 'destructive' as const };
    } else if (available <= 10) {
      return { label: 'Low Stock', variant: 'secondary' as const };
    } else {
      return { label: 'In Stock', variant: 'default' as const };
    }
  };

  const handleAdjustStock = async () => {
    if (!adjustmentDialog.stock) return;

    try {
      await warehouseApi.adjustStockLevel(
        warehouseId,
        adjustmentDialog.stock.id,
        adjustmentDialog.newQuantity,
        adjustmentDialog.reason || 'Manual adjustment'
      );
      
      toast.success('Stock level adjusted successfully');
      setAdjustmentDialog({ open: false, stock: null, newQuantity: 0, reason: '' });
      onStockUpdate?.();
    } catch (error: any) {
      toast.error(error.message || 'Failed to adjust stock level');
    }
  };

  const handleReservation = async () => {
    if (!reservationDialog.stock) return;

    try {
      if (reservationDialog.type === 'reserve') {
        await warehouseApi.reserveStock(
          warehouseId,
          reservationDialog.stock.id,
          reservationDialog.quantity,
          reservationDialog.reference || undefined
        );
        toast.success('Stock reserved successfully');
      } else {
        await warehouseApi.releaseReservedStock(
          warehouseId,
          reservationDialog.stock.id,
          reservationDialog.quantity,
          reservationDialog.reference || undefined
        );
        toast.success('Reserved stock released successfully');
      }
      
      setReservationDialog({ 
        open: false, 
        stock: null, 
        quantity: 0, 
        reference: '', 
        type: 'reserve' 
      });
      onStockUpdate?.();
    } catch (error: any) {
      toast.error(error.message || `Failed to ${reservationDialog.type} stock`);
    }
  };

  const openAdjustmentDialog = (stock: Stock) => {
    setAdjustmentDialog({
      open: true,
      stock,
      newQuantity: stock.quantity,
      reason: '',
    });
  };

  const openReservationDialog = (stock: Stock, type: 'reserve' | 'release') => {
    setReservationDialog({
      open: true,
      stock,
      quantity: 0,
      reference: '',
      type,
    });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Total Qty</TableHead>
              <TableHead>Available</TableHead>
              <TableHead>Reserved</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stocks.map((stock) => {
              const status = getStockStatus(stock);
              const available = stock.quantity - stock.reserved;
              
              return (
                <TableRow key={stock.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {stock.product?.name || stock.variant?.name || 'Unknown Product'}
                      </div>
                      {stock.variant && (
                        <div className="text-sm text-muted-foreground">
                          Variant: {stock.variant.name}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono">
                    {stock.variant?.sku || stock.product?.id || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={status.variant}>
                      {status.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono">
                    {stock.quantity.toLocaleString()}
                  </TableCell>
                  <TableCell className="font-mono text-green-600">
                    {available.toLocaleString()}
                  </TableCell>
                  <TableCell className="font-mono text-orange-600">
                    {stock.reserved.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(stock.updatedAt), 'MMM dd, HH:mm')}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Icon icon="heroicons:ellipsis-horizontal" className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Stock Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => openAdjustmentDialog(stock)}>
                          <Icon icon="heroicons:pencil" className="h-4 w-4 mr-2" />
                          Adjust Quantity
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => openReservationDialog(stock, 'reserve')}>
                          <Icon icon="heroicons:lock-closed" className="h-4 w-4 mr-2" />
                          Reserve Stock
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openReservationDialog(stock, 'release')}>
                          <Icon icon="heroicons:lock-open" className="h-4 w-4 mr-2" />
                          Release Reserved
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

      {stocks.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Icon icon="heroicons:cube-transparent" className="h-12 w-12 mx-auto mb-4" />
          <p>No stock items found in this warehouse</p>
        </div>
      )}

      {/* Stock Adjustment Dialog */}
      <Dialog 
        open={adjustmentDialog.open} 
        onOpenChange={(open) => setAdjustmentDialog(prev => ({ ...prev, open }))}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Stock Level</DialogTitle>
            <DialogDescription>
              Update the quantity for {adjustmentDialog.stock?.product?.name || adjustmentDialog.stock?.variant?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">New Quantity</label>
              <Input
                type="number"
                min="0"
                value={adjustmentDialog.newQuantity}
                onChange={(e) => setAdjustmentDialog(prev => ({ 
                  ...prev, 
                  newQuantity: parseInt(e.target.value) || 0 
                }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Reason (Optional)</label>
              <Input
                placeholder="Enter reason for adjustment"
                value={adjustmentDialog.reason}
                onChange={(e) => setAdjustmentDialog(prev => ({ 
                  ...prev, 
                  reason: e.target.value 
                }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustmentDialog(prev => ({ ...prev, open: false }))}>
              Cancel
            </Button>
            <Button onClick={handleAdjustStock}>
              Adjust Stock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stock Reservation Dialog */}
      <Dialog 
        open={reservationDialog.open} 
        onOpenChange={(open) => setReservationDialog(prev => ({ ...prev, open }))}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reservationDialog.type === 'reserve' ? 'Reserve Stock' : 'Release Reserved Stock'}
            </DialogTitle>
            <DialogDescription>
              {reservationDialog.type === 'reserve' ? 'Reserve' : 'Release'} stock for {reservationDialog.stock?.product?.name || reservationDialog.stock?.variant?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Quantity</label>
              <Input
                type="number"
                min="1"
                max={reservationDialog.type === 'reserve' 
                  ? (reservationDialog.stock?.quantity || 0) - (reservationDialog.stock?.reserved || 0)
                  : reservationDialog.stock?.reserved || 0
                }
                value={reservationDialog.quantity}
                onChange={(e) => setReservationDialog(prev => ({ 
                  ...prev, 
                  quantity: parseInt(e.target.value) || 0 
                }))}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {reservationDialog.type === 'reserve' 
                  ? `Available: ${((reservationDialog.stock?.quantity || 0) - (reservationDialog.stock?.reserved || 0)).toLocaleString()}`
                  : `Reserved: ${(reservationDialog.stock?.reserved || 0).toLocaleString()}`
                }
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">Reference (Optional)</label>
              <Input
                placeholder="Order ID, reference number, etc."
                value={reservationDialog.reference}
                onChange={(e) => setReservationDialog(prev => ({ 
                  ...prev, 
                  reference: e.target.value 
                }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReservationDialog(prev => ({ ...prev, open: false }))}>
              Cancel
            </Button>
            <Button onClick={handleReservation}>
              {reservationDialog.type === 'reserve' ? 'Reserve Stock' : 'Release Stock'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
