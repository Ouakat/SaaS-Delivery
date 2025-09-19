"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Link } from "@/i18n/routing";
import { usersApiClient } from "@/lib/api/clients/auth/users.client";
import { useAuthStore } from "@/lib/stores/auth/auth.store";
import { toast } from "sonner";
import { cn } from "@/lib/utils/ui.utils";
import { ProtectedRoute } from "@/components/route/protected-route";
import { USER_PERMISSIONS } from "@/lib/constants/auth";

// Form schema
const createUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  userType: z.enum(
    [
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
    ],
    {
      required_error: "Please select a user type",
    }
  ),
  phone: z.string().optional(),
  city: z.string().optional(),
  roleId: z.string().optional(),
  profile: z
    .object({
      department: z.string().optional(),
      notes: z.string().optional(),
    })
    .optional(),
  isActive: z.boolean().default(true),
});

type CreateUserFormData = z.infer<typeof createUserSchema>;

// User type configurations
const userTypeConfig = {
  ADMIN: {
    label: "Admin",
    description: "Full system access and management",
    color: "destructive" as const,
    icon: "heroicons:shield-check",
    requiredUserTypes: ["ADMIN"], // Only ADMINs can create ADMINs
  },
  MANAGER: {
    label: "Manager",
    description: "Team and operations management",
    color: "warning" as const,
    icon: "heroicons:user-group",
    requiredUserTypes: ["ADMIN", "MANAGER"], // ADMINs and MANAGERs can create MANAGERs
  },
  SUPPORT: {
    label: "Support",
    description: "Customer support and assistance",
    color: "info" as const,
    icon: "heroicons:chat-bubble-left-right",
    requiredUserTypes: ["ADMIN", "MANAGER"],
  },
  SELLER: {
    label: "Seller",
    description: "Sales and client management",
    color: "success" as const,
    icon: "heroicons:currency-dollar",
    requiredUserTypes: ["ADMIN", "MANAGER"],
  },
  LIVREUR: {
    label: "Delivery",
    description: "Package delivery and logistics",
    color: "secondary" as const,
    icon: "heroicons:truck",
    requiredUserTypes: ["ADMIN", "MANAGER"],
  },
  CUSTOMER: {
    label: "Customer",
    description: "External customer account",
    color: "primary" as const,
    icon: "heroicons:user",
    requiredUserTypes: ["ADMIN", "MANAGER", "SUPPORT"],
  },
  BUYER: {
    label: "Buyer",
    description: "Purchasing and procurement",
    color: "success" as const,
    icon: "heroicons:shopping-cart",
    requiredUserTypes: ["ADMIN", "MANAGER"],
  },
  VENDOR: {
    label: "Vendor",
    description: "External vendor/supplier",
    color: "warning" as const,
    icon: "heroicons:building-storefront",
    requiredUserTypes: ["ADMIN", "MANAGER"],
  },
  WAREHOUSE: {
    label: "Warehouse",
    description: "Inventory and warehouse management",
    color: "secondary" as const,
    icon: "heroicons:building-office-2",
    requiredUserTypes: ["ADMIN", "MANAGER"],
  },
  DISPATCHER: {
    label: "Dispatcher",
    description: "Logistics coordination",
    color: "info" as const,
    icon: "heroicons:map",
    requiredUserTypes: ["ADMIN", "MANAGER"],
  },
};

const CreateUserPageContent = () => {
  const router = useRouter();
  const { hasPermission, user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<
    Array<{
      id: string;
      name: string;
      description?: string;
      userTypes: string[];
    }>
  >([]);

  // Check permissions
  const canCreateUsers = hasPermission(USER_PERMISSIONS.CREATE_USER);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      isActive: true,
      profile: {
        department: "",
        notes: "",
      },
    },
  });

  const watchedUserType = watch("userType");

  // Check if current user can create the selected user type
  const canCreateUserType = (targetUserType: string) => {
    if (!user?.userType || !targetUserType) return false;

    const config =
      userTypeConfig[targetUserType as keyof typeof userTypeConfig];
    return config?.requiredUserTypes.includes(user.userType) || false;
  };

  // Filter user types based on current user's permissions
  const availableUserTypes = Object.entries(userTypeConfig).filter(
    ([key, config]) => canCreateUserType(key)
  );

  // Fetch available roles
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        // Mock data for now - replace with actual API call
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
            id: "cmfayo10k0006584key16cnw2",
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

  // Handle user type change
  useEffect(() => {
    if (watchedUserType && availableRoles.length > 0) {
      setValue("roleId", availableRoles[0].id);
    }
  }, [watchedUserType, availableRoles, setValue]);

  const onSubmit = async (data: CreateUserFormData) => {
    if (!canCreateUsers) {
      toast.error("You don't have permission to create users");
      return;
    }

    // Additional check: verify user can create this specific user type
    if (!canCreateUserType(data.userType)) {
      toast.error(`You don't have permission to create ${data.userType} users`);
      return;
    }

    setLoading(true);
    try {
      const result = await usersApiClient.createUser({
        ...data,
        profile: data.profile || {},
      });

      if (result.success) {
        toast.success(
          "User created successfully! Password reset email has been sent."
        );
        router.push("/users");
      } else {
        toast.error(result.error?.message || "Failed to create user");
      }
    } catch (error) {
      console.error("Error creating user:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = () => {
    handleSubmit(onSubmit)();
  };

  if (!canCreateUsers) {
    return (
      <div className="container mx-auto py-8">
        <Alert color="destructive">
          <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to create users. Please contact your
            administrator.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-default-900">
            Create New User
          </h1>
          <p className="text-default-600">
            Add a new user to your system. They will receive an email with login
            instructions.
          </p>
        </div>
        <Link href="/users">
          <Button variant="outline">
            <Icon icon="heroicons:arrow-left" className="w-4 h-4 mr-2" />
            Back to Users
          </Button>
        </Link>
      </div>

      {/* Permissions Alert */}
      {availableUserTypes.length === 0 && (
        <Alert color="warning">
          <Icon icon="heroicons:information-circle" className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to create any user types. Please contact
            your administrator.
          </AlertDescription>
        </Alert>
      )}

      {/* Info Alert */}
      <Alert color="info" variant="soft">
        <Icon icon="heroicons:information-circle" className="h-4 w-4" />
        <AlertDescription>
          The user will be created with INACTIVE status and will receive an
          email with password reset instructions to complete their account
          setup.
        </AlertDescription>
      </Alert>

      {/* Current User Permissions Info */}
      {process.env.NODE_ENV === "development" && (
        <Alert color="secondary" variant="soft">
          <Icon icon="heroicons:code-bracket" className="h-4 w-4" />
          <AlertDescription>
            <strong>Dev Info:</strong> Your user type ({user?.userType}) can
            create:{" "}
            {availableUserTypes
              .map(([key, config]) => config.label)
              .join(", ") || "None"}
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
                  <Label
                    className={cn("", { "text-destructive": errors.userType })}
                  >
                    User Type *
                  </Label>
                  <Select
                    onValueChange={(value) =>
                      setValue("userType", value as any)
                    }
                    disabled={availableUserTypes.length === 0}
                  >
                    <SelectTrigger
                      className={cn("", {
                        "border-destructive": errors.userType,
                      })}
                    >
                      <SelectValue placeholder="Select user type" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableUserTypes.map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-3">
                            <Icon icon={config.icon} className="w-4 h-4" />
                            <div>
                              <div className="font-medium">{config.label}</div>
                              <div className="text-xs text-muted-foreground">
                                {config.description}
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.userType && (
                    <p className="text-xs text-destructive">
                      {errors.userType.message}
                    </p>
                  )}

                  {/* Show selected user type badge */}
                  {watchedUserType && (
                    <div className="mt-2">
                      <Badge
                        color={
                          userTypeConfig[
                            watchedUserType as keyof typeof userTypeConfig
                          ]?.color
                        }
                      >
                        <Icon
                          icon={
                            userTypeConfig[
                              watchedUserType as keyof typeof userTypeConfig
                            ]?.icon
                          }
                          className="w-3 h-3 mr-1"
                        />
                        {
                          userTypeConfig[
                            watchedUserType as keyof typeof userTypeConfig
                          ]?.label
                        }
                      </Badge>
                    </div>
                  )}

                  {/* Show permission warning for selected user type */}
                  {watchedUserType && !canCreateUserType(watchedUserType) && (
                    <Alert color="warning" variant="soft">
                      <Icon
                        icon="heroicons:exclamation-triangle"
                        className="h-4 w-4"
                      />
                      <AlertDescription>
                        You don't have permission to create{" "}
                        {
                          userTypeConfig[
                            watchedUserType as keyof typeof userTypeConfig
                          ]?.label
                        }{" "}
                        users.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* Role Selection */}
                {watchedUserType && canCreateUserType(watchedUserType) && (
                  <div className="space-y-2">
                    <Label>
                      Role
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Icon
                              icon="heroicons:information-circle"
                              className="w-4 h-4 ml-1 text-muted-foreground"
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              Roles define specific permissions for the selected
                              user type
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </Label>
                    <Select
                      onValueChange={(value) => setValue("roleId", value)}
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
                  <Icon icon="heroicons:cog-6-tooth" className="w-5 h-5" />
                  Account Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Active Account</Label>
                    <p className="text-xs text-muted-foreground">
                      Allow user to access the system
                    </p>
                  </div>
                  <Switch {...register("isActive")} defaultChecked={true} />
                </div>
              </CardContent>
            </Card>

            {/* Preview Card */}
            {watchedUserType && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon icon="heroicons:eye" className="w-5 h-5" />
                    Preview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm">
                    <span className="text-muted-foreground">User Type:</span>
                    <div className="mt-1">
                      <Badge
                        color={
                          userTypeConfig[
                            watchedUserType as keyof typeof userTypeConfig
                          ]?.color
                        }
                      >
                        {
                          userTypeConfig[
                            watchedUserType as keyof typeof userTypeConfig
                          ]?.label
                        }
                      </Badge>
                    </div>
                  </div>

                  <div className="text-sm">
                    <span className="text-muted-foreground">
                      Initial Status:
                    </span>
                    <div className="mt-1">
                      <Badge color="secondary">INACTIVE</Badge>
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    User will receive an email with password setup instructions.
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Current User Permissions Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon icon="heroicons:shield-check" className="w-5 h-5" />
                  Your Permissions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm">
                  <span className="text-muted-foreground">Your User Type:</span>
                  <div className="mt-1">
                    <Badge color="primary">{user?.userType}</Badge>
                  </div>
                </div>

                <div className="text-sm">
                  <span className="text-muted-foreground">Can Create:</span>
                  <div className="mt-1 space-y-1">
                    {availableUserTypes.length > 0 ? (
                      availableUserTypes.map(([key, config]) => (
                        <Badge
                          key={key}
                          color={config.color}
                          className="mr-1 mb-1"
                        >
                          {config.label}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        No user types available
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Help Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon
                    icon="heroicons:question-mark-circle"
                    className="w-5 h-5"
                  />
                  Need Help?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Learn more about user creation and management in our
                  documentation.
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  <Icon icon="heroicons:book-open" className="w-4 h-4 mr-2" />
                  View Documentation
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-4 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/users")}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => reset()}
            disabled={loading}
          >
            Reset Form
          </Button>
          <Button
            type="button"
            onClick={handleFormSubmit}
            disabled={
              loading ||
              availableUserTypes.length === 0 ||
              (watchedUserType && !canCreateUserType(watchedUserType))
            }
          >
            {loading && (
              <Icon
                icon="heroicons:arrow-path"
                className="mr-2 h-4 w-4 animate-spin"
              />
            )}
            Create User
          </Button>
        </div>
      </div>
    </div>
  );
};

// Main component wrapped with ProtectedRoute
const CreateUserPage = () => {
  return (
    <ProtectedRoute
      requiredPermissions={[USER_PERMISSIONS.CREATE_USER]}
      requiredAccessLevel="FULL"
      allowedAccountStatuses={["ACTIVE"]}
      requireValidation={true}
    >
      <CreateUserPageContent />
    </ProtectedRoute>
  );
};

export default CreateUserPage;
