"use client";

import { useState } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@iconify/react";
import { Product } from "@/lib/types/product.types";
import { formatPrice, getStockStatus } from "@/lib/utils/product.utils";

interface ProductTableProps {
  products: Product[];
  loading?: boolean;
  onProductSelect?: (product: Product) => void;
  onProductEdit?: (product: Product) => void;
  onProductDelete?: (product: Product) => void;
  onBulkAction?: (action: string, productIds: string[]) => void;
}

export function ProductTable({
  products,
  loading = false,
  onProductSelect,
  onProductEdit,
  onProductDelete,
  onBulkAction,
}: ProductTableProps) {
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(products.map(p => p.id));
    } else {
      setSelectedProducts([]);
    }
  };

  const handleSelectProduct = (productId: string, checked: boolean) => {
    if (checked) {
      setSelectedProducts(prev => [...prev, productId]);
    } else {
      setSelectedProducts(prev => prev.filter(id => id !== productId));
    }
  };

  const handleImageError = (productId: string) => {
    setImageErrors(prev => ({ ...prev, [productId]: true }));
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox disabled />
              </TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Stock Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-20">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <div className="h-4 w-4 bg-muted animate-pulse rounded" />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-muted animate-pulse rounded" />
                    <div className="space-y-1">
                      <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                      <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                </TableCell>
                <TableCell>
                  <div className="h-5 w-20 bg-muted animate-pulse rounded" />
                </TableCell>
                <TableCell>
                  <div className="h-5 w-24 bg-muted animate-pulse rounded" />
                </TableCell>
                <TableCell>
                  <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                </TableCell>
                <TableCell>
                  <div className="h-8 w-8 bg-muted animate-pulse rounded" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Bulk Actions */}
      {selectedProducts.length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
          <span className="text-sm font-medium">
            {selectedProducts.length} product(s) selected
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onBulkAction?.("delete", selectedProducts)}
          >
            <Icon icon="heroicons:trash" className="h-4 w-4 mr-1" />
            Delete Selected
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onBulkAction?.("export", selectedProducts)}
          >
            <Icon icon="heroicons:arrow-down-tray" className="h-4 w-4 mr-1" />
            Export Selected
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedProducts([])}
          >
            Clear Selection
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedProducts.length === products.length && products.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Stock Status</TableHead>
              <TableHead>Variants</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-20">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2">
                    <Icon icon="heroicons:cube-transparent" className="h-12 w-12 text-muted-foreground" />
                    <p className="text-muted-foreground">No products found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => {
                const stockStatus = getStockStatus(product.stocks);
                const isSelected = selectedProducts.includes(product.id);
                
                return (
                  <TableRow
                    key={product.id}
                    className={`cursor-pointer hover:bg-muted/50 ${isSelected ? 'bg-muted/30' : ''}`}
                    onClick={() => onProductSelect?.(product)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => handleSelectProduct(product.id, !!checked)}
                      />
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10 rounded-md overflow-hidden bg-muted">
                          {product.imageUrl && !imageErrors[product.id] ? (
                            <Image
                              src={product.imageUrl}
                              alt={product.name}
                              fill
                              className="object-cover"
                              onError={() => handleImageError(product.id)}
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <Icon
                                icon="heroicons:photo"
                                className="h-5 w-5 text-muted-foreground"
                              />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{product.name}</div>
                          {product.description && (
                            <div className="text-sm text-muted-foreground line-clamp-1">
                              {product.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell className="font-medium">
                      {formatPrice(product.basePrice)}
                    </TableCell>
                    
                    <TableCell>
                      <Badge className={product.hasVariants ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}>
                        {product.hasVariants ? "With Variants" : "Simple"}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <Badge className={
                        stockStatus.color === "success" ? "bg-green-100 text-green-800" :
                        stockStatus.color === "warning" ? "bg-yellow-100 text-yellow-800" :
                        "bg-red-100 text-red-800"
                      }>
                        {stockStatus.label}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      {product.hasVariants ? (
                        <span className="text-sm text-muted-foreground">
                          {product.variants?.length || 0} variants
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(product.createdAt)}
                    </TableCell>
                    
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Icon icon="heroicons:ellipsis-horizontal" className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onProductSelect?.(product)}>
                            <Icon icon="heroicons:eye" className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onProductEdit?.(product)}>
                            <Icon icon="heroicons:pencil" className="h-4 w-4 mr-2" />
                            Edit Product
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onProductDelete?.(product)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Icon icon="heroicons:trash" className="h-4 w-4 mr-2" />
                            Delete Product
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
