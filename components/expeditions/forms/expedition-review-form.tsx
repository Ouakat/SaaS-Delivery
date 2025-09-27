"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Icon } from "@iconify/react";
import { format } from "date-fns";
import {
  CreateExpeditionDto,
  TRANSPORT_MODE_LABELS,
} from "@/lib/types/expedition.types";

interface ExpeditionReviewFormProps {
  data: CreateExpeditionDto;
  onConfirm: () => void;
  onBack: () => void;
  onSaveDraft: () => void;
  loading?: boolean;
}

export function ExpeditionReviewForm({
  data,
  onConfirm,
  onBack,
  onSaveDraft,
  loading = false,
}: ExpeditionReviewFormProps) {
  const getTotalQuantity = () => {
    return data.items?.reduce((sum, item) => sum + item.quantity_sent, 0) || 0;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Review the expedition details</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Warehouse</dt>
              <dd className="text-sm mt-1">{data.warehouseId}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Seller</dt>
              <dd className="text-sm mt-1">{data.sellerSnapshot.name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Arrival Date</dt>
              <dd className="text-sm mt-1">
                {data.arrivalDate && format(new Date(data.arrivalDate), "PPP")}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Transport Mode</dt>
              <dd className="text-sm mt-1">
                <Badge>
                  {TRANSPORT_MODE_LABELS[data.transportMode]}
                </Badge>
              </dd>
            </div>
            {data.trackingNumber && (
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Tracking Number</dt>
                <dd className="text-sm mt-1 font-mono">{data.trackingNumber}</dd>
              </div>
            )}
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Number of Packages</dt>
              <dd className="text-sm mt-1">{data.numberOfPackages}</dd>
            </div>
            {data.weight && (
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Weight</dt>
                <dd className="text-sm mt-1">{data.weight} kg</dd>
              </div>
            )}
          </dl>
          {data.generalNotes && (
            <>
              <Separator className="my-4" />
              <div>
                <dt className="text-sm font-medium text-muted-foreground mb-1">General Notes</dt>
                <dd className="text-sm text-muted-foreground">{data.generalNotes}</dd>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
          <CardDescription>
            {data.items?.length || 0} item(s) in this expedition
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.items && data.items.length > 0 ? (
            <>
              <div className="space-y-3">
                {data.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">Product: {item.productName}</p>
                      {item.variantId && (
                        <p className="text-sm text-muted-foreground">
                          Variant: {item.variantName}
                        </p>
                      )}
                      {item.batchNumber && (
                        <p className="text-sm text-muted-foreground">
                          Batch: {item.batchNumber}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">Qty: {item.quantity_sent}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Separator className="my-4" />
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Items:</span>
                <span className="font-semibold">{data.items.length}</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="font-medium">Total Quantity:</span>
                <span className="font-semibold">{getTotalQuantity()}</span>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No items added to this expedition
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-yellow-200 bg-yellow-50/50 dark:bg-yellow-900/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon icon="heroicons:exclamation-triangle" className="h-5 w-5 text-yellow-600" />
            Confirmation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Please review all the information above carefully. Once you create this expedition,
            some details may not be editable depending on the status.
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-between gap-2">
        <Button type="button" variant="outline" onClick={onBack} disabled={loading}>
          <Icon icon="heroicons:arrow-left" className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="flex gap-2">
          <Button onClick={onConfirm} disabled={loading}>
            {loading ? (
              <>
                <Icon icon="eos-icons:loading" className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Icon icon="heroicons:check" className="mr-2 h-4 w-4" />
                Create Expedition
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}