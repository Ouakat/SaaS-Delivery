"use client";

import { ProductDetail } from "@/components/products/product-detail";
import { useRouter } from "next/navigation";

interface ProductDetailPageProps {
  params: {
    id: string;
    locale: string;
  };
}

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  const router = useRouter();

  const handleEdit = () => {
    router.push(`/${params.locale}/products/${params.id}/edit`);
  };

  const handleDelete = () => {
    // TODO: Implement delete with confirmation
    console.log("Delete product:", params.id);
  };

  const handleClose = () => {
    router.push(`/${params.locale}/products`);
  };

  return (
    <ProductDetail
      productId={params.id}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onClose={handleClose}
    />
  );
}
