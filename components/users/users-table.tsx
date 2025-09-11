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
import { Link } from "@/i18n/routing";
import { usersApiClient } from "@/lib/api/clients/users.client";
import { useAuthStore } from "@/lib/stores/auth.store";
import { toast } from "sonner";
import * as XLSX from "xlsx";

// Enhanced Types
interface User {
  id: string;
  email: string;
  name: string;
  userType: string;
  avatar?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  accountStatus:
    | "PENDING"
    | "INACTIVE"
    | "PENDING_VALIDATION"
    | "ACTIVE"
    | "REJECTED"
    | "SUSPENDED";
  validationStatus: "PENDING" | "VALIDATED" | "REJECTED";
  profileCompleted: boolean;
  validationNotes?: string;
  validatedAt?: string;
  profile?: {
    phone?: string;
    address?: {
      city?: string;
      state?: string;
      country?: string;
    };
    cin?: string;
    cinDocuments?: string[];
    bankDetails?: any;
    profilePhoto?: string;
  };
  role: {
    id: string;
    name: string;
    description?: string;
  };
  tenant: {
    name: string;
    slug: string;
  };
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
  validatedBy?: {
    id: string;
    name: string;
    email: string;
  };
}

interface UsersResponse {
  data: User[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

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
const AccountStatusBadge = ({ status }: { status: string }) => {
  const statusConfig = {
    PENDING: {
      color: "bg-yellow-100 text-yellow-800",
      label: "Pending Approval",
      icon: "⏱️",
    },
    INACTIVE: {
      color: "bg-gray-100 text-gray-800",
      label: "Inactive",
      icon: "⏸️",
    },
    PENDING_VALIDATION: {
      color: "bg-blue-100 text-blue-800",
      label: "Pending Validation",
      icon: "📋",
    },
    ACTIVE: {
      color: "bg-green-100 text-green-800",
      label: "Active",
      icon: "✅",
    },
    REJECTED: {
      color: "bg-red-100 text-red-800",
      label: "Rejected",
      icon: "❌",
    },
    SUSPENDED: {
      color: "bg-red-100 text-red-800",
      label: "Suspended",
      icon: "🚫",
    },
  };

  const config =
    statusConfig[status as keyof typeof statusConfig] || statusConfig.INACTIVE;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}
    >
      <span>{config.icon}</span>
      {config.label}
    </span>
  );
};

const ValidationStatusBadge = ({
  status,
  isValidated,
}: {
  status: string;
  isValidated?: boolean;
}) => {
  if (status === "VALIDATED" && isValidated) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <span className="text-blue-500">🛡️</span>
        Validated
      </span>
    );
  }

  const statusConfig = {
    PENDING: {
      color: "bg-yellow-100 text-yellow-800",
      label: "Pending",
      icon: "⏱️",
    },
    VALIDATED: {
      color: "bg-green-100 text-green-800",
      label: "Validated",
      icon: "🛡️",
    },
    REJECTED: {
      color: "bg-red-100 text-red-800",
      label: "Rejected",
      icon: "⚠️",
    },
  };

  const config =
    statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}
    >
      <span>{config.icon}</span>
      {config.label}
    </span>
  );
};

// Enhanced table columns
const createColumns = (
  onDelete: (user: User) => void,
  onApproveRegistration: (user: User) => void,
  onRejectRegistration: (user: User) => void,
  onValidateProfile: (user: User) => void,
  onRejectProfile: (user: User) => void,
  onSuspend: (user: User) => void,
  onReactivate: (user: User) => void,
  hasUpdatePermission: boolean,
  hasDeletePermission: boolean,
  hasApprovePermission: boolean,
  hasValidatePermission: boolean
): ColumnDef<User>[] => [
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
    header: "User",
    cell: ({ row }) => {
      const user = row.original;
      return (
        <div className="flex items-center space-x-3">
          <Avatar size="sm" shape="circle">
            <AvatarImage
              src={user.profile?.profilePhoto || user.avatar || ""}
              alt={user.name}
            />
            <AvatarFallback>
              {user.name
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium flex items-center gap-2">
              {user.name}
              {user.validationStatus === "VALIDATED" && (
                <span className="text-blue-500" title="Verified Profile">
                  🛡️
                </span>
              )}
            </div>
            <div className="text-sm text-gray-500">{user.email}</div>
            {user.profile?.phone && (
              <div className="text-xs text-gray-400">{user.profile.phone}</div>
            )}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "userType",
    header: "User Type",
    cell: ({ row }) => {
      const userType = row.getValue("userType") as string;
      const colorMap: Record<string, string> = {
        ADMIN: "bg-red-100 text-red-800",
        MANAGER: "bg-orange-100 text-orange-800",
        SELLER: "bg-blue-100 text-blue-800",
        CUSTOMER: "bg-green-100 text-green-800",
        LIVREUR: "bg-purple-100 text-purple-800",
        SUPPORT: "bg-blue-100 text-blue-800",
        BUYER: "bg-green-100 text-green-800",
        VENDOR: "bg-orange-100 text-orange-800",
        WAREHOUSE: "bg-gray-100 text-gray-800",
        DISPATCHER: "bg-indigo-100 text-indigo-800",
      };
      return (
        <span
          className={`inline-flex px-2 py-1 rounded-full text-xs font-medium capitalize ${
            colorMap[userType] || "bg-gray-100 text-gray-800"
          }`}
        >
          {userType.toLowerCase().replace("_", " ")}
        </span>
      );
    },
  },
  {
    accessorKey: "accountStatus",
    header: "Account Status",
    cell: ({ row }) => {
      const status = row.getValue("accountStatus") as string;
      return <AccountStatusBadge status={status} />;
    },
  },
  {
    accessorKey: "validationStatus",
    header: "Validation",
    cell: ({ row }) => {
      const user = row.original;
      return (
        <ValidationStatusBadge
          status={user.validationStatus}
          isValidated={user.validationStatus === "VALIDATED"}
        />
      );
    },
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => {
      const role = row.original.role;
      return (
        <div>
          <div className="font-medium capitalize">{role.name}</div>
          {role.description && (
            <div className="text-sm text-gray-500">{role.description}</div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "profileCompleted",
    header: "Profile",
    cell: ({ row }) => {
      const completed = row.getValue("profileCompleted") as boolean;
      return (
        <span
          className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
            completed
              ? "bg-green-100 text-green-800"
              : "bg-yellow-100 text-yellow-800"
          }`}
        >
          {completed ? "Complete" : "Incomplete"}
        </span>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => {
      const user = row.original;
      return (
        <div>
          <div>{formatDate(user.createdAt)}</div>
          {user.createdBy && (
            <div className="text-xs text-gray-500">
              by {user.createdBy.name}
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
      const user = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <Icon icon="heroicons:ellipsis-horizontal" className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/users/${user.id}`}>
                <Icon icon="heroicons:eye" className="mr-2 h-4 w-4" />
                View Details
              </Link>
            </DropdownMenuItem>

            {hasUpdatePermission && (
              <DropdownMenuItem asChild>
                <Link href={`/users/${user.id}/edit`}>
                  <Icon
                    icon="heroicons:pencil-square"
                    className="mr-2 h-4 w-4"
                  />
                  Edit User
                </Link>
              </DropdownMenuItem>
            )}

            {/* Registration Approval Actions */}
            {hasApprovePermission && user.accountStatus === "PENDING" && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onApproveRegistration(user)}>
                  <Icon
                    icon="heroicons:check"
                    className="mr-2 h-4 w-4 text-green-600"
                  />
                  Approve Registration
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onRejectRegistration(user)}>
                  <Icon
                    icon="heroicons:x-mark"
                    className="mr-2 h-4 w-4 text-red-600"
                  />
                  Reject Registration
                </DropdownMenuItem>
              </>
            )}

            {/* Profile Validation Actions */}
            {hasValidatePermission &&
              user.accountStatus === "PENDING_VALIDATION" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onValidateProfile(user)}>
                    <Icon
                      icon="heroicons:shield-check"
                      className="mr-2 h-4 w-4 text-blue-600"
                    />
                    Validate Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onRejectProfile(user)}>
                    <Icon
                      icon="heroicons:shield-exclamation"
                      className="mr-2 h-4 w-4 text-red-600"
                    />
                    Reject Profile
                  </DropdownMenuItem>
                </>
              )}

            {/* Suspend/Reactivate Actions */}
            {hasUpdatePermission && (
              <>
                <DropdownMenuSeparator />
                {user.accountStatus === "SUSPENDED" ? (
                  <DropdownMenuItem onClick={() => onReactivate(user)}>
                    <Icon
                      icon="heroicons:play"
                      className="mr-2 h-4 w-4 text-green-600"
                    />
                    Reactivate User
                  </DropdownMenuItem>
                ) : (
                  user.accountStatus === "ACTIVE" && (
                    <DropdownMenuItem onClick={() => onSuspend(user)}>
                      <Icon
                        icon="heroicons:pause"
                        className="mr-2 h-4 w-4 text-orange-600"
                      />
                      Suspend User
                    </DropdownMenuItem>
                  )
                )}
              </>
            )}

            {hasDeletePermission && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600"
                  onClick={() => onDelete(user)}
                >
                  <Icon icon="heroicons:trash" className="mr-2 h-4 w-4" />
                  Delete User
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

// Action Dialog Component
const ActionDialog = ({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  loading,
  showMessage = false,
  message,
  onMessageChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void;
  loading?: boolean;
  showMessage?: boolean;
  message?: string;
  onMessageChange?: (message: string) => void;
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>

      {showMessage && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Message (optional)</label>
          <Textarea
            placeholder="Add a message for the user..."
            value={message || ""}
            onChange={(e) => onMessageChange?.(e.target.value)}
          />
        </div>
      )}

      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button onClick={onConfirm} disabled={loading}>
          {loading && (
            <Icon
              icon="heroicons:arrow-path"
              className="mr-2 h-4 w-4 animate-spin"
            />
          )}
          Confirm
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

// Main Enhanced Users Table Component
const UsersTable = () => {
  const { hasPermission } = useAuthStore();
  const [users, setUsers] = React.useState<User[]>([]);
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

  // Enhanced filters state
  const [filters, setFilters] = React.useState({
    search: "",
    userType: "",
    isActive: "",
    roleId: "",
    accountStatus: "",
    validationStatus: "",
  });

  // Dialog states
  const [deleteDialog, setDeleteDialog] = React.useState<{
    open: boolean;
    user: User | null;
  }>({ open: false, user: null });

  const [actionDialog, setActionDialog] = React.useState<{
    open: boolean;
    type:
      | "approve"
      | "reject"
      | "validate"
      | "rejectProfile"
      | "suspend"
      | "reactivate"
      | null;
    user: User | null;
    message: string;
  }>({ open: false, type: null, user: null, message: "" });

  const [actionLoading, setActionLoading] = React.useState(false);

  // Permissions
  const hasUpdatePermission = hasPermission("users:update");
  const hasDeletePermission = hasPermission("users:delete");
  const hasApprovePermission = hasPermission("users:approve");
  const hasValidatePermission = hasPermission("users:validate");

  // Fetch users data with enhanced filters
  const fetchUsers = React.useCallback(async () => {
    try {
      setLoading(true);

      const apiFilters: any = {
        page: pagination.page,
        limit: pagination.limit,
      };

      // Add all filters
      if (filters.search) apiFilters.search = filters.search;
      if (filters.userType) apiFilters.userType = filters.userType;
      if (filters.isActive !== "")
        apiFilters.isActive = filters.isActive === "true";
      if (filters.roleId) apiFilters.roleId = filters.roleId;
      if (filters.accountStatus)
        apiFilters.accountStatus = filters.accountStatus;
      if (filters.validationStatus)
        apiFilters.validationStatus = filters.validationStatus;

      const result = await usersApiClient.getUsers(apiFilters);

      if (result.data && result.data[0] && result.data[0].data) {
        setUsers(result.data[0].data);
        setPagination((prev) => ({
          ...prev,
          total: result.data[0].meta.total,
          totalPages: result.data[0].meta.totalPages,
        }));
      } else {
        throw new Error(result.error?.message || "Failed to fetch users");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  // Fetch special user lists
  const fetchPendingRegistrations = async () => {
    try {
      const result = await usersApiClient.getPendingRegistrations();
      if (result.success) {
        setUsers(result.data);
        setPagination((prev) => ({
          ...prev,
          total: result.data.length,
          totalPages: 1,
        }));
      }
    } catch (error) {
      toast.error("Failed to fetch pending registrations");
    }
  };

  const fetchPendingValidations = async () => {
    try {
      const result = await usersApiClient.getPendingValidations();
      if (result.success) {
        setUsers(result.data);
        setPagination((prev) => ({
          ...prev,
          total: result.data.length,
          totalPages: 1,
        }));
      }
    } catch (error) {
      toast.error("Failed to fetch pending validations");
    }
  };

  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Enhanced action handlers
  const handleApproveRegistration = async (user: User) => {
    setActionDialog({
      open: true,
      type: "approve",
      user,
      message: `Welcome to our platform! Your registration has been approved.`,
    });
  };

  const handleRejectRegistration = async (user: User) => {
    setActionDialog({
      open: true,
      type: "reject",
      user,
      message: `We're sorry, but your registration could not be approved at this time.`,
    });
  };

  const handleValidateProfile = async (user: User) => {
    setActionDialog({
      open: true,
      type: "validate",
      user,
      message: `Congratulations! Your profile has been validated.`,
    });
  };

  const handleRejectProfile = async (user: User) => {
    setActionDialog({
      open: true,
      type: "rejectProfile",
      user,
      message: `Your profile requires additional information. Please review and update.`,
    });
  };

  const handleSuspend = async (user: User) => {
    setActionDialog({ open: true, type: "suspend", user, message: "" });
  };

  const handleReactivate = async (user: User) => {
    setActionDialog({ open: true, type: "reactivate", user, message: "" });
  };

  const executeAction = async () => {
    if (!actionDialog.user || !actionDialog.type) return;

    setActionLoading(true);
    try {
      let result;
      const { user, type, message } = actionDialog;

      switch (type) {
        case "approve":
          result = await usersApiClient.approveRegistration(user.id, {
            approve: true,
            message,
          });
          break;
        case "reject":
          result = await usersApiClient.approveRegistration(user.id, {
            approve: false,
            message,
          });
          break;
        case "validate":
          result = await usersApiClient.validateProfile(user.id, {
            action: "VALIDATE",
            notes: message,
          });
          break;
        case "rejectProfile":
          result = await usersApiClient.validateProfile(user.id, {
            action: "REJECT",
            notes: message,
          });
          break;
        case "suspend":
          result = await usersApiClient.suspendUser(user.id);
          break;
        case "reactivate":
          result = await usersApiClient.reactivateUser(user.id);
          break;
      }

      if (result?.success) {
        toast.success(`User ${type} successfully`);
        fetchUsers();
        setActionDialog({ open: false, type: null, user: null, message: "" });
      } else {
        toast.error(result?.error?.message || `Failed to ${type} user`);
      }
    } catch (error) {
      toast.error(`Failed to ${actionDialog.type} user`);
    } finally {
      setActionLoading(false);
    }
  };

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

  // Handle delete user
  const handleDeleteUser = async (user: User) => {
    try {
      const response = await usersApiClient.deleteUser(user.id);
      if (response.success) {
        toast.success("User deleted successfully");
        fetchUsers();
        setDeleteDialog({ open: false, user: null });
      } else {
        toast.error(response.error?.message || "Failed to delete user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user");
    }
  };

  // Enhanced export with new fields
  const handleExportExcel = () => {
    try {
      const exportData = users.map((user) => ({
        Name: user.name,
        Email: user.email,
        "User Type": user.userType,
        Role: user.role.name,
        Phone: user.profile?.phone || "N/A",
        "Account Status": user.accountStatus,
        "Validation Status": user.validationStatus,
        "Profile Completed": user.profileCompleted ? "Yes" : "No",
        "Is Active": user.isActive ? "Active" : "Inactive",
        "Last Login": user.lastLogin
          ? formatDate(user.lastLogin, "long")
          : "Never",
        "Created At": formatDate(user.createdAt, "long"),
        "Created By": user.createdBy?.name || "Self-registered",
        "Validated At": user.validatedAt
          ? formatDate(user.validatedAt, "long")
          : "N/A",
        "Validated By": user.validatedBy?.name || "N/A",
        CIN: user.profile?.cin || "N/A",
        Location: user.profile?.address
          ? `${user.profile.address.city || ""}, ${
              user.profile.address.state || ""
            }, ${user.profile.address.country || ""}`.replace(
              /^,\s*|,\s*$/g,
              ""
            )
          : "N/A",
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Users");

      const maxWidth = exportData.reduce(
        (w, r) => Math.max(w, Object.keys(r).length),
        10
      );
      worksheet["!cols"] = Array(maxWidth).fill({ width: 20 });

      const today = new Date().toISOString().split("T")[0];
      XLSX.writeFile(workbook, `users-export-${today}.xlsx`);
      toast.success("Users data exported successfully");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export users data");
    }
  };

  // Table configuration
  const columns = React.useMemo(
    () =>
      createColumns(
        (user) => setDeleteDialog({ open: true, user }),
        handleApproveRegistration,
        handleRejectRegistration,
        handleValidateProfile,
        handleRejectProfile,
        handleSuspend,
        handleReactivate,
        hasUpdatePermission,
        hasDeletePermission,
        hasApprovePermission,
        hasValidatePermission
      ),
    [
      hasUpdatePermission,
      hasDeletePermission,
      hasApprovePermission,
      hasValidatePermission,
    ]
  );

  const table = useReactTable({
    data: users,
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
    <div className="space-y-4">
      {/* Quick Action Buttons */}
      <div className="flex flex-wrap gap-2">
        {hasApprovePermission && (
          <Button
            variant="outline"
            size="sm"
            onClick={fetchPendingRegistrations}
          >
            <Icon icon="heroicons:user-plus" className="h-4 w-4 mr-2" />
            Pending Registrations
          </Button>
        )}
        {hasValidatePermission && (
          <Button variant="outline" size="sm" onClick={fetchPendingValidations}>
            <Icon icon="heroicons:document-check" className="h-4 w-4 mr-2" />
            Pending Validations
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={fetchUsers}>
          <Icon icon="heroicons:users" className="h-4 w-4 mr-2" />
          All Users
        </Button>
      </div>

      {/* Enhanced Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 space-y-2 sm:space-y-0 sm:flex sm:items-center sm:space-x-2">
          <Input
            placeholder="Search users..."
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
              <SelectItem value="ADMIN">Admin</SelectItem>
              <SelectItem value="MANAGER">Manager</SelectItem>
              <SelectItem value="SELLER">Seller</SelectItem>
              <SelectItem value="CUSTOMER">Customer</SelectItem>
              <SelectItem value="LIVREUR">Livreur</SelectItem>
              <SelectItem value="SUPPORT">Support</SelectItem>
              <SelectItem value="BUYER">Buyer</SelectItem>
              <SelectItem value="VENDOR">Vendor</SelectItem>
              <SelectItem value="WAREHOUSE">Warehouse</SelectItem>
              <SelectItem value="DISPATCHER">Dispatcher</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.accountStatus || "all"}
            onValueChange={(value) =>
              handleFilterChange("accountStatus", value === "all" ? "" : value)
            }
          >
            <SelectTrigger className="sm:w-[160px]">
              <SelectValue placeholder="Account Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
              <SelectItem value="PENDING_VALIDATION">
                Pending Validation
              </SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
              <SelectItem value="SUSPENDED">Suspended</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.validationStatus || "all"}
            onValueChange={(value) =>
              handleFilterChange(
                "validationStatus",
                value === "all" ? "" : value
              )
            }
          >
            <SelectTrigger className="sm:w-[140px]">
              <SelectValue placeholder="Validation" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Validation</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="VALIDATED">Validated</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
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
                  No users found.
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
          {pagination.total} users
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
        onOpenChange={(open) => setDeleteDialog({ open, user: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              user
              <strong> {deleteDialog.user?.name}</strong> and remove all
              associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteDialog.user && handleDeleteUser(deleteDialog.user)
              }
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Action Dialog */}
      <ActionDialog
        open={actionDialog.open}
        onOpenChange={(open) =>
          setActionDialog({ open, type: null, user: null, message: "" })
        }
        title={`${
          actionDialog.type === "approve"
            ? "Approve Registration"
            : actionDialog.type === "reject"
            ? "Reject Registration"
            : actionDialog.type === "validate"
            ? "Validate Profile"
            : actionDialog.type === "rejectProfile"
            ? "Reject Profile"
            : actionDialog.type === "suspend"
            ? "Suspend User"
            : actionDialog.type === "reactivate"
            ? "Reactivate User"
            : ""
        }`}
        description={`Are you sure you want to ${actionDialog.type} ${actionDialog.user?.name}?`}
        onConfirm={executeAction}
        loading={actionLoading}
        showMessage={[
          "approve",
          "reject",
          "validate",
          "rejectProfile",
        ].includes(actionDialog.type || "")}
        message={actionDialog.message}
        onMessageChange={(message) =>
          setActionDialog((prev) => ({ ...prev, message }))
        }
      />
    </div>
  );
};

export default UsersTable;
