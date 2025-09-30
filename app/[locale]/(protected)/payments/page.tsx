// app/payments/factures/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/routing";
import { useRouter } from "next/navigation";
import FacturesTable from "@/components/payments/factures-table";
import { useAuthStore } from "@/lib/stores/auth/auth.store";
import { useFacturesStore } from "@/lib/stores/payments/factures.store";
import { ProtectedRoute } from "@/components/route/protected-route";
import { PAYMENTS_PERMISSIONS } from "@/lib/constants/payments";



const FacturesPageContent = () => {

  const router = useRouter();
  const { hasPermission, user, hasAnyPermission } = useAuthStore();
  const { statistics, fetchStatistics,fetchFactures } = useFacturesStore();

  // Check permissions
  const canViewFactures = hasPermission(PAYMENTS_PERMISSIONS.FACTURES_READ);
  const canCreateFactures = hasPermission(PAYMENTS_PERMISSIONS.FACTURES_CREATE);
  const canUpdateFactures = hasPermission(PAYMENTS_PERMISSIONS.FACTURES_UPDATE);
  const canDeleteFactures = hasPermission(PAYMENTS_PERMISSIONS.FACTURES_DELETE);
  const canManageFactures = hasPermission(PAYMENTS_PERMISSIONS.FACTURES_MANAGE);
  const canExportFactures = hasPermission(PAYMENTS_PERMISSIONS.FACTURES_EXPORT);

  const hasAnyFacturePermissions = hasAnyPermission([
    PAYMENTS_PERMISSIONS.FACTURES_READ,
    PAYMENTS_PERMISSIONS.FACTURES_CREATE,
    PAYMENTS_PERMISSIONS.FACTURES_UPDATE,
    PAYMENTS_PERMISSIONS.FACTURES_DELETE,
    PAYMENTS_PERMISSIONS.FACTURES_MANAGE,
  ]);

  // Fetch statistics on mount
  useEffect(() => {
    if (canViewFactures) {
      // جلب البيانات
      fetchFactures().catch(console.error);
      fetchStatistics().catch(console.error);
    }
  }, [canViewFactures]);


if (!hasAnyFacturePermissions) {
    return (
      <div className="space-y-6 p-6">
        <Alert className="border-red-200 bg-red-50">
          <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <div className="font-medium">Accès Refusé</div>
            <div className="mt-1">
              Vous n'avez pas la permission d'accéder à la gestion des factures.
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestion des Factures
          </h1>
          <p className="text-gray-600 mt-1">
            Gérez vos factures et paiements
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canExportFactures && (
            <Button variant="outline" size="md">
              <Icon icon="heroicons:arrow-down-tray" className="w-4 h-4 mr-2" />
              Exporter
            </Button>
          )}

          {canCreateFactures && (
            <Button onClick={() => router.push("/payments/create")} className="bg-indigo-600 hover:bg-indigo-700">
              <Icon icon="heroicons:plus" className="w-4 h-4 mr-2" />
              Nouvelle Facture
            </Button>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Factures
              </CardTitle>
              <Icon icon="heroicons:document-text" className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.totalFactures}</div>
              <p className="text-xs text-gray-500 mt-1">
                Toutes les factures
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Montant Total
              </CardTitle>
              <Icon icon="heroicons:currency-dollar" className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statistics.totalAmount.toLocaleString()} DH
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Valeur totale des factures
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Montant Payé
              </CardTitle>
              <Icon icon="heroicons:check-circle" className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {statistics.paidAmount.toLocaleString()} DH
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Factures payées
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                En Attente
              </CardTitle>
              <Icon icon="heroicons:clock" className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {statistics.pendingAmount.toLocaleString()} DH
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Montant en attente
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/payments/factures?status=DRAFT">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Icon icon="heroicons:document" className="w-5 h-5 text-gray-600" />
                Brouillons
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Factures en cours de création
              </p>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/payments/factures?status=SENT">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Icon icon="heroicons:paper-airplane" className="w-5 h-5 text-blue-600" />
                Envoyées
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Factures envoyées aux clients
              </p>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/payments/factures?status=OVERDUE">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Icon icon="heroicons:exclamation-circle" className="w-5 h-5 text-red-600" />
                En Retard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Factures en retard de paiement
              </p>
            </CardContent>
          </Link>
        </Card>
      </div>

      {/* Factures Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Toutes les Factures</span>
            {canViewFactures && (
              <Badge color="secondary" className="text-xs">
                <Icon icon="heroicons:eye" className="w-3 h-3 mr-1" />
                Accès Lecture
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {canViewFactures ? (
            <FacturesTable isAdminView={true} />
          ) : (
            <div className="p-8 text-center">
              <Icon icon="heroicons:lock-closed" className="w-12 h-12 text-gray-400 mx-auto" />
              <h3 className="font-medium text-gray-900 mt-4">
                Pas d'autorisation de visualisation
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Vous n'avez pas la permission de voir la liste des factures.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default function FacturesPage() {
  return (
    <ProtectedRoute
      requiredPermissions={[PAYMENTS_PERMISSIONS.FACTURES_READ]}
      requiredAccessLevel="LIMITED"
      allowedAccountStatuses={["ACTIVE"]}
    >
      <FacturesPageContent />
    </ProtectedRoute>
  );
}