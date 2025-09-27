"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils/ui.utils";
import {
  Expedition,
  ReceiveExpeditionDto,
  ReceiveExpeditionItem,
} from "@/lib/types/expedition.types";

const receiveItemSchema = z.object({
  itemId: z.string(),
  quantity_received: z.number().min(0),
  quantity_defective: z.number().min(0),
  notes: z.string().optional(),
  photoUrls: z.array(z.string()).optional(),
});

const receiveSchema = z.object({
  items: z.array(receiveItemSchema),
  receivedBy: z.string().min(1, "Receiver is required"),
  generalNotes: z.string().optional(),
}).refine((data) => {
  return data.items.every(item => {
    const total = item.quantity_received + item.quantity_defective;
    return total > 0;
  });
}, {
  message: "Each item must have at least some quantity received or marked as defective",
  path: ["items"],
});

interface ExpeditionReceiveFormProps {
  expedition: Expedition;
  onSubmit: (data: ReceiveExpeditionDto) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ExpeditionReceiveForm({
  expedition,
  onSubmit,
  onCancel,
  loading = false,
}: ExpeditionReceiveFormProps) {
  const [showDiscrepancies, setShowDiscrepancies] = useState(false);

  const { register, control, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(receiveSchema),
    defaultValues: {
      items: expedition.items?.map(item => ({
        itemId: item.id,
        quantity_received: 0,
        quantity_defective: 0,
        notes: "",
        photoUrls: [],
      })) || [],
      receivedBy: "",
      generalNotes: "",
    },
  });

  const { fields } = useFieldArray({
    control,
    name: "items",
  });

  const watchedItems = watch("items");

  const calculateItemStats = (index: number, expeditionItem: any) => {
    const received = watchedItems[index]?.quantity_received || 0;
    const defective = watchedItems[index]?.quantity_defective || 0;
    const sent = expeditionItem.quantity_sent;
    const total = received + defective;
    const discrepancy = sent - total;
    const defectiveRate = total > 0 ? (defective / total) * 100 : 0;

    return {
      received,
      defective,
      sent,
      total,
      discrepancy,
      defectiveRate,
      hasDiscrepancy: discrepancy !== 0,
      exceedsExpected: total > sent,
    };
  };

  const getOverallStats = () => {
    const stats = expedition.items?.map((item, index) =>
      calculateItemStats(index, item)
    ) || [];

    const totalSent = stats.reduce((sum, stat) => sum + stat.sent, 0);
    const totalReceived = stats.reduce((sum, stat) => sum + stat.received, 0);
    const totalDefective = stats.reduce((sum, stat) => sum + stat.defective, 0);
    const totalProcessed = totalReceived + totalDefective;
    const overallDefectiveRate = totalProcessed > 0 ? (totalDefective / totalProcessed) * 100 : 0;
    const hasAnyDiscrepancies = stats.some(stat => stat.hasDiscrepancy);

    return {
      totalSent,
      totalReceived,
      totalDefective,
      totalProcessed,
      overallDefectiveRate,
      hasAnyDiscrepancies,
      completionRate: totalSent > 0 ? (totalProcessed / totalSent) * 100 : 0,
    };
  };

  const overallStats = getOverallStats();

  const onFormSubmit = (data: any) => {
    const processedData: ReceiveExpeditionDto = {
      ...data,
      receivedAt: new Date().toISOString(),
    };
    onSubmit(processedData);
  };

  return (
    <div className="space-y-6">
      {/* Overall Progress Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Icon icon="heroicons:clipboard-document-check" className="h-5 w-5" />
              Reception Progress
            </CardTitle>
            <Badge
              variant={overallStats.completionRate === 100 ? "default" : "secondary"}
              className="text-sm"
            >
              {overallStats.completionRate.toFixed(0)}% Complete
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{overallStats.totalSent}</div>
              <div className="text-sm text-muted-foreground">Expected</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{overallStats.totalReceived}</div>
              <div className="text-sm text-muted-foreground">Good Received</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{overallStats.totalDefective}</div>
              <div className="text-sm text-muted-foreground">Defective</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{overallStats.totalProcessed}</div>
              <div className="text-sm text-muted-foreground">Total Processed</div>
            </div>
          </div>

          <Progress
            value={overallStats.completionRate}
            className="h-3"
            indicatorClassName={overallStats.completionRate === 100 ? "bg-green-500" : "bg-blue-500"}
          />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Quality Rate: {(100 - overallStats.overallDefectiveRate).toFixed(1)}%</span>
              </div>
              {overallStats.hasAnyDiscrepancies && (
                <Badge variant="destructive" className="text-xs">
                  Discrepancies Found
                </Badge>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDiscrepancies(!showDiscrepancies)}
            >
              <Icon icon="heroicons:eye" className="h-4 w-4 mr-2" />
              {showDiscrepancies ? "Hide" : "Show"} Details
            </Button>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        {/* Items to Receive */}
        <Card>
          <CardHeader>
            <CardTitle>Items to Receive</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {expedition.items?.map((item, index) => {
              const stats = calculateItemStats(index, item);

              return (
                <Card
                  key={item.id}
                  className={cn(
                    "transition-all",
                    stats.hasDiscrepancy && "ring-2 ring-orange-200",
                    stats.exceedsExpected && "ring-2 ring-red-200"
                  )}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">
                          {item.product?.name || item.productName || "Unknown Product"}
                        </h4>
                        {(item.variant?.name || item.variantName) && (
                          <p className="text-sm text-muted-foreground">
                            Variant: {item.variant?.name || item.variantName}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold">Expected: {stats.sent}</div>
                        {stats.hasDiscrepancy && (
                          <Badge
                            variant={stats.exceedsExpected ? "destructive" : "secondary"}
                            className="text-xs"
                          >
                            {stats.exceedsExpected ? "Excess" : "Short"}: {Math.abs(stats.discrepancy)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Good Quantity */}
                      <div className="space-y-2">
                        <Label htmlFor={`items.${index}.quantity_received`}>
                          Good Quantity
                        </Label>
                        <Input
                          id={`items.${index}.quantity_received`}
                          type="number"
                          min="0"
                          max={stats.sent}
                          placeholder="0"
                          {...register(`items.${index}.quantity_received`, {
                            valueAsNumber: true,
                          })}
                          className={cn(
                            stats.received > 0 && "border-green-300 bg-green-50"
                          )}
                        />
                      </div>

                      {/* Defective Quantity */}
                      <div className="space-y-2">
                        <Label htmlFor={`items.${index}.quantity_defective`}>
                          Defective Quantity
                        </Label>
                        <Input
                          id={`items.${index}.quantity_defective`}
                          type="number"
                          min="0"
                          max={stats.sent}
                          placeholder="0"
                          {...register(`items.${index}.quantity_defective`, {
                            valueAsNumber: true,
                          })}
                          className={cn(
                            stats.defective > 0 && "border-red-300 bg-red-50"
                          )}
                        />
                      </div>

                      {/* Quality Rate */}
                      <div className="space-y-2">
                        <Label>Quality Status</Label>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>Good: {stats.received}</span>
                            <span>Defective: {stats.defective}</span>
                          </div>
                          <Progress
                            value={stats.total > 0 ? ((stats.received / stats.total) * 100) : 100}
                            className="h-2"
                            indicatorClassName={
                              stats.defectiveRate === 0 ? "bg-green-500" :
                              stats.defectiveRate < 10 ? "bg-yellow-500" : "bg-red-500"
                            }
                          />
                          <div className="text-xs text-center text-muted-foreground">
                            {stats.defectiveRate.toFixed(1)}% defective
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                      <Label htmlFor={`items.${index}.notes`}>
                        Item Notes (Optional)
                      </Label>
                      <Textarea
                        id={`items.${index}.notes`}
                        placeholder="Any specific notes about this item..."
                        rows={2}
                        {...register(`items.${index}.notes`)}
                      />
                    </div>

                    {/* Validation Warnings */}
                    {showDiscrepancies && stats.hasDiscrepancy && (
                      <Alert variant={stats.exceedsExpected ? "destructive" : "default"}>
                        <Icon
                          icon={stats.exceedsExpected ? "heroicons:exclamation-triangle" : "heroicons:information-circle"}
                          className="h-4 w-4"
                        />
                        <AlertDescription>
                          {stats.exceedsExpected
                            ? `Received quantity exceeds expected by ${stats.discrepancy} units`
                            : `Short by ${Math.abs(stats.discrepancy)} units from expected quantity`
                          }
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </CardContent>
        </Card>

        {/* Reception Details */}
        <Card>
          <CardHeader>
            <CardTitle>Reception Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="receivedBy">Received By *</Label>
              <Input
                id="receivedBy"
                placeholder="Enter receiver name or ID"
                {...register("receivedBy")}
              />
              {errors.receivedBy && (
                <p className="text-xs text-destructive">{errors.receivedBy.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="generalNotes">General Notes</Label>
              <Textarea
                id="generalNotes"
                placeholder="Any general observations about the shipment..."
                rows={3}
                {...register("generalNotes")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-between items-center">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>

          <div className="flex gap-2">
            {overallStats.hasAnyDiscrepancies && (
              <Alert className="max-w-md">
                <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
                <AlertDescription>
                  Please review discrepancies before proceeding
                </AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              disabled={loading || overallStats.totalProcessed === 0}
              className="min-w-[120px]"
            >
              {loading ? (
                <Icon icon="heroicons:arrow-path" className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Icon icon="heroicons:check" className="h-4 w-4 mr-2" />
              )}
              Complete Reception
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}