// components/orders/OrdersSummary.tsx
import React from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

interface OrdersSummaryProps {
  orderCount: number;
  totalAmount: number;
  onDownloadPDF?: () => void;
  onConfirm?: () => void;
}

export function OrdersSummary({
  orderCount,
  totalAmount,
  onDownloadPDF,
  onConfirm,
}: OrdersSummaryProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg border">
      <div className="flex items-center gap-6">
        <div>
          <p className="text-sm text-muted-foreground">Nombre de colis</p>
          <p className="text-2xl font-bold">{orderCount}</p>
        </div>
        <div className="h-12 w-px bg-gray-300" />
        <div>
          <p className="text-sm text-muted-foreground">Total à payer</p>
          <p className="text-2xl font-bold text-green-600">
            {totalAmount} Dh
          </p>
        </div>
      </div>
      {/* <div className="flex items-center gap-3">
        <Button variant="outline" size="lg" onClick={onDownloadPDF}>
          <Icon icon="heroicons:document-arrow-down" className="w-5 h-5 mr-2" />
          Télécharger PDF
        </Button>
        <Button 
          size="lg" 
          className="bg-gradient-to-r from-blue-600 to-indigo-600"
          onClick={onConfirm}
        >
          <Icon icon="heroicons:check" className="w-5 h-5 mr-2" />
          Confirmer et Envoyer
        </Button>
      </div> */}
    </div>
  );
}