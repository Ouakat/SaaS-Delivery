"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import { Stock } from "@/lib/types/product.types";
import { stockApi } from "@/lib/api/clients/stock.client";
import { cn } from "@/lib/utils/ui.utils";

const defectiveActionSchema = z.object({
  quantity: z.number().min(1, "Quantity must be at least 1"),
  reason: z.string().min(3, "Reason must be at least 3 characters"),
});

interface DefectiveStockManagerProps {
  stock: Stock;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedStock: Stock) => void;
}

type ActionType = "mark" | "repair" | "dispose";

export function DefectiveStockManager({
  stock,
  isOpen,
  onClose,
  onUpdate,
}: DefectiveStockManagerProps) {
  const [activeAction, setActiveAction] = useState<ActionType>("mark");
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [formData, setFormData] = useState<any>(null);

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm({
    resolver: zodResolver(defectiveActionSchema),
    defaultValues: {
      quantity: 1,
      reason: "",
    },
  });

  const watchedQuantity = watch("quantity");

  const getMaxQuantity = (action: ActionType) => {
    switch (action) {
      case "mark":
        return stock.quantity - stock.reserved; // Available good stock
      case "repair":
      case "dispose":
        return stock.defective;
      default:
        return 0;
    }
  };

  const getActionConfig = (action: ActionType) => {
    const configs = {
      mark: {
        title: "Mark as Defective",
        description: "Move good items to defective status",
        icon: "heroicons:exclamation-triangle",
        color: "orange",
        maxQty: stock.quantity - stock.reserved,
        buttonText: "Mark Defective",
        reasons: [
          "Damaged during handling",
          "Manufacturing defect",
          "Expired/outdated",
          "Quality inspection failure",
          "Customer return",
          "Other",
        ],
      },
      repair: {
        title: "Repair Defective Items",
        description: "Move defective items back to good status",
        icon: "heroicons:wrench-screwdriver",
        color: "blue",
        maxQty: stock.defective,
        buttonText: "Mark as Repaired",
        reasons: [
          "Repaired successfully",
          "Re-tested and passed",
          "Minor issue resolved",
          "Cleaning completed",
          "Repackaging done",
          "Other",
        ],
      },
      dispose: {
        title: "Dispose Defective Items",
        description: "Permanently remove defective items from inventory",
        icon: "heroicons:trash",
        color: "red",
        maxQty: stock.defective,
        buttonText: "Dispose Items",
        reasons: [
          "Beyond repair",
          "Safety concern",
          "Regulatory requirement",
          "Cost of repair too high",
          "Expired beyond use",
          "Other",
        ],
      },
    };
    return configs[action];
  };

  const onSubmit = (data: any) => {
    setFormData(data);
    setShowConfirmation(true);
  };

  const onConfirm = async () => {
    try {
      setLoading(true);
      setShowConfirmation(false);
      let updatedStock: Stock;

      switch (activeAction) {
        case "mark":
          updatedStock = await stockApi.markDefective(stock.id, formData);
          toast.success(`${formData.quantity} items marked as defective`);
          break;
        case "repair":
          updatedStock = await stockApi.repairDefective(stock.id, formData);
          toast.success(`${formData.quantity} items repaired and returned to good stock`);
          break;
        case "dispose":
          updatedStock = await stockApi.disposeDefective(stock.id, formData);
          toast.success(`${formData.quantity} defective items disposed`);
          break;
        default:
          throw new Error("Invalid action");
      }

      onUpdate(updatedStock);
      reset();
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to update stock");
    } finally {
      setLoading(false);
    }
  };

  const currentConfig = getActionConfig(activeAction);
  const maxQuantity = getMaxQuantity(activeAction);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon icon="heroicons:cog-6-tooth" className="h-5 w-5" />
              Manage Defective Stock
            </DialogTitle>
            <DialogDescription>
              Manage defective items for {stock.product?.name || "Unknown Product"}
              {stock.variant && ` (${stock.variant.name})`}
            </DialogDescription>
          </DialogHeader>

        <div className="space-y-4">
          {/* Current Stock Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Current Stock Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">{stock.quantity - stock.reserved}</div>
                  <div className="text-xs text-muted-foreground">Available</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">{stock.reserved}</div>
                  <div className="text-xs text-muted-foreground">Reserved</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-red-600">{stock.defective}</div>
                  <div className="text-xs text-muted-foreground">Defective</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold">{stock.quantity + stock.defective}</div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Tabs */}
          <Tabs value={activeAction} onValueChange={(value) => setActiveAction(value as ActionType)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger
                value="mark"
                disabled={stock.quantity - stock.reserved === 0}
                className="flex items-center gap-2"
              >
                <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
                Mark Defective
              </TabsTrigger>
              <TabsTrigger
                value="repair"
                disabled={stock.defective === 0}
                className="flex items-center gap-2"
              >
                <Icon icon="heroicons:wrench-screwdriver" className="h-4 w-4" />
                Repair
              </TabsTrigger>
              <TabsTrigger
                value="dispose"
                disabled={stock.defective === 0}
                className="flex items-center gap-2"
              >
                <Icon icon="heroicons:trash" className="h-4 w-4" />
                Dispose
              </TabsTrigger>
            </TabsList>

            <div className="">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon
                      icon={currentConfig.icon}
                      className={cn(
                        "h-5 w-5",
                        currentConfig.color === "orange" && "text-orange-500",
                        currentConfig.color === "blue" && "text-blue-500",
                        currentConfig.color === "red" && "text-red-500"
                      )}
                    />
                     {currentConfig.title}
                  </CardTitle>
                  <div className="text-sm text-muted-foreground">
                    {currentConfig.description}
                  </div>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* Quantity Input */}
                    <div className="space-y-1">
                      <Label htmlFor="quantity">
                        Quantity (Max: {maxQuantity})
                      </Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        max={maxQuantity}
                        {...register("quantity", { valueAsNumber: true })}
                        disabled={maxQuantity === 0}
                      />
                      {errors.quantity && (
                        <p className="text-xs text-destructive">{errors.quantity.message}</p>
                      )}
                      {maxQuantity === 0 && (
                        <Alert>
                          <Icon icon="heroicons:information-circle" className="h-4 w-4" />
                          <AlertDescription>
                            No items available for this action
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>

                    {/* Reason Selection */}
                    <div className="space-y-1">
                      <Label htmlFor="reason">Reason</Label>
                      <Textarea
                        id="reason"
                        placeholder="Enter reason or select from above"
                        {...register("reason")}
                        rows={2}
                      />
                      {errors.reason && (
                        <p className="text-xs text-destructive">{errors.reason.message}</p>
                      )}
                    </div>                   

                    {/* Actions */}
                    <div className="flex justify-between pt-4">
                      <Button type="button" variant="outline" onClick={onClose}>
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={loading || maxQuantity === 0 || watchedQuantity > maxQuantity}
                        variant={activeAction === "dispose" ? "destructive" : "default"}
                      >
                        {loading ? (
                          <Icon icon="heroicons:arrow-path" className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Icon icon={currentConfig.icon} className="h-4 w-4 mr-2" />
                        )}
                        {currentConfig.buttonText}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>

    <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Icon
              icon={currentConfig.icon}
              className={cn(
                "h-5 w-5",
                currentConfig.color === "orange" && "text-orange-500",
                currentConfig.color === "blue" && "text-blue-500",
                currentConfig.color === "red" && "text-red-500"
              )}
            />
            Confirm {currentConfig.title}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                Are you sure you want to {currentConfig.title.toLowerCase()} {formData?.quantity} item(s)?
              </p>

              <div className="bg-muted p-3 rounded-md">
                <div className="space-y-1">
                  <strong>Impact Preview:</strong>
                  {activeAction === "mark" && formData && (
                    <>
                      <div>• Available: {stock.quantity - stock.reserved} → {stock.quantity - stock.reserved - formData.quantity}</div>
                      <div>• Defective: {stock.defective} → {stock.defective + formData.quantity}</div>
                    </>
                  )}
                  {activeAction === "repair" && formData && (
                    <>
                      <div>• Good Stock: {stock.quantity} → {stock.quantity + formData.quantity}</div>
                      <div>• Defective: {stock.defective} → {stock.defective - formData.quantity}</div>
                    </>
                  )}
                  {activeAction === "dispose" && formData && (
                    <>
                      <div>• Defective: {stock.defective} → {stock.defective - formData.quantity}</div>
                      <div>• Total Items: {stock.quantity + stock.defective} → {stock.quantity + stock.defective - formData.quantity}</div>
                    </>
                  )}
                </div>
              </div>

              {formData?.reason && (
                <div>
                  <strong>Reason:</strong> {formData.reason}
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              activeAction === "dispose" && "bg-destructive hover:bg-destructive/90"
            )}
          >
            {loading ? (
              <Icon icon="heroicons:arrow-path" className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Icon icon={currentConfig.icon} className="h-4 w-4 mr-2" />
            )}
            {currentConfig.buttonText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>
  );
}