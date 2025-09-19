"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth/auth.store";
import { ProtectedRoute } from "@/components/route/protected-route";
import { format } from "date-fns";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import SiteBreadcrumb from "@/components/site-breadcrumb";
import { Link } from "@/i18n/routing";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { color } from "../../../../lib/types/ui/template";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  Calendar,
  Shield,
  CheckCircle,
  Clock,
  AlertTriangle,
  Edit,
  Key,
  FileText,
  Users,
  Settings,
} from "lucide-react";

// Validation schemas
const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

const ProfilePage = () => {
  const router = useRouter();
  const {
    user,
    getUserProfile,
    accountStatus,
    validationStatus,
    accessLevel,
    hasBlueCheckmark,
    needsProfileCompletion,
    needsValidation,
    canAccessFullFeatures,
    requirements,
    isLoading: authLoading,
  } = useAuthStore();

  const [profileData, setProfileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isSendingResetEmail, setIsSendingResetEmail] = useState(false);

  // Change Password Form
  const changePasswordForm = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Forgot Password Form
  const forgotPasswordForm = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: user?.email || "",
    },
  });

  // Load profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) return;

      setIsLoading(true);
      try {
        const profile = await getUserProfile();
        setProfileData(profile);
      } catch (error) {
        console.error("Failed to load profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [user?.id, getUserProfile]);

  // Set email in forgot password form when user data is available
  useEffect(() => {
    if (user?.email) {
      forgotPasswordForm.setValue("email", user.email);
    }
  }, [user?.email, forgotPasswordForm]);

  // Redirect to profile completion if needed
  useEffect(() => {
    if (!authLoading && !isLoading && needsProfileCompletion()) {
      router.replace("/profile/complete");
    }
  }, [authLoading, isLoading, needsProfileCompletion, router]);

  // Change Password Handler
  const handleChangePassword = async (data: any) => {
    setIsChangingPassword(true);
    try {
      // Replace with your actual API call
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to change password");
      }

      toast.success("Password changed successfully!");
      changePasswordForm.reset();
      setChangePasswordOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to change password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Forgot Password Handler
  const handleForgotPassword = async (data: any) => {
    setIsSendingResetEmail(true);
    try {
      // Replace with your actual API call
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.email,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to send reset email");
      }

      toast.success("Password reset email sent! Please check your inbox.");
      setForgotPasswordOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to send reset email");
    } finally {
      setIsSendingResetEmail(false);
    }
  };

  // Profile status information
  const statusInfo = useMemo(() => {
    switch (accountStatus) {
      case "PENDING":
        return {
          icon: Clock,
          color: "text-blue-600",
          bgColor: "bg-blue-100",
          title: "Pending Approval",
          message: "Your account is waiting for admin approval.",
          variant: "default" as const,
        };
      case "INACTIVE":
        return {
          icon: AlertTriangle,
          color: "text-orange-600",
          bgColor: "bg-orange-100",
          title: "Profile Incomplete",
          message: "Please complete your profile to activate your account.",
          variant: "warning" as const,
        };
      case "PENDING_VALIDATION":
        return {
          icon: Clock,
          color: "text-yellow-600",
          bgColor: "bg-yellow-100",
          title: "Pending Validation",
          message: "Your profile is under review by our team.",
          variant: "default" as const,
        };
      case "ACTIVE":
        if (validationStatus === "VALIDATED") {
          return {
            icon: CheckCircle,
            color: "text-green-600",
            bgColor: "bg-green-100",
            title: "Verified Profile",
            message: "Your profile has been verified and approved.",
            variant: "default" as const,
          };
        } else {
          return {
            icon: Shield,
            color: "text-blue-600",
            bgColor: "bg-blue-100",
            title: "Active Account",
            message: "Your account is active with basic features.",
            variant: "default" as const,
          };
        }
      case "REJECTED":
        return {
          icon: AlertTriangle,
          color: "text-red-600",
          bgColor: "bg-red-100",
          title: "Profile Rejected",
          message: "Your profile was rejected. Please contact support.",
          variant: "destructive" as const,
        };
      case "SUSPENDED":
        return {
          icon: AlertTriangle,
          color: "text-red-600",
          bgColor: "bg-red-100",
          title: "Account Suspended",
          message: "Your account has been suspended. Contact support.",
          variant: "destructive" as const,
        };
      default:
        return {
          icon: User,
          color: "text-gray-600",
          bgColor: "bg-gray-100",
          title: "Profile",
          message: "",
          variant: "default" as const,
        };
    }
  }, [accountStatus, validationStatus]);

  // Profile information for display
  const profileInfo = useMemo(() => {
    if (!profileData) return [];

    const profile = profileData.profile || {};
    const createdAt = profileData.createdAt
      ? new Date(profileData.createdAt)
      : null;
    const lastLogin = profileData.lastLogin
      ? new Date(profileData.lastLogin)
      : null;

    return [
      {
        icon: Mail,
        label: "Email",
        value: profileData.email || "Not provided",
        href: profileData.email ? `mailto:${profileData.email}` : undefined,
      },
      {
        icon: Phone,
        label: "Phone",
        value: profileData.phone || profile.phone || "Not provided",
        href:
          profileData.phone || profile.phone
            ? `tel:${profileData.phone || profile.phone}`
            : undefined,
      },
      {
        icon: MapPin,
        label: "Full Address",
        value: profile.address
          ? [
              profile.address.street,
              profile.address.city,
              profile.address.state,
              profile.address.zipCode,
              profile.address.country,
            ]
              .filter(Boolean)
              .join(", ") || "Not provided"
          : "Not provided",
      },
      {
        icon: FileText,
        label: "National ID (CIN)",
        value: profile.cin || "Not provided",
      },
      {
        icon: Building,
        label: "Organization",
        value: profileData.tenant?.name || "Not provided",
      },
      {
        icon: Users,
        label: "Role",
        value: profileData.role?.name || "No role assigned",
      },
      {
        icon: Calendar,
        label: "Joined",
        value: createdAt ? format(createdAt, "MMMM dd, yyyy") : "Unknown",
      },
      {
        icon: Calendar,
        label: "Last Login",
        value: lastLogin ? format(lastLogin, "PPpp") : "Never",
      },
    ];
  }, [profileData]);

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div>
        <SiteBreadcrumb />
        <div className="space-y-6">
          <Alert color="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Failed to load profile data. Please try refreshing the page.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute
      requiredAccessLevel="LIMITED"
      allowedAccountStatuses={["PENDING_VALIDATION", "ACTIVE"]}
      requiredPermissions={["users:read"]}
    >
      <div>
        <SiteBreadcrumb />

        <div className="space-y-6">
          {/* Profile Header */}
          <Card className="relative overflow-hidden">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/5" />

            <CardContent className="relative p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                {/* Avatar */}
                <div className="relative">
                  <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                    <AvatarImage
                      src={
                        profileData.avatar || profileData.profile?.profilePhoto
                      }
                      alt={profileData.name || "Profile"}
                    />
                    <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                      {profileData.name?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  {hasBlueCheckmark && (
                    <div className="absolute -bottom-1 -right-1 bg-blue-600 rounded-full p-1">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>

                {/* User Info */}
                <div className="flex-1 space-y-2">
                  <div>
                    <h1 className="text-2xl font-bold text-default-900 flex items-center gap-2">
                      {profileData.name || "Unknown User"}
                      {hasBlueCheckmark && (
                        <Badge className="bg-blue-100 text-blue-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </h1>
                    <p className="text-default-600">
                      {profileData.role?.name || "No role assigned"}
                      {profileData.tenant?.name &&
                        ` • ${profileData.tenant.name}`}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge color="primary" className="capitalize">
                      {(profileData.userType || "user")
                        .toLowerCase()
                        .replace("_", " ")}
                    </Badge>
                    <Badge color={statusInfo.variant}>{accountStatus}</Badge>
                    {validationStatus && (
                      <Badge color="primary">{validationStatus}</Badge>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2">
                  <Link href="/profile/edit">
                    <Button className="w-full">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  </Link>

                  {/* Change Password Dialog */}
                  <Dialog
                    open={changePasswordOpen}
                    onOpenChange={setChangePasswordOpen}
                  >
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Key className="h-4 w-4 mr-2" />
                        Change Password
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Change Password</DialogTitle>
                        <DialogDescription>
                          Enter your current password and choose a new one.
                        </DialogDescription>
                      </DialogHeader>

                      <form
                        onSubmit={changePasswordForm.handleSubmit(
                          handleChangePassword
                        )}
                        className="space-y-4"
                      >
                        <div className="space-y-2">
                          <Label htmlFor="currentPassword">
                            Current Password
                          </Label>
                          <Input
                            id="currentPassword"
                            type="password"
                            {...changePasswordForm.register("currentPassword")}
                            className={
                              changePasswordForm.formState.errors
                                .currentPassword
                                ? "border-red-500"
                                : ""
                            }
                          />
                          {changePasswordForm.formState.errors
                            .currentPassword && (
                            <p className="text-sm text-red-500">
                              {
                                changePasswordForm.formState.errors
                                  .currentPassword.message
                              }
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="newPassword">New Password</Label>
                          <Input
                            id="newPassword"
                            type="password"
                            {...changePasswordForm.register("newPassword")}
                            className={
                              changePasswordForm.formState.errors.newPassword
                                ? "border-red-500"
                                : ""
                            }
                          />
                          {changePasswordForm.formState.errors.newPassword && (
                            <p className="text-sm text-red-500">
                              {
                                changePasswordForm.formState.errors.newPassword
                                  .message
                              }
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword">
                            Confirm New Password
                          </Label>
                          <Input
                            id="confirmPassword"
                            type="password"
                            {...changePasswordForm.register("confirmPassword")}
                            className={
                              changePasswordForm.formState.errors
                                .confirmPassword
                                ? "border-red-500"
                                : ""
                            }
                          />
                          {changePasswordForm.formState.errors
                            .confirmPassword && (
                            <p className="text-sm text-red-500">
                              {
                                changePasswordForm.formState.errors
                                  .confirmPassword.message
                              }
                            </p>
                          )}
                        </div>

                        <div className="flex justify-between pt-4">
                          <Button
                            type="button"
                            color="primary"
                            className="text-sm text-blue-600 hover:text-blue-800 p-0"
                            onClick={() => {
                              setChangePasswordOpen(false);
                              setForgotPasswordOpen(true);
                            }}
                          >
                            Forgot your current password?
                          </Button>
                        </div>
                      </form>

                      <DialogFooter>
                        <DialogClose asChild>
                          <Button color="primary" disabled={isChangingPassword}>
                            Cancel
                          </Button>
                        </DialogClose>
                        <Button
                          type="submit"
                          onClick={changePasswordForm.handleSubmit(
                            handleChangePassword
                          )}
                          disabled={isChangingPassword}
                        >
                          {isChangingPassword && (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          )}
                          Change Password
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  {/* Forgot Password Dialog */}
                  <Dialog
                    open={forgotPasswordOpen}
                    onOpenChange={setForgotPasswordOpen}
                  >
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Reset Password</DialogTitle>
                        <DialogDescription>
                          Enter your email address and we'll send you a link to
                          reset your password.
                        </DialogDescription>
                      </DialogHeader>

                      <form
                        onSubmit={forgotPasswordForm.handleSubmit(
                          handleForgotPassword
                        )}
                        className="space-y-4"
                      >
                        <div className="space-y-2">
                          <Label htmlFor="email">Email Address</Label>
                          <Input
                            id="email"
                            type="email"
                            {...forgotPasswordForm.register("email")}
                            className={
                              forgotPasswordForm.formState.errors.email
                                ? "border-red-500"
                                : ""
                            }
                          />
                          {forgotPasswordForm.formState.errors.email && (
                            <p className="text-sm text-red-500">
                              {
                                forgotPasswordForm.formState.errors.email
                                  .message
                              }
                            </p>
                          )}
                        </div>
                      </form>

                      <DialogFooter>
                        <DialogClose asChild>
                          <Button
                            variant="outline"
                            disabled={isSendingResetEmail}
                          >
                            Cancel
                          </Button>
                        </DialogClose>
                        <Button
                          type="submit"
                          onClick={forgotPasswordForm.handleSubmit(
                            handleForgotPassword
                          )}
                          disabled={isSendingResetEmail}
                        >
                          {isSendingResetEmail && (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          )}
                          Send Reset Email
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Alert */}
          <Alert color={statusInfo.variant}>
            <statusInfo.icon className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{statusInfo.title}</div>
                  <div className="text-sm mt-1">{statusInfo.message}</div>
                  {requirements.length > 0 && (
                    <ul className="text-xs mt-2 space-y-1">
                      {requirements.map((req, index) => (
                        <li key={index}>• {req}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <Badge
                  className={`${statusInfo.bgColor} ${statusInfo.color} border-0`}
                >
                  Access: {accessLevel}
                </Badge>
              </div>
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Information */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {profileInfo.map((item, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <item.icon className="h-5 w-5 text-default-500 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-medium text-default-500 uppercase tracking-wider mb-1">
                            {item.label}
                          </div>
                          {item.href ? (
                            <a
                              href={item.href}
                              className="text-sm text-default-900 hover:text-primary transition-colors break-words"
                            >
                              {item.value}
                            </a>
                          ) : (
                            <div className="text-sm text-default-900 break-words">
                              {item.value}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Documents Status */}
              {profileData.profile && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Documents & Verification
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* CIN Documents */}
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-default-500" />
                          <div>
                            <div className="font-medium text-sm">
                              CIN Documents
                            </div>
                            <div className="text-xs text-default-500">
                              National ID verification
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {profileData.profile.cinDocuments?.length > 0 ? (
                            <>
                              <Badge color="primary" className="text-xs">
                                {profileData.profile.cinDocuments.length} files
                              </Badge>
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </>
                          ) : (
                            <Badge color="secondary" className="text-xs">
                              Not uploaded
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Bank Details */}
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-default-500" />
                          <div>
                            <div className="font-medium text-sm">
                              Bank Details
                            </div>
                            <div className="text-xs text-default-500">
                              RIB document
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {profileData.profile.bankDetails ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <Badge color="secondary" className="text-xs">
                              Not uploaded
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Profile Photo */}
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <User className="h-5 w-5 text-default-500" />
                          <div>
                            <div className="font-medium text-sm">
                              Profile Photo
                            </div>
                            <div className="text-xs text-default-500">
                              Account avatar
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {profileData.avatar ||
                          profileData.profile.profilePhoto ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <Badge color="secondary" className="text-xs">
                              Using default
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Account Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Account Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div
                    className="text-center p-4 rounded-lg"
                    style={{ backgroundColor: statusInfo.bgColor }}
                  >
                    <statusInfo.icon
                      className={`h-8 w-8 mx-auto mb-2 ${statusInfo.color}`}
                    />
                    <div className="font-medium text-sm text-default-900">
                      {statusInfo.title}
                    </div>
                    {statusInfo.message && (
                      <div className="text-xs text-default-600 mt-1">
                        {statusInfo.message}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Access Level:</span>
                      <Badge color="primary">{accessLevel}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Profile Complete:</span>
                      <Badge
                        color={
                          profileData.profileCompleted ? "success" : "warning"
                        }
                      >
                        {profileData.profileCompleted ? "Yes" : "No"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Validated:</span>
                      <Badge
                        color={
                          validationStatus === "VALIDATED"
                            ? "success"
                            : "secondary"
                        }
                      >
                        {validationStatus === "VALIDATED" ? "Yes" : "No"}
                      </Badge>
                    </div>
                  </div>

                  {/* Action based on status */}
                  {accountStatus === "PENDING_VALIDATION" && (
                    <Alert>
                      <Clock className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        Your profile is being reviewed. This usually takes 1-3
                        business days.
                      </AlertDescription>
                    </Alert>
                  )}

                  {accountStatus === "REJECTED" && (
                    <Alert color="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        Your profile was rejected. Please contact support for
                        assistance.
                        <Button
                          size="sm"
                          className="mt-2 w-full"
                          variant="outline"
                        >
                          Contact Support
                        </Button>
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* Permissions */}
              {profileData.role?.permissions?.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Key className="h-5 w-5" />
                      Permissions ({profileData.role.permissions.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {profileData.role.permissions.map(
                        (permission: string, index: number) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 text-xs"
                          >
                            <CheckCircle className="h-3 w-3 text-green-600 flex-shrink-0" />
                            <span className="break-words">{permission}</span>
                          </div>
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Link href="/profile/edit" className="block">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  </Link>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => setChangePasswordOpen(true)}
                  >
                    <Key className="h-4 w-4 mr-2" />
                    Change Password
                  </Button>

                  {canAccessFullFeatures() && (
                    <Link href="/settings" className="block">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Account Settings
                      </Button>
                    </Link>
                  )}

                  {needsValidation() && (
                    <Link href="/validation-status" className="block">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        Validation Status
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default ProfilePage;
