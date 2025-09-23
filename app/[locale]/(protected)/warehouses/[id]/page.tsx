"use client";

import { WarehouseDetail } from "@/components/warehouses/warehouse-detail";
import { useRouter } from "next/navigation";

interface WarehouseDetailPageProps {
  params: {
    id: string;
    locale: string;
  };
}

export default function WarehouseDetailPage({ params }: WarehouseDetailPageProps) {
  const router = useRouter();

  const handleEdit = () => {
    router.push(`/${params.locale}/warehouses/${params.id}/edit`);
  };

  const handleDelete = () => {
    // TODO: Implement delete with confirmation
    console.log("Delete warehouse:", params.id);
  };

  const handleClose = () => {
    router.push(`/${params.locale}/warehouses`);
  };

  return (
    <WarehouseDetail
      warehouseId={params.id}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onClose={handleClose}
    />
  );
}
