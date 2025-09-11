"use client";

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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/routing";
import { rolesApiClient } from "@/lib/api/clients/roles.client";
import { useAuthStore } from "@/lib/stores/auth.store";
import { toast } from "sonner";
import * as XLSX from "xlsx";

// Enhanced Types
interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  userTypes: string[];
  isActive: boolean;
  userCount: number;
  tenantId: string;
  tenant: {
    id: string;
    name: string;
    slug: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface RolesResponse {
  data: Role[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

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

// Utility function to format dates
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

// User type configurations
const userTypeConfig = {
  ADMIN: {
    label: "Admin",
    color: "bg-red-100 text-red-800",
    icon: "heroicons:shield-check",
  },
  MANAGER: {
    label: "Manager",
    color: "bg-orange-100 text-orange-800",
    icon: "heroicons:user-group",
  },
  SUPPORT: {
    label: "Support",
    color: "bg-blue-100 text-blue-800",
    icon: "heroicons:chat-bubble-left-right",
  },
  SELLER: {
    label: "Seller",
    color: "bg-green-100 text-green-800",
    icon: "heroicons:currency-dollar",
  },
  LIVREUR: {
    label: "Delivery",
    color: "bg-purple-100 text-purple-800",
    icon: "heroicons:truck",
  },
  CUSTOMER: {
    label: "Customer",
    color: "bg-indigo-100 text-indigo-800",
    icon: "heroicons:user",
  },
  BUYER: {
    label: "Buyer",
    color: "bg-green-100 text-green-800",
    icon: "heroicons:shopping-cart",
  },
  VENDOR: {
    label: "Vendor",
    color: "bg-yellow-100 text-yellow-800",
    icon: "heroicons:building-storefront",
  },
  WAREHOUSE: {
    label: "Warehouse",
    color: "bg-gray-100 text-gray-800",
    icon: "heroicons:building-office-2",
  },
  DISPATCHER: {
    label: "Dispatcher",
    color: "bg-cyan-100 text-cyan-800",
    icon: "heroicons:map",
  },
};

// Permission category colors
const getPermissionColor = (permission: string) => {
  const category = permission.split(":")[0];
  const colors = {
    users: "bg-blue-100 text-blue-800",
    roles: "bg-purple-100 text-purple-800",
    parcels: "bg-green-100 text-green-800",
    tracking: "bg-yellow-100 text-yellow-800",
    invoices: "bg-red-100 text-red-800",
    claims: "bg-orange-100 text-orange-800",
    reports: "bg-indigo-100 text-indigo-800",
    analytics: "bg-pink-100 text-pink-800",
    rates: "bg-emerald-100 text-emerald-800",
    warehouse: "bg-teal-100 text-teal-800",
    tenants: "bg-violet-100 text-violet-800",
  };
  return colors[category as keyof typeof colors] || "bg-gray-100 text-gray-800";
};

// Enhanced table columns
const createColumns = (
  onDelete: (role: Role) => void,
  onDuplicate: (role: Role) => void,
  onDeactivate: (role: Role) => void,
  onReactivate: (role: Role) => void,
  onViewUsers: (role: Role) => void,
  hasUpdatePermission: boolean,
  hasDeletePermission: boolean,
  hasCreatePermission: boolean
): ColumnDef<Role>[] => [
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
    accessorKey: "name",
    header: "Role Name",
    cell: ({ row }) => {
      const role = row.original;
      return (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                role.isActive ? "bg-green-100" : "bg-gray-100"
              }`}
            >
              <Icon
                icon={role.isActive ? "heroicons:check" : "heroicons:pause"}
                className={`w-4 h-4 ${
                  role.isActive ? "text-green-600" : "text-gray-400"
                }`}
              />
            </div>
          </div>
          <div>
            <div className="font-medium text-gray-900">{role.name}</div>
            {role.description && (
              <div className="text-sm text-gray-500 truncate max-w-xs">
                {role.description}
              </div>
            )}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "userTypes",
    header: "User Types",
    cell: ({ row }) => {
      const userTypes = row.getValue("userTypes") as string[];
      return (
        <div className="flex flex-wrap gap-1">
          {userTypes.slice(0, 2).map((type) => {
            const config = userTypeConfig[type as keyof typeof userTypeConfig];
            return (
              <span
                key={type}
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  config?.color || "bg-gray-100 text-gray-800"
                }`}
              >
                <Icon
                  icon={config?.icon || "heroicons:user"}
                  className="w-3 h-3 mr-1"
                />
                {config?.label || type}
              </span>
            );
          })}
          {userTypes.length > 2 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    +{userTypes.length - 2} more
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="space-y-1">
                    {userTypes.slice(2).map((type) => {
                      const config =
                        userTypeConfig[type as keyof typeof userTypeConfig];
                      return (
                        <div key={type} className="flex items-center gap-2">
                          <Icon
                            icon={config?.icon || "heroicons:user"}
                            className="w-3 h-3"
                          />
                          {config?.label || type}
                        </div>
                      );
                    })}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "permissions",
    header: "Permissions",
    cell: ({ row }) => {
      const permissions = row.getValue("permissions") as string[];
      const categories = [...new Set(permissions.map((p) => p.split(":")[0]))];

      return (
        <div className="flex flex-wrap gap-1">
          {categories.slice(0, 3).map((category) => (
            <span
              key={category}
              className={`inline-flex px-2 py-1 rounded-full text-xs font-medium capitalize ${getPermissionColor(
                category
              )}`}
            >
              {category}
            </span>
          ))}
          {categories.length > 3 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    +{categories.length - 3} more
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="max-w-xs">
                    <div className="text-sm font-medium mb-2">
                      All Permissions ({permissions.length})
                    </div>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {permissions.map((permission) => (
                        <div key={permission} className="text-xs">
                          {permission}
                        </div>
                      ))}
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "userCount",
    header: "Users",
    cell: ({ row }) => {
      const userCount = row.getValue("userCount") as number;
      const role = row.original;
      return (
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">{userCount}</span>
          {userCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewUsers(role)}
              className="h-6 px-2 text-xs"
            >
              View
            </Button>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => {
      const isActive = row.getValue("isActive") as boolean;
      return (
        <span
          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          <Icon
            icon={isActive ? "heroicons:check-circle" : "heroicons:x-circle"}
            className="w-3 h-3 mr-1"
          />
          {isActive ? "Active" : "Inactive"}
        </span>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => {
      const createdAt = row.getValue("createdAt") as string;
      return (
        <span className="text-sm text-gray-500">{formatDate(createdAt)}</span>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    enableHiding: false,
    cell: ({ row }) => {
      const role = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <Icon icon="heroicons:ellipsis-horizontal" className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/roles/${role.id}`}>
                <Icon icon="heroicons:eye" className="mr-2 h-4 w-4" />
                View Details
              </Link>
            </DropdownMenuItem>

            {role.userCount > 0 && (
              <DropdownMenuItem onClick={() => onViewUsers(role)}>
                <Icon icon="heroicons:users" className="mr-2 h-4 w-4" />
                View Users ({role.userCount})
              </DropdownMenuItem>
            )}

            {hasUpdatePermission && (
              <DropdownMenuItem asChild>
                <Link href={`/roles/${role.id}/edit`}>
                  <Icon
                    icon="heroicons:pencil-square"
                    className="mr-2 h-4 w-4"
                  />
                  Edit Role
                </Link>
              </DropdownMenuItem>
            )}

            {hasCreatePermission && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onDuplicate(role)}>
                  <Icon
                    icon="heroicons:document-duplicate"
                    className="mr-2 h-4 w-4"
                  />
                  Duplicate Role
                </DropdownMenuItem>
              </>
            )}

            {hasUpdatePermission && (
              <>
                <DropdownMenuSeparator />
                {role.isActive ? (
                  <DropdownMenuItem onClick={() => onDeactivate(role)}>
                    <Icon
                      icon="heroicons:pause"
                      className="mr-2 h-4 w-4 text-orange-600"
                    />
                    Deactivate Role
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => onReactivate(role)}>
                    <Icon
                      icon="heroicons:play"
                      className="mr-2 h-4 w-4 text-green-600"
                    />
                    Reactivate Role
                  </DropdownMenuItem>
                )}
              </>
            )}

            {hasDeletePermission && role.userCount === 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600"
                  onClick={() => onDelete(role)}
                >
                  <Icon icon="heroicons:trash" className="mr-2 h-4 w-4" />
                  Delete Role
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

// Duplicate Role Dialog Component
const DuplicateRoleDialog = ({
  open,
  onOpenChange,
  role,
  onConfirm,
  loading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: Role | null;
  onConfirm: (name: string, userTypes?: string[]) => void;
  loading: boolean;
}) => {
  const [name, setName] = React.useState("");
  const [selectedUserTypes, setSelectedUserTypes] = React.useState<string[]>(
    []
  );

  React.useEffect(() => {
    if (role) {
      setName(`${role.name} Copy`);
      setSelectedUserTypes(role.userTypes);
    }
  }, [role]);

  const handleConfirm = () => {
    if (name.trim()) {
      onConfirm(
        name.trim(),
        selectedUserTypes.length > 0 ? selectedUserTypes : undefined
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Duplicate Role</DialogTitle>
          <DialogDescription>
            Create a copy of "{role?.name}" with a new name and optionally
            different user types.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Role Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter new role name"
            />
          </div>

          <div className="space-y-2">
            <Label>User Types (Optional)</Label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(userTypeConfig).map(([type, config]) => (
                <label
                  key={type}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <Checkbox
                    checked={selectedUserTypes.includes(type)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedUserTypes([...selectedUserTypes, type]);
                      } else {
                        setSelectedUserTypes(
                          selectedUserTypes.filter((t) => t !== type)
                        );
                      }
                    }}
                  />
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${config.color}`}
                  >
                    {config.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={loading || !name.trim()}>
            {loading && (
              <Icon
                icon="heroicons:arrow-path"
                className="mr-2 h-4 w-4 animate-spin"
              />
            )}
            Duplicate Role
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Main Roles Table Component
const RolesTable = () => {
  const { hasPermission } = useAuthStore();
  const [roles, setRoles] = React.useState<Role[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [pagination, setPagination] = React.useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // Table state
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  // Filters state
  const [filters, setFilters] = React.useState({
    search: "",
    userType: "",
    isActive: "",
  });

  // Dialog states
  const [deleteDialog, setDeleteDialog] = React.useState<{
    open: boolean;
    role: Role | null;
  }>({ open: false, role: null });

  const [duplicateDialog, setDuplicateDialog] = React.useState<{
    open: boolean;
    role: Role | null;
  }>({ open: false, role: null });

  const [usersDialog, setUsersDialog] = React.useState<{
    open: boolean;
    role: Role | null;
    users: any[];
  }>({ open: false, role: null, users: [] });

  const [actionLoading, setActionLoading] = React.useState(false);

  // Permissions
  const hasUpdatePermission = hasPermission("roles:update");
  const hasDeletePermission = hasPermission("roles:delete");
  const hasCreatePermission = hasPermission("roles:create");

  // Fetch roles data
  const fetchRoles = React.useCallback(async () => {
    try {
      setLoading(true);

      const apiFilters: any = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (filters.search) apiFilters.name = filters.search;
      if (filters.userType) apiFilters.userType = filters.userType;
      if (filters.isActive !== "")
        apiFilters.isActive = filters.isActive === "true";

      const result = await rolesApiClient.getRoles(apiFilters);

      if (result.data && result.data[0] && result.data[0].data) {
        setRoles(result.data[0].data);
        setPagination((prev) => ({
          ...prev,
          total: result.data[0].meta.total,
          totalPages: result.data[0].meta.totalPages,
        }));
      } else {
        throw new Error(result.error?.message || "Failed to fetch roles");
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
      toast.error("Failed to fetch roles");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  React.useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  // Handle search with debouncing
  const searchTimerRef = React.useRef<NodeJS.Timeout>();

  const debouncedSearch = React.useCallback((value: string) => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }
    searchTimerRef.current = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: value }));
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 500);
  }, []);

  // Handle filter changes
  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handlePageSizeChange = (newSize: number) => {
    setPagination((prev) => ({ ...prev, limit: newSize, page: 1 }));
  };

  // Handle role actions
  const handleDeleteRole = async (role: Role) => {
    try {
      const response = await rolesApiClient.deleteRole(role.id);
      if (response.success) {
        toast.success("Role deleted successfully");
        fetchRoles();
        setDeleteDialog({ open: false, role: null });
      } else {
        toast.error(response.error?.message || "Failed to delete role");
      }
    } catch (error) {
      console.error("Error deleting role:", error);
      toast.error("Failed to delete role");
    }
  };

  const handleDuplicateRole = async (name: string, userTypes?: string[]) => {
    if (!duplicateDialog.role) return;

    setActionLoading(true);
    try {
      const result = await rolesApiClient.duplicateRole(
        duplicateDialog.role.id,
        {
          name,
          userTypes: userTypes as any,
        }
      );

      if (result.success) {
        toast.success("Role duplicated successfully");
        fetchRoles();
        setDuplicateDialog({ open: false, role: null });
      } else {
        toast.error(result.error?.message || "Failed to duplicate role");
      }
    } catch (error) {
      console.error("Error duplicating role:", error);
      toast.error("Failed to duplicate role");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeactivateRole = async (role: Role) => {
    setActionLoading(true);
    try {
      const result = await rolesApiClient.deactivateRole(role.id);
      if (result.success) {
        toast.success("Role deactivated successfully");
        fetchRoles();
      } else {
        toast.error(result.error?.message || "Failed to deactivate role");
      }
    } catch (error) {
      console.error("Error deactivating role:", error);
      toast.error("Failed to deactivate role");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivateRole = async (role: Role) => {
    setActionLoading(true);
    try {
      const result = await rolesApiClient.reactivateRole(role.id);
      if (result.success) {
        toast.success("Role reactivated successfully");
        fetchRoles();
      } else {
        toast.error(result.error?.message || "Failed to reactivate role");
      }
    } catch (error) {
      console.error("Error reactivating role:", error);
      toast.error("Failed to reactivate role");
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewUsers = async (role: Role) => {
    try {
      const result = await rolesApiClient.getRoleUsers(role.id);
      if (result.success) {
        setUsersDialog({ open: true, role, users: result.data[0]?.data || [] });
      } else {
        toast.error("Failed to fetch role users");
      }
    } catch (error) {
      console.error("Error fetching role users:", error);
      toast.error("Failed to fetch role users");
    }
  };

  // Export functionality
  const handleExportExcel = () => {
    try {
      const exportData = roles.map((role) => ({
        Name: role.name,
        Description: role.description || "N/A",
        "User Types": role.userTypes.join(", "),
        "Permissions Count": role.permissions.length,
        Permissions: role.permissions.join(", "),
        "User Count": role.userCount,
        Status: role.isActive ? "Active" : "Inactive",
        "Created At": formatDate(role.createdAt),
        "Updated At": formatDate(role.updatedAt),
        Tenant: role.tenant.name,
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Roles");

      const maxWidth = exportData.reduce(
        (w, r) => Math.max(w, Object.keys(r).length),
        10
      );
      worksheet["!cols"] = Array(maxWidth).fill({ width: 20 });

      const today = new Date().toISOString().split("T")[0];
      XLSX.writeFile(workbook, `roles-export-${today}.xlsx`);
      toast.success("Roles data exported successfully");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export roles data");
    }
  };

  // Table configuration
  const columns = React.useMemo(
    () =>
      createColumns(
        (role) => setDeleteDialog({ open: true, role }),
        (role) => setDuplicateDialog({ open: true, role }),
        handleDeactivateRole,
        handleReactivateRole,
        handleViewUsers,
        hasUpdatePermission,
        hasDeletePermission,
        hasCreatePermission
      ),
    [hasUpdatePermission, hasDeletePermission, hasCreatePermission]
  );

  const table = useReactTable({
    data: roles,
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

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 space-y-2 sm:space-y-0 sm:flex sm:items-center sm:space-x-2">
          <Input
            placeholder="Search roles..."
            className="sm:max-w-sm"
            onChange={(e) => debouncedSearch(e.target.value)}
          />

          <Select
            value={filters.userType || "all"}
            onValueChange={(value) =>
              handleFilterChange("userType", value === "all" ? "" : value)
            }
          >
            <SelectTrigger className="sm:w-[150px]">
              <SelectValue placeholder="User Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Object.entries(userTypeConfig).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.isActive || "all"}
            onValueChange={(value) =>
              handleFilterChange("isActive", value === "all" ? "" : value)
            }
          >
            <SelectTrigger className="sm:w-[120px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="true">Active</SelectItem>
              <SelectItem value="false">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleExportExcel}>
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
            {loading ? (
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
                  No roles found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm text-gray-600">
          Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
          {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
          {pagination.total} roles
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

            <span className="px-3 py-1 text-sm">
              Page {pagination.page} of {pagination.totalPages}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, role: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the role{" "}
              <strong>{deleteDialog.role?.name}</strong>? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteDialog.role && handleDeleteRole(deleteDialog.role)
              }
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Delete Role
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Duplicate Role Dialog */}
      <DuplicateRoleDialog
        open={duplicateDialog.open}
        onOpenChange={(open) => setDuplicateDialog({ open, role: null })}
        role={duplicateDialog.role}
        onConfirm={handleDuplicateRole}
        loading={actionLoading}
      />

      {/* Users Dialog */}
      <Dialog
        open={usersDialog.open}
        onOpenChange={(open) => setUsersDialog({ open, role: null, users: [] })}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Users with "{usersDialog.role?.name}" Role
            </DialogTitle>
            <DialogDescription>
              {usersDialog.users.length} users are assigned to this role
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-96 overflow-y-auto">
            <div className="space-y-2">
              {usersDialog.users.map((user: any) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {user.name?.charAt(0)?.toUpperCase() || "U"}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        userTypeConfig[
                          user.userType as keyof typeof userTypeConfig
                        ]?.color || "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {userTypeConfig[
                        user.userType as keyof typeof userTypeConfig
                      ]?.label || user.userType}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        user.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setUsersDialog({ open: false, role: null, users: [] })
              }
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RolesTable;
