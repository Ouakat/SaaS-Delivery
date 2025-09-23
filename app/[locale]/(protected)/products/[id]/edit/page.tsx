"use client";

import { useState, useEffect } from "react";
import { ProductForm } from "@/components/products/product-form";
import { productApi } from "@/lib/api/clients/product.client";
import { Product } from "@/lib/types/product.types";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";

interface EditProductPageProps {
  params: {
    id: string;
    locale: string;
  };
}

export default function EditProductPage({ params }: EditProductPageProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProduct();
  }, [params.id]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      setError(null);
      const productData = await productApi.getProduct(params.id);
      setProduct(productData);
    } catch (err: any) {
      setError(err.message || 'Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
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
      </div>
    );
  }

  if (!product) {
    return null;
  }

  return <ProductForm product={product} />;
}
