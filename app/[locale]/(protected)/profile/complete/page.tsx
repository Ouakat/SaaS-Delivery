"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/stores/auth.store";
import { ProtectedRoute } from "@/components/route/protected-route";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import {
  Info,
  Upload,
  FileText,
  User,
  MapPin,
  Phone,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

const profileCompleteSchema = z.object({
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
  cinDocuments: z.array(z.string()).optional().default([]),
  bankDetails: z.string().optional(),
  profilePhoto: z.string().optional(),
});

type ProfileCompleteData = z.infer<typeof profileCompleteSchema>;

// Mock file upload function - replace with your actual upload logic
const uploadFile = async (file: File): Promise<string> => {
  // Simulate upload delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Return mock URL - in real app, upload to your storage service
  return URL.createObjectURL(file);
};

const ProfileCompletePage = () => {
  const router = useRouter();
  const {
    user,
    completeProfile,
    updateAccountStatus,
    accountStatus,
    validationStatus,
    accessLevel,
    requirements,
    isLoading: authLoading,
  } = useAuthStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [cinDocuments, setCinDocuments] = useState<File[]>([]);
  const [bankDocument, setBankDocument] = useState<File | null>(null);
  const [step, setStep] = useState(1);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    setValue,
    clearErrors,
  } = useForm<ProfileCompleteData>({
    resolver: zodResolver(profileCompleteSchema),
    mode: "onChange",
    defaultValues: {
      phone: user?.phone || "",
      city: user?.city || "",
      address: "",
      cin: "",
      cinDocuments: [],
      bankDetails: "",
      profilePhoto: "",
    },
  });

  // Pre-fill form with existing user data
  useEffect(() => {
    if (user) {
      setValue("phone", user.phone || "");
      setValue("city", user.city || "");
    }
  }, [user, setValue]);

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
    onError: useCallback((error: any) => {
      toast.error(`Profile photo upload error: ${error.message}`);
    }, []),
  });

  // CIN documents dropzone
  const cinDropzone = useDropzone({
    multiple: true,
    maxFiles: 2,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".pdf"],
    },
    maxSize: 10 * 1024 * 1024, // 10MB per file
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
    maxSize: 10 * 1024 * 1024, // 10MB
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

  // Calculate completion progress
  const calculateProgress = useCallback(() => {
    const formData = watch();
    let completed = 0;
    const total = 4; // address, cin, phone/city optional, documents

    if (formData.address) completed++;
    if (formData.cin) completed++;
    if (formData.phone || formData.city) completed++;
    if (cinDocuments.length > 0 || profilePhoto) completed++;

    return Math.round((completed / total) * 100);
  }, [watch, cinDocuments, profilePhoto]);

  const progress = calculateProgress();

  const onSubmit = useCallback(
    async (data: ProfileCompleteData) => {
      setIsSubmitting(true);
      setUploadProgress(0);

      try {
        let profilePhotoUrl = "";
        let cinDocumentUrls: string[] = [];
        let bankDetailsUrl = "";

        // Upload files with progress tracking
        const totalUploads =
          (profilePhoto ? 1 : 0) + cinDocuments.length + (bankDocument ? 1 : 0);
        let completedUploads = 0;

        if (profilePhoto) {
          profilePhotoUrl = await uploadFile(profilePhoto);
          completedUploads++;
          setUploadProgress(Math.round((completedUploads / totalUploads) * 50));
        }

        if (cinDocuments.length > 0) {
          cinDocumentUrls = await Promise.all(
            cinDocuments.map(async (file) => {
              const url = await uploadFile(file);
              completedUploads++;
              setUploadProgress(
                Math.round((completedUploads / totalUploads) * 50)
              );
              return url;
            })
          );
        }

        if (bankDocument) {
          bankDetailsUrl = await uploadFile(bankDocument);
          completedUploads++;
          setUploadProgress(Math.round((completedUploads / totalUploads) * 50));
        }

        setUploadProgress(60);

        // Submit profile completion
        const profileData = {
          phone: data.phone,
          city: data.city,
          address: data.address,
          cin: data.cin,
          cinDocuments: cinDocumentUrls,
          bankDetails: bankDetailsUrl,
          profilePhoto: profilePhotoUrl,
        };

        setUploadProgress(80);
        const result = await completeProfile(profileData);

        if (result.success) {
          setUploadProgress(100);

          // Update account status
          await updateAccountStatus();

          toast.success(result.message || "Profile completed successfully!");

          // Redirect to dashboard after a short delay
          setTimeout(() => {
            router.push("/dashboard");
          }, 2000);
        } else {
          throw new Error(result.error || "Failed to complete profile");
        }
      } catch (error: any) {
        console.error("Profile completion error:", error);
        toast.error(
          error.message || "Failed to complete profile. Please try again."
        );
      } finally {
        setIsSubmitting(false);
        setUploadProgress(0);
      }
    },
    [
      completeProfile,
      updateAccountStatus,
      router,
      profilePhoto,
      cinDocuments,
      bankDocument,
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

  // Show loading while auth is initializing
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute
      requiredAccessLevel="PROFILE_ONLY"
      allowedAccountStatuses={["INACTIVE"]}
      requiredPermissions={["users:update"]}
    >
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-default-900 mb-2">
              Complete Your Profile
            </h1>
            <p className="text-default-600 mb-4">
              Please provide the required information to activate your account
            </p>
            <div className="flex items-center justify-center gap-2 mb-4">
              <Badge color="primary">Account Status: {accountStatus}</Badge>
              <Badge>Step {step} of 2</Badge>
            </div>

            {/* Progress Bar */}
            <div className="max-w-md mx-auto">
              <div className="flex justify-between text-sm text-default-500 mb-2">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </div>

          {/* Requirements Alert */}
          <Alert className="mb-6">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium mb-2">
                Profile Completion Requirements:
              </div>
              <ul className="text-sm space-y-1">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  Complete address information
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  Provide CIN (National ID) number
                </li>
                <li className="flex items-center gap-2">
                  <AlertCircle className="h-3 w-3 text-yellow-500" />
                  Upload CIN documents (optional but recommended)
                </li>
                <li className="flex items-center gap-2">
                  <AlertCircle className="h-3 w-3 text-yellow-500" />
                  Upload bank details (optional)
                </li>
              </ul>
              <p className="text-xs mt-2 text-default-500">
                After completion, your profile will be reviewed for validation.
              </p>
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Step 1: Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">
                      Phone Number
                      <span className="text-xs text-default-500 ml-1">
                        (Optional)
                      </span>
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1234567890"
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
                    <Label htmlFor="city">
                      City
                      <span className="text-xs text-default-500 ml-1">
                        (Optional)
                      </span>
                    </Label>
                    <Input
                      id="city"
                      type="text"
                      placeholder="Your city"
                      {...register("city")}
                      className={errors.city ? "border-red-500" : ""}
                    />
                    {errors.city && (
                      <p className="text-xs text-red-600">
                        {errors.city.message}
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
                    placeholder="123 Main Street, Apt 4B, Neighborhood, City, Postal Code"
                    rows={3}
                    {...register("address")}
                    className={errors.address ? "border-red-500" : ""}
                  />
                  {errors.address && (
                    <p className="text-xs text-red-600">
                      {errors.address.message}
                    </p>
                  )}
                  <p className="text-xs text-default-500">
                    Please provide your complete address including street,
                    apartment/unit, neighborhood, and postal code.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cin">
                    National ID (CIN) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="cin"
                    type="text"
                    placeholder="AB123456"
                    {...register("cin")}
                    className={errors.cin ? "border-red-500" : ""}
                  />
                  {errors.cin && (
                    <p className="text-xs text-red-600">{errors.cin.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Step 2: Documents Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Document Uploads
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profile Photo */}
                <div className="space-y-2">
                  <Label>Profile Photo (Optional)</Label>
                  <div
                    {...profilePhotoDropzone.getRootProps()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                  >
                    <input {...profilePhotoDropzone.getInputProps()} />
                    {profilePhoto ? (
                      <div className="space-y-2">
                        <Image
                          src={URL.createObjectURL(profilePhoto)}
                          alt="Profile preview"
                          width={100}
                          height={100}
                          className="mx-auto rounded-full object-cover"
                        />
                        <p className="text-sm text-gray-600">
                          {profilePhoto.name}
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile("profile");
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600">
                          Drag & drop your profile photo, or click to select
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          PNG, JPG, JPEG, WEBP up to 5MB
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* CIN Documents */}
                <div className="space-y-2">
                  <Label>CIN Documents (Optional but recommended)</Label>
                  <p className="text-xs text-default-500 mb-2">
                    Upload front and back of your National ID card
                  </p>
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
                            Click to add more documents (max 2)
                          </p>
                        )}
                      </div>
                    ) : (
                      <div>
                        <FileText className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600">
                          Drag & drop CIN documents, or click to select
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          PNG, JPG, JPEG, PDF up to 10MB each (max 2 files)
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bank Details */}
                <div className="space-y-2">
                  <Label>Bank RIB Document (Optional)</Label>
                  <div
                    {...bankDropzone.getRootProps()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                  >
                    <input {...bankDropzone.getInputProps()} />
                    {bankDocument ? (
                      <div className="space-y-2">
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
                      </div>
                    ) : (
                      <div>
                        <FileText className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600">
                          Drag & drop your bank RIB, or click to select
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          PNG, JPG, JPEG, PDF up to 10MB
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submit Section */}
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/auth/login")}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !isValid}
                className="min-w-[200px]"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {uploadProgress > 0
                      ? `Uploading... ${uploadProgress}%`
                      : "Submitting..."}
                  </div>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Complete Profile
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Development Info */}
          {process.env.NODE_ENV === "development" && (
            <Card className="mt-6 bg-muted/50">
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>
                    <strong>Account Status:</strong> {accountStatus}
                  </div>
                  <div>
                    <strong>Access Level:</strong> {accessLevel}
                  </div>
                  <div>
                    <strong>Progress:</strong> {progress}%
                  </div>
                  <div>
                    <strong>Requirements:</strong> {requirements.join(", ")}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default ProfileCompletePage;
