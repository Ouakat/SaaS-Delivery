"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Icon } from "@/components/ui/icon";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSettingsStore } from "@/lib/stores/settings/settings.store";
import { toast } from "sonner";
import { cn } from "@/lib/utils/ui.utils";

// Form validation schema
const generalSettingsSchema = z.object({
  companyName: z
    .string()
    .min(1, "Company name is required")
    .max(100, "Company name too long"),
  website: z.string().url("Please enter a valid URL").or(z.literal("")),
  email: z.string().email("Please enter a valid email address"),
  phone: z
    .string()
    .min(1, "Phone is required")
    .max(20, "Phone number too long"),
  address: z
    .string()
    .min(1, "Address is required")
    .max(500, "Address too long"),
  currencySymbol: z
    .string()
    .min(1, "Currency symbol is required")
    .max(5, "Currency symbol too long"),

  // Links (optional)
  termsOfService: z.string().url("Please enter a valid URL").or(z.literal("")),
  privacyPolicy: z.string().url("Please enter a valid URL").or(z.literal("")),
  support: z.string().url("Please enter a valid URL").or(z.literal("")),
  help: z.string().url("Please enter a valid URL").or(z.literal("")),

  // Social Media (optional)
  facebook: z.string().url("Please enter a valid URL").or(z.literal("")),
  twitter: z.string().url("Please enter a valid URL").or(z.literal("")),
  instagram: z.string().url("Please enter a valid URL").or(z.literal("")),
  linkedin: z.string().url("Please enter a valid URL").or(z.literal("")),
  youtube: z.string().url("Please enter a valid URL").or(z.literal("")),
});

type GeneralSettingsFormData = z.infer<typeof generalSettingsSchema>;

interface GeneralSettingsFormProps {
  onSuccess?: () => void;
}

export default function GeneralSettingsForm({
  onSuccess,
}: GeneralSettingsFormProps) {
  const {
    generalSettings,
    isLoading,
    error,
    updateGeneralSettings,
    createGeneralSettings,
    fetchGeneralSettings,
    clearError,
  } = useSettingsStore();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<GeneralSettingsFormData>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: {
      companyName: "",
      website: "",
      email: "",
      phone: "",
      address: "",
      currencySymbol: "$",
      termsOfService: "",
      privacyPolicy: "",
      support: "",
      help: "",
      facebook: "",
      twitter: "",
      instagram: "",
      linkedin: "",
      youtube: "",
    },
  });

  // Load existing settings
  useEffect(() => {
    fetchGeneralSettings();
  }, [fetchGeneralSettings]);

  // Update form when settings change
  useEffect(() => {
    if (generalSettings) {
      reset({
        companyName: generalSettings.companyName || "",
        website: generalSettings.website || "",
        email: generalSettings.email || "",
        phone: generalSettings.phone || "",
        address: generalSettings.address || "",
        currencySymbol: generalSettings.currencySymbol || "$",
        termsOfService: generalSettings.links?.termsOfService || "",
        privacyPolicy: generalSettings.links?.privacyPolicy || "",
        support: generalSettings.links?.support || "",
        help: generalSettings.links?.help || "",
        facebook: generalSettings.socials?.facebook || "",
        twitter: generalSettings.socials?.twitter || "",
        instagram: generalSettings.socials?.instagram || "",
        linkedin: generalSettings.socials?.linkedin || "",
        youtube: generalSettings.socials?.youtube || "",
      });
    }
  }, [generalSettings, reset]);

  const onSubmit = async (data: GeneralSettingsFormData) => {
    clearError();

    // Prepare data structure
    const settingsData = {
      companyName: data.companyName,
      website: data.website,
      email: data.email,
      phone: data.phone,
      address: data.address,
      currencySymbol: data.currencySymbol,
      links: {
        termsOfService: data.termsOfService || undefined,
        privacyPolicy: data.privacyPolicy || undefined,
        support: data.support || undefined,
        help: data.help || undefined,
      },
      socials: {
        facebook: data.facebook || undefined,
        twitter: data.twitter || undefined,
        instagram: data.instagram || undefined,
        linkedin: data.linkedin || undefined,
        youtube: data.youtube || undefined,
      },
    };

    // Choose create or update based on whether settings exist
    const success = generalSettings
      ? await updateGeneralSettings(settingsData)
      : await createGeneralSettings(settingsData);

    if (success) {
      toast.success(
        generalSettings
          ? "Settings updated successfully!"
          : "Settings created successfully!"
      );
      onSuccess?.();
    } else {
      toast.error("Failed to save settings. Please try again.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <Alert color="destructive">
          <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon icon="heroicons:building-office" className="w-5 h-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="companyName"
                  className={cn({ "text-destructive": errors.companyName })}
                >
                  Company Name *
                </Label>
                <Input
                  id="companyName"
                  {...register("companyName")}
                  placeholder="Enter your company name"
                  className={cn({
                    "border-destructive focus:border-destructive":
                      errors.companyName,
                  })}
                />
                {errors.companyName && (
                  <p className="text-sm text-destructive">
                    {errors.companyName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="website"
                  className={cn({ "text-destructive": errors.website })}
                >
                  Website
                </Label>
                <Input
                  id="website"
                  {...register("website")}
                  placeholder="https://www.example.com"
                  className={cn({
                    "border-destructive focus:border-destructive":
                      errors.website,
                  })}
                />
                {errors.website && (
                  <p className="text-sm text-destructive">
                    {errors.website.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className={cn({ "text-destructive": errors.email })}
                >
                  Contact Email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  placeholder="contact@example.com"
                  className={cn({
                    "border-destructive focus:border-destructive": errors.email,
                  })}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="phone"
                  className={cn({ "text-destructive": errors.phone })}
                >
                  Phone Number *
                </Label>
                <Input
                  id="phone"
                  {...register("phone")}
                  placeholder="+1-555-0123"
                  className={cn({
                    "border-destructive focus:border-destructive": errors.phone,
                  })}
                />
                {errors.phone && (
                  <p className="text-sm text-destructive">
                    {errors.phone.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="currencySymbol"
                  className={cn({ "text-destructive": errors.currencySymbol })}
                >
                  Currency Symbol *
                </Label>
                <Input
                  id="currencySymbol"
                  {...register("currencySymbol")}
                  placeholder="$ or € or £"
                  className={cn({
                    "border-destructive focus:border-destructive":
                      errors.currencySymbol,
                  })}
                />
                {errors.currencySymbol && (
                  <p className="text-sm text-destructive">
                    {errors.currencySymbol.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="address"
                className={cn({ "text-destructive": errors.address })}
              >
                Business Address *
              </Label>
              <Textarea
                id="address"
                {...register("address")}
                placeholder="Enter your complete business address"
                rows={3}
                className={cn({
                  "border-destructive focus:border-destructive": errors.address,
                })}
              />
              {errors.address && (
                <p className="text-sm text-destructive">
                  {errors.address.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Important Links */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon icon="heroicons:link" className="w-5 h-5" />
              Important Links
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="termsOfService">Terms of Service</Label>
                <Input
                  id="termsOfService"
                  {...register("termsOfService")}
                  placeholder="https://www.example.com/terms"
                  className={cn({
                    "border-destructive focus:border-destructive":
                      errors.termsOfService,
                  })}
                />
                {errors.termsOfService && (
                  <p className="text-sm text-destructive">
                    {errors.termsOfService.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="privacyPolicy">Privacy Policy</Label>
                <Input
                  id="privacyPolicy"
                  {...register("privacyPolicy")}
                  placeholder="https://www.example.com/privacy"
                  className={cn({
                    "border-destructive focus:border-destructive":
                      errors.privacyPolicy,
                  })}
                />
                {errors.privacyPolicy && (
                  <p className="text-sm text-destructive">
                    {errors.privacyPolicy.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="support">Support Page</Label>
                <Input
                  id="support"
                  {...register("support")}
                  placeholder="https://support.example.com"
                  className={cn({
                    "border-destructive focus:border-destructive":
                      errors.support,
                  })}
                />
                {errors.support && (
                  <p className="text-sm text-destructive">
                    {errors.support.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="help">Help Center</Label>
                <Input
                  id="help"
                  {...register("help")}
                  placeholder="https://help.example.com"
                  className={cn({
                    "border-destructive focus:border-destructive": errors.help,
                  })}
                />
                {errors.help && (
                  <p className="text-sm text-destructive">
                    {errors.help.message}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Social Media */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon icon="heroicons:share" className="w-5 h-5" />
              Social Media
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="facebook" className="flex items-center gap-2">
                  Facebook
                </Label>
                <Input
                  id="facebook"
                  {...register("facebook")}
                  placeholder="https://facebook.com/yourcompany"
                  className={cn({
                    "border-destructive focus:border-destructive":
                      errors.facebook,
                  })}
                />
                {errors.facebook && (
                  <p className="text-sm text-destructive">
                    {errors.facebook.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="twitter">Twitter</Label>
                <Input
                  id="twitter"
                  {...register("twitter")}
                  placeholder="https://twitter.com/yourcompany"
                  className={cn({
                    "border-destructive focus:border-destructive":
                      errors.twitter,
                  })}
                />
                {errors.twitter && (
                  <p className="text-sm text-destructive">
                    {errors.twitter.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="instagram">Instagram</Label>
                <Input
                  id="instagram"
                  {...register("instagram")}
                  placeholder="https://instagram.com/yourcompany"
                  className={cn({
                    "border-destructive focus:border-destructive":
                      errors.instagram,
                  })}
                />
                {errors.instagram && (
                  <p className="text-sm text-destructive">
                    {errors.instagram.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="linkedin">LinkedIn</Label>
                <Input
                  id="linkedin"
                  {...register("linkedin")}
                  placeholder="https://linkedin.com/company/yourcompany"
                  className={cn({
                    "border-destructive focus:border-destructive":
                      errors.linkedin,
                  })}
                />
                {errors.linkedin && (
                  <p className="text-sm text-destructive">
                    {errors.linkedin.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="youtube">YouTube</Label>
                <Input
                  id="youtube"
                  {...register("youtube")}
                  placeholder="https://youtube.com/yourcompany"
                  className={cn({
                    "border-destructive focus:border-destructive":
                      errors.youtube,
                  })}
                />
                {errors.youtube && (
                  <p className="text-sm text-destructive">
                    {errors.youtube.message}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => reset()}
            disabled={isLoading || !isDirty}
          >
            Reset Changes
          </Button>

          <Button
            type="submit"
            disabled={isLoading || !isDirty}
            className="min-w-[120px]"
          >
            {isLoading && (
              <Icon
                icon="heroicons:arrow-path"
                className="mr-2 h-4 w-4 animate-spin"
              />
            )}
            {generalSettings ? "Update Settings" : "Create Settings"}
          </Button>
        </div>
      </form>
    </div>
  );
}
