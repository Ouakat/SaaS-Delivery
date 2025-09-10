"use client";
import { Icon } from "@/components/ui/icon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import Image from "next/image";
import { Link } from "@/i18n/routing";
import AreaChart from "./area-chart";
import SiteBreadcrumb from "@/components/site-breadcrumb";
import { useAuthStore } from "@/lib/stores/auth.store";
import { authApiClient } from "@/lib/api/clients/auth.client";
import { usersApiClient } from "@/lib/api/clients/users.client";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils/ui.utils";
import { useDropzone } from "react-dropzone";
import { CloudUpload } from "lucide-react";

// Validation schemas
const profileSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  phone: z.string().optional(),
  department: z.string().optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
});

const passwordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, { message: "Current password is required." }),
    newPassword: z
      .string()
      .min(6, { message: "Password must be at least 6 characters." }),
    confirmPassword: z
      .string()
      .min(1, { message: "Confirm password is required." }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

interface FileWithPreview extends File {
  preview: string;
}

const ProfilePage = () => {
  const { user, isAuthenticated, checkAuth, updateUser } = useAuthStore();
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

  // Profile form
  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      department: "",
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
    },
  });

  // Password form
  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Avatar upload dropzone
  const { getRootProps, getInputProps } = useDropzone({
    multiple: false,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif"],
    },
    onDrop: (acceptedFiles) => {
      setFiles(
        acceptedFiles.map((file) =>
          Object.assign(file, {
            preview: URL.createObjectURL(file),
          })
        )
      );
    },
  });

  // Fetch profile data
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!isAuthenticated) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        if (!user) {
          await checkAuth();
        }

        const response = await authApiClient.getProfile();

        if (response.success && response.data) {
          setProfileData(response.data);

          // Populate form with current data
          const userData = response.data;
          profileForm.reset({
            name: userData.name || "",
            email: userData.email || "",
            phone: userData.profile?.phone || "",
            department: userData.profile?.department || "",
            street: userData.profile?.address?.street || "",
            city: userData.profile?.address?.city || "",
            state: userData.profile?.address?.state || "",
            zipCode: userData.profile?.address?.zipCode || "",
            country: userData.profile?.address?.country || "",
          });
        } else {
          setError(response.error?.message || "Failed to load profile data");
        }
      } catch (err) {
        setError("Network error while loading profile");
        console.error("Profile fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, [isAuthenticated, user, checkAuth, profileForm]);

  // Handle profile update
  const onProfileSubmit = async (data: z.infer<typeof profileSchema>) => {
    if (!profileData?.id) return;

    setIsUpdating(true);
    try {
      const updateData = {
        name: data.name,
        email: data.email,
        profile: {
          phone: data.phone,
          department: data.department,
          address: {
            street: data.street,
            city: data.city,
            state: data.state,
            zipCode: data.zipCode,
            country: data.country,
          },
        },
      };

      const response = await usersApiClient.updateUser(
        profileData.id,
        updateData
      );

      if (response.success && response.data) {
        setProfileData(response.data);
        updateUser(response.data);
        setIsEditMode(false);
        toast.success("Profile updated successfully");
      } else {
        toast.error(response.error?.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error("Network error while updating profile");
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle password change
  const onPasswordSubmit = async (data: z.infer<typeof passwordSchema>) => {
    if (!profileData?.id) return;

    setIsChangingPassword(true);
    try {
      const response = await usersApiClient.changeUserPassword(profileData.id, {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });

      if (response.success) {
        toast.success("Password changed successfully");
        passwordForm.reset();
        setPasswordDialogOpen(false);
      } else {
        toast.error(response.error?.message || "Failed to change password");
      }
    } catch (error) {
      console.error("Password change error:", error);
      toast.error("Network error while changing password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Cancel edit mode
  const handleCancelEdit = () => {
    setIsEditMode(false);
    setFiles([]);

    // Reset form to original data
    if (profileData) {
      profileForm.reset({
        name: profileData.name || "",
        email: profileData.email || "",
        phone: profileData.profile?.phone || "",
        department: profileData.profile?.department || "",
        street: profileData.profile?.address?.street || "",
        city: profileData.profile?.address?.city || "",
        state: profileData.profile?.address?.state || "",
        zipCode: profileData.profile?.address?.zipCode || "",
        country: profileData.profile?.address?.country || "",
      });
    }
  };

  if (isLoading) {
    return (
      <div>
        <SiteBreadcrumb />
        <div className="space-y-5">
          <Card className="p-6 pb-10 md:pt-[84px] pt-10 rounded-lg">
            <div className="bg-default-900 dark:bg-default-400 absolute left-0 top-0 md:h-1/2 h-[150px] w-full z-[-1] rounded-t-lg"></div>
            <div className="flex items-center space-x-4">
              <div className="w-[186px] h-[186px] bg-default-200 rounded-full animate-pulse"></div>
              <div className="space-y-2">
                <div className="w-48 h-6 bg-default-200 rounded animate-pulse"></div>
                <div className="w-32 h-4 bg-default-200 rounded animate-pulse"></div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <SiteBreadcrumb />
        <div className="space-y-5">
          <Alert variant="soft" color="destructive">
            <AlertDescription>
              <Icon
                icon="heroicons-outline:exclamation-circle"
                className="w-5 h-5"
              />
              {error}
            </AlertDescription>
          </Alert>
          <Card className="p-6 text-center">
            <Button onClick={() => window.location.reload()}>
              <Icon icon="heroicons:arrow-path" className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const userData = profileData || user;

  if (!userData) {
    return (
      <div>
        <SiteBreadcrumb />
        <div className="space-y-5">
          <Card className="p-6 text-center">
            <Icon
              icon="heroicons:user-circle"
              className="w-16 h-16 mx-auto text-default-400 mb-4"
            />
            <h2 className="text-xl font-semibold mb-2">
              Profile Not Available
            </h2>
            <p className="text-default-600 mb-4">
              Please sign in to view your profile
            </p>
            <Link href="/auth/login">
              <Button>Sign In</Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  const displayName = userData.name || "Unknown User";
  const displayEmail = userData.email || "";
  const userType = userData.userType || "USER";
  const avatarSrc =
    files.length > 0
      ? files[0].preview
      : userData.avatar || "/images/users/user-1.jpg";
  const roleName = userData.role?.name || "No Role";
  const tenantName = userData.tenant?.name || "No Organization";
  const department = userData.profile?.department || "Not specified";
  const phone = userData.profile?.phone || "Not provided";
  const address = userData.profile?.address;
  const lastLogin = userData.lastLogin ? new Date(userData.lastLogin) : null;
  const createdAt = userData.createdAt ? new Date(userData.createdAt) : null;
  const permissions = userData.role?.permissions || [];

  const formatAddress = (addr) => {
    if (!addr) return "Not provided";
    const parts = [
      addr.street,
      addr.city,
      addr.state,
      addr.zipCode,
      addr.country,
    ];
    return parts.filter(Boolean).join(", ");
  };

  return (
    <div>
      <SiteBreadcrumb />
      <div className="space-y-5">
        {/* Profile Header Card */}
        <Card className="p-6 pb-10 md:pt-[84px] pt-10 rounded-lg lg:flex lg:space-y-0 space-y-6 justify-between items-end relative z-1">
          <div className="bg-default-900 dark:bg-default-400 absolute left-0 top-0 md:h-1/2 h-[150px] w-full z-[-1] rounded-t-lg"></div>

          <div className="profile-box flex-none md:text-start text-center">
            <div className="md:flex items-end md:space-x-6 rtl:space-x-reverse">
              <div className="flex-none">
                <div className="md:h-[186px] md:w-[186px] h-[140px] w-[140px] md:ml-0 md:mr-0 ml-auto mr-auto md:mb-0 mb-4 rounded-full ring-4 dark:ring-default-700 ring-default-50 relative">
                  {isEditMode ? (
                    <div {...getRootProps({ className: "dropzone h-full" })}>
                      <input {...getInputProps()} />
                      <div className="w-full h-full border-dashed border-2 border-default-300 rounded-full flex items-center justify-center cursor-pointer hover:bg-default-50 dark:hover:bg-default-800 transition-colors">
                        {files.length > 0 ? (
                          <Image
                            width={300}
                            height={300}
                            src={files[0].preview}
                            alt="Preview"
                            className="w-full h-full object-cover rounded-full"
                          />
                        ) : (
                          <div className="text-center">
                            <CloudUpload className="w-8 h-8 text-default-400 mx-auto mb-2" />
                            <p className="text-xs text-default-500">
                              Upload Avatar
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <Image
                      width={300}
                      height={300}
                      src={avatarSrc}
                      alt={displayName}
                      className="w-full h-full object-cover rounded-full"
                      onError={(e) => {
                        e.currentTarget.src = "/images/users/user-1.jpg";
                      }}
                    />
                  )}

                  {!isEditMode && (
                    <button
                      onClick={() => setIsEditMode(true)}
                      className="absolute right-2 h-8 w-8 bg-default-50 text-default-600 rounded-full shadow-sm flex flex-col items-center justify-center md:top-[140px] top-[100px] hover:bg-default-100 transition-colors"
                    >
                      <Icon icon="heroicons:pencil-square" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1">
                <div className="text-2xl font-medium text-default-900 mb-[3px]">
                  {displayName}
                </div>
                <div className="text-sm font-light text-default-600 mb-2">
                  {department}
                </div>
                <div className="flex gap-2 md:justify-start justify-center">
                  <Badge variant="secondary" className="capitalize">
                    {userType.toLowerCase().replace("_", " ")}
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {roleName}
                  </Badge>
                  {userData.isActive && <Badge color="success">Active</Badge>}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 md:justify-start justify-center">
            {isEditMode ? (
              <>
                <Button
                  onClick={profileForm.handleSubmit(onProfileSubmit)}
                  disabled={isUpdating}
                  color="success"
                >
                  {isUpdating && (
                    <Icon
                      icon="heroicons:arrow-path"
                      className="w-4 h-4 mr-2 animate-spin"
                    />
                  )}
                  Save Changes
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancelEdit}
                  disabled={isUpdating}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button onClick={() => setIsEditMode(true)}>
                  <Icon
                    icon="heroicons:pencil-square"
                    className="w-4 h-4 mr-2"
                  />
                  Edit Profile
                </Button>
                <Dialog
                  open={passwordDialogOpen}
                  onOpenChange={setPasswordDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button variant="outline" color="warning">
                      <Icon icon="heroicons:key" className="w-4 h-4 mr-2" />
                      Change Password
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Change Password</DialogTitle>
                      <DialogDescription>
                        Enter your current password and choose a new one.
                      </DialogDescription>
                    </DialogHeader>

                    <form
                      onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
                      className="space-y-4"
                    >
                      <div className="space-y-2">
                        <Label
                          htmlFor="currentPassword"
                          className={cn("", {
                            "text-destructive":
                              passwordForm.formState.errors.currentPassword,
                          })}
                        >
                          Current Password
                        </Label>
                        <Input
                          id="currentPassword"
                          type="password"
                          {...passwordForm.register("currentPassword")}
                          className={cn("", {
                            "border-destructive focus:border-destructive":
                              passwordForm.formState.errors.currentPassword,
                          })}
                        />
                        {passwordForm.formState.errors.currentPassword && (
                          <p className="text-xs text-destructive">
                            {
                              passwordForm.formState.errors.currentPassword
                                .message
                            }
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="newPassword"
                          className={cn("", {
                            "text-destructive":
                              passwordForm.formState.errors.newPassword,
                          })}
                        >
                          New Password
                        </Label>
                        <Input
                          id="newPassword"
                          type="password"
                          {...passwordForm.register("newPassword")}
                          className={cn("", {
                            "border-destructive focus:border-destructive":
                              passwordForm.formState.errors.newPassword,
                          })}
                        />
                        {passwordForm.formState.errors.newPassword && (
                          <p className="text-xs text-destructive">
                            {passwordForm.formState.errors.newPassword.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="confirmPassword"
                          className={cn("", {
                            "text-destructive":
                              passwordForm.formState.errors.confirmPassword,
                          })}
                        >
                          Confirm Password
                        </Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          {...passwordForm.register("confirmPassword")}
                          className={cn("", {
                            "border-destructive focus:border-destructive":
                              passwordForm.formState.errors.confirmPassword,
                          })}
                        />
                        {passwordForm.formState.errors.confirmPassword && (
                          <p className="text-xs text-destructive">
                            {
                              passwordForm.formState.errors.confirmPassword
                                .message
                            }
                          </p>
                        )}
                      </div>
                    </form>

                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline" disabled={isChangingPassword}>
                          Cancel
                        </Button>
                      </DialogClose>
                      <Button
                        type="submit"
                        onClick={passwordForm.handleSubmit(onPasswordSubmit)}
                        disabled={isChangingPassword}
                        color="warning"
                      >
                        {isChangingPassword && (
                          <Icon
                            icon="heroicons:arrow-path"
                            className="w-4 h-4 mr-2 animate-spin"
                          />
                        )}
                        Change Password
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </div>
        </Card>

        {/* Content Grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* Profile Information */}
          <div className="lg:col-span-4 col-span-12">
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="text-xl font-normal">
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {isEditMode ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="name"
                        className={cn("", {
                          "text-destructive": profileForm.formState.errors.name,
                        })}
                      >
                        Full Name
                      </Label>
                      <Input
                        id="name"
                        {...profileForm.register("name")}
                        className={cn("", {
                          "border-destructive focus:border-destructive":
                            profileForm.formState.errors.name,
                        })}
                      />
                      {profileForm.formState.errors.name && (
                        <p className="text-xs text-destructive">
                          {profileForm.formState.errors.name.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="email"
                        className={cn("", {
                          "text-destructive":
                            profileForm.formState.errors.email,
                        })}
                      >
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        {...profileForm.register("email")}
                        className={cn("", {
                          "border-destructive focus:border-destructive":
                            profileForm.formState.errors.email,
                        })}
                      />
                      {profileForm.formState.errors.email && (
                        <p className="text-xs text-destructive">
                          {profileForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input id="phone" {...profileForm.register("phone")} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      <Input
                        id="department"
                        {...profileForm.register("department")}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="street">Street Address</Label>
                      <Input id="street" {...profileForm.register("street")} />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input id="city" {...profileForm.register("city")} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">State</Label>
                        <Input id="state" {...profileForm.register("state")} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label htmlFor="zipCode">ZIP Code</Label>
                        <Input
                          id="zipCode"
                          {...profileForm.register("zipCode")}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="country">Country</Label>
                        <Input
                          id="country"
                          {...profileForm.register("country")}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <ul className="list space-y-6">
                    <li className="flex space-x-3 rtl:space-x-reverse">
                      <div className="flex-none text-2xl text-default-600">
                        <Icon icon="heroicons:envelope" />
                      </div>
                      <div className="flex-1">
                        <div className="uppercase text-xs text-default-500 mb-1 leading-[12px]">
                          EMAIL
                        </div>
                        <a
                          href={`mailto:${displayEmail}`}
                          className="text-base text-default-600 hover:text-primary transition-colors"
                        >
                          {displayEmail}
                        </a>
                      </div>
                    </li>

                    <li className="flex space-x-3 rtl:space-x-reverse">
                      <div className="flex-none text-2xl text-default-600">
                        <Icon icon="heroicons:phone-arrow-up-right" />
                      </div>
                      <div className="flex-1">
                        <div className="uppercase text-xs text-default-500 mb-1 leading-[12px]">
                          PHONE
                        </div>
                        <a
                          href={`tel:${phone}`}
                          className="text-base text-default-600 hover:text-primary transition-colors"
                        >
                          {phone}
                        </a>
                      </div>
                    </li>

                    <li className="flex space-x-3 rtl:space-x-reverse">
                      <div className="flex-none text-2xl text-default-600">
                        <Icon icon="heroicons:map" />
                      </div>
                      <div className="flex-1">
                        <div className="uppercase text-xs text-default-500 mb-1 leading-[12px]">
                          ADDRESS
                        </div>
                        <div className="text-base text-default-600">
                          {formatAddress(address)}
                        </div>
                      </div>
                    </li>

                    <li className="flex space-x-3 rtl:space-x-reverse">
                      <div className="flex-none text-2xl text-default-600">
                        <Icon icon="heroicons:building-office" />
                      </div>
                      <div className="flex-1">
                        <div className="uppercase text-xs text-default-500 mb-1 leading-[12px]">
                          DEPARTMENT
                        </div>
                        <div className="text-base text-default-600">
                          {department}
                        </div>
                      </div>
                    </li>

                    <li className="flex space-x-3 rtl:space-x-reverse">
                      <div className="flex-none text-2xl text-default-600">
                        <Icon icon="heroicons:calendar" />
                      </div>
                      <div className="flex-1">
                        <div className="uppercase text-xs text-default-500 mb-1 leading-[12px]">
                          JOINED
                        </div>
                        <div className="text-base text-default-600">
                          {createdAt
                            ? format(createdAt, "MMMM dd, yyyy")
                            : "Unknown"}
                        </div>
                      </div>
                    </li>
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-8 col-span-12 space-y-6">
            {/* User Activity Overview */}
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="text-xl font-normal">
                  User Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <AreaChart height={190} />
              </CardContent>
            </Card>

            {/* Permissions Card */}
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="text-xl font-normal">
                  Permissions ({permissions.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {permissions.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {permissions.map((permission, index) => (
                      <Badge
                        key={`permission-${index}`}
                        variant="outline"
                        className="justify-start p-2 font-normal"
                      >
                        <Icon
                          icon="heroicons:key"
                          className="w-3 h-3 mr-2 text-default-500"
                        />
                        {permission}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Icon
                      icon="heroicons:key"
                      className="w-12 h-12 mx-auto text-default-300 mb-4"
                    />
                    <p className="text-default-500">No permissions assigned</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Organization Information */}
            {userData.tenant && (
              <Card>
                <CardHeader className="border-b">
                  <CardTitle className="text-xl font-normal">
                    Organization
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-default-900">
                          {userData.tenant.name}
                        </h4>
                        <p className="text-sm text-default-600">
                          Slug: {userData.tenant.slug}
                        </p>
                        {userData.role?.description && (
                          <p className="text-sm text-default-500 mt-1">
                            {userData.role.description}
                          </p>
                        )}
                      </div>
                      <Badge
                        color={
                          userData.tenant.isActive ? "success" : "destructive"
                        }
                      >
                        {userData.tenant.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>

                    {lastLogin && (
                      <div className="pt-2 border-t">
                        <p className="text-sm text-default-600">
                          Last login: {format(lastLogin, "PPpp")}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
