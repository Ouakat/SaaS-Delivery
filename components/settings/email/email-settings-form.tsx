"use client";
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Icon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useEmailSettingsStore } from "@/lib/stores/settings/email-settings.store";
import { toast } from "sonner";
import { cn } from "@/lib/utils/ui.utils";

// Form schema
const emailSettingsSchema = z.object({
  enabled: z.boolean(),
  fromName: z.string().min(1, "From name is required"),
  fromEmail: z.string().email("Please enter a valid email address"),
  smtpHost: z.string().min(1, "SMTP host is required"),
  smtpPort: z.number().min(1).max(65535, "Port must be between 1 and 65535"),
  smtpUser: z.string().min(1, "SMTP username is required"),
  smtpPass: z.string().optional(),
});

type EmailSettingsFormData = z.infer<typeof emailSettingsSchema>;

const EmailSettingsForm: React.FC = () => {
  const {
    emailSettings,
    settingsLoading,
    settingsError,
    fetchEmailSettings,
    updateEmailSettings,
    testSmtpConnection,
    sendTestEmail,
  } = useEmailSettingsStore();

  const [showPassword, setShowPassword] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState("");
  const [lastTested, setLastTested] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty, isSubmitting },
    reset,
  } = useForm<EmailSettingsFormData>({
    resolver: zodResolver(emailSettingsSchema),
    defaultValues: {
      enabled: false,
      fromName: "",
      fromEmail: "",
      smtpHost: "",
      smtpPort: 587,
      smtpUser: "",
      smtpPass: "",
    },
  });

  const enabled = watch("enabled");

  // Load settings on component mount
  useEffect(() => {
    fetchEmailSettings();
  }, [fetchEmailSettings]);

  // Update form when settings are loaded
  useEffect(() => {
    if (emailSettings) {
      reset({
        enabled: emailSettings.enabled,
        fromName: emailSettings.fromName,
        fromEmail: emailSettings.fromEmail,
        smtpHost: emailSettings.smtpHost,
        smtpPort: emailSettings.smtpPort,
        smtpUser: emailSettings.smtpUser,
        smtpPass: "", // Never pre-fill password for security
      });
    }
  }, [emailSettings, reset]);

  const onSubmit = async (data: EmailSettingsFormData) => {
    const success = await updateEmailSettings(data);
    if (success) {
      // Reset isDirty state by updating form with saved data
      reset(data);
    }
  };

  const handleTestConnection = async () => {
    if (!enabled) {
      toast.error("Please enable email settings first");
      return;
    }

    setTestingConnection(true);
    const success = await testSmtpConnection();
    if (success) {
      setLastTested(new Date().toLocaleString());
    }
    setTestingConnection(false);
  };

  const handleSendTestEmail = async () => {
    if (!testEmailAddress) {
      toast.error("Please enter a test email address");
      return;
    }

    if (!enabled) {
      toast.error("Please enable email settings first");
      return;
    }

    setTestingEmail(true);
    const success = await sendTestEmail({
      to: testEmailAddress,
      subject: "Test Email from Settings",
      textContent:
        "This is a test email to verify your email configuration is working correctly.",
      htmlContent: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Test Email</h2>
          <p>This is a test email to verify your email configuration is working correctly.</p>
          <p>If you received this email, your SMTP settings are configured properly.</p>
          <hr>
          <small>Sent from Email Settings Configuration</small>
        </div>
      `,
    });

    if (success) {
      setTestEmailAddress("");
    }
    setTestingEmail(false);
  };

  const getPortHelperText = (port: number) => {
    const portInfo = {
      25: "Standard SMTP (usually blocked by ISPs)",
      465: "SMTP over SSL/TLS",
      587: "SMTP with STARTTLS (recommended)",
      993: "IMAP over SSL",
      995: "POP3 over SSL",
    };
    return portInfo[port as keyof typeof portInfo] || "";
  };

  const getConnectionStatus = () => {
    if (!emailSettings?.enabled) {
      return { status: "disabled", label: "Disabled", color: "secondary" };
    }

    if (!lastTested) {
      return { status: "unknown", label: "Not Tested", color: "primary" };
    }

    return { status: "tested", label: "Connection Tested", color: "default" };
  };

  const connectionStatus = getConnectionStatus();

  return (
    <div className="space-y-6">
      {/* Status Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold">Email Settings</h2>
          <p className="text-muted-foreground">
            Configure SMTP settings for sending emails from your application
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge color={connectionStatus.color}>{connectionStatus.label}</Badge>
          {lastTested && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Icon
                    icon="heroicons:information-circle"
                    className="h-4 w-4 text-muted-foreground"
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Last tested: {lastTested}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {settingsError && (
        <Alert color="destructive">
          <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
          <AlertDescription>{settingsError}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon icon="heroicons:cog-6-tooth" className="w-5 h-5" />
              Basic Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Enable Email */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enabled">Enable Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Turn on email functionality for your application
                </p>
              </div>
              <Switch
                id="enabled"
                {...register("enabled")}
                checked={enabled}
                onCheckedChange={(checked) =>
                  setValue("enabled", checked, { shouldDirty: true })
                }
              />
            </div>

            {enabled && (
              <>
                {/* From Name and Email */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="fromName"
                      className={cn({ "text-destructive": errors.fromName })}
                    >
                      From Name *
                    </Label>
                    <Input
                      id="fromName"
                      {...register("fromName")}
                      placeholder="Your Company Name"
                      className={cn({ "border-destructive": errors.fromName })}
                    />
                    {errors.fromName && (
                      <p className="text-xs text-destructive">
                        {errors.fromName.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="fromEmail"
                      className={cn({ "text-destructive": errors.fromEmail })}
                    >
                      From Email *
                    </Label>
                    <Input
                      id="fromEmail"
                      type="email"
                      {...register("fromEmail")}
                      placeholder="no-reply@yourcompany.com"
                      className={cn({ "border-destructive": errors.fromEmail })}
                    />
                    {errors.fromEmail && (
                      <p className="text-xs text-destructive">
                        {errors.fromEmail.message}
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* SMTP Configuration */}
        {enabled && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon icon="heroicons:server" className="w-5 h-5" />
                SMTP Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* SMTP Host and Port */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <Label
                    htmlFor="smtpHost"
                    className={cn({ "text-destructive": errors.smtpHost })}
                  >
                    SMTP Host *
                  </Label>
                  <Input
                    id="smtpHost"
                    {...register("smtpHost")}
                    placeholder="smtp.gmail.com"
                    className={cn({ "border-destructive": errors.smtpHost })}
                  />
                  {errors.smtpHost && (
                    <p className="text-xs text-destructive">
                      {errors.smtpHost.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="smtpPort"
                    className={cn({ "text-destructive": errors.smtpPort })}
                  >
                    SMTP Port *
                  </Label>
                  <Input
                    id="smtpPort"
                    type="number"
                    {...register("smtpPort", { valueAsNumber: true })}
                    placeholder="587"
                    className={cn({ "border-destructive": errors.smtpPort })}
                  />
                  {watch("smtpPort") && (
                    <p className="text-xs text-muted-foreground">
                      {getPortHelperText(watch("smtpPort"))}
                    </p>
                  )}
                  {errors.smtpPort && (
                    <p className="text-xs text-destructive">
                      {errors.smtpPort.message}
                    </p>
                  )}
                </div>
              </div>

              {/* SMTP Credentials */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="smtpUser"
                    className={cn({ "text-destructive": errors.smtpUser })}
                  >
                    SMTP Username *
                  </Label>
                  <Input
                    id="smtpUser"
                    {...register("smtpUser")}
                    placeholder="your-email@gmail.com"
                    className={cn({ "border-destructive": errors.smtpUser })}
                  />
                  {errors.smtpUser && (
                    <p className="text-xs text-destructive">
                      {errors.smtpUser.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="smtpPass"
                      className={cn({ "text-destructive": errors.smtpPass })}
                    >
                      SMTP Password
                    </Label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  <Input
                    id="smtpPass"
                    type={showPassword ? "text" : "password"}
                    {...register("smtpPass")}
                    placeholder={
                      emailSettings?.smtpPass ? "••••••••" : "Enter password"
                    }
                    className={cn({ "border-destructive": errors.smtpPass })}
                  />
                  {errors.smtpPass && (
                    <p className="text-xs text-destructive">
                      {errors.smtpPass.message}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Leave empty to keep existing password unchanged
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Testing Section */}
        {enabled && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon icon="heroicons:beaker" className="w-5 h-5" />
                Test Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Test Connection */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <h4 className="font-medium">Test SMTP Connection</h4>
                  <p className="text-sm text-muted-foreground">
                    Verify that your SMTP settings are correct
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={testingConnection}
                >
                  {testingConnection && (
                    <Icon
                      icon="heroicons:arrow-path"
                      className="mr-2 h-4 w-4 animate-spin"
                    />
                  )}
                  Test Connection
                </Button>
              </div>

              {/* Send Test Email */}
              <div className="p-4 border rounded-lg space-y-3">
                <div>
                  <h4 className="font-medium">Send Test Email</h4>
                  <p className="text-sm text-muted-foreground">
                    Send a test email to verify everything is working
                  </p>
                </div>
                <div className="flex gap-2">
                  <Input
                    value={testEmailAddress}
                    onChange={(e) => setTestEmailAddress(e.target.value)}
                    placeholder="test@example.com"
                    type="email"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSendTestEmail}
                    disabled={testingEmail || !testEmailAddress}
                  >
                    {testingEmail && (
                      <Icon
                        icon="heroicons:arrow-path"
                        className="mr-2 h-4 w-4 animate-spin"
                      />
                    )}
                    Send Test
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
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
            disabled={isSubmitting || !isDirty || settingsLoading}
          >
            {isSubmitting && (
              <Icon
                icon="heroicons:arrow-path"
                className="mr-2 h-4 w-4 animate-spin"
              />
            )}
            Save Settings
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EmailSettingsForm;
