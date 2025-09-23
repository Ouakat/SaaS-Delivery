"use client";

import { WarehouseForm } from "@/components/warehouses/warehouse-form";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";

interface WarehouseCreatePageProps {
  params: {
    locale: string;
  };
}

export default function WarehouseCreatePage({ params }: WarehouseCreatePageProps) {
  const router = useRouter();

  const handleSave = (warehouseId: string) => {
    // Navigate to the newly created warehouse detail page
    router.push(`/${params.locale}/warehouses/${warehouseId}`);
  };

  const handleCancel = () => {
    router.push(`/${params.locale}/warehouses`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Create Warehouse</h1>
          <p className="text-muted-foreground">
            Add a new warehouse location to your inventory system
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
            mode="create"
            onSave={handleSave}
            onCancel={handleCancel}
          />
        </CardContent>
      </Card>
    </div>
  );
}
