"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Icon } from "@iconify/react";
import { format } from "date-fns";
import { cn } from "@/lib/utils/ui.utils";
import {
  Expedition,
  UpdateExpeditionDto,
  TransportMode,
  TRANSPORT_MODE_LABELS,
} from "@/lib/types/expedition.types";
import { warehouseApi } from "@/lib/api/clients/warehouse.client";
import { usersApiClient } from "@/lib/api/clients/auth/users.client";
import { toast } from "sonner";

const schema = z.object({
  warehouseId: z.string().min(1, "Warehouse is required"),
  sellerId: z.string().min(1, "Seller is required"),
  sellerSnapshot: z.any().optional(),
  arrivalDate: z.string().min(1, "Arrival date is required"),
  transportMode: z.string().min(1, "Transport mode is required"),
  trackingNumber: z.string().optional(),
  numberOfPackages: z.number().min(1, "Number of packages must be at least 1"),
  weight: z.number().optional(),
  generalNotes: z.string().optional(),
});

interface ExpeditionEditFormProps {
  expedition: Expedition;
  onSubmit: (data: UpdateExpeditionDto) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ExpeditionEditForm({
  expedition,
  onSubmit,
  onCancel,
  loading = false,
}: ExpeditionEditFormProps) {
  const [arrivalDate, setArrivalDate] = useState<Date | undefined>(
    expedition.arrivalDate ? new Date(expedition.arrivalDate) : undefined
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      warehouseId: expedition.warehouseId,
      sellerId: expedition.sellerId,
      sellerSnapshot: expedition.sellerSnapshot,
      arrivalDate: expedition.arrivalDate,
      transportMode: expedition.transportMode,
      trackingNumber: expedition.trackingNumber || "",
      numberOfPackages: expedition.numberOfPackages,
      weight: expedition.weight || undefined,
      generalNotes: expedition.generalNotes || "",
    },
  });

  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [sellers, setSellers] = useState<any[]>([]);
  const [isLoadingWarehouses, setIsLoadingWarehouses] = useState(true);
  const [isLoadingSellers, setIsLoadingSellers] = useState(true);

  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const response = await warehouseApi.getWarehouses();
        //@ts-ignore
        setWarehouses(response.data?.data || []);
      } catch (error) {
        console.error('Failed to fetch warehouses:', error);
        toast.error('Failed to load warehouses');
      } finally {
        setIsLoadingWarehouses(false);
      }
    };

    const fetchSellers = async () => {
      try {
        //@ts-ignore
        const response = await usersApiClient.getUsers({ userType: "SELLER" });
        //@ts-ignore
        setSellers(response.data[0]?.data || []);
      } catch (error) {
        console.error('Failed to fetch sellers:', error);
        toast.error('Failed to load sellers');
      } finally {
        setIsLoadingSellers(false);
      }
    };

    fetchWarehouses();
    fetchSellers();
  }, []);

  const onFormSubmit = (data: any) => {
    const updateData: UpdateExpeditionDto = {
      warehouseId: data.warehouseId,
      sellerId: data.sellerId,
      sellerSnapshot: data.sellerSnapshot,
      arrivalDate: arrivalDate?.toISOString(),
      transportMode: data.transportMode as TransportMode,
      trackingNumber: data.trackingNumber || undefined,
      numberOfPackages: data.numberOfPackages,
      weight: data.weight || undefined,
      generalNotes: data.generalNotes || undefined,
    };

    onSubmit(updateData);
  };

  const transportModes: TransportMode[] = ["air", "sea", "road", "rail", "courier"];

  // Check if expedition can be edited
  const canEdit = expedition.status !== "received" && expedition.status !== "cancelled";

  if (!canEdit) {
    return (
      <div className="text-center py-8">
        <Icon icon="heroicons:lock-closed" className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Cannot Edit Expedition</h3>
        <p className="text-muted-foreground mb-4">
          This expedition cannot be edited because it has been {expedition.status}.
        </p>
        <Button variant="outline" onClick={onCancel}>
          Back to Details
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="warehouseId">Warehouse *</Label>
          <Select
            value={watch("warehouseId")}
            onValueChange={(value) => setValue("warehouseId", value)}
            disabled={isLoadingWarehouses}
          >
            <SelectTrigger id="warehouseId">
              <SelectValue placeholder={isLoadingWarehouses ? "Loading..." : "Select warehouse"} />
            </SelectTrigger>
            <SelectContent>
              {warehouses.map((warehouse) => (
                <SelectItem key={warehouse.id} value={warehouse.id}>
                  <div className="flex flex-col">
                    <span>{warehouse.name}</span>
                    {warehouse.location && (
                      <span className="text-xs text-muted-foreground">
                        {warehouse.location}
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.warehouseId && (
            <p className="text-xs text-destructive">{errors.warehouseId.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="sellerId">Seller *</Label>
          <Select
            value={watch("sellerId")}
            onValueChange={(value) => {
              const selectedSeller = sellers.find(s => s.id === value);
              if (selectedSeller) {
                setValue("sellerSnapshot", {
                  id: selectedSeller.id,
                  name: selectedSeller.name,
                  email: selectedSeller.email,
                  phone: selectedSeller.phone,
                  avatar: selectedSeller.avatar
                });
              }
              setValue("sellerId", value);
            }}
            disabled={isLoadingSellers}
          >
            <SelectTrigger id="sellerId">
              <SelectValue placeholder={isLoadingSellers ? "Loading..." : "Select seller"} />
            </SelectTrigger>
            <SelectContent>
              {sellers?.map((seller) => (
                <SelectItem key={seller.id} value={seller.id}>
                  <div className="flex flex-col">
                    <span>{seller.name || seller.email}</span>
                    {seller.email && (
                      <span className="text-xs text-muted-foreground">
                        {seller.email}
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.sellerId && (
            <p className="text-xs text-destructive">{errors.sellerId.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="arrivalDate">Arrival Date *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="arrivalDate"
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !arrivalDate && "text-muted-foreground"
                )}
              >
                <Icon icon="heroicons:calendar" className="mr-2 h-4 w-4" />
                {arrivalDate ? format(arrivalDate, "PPP") : "Select date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={arrivalDate}
                onSelect={(date) => {
                  setArrivalDate(date);
                  setValue("arrivalDate", date?.toISOString() || "");
                }}
                initialFocus
                disabled={(date) => date < new Date()}
              />
            </PopoverContent>
          </Popover>
          {errors.arrivalDate && (
            <p className="text-xs text-destructive">{errors.arrivalDate.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="transportMode">Transport Mode *</Label>
          <Select
            value={watch("transportMode")}
            onValueChange={(value) => setValue("transportMode", value as TransportMode)}
          >
            <SelectTrigger id="transportMode">
              <SelectValue placeholder="Select transport mode" />
            </SelectTrigger>
            <SelectContent>
              {transportModes.map((mode) => (
                <SelectItem key={mode} value={mode}>
                  {TRANSPORT_MODE_LABELS[mode]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.transportMode && (
            <p className="text-xs text-destructive">{errors.transportMode.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="trackingNumber">Tracking Number</Label>
          <Input
            id="trackingNumber"
            placeholder="Enter tracking number"
            {...register("trackingNumber")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="numberOfPackages">Number of Packages *</Label>
          <Input
            id="numberOfPackages"
            type="number"
            min="1"
            placeholder="Enter number of packages"
            {...register("numberOfPackages", { valueAsNumber: true })}
          />
          {errors.numberOfPackages && (
            <p className="text-xs text-destructive">{errors.numberOfPackages.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="weight">Weight (kg)</Label>
          <Input
            id="weight"
            type="number"
            step="0.01"
            placeholder="Enter weight"
            {...register("weight", { valueAsNumber: true })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="generalNotes">General Notes</Label>
        <Textarea
          id="generalNotes"
          placeholder="Enter any additional notes..."
          rows={4}
          {...register("generalNotes")}
        />
      </div>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading || !isDirty}>
          {loading ? (
            <>
              <Icon icon="heroicons:arrow-path" className="mr-2 h-4 w-4 animate-spin" />
              Updating...
            </>
          ) : (
            <>
              <Icon icon="heroicons:check" className="mr-2 h-4 w-4" />
              Update Expedition
            </>
          )}
        </Button>
      </div>
    </form>
  );
}