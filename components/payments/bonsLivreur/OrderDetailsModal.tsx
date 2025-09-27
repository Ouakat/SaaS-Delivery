// components/orders/OrderDetailsModal.tsx
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Icon } from "@/components/ui/icon";
import { ScrollArea } from "@/components/ui/scroll-area";

interface StatusHistory {
  id: string;
  status: string;
  date: string;
  time: string;
  user: string;
  comment?: string;
}

interface OrderDetails {
  id: string;
  code: string;
  client: string;
  phone: string;
  email?: string;
  address?: string;
  date: string;
  status: string;
  city: string;
  amount: number;
  shippingFees: number;
  totalPrice: number;
  paymentMethod?: string;
  trackingNumber?: string;
  weight?: string;
  productDescription?: string;
  statusHistory: StatusHistory[];
}

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: OrderDetails | null;
}

export function OrderDetailsModal({ isOpen, onClose, order }: OrderDetailsModalProps) {
  if (!order) return null;

  const getStatusClass = (status: string) => {
    const classes = {
      "En attente": "bg-yellow-100 text-yellow-800",
      "Confirmé": "bg-blue-100 text-blue-800",
      "En cours": "bg-gray-100 text-gray-800",
      "Livré": "bg-green-100 text-green-800",
      "Annulé": "bg-red-100 text-red-800",
      "Retourné": "bg-purple-100 text-purple-800",
    };
    return classes[status as keyof typeof classes] || "bg-gray-100 text-gray-800";
  };
  

  const getStatusIcon = (status: string) => {
    const icons = {
      "En attente": "heroicons:clock",
      "Confirmé": "heroicons:check-circle",
      "En cours": "heroicons:truck",
      "Livré": "heroicons:check-badge",
      "Annulé": "heroicons:x-circle",
      "Retourné": "heroicons:arrow-uturn-left",
    };
    return icons[status as keyof typeof icons] || "heroicons:information-circle";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-[90vw] md:max-w-4xl max-h-[90vh]">
        <DialogHeader className="relative">
          <DialogTitle className="flex items-center justify-between pr-10">
            <span>Détails de la commande</span>
            <Badge className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass(order.status)}`}>
              {order.status}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
          <div className="space-y-6">
            {/* Order Info Section */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Icon icon="heroicons:document-text" className="w-5 h-5" />
                Informations de la commande
              </h3>
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500">Code d'envoi</p>
                  <p className="font-mono font-semibold">{order.code}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date de création</p>
                  <p className="font-semibold">{order.date}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Numéro de suivi</p>
                  <p className="font-semibold">{order.trackingNumber || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Méthode de paiement</p>
                  <p className="font-semibold">{order.paymentMethod || "Cash"}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Client Info Section */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Icon icon="heroicons:user" className="w-5 h-5" />
                Informations du client
              </h3>
              <div className="grid grid-cols-2 gap-4 bg-blue-50 p-4 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500">Nom du client</p>
                  <p className="font-semibold">{order.client}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Téléphone</p>
                  <p className="font-semibold">{order.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-semibold">{order.email || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Ville</p>
                  <p className="font-semibold">{order.city}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Adresse de livraison</p>
                  <p className="font-semibold">{order.address || "N/A"}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Product Info Section */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Icon icon="heroicons:cube" className="w-5 h-5" />
                Détails du produit
              </h3>
              <div className="bg-green-50 p-4 rounded-lg space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Description</p>
                  <p className="font-semibold">{order.productDescription || "Produit standard"}</p>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Poids</p>
                    <p className="font-semibold">{order.weight || "1 kg"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Prix</p>
                    <p className="font-semibold">{order.amount} Dh</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Frais de livraison</p>
                    <p className="font-semibold">{order.shippingFees} Dh</p>
                  </div>
                </div>
                <div className="pt-3 border-t">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium">Total à payer</p>
                    <p className="text-xl font-bold text-green-600">{order.totalPrice} Dh</p>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Status History Section */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Icon icon="heroicons:clock" className="w-5 h-5" />
                Historique des statuts
              </h3>
              <div className="relative">
                {order.statusHistory.map((history, index) => (
                  <div key={history.id} className="flex gap-4 pb-6 relative">
                    {/* Timeline line */}
                    {index < order.statusHistory.length - 1 && (
                      <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-gray-200" />
                    )}
                    
                    {/* Icon */}
                    <div className={`
                      relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                      ${index === 0 ? 'bg-green-500' : 'bg-gray-300'}
                    `}>
                      <Icon 
                        icon={getStatusIcon(history.status)} 
                        className={`w-5 h-5 ${index === 0 ? 'text-white' : 'text-gray-600'}`} 
                      />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 pt-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold">{history.status}</p>
                          <p className="text-sm text-gray-500 mt-1">
                            {history.date} à {history.time}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            Par: {history.user}
                          </p>
                          {history.comment && (
                            <p className="text-sm text-gray-600 mt-2 italic">
                              "{history.comment}"
                            </p>
                          )}
                        </div>
                        {index === 0 && (
                          <Badge variant="outline" className="text-xs">
                            Actuel
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}