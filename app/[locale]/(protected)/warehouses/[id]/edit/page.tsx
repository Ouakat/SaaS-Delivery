"use client";

import { WarehouseForm } from "@/components/warehouses/warehouse-form";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";

interface WarehouseEditPageProps {
  params: {
    id: string;
    locale: string;
  };
}

export default function WarehouseEditPage({ params }: WarehouseEditPageProps) {
  const router = useRouter();

  const handleSave = () => {
    // Navigation will be handled by the form component after successful save
    router.push(`/${params.locale}/warehouses/${params.id}`);
  };

  const handleCancel = () => {
    router.push(`/${params.locale}/warehouses/${params.id}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Edit Warehouse</h1>
          <p className="text-muted-foreground">
            Update warehouse information and settings
          </p>
        </div>
        <Button variant="outline" onClick={handleCancel}>
          <Icon icon="heroicons:x-mark" className="h-4 w-4 mr-2" />
          Cancel
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Warehouse Details</CardTitle>
        </CardHeader>
        <CardContent>
          <WarehouseForm
            warehouseId={params.id}
            mode="edit"
            onSave={handleSave}
            onCancel={handleCancel}
          />
        </CardContent>
      </Card>
    </div>
  );
}
