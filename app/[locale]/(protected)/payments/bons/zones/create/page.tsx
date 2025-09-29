// app/[locale]/(protected)/payments/zone-details/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ZoneOrdersTable } from "@/components/payments/zone-details/ZoneOrdersTable";
import { useAuthStore } from "@/lib/stores/auth/auth.store";
import { useZoneDetailsStore } from "@/lib/stores/payments/zone-details.store";
import { ProtectedRoute } from "@/components/route/protected-route";
import { PAYMENTS_PERMISSIONS } from "@/lib/constants/payments";
import { toast } from "sonner";

const ZoneDetailsContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const zoneId = searchParams.get("zone");
  const zoneName = searchParams.get("name") || "Zone";
  
  const { hasPermission } = useAuthStore();
  const {
    zoneInfo,
    availableOrders,
    addedOrders,
    filters,
    isLoading,
    fetchZoneDetails,
    setFilters,
    selectOrder,
    selectAllOrders,
    addSelectedOrders,
    removeFromAdded,
    generateBon
  } = useZoneDetailsStore();

  const [orderStatus, setOrderStatus] = useState("Attente de paiement");

  // Permissions
  const canCreateBons = hasPermission(PAYMENTS_PERMISSIONS.BONS_CREATE);
  const canManageBons = hasPermission(PAYMENTS_PERMISSIONS.BONS_UPDATE);

  useEffect(() => {
    if (zoneId) {
      fetchZoneDetails(zoneId);
    }
  }, [zoneId, fetchZoneDetails]);

  const selectedCount = availableOrders.filter(o => o.selected).length;
  const totalAddedAmount = addedOrders.reduce((sum, o) => sum + o.totalPrice, 0);

  const handleGenerateBon = async () => {
    if (addedOrders.length === 0) {
      toast.warning("Veuillez ajouter des commandes");
      return;
    }

    try {
      await generateBon({
        zoneId: zoneId!,
        orders: addedOrders,
        status: orderStatus
      });
      
      toast.success("Bon généré avec succès");
      router.push("/payments/bons-zone");
    } catch (error) {
      toast.error("Erreur lors de la génération du bon");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="container mx-auto py-6 px-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Gestion des Colis par Zone
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Gérez vos commandes livrées par Zone: {" "}
              <span className="font-bold text-green-600 dark:text-green-400">{zoneName}</span>
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              onClick={() => router.push("/payments/zones-summary-bons")}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Icon icon="heroicons:arrow-left" className="w-4 h-4 mr-2" />
              Retour aux Zones
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/payments/bons-zone")}
            >
              <Icon icon="heroicons:home" className="w-4 h-4 mr-2" />
              Page Principale
            </Button>
          </div>
        </div>

        {/* Info Bar */}
        <Card className="bg-white dark:bg-slate-800 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-500">Date création</p>
                <p className="font-semibold">{new Date().toLocaleString('fr-FR')}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Zone</p>
                <p className="font-semibold">{zoneName}</p>
              </div>
           
              <div>
                <p className="text-xs text-gray-500">Statut</p>
                <Select value={orderStatus} onValueChange={setOrderStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Attente de paiement">Attente de paiement</SelectItem>
                    <SelectItem value="En cours">En cours de traitement</SelectItem>
                    <SelectItem value="Payé">Payé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Total Disponible</p>
                  <p className="text-2xl font-bold">{availableOrders.length}</p>
                </div>
                <Icon icon="heroicons:inbox" className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Sélectionnés</p>
                  <p className="text-2xl font-bold text-yellow-600">{selectedCount}</p>
                </div>
                <Icon icon="heroicons:check-badge" className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Ajoutés</p>
                  <p className="text-2xl font-bold text-green-600">{addedOrders.length}</p>
                </div>
                <Icon icon="heroicons:plus-circle" className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Montant Total</p>
                  <p className="text-2xl font-bold text-purple-600">{totalAddedAmount} DH</p>
                </div>
                <Icon icon="heroicons:currency-dollar" className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Available Orders */}
        <Card className="bg-white dark:bg-slate-800">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/40 dark:to-emerald-900/40">
            <CardTitle>LISTE DES NOUVEAUX COLIS</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="p-4 border-b bg-gray-50/50 dark:bg-slate-800/60">
              <div className="flex justify-between gap-4">
                <div className="flex gap-2 flex-1">
                  <Input
                    placeholder="Rechercher par code ou client..."
                    value={filters.search}
                    onChange={(e) => setFilters({ search: e.target.value })}
                    className="max-w-sm"
                  />
                  <Select 
                    value={filters.city || "all"} 
                    onValueChange={(value) => setFilters({ city: value === "all" ? undefined : value })}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Toutes les villes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les villes</SelectItem>
                      <SelectItem value="Casablanca">Casablanca</SelectItem>
                      <SelectItem value="Rabat">Rabat</SelectItem>
                      <SelectItem value="Marrakech">Marrakech</SelectItem>
                      <SelectItem value="Tanger">Tanger</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select 
                    value={filters.livreur || "all"} 
                    onValueChange={(value) => setFilters({ livreur: value === "all" ? undefined : value })}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Tous les livreurs" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les livreurs</SelectItem>
                      <SelectItem value="Hassan">Hassan</SelectItem>
                      <SelectItem value="Ali">Ali</SelectItem>
                      <SelectItem value="Youssef">Youssef</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={addSelectedOrders}
                  disabled={selectedCount === 0}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Icon icon="heroicons:plus-circle" className="w-4 h-4 mr-2" />
                  Ajouter ({selectedCount})
                </Button>
              </div>
            </div>
            <ZoneOrdersTable
              orders={availableOrders}
              onSelectOrder={selectOrder}
              onSelectAll={selectAllOrders}
            />
          </CardContent>
        </Card>

        {/* Added Orders */}
        <Card className="bg-white dark:bg-slate-800">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/40 dark:to-indigo-900/40">
            <CardTitle>LISTE DES COLIS AJOUTÉS</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ZoneOrdersTable
              orders={addedOrders}
              showCheckbox={false}
              onRemove={removeFromAdded}
            />
            {addedOrders.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                Aucune commande ajoutée
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary */}
        {addedOrders.length > 0 && (
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Résumé du Bon</h3>
                  <div className="flex gap-8">
                    <div>
                      <p className="text-sm text-gray-600">Nombre de colis</p>
                      <p className="text-2xl font-bold">{addedOrders.length}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Montant total</p>
                      <p className="text-2xl font-bold text-green-600">
                        {totalAddedAmount.toLocaleString()} DH
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Livreurs impliqués</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {new Set(addedOrders.map(o => o.livreur)).size}
                      </p>
                    </div>
                  </div>
                </div>
                {canCreateBons && (
                  <Button
                    onClick={handleGenerateBon}
                    className="bg-green-600 hover:bg-green-700"
                    size="lg"
                  >
                    <Icon icon="heroicons:document-text" className="w-5 h-5 mr-2" />
                    Générer le Bon Zone
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default function ZoneDetailsPage() {
  return (
    <ProtectedRoute
      requiredPermissions={[PAYMENTS_PERMISSIONS.BONS_READ]}
      requiredAccessLevel="LIMITED"
      allowedAccountStatuses={["ACTIVE"]}
    >
      <ZoneDetailsContent />
    </ProtectedRoute>
  );
}