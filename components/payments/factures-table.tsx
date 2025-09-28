// /components/payments/factures-table.tsx
"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Icon } from "@/components/ui/icon";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { useFacturesStore } from "@/lib/stores/payments/factures.store";
import { useAuthStore } from "@/lib/stores/auth/auth.store";
import { PAYMENTS_PERMISSIONS } from "@/lib/constants/payments";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import type { 
  Facture, 
  FactureStatus,
  FACTURE_STATUS_COLORS,
  FACTURE_STATUS_LABELS 
} from "@/lib/types/payments/factures.types";

// Table Components
const Table = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <table className={`w-full text-left border-collapse ${className}`}>
    {children}
  </table>
);

const TableHeader = ({ children }: { children: React.ReactNode }) => (
  <thead className="bg-gray-50">{children}</thead>
);

const TableBody = ({ children }: { children: React.ReactNode }) => (
  <tbody>{children}</tbody>
);

const TableRow = ({ children, className = "", ...props }: any) => (
  <tr className={`border-b hover:bg-gray-50 ${className}`} {...props}>
    {children}
  </tr>
);

const TableHead = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <th className={`px-4 py-3 text-left text-sm font-medium text-gray-900 ${className}`}>
    {children}
  </th>
);

const TableCell = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <td className={`px-4 py-3 text-sm text-gray-700 ${className}`}>{children}</td>
);

// Status Badge Component
const FactureStatusBadge = ({ status }: { status: FactureStatus }) => {
  const statusColors: Record<FactureStatus, string> = {
    DRAFT: "#6B7280",
    SENT: "#3B82F6",
    PAID: "#22C55E",
    OVERDUE: "#EF4444",
    CANCELLED: "#DC2626",
  };

  const statusLabels: Record<FactureStatus, string> = {
    DRAFT: "Brouillon",
    SENT: "Envoyée",
    PAID: "Payée",
    OVERDUE: "En retard",
    CANCELLED: "Annulée",
  };

  const color = statusColors[status];
  const label = statusLabels[status];

  return (
    <Badge
      style={{
        backgroundColor: color + "20",
        color: color,
        borderColor: color,
      }}
      className="border"
    >
      {label}
    </Badge>
  );
};

// Format utilities
const formatDate = (dateString: string) => {
  return format(new Date(dateString), "dd/MM/yyyy", { locale: fr });
};

const formatDateTime = (dateString: string) => {
  return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: fr });
};

const formatAmount = (amount: number) => {
  return new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency: 'MAD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Main Component
const FacturesTable = ({ isAdminView = true }: { isAdminView?: boolean }) => {
  const router = useRouter();
  const { hasPermission } = useAuthStore();
  const {
    factures,
    isLoading,
    pagination,
    filters,
    selectedIds,
    fetchFactures,
    fetchMyFactures,
    setFilters,
    setSelectedIds,
    deleteFacture,
    changeFactureStatus,
    exportFactures,
  } = useFacturesStore();

  // States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedClient, setSelectedClient] = useState<string>("all");
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    facture: Facture | null;
  }>({ open: false, facture: null });
  const [statusDialog, setStatusDialog] = useState<{
    open: boolean;
    facture: Facture | null;
  }>({ open: false, facture: null });
  const [bulkAction, setBulkAction] = useState<string>("");

  // Permissions
  const hasUpdatePermission = hasPermission(PAYMENTS_PERMISSIONS.FACTURES_UPDATE);
  const hasDeletePermission = hasPermission(PAYMENTS_PERMISSIONS.FACTURES_DELETE);
  const hasManagePermission = hasPermission(PAYMENTS_PERMISSIONS.FACTURES_MANAGE);
  const hasExportPermission = hasPermission(PAYMENTS_PERMISSIONS.FACTURES_EXPORT);

  // Effects
  useEffect(() => {
    if (isAdminView) {
      fetchFactures();
    } else {
      fetchMyFactures();
    }
  }, [isAdminView, fetchFactures, fetchMyFactures]);

  // Handlers
  const handleSearch = useCallback(() => {
    const newFilters: any = { page: 1 };
    
    if (searchTerm) newFilters.search = searchTerm;
    if (selectedStatus !== "all") newFilters.status = selectedStatus;
    if (selectedClient !== "all") newFilters.clientId = selectedClient;
    if (dateRange.from) newFilters.startDate = format(dateRange.from, "yyyy-MM-dd");
    if (dateRange.to) newFilters.endDate = format(dateRange.to, "yyyy-MM-dd");

    setFilters(newFilters);
  }, [searchTerm, selectedStatus, selectedClient, dateRange, setFilters]);

  const handleDeleteFacture = async () => {
    if (!deleteDialog.facture) return;
    
    const success = await deleteFacture(deleteDialog.facture.id);
    if (success) {
      setDeleteDialog({ open: false, facture: null });
    }
  };

  const handleChangeStatus = async (status: FactureStatus) => {
    if (!statusDialog.facture) return;
    
    const success = await changeFactureStatus(statusDialog.facture.id, status);
    if (success) {
      setStatusDialog({ open: false, facture: null });
    }
  };

  const handleBulkAction = async () => {
    if (selectedIds.length === 0) {
      toast.warning("Veuillez sélectionner au moins une facture");
      return;
    }

    switch (bulkAction) {
      case "delete":
        // Implement bulk delete
        toast.info("Suppression en masse - à implémenter");
        break;
      case "export":
        await exportFactures("excel");
        break;
      case "send":
        toast.info("Envoi en masse - à implémenter");
        break;
      default:
        toast.warning("Veuillez sélectionner une action");
    }
  };

  const handleExport = async () => {
    await exportFactures("excel");
  };

  const handlePageChange = (newPage: number) => {
    setFilters({ page: newPage });
  };

  const handlePageSizeChange = (newSize: number) => {
    setFilters({ limit: newSize, page: 1 });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(factures.map(f => f.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter(sid => sid !== id));
    }
  };

  // Get unique clients for filter
  const uniqueClients = useMemo(() => {
    const clients = new Map();
    factures.forEach(f => {
      if (!clients.has(f.clientId)) {
        clients.set(f.clientId, { id: f.clientId, name: f.clientName });
      }
    });
    return Array.from(clients.values());
  }, [factures]);

  return (
    <div className="space-y-4">
      {/* Filters Section */}
      <div className="bg-white border rounded-lg p-4">
        <div className="grid grid-cols-12 gap-3 items-end">
          {/* Search */}
          <div className="col-span-3">
            <label className="text-xs text-gray-500 mb-1 block">Recherche</label>
            <Input
              placeholder="Référence, client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Client Filter */}
          <div className="col-span-2">
            <label className="text-xs text-gray-500 mb-1 block">Client</label>
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les clients" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les clients</SelectItem>
                {uniqueClients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter */}
          <div className="col-span-2">
            <label className="text-xs text-gray-500 mb-1 block">Statut</label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="DRAFT">Brouillon</SelectItem>
                <SelectItem value="SENT">Envoyée</SelectItem>
                <SelectItem value="PAID">Payée</SelectItem>
                <SelectItem value="OVERDUE">En retard</SelectItem>
                <SelectItem value="CANCELLED">Annulée</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div className="col-span-3">
            <label className="text-xs text-gray-500 mb-1 block">Période</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <Icon icon="heroicons:calendar" className="mr-2 h-4 w-4" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "dd/MM/yyyy")} - {format(dateRange.to, "dd/MM/yyyy")}
                      </>
                    ) : (
                      format(dateRange.from, "dd/MM/yyyy")
                    )
                  ) : (
                    "Sélectionner une période"
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
            <Button onClick={handleSearch} className="w-full bg-indigo-600 hover:bg-indigo-700">
              <Icon icon="heroicons:funnel" className="w-4 h-4" />
            </Button>
          </div>

          {/* Export Button */}
          {hasExportPermission && (
            <div className="col-span-1">
              <Button onClick={handleExport} className="w-full bg-green-600 hover:bg-green-700">
                <Icon icon="heroicons:arrow-down-tray" className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
          <span className="text-sm text-blue-700">
            {selectedIds.length} facture(s) sélectionnée(s)
          </span>
          <div className="flex items-center gap-2">
            <Select value={bulkAction} onValueChange={setBulkAction}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Actions groupées" />
              </SelectTrigger>
              <SelectContent>
                {hasExportPermission && <SelectItem value="export">Exporter</SelectItem>}
                {hasManagePermission && <SelectItem value="send">Envoyer</SelectItem>}
                {hasDeletePermission && <SelectItem value="delete">Supprimer</SelectItem>}
              </SelectContent>
            </Select>
            <Button onClick={handleBulkAction} size="md" className="bg-indigo-600 hover:bg-indigo-700">
              Appliquer
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedIds.length === factures.length && factures.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Référence</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Date de création</TableHead>
              <TableHead>Date de paiement</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-center">Colis</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <Icon icon="heroicons:arrow-path" className="h-6 w-6 animate-spin" />
                    <span className="ml-2">Chargement...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : factures.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                  Aucune facture trouvée
                </TableCell>
              </TableRow>
            ) : (
              factures.map((facture) => (
                <TableRow key={facture.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(facture.id)}
                      onCheckedChange={(checked) => handleSelectOne(facture.id, !!checked)}
                    />
                  </TableCell>
                  <TableCell className="font-mono text-xs">{facture.reference}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{facture.clientName}</p>
                      <p className="text-xs text-gray-500">{facture.clientCode}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">{formatDateTime(facture.createdAt)}</TableCell>
                  <TableCell className="text-xs">
                    {facture.paymentDate ? (
                      <span className="text-green-600">{formatDate(facture.paymentDate)}</span>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    <FactureStatusBadge status={facture.status} />
                  </TableCell>
                  <TableCell className="text-center font-semibold">
                    {facture.colisCount}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={`font-bold ${facture.totalAmount < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                      {formatAmount(facture.totalAmount)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          •••
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/payments/factures/${facture.id}`)}>
                          <Icon icon="heroicons:eye" className="w-4 h-4 mr-2" />
                          Voir détails
                        </DropdownMenuItem>
                        {hasUpdatePermission && (
                          <DropdownMenuItem onClick={() => router.push(`/payments/factures/${facture.id}/edit`)}>
                            <Icon icon="heroicons:pencil" className="w-4 h-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => router.push(`/payments/factures/${facture.id}/duplicate`)}>
                          <Icon icon="heroicons:document-duplicate" className="w-4 h-4 mr-2" />
                          Dupliquer
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => window.print()}>
                          <Icon icon="heroicons:printer" className="w-4 h-4 mr-2" />
                          Imprimer
                        </DropdownMenuItem>
                        {hasManagePermission && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setStatusDialog({ open: true, facture })}>
                              <Icon icon="heroicons:arrow-path" className="w-4 h-4 mr-2" />
                              Changer statut
                            </DropdownMenuItem>
                          </>
                        )}
                        {hasDeletePermission && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => setDeleteDialog({ open: true, facture })}
                            >
                              <Icon icon="heroicons:trash" className="w-4 h-4 mr-2" />
                              Supprimer
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="border-t px-4 py-3 flex items-center justify-between bg-gray-50">
          <div className="text-sm text-gray-600">
            Affichage de {(pagination.page - 1) * pagination.limit + 1} à{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} sur{" "}
            {pagination.total} factures
          </div>

          <div className="flex items-center gap-2">
            <Select
              value={pagination.limit.toString()}
              onValueChange={(value) => handlePageSizeChange(Number(value))}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(1)}
                disabled={pagination.page === 1}
              >
                <Icon icon="heroicons:chevron-double-left" className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
              >
                <Icon icon="heroicons:chevron-left" className="h-4 w-4" />
              </Button>
              <span className="px-3 text-sm">
                Page {pagination.page} sur {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
              >
                <Icon icon="heroicons:chevron-right" className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.totalPages)}
                disabled={pagination.page >= pagination.totalPages}
              >
                <Icon icon="heroicons:chevron-double-right" className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, facture: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action ne peut pas être annulée. La facture{" "}
              <strong>{deleteDialog.facture?.reference}</strong> sera supprimée définitivement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteFacture}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Status Change Dialog */}
      <Dialog
        open={statusDialog.open}
        onOpenChange={(open) => setStatusDialog({ open, facture: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Changer le statut</DialogTitle>
            <DialogDescription>
              Sélectionnez le nouveau statut pour la facture {statusDialog.facture?.reference}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => handleChangeStatus("SENT" as FactureStatus)}
            >
              <Icon icon="heroicons:paper-airplane" className="mr-2 h-4 w-4 text-blue-600" />
              Marquer comme envoyée
            </Button>
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => handleChangeStatus("PAID" as FactureStatus)}
            >
              <Icon icon="heroicons:check-circle" className="mr-2 h-4 w-4 text-green-600" />
              Marquer comme payée
            </Button>
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => handleChangeStatus("CANCELLED" as FactureStatus)}
            >
              <Icon icon="heroicons:x-circle" className="mr-2 h-4 w-4 text-red-600" />
              Annuler la facture
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialog({ open: false, facture: null })}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FacturesTable;