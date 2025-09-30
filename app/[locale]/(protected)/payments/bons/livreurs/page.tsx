// app/[locale]/(protected)/payments/bons-livreur/page.tsx
"use client";

import React, { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import BonsLivreurTable from "@/components/payments/bons-livreur-table";
import { useAuthStore } from "@/lib/stores/auth/auth.store";
import { useBonsLivreurStore } from "@/lib/stores/payments/bons-livreur.store";
import { ProtectedRoute } from "@/components/route/protected-route";
import { PAYMENTS_PERMISSIONS } from "@/lib/constants/payments";

const BonsLivreurContent = () => {
  const router = useRouter();
  const { hasPermission } = useAuthStore();
  const { statistics, fetchStatistics } = useBonsLivreurStore();
  
  const canViewBons = hasPermission(PAYMENTS_PERMISSIONS.BONS_READ);
  const canCreateBons = hasPermission(PAYMENTS_PERMISSIONS.BONS_CREATE);

  useEffect(() => {
    if (canViewBons) {
      fetchStatistics().catch(console.error);
    }
  }, [canViewBons]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="container mx-auto py-6 px-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Bons par Livreur
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Gestion des bons de paiement pour les livreurs
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {canCreateBons && (
              <Button
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Icon icon="heroicons:document-text" className="w-4 h-4 mr-2" />
                Générer
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => router.push("/payments/bons/livreurs/zones-summary")}
            >
              <Icon icon="heroicons:map" className="w-4 h-4 mr-2" />
              Résumé par Zone
            </Button>
          </div>
        </div>

        {/* Statistics */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Total Bons</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics.totalBons}</div>
                <p className="text-xs text-gray-500">Tous les bons</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">En Attente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {statistics.pendingBons}
                </div>
                <p className="text-xs text-gray-500">À traiter</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Montant Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statistics.totalAmount.toLocaleString()} DH
                </div>
                <p className="text-xs text-gray-500">Valeur totale</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Livreurs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics.totalLivreurs}</div>
                <p className="text-xs text-gray-500">Livreurs actifs</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Zones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics.totalZones}</div>
                <p className="text-xs text-gray-500">Zones couvertes</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Table Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Liste des Bons</span>
              {canViewBons && (
                <Badge color="secondary" className="text-xs">
                  <Icon icon="heroicons:eye" className="w-3 h-3 mr-1" />
                  Accès Lecture
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {canViewBons ? (
              <BonsLivreurTable isAdminView={true} />
            ) : (
              <div className="p-8 text-center">
                <Icon icon="heroicons:lock-closed" className="w-12 h-12 text-gray-400 mx-auto" />
                <h3 className="font-medium text-gray-900 mt-4">
                  Pas d'autorisation
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Vous n'avez pas la permission de voir les bons.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default function BonsLivreurPage() {
  return (
    <ProtectedRoute
      requiredPermissions={[PAYMENTS_PERMISSIONS.BONS_READ]}
      requiredAccessLevel="LIMITED"
      allowedAccountStatuses={["ACTIVE"]}
    >
      <BonsLivreurContent />
    </ProtectedRoute>
  );
}