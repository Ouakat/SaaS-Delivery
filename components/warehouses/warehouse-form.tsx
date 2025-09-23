"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import { warehouseApi } from "@/lib/api/clients/warehouse.client";
import { Warehouse } from "@/lib/types/product.types";
import { WarehouseFormData } from "@/lib/types/warehouse.types";

const warehouseSchema = z.object({
  name: z.string().min(1, "Warehouse name is required").max(100, "Name must be less than 100 characters"),
  location: z.string().max(200, "Location must be less than 200 characters").optional(),
});

interface WarehouseFormProps {
  warehouseId?: string;
  mode: 'create' | 'edit';
  onSave: (warehouseId: string) => void;
  onCancel: () => void;
}

export function WarehouseForm({
  warehouseId,
  mode,
  onSave,
  onCancel,
}: WarehouseFormProps) {
  const [loading, setLoading] = useState(false);
  const [warehouse, setWarehouse] = useState<Warehouse | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    setValue,
  } = useForm<WarehouseFormData>({
    resolver: zodResolver(warehouseSchema),
    defaultValues: {
      name: '',
      location: '',
    },
  });

  // Load warehouse data for edit mode
  useEffect(() => {
    if (mode === 'edit' && warehouseId) {
      loadWarehouse();
    }
  }, [mode, warehouseId]);

  const loadWarehouse = async () => {
    if (!warehouseId) return;

    try {
      setLoading(true);
      const warehouseData = await warehouseApi.getWarehouse(warehouseId);
      setWarehouse(warehouseData);
      
      // Populate form with existing data
      setValue('name', warehouseData.name);
      setValue('location', warehouseData.location || '');
    } catch (error: any) {
      toast.error('Failed to load warehouse data');
      console.error('Error loading warehouse:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: WarehouseFormData) => {
    try {
      setLoading(true);

      let result: Warehouse;
      
      if (mode === 'create') {
        result = await warehouseApi.createWarehouse({
          name: data.name,
          tenantId: '550e8400-e29b-41d4-a716-446655440001',
          location: data.location || undefined,
        });
        toast.success('Warehouse created successfully');
      } else {
        if (!warehouseId) throw new Error('Warehouse ID is required for edit mode');
        
        result = await warehouseApi.updateWarehouse(warehouseId, {
          name: data.name,
          location: data.location || undefined,
        });
        toast.success('Warehouse updated successfully');
      }

      onSave(result.id);
    } catch (error: any) {
      toast.error(error.message || `Failed to ${mode} warehouse`);
      console.error(`Error ${mode}ing warehouse:`, error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (mode === 'create') {
      reset();
    } else if (warehouse) {
      setValue('name', warehouse.name);
      setValue('location', warehouse.location || '');
    }
  };

  if (mode === 'edit' && loading && !warehouse) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center gap-2">
          <Icon icon="heroicons:arrow-path" className="h-5 w-5 animate-spin" />
          <span>Loading warehouse data...</span>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">
            Warehouse Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            placeholder="Enter warehouse name"
            {...register('name')}
            error={errors.name?.message}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Textarea
            id="location"
            placeholder="Enter warehouse location or address"
            rows={3}
            {...register('location')}
          />
          {errors.location && (
            <p className="text-sm text-destructive">{errors.location.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Optional: Provide the physical address or location details
          </p>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-between pt-6 border-t">
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            disabled={loading || !isDirty}
          >
            <Icon icon="heroicons:arrow-path" className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
          >
            {loading && (
              <Icon icon="heroicons:arrow-path" className="h-4 w-4 mr-2 animate-spin" />
            )}
            {mode === 'create' ? 'Create Warehouse' : 'Update Warehouse'}
          </Button>
        </div>
      </div>

      {/* Help Text */}
      <div className="text-sm text-muted-foreground bg-muted p-4 rounded-lg">
        <div className="flex items-start gap-2">
          <Icon icon="heroicons:information-circle" className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium mb-1">Warehouse Information</p>
            <ul className="space-y-1 text-xs">
              <li>• Warehouse name should be unique and descriptive</li>
              <li>• Location helps identify the physical warehouse</li>
              <li>• You can manage stock levels after creating the warehouse</li>
            </ul>
          </div>
        </div>
      </div>
    </form>
  );
}
