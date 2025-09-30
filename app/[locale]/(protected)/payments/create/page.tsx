// app/[locale]/(protected)/payments/factures/create/page.tsx
"use client";

import React, { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import PendingFacturesTable from "@/components/payments/pending-payments-table";
import { useAuthStore } from "@/lib/stores/auth/auth.store";
import { usePendingFacturesStore } from "@/lib/stores/payments/pending-factures.store";
import { ProtectedRoute } from "@/components/route/protected-route";
import { PAYMENTS_PERMISSIONS } from "@/lib/constants/payments";

const CreateFacturesContent = () => {
  const router = useRouter();
  const { hasPermission } = useAuthStore();
  const { statistics, fetchStatistics } = usePendingFacturesStore();
  
  const canViewFactures = hasPermission(PAYMENTS_PERMISSIONS.FACTURES_READ);
  const canCreateFactures = hasPermission(PAYMENTS_PERMISSIONS.FACTURES_CREATE);

  useEffect(() => {
    if (canViewFactures) {
      fetchStatistics().catch(console.error);
    }
  }, [canViewFactures]);

  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Générer les Factures
          </h1>
          <p className="text-gray-600 mt-1">
            Factures en attente de validation
          </p>
        </div>
        
        <Button
          variant="outline"
          onClick={() => router.push("/payments")}
        >
          <Icon icon="heroicons:arrow-left" className="w-4 h-4 mr-2" />
          Retour
        </Button>
      </div>

      {/* Statistics */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total en attente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.totalPending}</div>
              <p className="text-xs text-gray-500">Factures à générer</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Montant total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statistics.totalAmount.toLocaleString()} DH
              </div>
              <p className="text-xs text-gray-500">À facturer</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Colis totaux</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.totalParcels}</div>
              <p className="text-xs text-gray-500">Colis livrés</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Clients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.totalClients}</div>
              <p className="text-xs text-gray-500">Clients concernés</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Table Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Factures en Attente</span>
            {canCreateFactures && (
              <Badge color="secondary" className="text-xs">
                <Icon icon="heroicons:plus-circle" className="w-3 h-3 mr-1" />
                Création Autorisée
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {canCreateFactures ? (
            <PendingFacturesTable isAdminView={true} />
          ) : (
            <div className="p-8 text-center">
              <Icon icon="heroicons:lock-closed" className="w-12 h-12 text-gray-400 mx-auto" />
              <h3 className="font-medium text-gray-900 mt-4">
                Pas d'autorisation
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Vous n'avez pas la permission de générer des factures.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default function CreateFacturesPage() {
  return (
    <ProtectedRoute
      requiredPermissions={[PAYMENTS_PERMISSIONS.FACTURES_CREATE]}
      requiredAccessLevel="LIMITED"
      allowedAccountStatuses={["ACTIVE"]}
    >
      <CreateFacturesContent />
    </ProtectedRoute>
  );
}