"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/stores/auth.store";
import { ProtectedRoute } from "@/components/route/protected-route";
import { usersApiClient } from "@/lib/api/clients/users.client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Icon } from "@/components/ui/icon";
import { useDropzone } from "react-dropzone";
import SiteBreadcrumb from "@/components/site-breadcrumb";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import {
  User,
  MapPin,
  Phone,
  Mail,
  Building,
  Calendar,
  Shield,
  CheckCircle,
  AlertTriangle,
  Clock,
  Upload,
  FileText,
  Save,
  X,
} from "lucide-react";

const profileEditSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must not exceed 100 characters"),
  phone: z
    .string()
    .optional()
    .refine((val) => !val || val.length >= 10, {
      message: "Phone number must be at least 10 digits",
    }),
  city: z
    .string()
    .optional()
    .refine((val) => !val || val.length >= 2, {
      message: "City must be at least 2 characters",
    }),
  address: z
    .string()
    .min(10, "Address must be at least 10 characters")
    .max(300, "Address must not exceed 300 characters"),
  cin: z
    .string()
    .min(4, "CIN must be at least 4 characters")
    .max(20, "CIN must not exceed 20 characters"),
  profilePhoto: z.string().optional(),
  cinDocuments: z.array(z.string()).optional(),
  bankDetails: z.string().optional(),
});

type ProfileEditData = z.infer<typeof profileEditSchema>;

// Mock file upload function - replace with your actual upload logic
const uploadFile = async (file: File): Promise<string> => {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return URL.createObjectURL(file);
};

const ProfileEditPage = () => {
  const router = useRouter();
  const {
    user,
    updateProfile,
    getUserProfile,
    accountStatus,
    validationStatus,
    accessLevel,
    hasBlueCheckmark,
    needsValidation,
    canAccessFullFeatures,
    isLoading: authLoading,
  } = useAuthStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [cinDocuments, setCinDocuments] = useState<File[]>([]);
  const [bankDocument, setBankDocument] = useState<File | null>(null);
  const [profileData, setProfileData] = useState<any>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isDirty },
    watch,
    setValue,
    reset,
    clearErrors,
  } = useForm<ProfileEditData>({
    resolver: zodResolver(profileEditSchema),
    mode: "onChange",
  });

  // Load user profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) return;

      setIsLoading(true);
      try {
        const profile : any = await getUserProfile();
        if (profile) {
          setProfileData(profile);

          // Populate form with existing data
          const profileInfo = profile.profile || {};
          reset({
            name: profile.name || "",
            phone: profile.phone || "",
            city: profile.city || "",
            address: profileInfo.address || "",
            cin: profileInfo.cin || "",
            profilePhoto: profileInfo.profilePhoto || "",
            cinDocuments: profileInfo.cinDocuments || [],
            bankDetails: profileInfo.bankDetails || "",
          });
        }
      } catch (error) {
        console.error("Failed to load profile:", error);
        toast.error("Failed to load profile data");
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [user?.id, getUserProfile, reset]);

  // Profile photo dropzone
  const profilePhotoDropzone = useDropzone({
    multiple: false,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".webp"],
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    onDrop: useCallback(
      (acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
          setProfilePhoto(acceptedFiles[0]);
          clearErrors("profilePhoto");
        }
      },
      [clearErrors]
    ),
  });

  // CIN documents dropzone
  const cinDropzone = useDropzone({
    multiple: true,
    maxFiles: 2,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".pdf"],
    },
    maxSize: 10 * 1024 * 1024,
    onDrop: useCallback(
      (acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
          setCinDocuments((prev) => [...prev, ...acceptedFiles].slice(0, 2));
          clearErrors("cinDocuments");
        }
      },
      [clearErrors]
    ),
  });

  // Bank document dropzone
  const bankDropzone = useDropzone({
    multiple: false,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".pdf"],
      "application/pdf": [".pdf"],
    },
    maxSize: 10 * 1024 * 1024,
    onDrop: useCallback(
      (acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
          setBankDocument(acceptedFiles[0]);
          clearErrors("bankDetails");
        }
      },
      [clearErrors]
    ),
  });

  // Status indicator component
  const StatusIndicator = useMemo(() => {
    const getStatusInfo = () => {
      switch (accountStatus) {
        case "PENDING_VALIDATION":
          return {
            icon: Clock,
            color: "text-yellow-600",
            bgColor: "bg-yellow-100",
            title: "Pending Validation",
            message: "Your profile is under review by our team.",
          };
        case "ACTIVE":
          if (validationStatus === "VALIDATED") {
            return {
              icon: CheckCircle,
              color: "text-green-600",
              bgColor: "bg-green-100",
              title: "Profile Validated",
              message: "Your profile has been verified and approved.",
            };
          } else {
            return {
              icon: Shield,
              color: "text-blue-600",
              bgColor: "bg-blue-100",
              title: "Active Account",
              message: "Your account is active with limited features.",
            };
          }
        default:
          return {
            icon: AlertTriangle,
            color: "text-orange-600",
            bgColor: "bg-orange-100",
            title: accountStatus || "Unknown",
            message: "Contact support for assistance.",
          };
      }
    };

    const status = getStatusInfo();

    return (
      <Alert className="mb-6">
        <status.icon className="h-4 w-4" />
        <AlertDescription>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">{status.title}</div>
              <div className="text-sm mt-1">{status.message}</div>
            </div>
            <div className="flex items-center gap-2">
              <Badge color="primary">{accountStatus}</Badge>
              {hasBlueCheckmark && (
                <Badge className="bg-blue-100 text-blue-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              )}
            </div>
          </div>
        </AlertDescription>
      </Alert>
    );
  }, [accountStatus, validationStatus, hasBlueCheckmark]);

  const onSubmit = useCallback(
    async (data: ProfileEditData) => {
      if (!user?.id) return;

      setIsSubmitting(true);
      try {
        let profilePhotoUrl = data.profilePhoto || "";
        let cinDocumentUrls = data.cinDocuments || [];
        let bankDetailsUrl = data.bankDetails || "";

        // Upload new files
        if (profilePhoto) {
          profilePhotoUrl = await uploadFile(profilePhoto);
        }

        if (cinDocuments.length > 0) {
          const newCinUrls = await Promise.all(
            cinDocuments.map((file) => uploadFile(file))
          );
          cinDocumentUrls = [...(data.cinDocuments || []), ...newCinUrls];
        }

        if (bankDocument) {
          bankDetailsUrl = await uploadFile(bankDocument);
        }

        // Update profile
        const updateData = {
          name: data.name,
          phone: data.phone,
          city: data.city,
          profile: {
            ...(profileData?.profile || {}),
            address: data.address,
            cin: data.cin,
            profilePhoto: profilePhotoUrl,
            cinDocuments: cinDocumentUrls,
            bankDetails: bankDetailsUrl,
          },
        };

        const response = await usersApiClient.updateUser(user.id, updateData);

        if (response.success) {
          // Update the store
          const success = await updateProfile(updateData);

          if (success) {
            toast.success("Profile updated successfully!");

            // Clear file states
            setProfilePhoto(null);
            setCinDocuments([]);
            setBankDocument(null);

            // Redirect to profile view
            router.push("/profile");
          } else {
            throw new Error("Failed to update profile in store");
          }
        } else {
          throw new Error(
            response.error?.message || "Failed to update profile"
          );
        }
      } catch (error: any) {
        console.error("Profile update error:", error);
        toast.error(
          error.message || "Failed to update profile. Please try again."
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      user?.id,
      updateProfile,
      router,
      profilePhoto,
      cinDocuments,
      bankDocument,
      profileData,
    ]
  );

  const removeFile = useCallback(
    (type: "profile" | "cin" | "bank", index?: number) => {
      switch (type) {
        case "profile":
          setProfilePhoto(null);
          break;
        case "cin":
          if (index !== undefined) {
            setCinDocuments((prev) => prev.filter((_, i) => i !== index));
          }
          break;
        case "bank":
          setBankDocument(null);
          break;
      }
    },
    []
  );

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

  return (
    <ProtectedRoute
      requiredAccessLevel="LIMITED"
      allowedAccountStatuses={["PENDING_VALIDATION", "ACTIVE"]}
      requiredPermissions={["users:update"]}
    >
      <div>
        <SiteBreadcrumb />

        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-default-900">
                Edit Profile
              </h1>
              <p className="text-default-600">
                Update your personal information and documents
              </p>
            </div>
            <Link href="/profile">
              <Button variant="outline">
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </Link>
          </div>

          {StatusIndicator}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Profile Header */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar Section */}
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <Avatar className="h-24 w-24">
                      <AvatarImage
                        src={
                          profilePhoto
                            ? URL.createObjectURL(profilePhoto)
                            : profileData?.avatar
                        }
                        alt={profileData?.name || "Profile"}
                      />
                      <AvatarFallback className="text-xl">
                        {profileData?.name?.charAt(0)?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      {...profilePhotoDropzone.getRootProps()}
                      className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <input {...profilePhotoDropzone.getInputProps()} />
                      <Upload className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-default-900">
                      Profile Photo
                    </h3>
                    <p className="text-sm text-default-600">
                      Click on the avatar to upload a new photo. Max size: 5MB
                    </p>
                    {profilePhoto && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-sm text-green-600">
                          New photo selected: {profilePhoto.name}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeFile("profile")}
                        >
                          Remove
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Full Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      {...register("name")}
                      className={errors.name ? "border-red-500" : ""}
                    />
                    {errors.name && (
                      <p className="text-xs text-red-600">
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      {...register("phone")}
                      className={errors.phone ? "border-red-500" : ""}
                    />
                    {errors.phone && (
                      <p className="text-xs text-red-600">
                        {errors.phone.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      {...register("city")}
                      className={errors.city ? "border-red-500" : ""}
                    />
                    {errors.city && (
                      <p className="text-xs text-red-600">
                        {errors.city.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cin">
                      National ID (CIN) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="cin"
                      {...register("cin")}
                      className={errors.cin ? "border-red-500" : ""}
                    />
                    {errors.cin && (
                      <p className="text-xs text-red-600">
                        {errors.cin.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">
                    Complete Address <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="address"
                    rows={3}
                    {...register("address")}
                    className={errors.address ? "border-red-500" : ""}
                  />
                  {errors.address && (
                    <p className="text-xs text-red-600">
                      {errors.address.message}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Documents Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Supporting Documents
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Existing Documents Display */}
                {profileData?.profile?.cinDocuments?.length > 0 && (
                  <div className="space-y-2">
                    <Label>Current CIN Documents</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {profileData.profile.cinDocuments.map(
                        (doc: string, index: number) => (
                          <div key={index} className="relative group">
                            <Image
                              src={doc}
                              alt={`CIN Document ${index + 1}`}
                              width={150}
                              height={100}
                              className="rounded-lg object-cover border"
                            />
                            <div className="absolute top-2 right-2">
                              <Badge color="secondary" className="text-xs">
                                Current
                              </Badge>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

                {/* CIN Documents Upload */}
                <div className="space-y-2">
                  <Label>Upload Additional CIN Documents</Label>
                  <div
                    {...cinDropzone.getRootProps()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                  >
                    <input {...cinDropzone.getInputProps()} />
                    {cinDocuments.length > 0 ? (
                      <div className="space-y-2">
                        {cinDocuments.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between bg-gray-50 rounded p-2"
                          >
                            <span className="text-sm">{file.name}</span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeFile("cin", index);
                              }}
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                        {cinDocuments.length < 2 && (
                          <p className="text-sm text-gray-600">
                            Click to add more documents
                          </p>
                        )}
                      </div>
                    ) : (
                      <div>
                        <FileText className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600">
                          Add new CIN documents (max 2 additional files)
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          PNG, JPG, JPEG, PDF up to 10MB each
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bank Document */}
                <div className="space-y-2">
                  <Label>Bank RIB Document</Label>
                  <div
                    {...bankDropzone.getRootProps()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                  >
                    <input {...bankDropzone.getInputProps()} />
                    {bankDocument ? (
                      <div className="flex items-center justify-between bg-gray-50 rounded p-2">
                        <span className="text-sm">{bankDocument.name}</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile("bank");
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <FileText className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600">
                          {profileData?.profile?.bankDetails
                            ? "Update bank RIB document"
                            : "Upload bank RIB document"}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          PNG, JPG, JPEG, PDF up to 10MB
                        </p>
                      </div>
                    )}
                  </div>
                  {profileData?.profile?.bankDetails && (
                    <p className="text-xs text-green-600">
                      Current document on file - upload new file to replace
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Submit Section */}
            <div className="flex justify-end gap-4">
              <Link href="/profile">
                <Button type="button" variant="outline" disabled={isSubmitting}>
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={isSubmitting || !isValid || !isDirty}
                className="min-w-[150px]"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </div>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Validation Warning */}
          {needsValidation() && (
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium">Profile Under Review</div>
                <p className="text-sm mt-1">
                  Your profile changes may affect your validation status. Major
                  changes might require re-validation by our team.
                </p>
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default ProfileEditPage;
