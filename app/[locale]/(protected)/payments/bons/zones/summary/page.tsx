// app/[locale]/(protected)/payments/zones-summary-bons/page.tsx
"use client";

import React, { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import ZonesSummaryBonsTable from "@/components/payments/zones-summary-bons-table";
import { useAuthStore } from "@/lib/stores/auth/auth.store";
import { useZonesSummaryBonsStore } from "@/lib/stores/payments/zones-summary-bons.store";
import { ProtectedRoute } from "@/components/route/protected-route";
import { PAYMENTS_PERMISSIONS } from "@/lib/constants/payments";

const ZonesSummaryBonsContent = () => {
  const router = useRouter();
  const { hasPermission } = useAuthStore();
  const { statistics, fetchStatistics } = useZonesSummaryBonsStore();
  
  const canViewZones = hasPermission(PAYMENTS_PERMISSIONS.BONS_READ);
  const canCreateBons = hasPermission(PAYMENTS_PERMISSIONS.BONS_CREATE);
  const canExportData = hasPermission(PAYMENTS_PERMISSIONS.BONS_EXPORT);

  useEffect(() => {
    if (canViewZones) {
      fetchStatistics().catch(console.error);
    }
  }, [canViewZones]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="container mx-auto py-6 px-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Résumé des Zones - Bons
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Vue d'ensemble des commandes et bons par zone
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
            {canExportData && (
              <Button variant="outline">
                <Icon icon="heroicons:arrow-down-tray" className="w-4 h-4 mr-2" />
                Exporter
              </Button>
            )}
            <Button
              onClick={() => router.push("/payments/bons-zone")}
              className="bg-slate-700 hover:bg-slate-600"
            >
              <Icon icon="heroicons:arrow-left" className="w-4 h-4 mr-2" />
              Retour
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="bg-white dark:bg-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>Total Zones</span>
                  <Icon icon="heroicons:map-pin" className="w-5 h-5 text-blue-500" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics.totalZones}</div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Zones actives
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>Total Livrées</span>
                  <Icon icon="heroicons:check-circle" className="w-5 h-5 text-green-500" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {statistics.totalDelivered}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Commandes livrées
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>Total Refusées</span>
                  <Icon icon="heroicons:x-circle" className="w-5 h-5 text-red-500" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {statistics.totalRefused}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Commandes refusées
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>En Attente</span>
                  <Icon icon="heroicons:clock" className="w-5 h-5 text-yellow-500" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {statistics.totalPending}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Commandes en attente
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>Taux Global</span>
                  <Icon icon="heroicons:chart-bar" className="w-5 h-5 text-purple-500" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {statistics.globalSuccessRate}%
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Taux de succès
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Table Card */}
        <Card className="bg-white dark:bg-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Détails par Zone</span>
              {canViewZones && (
                <Badge color="secondary" className="text-xs">
                  <Icon icon="heroicons:eye" className="w-3 h-3 mr-1" />
                  Vue Détaillée
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {canViewZones ? (
              <ZonesSummaryBonsTable isAdminView={true} />
            ) : (
              <div className="p-8 text-center">
                <Icon icon="heroicons:lock-closed" className="w-12 h-12 text-gray-400 mx-auto" />
                <h3 className="font-medium text-gray-900 mt-4">
                  Pas d'autorisation
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Vous n'avez pas la permission de voir les zones.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default function ZonesSummaryBonsPage() {
  return (
    <ProtectedRoute
      requiredPermissions={[PAYMENTS_PERMISSIONS.BONS_READ]}
      requiredAccessLevel="LIMITED"
      allowedAccountStatuses={["ACTIVE"]}
    >
      <ZonesSummaryBonsContent />
    </ProtectedRoute>
  );
}