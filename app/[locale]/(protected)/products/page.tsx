"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProductList } from "@/components/products/product-list";
import { ProductDetail } from "@/components/products/product-detail";
import { Product } from "@/lib/types/product.types";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";

export default function ProductsPage() {
  const router = useRouter();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const handleProductSelect = (product: Product) => {
    router.push(`/products/${product.id}`);
  };

  const handleProductEdit = (product: Product) => {
    router.push(`/products/${product.id}/edit`);
  };

  const handleProductDelete = (product: Product) => {
    // TODO: Implement product delete functionality
    console.log("Delete product:", product);
  };

  const handleCreateProduct = () => {
    router.push("/products/create");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-muted-foreground">
            Manage your product catalog and inventory
          </p>
        </div>
        <Button onClick={handleCreateProduct}>
          <Icon icon="heroicons:plus" className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      <ProductList
        onProductSelect={handleProductSelect}
        onProductEdit={handleProductEdit}
        onProductDelete={handleProductDelete}
        showFilters={true}
        showPagination={true}
      />
    </div>
  );
}
