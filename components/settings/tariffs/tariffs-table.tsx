"use client";
import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Icon } from "@/components/ui/icon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link } from "@/i18n/routing";
import { useTariffsStore } from "@/lib/stores/settings/tariffs.store";
import { useAuthStore } from "@/lib/stores/auth/auth.store";
import { SETTINGS_PERMISSIONS } from "@/lib/constants/settings";
import type { Tariff } from "@/lib/types/settings/tariffs.types";
import { toast } from "sonner";

// Simple table components
const Table = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
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

const TableRow = ({
  children,
  className = "",
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
}) => (
  <tr className={`border-b hover:bg-gray-50 ${className}`} {...props}>
    {children}
  </tr>
);

const TableHead = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <th
    className={`px-4 py-3 text-left text-sm font-medium text-gray-900 ${className}`}
  >
    {children}
  </th>
);

const TableCell = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <td className={`px-4 py-3 text-sm text-gray-700 ${className}`}>{children}</td>
);

const TariffsTable = () => {
  const { hasPermission } = useAuthStore();
  const {
    tariffs,
    pagination,
    filters,
    setFilters,
    fetchTariffs,
    deleteTariff,
    duplicateTariff,
    isLoading,
  } = useTariffsStore();

  const [selectedTariffs, setSelectedTariffs] = useState<string[]>([]);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    tariff: Tariff | null;
  }>({ open: false, tariff: null });

  const canManageSettings = hasPermission(SETTINGS_PERMISSIONS.MANAGE_SETTINGS);

  useEffect(() => {
    fetchTariffs();
  }, [fetchTariffs]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTariffs(tariffs.map((tariff) => tariff.id));
    } else {
      setSelectedTariffs([]);
    }
  };

  const handleSelectTariff = (tariffId: string, checked: boolean) => {
    if (checked) {
      setSelectedTariffs((prev) => [...prev, tariffId]);
    } else {
      setSelectedTariffs((prev) => prev.filter((id) => id !== tariffId));
    }
  };

  const handleDelete = async (tariff: Tariff) => {
    const success = await deleteTariff(tariff.id);
    if (success) {
      setDeleteDialog({ open: false, tariff: null });
      toast.success("Tariff deleted successfully");
    }
  };

  const handleDuplicate = async (tariff: Tariff) => {
    // For duplication, we need to create with different route to avoid conflicts
    const success = await duplicateTariff(
      tariff.id,
      tariff.pickupCityId,
      tariff.destinationCityId
    );
    if (success) {
      toast.success(
        "Tariff duplicated successfully. Please edit the route to avoid conflicts."
      );
    }
  };

  const handlePageChange = (newPage: number) => {
    setFilters({ page: newPage });
  };

  const handlePageSizeChange = (newSize: number) => {
    setFilters({ limit: newSize, page: 1 });
  };

  const formatPrice = (price: number) => {
    return `$${price.toFixed(2)}`;
  };

  const getDelayBadgeColor = (delay: number) => {
    if (delay <= 1) return "bg-green-100 text-green-800";
    if (delay <= 3) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center space-x-2">
          <Icon icon="heroicons:arrow-path" className="w-5 h-5 animate-spin" />
          <span>Loading tariffs...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Bulk Actions */}
      {selectedTariffs.length > 0 && canManageSettings && (
        <div className="flex items-center gap-2 p-4 bg-blue-50 border-l-4 border-blue-500">
          <span className="text-sm font-medium">
            {selectedTariffs.length} tariff
            {selectedTariffs.length > 1 ? "s" : ""} selected
          </span>
          <Button size="md" variant="outline">
            <Icon icon="heroicons:trash" className="w-4 h-4 mr-2" />
            Delete Selected
          </Button>
          <Button size="md" variant="outline">
            <Icon
              icon="heroicons:document-duplicate"
              className="w-4 h-4 mr-2"
            />
            Duplicate Selected
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={
                    selectedTariffs.length === tariffs.length &&
                    tariffs.length > 0
                  }
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead>Route</TableHead>
              <TableHead>Delivery Price</TableHead>
              <TableHead>Return Price</TableHead>
              <TableHead>Refusal Price</TableHead>
              <TableHead>Delay</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-16">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tariffs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  <div className="flex flex-col items-center space-y-2">
                    <Icon
                      icon="heroicons:currency-dollar"
                      className="w-12 h-12 text-gray-400"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        No tariffs found
                      </p>
                      <p className="text-sm text-gray-500">
                        Get started by creating your first tariff
                      </p>
                    </div>
                    <Link href="/settings/tariffs/create">
                      <Button size="md">
                        <Icon icon="heroicons:plus" className="w-4 h-4 mr-2" />
                        Create Tariff
                      </Button>
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              tariffs.map((tariff) => (
                <TableRow key={tariff.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedTariffs.includes(tariff.id)}
                      onCheckedChange={(checked) =>
                        handleSelectTariff(tariff.id, checked as boolean)
                      }
                      aria-label="Select tariff"
                    />
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">
                        {tariff.pickupCity.name} → {tariff.destinationCity.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {tariff.pickupCity.ref} → {tariff.destinationCity.ref}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <span className="font-medium text-green-600">
                      {formatPrice(tariff.deliveryPrice)}
                    </span>
                  </TableCell>

                  <TableCell>
                    <span className="font-medium text-orange-600">
                      {formatPrice(tariff.returnPrice)}
                    </span>
                  </TableCell>

                  <TableCell>
                    <span className="font-medium text-red-600">
                      {formatPrice(tariff.refusalPrice)}
                    </span>
                  </TableCell>

                  <TableCell>
                    <Badge
                      className={`${getDelayBadgeColor(
                        tariff.deliveryDelay
                      )} text-xs`}
                    >
                      {tariff.deliveryDelay} day
                      {tariff.deliveryDelay > 1 ? "s" : ""}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm">
                        {new Date(tariff.createdAt).toLocaleDateString()}
                      </div>
                      {tariff.createdBy && (
                        <div className="text-xs text-gray-500">
                          by {tariff.createdBy}
                        </div>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="md">
                          <Icon
                            icon="heroicons:ellipsis-horizontal"
                            className="h-4 w-4"
                          />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/settings/tariffs/${tariff.id}`}>
                            <Icon
                              icon="heroicons:eye"
                              className="mr-2 h-4 w-4"
                            />
                            View Details
                          </Link>
                        </DropdownMenuItem>

                        {canManageSettings && (
                          <>
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/settings/tariffs/${tariff.id}/edit`}
                              >
                                <Icon
                                  icon="heroicons:pencil"
                                  className="mr-2 h-4 w-4"
                                />
                                Edit
                              </Link>
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => handleDuplicate(tariff)}
                            >
                              <Icon
                                icon="heroicons:document-duplicate"
                                className="mr-2 h-4 w-4"
                              />
                              Duplicate
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600"
                              onClick={() =>
                                setDeleteDialog({ open: true, tariff })
                              }
                            >
                              <Icon
                                icon="heroicons:trash"
                                className="mr-2 h-4 w-4"
                              />
                              Delete
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
      </div>

      {/* Pagination */}
      {tariffs.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4">
          <div className="text-sm text-gray-600">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total} tariffs
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              <span className="text-sm">Rows per page:</span>
              <Select
                value={pagination.limit.toString()}
                onValueChange={(value) => handlePageSizeChange(Number(value))}
              >
                <SelectTrigger className="w-16">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-1">
              <Button
                variant="outline"
                size="md"
                onClick={() => handlePageChange(1)}
                disabled={pagination.page === 1}
              >
                <Icon
                  icon="heroicons:chevron-double-left"
                  className="h-4 w-4"
                />
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
              >
                <Icon icon="heroicons:chevron-left" className="h-4 w-4" />
              </Button>

              <span className="px-3 py-1 text-sm">
                Page {pagination.page} of {pagination.totalPages}
              </span>

              <Button
                variant="outline"
                size="md"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
              >
                <Icon icon="heroicons:chevron-right" className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={() => handlePageChange(pagination.totalPages)}
                disabled={pagination.page >= pagination.totalPages}
              >
                <Icon
                  icon="heroicons:chevron-double-right"
                  className="h-4 w-4"
                />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, tariff: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tariff</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the tariff for route{" "}
              <strong>
                {deleteDialog.tariff?.pickupCity.name} →{" "}
                {deleteDialog.tariff?.destinationCity.name}
              </strong>
              ? This action cannot be undone and will affect future shipments on
              this route.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteDialog.tariff && handleDelete(deleteDialog.tariff)
              }
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Delete Tariff
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TariffsTable;
