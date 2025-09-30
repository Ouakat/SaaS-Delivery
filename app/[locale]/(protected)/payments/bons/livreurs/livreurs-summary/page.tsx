// app/[locale]/(protected)/payments/livreurs-summary/page.tsx
"use client";

import React, { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import { useRouter, useSearchParams } from "next/navigation";
import LivreursSummaryTable from "@/components/payments/livreurs-summary-table";
import { useAuthStore } from "@/lib/stores/auth/auth.store";
import { useLivreursSummaryStore } from "@/lib/stores/payments/livreurs-summary.store";
import { ProtectedRoute } from "@/components/route/protected-route";
import { PAYMENTS_PERMISSIONS } from "@/lib/constants/payments";

const LivreursSummaryContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const zoneId = searchParams.get("zone");
  const zoneName = searchParams.get("name") || "Zone";
  
  const { hasPermission } = useAuthStore();
  const { statistics, fetchStatistics } = useLivreursSummaryStore();
  
  const canViewLivreurs = hasPermission(PAYMENTS_PERMISSIONS.BONS_READ);
  const canCreateBons = hasPermission(PAYMENTS_PERMISSIONS.BONS_CREATE);

  useEffect(() => {
    if (canViewLivreurs && zoneId) {
      fetchStatistics(zoneId).catch(console.error);
    }
  }, [canViewLivreurs, zoneId, fetchStatistics]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="container mx-auto py-6 px-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Détails des Livreurs
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Livreurs de la zone: <span className="font-semibold">{zoneName}</span>
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {canCreateBons && (
              <Button
                onClick={() => router.push(`/payments/bons-livreur/create?zone=${zoneId}`)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Icon icon="heroicons:document-text" className="w-4 h-4 mr-2" />
                Générer
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => router.push("/payments/zones-summary")}
            >
              <Icon icon="heroicons:arrow-left" className="w-4 h-4 mr-2" />
              Retour aux Zones
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

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>Total Livreurs</span>
                  <Icon icon="heroicons:users" className="w-5 h-5 text-yellow-500" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics.totalLivreurs}</div>
                <p className="text-xs text-gray-500 mt-1">Dans cette zone</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>Colis Livrés</span>
                  <Icon icon="heroicons:check-circle" className="w-5 h-5 text-green-500" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {statistics.totalDelivered}
                </div>
                <p className="text-xs text-gray-500 mt-1">Livraisons réussies</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>Colis Retournés</span>
                  <Icon icon="heroicons:arrow-uturn-left" className="w-5 h-5 text-yellow-500" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {statistics.totalReturned}
                </div>
                <p className="text-xs text-gray-500 mt-1">Retours</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>Colis Refusés</span>
                  <Icon icon="heroicons:x-circle" className="w-5 h-5 text-red-500" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {statistics.totalRefused}
                </div>
                <p className="text-xs text-gray-500 mt-1">Refus clients</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>Montant Total</span>
                  <Icon icon="heroicons:currency-dollar" className="w-5 h-5 text-blue-500" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {statistics.totalAmount?.toLocaleString()} DH
                </div>
                <p className="text-xs text-gray-500 mt-1">Valeur totale</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Table Card */}
        <Card className="bg-white dark:bg-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Liste des Livreurs - {zoneName}</span>
              {canViewLivreurs && (
                <Badge color="secondary" className="text-xs">
                  <Icon icon="heroicons:eye" className="w-3 h-3 mr-1" />
                  Vue Détaillée
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {canViewLivreurs ? (
              <LivreursSummaryTable isAdminView={true} />
            ) : (
              <div className="p-8 text-center">
                <Icon icon="heroicons:lock-closed" className="w-12 h-12 text-gray-400 mx-auto" />
                <h3 className="font-medium text-gray-900 mt-4">
                  Pas d'autorisation
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Vous n'avez pas la permission de voir les livreurs.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default function LivreursSummaryPage() {
  return (
    <ProtectedRoute
      requiredPermissions={[PAYMENTS_PERMISSIONS.BONS_READ]}
      requiredAccessLevel="LIMITED"
      allowedAccountStatuses={["ACTIVE"]}
    >
      <LivreursSummaryContent />
    </ProtectedRoute>
  );
}