// /components/payments/bons-livreur-table.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { useRouter } from "next/navigation";
import { useBonsLivreurStore } from "@/lib/stores/payments/bons-livreur.store";
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
  <thead className="bg-gray-50 dark:bg-slate-700/50">{children}</thead>
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
  <td className={`px-4 py-3 text-sm text-gray-900 dark:text-gray-300 ${className}`}>{children}</td>
);

const BonsLivreurTable = ({ isAdminView = true }: { isAdminView?: boolean }) => {
  const router = useRouter();
  const { hasPermission } = useAuthStore();
  const {
    bonsLivreur,
    isLoading,
    pagination,
    filters,
    fetchBonsLivreur,
    setFilters,
    exportBons,
    generateBon,
  } = useBonsLivreurStore();

  // States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedZone, setSelectedZone] = useState("all");
  const [selectedLivreur, setSelectedLivreur] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });

  // Permissions
  const canCreateBons = hasPermission(PAYMENTS_PERMISSIONS.BONS_CREATE);
  const canUpdateBons = hasPermission(PAYMENTS_PERMISSIONS.BONS_UPDATE);
  const canDeleteBons = hasPermission(PAYMENTS_PERMISSIONS.BONS_DELETE);
  const canExportBons = hasPermission(PAYMENTS_PERMISSIONS.BONS_EXPORT);

  // Load data
  useEffect(() => {
    fetchBonsLivreur();
  }, []);

  // Handlers
  const handleSearch = () => {
    const newFilters: any = { page: 1 };
    
    if (searchTerm) newFilters.search = searchTerm;
    if (selectedZone !== "all") newFilters.zone = selectedZone;
    if (selectedLivreur !== "all") newFilters.livreurId = selectedLivreur;
    if (selectedStatus !== "all") newFilters.status = selectedStatus;
    if (dateRange.from) newFilters.startDate = format(dateRange.from, "yyyy-MM-dd");
    if (dateRange.to) newFilters.endDate = format(dateRange.to, "yyyy-MM-dd");

    setFilters(newFilters);
  };

  const handleGenerate = async (bonId: string) => {
    try {
      await generateBon(bonId);
      toast.success("Bon généré avec succès");
    } catch (error) {
      toast.error("Erreur lors de la génération");
    }
  };

  const handleExport = async () => {
    try {
      await exportBons(filters);
      toast.success("Export réussi");
    } catch (error) {
      toast.error("Erreur lors de l'export");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Payé":
        return "bg-green-100 text-green-800 dark:bg-green-600 dark:text-white";
      case "En Cours":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-600 dark:text-white";
      case "Attente":
        return "bg-red-100 text-red-800 dark:bg-red-600 dark:text-white";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-white";
    }
  };

  // Get unique zones and livreurs
  const uniqueZones = Array.from(new Set(bonsLivreur.map(b => b.zone)));
  const uniqueLivreurs = Array.from(new Set(bonsLivreur.map(b => b.livreur)));

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 border rounded-lg p-4">
        <div className="grid grid-cols-12 gap-3 items-end">
          {/* Search */}
          <div className="col-span-2">
            <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Recherche</label>
            <Input
              placeholder="Référence..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white dark:bg-slate-700"
            />
          </div>

          {/* Zone */}
          <div className="col-span-2">
            <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Zone</label>
            <Select value={selectedZone} onValueChange={setSelectedZone}>
              <SelectTrigger className="bg-white dark:bg-slate-700">
                <SelectValue placeholder="Toutes les zones" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les zones</SelectItem>
                {uniqueZones.map(zone => (
                  <SelectItem key={zone} value={zone}>{zone}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Livreur */}
          <div className="col-span-2">
            <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Livreur</label>
            <Select value={selectedLivreur} onValueChange={setSelectedLivreur}>
              <SelectTrigger className="bg-white dark:bg-slate-700">
                <SelectValue placeholder="Tous les livreurs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les livreurs</SelectItem>
                {uniqueLivreurs.map(livreur => (
                  <SelectItem key={livreur} value={livreur}>{livreur}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="col-span-2">
            <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Statut</label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="bg-white dark:bg-slate-700">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="Attente">En Attente</SelectItem>
                <SelectItem value="En Cours">En Cours</SelectItem>
                <SelectItem value="Payé">Payé</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div className="col-span-3">
            <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Période</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <Icon icon="heroicons:calendar" className="mr-2 h-4 w-4" />
                  {dateRange.from && dateRange.to ? (
                    <>
                      {format(dateRange.from, "dd/MM/yyyy")} - {format(dateRange.to, "dd/MM/yyyy")}
                    </>
                  ) : (
                    "Sélectionner période"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={(range: any) => setDateRange(range || { from: undefined, to: undefined })}
                  locale={fr}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Filter Button */}
          <div className="col-span-1">
            <Button onClick={handleSearch} className="w-full bg-blue-600 hover:bg-blue-700">
              <Icon icon="heroicons:funnel" className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 border rounded-lg overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Total: {pagination.total} bons
          </div>
          {canExportBons && (
            <Button onClick={handleExport} variant="outline" size="sm">
              <Icon icon="heroicons:arrow-down-tray" className="w-4 h-4 mr-2" />
              Exporter
            </Button>
          )}
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Référence</TableHead>
              <TableHead>Date création</TableHead>
              <TableHead>Date changement</TableHead>
              <TableHead>Zone</TableHead>
              <TableHead>Livreur</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-center">Colis</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Livré</TableHead>
              <TableHead className="text-right">Retourné</TableHead>
              <TableHead className="text-right">Refusé</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={12} className="text-center py-8">
                  <Icon icon="heroicons:arrow-path" className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : bonsLivreur.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12} className="text-center py-8 text-gray-500">
                  Aucun bon trouvé
                </TableCell>
              </TableRow>
            ) : (
              bonsLivreur.map((bon) => (
                <TableRow key={bon.id}>
                  <TableCell className="font-mono text-xs">{bon.reference}</TableCell>
                  <TableCell className="text-xs">{bon.createdDate}</TableCell>
                  <TableCell className="text-xs">{bon.statusChangeDate || "-"}</TableCell>
                  <TableCell>{bon.zone}</TableCell>
                  <TableCell>{bon.livreur}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(bon.status)}>
                      {bon.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center font-semibold">{bon.colisCount}</TableCell>
                  <TableCell className="text-right font-bold">{bon.totalAmount} DH</TableCell>
                  <TableCell className="text-right">
                    <span className="text-green-600 font-medium">{bon.livreAmount} DH</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-yellow-600 font-medium">{bon.retourAmount} DH</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-red-600 font-medium">{bon.refuseAmount} DH</span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          •••
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/payments/bons/${bon.id}`)}>
                          <Icon icon="heroicons:eye" className="w-4 h-4 mr-2" />
                          Voir détails
                        </DropdownMenuItem>
                        {canUpdateBons && (
                          <DropdownMenuItem onClick={() => router.push(`/payments/bons/${bon.id}/edit`)}>
                            <Icon icon="heroicons:pencil" className="w-4 h-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleGenerate(bon.id)}>
                          <Icon icon="heroicons:document-text" className="w-4 h-4 mr-2" />
                          Générer PDF
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="border-t px-4 py-3 flex items-center justify-between bg-gray-50 dark:bg-slate-700/50">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Page {pagination.page} sur {pagination.totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilters({ page: pagination.page - 1 })}
              disabled={pagination.page === 1}
            >
              Précédent
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilters({ page: pagination.page + 1 })}
              disabled={pagination.page >= pagination.totalPages}
            >
              Suivant
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BonsLivreurTable;