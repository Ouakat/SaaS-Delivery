// app/[locale]/(protected)/payments/zones-summary/page.tsx
"use client";

import React, { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import ZonesSummaryTable from "@/components/payments/zones-summary-table";
import { useAuthStore } from "@/lib/stores/auth/auth.store";
import { useZonesSummaryStore } from "@/lib/stores/payments/zones-summary.store";
import { ProtectedRoute } from "@/components/route/protected-route";
import { PAYMENTS_PERMISSIONS } from "@/lib/constants/payments";

const ZonesSummaryContent = () => {
  const router = useRouter();
  const { hasPermission } = useAuthStore();
  const { statistics, fetchStatistics } = useZonesSummaryStore();
  
  const canViewZones = hasPermission(PAYMENTS_PERMISSIONS.BONS_READ);
  const canExportData = hasPermission(PAYMENTS_PERMISSIONS.BONS_EXPORT);

  useEffect(() => {
    if (canViewZones) {
      fetchStatistics().catch(console.error);
    }
  }, [canViewZones, fetchStatistics]);

  const handleExport = () => {
    // Export logic
    console.log("Exporting zones summary...");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="container mx-auto py-6 px-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Résumé par Zone
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Vue d'ensemble des performances par zone de livraison
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {canExportData && (
              <Button
                variant="outline"
                onClick={handleExport}
              >
                <Icon icon="heroicons:arrow-down-tray" className="w-4 h-4 mr-2" />
                Exporter
              </Button>
            )}
            <Button
              onClick={() => router.push("/payments/bons-livreur")}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Icon icon="heroicons:arrow-left" className="w-4 h-4 mr-2" />
              Retour
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
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

            <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>Total Livrés</span>
                  <Icon icon="heroicons:check-circle" className="w-5 h-5 text-green-500" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {statistics.totalDelivered}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Colis livrés avec succès
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>Total Refusés</span>
                  <Icon icon="heroicons:x-circle" className="w-5 h-5 text-red-500" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {statistics.totalRefused}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Colis refusés
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>Total Livreurs</span>
                  <Icon icon="heroicons:users" className="w-5 h-5 text-yellow-500" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {statistics.totalLivreurs}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Livreurs actifs
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Performance Chart Placeholder */}
        <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle>Performance par Zone</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-gray-500">
              {/* Chart placeholder - peut être remplacé par un vrai graphique */}
              <div className="text-center">
                <Icon icon="heroicons:chart-bar" className="w-16 h-16 mx-auto mb-2 text-gray-400" />
                <p>Graphique de performance</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table Card */}
        <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
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
              <ZonesSummaryTable isAdminView={true} />
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

export default function ZonesSummaryPage() {
  return (
    <ProtectedRoute
      requiredPermissions={[PAYMENTS_PERMISSIONS.BONS_READ]}
      requiredAccessLevel="LIMITED"
      allowedAccountStatuses={["ACTIVE"]}
    >
      <ZonesSummaryContent />
    </ProtectedRoute>
  );
}