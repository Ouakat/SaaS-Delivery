// /components/payments/livreurs-summary-table.tsx
"use client";

import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useRouter, useSearchParams } from "next/navigation";
import { useLivreursSummaryStore } from "@/lib/stores/payments/livreurs-summary.store";
import { useAuthStore } from "@/lib/stores/auth/auth.store";
import { PAYMENTS_PERMISSIONS } from "@/lib/constants/payments";
import { toast } from "sonner";

// Table Components
const Table = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <table className={`w-full text-left border-collapse ${className}`}>
    {children}
  </table>
);

const TableHeader = ({ children }: { children: React.ReactNode }) => (
  <thead className="bg-gray-50 dark:bg-slate-700/40">{children}</thead>
);

const TableBody = ({ children }: { children: React.ReactNode }) => (
  <tbody>{children}</tbody>
);

const TableRow = ({ children, className = "", ...props }: any) => (
  <tr className={`border-b hover:bg-gray-50 dark:hover:bg-slate-700/30 ${className}`} {...props}>
    {children}
  </tr>
);

const TableHead = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <th className={`px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-400 ${className}`}>
    {children}
  </th>
);

const TableCell = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <td className={`px-4 py-3 text-sm ${className}`}>{children}</td>
);

const LivreursSummaryTable = ({ isAdminView = true }: { isAdminView?: boolean }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const zoneId = searchParams.get("zone");
  const zoneName = searchParams.get("name");
  
  const { hasPermission } = useAuthStore();
  const { 
    livreurs, 
    isLoading, 
    searchTerm,
    setSearchTerm,
    fetchLivreursByZone,
    generateBonForLivreur 
  } = useLivreursSummaryStore();

  // Permissions
  const canGenerateBons = hasPermission(PAYMENTS_PERMISSIONS.BONS_CREATE);
  const canViewDetails = hasPermission(PAYMENTS_PERMISSIONS.BONS_READ);

  useEffect(() => {
    if (zoneId) {
      fetchLivreursByZone(zoneId);
    }
  }, [zoneId]);

  const handleGenerate = async (livreur: any) => {
    try {
      await generateBonForLivreur(livreur.id);
      toast.success(`Bon généré pour ${livreur.name}`);
      router.push(`/payments/bons-livreur/create?livreur=${livreur.id}&zone=${zoneId}`);
    } catch (error) {
      toast.error("Erreur lors de la génération du bon");
    }
  };

  const handleViewDetails = (livreur: any) => {
    router.push(`/payments/bons/livreurs/create?livreur=${livreur.id}?zone=${zoneId}`);
  };

  // Filtrer par recherche
  const filteredLivreurs = livreurs.filter(l => 
    l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculer les totaux
  const totals = {
    delivered: filteredLivreurs.reduce((sum, l) => sum + l.ordersDelivered, 0),
    returned: filteredLivreurs.reduce((sum, l) => sum + l.ordersReturned, 0),
    refused: filteredLivreurs.reduce((sum, l) => sum + l.ordersRefused, 0),
    amount: filteredLivreurs.reduce((sum, l) => sum + l.totalAmount, 0),
  };

  const calculatePerformanceScore = (livreur: any) => {
    const total = livreur.ordersDelivered + livreur.ordersReturned + livreur.ordersRefused;
    if (total === 0) return 0;
    return ((livreur.ordersDelivered / total) * 100).toFixed(1);
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex items-center gap-4">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Rechercher un livreur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-white dark:bg-slate-700"
            prefix={<Icon icon="heroicons:magnifying-glass" className="w-4 h-4 text-gray-500" />}
          />
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {filteredLivreurs.length} livreur(s) trouvé(s)
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Livreur</TableHead>
              <TableHead>Code</TableHead>
              <TableHead className="text-center">Livrés</TableHead>
              <TableHead className="text-center">Retournés</TableHead>
              <TableHead className="text-center">Refusés</TableHead>
              <TableHead className="text-center">Total Colis</TableHead>
              <TableHead className="text-right">Montant</TableHead>
              <TableHead className="text-center">Performance</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  <Icon icon="heroicons:arrow-path" className="h-6 w-6 animate-spin mx-auto" />
                  <p className="mt-2 text-gray-500">Chargement...</p>
                </TableCell>
              </TableRow>
            ) : filteredLivreurs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                  Aucun livreur trouvé
                </TableCell>
              </TableRow>
            ) : (
              <>
                {filteredLivreurs.map((livreur) => {
                  const totalOrders = livreur.ordersDelivered + livreur.ordersReturned + livreur.ordersRefused;
                  const performanceScore = calculatePerformanceScore(livreur);
                  
                  return (
                    <TableRow key={livreur.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                            <span className="text-sm font-semibold text-blue-600 dark:text-blue-300">
                              {livreur.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-gray-200">
                              {livreur.name}
                            </p>
                            {livreur.phone && (
                              <p className="text-xs text-gray-500">{livreur.phone}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs">{livreur.code || '-'}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-green-100 dark:bg-green-600/20 text-green-700 dark:text-green-400">
                          {livreur.ordersDelivered}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-yellow-100 dark:bg-yellow-600/20 text-yellow-700 dark:text-yellow-400">
                          {livreur.ordersReturned}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-red-100 dark:bg-red-600/20 text-red-700 dark:text-red-400">
                          {livreur.ordersRefused}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-semibold">
                        {totalOrders}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {livreur.totalAmount.toLocaleString()} DH
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 bg-gray-200 dark:bg-slate-600 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                parseFloat(performanceScore) >= 80 ? 'bg-green-500' :
                                parseFloat(performanceScore) >= 60 ? 'bg-yellow-500' :
                                'bg-red-500'
                              }`}
                              style={{ width: `${performanceScore}%` }}
                            />
                          </div>
                          <span className={`text-sm font-semibold ${
                            parseFloat(performanceScore) >= 80 ? 'text-green-600' :
                            parseFloat(performanceScore) >= 60 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {performanceScore}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          {canViewDetails && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewDetails(livreur)}
                            >
                              <Icon icon="heroicons:eye" className="w-4 h-4" />
                            </Button>
                          )}
                          {/* {canGenerateBons && (
                            <Button
                              size="sm"
                              onClick={() => handleGenerate(livreur)}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <Icon icon="heroicons:document-text" className="w-4 h-4" />
                            </Button>
                          )} */}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                
                {/* Total Row */}
                <TableRow className="bg-gray-100 dark:bg-slate-800 font-semibold">
                  <TableCell colSpan={2} className="text-gray-900 dark:text-gray-100">
                    TOTAL ({filteredLivreurs.length} livreurs)
                  </TableCell>
                  <TableCell className="text-center text-green-600">
                    {totals.delivered}
                  </TableCell>
                  <TableCell className="text-center text-yellow-600">
                    {totals.returned}
                  </TableCell>
                  <TableCell className="text-center text-red-600">
                    {totals.refused}
                  </TableCell>
                  <TableCell className="text-center">
                    {totals.delivered + totals.returned + totals.refused}
                  </TableCell>
                  <TableCell className="text-right">
                    {totals.amount.toLocaleString()} DH
                  </TableCell>
                  <TableCell colSpan={2}></TableCell>
                </TableRow>
              </>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default LivreursSummaryTable;