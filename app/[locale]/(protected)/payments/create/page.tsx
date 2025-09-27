// app/payments/factures/page.tsx
"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Icon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useRouter } from "next/navigation";
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Facture {
  id: string;
  reference: string;
  client: string;
  clientCode: string;
  createdDate: string;
  paymentDate?: string;
  status: string;
  colis: number;
  total: string;
  badges?: { label: string; color: string }[];
}


const generatePaymentBySeller = (body:any) => {

};

export default function FacturesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date("2025-09-08"),
    to: new Date("2025-09-20"),
  });

  const router = useRouter();

  const [factures] = useState<Facture[]>([
    {
      id: "1",
      reference: "FCT-200925-0142430-21-296",
      client: "CLIENT PASS",
      clientCode: "GERIE - (101)",
      createdDate: "2025-09-20 13:12 RUSHLIV",
      status: "Pending",
      colis: 100,
      total: "81 DH",
      badges: [
        { label: "0", color: "yellow" },
        { label: "0", color: "blue" }
      ]
    },
    {
      id: "2",
      reference: "FCT-190925-0142420-41-179",
      client: "AUTOCOUVERT",
      clientCode: "(483)",
      createdDate: "2025-09-19 19:19 RUSHLIV",
      status: "Pending",
      colis: 10,
      total: "-30 DH",
      badges: [
        { label: "0", color: "yellow" },
        { label: "0", color: "blue" }
      ]
    },
    {
      id: "3",
      reference: "FCT-190925-0142410-96-389",
      client: "LIVREGO",
      clientCode: "(127)",
      createdDate: "2025-09-19 10:51 RUSHLIV",
      paymentDate: "2025-09-19 15:40 wafae",
      status: "Pending",
      colis: 200,
      total: "1861 DH",
      badges: [
        { label: "0", color: "yellow" },
        { label: "1861", color: "blue" }
      ]
    },
    {
      id: "4",
      reference: "FCT-190925-0142400-75-387",
      client: "DÉCORT",
      clientCode: "()",
      createdDate: "2025-09-19 10:51 RUSHLIV",
      paymentDate: "2025-09-19 12:12 wafae",
      status: "Pending",
      colis: 30,
      total: "2050 DH",
      badges: [
        { label: "0", color: "yellow" },
        { label: "2050", color: "blue" }
      ]
    },
    {
      id: "5",
      reference: "FCT-190925-0142390-70-385",
      client: "SK SYSTEME",
      clientCode: "(4798)",
      createdDate: "2025-09-19 10:51 RUSHLIV",
      paymentDate: "2025-09-19 15:26 wafae",
      status: "Pending",
      colis: 15,
      total: "629 DH",
      badges: [
        { label: "0", color: "yellow" },
        { label: "629", color: "blue" }
      ]
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Payé":
        return "bg-green-100 text-green-700";
      case "Brouillon":
        return "bg-gray-100 text-gray-700";
      case "En attente":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const handleBack = () => {
    router.push("/payments");
  };

  return (
    <div className="container-fluid mx-auto py-4 px-6 space-y-4 bg-gray-50">
      {/* Header Buttons */}
      <div className="flex items-center justify-between">
      
        <Button 
          variant="outline"
          className="border-gray-300 text-gray-700 hover:bg-gray-100"
        >
          <Icon icon="heroicons:document-text" className="w-4 h-4 mr-2" />
          Générer
        </Button>

        <Button 
            onClick={handleBack}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Icon icon="heroicons:arrow-left" className="w-4 h-4 mr-2" />
            Retour
          </Button>

      </div>

      {/* Filters Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="grid grid-cols-9 gap-3 items-end">
          {/* Clients */}
          <div className="col-span-2">
            <label className="text-xs text-gray-500 mb-1 block">Clients</label>
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les clients" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les clients</SelectItem>
                <SelectItem value="CLIENT PASS">CLIENT PASS</SelectItem>
                <SelectItem value="AUTOCOUVERT">AUTOCOUVERT</SelectItem>
                <SelectItem value="LIVREGO">LIVREGO</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="col-span-2">
            <label className="text-xs text-gray-500 mb-1 block">Statut</label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="Payé">Payé</SelectItem>
                <SelectItem value="Brouillon">Brouillon</SelectItem>
                <SelectItem value="En attente">En attente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div className="col-span-3">
            <label className="text-xs text-gray-500 mb-1 block">Date de création</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal border-gray-300 text-gray-700 hover:bg-gray-100">
                  <Icon icon="heroicons:calendar" className="mr-2 h-4 w-4" />
                  {format(dateRange.from, "yyyy-MM-dd")} - {format(dateRange.to, "yyyy-MM-dd")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={(range: any) => setDateRange(range || dateRange)}
                  locale={fr}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Filter Button */}
          <div className="col-span-1">
            <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
              <Icon icon="heroicons:funnel" className="w-4 h-4 mr-2" />
              Filtrer
            </Button>
          </div>

          {/* Export Button */}
          <div className="col-span-1">
            <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
              <Icon icon="heroicons:arrow-down-tray" className="w-4 h-4 mr-2" />
              Exporter
            </Button>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white border border-gray-200 rounded-lg">
        {/* Table Controls */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3 text-gray-600">
            <span className="text-sm">Afficher</span>
            <Select defaultValue="50">
              <SelectTrigger className="w-20 border-gray-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm">entrées par page</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Rechercher:</span>
            <Input
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64 border-gray-300"
            />
            <Button className="bg-indigo-600 hover:bg-indigo-700" size="icon">
              <Icon icon="heroicons:magnifying-glass" className="w-4 h-4 text-white" />
            </Button>
            <Button variant="destructive" size="icon">
              <Icon icon="heroicons:arrow-path" className="w-4 h-4 text-white" />
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-12">
                  <Checkbox />
                </TableHead>
                <TableHead className="text-gray-700">Référence</TableHead>
                <TableHead className="text-gray-700">Client</TableHead>
                <TableHead className="text-gray-700">Statut</TableHead>
                <TableHead className="text-center text-gray-700">Colis</TableHead>
                <TableHead className="text-right text-gray-700">Total</TableHead>
                <TableHead className="text-gray-700">Generate</TableHead>
                <TableHead className="text-center text-gray-700">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {factures.map((facture) => (
                <TableRow key={facture.id} className="hover:bg-gray-50">
                  <TableCell>
                    <Checkbox />
                  </TableCell>
                  <TableCell className="font-mono text-xs text-gray-900 whitespace-nowrap">
                    {facture.reference}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-gray-900">{facture.client}</p>
                      <p className="text-xs text-gray-500">{facture.clientCode}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(facture.status)}>
                      {facture.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center font-semibold text-gray-900">
                    {facture.colis}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <span className={`font-bold ${facture.total.startsWith('-') ? 'text-red-600' : 'text-gray-900'}`}>
                        {facture.total}
                      </span>
                      {facture.badges && (
                        <div className="flex gap-1 ml-2">
                          <span className="px-1.5 py-0.5 text-xs rounded bg-yellow-100 text-yellow-800">
                            {facture.badges[0].label}
                          </span>
                          <span className="px-1.5 py-0.5 text-xs rounded bg-blue-100 text-blue-800">
                            {facture.badges[1].label}
                          </span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      onClick={() => generatePaymentBySeller(facture.id)}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      size="sm"
                    >
                      <Icon icon="heroicons:document-text" className="w-4 h-4 mr-2" />
                      Generate All
                    </Button>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="border-gray-300 text-gray-700 hover:bg-gray-100">
                          •••
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Icon icon="heroicons:eye" className="w-4 h-4 mr-2" />
                          Voir détails
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Icon icon="heroicons:pencil" className="w-4 h-4 mr-2" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Icon icon="heroicons:document-duplicate" className="w-4 h-4 mr-2" />
                          Dupliquer
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Icon icon="heroicons:printer" className="w-4 h-4 mr-2" />
                          Imprimer
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <Icon icon="heroicons:trash" className="w-4 h-4 mr-2" />
                          Supprimer
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
  );
}
