"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth.store";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { format } from "date-fns";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Icon } from "@/components/ui/icon";
import SiteBreadcrumb from "@/components/site-breadcrumb";
import { Link } from "@/i18n/routing";
import Image from "next/image";
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

  // Redirect to profile completion if needed
  useEffect(() => {
    if (!authLoading && !isLoading && needsProfileCompletion()) {
      router.replace("/profile/complete");
    }
  }, [authLoading, isLoading, needsProfileCompletion, router]);

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
        label: "City",
        value: profileData.city || profile.address?.city || "Not provided",
      },
      {
        icon: MapPin,
        label: "Full Address",
        value: profile.address || "Not provided",
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
          <Alert variant="destructive">
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
                    <Badge variant="outline" className="capitalize">
                      {(profileData.userType || "user")
                        .toLowerCase()
                        .replace("_", " ")}
                    </Badge>
                    <Badge variant={statusInfo.variant}>{accountStatus}</Badge>
                    {validationStatus && (
                      <Badge variant="outline">{validationStatus}</Badge>
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
                  <Button variant="outline" size="sm">
                    <Key className="h-4 w-4 mr-2" />
                    Change Password
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Alert */}
          <Alert variant={statusInfo.variant}>
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
                              <Badge variant="outline" className="text-xs">
                                {profileData.profile.cinDocuments.length} files
                              </Badge>
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
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
                            <Badge variant="secondary" className="text-xs">
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
                            <Badge variant="secondary" className="text-xs">
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
                      <Badge variant="outline">{accessLevel}</Badge>
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
                    <Alert variant="destructive">
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
