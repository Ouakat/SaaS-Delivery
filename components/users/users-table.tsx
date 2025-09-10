// app/[locale]/(protected)/users/components/users-table.tsx
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Link } from "@/i18n/routing";
import { usersApiClient } from "@/lib/api/clients/users.client";
import { useAuthStore } from "@/lib/stores/auth.store";
import { toast } from "sonner";
import { format } from "date-fns";
import * as XLSX from "xlsx";

// Types
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
  profile?: {
    phone?: string;
    address?: {
      city?: string;
      state?: string;
      country?: string;
    };
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

// Table columns definition
const createColumns = (
  onDelete: (user: User) => void,
  hasUpdatePermission: boolean,
  hasDeletePermission: boolean
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
            <AvatarImage src={user.avatar || ""} alt={user.name} />
            <AvatarFallback>
              {user.name?.split(" ").map(n => n[0]).join("").toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{user.name}</div>
            <div className="text-sm text-default-500">{user.email}</div>
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
        ADMIN: "destructive",
        MANAGER: "warning",
        SELLER: "info",
        CUSTOMER: "success",
        LIVREUR: "secondary",
      };
      return (
        <Badge color={colorMap[userType] || "default"} className="capitalize">
          {userType.toLowerCase().replace("_", " ")}
        </Badge>
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
            <div className="text-sm text-default-500">{role.description}</div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "profile.phone",
    header: "Phone",
    cell: ({ row }) => {
      const phone = row.original.profile?.phone;
      return <span>{phone || "N/A"}</span>;
    },
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => {
      const isActive = row.getValue("isActive") as boolean;
      return (
        <Badge color={isActive ? "success" : "destructive"}>
          {isActive ? "Active" : "Inactive"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "lastLogin",
    header: "Last Login",
    cell: ({ row }) => {
      const lastLogin = row.getValue("lastLogin") as string;
      return (
        <span>
          {lastLogin ? format(new Date(lastLogin), "MMM dd, yyyy HH:mm") : "Never"}
        </span>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => {
      const createdAt = row.getValue("createdAt") as string;
      return <span>{format(new Date(createdAt), "MMM dd, yyyy")}</span>;
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
                  <Icon icon="heroicons:pencil-square" className="mr-2 h-4 w-4" />
                  Edit User
                </Link>
              </DropdownMenuItem>
            )}
            {hasDeletePermission && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
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

// Main Users Table Component
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
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  
  // Filters state
  const [filters, setFilters] = React.useState({
    search: "",
    userType: "",
    isActive: "",
    roleId: "",
  });
  
  // Delete dialog state
  const [deleteDialog, setDeleteDialog] = React.useState<{
    open: boolean;
    user: User | null;
  }>({ open: false, user: null });

  // Permissions
  const hasUpdatePermission = hasPermission("users:update");
  const hasDeletePermission = hasPermission("users:delete");

  // Fetch users data
  const fetchUsers = React.useCallback(async () => {
    try {
      setLoading(true);
      
      // Build filters object for your API client
      const apiFilters: any = {
        page: pagination.page,
        limit: pagination.limit,
      };

      // Add filters
      if (filters.search) {
        // Assuming your API supports a general search parameter
        apiFilters.search = filters.search;
        // Or if it needs specific fields, you can add:
        // apiFilters.name = filters.search;
        // apiFilters.email = filters.search;
      }
      if (filters.userType) {
        apiFilters.userType = filters.userType;
      }
      if (filters.isActive !== "") {
        apiFilters.isActive = filters.isActive === "true";
      }
      if (filters.roleId) {
        apiFilters.roleId = filters.roleId;
      }

      // Use your existing API client
      const result = await usersApiClient.getUsers(apiFilters);
      console.log("🚀 ~ UsersTable ~ result:", result.data[0])
      
      if (result.data[0].data) {
        console.log("🚀 ~ UsersTable ~ result.data.data:", result.data.data)
        setUsers(result.data[0].data);
        setPagination(prev => ({
          ...prev,
          total:  result.data[0].meta.total,
          totalPages:  result.data[0].meta.totalPages,
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

  // Fetch users on mount and filter changes
  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle search with debouncing
  const searchTimerRef = React.useRef<NodeJS.Timeout>();
  
  const debouncedSearch = React.useCallback((value: string) => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }
    searchTimerRef.current = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: value }));
      setPagination(prev => ({ ...prev, page: 1 }));
    }, 500);
  }, []);

  // Handle filter changes
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handlePageSizeChange = (newSize: number) => {
    setPagination(prev => ({ ...prev, limit: newSize, page: 1 }));
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

  // Handle bulk actions
  const handleBulkDelete = async () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const selectedUsers = selectedRows.map(row => row.original);
    
    if (selectedUsers.length === 0) {
      toast.error("Please select users to delete");
      return;
    }

    try {
      const deletePromises = selectedUsers.map(user => 
        usersApiClient.deleteUser(user.id)
      );
      
      const results = await Promise.allSettled(deletePromises);
      const successful = results.filter(result => result.status === "fulfilled").length;
      
      if (successful > 0) {
        toast.success(`${successful} user(s) deleted successfully`);
        fetchUsers();
        setRowSelection({});
      }
    } catch (error) {
      toast.error("Failed to delete selected users");
    }
  };

  // Export to Excel
  const handleExportExcel = () => {
    try {
      const exportData = users.map(user => ({
        Name: user.name,
        Email: user.email,
        "User Type": user.userType,
        Role: user.role.name,
        Phone: user.profile?.phone || "N/A",
        Status: user.isActive ? "Active" : "Inactive",
        "Last Login": user.lastLogin ? format(new Date(user.lastLogin), "yyyy-MM-dd HH:mm:ss") : "Never",
        "Created At": format(new Date(user.createdAt), "yyyy-MM-dd HH:mm:ss"),
        Location: user.profile?.address ? 
          `${user.profile.address.city || ""}, ${user.profile.address.state || ""}, ${user.profile.address.country || ""}`.replace(/^,\s*|,\s*$/g, '') : 
          "N/A",
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Users");
      
      // Auto-size columns
      const maxWidth = exportData.reduce((w, r) => Math.max(w, Object.keys(r).length), 10);
      worksheet["!cols"] = Array(maxWidth).fill({ width: 20 });
      
      XLSX.writeFile(workbook, `users-export-${format(new Date(), "yyyy-MM-dd")}.xlsx`);
      toast.success("Users data exported successfully");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export users data");
    }
  };

  // Table configuration
  const columns = React.useMemo(
    () => createColumns(
      (user) => setDeleteDialog({ open: true, user }),
      hasUpdatePermission,
      hasDeletePermission
    ),
    [hasUpdatePermission, hasDeletePermission]
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
      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 space-y-2 sm:space-y-0 sm:flex sm:items-center sm:space-x-2">
          <Input
            placeholder="Search users..."
            className="sm:max-w-sm"
            onChange={(e) => debouncedSearch(e.target.value)}
          />
          
          <Select value={filters.userType || "all"} onValueChange={(value) => handleFilterChange("userType", value === "all" ? "" : value)}>
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
            </SelectContent>
          </Select>

          <Select value={filters.isActive || "all"} onValueChange={(value) => handleFilterChange("isActive", value === "all" ? "" : value)}>
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
          {selectedRowsCount > 0 && hasDeletePermission && (
            <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
              <Icon icon="heroicons:trash" className="h-4 w-4 mr-2" />
              Delete ({selectedRowsCount})
            </Button>
          )}
          
          <Button variant="outline" size="sm" onClick={handleExportExcel}>
            <Icon icon="heroicons:document-arrow-down" className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
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
                      <div className="h-4 bg-default-200 rounded animate-pulse" />
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
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm text-default-600">
          Showing {((pagination.page - 1) * pagination.limit) + 1} to{" "}
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
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, user: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user
              <strong> {deleteDialog.user?.name}</strong> and remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteDialog.user && handleDeleteUser(deleteDialog.user)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UsersTable;