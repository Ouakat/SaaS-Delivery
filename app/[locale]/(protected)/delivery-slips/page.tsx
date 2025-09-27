"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "@/i18n/routing";
import { ProtectedRoute } from "@/components/route/protected-route";
import { useDeliverySlipsStore } from "@/lib/stores/parcels/delivery-slips.store";
import { useCitiesStore } from "@/lib/stores/parcels/cities.store";
import { useAuthStore } from "@/lib/stores/auth/auth.store";
import { DeliverySlipStatus } from "@/lib/types/parcels/delivery-slips.types";
import { toast } from "sonner";
import { cn } from "@/lib/utils/ui.utils";

const statusConfig = {
  [DeliverySlipStatus.PENDING]: {
    label: "En Attente",
    color: "bg-yellow-100 text-yellow-800" as const,
    icon: "heroicons:clock",
  },
  [DeliverySlipStatus.RECEIVED]: {
    label: "Reçu",
    color: "bg-green-100 text-green-800" as const,
    icon: "heroicons:check-circle",
  },
  [DeliverySlipStatus.CANCELLED]: {
    label: "Annulé",
    color: "bg-red-100 text-red-800" as const,
    icon: "heroicons:x-circle",
  },
};

const DeliverySlipsPageContent = () => {
  const router = useRouter();
  const { hasPermission, user } = useAuthStore();
  const {
    deliverySlips,
    isLoading,
    error,
    pagination,
    filters,
    selectedIds,
    setFilters,
    clearFilters,
    setSelectedIds,
    clearSelectedIds,
    fetchDeliverySlips,
    deleteDeliverySlip,
    bulkSlipAction,
    receiveSlip,
    fetchStatistics,
    statistics,
  } = useDeliverySlipsStore();

  const { cities, fetchCities } = useCitiesStore();

  const [searchQuery, setSearchQuery] = useState(filters.search || "");
  const [selectedStatus, setSelectedStatus] = useState(filters.status || "");
  const [selectedCity, setSelectedCity] = useState(filters.cityId || "");
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Permissions
  const canCreateSlips = hasPermission("delivery_slips:create");
  const canUpdateSlips = hasPermission("delivery_slips:update");
  const canDeleteSlips = hasPermission("delivery_slips:delete");
  const canReceiveSlips = hasPermission("delivery_slips:receive");
  const canUseBulkActions = hasPermission("delivery_slips:bulk_actions");

  // Initialize data
  useEffect(() => {
    fetchDeliverySlips();
    fetchCities();
    fetchStatistics();
  }, []);

  // Handle search
  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setFilters({ search: value, page: 1 });
  };

  // Handle status filter
  const handleStatusFilter = (status: string) => {
    setSelectedStatus(status);
    setFilters({
      status: status === "all" ? undefined : (status as DeliverySlipStatus),
      page: 1,
    });
  };

  // Handle city filter
  const handleCityFilter = (cityId: string) => {
    setSelectedCity(cityId);
    setFilters({
      cityId: cityId === "all" ? undefined : cityId,
      page: 1,
    });
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setFilters({ page });
  };

  // Handle row selection
  const handleSelectSlip = (slipId: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, slipId]);
    } else {
      setSelectedIds(selectedIds.filter((id) => id !== slipId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(deliverySlips.map((slip) => slip.id));
    } else {
      clearSelectedIds();
    }
  };

  // Handle individual slip actions
  const handleReceiveSlip = async (slipId: string) => {
    const success = await receiveSlip(slipId, {
      notes: "Marked as received from list view",
    });

    if (success) {
      fetchStatistics();
    }
  };

  const handleDeleteSlip = async (slipId: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce bon de livraison ?")) {
      const success = await deleteDeliverySlip(slipId);
      if (success) {
        fetchStatistics();
      }
    }
  };

  // Handle bulk actions
  const handleBulkAction = async (action: string) => {
    if (selectedIds.length === 0) {
      toast.error("Veuillez sélectionner au moins un bon de livraison");
      return;
    }

    setBulkActionLoading(true);
    try {
      const success = await bulkSlipAction({
        slipIds: selectedIds,
        action,
        comment: `Action en lot: ${action}`,
      });

      if (success) {
        clearSelectedIds();
        fetchStatistics();
      }
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedStatus("");
    setSelectedCity("");
    clearFilters();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const StatusBadge = ({ status }: { status: DeliverySlipStatus }) => {
    const config = statusConfig[status];
    return (
      <Badge className={cn("inline-flex items-center gap-1", config.color)}>
        <Icon icon={config.icon} className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  if (error) {
    return (
      <Alert color="destructive">
        <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
        <AlertDescription>
          Erreur lors du chargement des bons de livraison: {error}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-default-900">
            Bons de Livraison
          </h1>
          <p className="text-default-600">
            Gérez les bons de livraison et le ramassage des colis
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canCreateSlips && (
            <Link href="/delivery-slips/create">
              <Button>
                <Icon icon="heroicons:plus" className="w-4 h-4 mr-2" />
                Nouveau Bon
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Total des Bons
                  </p>
                  <p className="text-2xl font-bold">{statistics.totalSlips}</p>
                </div>
                <Icon
                  icon="heroicons:document-text"
                  className="h-8 w-8 text-muted-foreground"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    En Attente
                  </p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {statistics.pendingSlips}
                  </p>
                </div>
                <Icon
                  icon="heroicons:clock"
                  className="h-8 w-8 text-yellow-600"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Reçus
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {statistics.receivedSlips}
                  </p>
                </div>
                <Icon
                  icon="heroicons:check-circle"
                  className="h-8 w-8 text-green-600"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Colis
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {statistics.totalParcelsInSlips}
                  </p>
                </div>
                <Icon icon="heroicons:cube" className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtres</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Input
                placeholder="Rechercher par référence..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full"
              />
            </div>

            <div>
              <Select value={selectedStatus} onValueChange={handleStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value={DeliverySlipStatus.PENDING}>
                    En Attente
                  </SelectItem>
                  <SelectItem value={DeliverySlipStatus.RECEIVED}>
                    Reçu
                  </SelectItem>
                  <SelectItem value={DeliverySlipStatus.CANCELLED}>
                    Annulé
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Select value={selectedCity} onValueChange={handleCityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les villes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les villes</SelectItem>
                  {cities.map((city) => (
                    <SelectItem key={city.id} value={city.id}>
                      {city.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Button
                variant="outline"
                onClick={handleClearFilters}
                className="w-full"
              >
                <Icon icon="heroicons:x-mark" className="w-4 h-4 mr-2" />
                Effacer
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && canUseBulkActions && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {selectedIds.length} bon(s) sélectionné(s)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction("RECEIVE")}
                  disabled={bulkActionLoading}
                >
                  <Icon icon="heroicons:check" className="w-4 h-4 mr-2" />
                  Marquer comme Reçu
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction("CANCEL")}
                  disabled={bulkActionLoading}
                >
                  <Icon icon="heroicons:x-mark" className="w-4 h-4 mr-2" />
                  Annuler
                </Button>
                {canDeleteSlips && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction("DELETE")}
                    disabled={bulkActionLoading}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Icon icon="heroicons:trash" className="w-4 h-4 mr-2" />
                    Supprimer
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delivery Slips Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Liste des Bons de Livraison</span>
            {canUseBulkActions && (
              <Checkbox
                checked={
                  selectedIds.length === deliverySlips.length &&
                  deliverySlips.length > 0
                }
                onCheckedChange={handleSelectAll}
                aria-label="Sélectionner tout"
              />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  {canUseBulkActions && (
                    <th className="p-4 text-left">
                      <span className="sr-only">Sélection</span>
                    </th>
                  )}
                  <th className="p-4 text-left font-medium">Référence</th>
                  <th className="p-4 text-left font-medium">
                    Date de Création
                  </th>
                  <th className="p-4 text-left font-medium">Statut</th>
                  <th className="p-4 text-left font-medium">Ville</th>
                  <th className="p-4 text-left font-medium">Colis</th>
                  <th className="p-4 text-left font-medium">Valeur</th>
                  <th className="p-4 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index}>
                      {canUseBulkActions && (
                        <td className="p-4">
                          <div className="h-4 bg-muted rounded animate-pulse" />
                        </td>
                      )}
                      <td className="p-4">
                        <div className="h-4 bg-muted rounded animate-pulse" />
                      </td>
                      <td className="p-4">
                        <div className="h-4 bg-muted rounded animate-pulse" />
                      </td>
                      <td className="p-4">
                        <div className="h-4 bg-muted rounded animate-pulse" />
                      </td>
                      <td className="p-4">
                        <div className="h-4 bg-muted rounded animate-pulse" />
                      </td>
                      <td className="p-4">
                        <div className="h-4 bg-muted rounded animate-pulse" />
                      </td>
                      <td className="p-4">
                        <div className="h-4 bg-muted rounded animate-pulse" />
                      </td>
                      <td className="p-4">
                        <div className="h-4 bg-muted rounded animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : deliverySlips.length === 0 ? (
                  <tr>
                    <td
                      colSpan={canUseBulkActions ? 8 : 7}
                      className="p-8 text-center text-muted-foreground"
                    >
                      Aucun bon de livraison trouvé
                    </td>
                  </tr>
                ) : (
                  deliverySlips.map((slip) => (
                    <tr key={slip.id} className="hover:bg-muted/25">
                      {canUseBulkActions && (
                        <td className="p-4">
                          <Checkbox
                            checked={selectedIds.includes(slip.id)}
                            onCheckedChange={(checked) =>
                              handleSelectSlip(slip.id, checked as boolean)
                            }
                          />
                        </td>
                      )}
                      <td className="p-4">
                        <Link
                          href={`/delivery-slips/${slip.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {slip.reference}
                        </Link>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {formatDate(slip.createdAt.toString())}
                      </td>
                      <td className="p-4">
                        <StatusBadge status={slip.status} />
                      </td>
                      <td className="p-4">
                        {slip.city?.name || "Non spécifiée"}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {slip.summary.totalParcels}
                          </span>
                          {slip.summary.scannedParcels <
                            slip.summary.totalParcels && (
                            <Badge variant="secondary" className="text-xs">
                              {slip.summary.scannedParcels} scannés
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-4 font-medium">
                        {slip.summary.totalValue.toFixed(2)} DH
                      </td>
                      <td className="p-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Icon
                                icon="heroicons:ellipsis-horizontal"
                                className="w-4 h-4"
                              />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/delivery-slips/${slip.id}`}>
                                <Icon
                                  icon="heroicons:eye"
                                  className="w-4 h-4 mr-2"
                                />
                                Voir Détails
                              </Link>
                            </DropdownMenuItem>

                            {canUpdateSlips &&
                              slip.status === DeliverySlipStatus.PENDING && (
                                <DropdownMenuItem asChild>
                                  <Link
                                    href={`/delivery-slips/${slip.id}/edit`}
                                  >
                                    <Icon
                                      icon="heroicons:pencil"
                                      className="w-4 h-4 mr-2"
                                    />
                                    Modifier
                                  </Link>
                                </DropdownMenuItem>
                              )}

                            {canReceiveSlips &&
                              slip.status === DeliverySlipStatus.PENDING && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleReceiveSlip(slip.id)}
                                  >
                                    <Icon
                                      icon="heroicons:check"
                                      className="w-4 h-4 mr-2 text-green-600"
                                    />
                                    Marquer comme Reçu
                                  </DropdownMenuItem>
                                </>
                              )}

                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Icon
                                icon="heroicons:document-arrow-down"
                                className="w-4 h-4 mr-2"
                              />
                              Télécharger PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Icon
                                icon="heroicons:qr-code"
                                className="w-4 h-4 mr-2"
                              />
                              Étiquettes
                            </DropdownMenuItem>

                            {canDeleteSlips &&
                              slip.status === DeliverySlipStatus.PENDING && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteSlip(slip.id)}
                                    className="text-red-600 focus:text-red-600"
                                  >
                                    <Icon
                                      icon="heroicons:trash"
                                      className="w-4 h-4 mr-2"
                                    />
                                    Supprimer
                                  </DropdownMenuItem>
                                </>
                              )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t">
              <div className="text-sm text-muted-foreground">
                Affichage de {(pagination.page - 1) * pagination.limit + 1} à{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
                sur {pagination.total} résultats
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  <Icon icon="heroicons:chevron-left" className="w-4 h-4" />
                  Précédent
                </Button>
                <span className="text-sm px-3 py-1">
                  Page {pagination.page} sur {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                >
                  Suivant
                  <Icon icon="heroicons:chevron-right" className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Main component wrapped with ProtectedRoute
const DeliverySlipsPage = () => {
  return (
    <ProtectedRoute
      requiredPermissions={["delivery_slips:read"]}
      requiredAccessLevel="LIMITED"
      allowedAccountStatuses={["ACTIVE"]}
      requireValidation={true}
    >
      <DeliverySlipsPageContent />
    </ProtectedRoute>
  );
};

export default DeliverySlipsPage;
