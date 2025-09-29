// /components/payments/zone-details/ZoneOrdersTable.tsx
"use client";

import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";

interface Order {
  id: string;
  code: string;
  client: string;
  clientCode: string;
  phone: string;
  date: string;
  status: string;
  city: string;
  livreur?: string;
  amount: number;
  totalPrice: number;
  selected?: boolean;
}

interface ZoneOrdersTableProps {
  orders: Order[];
  showCheckbox?: boolean;
  onSelectOrder?: (orderId: string) => void;
  onSelectAll?: () => void;
  onRemove?: (orderId: string) => void;
}

export const ZoneOrdersTable = ({
  orders,
  showCheckbox = true,
  onSelectOrder,
  onSelectAll,
  onRemove
}: ZoneOrdersTableProps) => {
  const allSelected = orders.length > 0 && orders.every(order => order.selected);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Livré":
        return "bg-green-100 text-green-800 dark:bg-green-600 dark:text-white";
      case "En cours":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-600 dark:text-white";
      case "Retourné":
        return "bg-orange-100 text-orange-800 dark:bg-orange-600 dark:text-white";
      case "Refusé":
        return "bg-red-100 text-red-800 dark:bg-red-600 dark:text-white";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-white";
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-slate-700/50">
          <tr>
            {showCheckbox && (
              <th className="px-4 py-3 text-left">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={onSelectAll}
                />
              </th>
            )}
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-400">Code</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-400">Client</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-400">Livreur</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-400">Téléphone</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-400">Date</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-400">Ville</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-400">Statut</th>
            <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 dark:text-gray-400">Montant</th>
            <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 dark:text-gray-400">Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.length === 0 ? (
            <tr>
              <td colSpan={showCheckbox ? 10 : 9} className="px-4 py-8 text-center text-gray-500">
                Aucune commande trouvée
              </td>
            </tr>
          ) : (
            orders.map((order) => (
              <tr key={order.id} className="border-b hover:bg-gray-50 dark:hover:bg-slate-700/30">
                {showCheckbox && (
                  <td className="px-4 py-3">
                    <Checkbox
                      checked={order.selected}
                      onCheckedChange={() => onSelectOrder?.(order.id)}
                    />
                  </td>
                )}
                <td className="px-4 py-3">
                  <p className="font-mono text-xs">{order.code}</p>
                </td>
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-sm">{order.client}</p>
                    <p className="text-xs text-gray-500">{order.clientCode}</p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-600/20 dark:text-purple-400">
                    {order.livreur || "Non assigné"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-sm">{order.phone}</td>
                <td className="px-4 py-3 text-sm">{order.date}</td>
                <td className="px-4 py-3 text-sm">{order.city}</td>
                <td className="px-4 py-3">
                  <Badge className={getStatusColor(order.status)}>
                    {order.status}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right font-semibold">{order.totalPrice} DH</td>
                <td className="px-4 py-3 text-center">
                  {onRemove ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onRemove(order.id)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Icon icon="heroicons:trash" className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline">
                      <Icon icon="heroicons:eye" className="w-4 h-4" />
                    </Button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};