// components/orders/OrdersTable.tsx
import React, { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { OrderDetailsModal } from "./OrderDetailsModal";

interface Order {
  id: string;
  code: string;
  client: string;
  phone: string;
  date: string;
  status: string;
  city: string;
  amount: number;
  totalPrice: number;
  selected?: boolean;
}

interface OrdersTableProps {
  orders: Order[];
  onSelectOrder?: (orderId: string) => void;
  onSelectAll?: () => void;
  showCheckbox?: boolean;
  showActions?: boolean;
  onRemove?: (orderId: string) => void;
}

export function OrdersTable({
  orders,
  onSelectOrder,
  onSelectAll,
  showCheckbox = true,
  showActions = true,
  onRemove,
}: OrdersTableProps) {
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);


  const getOrderDetails = (orderId: string) => {
    return {
      ...orders.find(o => o.id === orderId),
      email: "client@example.com",
      address: "123 Rue Mohammed V, Casablanca",
      trackingNumber: "TRK-" + Math.random().toString(36).substr(2, 9).toUpperCase(),
      weight: "2.5 kg",
      productDescription: "Électronique - Smartphone",
      shippingFees: 10,
      statusHistory: [
        {
          id: "1",
          status: "Livré",
          date: "2025-09-20",
          time: "14:30",
          user: "Ahmed Ben Ali",
          comment: "Colis livré au client avec succès"
        },
        {
          id: "2",
          status: "En cours",
          date: "2025-09-20",
          time: "09:15",
          user: "Système",
          comment: "Colis en cours de livraison"
        },
        {
          id: "3",
          status: "Confirmé",
          date: "2025-09-19",
          time: "16:45",
          user: "Sara Alami",
          comment: null
        },
        {
          id: "4",
          status: "En attente",
          date: "2025-09-18",
          time: "10:30",
          user: "Système",
          comment: "Commande créée"
        }
      ]
    };
  };

  const handleViewDetails = (orderId: string) => {
    const details = getOrderDetails(orderId);
    setSelectedOrder(details);
    setIsModalOpen(true);
  };

  if (orders.length === 0) {
    return (
      <div className="p-12 text-center">
        <Icon icon="heroicons:inbox" className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <p className="text-muted-foreground text-lg">Aucun colis trouvé</p>
      </div>
    );
  }

  return (
    <>
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50/50">
            {showCheckbox && (
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={orders.every(order => order.selected)}
                  onCheckedChange={onSelectAll}
                />
              </TableHead>
            )}
            <TableHead>Code d'envoi</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Téléphone</TableHead>
            <TableHead>Date de livraison</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Ville</TableHead>
            <TableHead className="text-right">Prix</TableHead>
            <TableHead className="text-right">Frais</TableHead>
            <TableHead className="text-right">Total</TableHead>
            {showActions && <TableHead className="w-[100px]">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id} className={order.selected ? "bg-green-50/30" : ""}>
              {showCheckbox && (
                <TableCell>
                  <Checkbox
                    checked={order.selected}
                    onCheckedChange={() => onSelectOrder?.(order.id)}
                  />
                </TableCell>
              )}
              <TableCell className="font-mono text-xs">{order.code}</TableCell>
              <TableCell>{order.client}</TableCell>
              <TableCell>{order.phone}</TableCell>
              <TableCell>{order.date}</TableCell>
              <TableCell>
                <Badge className="bg-green-100 text-green-800 text-xs">
                  {order.status}
                </Badge>
              </TableCell>
              <TableCell>{order.city}</TableCell>
              <TableCell className="text-right font-medium">{order.amount} Dh</TableCell>
              <TableCell className="text-right">10 Dh</TableCell>
              <TableCell className="text-right font-bold">{order.totalPrice} Dh</TableCell>
              {showActions && (
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Icon icon="heroicons:ellipsis-horizontal" className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewDetails(order.id)}>
                          <Icon icon="heroicons:eye" className="w-4 h-4 mr-2" />
                          Détails
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Icon icon="heroicons:pencil" className="w-4 h-4 mr-2" />
                          Modifier
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>

    </div>

     {/* Order Details Modal - خارج div */}
     <OrderDetailsModal
     isOpen={isModalOpen}
     onClose={() => setIsModalOpen(false)}
     order={selectedOrder}
   />
 </> 
    
  );
}