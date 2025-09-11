"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { Link } from "@/i18n/routing";
import { usersApiClient } from "@/lib/api/clients/users.client";
import { useAuthStore } from "@/lib/stores/auth.store";
import { toast } from "sonner";
import { cn } from "@/lib/utils/ui.utils";

// Form schema for updating user
const updateUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  userType: z.enum([
    "ADMIN",
    "MANAGER",
    "SUPPORT",
    "SELLER",
    "LIVREUR",
    "CUSTOMER",
    "BUYER",
    "VENDOR",
    "WAREHOUSE",
    "DISPATCHER",
  ]),
  phone: z.string().optional(),
  city: z.string().optional(),
  roleId: z.string().optional(),
  profile: z
    .object({
      department: z.string().optional(),
      notes: z.string().optional(),
      address: z.string().optional(),
      cin: z.string().optional(),
    })
    .optional(),
  accountStatus: z
    .enum([
      "PENDING",
      "INACTIVE",
      "PENDING_VALIDATION",
      "ACTIVE",
      "REJECTED",
      "SUSPENDED",
    ])
    .optional(),
  validationStatus: z.enum(["PENDING", "VALIDATED", "REJECTED"]).optional(),
  isActive: z.boolean().default(true),
});

type UpdateUserFormData = z.infer<typeof updateUserSchema>;

// User type configurations
const userTypeConfig = {
  ADMIN: {
    label: "Admin",
    color: "destructive" as const,
    icon: "heroicons:shield-check",
  },
  MANAGER: {
    label: "Manager",
    color: "warning" as const,
    icon: "heroicons:user-group",
  },
  SUPPORT: {
    label: "Support",
    color: "info" as const,
    icon: "heroicons:chat-bubble-left-right",
  },
  SELLER: {
    label: "Seller",
    color: "success" as const,
    icon: "heroicons:currency-dollar",
  },
  LIVREUR: {
    label: "Delivery",
    color: "secondary" as const,
    icon: "heroicons:truck",
  },
  CUSTOMER: {
    label: "Customer",
    color: "primary" as const,
    icon: "heroicons:user",
  },
  BUYER: {
    label: "Buyer",
    color: "success" as const,
    icon: "heroicons:shopping-cart",
  },
  VENDOR: {
    label: "Vendor",
    color: "warning" as const,
    icon: "heroicons:building-storefront",
  },
  WAREHOUSE: {
    label: "Warehouse",
    color: "secondary" as const,
    icon: "heroicons:building-office-2",
  },
  DISPATCHER: {
    label: "Dispatcher",
    color: "info" as const,
    icon: "heroicons:map",
  },
};

// Status configurations
const accountStatusConfig = {
  PENDING: {
    label: "Pending Approval",
    color: "warning" as const,
    icon: "heroicons:clock",
  },
  INACTIVE: {
    label: "Inactive",
    color: "secondary" as const,
    icon: "heroicons:pause",
  },
  PENDING_VALIDATION: {
    label: "Pending Validation",
    color: "info" as const,
    icon: "heroicons:document-check",
  },
  ACTIVE: {
    label: "Active",
    color: "success" as const,
    icon: "heroicons:check-circle",
  },
  REJECTED: {
    label: "Rejected",
    color: "destructive" as const,
    icon: "heroicons:x-circle",
  },
  SUSPENDED: {
    label: "Suspended",
    color: "destructive" as const,
    icon: "heroicons:no-symbol",
  },
};

const validationStatusConfig = {
  PENDING: {
    label: "Pending",
    color: "warning" as const,
    icon: "heroicons:clock",
  },
  VALIDATED: {
    label: "Validated",
    color: "success" as const,
    icon: "heroicons:shield-check",
  },
  REJECTED: {
    label: "Rejected",
    color: "destructive" as const,
    icon: "heroicons:shield-exclamation",
  },
};

const UpdateUserPage = () => {
  const router = useRouter();
  const params = useParams();
  const userId = params?.id as string;
  const { hasPermission, user: currentUser } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [roles, setRoles] = useState<
    Array<{
      id: string;
      name: string;
      description?: string;
      userTypes: string[];
    }>
  >([]);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Check permissions
  const canUpdateUsers = hasPermission("users:update");
  const canUpdateSelf = currentUser?.id === userId;
  const canUpdate = canUpdateUsers || canUpdateSelf;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
    reset,
  } = useForm<UpdateUserFormData>({
    resolver: zodResolver(updateUserSchema),
  });

  const watchedUserType = watch("userType");

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      if (!userId) return;

      try {
        setFetchLoading(true);
        const result = await usersApiClient.getUserById(userId);

        if (result.success) {
          const userData = result.data;
          setUser(userData);

          // Populate form with user data
          reset({
            name: userData.name || "",
            email: userData.email || "",
            userType: userData.userType,
            phone: userData.phone || "",
            city: userData.city || "",
            roleId: userData.role?.id || "",
            accountStatus: userData.accountStatus,
            validationStatus: userData.validationStatus,
            isActive: userData.isActive,
            profile: {
              department: userData.profile?.department || "",
              notes: userData.profile?.notes || "",
              address: userData.profile?.address || "",
              cin: userData.profile?.cin || "",
            },
          });
        } else {
          toast.error("Failed to fetch user data");
          router.push("/users");
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        toast.error("An error occurred while fetching user data");
        router.push("/users");
      } finally {
        setFetchLoading(false);
      }
    };

    fetchUser();
  }, [userId, reset, router]);

  // Fetch available roles
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        // Mock data - replace with actual API call
        setRoles([
          {
            id: "1",
            name: "System Admin",
            description: "Full system access",
            userTypes: ["ADMIN"],
          },
          {
            id: "2",
            name: "Operations Manager",
            description: "Operations oversight",
            userTypes: ["MANAGER"],
          },
          {
            id: "3",
            name: "Sales Representative",
            description: "Sales operations",
            userTypes: ["SELLER"],
          },
          {
            id: "4",
            name: "Support Agent",
            description: "Customer support",
            userTypes: ["SUPPORT"],
          },
          {
            id: "5",
            name: "Delivery Driver",
            description: "Package delivery",
            userTypes: ["LIVREUR"],
          },
          {
            id: "6",
            name: "Standard Customer",
            description: "Customer access",
            userTypes: ["CUSTOMER"],
          },
          {
            id: "7",
            name: "Procurement Officer",
            description: "Purchasing operations",
            userTypes: ["BUYER"],
          },
          {
            id: "8",
            name: "Vendor Account",
            description: "Vendor portal access",
            userTypes: ["VENDOR"],
          },
          {
            id: "9",
            name: "Warehouse Staff",
            description: "Inventory management",
            userTypes: ["WAREHOUSE"],
          },
          {
            id: "10",
            name: "Logistics Coordinator",
            description: "Dispatch operations",
            userTypes: ["DISPATCHER"],
          },
        ]);
      } catch (error) {
        console.error("Failed to fetch roles:", error);
      }
    };

    fetchRoles();
  }, []);

  // Filter roles based on selected user type
  const availableRoles = roles.filter((role) =>
    watchedUserType ? role.userTypes.includes(watchedUserType) : true
  );

  const onSubmit = async (data: UpdateUserFormData) => {
    if (!canUpdate) {
      toast.error("You don't have permission to update this user");
      return;
    }

    setLoading(true);
    try {
      const result = await usersApiClient.updateUser(userId, data);

      if (result.success) {
        toast.success("User updated successfully");
        setUser(result.data);
        // Update form with new data to reset dirty state
        reset(data);
      } else {
        toast.error(result.error?.message || "Failed to update user");
      }
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      toast.error("Please fill in all password fields");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords don't match");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setPasswordLoading(true);
    try {
      const result = await usersApiClient.changeUserPassword(userId, {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      if (result.success) {
        toast.success("Password changed successfully");
        setShowPasswordDialog(false);
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        toast.error(result.error?.message || "Failed to change password");
      }
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleFormSubmit = () => {
    handleSubmit(onSubmit)();
  };

  if (fetchLoading) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center justify-center space-x-2">
              <Icon
                icon="heroicons:arrow-path"
                className="w-5 h-5 animate-spin"
              />
              <span>Loading user data...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!canUpdate) {
    return (
      <div className="container mx-auto py-8">
        <Alert color="destructive">
          <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to update this user.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <Alert color="destructive">
          <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
          <AlertDescription>
            User not found or has been deleted.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar size="lg">
            <AvatarImage
              src={user.profile?.profilePhoto || user.avatar}
              alt={user.name}
            />
            <AvatarFallback>
              {user.name
                ?.split(" ")
                .map((n: string) => n[0])
                .join("")
                .toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold text-default-900">Edit User</h1>
            <p className="text-default-600">
              {user.name} • {user.email}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <Badge
                color={
                  userTypeConfig[user.userType as keyof typeof userTypeConfig]
                    ?.color
                }
              >
                {
                  userTypeConfig[user.userType as keyof typeof userTypeConfig]
                    ?.label
                }
              </Badge>
              <Badge
                color={
                  accountStatusConfig[
                    user.accountStatus as keyof typeof accountStatusConfig
                  ]?.color
                }
              >
                {
                  accountStatusConfig[
                    user.accountStatus as keyof typeof accountStatusConfig
                  ]?.label
                }
              </Badge>
              {user.validationStatus === "VALIDATED" && (
                <Badge color="success">
                  <Icon
                    icon="heroicons:shield-check"
                    className="w-3 h-3 mr-1"
                  />
                  Validated
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/users/${userId}`}>
            <Button variant="outline">
              <Icon icon="heroicons:eye" className="w-4 h-4 mr-2" />
              View Profile
            </Button>
          </Link>
          <Link href="/users">
            <Button variant="outline">
              <Icon icon="heroicons:arrow-left" className="w-4 h-4 mr-2" />
              Back to Users
            </Button>
          </Link>
        </div>
      </div>

      {/* Unsaved Changes Warning */}
      {isDirty && (
        <Alert color="warning" variant="soft">
          <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
          <AlertDescription>
            You have unsaved changes. Don't forget to save your updates.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Information */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon icon="heroicons:user" className="w-5 h-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Name */}
                <div className="space-y-2">
                  <Label
                    htmlFor="name"
                    className={cn("", { "text-destructive": errors.name })}
                  >
                    Full Name *
                  </Label>
                  <Input
                    id="name"
                    {...register("name")}
                    placeholder="Enter full name"
                    className={cn("", {
                      "border-destructive focus:border-destructive":
                        errors.name,
                    })}
                  />
                  {errors.name && (
                    <p className="text-xs text-destructive">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className={cn("", { "text-destructive": errors.email })}
                  >
                    Email Address *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    {...register("email")}
                    placeholder="user@example.com"
                    className={cn("", {
                      "border-destructive focus:border-destructive":
                        errors.email,
                    })}
                  />
                  {errors.email && (
                    <p className="text-xs text-destructive">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Phone and City */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      {...register("phone")}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      {...register("city")}
                      placeholder="Enter city"
                    />
                  </div>
                </div>

                {/* Address and CIN */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      {...register("profile.address")}
                      placeholder="Full address"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cin">CIN</Label>
                    <Input
                      id="cin"
                      {...register("profile.cin")}
                      placeholder="National ID"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* User Type and Role */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon icon="heroicons:identification" className="w-5 h-5" />
                  User Type & Role
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* User Type */}
                <div className="space-y-2">
                  <Label>User Type *</Label>
                  <Select
                    value={watchedUserType}
                    onValueChange={(value) =>
                      setValue("userType", value as any, { shouldDirty: true })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select user type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(userTypeConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-3">
                            <Icon icon={config.icon} className="w-4 h-4" />
                            <div className="font-medium">{config.label}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Role Selection */}
                {watchedUserType && (
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select
                      onValueChange={(value) =>
                        setValue("roleId", value, { shouldDirty: true })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableRoles.map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            <div>
                              <div className="font-medium">{role.name}</div>
                              {role.description && (
                                <div className="text-xs text-muted-foreground">
                                  {role.description}
                                </div>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Admin Only: Status Management */}
            {canUpdateUsers && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon icon="heroicons:cog-6-tooth" className="w-5 h-5" />
                    Status Management
                    <Badge color="warning" className="ml-2">
                      Admin Only
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Account Status</Label>
                      <Select
                        onValueChange={(value) =>
                          setValue("accountStatus", value as any, {
                            shouldDirty: true,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select account status" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(accountStatusConfig).map(
                            ([key, config]) => (
                              <SelectItem key={key} value={key}>
                                <div className="flex items-center gap-2">
                                  <Icon
                                    icon={config.icon}
                                    className="w-4 h-4"
                                  />
                                  {config.label}
                                </div>
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Validation Status</Label>
                      <Select
                        onValueChange={(value) =>
                          setValue("validationStatus", value as any, {
                            shouldDirty: true,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select validation status" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(validationStatusConfig).map(
                            ([key, config]) => (
                              <SelectItem key={key} value={key}>
                                <div className="flex items-center gap-2">
                                  <Icon
                                    icon={config.icon}
                                    className="w-4 h-4"
                                  />
                                  {config.label}
                                </div>
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Additional Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon icon="heroicons:document-text" className="w-5 h-5" />
                  Additional Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    {...register("profile.department")}
                    placeholder="e.g., Sales, Marketing, IT"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    {...register("profile.notes")}
                    placeholder="Any additional notes about this user..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Settings Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon icon="heroicons:key" className="w-5 h-5" />
                  Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowPasswordDialog(true)}
                >
                  <Icon icon="heroicons:key" className="w-4 h-4 mr-2" />
                  Change Password
                </Button>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Active Account</Label>
                    <p className="text-xs text-muted-foreground">
                      Allow user to access the system
                    </p>
                  </div>
                  <Switch
                    {...register("isActive")}
                    defaultChecked={user.isActive}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Account Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon
                    icon="heroicons:information-circle"
                    className="w-5 h-5"
                  />
                  Account Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm">
                  <span className="text-muted-foreground">Created:</span>
                  <div className="font-medium">
                    {new Date(user.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                  {user.createdBy && (
                    <div className="text-xs text-muted-foreground">
                      by {user.createdBy.name}
                    </div>
                  )}
                </div>

                <div className="text-sm">
                  <span className="text-muted-foreground">Last Updated:</span>
                  <div className="font-medium">
                    {new Date(user.updatedAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                </div>

                {user.validatedAt && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Validated:</span>
                    <div className="font-medium">
                      {new Date(user.validatedAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </div>
                    {user.validatedBy && (
                      <div className="text-xs text-muted-foreground">
                        by {user.validatedBy.name}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-4 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/users/${userId}`)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => reset()}
            disabled={loading || !isDirty}
          >
            Reset Changes
          </Button>
          <Button
            type="button"
            onClick={handleFormSubmit}
            disabled={loading || !isDirty}
          >
            {loading && (
              <Icon
                icon="heroicons:arrow-path"
                className="mr-2 h-4 w-4 animate-spin"
              />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      {/* Password Change Dialog */}
      <AlertDialog
        open={showPasswordDialog}
        onOpenChange={setShowPasswordDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Password</AlertDialogTitle>
            <AlertDialogDescription>
              Enter the current password and a new password for {user.name}.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Current Password</Label>
              <Input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm((prev) => ({
                    ...prev,
                    currentPassword: e.target.value,
                  }))
                }
                placeholder="Enter current password"
              />
            </div>
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm((prev) => ({
                    ...prev,
                    newPassword: e.target.value,
                  }))
                }
                placeholder="Enter new password"
              />
            </div>
            <div className="space-y-2">
              <Label>Confirm New Password</Label>
              <Input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm((prev) => ({
                    ...prev,
                    confirmPassword: e.target.value,
                  }))
                }
                placeholder="Confirm new password"
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePasswordChange}
              disabled={passwordLoading}
            >
              {passwordLoading && (
                <Icon
                  icon="heroicons:arrow-path"
                  className="mr-2 h-4 w-4 animate-spin"
                />
              )}
              Change Password
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UpdateUserPage;
