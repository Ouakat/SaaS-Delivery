"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import { Stock, StockHistory, Warehouse, Product, ProductVariant } from "@/lib/types/product.types";
import { stockApi } from "@/lib/api/clients/stock.client";
import { formatDate } from "@/lib/utils/product.utils";

const stockAdjustmentSchema = z.object({
  change: z.number(),
  reason: z.enum(['INBOUND', 'OUTBOUND', 'ADJUSTMENT', 'RESERVATION', 'CANCEL_RESERVATION']),
  reference: z.string().optional(),
});

const createStockSchema = z.object({
  warehouseId: z.string().min(1, "Warehouse is required"),
  quantity: z.number().min(0, "Quantity cannot be negative"),
});

type StockAdjustmentData = z.infer<typeof stockAdjustmentSchema>;
type CreateStockData = z.infer<typeof createStockSchema>;

interface StockManagementProps {
  product: Product;
  variant?: ProductVariant;
  onStockUpdate?: () => void;
}

export function StockManagement({ product, variant, onStockUpdate }: StockManagementProps) {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [stockHistory, setStockHistory] = useState<StockHistory[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(false);
  const [adjustmentDialogOpen, setAdjustmentDialogOpen] = useState(false);
  const [createStockDialogOpen, setCreateStockDialogOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [activeTab, setActiveTab] = useState("stocks");

  const adjustmentForm = useForm<StockAdjustmentData>({
    resolver: zodResolver(stockAdjustmentSchema),
    defaultValues: {
      change: 1,
      reason: 'ADJUSTMENT',
      reference: '',
    },
  });

  const createStockForm = useForm<CreateStockData>({
    resolver: zodResolver(createStockSchema),
    defaultValues: {
      warehouseId: '',
      quantity: 0,
    },
  });

  useEffect(() => {
    loadStocks();
    loadWarehouses();
  }, [product.id, variant?.id]);

  const loadStocks = async () => {
    try {
      setLoading(true);
      const response = variant 
        ? await stockApi.getStocksByVariant(variant.id)
        : await stockApi.getStocksByProduct(product.id);
      setStocks(response.data);
    } catch (error: any) {
      toast.error("Failed to load stocks");
    } finally {
      setLoading(false);
    }
  };

  const loadWarehouses = async () => {
    try {
      const response = await stockApi.getWarehouses();
      setWarehouses(response.data);
    } catch (error: any) {
      toast.error("Failed to load warehouses");
    }
  };

  const loadStockHistory = async (stockId: string) => {
    try {
      console.log('stockId', stockId);
      
      const response = await stockApi.getStockHistory(stockId);
      setStockHistory(response.data);
    } catch (error: any) {
      toast.error("Failed to load stock history");
    }
  };

  const handleStockAdjustment = async (data: StockAdjustmentData) => {
    if (!selectedStock) return;

    try {
      setLoading(true);
      await stockApi.adjustStock(selectedStock.id, data);
      toast.success("Stock adjusted successfully");
      await loadStocks();
      setAdjustmentDialogOpen(false);
      onStockUpdate?.();
    } catch (error: any) {
      toast.error("Failed to adjust stock");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStock = async (data: CreateStockData) => {
    try {
      setLoading(true);
      const payload = {
        warehouseId: data.warehouseId,
        quantity: data.quantity,
        ...(variant ? { variantId: variant.id } : { productId: product.id }),
      };
      
      await stockApi.createStock(payload);
      toast.success("Stock created successfully");
      await loadStocks();
      setCreateStockDialogOpen(false);
      onStockUpdate?.();
    } catch (error: any) {
      toast.error("Failed to create stock");
    } finally {
      setLoading(false);
    }
  };

  const handleReserveStock = async (stock: Stock, quantity: number) => {
    try {
      await stockApi.reserveStock(stock.id, { quantity });
      toast.success("Stock reserved successfully");
      await loadStocks();
      onStockUpdate?.();
    } catch (error: any) {
      toast.error("Failed to reserve stock");
    }
  };

  const getStockStatusBadge = (stock: Stock) => {
    const available = stock.quantity - stock.reserved;
    if (available <= 0) {
      return <Badge variant="destructive">Out of Stock</Badge>;
    } else if (available <= 10) {
      return <Badge variant="secondary">Low Stock</Badge>;
    } else {
      return <Badge variant="default">In Stock</Badge>;
    }
  };

  const getTotalStock = () => {
    return stocks.reduce((total, stock) => total + stock.quantity, 0);
  };

  const getTotalReserved = () => {
    return stocks.reduce((total, stock) => total + stock.reserved, 0);
  };

  const getTotalAvailable = () => {
    return getTotalStock() - getTotalReserved();
  };

  return (
    <div className="space-y-6">
      {/* Stock Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{getTotalStock()}</div>
            <p className="text-sm text-muted-foreground">Total Stock</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">{getTotalReserved()}</div>
            <p className="text-sm text-muted-foreground">Reserved</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{getTotalAvailable()}</div>
            <p className="text-sm text-muted-foreground">Available</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="stocks">Stock Locations</TabsTrigger>
          <TabsTrigger value="history">Stock History</TabsTrigger>
        </TabsList>

        <TabsContent value="stocks">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Stock by Location</CardTitle>
                <Dialog open={createStockDialogOpen} onOpenChange={setCreateStockDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Icon icon="heroicons:plus" className="h-4 w-4 mr-2" />
                      Add Stock Location
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Stock Location</DialogTitle>
                    </DialogHeader>
                    
                    <Form {...createStockForm}>
                      <form onSubmit={createStockForm.handleSubmit(handleCreateStock)} className="space-y-4">
                        <FormField
                          control={createStockForm.control}
                          name="warehouseId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Warehouse *</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select warehouse" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {warehouses.map((warehouse) => (
                                    <SelectItem key={warehouse.id} value={warehouse.id}>
                                      {warehouse.name} - {warehouse.location}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={createStockForm.control}
                          name="quantity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Initial Quantity</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="0"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setCreateStockDialogOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button type="submit" disabled={loading}>
                            {loading && <Icon icon="heroicons:arrow-path" className="h-4 w-4 mr-2 animate-spin" />}
                            Create Stock
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            
            <CardContent>
              {stocks.length === 0 ? (
                <div className="text-center py-8">
                  <Icon icon="heroicons:building-storefront" className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">No stock locations found</p>
                  <Button onClick={() => setCreateStockDialogOpen(true)}>
                    <Icon icon="heroicons:plus" className="h-4 w-4 mr-2" />
                    Add First Stock Location
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Warehouse</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Total Quantity</TableHead>
                      <TableHead>Reserved</TableHead>
                      <TableHead>Available</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stocks.map((stock) => (
                      <TableRow key={stock.id}>
                        <TableCell className="font-medium">
                          {stock.warehouse?.name || 'Unknown'}
                        </TableCell>
                        <TableCell>{stock.warehouse?.location || '-'}</TableCell>
                        <TableCell>{stock.quantity}</TableCell>
                        <TableCell className="text-orange-600">{stock.reserved}</TableCell>
                        <TableCell className="text-green-600">
                          {stock.quantity - stock.reserved}
                        </TableCell>
                        <TableCell>{getStockStatusBadge(stock)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Dialog open={adjustmentDialogOpen} onOpenChange={setAdjustmentDialogOpen}>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelectedStock(stock)}
                                >
                                  <Icon icon="heroicons:adjustments-horizontal" className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Adjust Stock</DialogTitle>
                                </DialogHeader>
                                
                                <Form {...adjustmentForm}>
                                  <form onSubmit={adjustmentForm.handleSubmit(handleStockAdjustment)} className="space-y-4">
                                    <FormField
                                      control={adjustmentForm.control}
                                      name="reason"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Reason *</FormLabel>
                                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                              <SelectTrigger>
                                                <SelectValue />
                                              </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                              <SelectItem value="INBOUND">Inbound (Add Stock)</SelectItem>
                                              <SelectItem value="OUTBOUND">Outbound (Remove Stock)</SelectItem>
                                              <SelectItem value="ADJUSTMENT">Manual Adjustment</SelectItem>
                                              <SelectItem value="RESERVATION">Reserve Stock</SelectItem>
                                              <SelectItem value="CANCEL_RESERVATION">Cancel Reservation</SelectItem>
                                            </SelectContent>
                                          </Select>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />

                                    <FormField
                                      control={adjustmentForm.control}
                                      name="change"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Quantity *</FormLabel>
                                          <FormControl>
                                            <Input
                                              type="number"
                                              min="1"
                                              {...field}
                                              onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />

                                    <FormField
                                      control={adjustmentForm.control}
                                      name="reference"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Reference</FormLabel>
                                          <FormControl>
                                            <Input placeholder="Order #, PO #, etc." {...field} />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />

                                    <div className="flex justify-end gap-2">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setAdjustmentDialogOpen(false)}
                                      >
                                        Cancel
                                      </Button>
                                      <Button type="submit" disabled={loading}>
                                        {loading && <Icon icon="heroicons:arrow-path" className="h-4 w-4 mr-2 animate-spin" />}
                                        Adjust Stock
                                      </Button>
                                    </div>
                                  </form>
                                </Form>
                              </DialogContent>
                            </Dialog>
                            
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                loadStockHistory(stock.id);
                                setActiveTab("history");
                              }}
                            >
                              <Icon icon="heroicons:clock" className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Stock History</CardTitle>
            </CardHeader>
            <CardContent>
              {stockHistory.length === 0 ? (
                <div className="text-center py-8">
                  <Icon icon="heroicons:clock" className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No stock history available</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Quantity Change</TableHead>
                      <TableHead>Reference</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stockHistory.map((history) => (
                      <TableRow key={history.id}>
                        <TableCell>{formatDate(history.createdAt)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{history.reason}</Badge>
                        </TableCell>
                        <TableCell className={history.change > 0 ? "text-green-600" : "text-red-600"}>
                          {history.change > 0 ? '+' : ''}{history.change}
                        </TableCell>
                        <TableCell>{history.reference || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
