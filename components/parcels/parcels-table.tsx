import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Icon } from "@/components/ui/icon";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/routing";
import { useParcelsStore } from "@/lib/stores/parcels/parcels.store";
import { useAuthStore } from "@/lib/stores/auth/auth.store";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import type { Parcel, PaymentStatus } from "@/lib/types/parcels/parcels.types";
import {
  PARCEL_STATUS_COLORS,
  PARCEL_STATUS_LABELS,
  PAYMENT_STATUS_COLORS,
  PAYMENT_STATUS_LABELS,
} from "@/lib/types/parcels/parcels.types";

// Utility function to format dates
const formatDate = (dateString: string, format: "short" | "long" = "short") => {
  const date = new Date(dateString);
  if (format === "short") {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  }
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Simple Table Components
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

// Status badge components
const ParcelStatusBadge = ({ status }: { status: string }) => {
  const statusLabel = PARCEL_STATUS_LABELS[status] || status;
  const statusColor = PARCEL_STATUS_COLORS[status] || "#6B7280";

  return (
    <Badge
      style={{
        backgroundColor: statusColor + "20",
        color: statusColor,
        borderColor: statusColor,
      }}
      className="border"
    >
      {statusLabel}
    </Badge>
  );
};

const PaymentStatusBadge = ({ status }: { status: PaymentStatus }) => {
  const statusLabel = PAYMENT_STATUS_LABELS[status] || status;
  const statusColor = PAYMENT_STATUS_COLORS[status] || "#6B7280";

  return (
    <Badge
      style={{
        backgroundColor: statusColor + "20",
        color: statusColor,
        borderColor: statusColor,
      }}
      className="border"
    >
      {statusLabel}
    </Badge>
  );
};

// Status change dialog component
const StatusChangeDialog = ({
  open,
  onOpenChange,
  parcel,
  onConfirm,
  loading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parcel: Parcel | null;
  onConfirm: (statusCode: string, comment?: string) => void;
  loading?: boolean;
}) => {
  const [statusCode, setStatusCode] = React.useState("");
  const [comment, setComment] = React.useState("");

  const statusOptions = [
    { value: "RECEIVED", label: "Reçu" },
    { value: "COLLECTED", label: "Ramassé" },
    { value: "DISPATCHED", label: "Expédié" },
    { value: "PUT_IN_DISTRIBUTION", label: "Mis en distribution" },
    { value: "OUT_FOR_DELIVERY", label: "En cours de livraison" },
    { value: "DELIVERED", label: "Livré" },
    { value: "RETURNED", label: "Retourné" },
    { value: "REFUSED", label: "Refusé" },
    { value: "CANCELLED", label: "Annulé" },
  ];

  const handleSubmit = () => {
    if (!statusCode) {
      toast.error("Please select a status");
      return;
    }
    onConfirm(statusCode, comment);
    setStatusCode("");
    setComment("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Parcel Status</DialogTitle>
          <DialogDescription>
            Change the status of parcel {parcel?.code}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>New Status</Label>
            <Select value={statusCode} onValueChange={setStatusCode}>
              <SelectTrigger>
                <SelectValue placeholder="Select new status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Comment (optional)</Label>
            <Textarea
              placeholder="Add a comment about this status change..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && (
              <Icon
                icon="heroicons:arrow-path"
                className="mr-2 h-4 w-4 animate-spin"
              />
            )}
            Change Status
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Enhanced table columns
const createColumns = (
  onDelete: (parcel: Parcel) => void,
  onChangeStatus: (parcel: Parcel) => void,
  onUpdatePayment: (parcel: Parcel) => void,
  hasUpdatePermission: boolean,
  hasDeletePermission: boolean,
  isAdminView: boolean = true
): ColumnDef<Parcel>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "code",
    header: "Parcel Code",
    cell: ({ row }) => {
      const parcel = row.original;
      return (
        <div className="space-y-1">
          <div className="font-mono text-sm font-medium">{parcel.code}</div>
          {parcel.trackingCode && (
            <div className="text-xs text-gray-500">
              Track: {parcel.trackingCode}
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "recipientName",
    header: "Recipient",
    cell: ({ row }) => {
      const parcel = row.original;
      return (
        <div className="space-y-1">
          <div className="font-medium">{parcel.recipientName}</div>
          <div className="text-sm text-gray-500">{parcel.recipientPhone}</div>
          {parcel.alternativePhone && (
            <div className="text-xs text-gray-400">
              Alt: {parcel.alternativePhone}
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "route",
    header: "Route",
    cell: ({ row }) => {
      const parcel = row.original;
      return (
        <div className="space-y-1">
          <div className="text-sm">
            <span className="font-medium">{parcel.pickupCity?.name}</span>
            <Icon
              icon="heroicons:arrow-right"
              className="mx-1 h-3 w-3 inline"
            />
            <span className="font-medium">{parcel.destinationCity?.name}</span>
          </div>
          <div className="text-xs text-gray-500">
            {parcel.pickupCity?.ref} → {parcel.destinationCity?.ref}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "parcelStatusCode",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("parcelStatusCode") as string;
      return <ParcelStatusBadge status={status} />;
    },
  },
  {
    accessorKey: "paymentStatus",
    header: "Payment",
    cell: ({ row }) => {
      const status = row.getValue("paymentStatus") as PaymentStatus;
      return <PaymentStatusBadge status={status} />;
    },
  },
  {
    accessorKey: "price",
    header: "Amount",
    cell: ({ row }) => {
      const parcel = row.original;
      return (
        <div className="space-y-1">
          <div className="font-medium">{parcel.price} DH</div>
          {parcel.productName && (
            <div className="text-xs text-gray-500">{parcel.productName}</div>
          )}
          {parcel.quantity && parcel.quantity > 1 && (
            <div className="text-xs text-gray-400">Qty: {parcel.quantity}</div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => {
      const parcel = row.original;
      return (
        <div className="space-y-1">
          <div className="text-sm">{formatDate(parcel.createdAt)}</div>
          {parcel.deliveredAt && (
            <div className="text-xs text-green-600">
              Delivered: {formatDate(parcel.deliveredAt)}
            </div>
          )}
        </div>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    enableHiding: false,
    cell: ({ row }) => {
      const parcel = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="md">
              <Icon icon="heroicons:ellipsis-horizontal" className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/parcels/${parcel.id}`}>
                <Icon icon="heroicons:eye" className="mr-2 h-4 w-4" />
                View Details
              </Link>
            </DropdownMenuItem>

            {hasUpdatePermission && (
              <>
                <DropdownMenuItem asChild>
                  <Link href={`/parcels/${parcel.id}/edit`}>
                    <Icon
                      icon="heroicons:pencil-square"
                      className="mr-2 h-4 w-4"
                    />
                    Edit Parcel
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={() => onChangeStatus(parcel)}>
                  <Icon
                    icon="heroicons:arrow-path"
                    className="mr-2 h-4 w-4 text-blue-600"
                  />
                  Change Status
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => onUpdatePayment(parcel)}>
                  <Icon
                    icon="heroicons:credit-card"
                    className="mr-2 h-4 w-4 text-green-600"
                  />
                  Update Payment
                </DropdownMenuItem>
              </>
            )}

            <DropdownMenuSeparator />

            <DropdownMenuItem asChild>
              <Link href={`/parcels/${parcel.id}/history`}>
                <Icon icon="heroicons:clock" className="mr-2 h-4 w-4" />
                View History
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link href={`/parcels/${parcel.id}/duplicate`}>
                <Icon
                  icon="heroicons:document-duplicate"
                  className="mr-2 h-4 w-4"
                />
                Duplicate
              </Link>
            </DropdownMenuItem>

            {hasDeletePermission &&
              parcel.parcelStatusCode === "NEW_PACKAGE" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-600"
                    onClick={() => onDelete(parcel)}
                  >
                    <Icon icon="heroicons:trash" className="mr-2 h-4 w-4" />
                    Delete Parcel
                  </DropdownMenuItem>
                </>
              )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

// Main Enhanced Parcels Table Component
const ParcelsTable = ({
  isAdminView = true,
  showUserColumn = true,
}: {
  isAdminView?: boolean;
  showUserColumn?: boolean;
}) => {
  const { hasPermission } = useAuthStore();
  const {
    parcels,
    isLoading,
    pagination,
    filters,
    selectedIds,
    fetchParcels,
    fetchMyParcels,
    setFilters,
    setSelectedIds,
    deleteParcel,
    changeParcelStatus,
    updatePaymentStatus,
  } = useParcelsStore();

  // Table state
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  // Dialog states
  const [deleteDialog, setDeleteDialog] = React.useState<{
    open: boolean;
    parcel: Parcel | null;
  }>({ open: false, parcel: null });

  const [statusDialog, setStatusDialog] = React.useState<{
    open: boolean;
    parcel: Parcel | null;
  }>({ open: false, parcel: null });

  const [actionLoading, setActionLoading] = React.useState(false);

  // Permissions
  const hasUpdatePermission = hasPermission("parcels:update");
  const hasDeletePermission = hasPermission("parcels:delete");

  // Fetch data on component mount
  React.useEffect(() => {
    if (isAdminView) {
      fetchParcels();
    } else {
      fetchMyParcels();
    }
  }, [isAdminView, fetchParcels, fetchMyParcels]);

  // Handle filter changes
  const handleSearchChange = React.useCallback(
    (value: string) => {
      setFilters({ search: value, page: 1 });
    },
    [setFilters]
  );

  const handleFilterChange = (key: string, value: string) => {
    setFilters({ [key]: value, page: 1 });
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setFilters({ page: newPage });
  };

  const handlePageSizeChange = (newSize: number) => {
    setFilters({ limit: newSize, page: 1 });
  };

  // Handle status change
  const handleStatusChange = async (statusCode: string, comment?: string) => {
    if (!statusDialog.parcel) return;

    setActionLoading(true);
    try {
      const success = await changeParcelStatus(statusDialog.parcel.id, {
        statusCode,
        comment,
      });

      if (success) {
        setStatusDialog({ open: false, parcel: null });
      }
    } catch (error) {
      console.error("Failed to change status:", error);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle delete parcel
  const handleDeleteParcel = async (parcel: Parcel) => {
    try {
      const success = await deleteParcel(parcel.id);
      if (success) {
        setDeleteDialog({ open: false, parcel: null });
      }
    } catch (error) {
      console.error("Error deleting parcel:", error);
    }
  };

  // Enhanced export with all fields
  const handleExportExcel = () => {
    try {
      const exportData = parcels.map((parcel) => ({
        "Parcel Code": parcel.code,
        "Recipient Name": parcel.recipientName,
        "Recipient Phone": parcel.recipientPhone,
        "Alternative Phone": parcel.alternativePhone || "N/A",
        Address: parcel.recipientAddress,
        "Pickup City": parcel.pickupCity?.name || "N/A",
        "Destination City": parcel.destinationCity?.name || "N/A",
        Product: parcel.productName || "N/A",
        Quantity: parcel.quantity || 1,
        "Price (DH)": parcel.price,
        Status:
          PARCEL_STATUS_LABELS[parcel.parcelStatusCode] ||
          parcel.parcelStatusCode,
        "Payment Status":
          PAYMENT_STATUS_LABELS[parcel.paymentStatus] || parcel.paymentStatus,
        "Delivery Price": parcel.deliveryPrice,
        "Return Price": parcel.returnPrice,
        "Refusal Price": parcel.refusalPrice,
        "Delivery Delay": parcel.deliveryDelay,
        "Cannot Open": parcel.cannotOpen ? "Yes" : "No",
        "Can Replace": parcel.canReplace ? "Yes" : "No",
        "Is Stock": parcel.isStock ? "Yes" : "No",
        "Delivery Attempts": parcel.deliveryAttempts,
        "Created At": formatDate(parcel.createdAt, "long"),
        "Last Attempt": parcel.lastAttemptDate
          ? formatDate(parcel.lastAttemptDate, "long")
          : "N/A",
        "Delivered At": parcel.deliveredAt
          ? formatDate(parcel.deliveredAt, "long")
          : "N/A",
        "Returned At": parcel.returnedAt
          ? formatDate(parcel.returnedAt, "long")
          : "N/A",
        "Refused At": parcel.refusedAt
          ? formatDate(parcel.refusedAt, "long")
          : "N/A",
        Comments: parcel.comment || "N/A",
        "Return Reason": parcel.returnReason || "N/A",
        "Refusal Reason": parcel.refusalReason || "N/A",
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Parcels");

      const maxWidth = exportData.reduce(
        (w, r) => Math.max(w, Object.keys(r).length),
        10
      );
      worksheet["!cols"] = Array(maxWidth).fill({ width: 20 });

      const today = new Date().toISOString().split("T")[0];
      XLSX.writeFile(workbook, `parcels-export-${today}.xlsx`);
      toast.success("Parcels data exported successfully");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export parcels data");
    }
  };

  // Table configuration
  const columns = React.useMemo(
    () =>
      createColumns(
        (parcel) => setDeleteDialog({ open: true, parcel }),
        (parcel) => setStatusDialog({ open: true, parcel }),
        (parcel) => {
          // Handle payment update - you can implement a separate dialog for this
          toast.info("Payment update functionality - to be implemented");
        },
        hasUpdatePermission,
        hasDeletePermission,
        isAdminView
      ),
    [hasUpdatePermission, hasDeletePermission, isAdminView]
  );

  const table = useReactTable({
    data: parcels,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    manualPagination: true,
    pageCount: pagination.totalPages,
  });

  const selectedRowsCount = table.getFilteredSelectedRowModel().rows.length;

  return (
    <div className="space-y-4 mx-4">
      {/* Quick Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="md"
          onClick={() => handleFilterChange("statusCode", "NEW_PACKAGE")}
        >
          <Icon icon="heroicons:document-plus" className="h-4 w-4 mr-2" />
          New Parcels
        </Button>
        <Button
          variant="outline"
          size="md"
          onClick={() => handleFilterChange("statusCode", "OUT_FOR_DELIVERY")}
        >
          <Icon icon="heroicons:truck" className="h-4 w-4 mr-2" />
          Out for Delivery
        </Button>
        <Button
          variant="outline"
          size="md"
          onClick={() => handleFilterChange("statusCode", "DELIVERED")}
        >
          <Icon icon="heroicons:check-circle" className="h-4 w-4 mr-2" />
          Delivered
        </Button>
        <Button
          variant="outline"
          size="md"
          onClick={() => setFilters(DEFAULT_FILTERS)}
        >
          <Icon icon="heroicons:squares-2x2" className="h-4 w-4 mr-2" />
          All Parcels
        </Button>
      </div>

      {/* Enhanced Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 space-y-2 sm:space-y-0 sm:flex sm:items-center sm:space-x-2">
          <Input
            placeholder="Search parcels..."
            className="sm:max-w-sm"
            value={filters.search || ""}
            onChange={(e) => handleSearchChange(e.target.value)}
          />

          <Select
            value={filters.statusCode || "all"}
            onValueChange={(value) =>
              handleFilterChange("statusCode", value === "all" ? "" : value)
            }
          >
            <SelectTrigger className="sm:w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="NEW_PACKAGE">Nouveau Colis</SelectItem>
              <SelectItem value="RECEIVED">Reçu</SelectItem>
              <SelectItem value="COLLECTED">Ramassé</SelectItem>
              <SelectItem value="DISPATCHED">Expédié</SelectItem>
              <SelectItem value="PUT_IN_DISTRIBUTION">
                Mis en distribution
              </SelectItem>
              <SelectItem value="OUT_FOR_DELIVERY">
                En cours de livraison
              </SelectItem>
              <SelectItem value="DELIVERED">Livré</SelectItem>
              <SelectItem value="RETURNED">Retourné</SelectItem>
              <SelectItem value="REFUSED">Refusé</SelectItem>
              <SelectItem value="CANCELLED">Annulé</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.paymentStatus || "all"}
            onValueChange={(value) =>
              handleFilterChange("paymentStatus", value === "all" ? "" : value)
            }
          >
            <SelectTrigger className="sm:w-[140px]">
              <SelectValue placeholder="Payment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payments</SelectItem>
              <SelectItem value="PENDING">En attente</SelectItem>
              <SelectItem value="PAID">Payé</SelectItem>
              <SelectItem value="INVOICED">Facturé</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          {selectedRowsCount > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {selectedRowsCount} selected
              </span>
              <Button variant="outline" size="md">
                <Icon icon="heroicons:arrow-path" className="h-4 w-4 mr-2" />
                Bulk Actions
              </Button>
            </div>
          )}
          <Button variant="outline" size="md" onClick={handleExportExcel}>
            <Icon
              icon="heroicons:document-arrow-down"
              className="h-4 w-4 mr-2"
            />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  {columns.map((_, cellIndex) => (
                    <TableCell key={cellIndex}>
                      <div className="h-4 bg-gray-200 rounded animate-pulse" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No parcels found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4">
        <div className="text-sm text-gray-600">
          Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
          {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
          {pagination.total} parcels
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
              <Icon icon="heroicons:chevron-double-left" className="h-4 w-4" />
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
              <Icon icon="heroicons:chevron-double-right" className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, parcel: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              parcel
              <strong> {deleteDialog.parcel?.code}</strong> and remove all
              associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteDialog.parcel && handleDeleteParcel(deleteDialog.parcel)
              }
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Delete Parcel
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Status Change Dialog */}
      <StatusChangeDialog
        open={statusDialog.open}
        onOpenChange={(open) => setStatusDialog({ open, parcel: null })}
        parcel={statusDialog.parcel}
        onConfirm={handleStatusChange}
        loading={actionLoading}
      />
    </div>
  );
};

export default ParcelsTable;
