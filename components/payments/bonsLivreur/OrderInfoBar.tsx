// components/orders/OrderInfoBar.tsx
import React from "react";
import { Icon } from "@/components/ui/icon";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface OrderInfoBarProps {
  createdDate?: string;
  zone?: string;
  livreur?: string;
  status?: string;
  onStatusChange?: (value: string) => void;
}

export function OrderInfoBar({
  createdDate = "2025-09-20 13:05",
  zone = "HUB CASABLANCA",
  livreur,
  status = "Attente de paiement",
  onStatusChange,
}: OrderInfoBarProps) {
  return (
    <div className="w-full bg-gradient-to-r from-gray-50 to-slate-50 border rounded-lg p-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-8">
          {/* Date de création */}
          <div className="flex items-center gap-2">
            <Icon icon="heroicons:calendar-days" className="w-4 h-4 text-gray-500" />
            <div>
              <span className="text-xs text-gray-500 uppercase">Date de création:</span>
              <span className="ml-2 font-medium text-sm text-gray-700">{createdDate}</span>
            </div>
          </div>

          {/* Zone */}
          <div className="flex items-center gap-2">
            <Icon icon="heroicons:map-pin" className="w-4 h-4 text-gray-500" />
            <div>
              <span className="text-xs text-gray-500 uppercase">Zone:</span>
              <span className="ml-2 font-medium text-sm text-gray-700">{zone}</span>
            </div>
          </div>

          {/* Livreur */}
          {livreur?.trim() && (
            <div className="flex items-center gap-2">
                <Icon icon="heroicons:truck" className="w-4 h-4 text-gray-500" />
                <div>
                <span className="text-xs text-gray-500 uppercase">Livreur:</span>
                <span className="ml-2 font-medium text-sm text-gray-700">{livreur}</span>
                </div>
            </div>
            )}
          
        </div>

        {/* Status Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 uppercase">Statut:</span>
          <Select value={status} onValueChange={onStatusChange}>
            <SelectTrigger className="w-[200px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Attente de paiement">Attente de paiement</SelectItem>
              <SelectItem value="Payé">Payé</SelectItem>
              <SelectItem value="En cours">En cours</SelectItem>
              <SelectItem value="Livré">Livré</SelectItem>
              <SelectItem value="Annulé">Annulé</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}