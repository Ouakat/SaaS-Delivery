// /components/payments/zones-summary-table.tsx
"use client";

import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { useZonesSummaryStore } from "@/lib/stores/payments/zones-summary.store";
import { useAuthStore } from "@/lib/stores/auth/auth.store";
import { PAYMENTS_PERMISSIONS } from "@/lib/constants/payments";

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

const ZonesSummaryTable = ({ isAdminView = true }: { isAdminView?: boolean }) => {
  const router = useRouter();
  const { hasPermission } = useAuthStore();
  const { zones, isLoading, fetchZonesSummary } = useZonesSummaryStore();

  // Permissions
  const canViewDetails = hasPermission(PAYMENTS_PERMISSIONS.BONS_READ);

  useEffect(() => {
    fetchZonesSummary();
  }, []);

  const handleShowDetails = (zoneId: string, zoneName: string) => {
    router.push(`/payments/bons/livreurs/livreurs-summary?zone=${zoneId}&name=${encodeURIComponent(zoneName)}`);
  };

  const calculateTotalDelivered = () => zones.reduce((sum, z) => sum + z.ordersDelivered, 0);
  const calculateTotalRefused = () => zones.reduce((sum, z) => sum + z.ordersRefused, 0);
  const calculateTotalReturned = () => zones.reduce((sum, z) => sum + z.ordersReturned, 0);
  const calculateTotalLivreurs = () => zones.reduce((sum, z) => sum + z.livreurCount, 0);
  const calculateSuccessRate = (delivered: number, total: number) => {
    if (total === 0) return 0;
    return ((delivered / total) * 100).toFixed(1);
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Zone</TableHead>
            <TableHead className="text-center">Livreurs</TableHead>
            <TableHead className="text-center">Total Colis</TableHead>
            <TableHead className="text-center">Livrés</TableHead>
            <TableHead className="text-center">Retournés</TableHead>
            <TableHead className="text-center">Refusés</TableHead>
            <TableHead className="text-center">Taux de Succès</TableHead>
            <TableHead className="text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8">
                <Icon icon="heroicons:arrow-path" className="h-6 w-6 animate-spin mx-auto" />
                <p className="mt-2 text-gray-500">Chargement...</p>
              </TableCell>
            </TableRow>
          ) : zones.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                Aucune zone trouvée
              </TableCell>
            </TableRow>
          ) : (
            <>
              {zones.map((zone) => {
                const totalOrders = zone.ordersDelivered + zone.ordersReturned + zone.ordersRefused;
                const successRate = calculateSuccessRate(zone.ordersDelivered, totalOrders);
                
                return (
                  <TableRow key={zone.id}>
                    <TableCell className="font-semibold text-gray-900 dark:text-gray-200">
                      <div className="flex items-center gap-2">
                        <Icon icon="heroicons:map-pin" className="w-4 h-4 text-blue-500" />
                        {zone.zone}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className="bg-blue-100 dark:bg-blue-600/20 text-blue-700 dark:text-blue-400">
                        {zone.livreurCount}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center font-semibold">
                      {totalOrders}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className="bg-green-100 dark:bg-green-600/20 text-green-700 dark:text-green-400">
                        {zone.ordersDelivered}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className="bg-yellow-100 dark:bg-yellow-600/20 text-yellow-700 dark:text-yellow-400">
                        {zone.ordersReturned}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className="bg-red-100 dark:bg-red-600/20 text-red-700 dark:text-red-400">
                        {zone.ordersRefused}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`font-semibold ${
                        parseFloat(successRate) >= 80 ? 'text-green-600' :
                        parseFloat(successRate) >= 60 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {successRate}%
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {canViewDetails && (
                        <Button
                          onClick={() => handleShowDetails(zone.id, zone.zone)}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                          size="sm"
                        >
                          <Icon icon="heroicons:eye" className="w-4 h-4 mr-1" />
                          Détails
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              
              {/* Total Row */}
              <TableRow className="bg-gray-100 dark:bg-slate-800 font-semibold">
                <TableCell className="text-gray-900 dark:text-gray-100">
                  TOTAL
                </TableCell>
                <TableCell className="text-center">
                  <Badge className="bg-blue-600 text-white">
                    {calculateTotalLivreurs()}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  {calculateTotalDelivered() + calculateTotalReturned() + calculateTotalRefused()}
                </TableCell>
                <TableCell className="text-center text-green-600">
                  {calculateTotalDelivered()}
                </TableCell>
                <TableCell className="text-center text-yellow-600">
                  {calculateTotalReturned()}
                </TableCell>
                <TableCell className="text-center text-red-600">
                  {calculateTotalRefused()}
                </TableCell>
                <TableCell className="text-center">
                  {calculateSuccessRate(
                    calculateTotalDelivered(),
                    calculateTotalDelivered() + calculateTotalReturned() + calculateTotalRefused()
                  )}%
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
            </>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default ZonesSummaryTable;