"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { useEmailSettingsStore } from "@/lib/stores/settings/email-settings.store";
import { emailSettingsApiClient } from "@/lib/api/clients/settings/email-settings.client";
import {
  EMAIL_TEMPLATE_CATEGORIES,
  COMMON_PLACEHOLDERS,
} from "@/lib/types/settings/email.types";
import type {
  EmailTemplate,
  EmailTemplateCategory,
  CreateEmailTemplateRequest,
  UpdateEmailTemplateRequest,
} from "@/lib/types/settings/email.types";
import { toast } from "sonner";
import { cn } from "@/lib/utils/ui.utils";

// Form schema
const templateSchema = z.object({
  category: z.enum([
    "PARCEL",
    "INVOICE",
    "CUSTOMER",
    "NOTIFICATION",
    "MARKETING",
    "SYSTEM",
  ]),
  name: z.string().min(1, "Template name is required"),
  subject: z.string().min(1, "Subject is required"),
  htmlContent: z.string().min(1, "HTML content is required"),
  textContent: z.string().min(1, "Text content is required"),
  placeholders: z.array(z.string()).optional(),
  enabled: z.boolean().optional(),
});

type TemplateFormData = z.infer<typeof templateSchema>;

interface EmailTemplateFormProps {
  template?: EmailTemplate;
  mode: "create" | "edit";
}

// Rich text editor placeholder (you might want to integrate a proper editor)
const SimpleRichTextEditor: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}> = ({ value, onChange, placeholder }) => {
  const [activeTab, setActiveTab] = useState<"visual" | "source">("visual");

  const insertPlaceholder = (placeholder: string) => {
    onChange(value + placeholder);
  };

  return (
    <div className="space-y-2">
      <Tabs
        value={activeTab}
        onValueChange={(tab) => setActiveTab(tab as "visual" | "source")}
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="visual">Visual</TabsTrigger>
          <TabsTrigger value="source">HTML Source</TabsTrigger>
        </TabsList>
        <TabsContent value="visual" className="space-y-2">
          <div className="flex flex-wrap gap-1 p-2 border rounded bg-muted">
            {COMMON_PLACEHOLDERS.slice(0, 8).map((placeholder) => (
              <Button
                key={placeholder}
                type="button"
                variant="outline"
                size="md"
                onClick={() => insertPlaceholder(placeholder)}
                className="h-6 text-xs"
              >
                {placeholder}
              </Button>
            ))}
          </div>
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="min-h-[200px] font-mono text-sm"
          />
        </TabsContent>
        <TabsContent value="source">
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="min-h-[300px] font-mono text-sm"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Preview Component
const PreviewPane: React.FC<{
  subject: string;
  htmlContent: string;
  textContent: string;
  placeholders: string[];
}> = ({ subject, htmlContent, textContent, placeholders }) => {
  const [previewData, setPreviewData] = useState<{
    subject: string;
    htmlContent: string;
    textContent: string;
  } | null>(null);
  const [sampleValues, setSampleValues] = useState<Record<string, string>>({});

  useEffect(() => {
    // Generate sample values for placeholders
    const samples: Record<string, string> = {};
    placeholders.forEach((placeholder) => {
      switch (placeholder) {
        case "{COMPANY_NAME}":
          samples[placeholder] = "ACME Corporation";
          break;
        case "{CLIENT_NAME}":
          samples[placeholder] = "John Doe";
          break;
        case "{TRACKING_NUMBER}":
          samples[placeholder] = "TRK123456789";
          break;
        case "{AMOUNT}":
          samples[placeholder] = "$125.50";
          break;
        case "{DATE}":
          samples[placeholder] = new Date().toLocaleDateString();
          break;
        case "{INVOICE_REF}":
          samples[placeholder] = "INV-2024-001";
          break;
        default:
          samples[placeholder] = "Sample Value";
      }
    });
    setSampleValues(samples);
  }, [placeholders]);

  useEffect(() => {
    // Replace placeholders with sample values
    let processedSubject = subject;
    let processedHtml = htmlContent;
    let processedText = textContent;

    Object.entries(sampleValues).forEach(([placeholder, value]) => {
      processedSubject = processedSubject.replace(
        new RegExp(placeholder, "g"),
        value
      );
      processedHtml = processedHtml.replace(
        new RegExp(placeholder, "g"),
        value
      );
      processedText = processedText.replace(
        new RegExp(placeholder, "g"),
        value
      );
    });

    setPreviewData({
      subject: processedSubject,
      htmlContent: processedHtml,
      textContent: processedText,
    });
  }, [subject, htmlContent, textContent, sampleValues]);

  if (!previewData) return null;

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-medium text-sm mb-2">Subject Preview</h4>
        <div className="p-3 bg-muted rounded border text-sm">
          {previewData.subject || "No subject"}
        </div>
      </div>

      <div>
        <h4 className="font-medium text-sm mb-2">HTML Preview</h4>
        <div className="border rounded overflow-hidden">
          <iframe
            srcDoc={previewData.htmlContent || "<p>No HTML content</p>"}
            className="w-full h-64"
            title="HTML Preview"
            sandbox="allow-same-origin"
          />
        </div>
      </div>

      <div>
        <h4 className="font-medium text-sm mb-2">Text Preview</h4>
        <div className="p-3 bg-muted rounded border text-sm whitespace-pre-wrap max-h-32 overflow-y-auto">
          {previewData.textContent || "No text content"}
        </div>
      </div>
    </div>
  );
};

const EmailTemplateForm: React.FC<EmailTemplateFormProps> = ({
  template,
  mode,
}) => {
  const router = useRouter();
  const { createEmailTemplate, updateEmailTemplate } = useEmailSettingsStore();

  const [validationResult, setValidationResult] = useState<any>(null);
  const [validating, setValidating] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty, isSubmitting },
    reset,
  } = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      category: "PARCEL",
      name: "",
      subject: "",
      htmlContent: "",
      textContent: "",
      placeholders: [],
      enabled: true,
    },
  });

  const {
    fields: placeholderFields,
    append: addPlaceholder,
    remove: removePlaceholder,
  } = useFieldArray({
    control,
    name: "placeholders",
  });

  const watchedValues = watch();

  // Load template data for edit mode
  useEffect(() => {
    if (template && mode === "edit") {
      reset({
        category: template.category,
        name: template.name,
        subject: template.subject,
        htmlContent: template.htmlContent,
        textContent: template.textContent,
        placeholders: template.placeholders,
        enabled: template.enabled,
      });
    }
  }, [template, mode, reset]);

  // Auto-extract placeholders from content
  useEffect(() => {
    const extractPlaceholders = () => {
      const placeholderRegex = /\{[A-Z_]+\}/g;
      const content = `${watchedValues.subject} ${watchedValues.htmlContent} ${watchedValues.textContent}`;
      const found = content.match(placeholderRegex) || [];
      const unique = [...new Set(found)];

      // Update placeholders if different
      const current = watchedValues.placeholders || [];
      if (JSON.stringify(unique.sort()) !== JSON.stringify(current.sort())) {
        setValue("placeholders", unique, { shouldDirty: true });
      }
    };

    const timer = setTimeout(extractPlaceholders, 500);
    return () => clearTimeout(timer);
  }, [
    watchedValues.subject,
    watchedValues.htmlContent,
    watchedValues.textContent,
    setValue,
    watchedValues.placeholders,
  ]);

  const validateTemplate = useCallback(async () => {
    if (
      !watchedValues.subject ||
      !watchedValues.htmlContent ||
      !watchedValues.textContent
    ) {
      return;
    }

    setValidating(true);
    try {
      const response = await emailSettingsApiClient.validateTemplate({
        subject: watchedValues.subject,
        htmlContent: watchedValues.htmlContent,
        textContent: watchedValues.textContent,
        placeholders: watchedValues.placeholders || [],
      });

      if (response.success) {
        setValidationResult(response.data);
      }
    } catch (error) {
      console.error("Template validation failed:", error);
    } finally {
      setValidating(false);
    }
  }, [watchedValues]);

  // Debounced validation
  useEffect(() => {
    const timer = setTimeout(validateTemplate, 1000);
    return () => clearTimeout(timer);
  }, [validateTemplate]);

  const onSubmit = async (data: TemplateFormData) => {
    let success = false;

    if (mode === "create") {
      success = await createEmailTemplate(data as CreateEmailTemplateRequest);
    } else if (template) {
      success = await updateEmailTemplate(
        template.id,
        data as UpdateEmailTemplateRequest
      );
    }

    if (success) {
      router.push("/settings/email/templates");
    }
  };

  const insertCommonPlaceholder = (placeholder: string) => {
    const currentPlaceholders = watchedValues.placeholders || [];
    if (!currentPlaceholders.includes(placeholder)) {
      setValue("placeholders", [...currentPlaceholders, placeholder], {
        shouldDirty: true,
      });
    }

    // Also insert into current content
    const currentHtml = watchedValues.htmlContent || "";
    setValue("htmlContent", currentHtml + placeholder, { shouldDirty: true });
  };

  const categoryConfig = EMAIL_TEMPLATE_CATEGORIES[watchedValues.category];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {mode === "create"
              ? "Create Email Template"
              : "Edit Email Template"}
          </h2>
          <p className="text-muted-foreground">
            {mode === "create"
              ? "Design a new email template for automated notifications"
              : `Editing: ${template?.name}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Icon icon="heroicons:eye" className="w-4 h-4 mr-2" />
                Preview
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Template Preview</DialogTitle>
                <DialogDescription>
                  Preview of how your template will look with sample data
                </DialogDescription>
              </DialogHeader>
              <PreviewPane
                subject={watchedValues.subject}
                htmlContent={watchedValues.htmlContent}
                textContent={watchedValues.textContent}
                placeholders={watchedValues.placeholders || []}
              />
            </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            onClick={() => router.push("/settings/email/templates")}
          >
            Cancel
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon
                    icon="heroicons:information-circle"
                    className="w-5 h-5"
                  />
                  Template Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Category and Name */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      className={cn({ "text-destructive": errors.category })}
                    >
                      Category *
                    </Label>
                    <Select
                      value={watchedValues.category}
                      onValueChange={(value) =>
                        setValue("category", value as EmailTemplateCategory, {
                          shouldDirty: true,
                        })
                      }
                    >
                      <SelectTrigger
                        className={cn({
                          "border-destructive": errors.category,
                        })}
                      >
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(EMAIL_TEMPLATE_CATEGORIES).map(
                          ([key, config]) => (
                            <SelectItem key={key} value={key}>
                              <div className="flex items-center gap-2">
                                <Icon icon={config.icon} className="w-4 h-4" />
                                <div>
                                  <div className="font-medium">
                                    {config.label}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {config.description}
                                  </div>
                                </div>
                              </div>
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                    {errors.category && (
                      <p className="text-xs text-destructive">
                        {errors.category.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="name"
                      className={cn({ "text-destructive": errors.name })}
                    >
                      Template Name *
                    </Label>
                    <Input
                      id="name"
                      {...register("name")}
                      placeholder="Order Confirmation"
                      className={cn({ "border-destructive": errors.name })}
                    />
                    {errors.name && (
                      <p className="text-xs text-destructive">
                        {errors.name.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Subject */}
                <div className="space-y-2">
                  <Label
                    htmlFor="subject"
                    className={cn({ "text-destructive": errors.subject })}
                  >
                    Subject Line *
                  </Label>
                  <Input
                    id="subject"
                    {...register("subject")}
                    placeholder="Your order {TRACKING_NUMBER} has been confirmed"
                    className={cn({ "border-destructive": errors.subject })}
                  />
                  {errors.subject && (
                    <p className="text-xs text-destructive">
                      {errors.subject.message}
                    </p>
                  )}
                </div>

                {/* Enable/Disable */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Template</Label>
                    <p className="text-sm text-muted-foreground">
                      Whether this template can be used for sending emails
                    </p>
                  </div>
                  <Switch
                    {...register("enabled")}
                    checked={watchedValues.enabled}
                    onCheckedChange={(checked) =>
                      setValue("enabled", checked, { shouldDirty: true })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Content */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon icon="heroicons:document-text" className="w-5 h-5" />
                  Template Content
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* HTML Content */}
                <div className="space-y-2">
                  <Label
                    className={cn({ "text-destructive": errors.htmlContent })}
                  >
                    HTML Content *
                  </Label>
                  <SimpleRichTextEditor
                    value={watchedValues.htmlContent || ""}
                    onChange={(value) =>
                      setValue("htmlContent", value, { shouldDirty: true })
                    }
                    placeholder="Enter HTML content for the email..."
                  />
                  {errors.htmlContent && (
                    <p className="text-xs text-destructive">
                      {errors.htmlContent.message}
                    </p>
                  )}
                </div>

                {/* Text Content */}
                <div className="space-y-2">
                  <Label
                    htmlFor="textContent"
                    className={cn({ "text-destructive": errors.textContent })}
                  >
                    Text Content *
                  </Label>
                  <Textarea
                    id="textContent"
                    {...register("textContent")}
                    placeholder="Plain text version of the email content..."
                    className={cn("min-h-[100px]", {
                      "border-destructive": errors.textContent,
                    })}
                  />
                  {errors.textContent && (
                    <p className="text-xs text-destructive">
                      {errors.textContent.message}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Used as fallback for email clients that don't support HTML
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Category Info */}
            {categoryConfig && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon icon={categoryConfig.icon} className="w-5 h-5" />
                    {categoryConfig.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {categoryConfig.description}
                  </p>
                  {categoryConfig.defaultPlaceholders.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <h4 className="text-sm font-medium">
                        Suggested Placeholders
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {categoryConfig.defaultPlaceholders.map(
                          (placeholder) => (
                            <Button
                              key={placeholder}
                              type="button"
                              variant="outline"
                              size="md"
                              onClick={() =>
                                insertCommonPlaceholder(placeholder)
                              }
                              className="h-6 text-xs"
                            >
                              {placeholder}
                            </Button>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Placeholders */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon icon="heroicons:variable" className="w-5 h-5" />
                  Placeholders
                  {validating && (
                    <Icon
                      icon="heroicons:arrow-path"
                      className="w-4 h-4 animate-spin text-muted-foreground"
                    />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {watchedValues.placeholders &&
                watchedValues.placeholders.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {watchedValues.placeholders.map((placeholder, index) => (
                      <Badge key={index} color="primary" className="text-xs">
                        {placeholder}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No placeholders detected. Add placeholders like{" "}
                    {"{COMPANY_NAME}"} to your content.
                  </p>
                )}

                {/* Common Placeholders */}
                <div className="pt-3 border-t">
                  <h4 className="text-sm font-medium mb-2">Quick Insert</h4>
                  <div className="grid grid-cols-1 gap-1">
                    {COMMON_PLACEHOLDERS.slice(0, 6).map((placeholder) => (
                      <Button
                        key={placeholder}
                        type="button"
                        variant="ghost"
                        size="md"
                        onClick={() => insertCommonPlaceholder(placeholder)}
                        className="justify-start h-7 text-xs"
                      >
                        {placeholder}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Validation Results */}
            {validationResult && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon
                      icon={
                        validationResult.valid
                          ? "heroicons:check-circle"
                          : "heroicons:exclamation-triangle"
                      }
                      className={`w-5 h-5 ${
                        validationResult.valid
                          ? "text-green-600"
                          : "text-yellow-600"
                      }`}
                    />
                    Validation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {validationResult.errors.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-red-600 mb-1">
                        Errors
                      </h4>
                      {validationResult.errors.map(
                        (error: string, index: number) => (
                          <p key={index} className="text-xs text-red-600">
                            {error}
                          </p>
                        )
                      )}
                    </div>
                  )}

                  {validationResult.warnings.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-yellow-600 mb-1">
                        Warnings
                      </h4>
                      {validationResult.warnings.map(
                        (warning: string, index: number) => (
                          <p key={index} className="text-xs text-yellow-600">
                            {warning}
                          </p>
                        )
                      )}
                    </div>
                  )}

                  {validationResult.valid && (
                    <p className="text-sm text-green-600">Template is valid!</p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => reset()}
            disabled={isSubmitting || !isDirty}
          >
            Reset Changes
          </Button>
          <Button
            type="submit"
            disabled={
              isSubmitting || (validationResult && !validationResult.valid)
            }
          >
            {isSubmitting && (
              <Icon
                icon="heroicons:arrow-path"
                className="mr-2 h-4 w-4 animate-spin"
              />
            )}
            {mode === "create" ? "Create Template" : "Update Template"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EmailTemplateForm;
