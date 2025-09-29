// /components/payments/pending-factures-table.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Icon } from "@/components/ui/icon";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { usePendingFacturesStore } from "@/lib/stores/payments/pending-factures.store";
import { useFacturesStore } from "@/lib/stores/payments/factures.store";
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

const PendingFacturesTable = ({ isAdminView = true }: { isAdminView?: boolean }) => {
  const router = useRouter();
  const { hasPermission } = useAuthStore();
  const { createFacture } = useFacturesStore();
  const {
    pendingFactures,
    isLoading,
    filters,
    selectedIds,
    fetchPendingFactures,
    setFilters,
    setSelectedIds,
    clearSelectedIds,
  } = usePendingFacturesStore();

  // States
  const [generateDialog, setGenerateDialog] = useState<{
    open: boolean;
    facture: any | null;
  }>({ open: false, facture: null });

  // Permissions
  const canCreateFactures = hasPermission(PAYMENTS_PERMISSIONS.FACTURES_CREATE);
  const canGenerateAll = hasPermission(PAYMENTS_PERMISSIONS.FACTURES_MANAGE);

  // Load data on mount
  useEffect(() => {
    fetchPendingFactures();
  }, [fetchPendingFactures]);

  // Handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(pendingFactures.map(f => f.id));
    } else {
      clearSelectedIds();
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const currentIds = selectedIds;
    if (checked) {
      setSelectedIds([...currentIds, id]);
    } else {
      setSelectedIds(currentIds.filter(sid => sid !== id));
    }
  };

  const handleGenerateSingle = (facture: any) => {
    setGenerateDialog({ open: true, facture });
  };

  const confirmGenerate = async () => {
    const { facture } = generateDialog;
    if (!facture) return;

    try {
      await createFacture({
        clientId: facture.clientId,
        items: facture.parcels || [],
        dueDate: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
        notes: `Facture générée pour ${facture.parcelsCount} colis`,
      });

      toast.success(`Facture ${facture.reference} générée avec succès`);
      setGenerateDialog({ open: false, facture: null });
      fetchPendingFactures();
      
      setTimeout(() => {
        router.push("/payments/factures");
      }, 2000);
    } catch (error) {
      toast.error("Erreur lors de la génération");
    }
  };

  const handleGenerateSelected = async () => {
    if (selectedIds.length === 0) {
      toast.warning("Sélectionnez au moins une facture");
      return;
    }

    let successCount = 0;
    for (const id of selectedIds) {
      const facture = pendingFactures.find(f => f.id === id);
      if (facture) {
        try {
          await createFacture({
            clientId: facture.clientId,
            items: facture.parcels || [],
            dueDate: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
            notes: `Facture générée automatiquement`,
          });
          successCount++;
        } catch (error) {
          console.error(error);
        }
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} facture(s) générée(s)`);
      clearSelectedIds();
      fetchPendingFactures();
    }
  };

  const uniqueClients = Array.from(new Set(pendingFactures.map(f => f.clientId))).map(id => {
    const facture = pendingFactures.find(f => f.clientId === id);
    return { id, name: facture?.clientName || "" };
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white border rounded-lg p-4">
        <div className="grid grid-cols-12 gap-3 items-end">
          <div className="col-span-3">
            <label className="text-xs text-gray-500 mb-1 block">Recherche</label>
            <Input
              placeholder="Référence, client..."
              value={filters.search || ""}
              onChange={(e) => setFilters({ search: e.target.value })}
            />
          </div>
          
          <div className="col-span-3">
            <label className="text-xs text-gray-500 mb-1 block">Client</label>
            <Select
              value={filters.clientId || "all"}
              onValueChange={(value) => setFilters({ clientId: value === "all" ? undefined : value })}
            >
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

          <div className="col-span-2">
            <label className="text-xs text-gray-500 mb-1 block">Statut</label>
            <Select
              value={filters.status || "all"}
              onValueChange={(value) => setFilters({ status: value === "all" ? undefined : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tous" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="PENDING">En attente</SelectItem>
                <SelectItem value="READY">Prêt</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-3">
            <label className="text-xs text-gray-500 mb-1 block">Période</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <Icon icon="heroicons:calendar" className="mr-2 h-4 w-4" />
                  {filters.startDate && filters.endDate ? (
                    <>
                      {format(new Date(filters.startDate), "dd/MM/yyyy")} - 
                      {format(new Date(filters.endDate), "dd/MM/yyyy")}
                    </>
                  ) : (
                    "Sélectionner une période"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  locale={fr}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="col-span-1">
            <Button
              onClick={fetchPendingFactures}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              <Icon icon="heroicons:funnel" className="w-4 h-4" />
            </Button>
          </div>

          {selectedIds.length > 0 && canGenerateAll && (
            <div className="col-span-1">
              <Button
                onClick={handleGenerateSelected}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <Icon icon="heroicons:check-circle" className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedIds.length === pendingFactures.length && pendingFactures.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Référence</TableHead>
              <TableHead>Client</TableHead>
              <TableHead className="text-center">Colis</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <Icon icon="heroicons:arrow-path" className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : pendingFactures.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  Aucune facture en attente
                </TableCell>
              </TableRow>
            ) : (
              pendingFactures.map((facture) => (
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
                  <TableCell className="text-center font-semibold">
                    {facture.parcelsCount}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    <span className={facture.totalAmount < 0 ? "text-red-600" : ""}>
                      {facture.totalAmount.toLocaleString()} DH
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge className={facture.status === "READY" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}>
                      {facture.status === "READY" ? "Prêt" : "En attente"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      onClick={() => handleGenerateSingle(facture)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Icon icon="heroicons:document-text" className="w-4 h-4 mr-1" />
                      Générer
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Generate Dialog */}
      <Dialog open={generateDialog.open} onOpenChange={(open) => !open && setGenerateDialog({ open: false, facture: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la génération</DialogTitle>
            <DialogDescription>
              Voulez-vous générer la facture pour {generateDialog.facture?.clientName} ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGenerateDialog({ open: false, facture: null })}>
              Annuler
            </Button>
            <Button onClick={confirmGenerate} className="bg-green-600 hover:bg-green-700">
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PendingFacturesTable;