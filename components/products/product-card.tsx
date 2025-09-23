"use client";

import { useState } from "react";
import Image from "next/image";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@iconify/react";
import { Product } from "@/lib/types/product.types";
import { cn } from "@/lib/utils/ui.utils";

interface ProductCardProps {
  product: Product;
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
  onView?: (product: Product) => void;
  showActions?: boolean;
  className?: string;
}

export function ProductCard({
  product,
  onEdit,
  onDelete,
  onView,
  showActions = true,
  className,
}: ProductCardProps) {
  const [imageError, setImageError] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  const getStockStatus = () => {
    if (!product.stocks || product.stocks.length === 0) {
      return { status: "out_of_stock", label: "Out of Stock", color: "destructive" };
    }

    const totalStock = product.stocks.reduce((sum, stock) => sum + stock.quantity, 0);
    const totalReserved = product.stocks.reduce((sum, stock) => sum + stock.reserved, 0);
    const availableStock = totalStock - totalReserved;

    if (availableStock <= 0) {
      return { status: "out_of_stock", label: "Out of Stock", color: "destructive" };
    } else if (availableStock <= 10) {
      return { status: "low_stock", label: "Low Stock", color: "warning" };
    } else {
      return { status: "in_stock", label: "In Stock", color: "success" };
    }
  };

  const stockStatus = getStockStatus();

  return (
    <Card className={cn("group hover:shadow-lg transition-shadow duration-200", className)}>
      <CardContent className="p-4">
        {/* Product Image */}
        <div className="relative aspect-square mb-4 overflow-hidden rounded-lg bg-muted">
          {product.imageUrl && !imageError ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-200 group-hover:scale-105"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Icon
                icon="heroicons:photo"
                className="h-12 w-12 text-muted-foreground"
              />
            </div>
          )}
          
          {/* Stock Status Badge */}
          <Badge
            color={stockStatus.color as any}
            className="absolute top-2 right-2"
          >
            {stockStatus.label}
          </Badge>

          {/* Variants Badge */}
          {product.hasVariants && (
            <Badge color="secondary"  className="absolute top-2 left-2">
              <Icon icon="heroicons:squares-2x2" className="h-3 w-3 mr-1" />
              Variants
            </Badge>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-2">
          <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          
          {product.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {product.description}
            </p>
          )}

          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-primary">
              {formatPrice(product.basePrice)}
            </span>
            
            {product.hasVariants && (
              <span className="text-xs text-muted-foreground">
                {product.variants?.length || 0} variants
              </span>
            )}
          </div>

          {/* Stock Information */}
          {product.stocks && product.stocks.length > 0 && (
            <div className="text-xs text-muted-foreground">
              Total Stock: {product.stocks.reduce((sum, stock) => sum + stock.quantity, 0)}
              {product.stocks.reduce((sum, stock) => sum + stock.reserved, 0) > 0 && (
                <span className="ml-2">
                  (Reserved: {product.stocks.reduce((sum, stock) => sum + stock.reserved, 0)})
                </span>
              )}
            </div>
          )}
        </div>
      </CardContent>

      {showActions && (
        <CardFooter className="p-4 pt-0 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onView?.(product)}
          >
            <Icon icon="heroicons:eye" className="h-4 w-4 mr-2" />
            View
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Icon icon="heroicons:ellipsis-horizontal" className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView?.(product)}>
                <Icon icon="heroicons:eye" className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit?.(product)}>
                <Icon icon="heroicons:pencil" className="h-4 w-4 mr-2" />
                Edit Product
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete?.(product)}
                className="text-destructive focus:text-destructive"
              >
                <Icon icon="heroicons:trash" className="h-4 w-4 mr-2" />
                Delete Product
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardFooter>
      )}
    </Card>
  );
}
