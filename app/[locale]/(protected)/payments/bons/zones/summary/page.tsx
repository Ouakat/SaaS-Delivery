// app/payments/zones-summary/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ZoneSummary {
  id: string;
  zone: string;
  ordersDelivered: number;
  ordersRefused: number;
}

export default function ZonesSummaryPage() {
  const router = useRouter();
  
  const [zones] = useState<ZoneSummary[]>([
    { id: "1", zone: "HUB CASABLANCA", ordersDelivered: 2, ordersRefused: 6 },
    { id: "2", zone: "HUB TANGER", ordersDelivered: 5, ordersRefused: 3 },
    { id: "3", zone: "HUB RABAT", ordersDelivered: 4, ordersRefused: 2 },
    { id: "4", zone: "HUB MARRAKECH", ordersDelivered: 3, ordersRefused: 1 },
  ]);

  const handleShowDetails = (zoneId: string) => {
    router.push(`/payments/bons/zones/create?zone=${zoneId}`);
  };

  const handleBack = () => {
    router.push("/payments/bons/zones");
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-slate-900 dark:text-gray-100">
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Résumé des Zones</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Vue d'ensemble des commandes par zone
            </p>
          </div>
          <Button 
            onClick={handleBack}
            className="bg-slate-700 hover:bg-slate-600 text-white"
          >
            <Icon icon="heroicons:arrow-left" className="w-4 h-4 mr-2" />
            Retour
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Total Zones</p>
                <p className="text-2xl font-bold mt-1">{zones.length}</p>
              </div>
              <Icon icon="heroicons:map-pin" className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Total Livrés</p>
                <p className="text-2xl font-bold mt-1 text-green-600 dark:text-green-500">
                  {zones.reduce((sum, z) => sum + z.ordersDelivered, 0)}
                </p>
              </div>
              <Icon icon="heroicons:check-circle" className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Total Refusés</p>
                <p className="text-2xl font-bold mt-1 text-red-600 dark:text-red-500">
                  {zones.reduce((sum, z) => sum + z.ordersRefused, 0)}
                </p>
              </div>
              <Icon icon="heroicons:x-circle" className="w-8 h-8 text-red-500" />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
          <div className="p-4 border-b border-gray-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold">Détails par Zone</h2>
          </div>
          
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-slate-700/40">
                <TableHead className="text-gray-700 dark:text-gray-400">Zone</TableHead>
                <TableHead className="text-gray-700 dark:text-gray-400">Nombre des Orders</TableHead>
                <TableHead className="text-gray-700 dark:text-gray-400 text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {zones.map((zone) => (
                <TableRow key={zone.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30">
                  <TableCell className="font-semibold text-gray-900 dark:text-gray-200">
                    {zone.zone}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-4">
                      <span className="inline-flex items-center gap-2">
                        <span className="text-green-600 dark:text-green-400 font-semibold">LIVRÉS:</span>
                        <span className="bg-green-100 text-green-800 dark:bg-green-600/20 dark:text-green-400 px-2 py-1 rounded">
                          {zone.ordersDelivered}
                        </span>
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <span className="text-red-600 dark:text-red-400 font-semibold">REFUSÉS:</span>
                        <span className="bg-red-100 text-red-800 dark:bg-red-600/20 dark:text-red-400 px-2 py-1 rounded">
                          {zone.ordersRefused}
                        </span>
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      onClick={() => handleShowDetails(zone.id)}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      size="sm"
                    >
                      <Icon icon="heroicons:eye" className="w-4 h-4 mr-2" />
                      Afficher Détails
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
