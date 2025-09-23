"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import { warehouseApi } from "@/lib/api/clients/warehouse.client";
import { productApi } from "@/lib/api/clients/product.client";
import { Product, ProductVariant } from "@/lib/types/product.types";
import { StockMovementFormData } from "@/lib/types/warehouse.types";

const stockMovementSchema = z.object({
  productId: z.string().optional(),
  variantId: z.string().optional(),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  reason: z.enum(['INBOUND', 'OUTBOUND', 'ADJUSTMENT', 'TRANSFER']),
  reference: z.string().optional(),
  notes: z.string().optional(),
}).refine(data => data.productId || data.variantId, {
  message: "Either product or variant must be selected",
  path: ["productId"],
});

interface StockMovementFormProps {
  warehouseId: string;
  onMovementComplete?: () => void;
}

export function StockMovementForm({
  warehouseId,
  onMovementComplete,
}: StockMovementFormProps) {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<StockMovementFormData>({
    resolver: zodResolver(stockMovementSchema),
    defaultValues: {
      quantity: 1,
      reason: 'INBOUND',
    },
  });

  const watchedReason = watch('reason');
  const watchedProductId = watch('productId');

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (watchedProductId) {
      loadVariants(watchedProductId);
      setSelectedProduct(watchedProductId);
    } else {
      setVariants([]);
      setSelectedProduct("");
    }
  }, [watchedProductId]);

  const loadProducts = async () => {
    try {
      const response = await productApi.getProducts({ 
        take: 100,
        includeVariants: true 
      });
      setProducts(response.data);
    } catch (error: any) {
      toast.error('Failed to load products');
      console.error('Error loading products:', error);
    }
  };

  const loadVariants = async (productId: string) => {
    try {
      const response = await productApi.getVariantsByProduct(productId);
      setVariants(response.data);
    } catch (error: any) {
      console.error('Error loading variants:', error);
      setVariants([]);
    }
  };

  const onSubmit = async (data: StockMovementFormData) => {
    try {
      setLoading(true);

      await warehouseApi.createStockMovement(warehouseId, {
        warehouseId,
        productId: data.productId || undefined,
        variantId: data.variantId || undefined,
        quantity: data.reason === 'OUTBOUND' ? -data.quantity : data.quantity,
        reason: data.reason,
        reference: data.reference || undefined,
        notes: data.notes || undefined,
      });

      toast.success('Stock movement recorded successfully');
      reset();
      onMovementComplete?.();
    } catch (error: any) {
      toast.error(error.message || 'Failed to record stock movement');
      console.error('Error creating stock movement:', error);
    } finally {
      setLoading(false);
    }
  };

  const getReasonIcon = (reason: string) => {
    switch (reason) {
      case 'INBOUND':
        return 'heroicons:arrow-down-tray';
      case 'OUTBOUND':
        return 'heroicons:arrow-up-tray';
      case 'ADJUSTMENT':
        return 'heroicons:adjustments-horizontal';
      case 'TRANSFER':
        return 'heroicons:arrow-right-circle';
      default:
        return 'heroicons:cube';
    }
  };

  const getReasonDescription = (reason: string) => {
    switch (reason) {
      case 'INBOUND':
        return 'Add stock to warehouse (receiving, restocking)';
      case 'OUTBOUND':
        return 'Remove stock from warehouse (sales, shipments)';
      case 'ADJUSTMENT':
        return 'Adjust stock levels (corrections, damages)';
      case 'TRANSFER':
        return 'Transfer stock between warehouses';
      default:
        return '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon icon="heroicons:clipboard-document-list" className="h-5 w-5" />
          Record Stock Movement
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Movement Type */}
          <div className="space-y-2">
            <Label>Movement Type</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {(['INBOUND', 'OUTBOUND', 'ADJUSTMENT', 'TRANSFER'] as const).map((reason) => (
                <Button
                  key={reason}
                  type="button"
                  variant={watchedReason === reason ? "default" : "outline"}
                  className="flex flex-col items-center gap-2 h-auto py-4"
                  onClick={() => setValue('reason', reason)}
                >
                  <Icon icon={getReasonIcon(reason)} className="h-6 w-6" />
                  <span className="text-xs font-medium">{reason}</span>
                </Button>
              ))}
            </div>
            {watchedReason && (
              <p className="text-xs text-muted-foreground">
                {getReasonDescription(watchedReason)}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Product Selection */}
            <div className="space-y-2">
              <Label htmlFor="productId">Product</Label>
              <Select
                value={watchedProductId || undefined}
                onValueChange={(value) => {
                  setValue('productId', value || undefined);
                  setValue('variantId', undefined); // Reset variant when product changes
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.productId && (
                <p className="text-sm text-destructive">{errors.productId.message}</p>
              )}
            </div>

            {/* Variant Selection */}
            <div className="space-y-2">
              <Label htmlFor="variantId">Variant (Optional)</Label>
              <Select
                value={watch('variantId') || undefined}
                onValueChange={(value) => setValue('variantId', value || undefined)}
                disabled={!selectedProduct || variants.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    !selectedProduct 
                      ? "Select a product first" 
                      : variants.length === 0 
                        ? "No variants available"
                        : "Select a variant"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {variants.map((variant) => (
                    <SelectItem key={variant.id} value={variant.id}>
                      {variant.name} ({variant.sku})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Quantity */}
            <div className="space-y-2">
              <Label htmlFor="quantity">
                Quantity <span className="text-destructive">*</span>
              </Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                placeholder="Enter quantity"
                {...register('quantity', { valueAsNumber: true })}
              />
              {errors.quantity && (
                <p className="text-sm text-destructive">{errors.quantity.message}</p>
              )}
            </div>

            {/* Reference */}
            <div className="space-y-2">
              <Label htmlFor="reference">Reference</Label>
              <Input
                id="reference"
                placeholder="Order ID, PO number, etc."
                {...register('reference')}
              />
              <p className="text-xs text-muted-foreground">
                Optional reference number or identifier
              </p>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes about this movement..."
              rows={3}
              {...register('notes')}
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {watchedReason === 'OUTBOUND' && (
                <div className="flex items-center gap-2 text-orange-600">
                  <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
                  This will reduce stock levels
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => reset()}
                disabled={loading}
              >
                Reset
              </Button>
              <Button
                type="submit"
                disabled={loading}
              >
                {loading && (
                  <Icon icon="heroicons:arrow-path" className="h-4 w-4 mr-2 animate-spin" />
                )}
                Record Movement
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
