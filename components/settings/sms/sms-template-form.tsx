"use client";
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils/ui.utils";
import {
  SMS_PLACEHOLDERS,
  SMS_TEMPLATE_EXAMPLES,
} from "@/lib/types/settings/sms.types";
import type {
  SmsTemplate,
  CreateSmsTemplateRequest,
} from "@/lib/types/settings/sms.types";

// Form schema
const smsTemplateSchema = z.object({
  name: z
    .string()
    .min(1, "Template name is required")
    .max(100, "Name too long"),
  content: z
    .string()
    .min(1, "Template content is required")
    .max(1000, "Content too long"),
  status: z.boolean().default(true),
});

type SmsTemplateFormData = z.infer<typeof smsTemplateSchema>;

interface SmsTemplateFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateSmsTemplateRequest) => Promise<void>;
  title: string;
  submitLabel: string;
  initialData?: SmsTemplate | null;
}

const SmsTemplateForm: React.FC<SmsTemplateFormProps> = ({
  open,
  onOpenChange,
  onSubmit,
  title,
  submitLabel,
  initialData,
}) => {
  const [loading, setLoading] = useState(false);
  const [previewText, setPreviewText] = useState("");
  const [detectedPlaceholders, setDetectedPlaceholders] = useState<string[]>(
    []
  );
  const [showPreview, setShowPreview] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<SmsTemplateFormData>({
    resolver: zodResolver(smsTemplateSchema),
    defaultValues: {
      name: "",
      content: "",
      status: true,
    },
  });

  const watchedContent = watch("content");

  // Reset form when dialog opens/closes or initialData changes
  useEffect(() => {
    if (open) {
      if (initialData) {
        reset({
          name: initialData.name,
          content: initialData.content,
          status: initialData.status,
        });
      } else {
        reset({
          name: "",
          content: "",
          status: true,
        });
      }
    }
  }, [open, initialData, reset]);

  // Detect placeholders in content
  useEffect(() => {
    const placeholderRegex = /\{[^}]+\}/g;
    const matches = watchedContent?.match(placeholderRegex) || [];
    const unique = [...new Set(matches)];
    setDetectedPlaceholders(unique);

    // Generate preview with sample data
    if (watchedContent) {
      let preview = watchedContent;
      const sampleData: Record<string, string> = {
        "{CLIENT_NAME}": "John Doe",
        "{TRACKING_NUMBER}": "PKG123456789",
        "{COMPANY_NAME}": "Your Company",
        "{DELIVERY_DATE}": "Today",
        "{PICKUP_DATE}": "Tomorrow",
        "{DRIVER_NAME}": "Driver Name",
        "{DRIVER_PHONE}": "+1234567890",
        "{STATUS}": "In Transit",
        "{ADDRESS}": "123 Main St, City",
        "{AMOUNT}": "$25.50",
        "{REFERENCE}": "REF001",
      };

      Object.entries(sampleData).forEach(([placeholder, value]) => {
        preview = preview.replace(
          new RegExp(placeholder.replace(/[{}]/g, "\\$&"), "g"),
          value
        );
      });
      setPreviewText(preview);
    } else {
      setPreviewText("");
    }
  }, [watchedContent]);

  // Handle form submission
  const handleFormSubmit = async (data: SmsTemplateFormData) => {
    setLoading(true);
    try {
      await onSubmit({
        name: data.name,
        content: data.content,
        placeholders: detectedPlaceholders,
      });
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setLoading(false);
    }
  };

  // Insert placeholder into content
  const insertPlaceholder = (placeholder: string) => {
    const currentContent = watch("content") || "";
    const cursorPosition =
      (document.activeElement as HTMLTextAreaElement)?.selectionStart ||
      currentContent.length;
    const newContent =
      currentContent.slice(0, cursorPosition) +
      placeholder +
      currentContent.slice(cursorPosition);
    setValue("content", newContent);
  };

  // Insert template example
  const insertTemplate = (template: (typeof SMS_TEMPLATE_EXAMPLES)[0]) => {
    setValue("name", template.name);
    setValue("content", template.content);
  };

  // Character count for SMS
  const getCharacterCount = (content: string) => {
    const length = content.length;
    const smsCount = Math.ceil(length / 160);
    return { length, smsCount };
  };

  const { length: contentLength, smsCount } = getCharacterCount(
    watchedContent || ""
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Create SMS templates with dynamic placeholders for automated
            notifications.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Form Fields */}
              <div className="space-y-4">
                {/* Template Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Template Name *</Label>
                  <Input
                    id="name"
                    {...register("name")}
                    placeholder="Order Confirmation"
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

                {/* Template Content */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="content">Message Content *</Label>
                    <div className="text-xs text-muted-foreground">
                      {contentLength}/1000 chars • {smsCount} SMS
                    </div>
                  </div>
                  <Textarea
                    id="content"
                    {...register("content")}
                    placeholder="Hello {CLIENT_NAME}, your order {TRACKING_NUMBER} has been confirmed..."
                    rows={6}
                    className={cn("", {
                      "border-destructive focus:border-destructive":
                        errors.content,
                    })}
                  />
                  {errors.content && (
                    <p className="text-xs text-destructive">
                      {errors.content.message}
                    </p>
                  )}

                  {/* SMS Info */}
                  <Alert
                    color={smsCount > 1 ? "warning" : "info"}
                    variant="soft"
                  >
                    <Icon
                      icon="heroicons:information-circle"
                      className="h-4 w-4"
                    />
                    <AlertDescription>
                      {smsCount === 1
                        ? "This message fits in 1 SMS (160 characters max)"
                        : `This message will use ${smsCount} SMS credits (${contentLength} characters)`}
                    </AlertDescription>
                  </Alert>
                </div>

                {/* Status */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Template Status</Label>
                    <p className="text-sm text-muted-foreground">
                      Active templates can be used for sending SMS
                    </p>
                  </div>
                  <Switch {...register("status")} />
                </div>

                {/* Detected Placeholders */}
                {detectedPlaceholders.length > 0 && (
                  <div className="space-y-2">
                    <Label>Detected Placeholders</Label>
                    <div className="flex flex-wrap gap-1">
                      {detectedPlaceholders.map((placeholder) => (
                        <Badge key={placeholder} color="primary">
                          {placeholder}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Helper Panel */}
              <div className="space-y-4">
                {/* Available Placeholders */}
                <div className="space-y-2">
                  <Label>Available Placeholders</Label>
                  <div className="border rounded-lg p-3 max-h-48 overflow-y-auto">
                    <div className="grid grid-cols-1 gap-1">
                      {Object.entries(SMS_PLACEHOLDERS).map(([key, value]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => insertPlaceholder(value)}
                          className="flex items-center justify-between p-2 text-sm rounded hover:bg-muted transition-colors text-left"
                        >
                          <span className="font-mono text-xs">{value}</span>
                          <Icon
                            icon="heroicons:plus"
                            className="w-3 h-3 text-muted-foreground"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Template Examples */}
                <div className="space-y-2">
                  <Label>Template Examples</Label>
                  <div className="space-y-2">
                    {SMS_TEMPLATE_EXAMPLES.map((template, index) => (
                      <div key={index} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-medium">
                            {template.name}
                          </h4>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => insertTemplate(template)}
                          >
                            Use Template
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {template.content.substring(0, 80)}...
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Preview */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>Preview</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPreview(!showPreview)}
                    >
                      <Icon
                        icon={
                          showPreview ? "heroicons:eye-slash" : "heroicons:eye"
                        }
                        className="w-4 h-4"
                      />
                    </Button>
                  </div>

                  {showPreview && (
                    <div className="border rounded-lg p-3 bg-muted/30">
                      <div className="text-xs text-muted-foreground mb-1">
                        Preview with sample data:
                      </div>
                      <div className="text-sm">
                        {previewText ||
                          "Enter message content to see preview..."}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </form>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit(handleFormSubmit)}
            disabled={loading}
          >
            {loading && (
              <Icon
                icon="heroicons:arrow-path"
                className="w-4 h-4 mr-2 animate-spin"
              />
            )}
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SmsTemplateForm;
