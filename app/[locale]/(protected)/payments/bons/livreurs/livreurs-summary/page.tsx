// app/payments/livreurs-summary/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

interface LivreurSummary {
  id: string;
  name: string;
  zone: string;
  ordersDelivered: number;
  ordersRefused: number;
}

export default function LivreursSummaryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const zoneFilter = searchParams.get("zone");

  const [livreurs] = useState<LivreurSummary[]>([
    { id: "1", name: "Ali Mohammed", zone: "HUB CASABLANCA", ordersDelivered: 2, ordersRefused: 6 },
    { id: "2", name: "Ahmed Benali", zone: "HUB CASABLANCA", ordersDelivered: 5, ordersRefused: 3 },
    { id: "3", name: "Youssef Alami", zone: "HUB TANGER", ordersDelivered: 4, ordersRefused: 2 },
    { id: "4", name: "Karim Hassani", zone: "HUB RABAT", ordersDelivered: 3, ordersRefused: 1 },
  ]);

  const handleGenerate = (livreurId: string) => {
    router.push(`/payments/bons/livreurs/create?livreur=${livreurId}&zone=${zoneFilter || ""}`);
  };

  const handleBack = () => {
    router.push("/payments/bons/livreurs/zones-summary");
  };

  // Filtrage par zone
  const filteredLivreurs = zoneFilter
    ? livreurs.filter(l => l.id.toString() === zoneFilter.toString())
    : livreurs;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-slate-900 dark:text-gray-100">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Détails des Livreurs</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Commandes par livreur {zoneFilter && `- Zone: HUB ${zoneFilter}`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              onClick={handleBack}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Icon icon="heroicons:arrow-left" className="w-4 h-4 mr-2" />
              Retour aux Zones
            </Button>
            <Button 
              onClick={() => router.push("/payments/bons/livreurs")}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-slate-700 dark:text-gray-100 dark:hover:bg-slate-600"
            >
              <Icon icon="heroicons:home" className="w-4 h-4 mr-2" />
              Page Principale
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Total Livreurs</p>
                <p className="text-2xl font-bold mt-1">{filteredLivreurs.length}</p>
              </div>
              <Icon icon="heroicons:users" className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Total Livrés</p>
                <p className="text-2xl font-bold mt-1 text-green-600 dark:text-green-400">
                  {filteredLivreurs.reduce((sum, l) => sum + l.ordersDelivered, 0)}
                </p>
              </div>
              <Icon icon="heroicons:check-circle" className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Total Refusés</p>
                <p className="text-2xl font-bold mt-1 text-red-600 dark:text-red-400">
                  {filteredLivreurs.reduce((sum, l) => sum + l.ordersRefused, 0)}
                </p>
              </div>
              <Icon icon="heroicons:x-circle" className="w-8 h-8 text-red-500" />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
          <div className="p-4 border-b border-gray-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold">Liste des Livreurs</h2>
          </div>
          
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-slate-700/40">
                <TableHead className="text-gray-700 dark:text-gray-400">Livreur</TableHead>
                <TableHead className="text-gray-700 dark:text-gray-400">Zone</TableHead>
                <TableHead className="text-gray-700 dark:text-gray-400">Commandes</TableHead>
                <TableHead className="text-gray-700 dark:text-gray-400 text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLivreurs.map((livreur) => (
                <TableRow key={livreur.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30">
                  <TableCell className="font-semibold text-gray-900 dark:text-gray-200">
                    {livreur.name}
                  </TableCell>
                  <TableCell>
                    <span className="bg-blue-100 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 px-3 py-0.5 rounded">
                      {livreur.zone}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-4">
                      <span className="inline-flex items-center gap-2">
                        <span className="text-green-600 dark:text-green-400 font-semibold">Livrés:</span>
                        <span className="bg-green-100 dark:bg-green-600/20 text-green-600 dark:text-green-400 px-2 py-0.5 rounded">
                          {livreur.ordersDelivered}
                        </span>
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <span className="text-red-600 dark:text-red-400 font-semibold">Refusés:</span>
                        <span className="bg-red-100 dark:bg-red-600/20 text-red-600 dark:text-red-400 px-2 py-0.5 rounded">
                          {livreur.ordersRefused}
                        </span>
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      onClick={() => handleGenerate(livreur.id)}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      size="sm"
                    >
                      <Icon icon="heroicons:document-text" className="w-4 h-4 mr-2" />
                      Générer
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
