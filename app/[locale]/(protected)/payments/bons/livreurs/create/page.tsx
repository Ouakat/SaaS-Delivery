// app/[locale]/(protected)/payments/livreur-details/page.tsx
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
import { LivreurOrdersTable } from "@/components/payments/livreur-details/LivreurOrdersTable";
import { useAuthStore } from "@/lib/stores/auth/auth.store";
import { useLivreurDetailsStore } from "@/lib/stores/payments/livreur-details.store";
import { ProtectedRoute } from "@/components/route/protected-route";
import { PAYMENTS_PERMISSIONS } from "@/lib/constants/payments";
import { toast } from "sonner";

const LivreurDetailsContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const livreurId = searchParams.get("livreur");
  const zoneId = searchParams.get("zone");
  
  const { hasPermission } = useAuthStore();
  const {
    livreurInfo,
    availableOrders,
    addedOrders,
    filters,
    isLoading,
    fetchLivreurDetails,
    setFilters,
    selectOrder,
    selectAllOrders,
    addSelectedOrders,
    removeFromAdded,
    generateBon
  } = useLivreurDetailsStore();

  const [orderStatus, setOrderStatus] = useState("Attente de paiement");

  // Permissions
  const canCreateBons = hasPermission(PAYMENTS_PERMISSIONS.BONS_CREATE);
  const canManageBons = hasPermission(PAYMENTS_PERMISSIONS.BONS_UPDATE);

  useEffect(() => {
    if (livreurId) {
      fetchLivreurDetails(livreurId);
    }
  }, [livreurId]);

  const selectedCount = availableOrders.filter(o => o.selected).length;
  const totalAddedAmount = addedOrders.reduce((sum, o) => sum + o.totalPrice, 0);

  const handleGenerateBon = async () => {
    if (addedOrders.length === 0) {
      toast.warning("Veuillez ajouter des commandes");
      return;
    }

    try {
      await generateBon({
        livreurId: livreurId!,
        orders: addedOrders,
        status: orderStatus,
        zone: zoneId || ""
      });
      
      toast.success("Bon généré avec succès");
      router.push("/payments/bons-livreur");
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Gestion des Colis par Livreur
            </h1>
            {livreurInfo && (
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Livreur: <span className="font-bold text-green-600">{livreurInfo.name}</span>
                {" - "} Zone: <span className="font-semibold">{livreurInfo.zone}</span>
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              onClick={() => router.push(`/payments/livreurs-summary?zone=${zoneId}`)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Icon icon="heroicons:arrow-left" className="w-4 h-4 mr-2" />
              Retour aux Livreurs
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/payments/bons-livreur")}
            >
              <Icon icon="heroicons:home" className="w-4 h-4 mr-2" />
              Page Principale
            </Button>
          </div>
        </div>

        {/* Info Bar */}
        {livreurInfo && (
          <Card className="bg-white dark:bg-slate-800 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Date création</p>
                  <p className="font-semibold">{new Date().toLocaleString('fr-FR')}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Zone</p>
                  <p className="font-semibold">{livreurInfo.zone}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Livreur</p>
                  <p className="font-semibold">{livreurInfo.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Téléphone</p>
                  <p className="font-semibold">{livreurInfo.phone || "N/A"}</p>
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
        )}

        {/* Available Orders */}
        <Card className="bg-white dark:bg-slate-800">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
            <CardTitle>LISTE DES NOUVEAUX COLIS</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="p-4 border-b bg-gray-50/50 dark:bg-slate-800/50">
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
            <LivreurOrdersTable
              orders={availableOrders}
              onSelectOrder={selectOrder}
              onSelectAll={selectAllOrders}
            />
          </CardContent>
        </Card>

        {/* Added Orders */}
        <Card className="bg-white dark:bg-slate-800">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
            <CardTitle>LISTE DES COLIS AJOUTÉS</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <LivreurOrdersTable
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
                  <h3 className="text-lg font-semibold">Résumé</h3>
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
                  </div>
                </div>
                {canCreateBons && (
                  <Button
                    onClick={handleGenerateBon}
                    className="bg-green-600 hover:bg-green-700"
                    size="lg"
                  >
                    <Icon icon="heroicons:document-text" className="w-5 h-5 mr-2" />
                    Générer le Bon
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

export default function LivreurDetailsPage() {
  return (
    <ProtectedRoute
      requiredPermissions={[PAYMENTS_PERMISSIONS.BONS_READ]}
      requiredAccessLevel="LIMITED"
      allowedAccountStatuses={["ACTIVE"]}
    >
      <LivreurDetailsContent />
    </ProtectedRoute>
  );
}