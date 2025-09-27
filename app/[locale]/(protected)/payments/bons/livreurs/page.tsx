// app/payments/collected-orders/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Icon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CollectedOrder {
  id: string;
  reference: string;
  createdDate: string;
  statusChangeDate?: string;
  zone: string;
  livreur: string;
  status: string;
  colis: number;
  total: string;
  badges: { label: string; color: string }[];
}

export default function CollectedOrdersPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedZone, setSelectedZone] = useState("all");
  const [selectedLivreur, setSelectedLivreur] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [dateRange, setDateRange] = useState("08/09/2025 - 20/09/2025");

  const orders: CollectedOrder[] = [
    {
      id: "1",
      reference: "BPL-200925-0301620-16-197",
      createdDate: "2025-09-20 13:05 RUSHLIV",
      zone: "HUB CASABLANCA",
      livreur: "AGENCE AIN BARJA",
      status: "Attente De Paiement",
      colis: 1,
      total: "100 DH",
      badges: [
        { label: "191 Dh", color: "green" },
        { label: "0", color: "yellow" },
        { label: "0", color: "blue" }
      ]
    },
    {
      id: "2",
      reference: "BPL-200925-0301610-91-491",
      createdDate: "2025-09-20 01:30 RUSHLIV",
      statusChangeDate: "2025-09-20 08:33 Hamid",
      zone: "HUB TANGER",
      livreur: "Nabil TNG",
      status: "En Cours de Traitement",
      colis: 11,
      total: "2788 DH",
      badges: [
        { label: "0 Dh", color: "green" },
        { label: "0", color: "yellow" },
        { label: "0", color: "blue" }
      ]
    },
    {
      id: "3",
      reference: "BPL-200925-0301600-73-490",
      createdDate: "2025-09-20 01:30 RUSHLIV",
      statusChangeDate: "2025-09-20 09:28 Hamid",
      zone: "HUB CASABLANCA",
      livreur: "Fouad Rampouz",
      status: "Payé",
      colis: 13,
      total: "2572 DH",
      badges: [
        { label: "4669 Dh", color: "green" },
        { label: "1969", color: "yellow" },
        { label: "0", color: "blue" }
      ]
    }
  ];

  const handleAddBonForLivreur = () => {
    router.push("/payments/bons/livreurs/zones-summary");
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-slate-900 dark:text-gray-100">
      <div className="p-6 space-y-4">
        {/* Header Buttons */}
        <div className="flex items-center gap-3">
          <Button 
            onClick={handleAddBonForLivreur}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Icon icon="heroicons:plus" className="w-4 h-4 mr-2" />
            Ajouter Bon Pour Livreur
          </Button>
          <Button 
            variant="outline"
            className="border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-slate-600 dark:text-gray-100 dark:hover:bg-slate-800"
          >
            <Icon icon="heroicons:document-text" className="w-4 h-4 mr-2" />
            Générer
          </Button>
        </div>

        {/* Filters Section */}
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-4">
          <div className="grid grid-cols-9 gap-3 items-end">
            {/* Zones */}
            <div className="col-span-2">
              <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Zones</label>
              <Select value={selectedZone} onValueChange={setSelectedZone}>
                <SelectTrigger className="bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-gray-100">
                  <SelectValue placeholder="Toutes les zones" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600">
                  <SelectItem value="all">Toutes les zones</SelectItem>
                  <SelectItem value="HUB CASABLANCA">HUB CASABLANCA</SelectItem>
                  <SelectItem value="HUB TANGER">HUB TANGER</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Livreur */}
            <div className="col-span-2">
              <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Livreur</label>
              <Select value={selectedLivreur} onValueChange={setSelectedLivreur}>
                <SelectTrigger className="bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-gray-100">
                  <SelectValue placeholder="Tous les livreurs" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600">
                  <SelectItem value="all">Tous les livreurs</SelectItem>
                  <SelectItem value="AGENCE AIN BARJA">AGENCE AIN BARJA</SelectItem>
                  <SelectItem value="Nabil TNG">Nabil TNG</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="col-span-2">
              <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Statut</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-gray-100">
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600">
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="Attente De Paiement">Attente De Paiement</SelectItem>
                  <SelectItem value="En Cours de Traitement">En Cours de Traitement</SelectItem>
                  <SelectItem value="Payé">Payé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="col-span-2">
              <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Période</label>
              <Input
                value={dateRange}
                className="bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-gray-100"
                readOnly
              />
            </div>

            {/* Filter Button */}
            <div className="col-span-1">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                Filtrer
              </Button>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg">
          {/* Table Controls */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700">
            <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
              <span>Afficher</span>
              <Select defaultValue="50">
                <SelectTrigger className="w-20 bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-gray-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600">
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <span>entrées par page</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-gray-600 dark:text-gray-400">Rechercher:</span>
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-gray-100"
              />
              <Button className="bg-green-600 hover:bg-green-700 text-white" size="icon">
                <Icon icon="heroicons:magnifying-glass" className="w-4 h-4" />
              </Button>
              <Button className="bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-slate-700 dark:text-gray-100 dark:hover:bg-slate-600" size="icon">
                <Icon icon="heroicons:arrow-path" className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-slate-700/50">
                  <TableHead className="text-gray-700 dark:text-gray-400">Référence</TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-400">Date de création</TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-400">Date changement</TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-400">Zone</TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-400">Livreur</TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-400">Statut</TableHead>
                  <TableHead className="text-center text-gray-700 dark:text-gray-400">Colis</TableHead>
                  <TableHead className="text-right text-gray-700 dark:text-gray-400">Total</TableHead>
                  <TableHead className="text-center text-gray-700 dark:text-gray-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30">
                    <TableCell className="font-mono text-xs text-gray-900 dark:text-gray-300">{order.reference}</TableCell>
                    <TableCell className="text-xs text-gray-900 dark:text-gray-300">{order.createdDate}</TableCell>
                    <TableCell className="text-xs text-gray-900 dark:text-gray-300">{order.statusChangeDate || "-"}</TableCell>
                    <TableCell className="text-gray-900 dark:text-gray-300">{order.zone}</TableCell>
                    <TableCell className="text-gray-900 dark:text-gray-300">{order.livreur}</TableCell>
                    <TableCell>
                      <Badge className={`
                        ${order.status === "Payé" ? "bg-green-100 text-green-800 dark:bg-green-600 dark:text-white" : 
                          order.status === "En Cours de Traitement" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-600 dark:text-white" : 
                          "bg-red-100 text-red-800 dark:bg-red-600 dark:text-white"}
                      `}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center text-gray-900 dark:text-gray-100 font-semibold">{order.colis}</TableCell>
                    <TableCell className="text-right text-gray-900 dark:text-gray-100 font-semibold">{order.total}</TableCell>
                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-slate-600">
                            •••
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600">
                          <DropdownMenuItem className="text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-slate-600">
                            <Icon icon="heroicons:eye" className="w-4 h-4 mr-2" />
                            Voir détails
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-slate-600">
                            <Icon icon="heroicons:pencil" className="w-4 h-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
