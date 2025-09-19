"use client";

import React, { useRef, useState, useCallback } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSettingsStore } from "@/lib/stores/settings/settings.store";
import { FILE_UPLOAD_CONFIG } from "@/lib/constants/settings";
import { toast } from "sonner";

interface FileUploadProps {
  type: "logo" | "favicon";
  currentUrl?: string;
  onUploadSuccess?: (url: string) => void;
}

export function BrandingUpload({
  type,
  currentUrl,
  onUploadSuccess,
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const { uploadLogo, uploadFavicon, isUploading } = useSettingsStore();

  const config = FILE_UPLOAD_CONFIG[type];
  const isLogo = type === "logo";

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > config.maxSize) {
      const maxSizeMB = (config.maxSize / (1024 * 1024)).toFixed(1);
      return `File size must be less than ${maxSizeMB}MB`;
    }

    // Check file type
    if (!config.acceptedTypes.includes(file.type)) {
      return `Only ${config.acceptedTypes
        .join(", ")
        .replace("image/", "")
        .toUpperCase()} files are allowed`;
    }

    return null;
  };

  const handleFileUpload = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      const url = isLogo ? await uploadLogo(file) : await uploadFavicon(file);

      if (url) {
        toast.success(`${isLogo ? "Logo" : "Favicon"} uploaded successfully!`);
        setPreview(null);
        onUploadSuccess?.(url);
      } else {
        toast.error(`Failed to upload ${type}`);
      }
    } catch (error) {
      toast.error(`Error uploading ${type}`);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const file = files[0];

    if (file) {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      handleFileUpload(file);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const displayImage = preview || currentUrl;
  const maxSizeMB = (config.maxSize / (1024 * 1024)).toFixed(1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon
            icon={isLogo ? "heroicons:photo" : "heroicons:star"}
            className="w-5 h-5"
          />
          {isLogo ? "Company Logo" : "Favicon"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Image Display */}
        {displayImage && (
          <div className="flex justify-center p-4 border rounded-lg bg-gray-50">
            <div className={`relative ${isLogo ? "max-w-xs" : "w-16 h-16"}`}>
              <Image
                src={displayImage}
                alt={isLogo ? "Company Logo" : "Favicon"}
                width={isLogo ? 200 : 64}
                height={isLogo ? 100 : 64}
                className={`${
                  isLogo
                    ? "max-h-24 w-auto object-contain"
                    : "w-16 h-16 object-contain"
                } rounded border`}
              />
              {preview && (
                <div className="absolute -top-2 -right-2">
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                    Preview
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Upload Area */}
        <div
          className={`
            relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
            transition-all duration-200
            ${
              dragOver
                ? "border-primary bg-primary/5"
                : "border-gray-300 hover:border-gray-400"
            }
            ${isUploading ? "opacity-50 pointer-events-none" : ""}
          `}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={openFileDialog}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={config.acceptedTypes.join(",")}
            onChange={handleFileSelect}
            className="hidden"
          />

          {isUploading ? (
            <div className="flex items-center justify-center space-x-2">
              <Icon
                icon="heroicons:arrow-path"
                className="w-6 h-6 animate-spin text-primary"
              />
              <span className="text-sm text-gray-600">Uploading...</span>
            </div>
          ) : (
            <>
              <Icon
                icon="heroicons:cloud-arrow-up"
                className="w-12 h-12 mx-auto text-gray-400 mb-4"
              />
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-900">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-gray-500">
                  {config.acceptedTypes
                    .map((type) => type.replace("image/", "").toUpperCase())
                    .join(", ")}{" "}
                  up to {maxSizeMB}MB
                </p>
              </div>
            </>
          )}
        </div>

        {/* File Requirements */}
        <Alert color="default">
          <Icon icon="heroicons:information-circle" className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1 text-xs">
              <p>
                <strong>Requirements:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>Maximum size: {maxSizeMB}MB</li>
                <li>
                  Formats:{" "}
                  {config.acceptedTypes
                    .map((type) => type.replace("image/", "").toUpperCase())
                    .join(", ")}
                </li>
                {isLogo ? (
                  <>
                    <li>Recommended: 400x200px or similar ratio</li>
                    <li>Transparent background preferred</li>
                  </>
                ) : (
                  <>
                    <li>Size: 16x16, 32x32, or 64x64 pixels</li>
                    <li>Square format required</li>
                  </>
                )}
              </ul>
            </div>
          </AlertDescription>
        </Alert>

        {/* Actions */}
        {currentUrl && (
          <div className="flex justify-between items-center pt-4 border-t">
            <span className="text-sm text-gray-500">
              Current {type} uploaded
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={openFileDialog}
              disabled={isUploading}
            >
              <Icon icon="heroicons:arrow-path" className="w-4 h-4 mr-2" />
              Replace
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Complete Branding Management Component
export default function BrandingManagement() {
  const { generalSettings, resetBranding, isLoading } = useSettingsStore();

  const handleResetBranding = async () => {
    if (
      confirm(
        "Are you sure you want to reset all branding assets? This action cannot be undone."
      )
    ) {
      const success = await resetBranding();
      if (success) {
        toast.success("Branding assets reset successfully!");
      } else {
        toast.error("Failed to reset branding assets.");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Logo Upload */}
        <BrandingUpload
          type="logo"
          currentUrl={generalSettings?.logo}
          onUploadSuccess={(url) => {
            console.log("Logo uploaded:", url);
          }}
        />

        {/* Favicon Upload */}
        <BrandingUpload
          type="favicon"
          currentUrl={generalSettings?.favicon}
          onUploadSuccess={(url) => {
            console.log("Favicon uploaded:", url);
          }}
        />
      </div>

      {/* Reset Branding */}
      {(generalSettings?.logo || generalSettings?.favicon) && (
        <Card className="border-destructive/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Icon icon="heroicons:exclamation-triangle" className="w-5 h-5" />
              Reset Branding
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Remove all uploaded branding assets and reset to default. This
              action cannot be undone.
            </p>
            <Button
              color="destructive"
              size="sm"
              onClick={handleResetBranding}
              disabled={isLoading}
            >
              {isLoading && (
                <Icon
                  icon="heroicons:arrow-path"
                  className="mr-2 h-4 w-4 animate-spin"
                />
              )}
              Reset All Branding
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
