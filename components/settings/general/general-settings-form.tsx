"use client";
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSettingsStore } from "@/lib/stores/settings.store";
import { toast } from "sonner";

const generalSettingsSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  website: z
    .string()
    .url("Please enter a valid URL")
    .optional()
    .or(z.literal("")),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().min(1, "Phone is required"),
  address: z.string().min(1, "Address is required"),
  currencySymbol: z.string().min(1, "Currency symbol is required"),
});

type GeneralSettingsFormData = z.infer<typeof generalSettingsSchema>;

export default function GeneralSettingsForm() {
  const { generalSettings, updateGeneralSettings, isLoading } =
    useSettingsStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GeneralSettingsFormData>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: {
      companyName: generalSettings?.companyName || "",
      website: generalSettings?.website || "",
      email: generalSettings?.email || "",
      phone: generalSettings?.phone || "",
      address: generalSettings?.address || "",
      currencySymbol: generalSettings?.currencySymbol || "$",
    },
  });

  const onSubmit = async (data: GeneralSettingsFormData) => {
    const success = await updateGeneralSettings(data);
    if (success) {
      toast.success("Settings updated successfully");
    } else {
      toast.error("Failed to update settings");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>General Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="companyName">Company Name *</Label>
              <Input
                id="companyName"
                {...register("companyName")}
                className={errors.companyName ? "border-red-500" : ""}
              />
              {errors.companyName && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.companyName.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                {...register("website")}
                placeholder="https://example.com"
                className={errors.website ? "border-red-500" : ""}
              />
              {errors.website && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.website.message}
                </p>
              )}
            </div>

            {/* Add other fields... */}
          </div>

          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Settings"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
