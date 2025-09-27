"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Icon } from "@iconify/react";
import { Product, ProductVariant, Stock } from "@/lib/types/product.types";
import { productApi } from "@/lib/api/clients/product.client";
import { formatPrice, formatDate, getStockSummary } from "@/lib/utils/product.utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { VariantManagement } from "./variant-management";
import { StockManagement } from "./stock-management";
import { ProductStockDetails } from "./product-stock-details";
import { DefectiveStockManager } from "@/components/stock/defective-stock-manager";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";

interface ProductDetailProps {
  productId: string;
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
  onClose?: () => void;
}

export function ProductDetail({
  productId,
  onEdit,
  onDelete,
  onClose,
}: ProductDetailProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [showDefectiveManager, setShowDefectiveManager] = useState(false);

  useEffect(() => {
    loadProduct();
  }, [productId]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      setError(null);
      const productData = await productApi.getProduct(productId, {
        includeVariants: true,
        warehouse: true,
        includeStocks: true,
      });
      setProduct(productData);
    } catch (err: any) {
      setError(err.message || 'Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStockSummary = () => {
    if (!product?.stocks || product.stocks.length === 0) {
      return { total: 0, reserved: 0, available: 0, defective: 0};
    }

    const total = product.stocks.reduce((sum, stock) => sum + stock.quantity, 0);
    const reserved = product.stocks.reduce((sum, stock) => sum + stock.reserved, 0);
    const defective = product.stocks.reduce((sum, stock) => sum + stock.defective, 0);
    const available = total - reserved;

    return { total, reserved, available, defective };
  };

  const handleManageDefective = (stock: Stock) => {
    setSelectedStock(stock);
    setShowDefectiveManager(true);
  };

  const handleStockUpdate = (updatedStock: Stock) => {
    // Update the stock in the product
    if (product?.stocks) {
      const updatedStocks = product.stocks.map(stock =>
        stock.id === updatedStock.id ? updatedStock : stock
      );
      setProduct({ ...product, stocks: updatedStocks });
    }
    setShowDefectiveManager(false);
    setSelectedStock(null);
    // Optionally reload for accuracy
    loadProduct();
  };

  const getStockStatus = () => {
    const { available } = getStockSummary();
    
    if (available <= 0) {
      return { status: "out_of_stock", label: "Out of Stock", color: "destructive" };
    } else if (available <= 10) {
      return { status: "low_stock", label: "Low Stock", color: "warning" };
    } else {
      return { status: "in_stock", label: "In Stock", color: "success" };
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-20" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="aspect-square rounded-lg" />
          <div className="space-y-4">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-8 w-32" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <Icon icon="heroicons:exclamation-triangle" className="h-16 w-16 mx-auto mb-4 text-destructive" />
          <h3 className="text-lg font-semibold mb-2">Error loading product</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={loadProduct}>
            <Icon icon="heroicons:arrow-path" className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!product) {
    return null;
  }

  const stockStatus = getStockStatus();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <Icon icon="heroicons:arrow-left" className="h-4 w-4" />
            </Button>
          )}
          <div>
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <p className="text-muted-foreground">Product Details</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => onEdit?.(product)}>
            <Icon icon="heroicons:pencil" className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="shadow" onClick={() => onDelete?.(product)}>
            <Icon icon="heroicons:trash" className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Image */}
        <Card>
          <CardContent className="p-6">
            <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
              {product.imageUrl && !imageError ? (
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  fill
                  className="object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Icon
                    icon="heroicons:photo"
                    className="h-24 w-24 text-muted-foreground"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Product Information */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Price:</span>
                <span className="text-2xl font-bold text-primary">
                  {formatPrice(product.basePrice)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Type:</span>
                <Badge color={product.hasVariants ? "default" : "secondary"}>
                  {product.hasVariants ? "With Variants" : "Simple Product"}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Stock Status:</span>
                <Badge color={stockStatus.color as any}>
                  {stockStatus.label}
                </Badge>
              </div>

              {product.description && (
                <div>
                  <span className="text-sm font-medium">Description:</span>
                  <p className="text-sm text-muted-foreground mt-1">
                    {product.description}
                  </p>
                </div>
              )}

              <Separator />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Created:</span>
                  <p className="text-muted-foreground">
                    {formatDate(product.createdAt)}
                  </p>
                </div>
                <div>
                  <span className="font-medium">Updated:</span>
                  <p className="text-muted-foreground">
                    {formatDate(product.updatedAt)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* Detailed Information Tabs */}
      <Tabs defaultValue="stock" className="w-full">
        <TabsList>
          <TabsTrigger value="stock">
            Stock Overview ({product.stocks?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="variants">
            Variants ({product.variants?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="legacy-stock">
            Legacy Stock Management
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stock" className="space-y-4">
          <ProductStockDetails
            product={product}
            stocks={product.stocks || []}
            onUpdateStock={handleStockUpdate}
          />
        </TabsContent>

        <TabsContent value="variants" className="space-y-4">
          <VariantManagement
            product={product}
            onVariantUpdate={loadProduct}
          />
        </TabsContent>

        <TabsContent value="legacy-stock" className="space-y-4">
          <StockManagement
            product={product}
            onStockUpdate={loadProduct}
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
