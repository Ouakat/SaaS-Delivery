"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Icon } from "@iconify/react";
import { Expedition } from "@/lib/types/expedition.types";

interface ExpeditionItemsProps {
  expedition: Expedition;
  onUpdate?: () => void;
}

export function ExpeditionItems({ expedition, onUpdate }: ExpeditionItemsProps) {
  const getDiscrepancyBadge = (item: any) => {
    const sent = item.quantity_sent;
    const received = item.quantity_received;
    const defective = item.quantity_defective;

    if (expedition.status !== "received") {
      return <Badge>Pending</Badge>;
    }

    if (defective > 0) {
      return <Badge className="bg-red-100 text-red-800">Defective ({defective})</Badge>;
    }

    if (received < sent) {
      return <Badge className="bg-yellow-100 text-yellow-800">Short ({sent - received})</Badge>;
    }

    if (received > sent) {
      return <Badge className="bg-orange-100 text-orange-800">Over (+{received - sent})</Badge>;
    }

    return <Badge className="bg-green-100 text-green-800">OK</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Items ({expedition.items?.length || 0})</CardTitle>
      </CardHeader>
      <CardContent>
        {!expedition.items || expedition.items.length === 0 ? (
          <div className="text-center py-12">
            <Icon icon="heroicons:cube" className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No items in this expedition</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Variant</TableHead>
                <TableHead className="text-center">Sent</TableHead>
                <TableHead className="text-center">Received</TableHead>
                <TableHead className="text-center">Defective</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expedition.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{item.productName || item.productId}</span>
                      {item.product?.sku && (
                        <span className="text-xs text-muted-foreground">SKU: {item.product.sku}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {item.variantName || item.variantId || "-"}
                  </TableCell>
                  <TableCell className="text-center font-medium">
                    {item.quantity_sent}
                  </TableCell>
                  <TableCell className="text-center">
                    {expedition.status === "received" ? item.quantity_received : "-"}
                  </TableCell>
                  <TableCell className="text-center">
                    {expedition.status === "received" ? item.quantity_defective : "-"}
                  </TableCell>
                  <TableCell>
                    {getDiscrepancyBadge(item)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}