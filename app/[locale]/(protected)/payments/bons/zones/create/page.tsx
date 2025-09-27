// app/orders/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { OrdersTable } from "@/components/payments/bonsLivreur/OrdersTable";
import { OrdersFilters } from "@/components/payments/bonsLivreur/OrdersFilters";
import { OrdersSummary } from "@/components/payments/bonsLivreur/OrdersSummary";
import { OrderInfoBar } from "@/components/payments/bonsLivreur/OrderInfoBar";

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

export default function OrderManagementPage() {
  const [addedOrders, setAddedOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCity, setFilterCity] = useState("all");
  const [selectedCount, setSelectedCount] = useState(0);

  const [paidOrders, setPaidOrders] = useState<Order[]>([
    {
      id: "1",
      code: "CMD-150920251048357621",
      client: "Aliexpress - (841)",
      phone: "0650094257",
      date: "2025-09-18 09:39",
      status: "Livré",
      city: "Casablanca",
      amount: 345,
      totalPrice: 335,
      selected: false,
    },
    {
      id: "2",
      code: "CMD-150920251048357622",
      client: "Amazon - (542)",
      phone: "0661234567",
      date: "2025-09-18 10:15",
      status: "Livré",
      city: "Rabat",
      amount: 580,
      totalPrice: 560,
      selected: false,
    },
    {
      id: "3",
      code: "CMD-150920251048357623",
      client: "Jumia - (123)",
      phone: "0677889900",
      date: "2025-09-18 11:22",
      status: "Livré",
      city: "Marrakech",
      amount: 220,
      totalPrice: 210,
      selected: false,
    },
  ]);

  const [orderStatus, setOrderStatus] = useState("Attente de paiement");

  useEffect(() => {
    const count = paidOrders.filter(order => order.selected).length;
    setSelectedCount(count);
  }, [paidOrders]);

  const handleSelectOrder = (orderId: string) => {
    setPaidOrders(orders =>
      orders.map(order =>
        order.id === orderId ? { ...order, selected: !order.selected } : order
      )
    );
  };

  const handleSelectAll = () => {
    const allSelected = paidOrders.every(order => order.selected);
    setPaidOrders(orders =>
      orders.map(order => ({ ...order, selected: !allSelected }))
    );
  };

  const handleAddSelected = () => {
    const selectedOrders = paidOrders.filter(order => order.selected);
    setAddedOrders(prev => [...prev, ...selectedOrders]);
    setPaidOrders(orders => orders.filter(order => !order.selected));
    setSelectedCount(0);
  };

  const handleRemoveFromAdded = (orderId: string) => {
    const orderToRemove = addedOrders.find(order => order.id === orderId);
    if (orderToRemove) {
      setPaidOrders(prev => [...prev, { ...orderToRemove, selected: false }]);
      setAddedOrders(orders => orders.filter(order => order.id !== orderId));
    }
  };

  const filteredPaidOrders = paidOrders.filter(order => {
    const matchesSearch =
      order.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.client.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCity = filterCity === "all" || order.city === filterCity;
    return matchesSearch && matchesCity;
  });

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-slate-900 dark:text-gray-100 container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Colis par Zone</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gérez vos commandes livrées par Zone: (
            <span className="font-bold text-green-600 dark:text-green-400">HUB CASABLANCA</span>)
          </p>
        </div>
      </div>

      {/* Info Bar */}
      <OrderInfoBar 
        createdDate="2025-09-20 13:05"
        zone="HUB CASABLANCA"
        status={orderStatus}
        onStatusChange={setOrderStatus}
      />

      {/* Top Section */}
      <Card className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/40 dark:to-emerald-900/40">
          <CardTitle className="text-gray-700 dark:text-gray-100">
            LISTE DES NOUVEAUX COLIS
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-4 border-b border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/60">
            <div className="flex justify-between gap-4">
              <OrdersFilters
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                filterCity={filterCity}
                onCityChange={setFilterCity}
              />
              <Button 
                onClick={handleAddSelected}
                disabled={selectedCount === 0}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Icon icon="heroicons:plus-circle" className="w-4 h-4 mr-2" />
                Ajouter ({selectedCount})
              </Button>
            </div>
          </div>
          <OrdersTable
            orders={filteredPaidOrders}
            onSelectOrder={handleSelectOrder}
            onSelectAll={handleSelectAll}
          />
        </CardContent>
      </Card>

      {/* Bottom Section */}
      <Card className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/40 dark:to-indigo-900/40">
          <CardTitle className="text-gray-700 dark:text-gray-100">
            LISTE DES COLIS AJOUTÉS
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <OrdersTable
            orders={addedOrders}
            showCheckbox={false}
            onRemove={handleRemoveFromAdded}
          />
        </CardContent>
      </Card>

      {/* Summary */}
      {addedOrders.length > 0 && (
        <OrdersSummary
          orderCount={addedOrders.length}
          totalAmount={addedOrders.reduce((sum, o) => sum + o.totalPrice, 0)}
        />
      )}
    </div>
  );
}
