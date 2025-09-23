"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { WarehouseList } from "@/components/warehouses/warehouse-list";
import { Warehouse } from "@/lib/types/product.types";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";

export default function WarehousesPage() {
  const router = useRouter();

  const handleWarehouseSelect = (warehouse: Warehouse) => {
    router.push(`/warehouses/${warehouse.id}`);
  };

  const handleWarehouseEdit = (warehouse: Warehouse) => {
    router.push(`/warehouses/${warehouse.id}/edit`);
  };

  const handleWarehouseDelete = (warehouse: Warehouse) => {
    // TODO: Implement warehouse delete functionality
    console.log("Delete warehouse:", warehouse);
  };

  const handleCreateWarehouse = () => {
    router.push("/warehouses/create");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Warehouses</h1>
          <p className="text-muted-foreground">
            Manage your warehouse locations and inventory
          </p>
        </div>
        <Button onClick={handleCreateWarehouse}>
          <Icon icon="heroicons:plus" className="h-4 w-4 mr-2" />
          Add Warehouse
        </Button>
      </div>

      <WarehouseList
        onWarehouseSelect={handleWarehouseSelect}
        onWarehouseEdit={handleWarehouseEdit}
        onWarehouseDelete={handleWarehouseDelete}
        showFilters={true}
        showPagination={true}
      />
    </div>
  );
}
