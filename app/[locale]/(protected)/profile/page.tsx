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
import { useEffect, useState, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils/ui.utils";
import { useDropzone } from "react-dropzone";
import { CloudUpload } from "lucide-react";

// Types
interface FileWithPreview extends File {
  preview: string;
}

interface ProfileAddress {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

interface ProfileData {
  phone?: string;
  department?: string;
  address?: ProfileAddress;
}

interface ProfileUser {
  id: string;
  name?: string;
  email?: string;
  avatar?: string;
  userType?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt?: string;
  profile?: ProfileData;
  role?: {
    name: string;
    description?: string;
    permissions: string[];
  };
  tenant?: {
    name: string;
    slug: string;
    isActive: boolean;
  };
}

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

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

// Custom hooks
const useProfileData = () => {
  const { isAuthenticated, updateUser } = useAuthStore();
  const [profileData, setProfileData] = useState<ProfileUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await authApiClient.getProfile();

      if (response.success && response.data) {
        const userData = response.data;
        setProfileData(userData as any);
        updateUser(userData);
        return userData;
      } else {
        const errorMessage =
          response.error?.message || "Failed to load profile data";
        setError(errorMessage);
        return null;
      }
    } catch (err) {
      const errorMessage = "Network error while loading profile";
      setError(errorMessage);
      console.error("Profile fetch error:", err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, updateUser]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return { profileData, isLoading, error, refetchProfile: fetchProfile };
};

// Component for profile header
const ProfileHeader = ({
  profileData,
  isEditMode,
  files,
  getRootProps,
  getInputProps,
  onEditClick,
  isUpdating,
}: {
  profileData: ProfileUser;
  isEditMode: boolean;
  files: FileWithPreview[];
  getRootProps: any;
  getInputProps: any;
  onEditClick: () => void;
  isUpdating: boolean;
}) => {
  const displayName = profileData.name || "Unknown User";
  const profile = profileData.profile as ProfileData;
  const department = profile?.department || "Not specified";
  const userType = profileData.userType || "USER";
  const roleName = profileData.role?.name || "No Role";

  const avatarSrc = useMemo(() => {
    if (files.length > 0) return files[0].preview;
    return profileData.avatar || "/images/users/user-1.jpg";
  }, [files, profileData.avatar]);

  return (
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
                      <p className="text-xs text-default-500">Upload Avatar</p>
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
                onClick={onEditClick}
                className="absolute right-2 h-8 w-8 bg-default-50 text-default-600 rounded-full shadow-sm flex flex-col items-center justify-center md:top-[140px] top-[100px] hover:bg-default-100 transition-colors"
                disabled={isUpdating}
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
            <Badge className="capitalize">
              {userType.toLowerCase().replace("_", " ")}
            </Badge>
            <Badge className="capitalize">{roleName}</Badge>
            {profileData.isActive && <Badge color="success">Active</Badge>}
          </div>
        </div>
      </div>
    </div>
  );
};

// Component for profile form fields
const ProfileFormFields = ({ profileForm }: { profileForm: any }) => {
  const formFields = [
    { id: "name", label: "Full Name", type: "text", required: true },
    { id: "email", label: "Email", type: "email", required: true },
    { id: "phone", label: "Phone", type: "text" },
    { id: "department", label: "Department", type: "text" },
    { id: "street", label: "Street Address", type: "text" },
  ];

  const gridFields = [
    [
      { id: "city", label: "City", type: "text" },
      { id: "state", label: "State", type: "text" },
    ],
    [
      { id: "zipCode", label: "ZIP Code", type: "text" },
      { id: "country", label: "Country", type: "text" },
    ],
  ];

  return (
    <div className="space-y-4">
      {formFields.map((field) => (
        <div key={field.id} className="space-y-2">
          <Label
            htmlFor={field.id}
            className={cn("", {
              "text-destructive": profileForm.formState.errors[field.id],
            })}
          >
            {field.label}
          </Label>
          <Input
            id={field.id}
            type={field.type}
            {...profileForm.register(field.id)}
            className={cn("", {
              "border-destructive focus:border-destructive":
                profileForm.formState.errors[field.id],
            })}
          />
          {profileForm.formState.errors[field.id] && (
            <p className="text-xs text-destructive">
              {profileForm.formState.errors[field.id].message}
            </p>
          )}
        </div>
      ))}

      {gridFields.map((fieldPair, index) => (
        <div key={index} className="grid grid-cols-2 gap-2">
          {fieldPair.map((field) => (
            <div key={field.id} className="space-y-2">
              <Label htmlFor={field.id}>{field.label}</Label>
              <Input
                id={field.id}
                type={field.type}
                {...profileForm.register(field.id)}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

// Component for profile information display
const ProfileInfoDisplay = ({ profileData }: { profileData: ProfileUser }) => {
  const profile = profileData.profile as ProfileData;
  const displayEmail = profileData.email || "";
  const phone = profile?.phone || "Not provided";
  const department = profile?.department || "Not specified";
  const address = profile?.address;
  const createdAt = profileData.createdAt
    ? new Date(profileData.createdAt)
    : null;

  const formatAddress = (addr: ProfileAddress | undefined): string => {
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

  const infoItems = [
    {
      icon: "heroicons:envelope",
      label: "EMAIL",
      value: displayEmail,
      href: `mailto:${displayEmail}`,
    },
    {
      icon: "heroicons:phone-arrow-up-right",
      label: "PHONE",
      value: phone,
      href: `tel:${phone}`,
    },
    {
      icon: "heroicons:map",
      label: "ADDRESS",
      value: formatAddress(address),
    },
    {
      icon: "heroicons:building-office",
      label: "DEPARTMENT",
      value: department,
    },
    {
      icon: "heroicons:calendar",
      label: "JOINED",
      value: createdAt ? format(createdAt, "MMMM dd, yyyy") : "Unknown",
    },
  ];

  return (
    <ul className="list space-y-6">
      {infoItems.map((item, index) => (
        <li key={index} className="flex space-x-3 rtl:space-x-reverse">
          <div className="flex-none text-2xl text-default-600">
            <Icon icon={item.icon} />
          </div>
          <div className="flex-1">
            <div className="uppercase text-xs text-default-500 mb-1 leading-[12px]">
              {item.label}
            </div>
            {item.href ? (
              <a
                href={item.href}
                className="text-base text-default-600 hover:text-primary transition-colors"
              >
                {item.value}
              </a>
            ) : (
              <div className="text-base text-default-600">{item.value}</div>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
};

// Component for password change dialog
const PasswordChangeDialog = ({
  isOpen,
  onOpenChange,
  passwordForm,
  onSubmit,
  isChanging,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  passwordForm: any;
  onSubmit: (data: PasswordFormData) => void;
  isChanging: boolean;
}) => {
  const passwordFields = [
    { id: "currentPassword", label: "Current Password", type: "password" },
    { id: "newPassword", label: "New Password", type: "password" },
    { id: "confirmPassword", label: "Confirm Password", type: "password" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
          <DialogDescription>
            Enter your current password and choose a new one.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={passwordForm.handleSubmit(onSubmit)}
          className="space-y-4"
        >
          {passwordFields.map((field) => (
            <div key={field.id} className="space-y-2">
              <Label
                htmlFor={field.id}
                className={cn("", {
                  "text-destructive": passwordForm.formState.errors[field.id],
                })}
              >
                {field.label}
              </Label>
              <Input
                id={field.id}
                type={field.type}
                {...passwordForm.register(field.id)}
                className={cn("", {
                  "border-destructive focus:border-destructive":
                    passwordForm.formState.errors[field.id],
                })}
              />
              {passwordForm.formState.errors[field.id] && (
                <p className="text-xs text-destructive">
                  {passwordForm.formState.errors[field.id].message}
                </p>
              )}
            </div>
          ))}
        </form>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={isChanging}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="submit"
            onClick={passwordForm.handleSubmit(onSubmit)}
            disabled={isChanging}
            color="warning"
          >
            {isChanging && (
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
  );
};

// Main component
const ProfilePage = () => {
  const { isAuthenticated } = useAuthStore();
  const { profileData, isLoading, error, refetchProfile } = useProfileData();
  const [isEditMode, setIsEditMode] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

  // Profile form
  const profileForm = useForm<ProfileFormData>({
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
  const passwordForm = useForm<PasswordFormData>({
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
    onDrop: useCallback((acceptedFiles: any) => {
      setFiles(
        acceptedFiles.map((file: any) =>
          Object.assign(file, {
            preview: URL.createObjectURL(file),
          })
        )
      );
    }, []),
  });

  // Update form when profile data changes
  useEffect(() => {
    if (profileData) {
      const profile = profileData.profile as ProfileData;
      profileForm.reset({
        name: profileData.name || "",
        email: profileData.email || "",
        phone: profile?.phone || "",
        department: profile?.department || "",
        street: profile?.address?.street || "",
        city: profile?.address?.city || "",
        state: profile?.address?.state || "",
        zipCode: profile?.address?.zipCode || "",
        country: profile?.address?.country || "",
      });
    }
  }, [profileData, profileForm]);

  // Handle profile update
  const onProfileSubmit = useCallback(
    async (data: ProfileFormData) => {
      if (!profileData?.id) return;

      setIsUpdating(true);
      try {
        const updateData = {
          name: data.name,
          email: data.email,
          profile: {
            phone: data.phone || "",
            department: data.department || "",
            address: {
              street: data.street || "",
              city: data.city || "",
              state: data.state || "",
              zipCode: data.zipCode || "",
              country: data.country || "",
            },
          },
        };

        const response = await usersApiClient.updateUser(
          profileData.id,
          updateData
        );

        if (response.success && response.data) {
          await refetchProfile();
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
    },
    [profileData?.id, refetchProfile]
  );

  // Handle password change
  const onPasswordSubmit = useCallback(
    async (data: PasswordFormData) => {
      if (!profileData?.id) return;

      setIsChangingPassword(true);
      try {
        const response = await usersApiClient.changeUserPassword(
          profileData.id,
          {
            currentPassword: data.currentPassword,
            newPassword: data.newPassword,
          }
        );

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
    },
    [profileData?.id, passwordForm]
  );

  // Cancel edit mode
  const handleCancelEdit = useCallback(() => {
    setIsEditMode(false);
    setFiles([]);

    if (profileData) {
      const profile = profileData.profile as ProfileData;
      profileForm.reset({
        name: profileData.name || "",
        email: profileData.email || "",
        phone: profile?.phone || "",
        department: profile?.department || "",
        street: profile?.address?.street || "",
        city: profile?.address?.city || "",
        state: profile?.address?.state || "",
        zipCode: profile?.address?.zipCode || "",
        country: profile?.address?.country || "",
      });
    }
  }, [profileData, profileForm]);

  // Cleanup object URLs
  useEffect(() => {
    return () => {
      files.forEach((file) => URL.revokeObjectURL(file.preview));
    };
  }, [files]);

  // Loading state
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

  // Error state
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
        </div>
      </div>
    );
  }

  // Not authenticated state
  if (!isAuthenticated || !profileData) {
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

  const permissions = profileData.role?.permissions || [];
  const lastLogin = profileData.lastLogin
    ? new Date(profileData.lastLogin)
    : null;

  return (
    <div>
      <SiteBreadcrumb />
      <div className="space-y-5">
        {/* Profile Header Card */}
        <Card className="p-6 pb-10 md:pt-[84px] pt-10 rounded-lg lg:flex lg:space-y-0 space-y-6 justify-between items-end relative z-1">
          <div className="bg-default-900 dark:bg-default-400 absolute left-0 top-0 md:h-1/2 h-[150px] w-full z-[-1] rounded-t-lg"></div>

          <ProfileHeader
            profileData={profileData}
            isEditMode={isEditMode}
            files={files}
            getRootProps={getRootProps}
            getInputProps={getInputProps}
            onEditClick={() => setIsEditMode(true)}
            isUpdating={isUpdating}
          />

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
                  <PasswordChangeDialog
                    isOpen={passwordDialogOpen}
                    onOpenChange={setPasswordDialogOpen}
                    passwordForm={passwordForm}
                    onSubmit={onPasswordSubmit}
                    isChanging={isChangingPassword}
                  />
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
                  <ProfileFormFields profileForm={profileForm} />
                ) : (
                  <ProfileInfoDisplay profileData={profileData} />
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

            {/* Organization Information */}
            {profileData.tenant && (
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
                          {profileData.tenant.name}
                        </h4>
                        <p className="text-sm text-default-600">
                          Slug: {profileData.tenant.slug}
                        </p>
                        {profileData.role?.description && (
                          <p className="text-sm text-default-500 mt-1">
                            {profileData.role.description}
                          </p>
                        )}
                      </div>
                      <Badge
                        color={
                          profileData.tenant.isActive
                            ? "success"
                            : "destructive"
                        }
                      >
                        {profileData.tenant.isActive ? "Active" : "Inactive"}
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
