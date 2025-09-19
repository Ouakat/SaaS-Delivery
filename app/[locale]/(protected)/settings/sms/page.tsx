"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "@/i18n/routing";
import { ProtectedRoute } from "@/components/route/protected-route";
import { SETTINGS_PERMISSIONS } from "@/lib/constants/settings";
import { smsSettingsApiClient } from "@/lib/api/clients/settings/sms-settings.client";
import { useAuthStore } from "@/lib/stores/auth/auth.store";
import { toast } from "sonner";
import { cn } from "@/lib/utils/ui.utils";
import type {
  SmsSettings,
  SmsUsageStats,
} from "@/lib/types/settings/sms.types";

const SmsSettingsPageContent = () => {
  const router = useRouter();
  const { hasPermission } = useAuthStore();

  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [settings, setSettings] = useState<SmsSettings | null>(null);
  const [usageStats, setUsageStats] = useState<SmsUsageStats | null>(null);
  const [balance, setBalance] = useState<{
    balance: number;
    lastUpdated: string;
  } | null>(null);

  // Dialog states
  const [rechargeDialog, setRechargeDialog] = useState(false);
  const [testDialog, setTestDialog] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState<number | string>("");
  const [rechargeReference, setRechargeReference] = useState("");
  const [testPhone, setTestPhone] = useState("");
  const [testMessage, setTestMessage] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    enabled: false,
    senderName: "",
    phonePrefix: "",
    apiKey: "",
    lowBalanceAlert: 100,
  });

  // Permissions
  const canManageSettings = hasPermission(SETTINGS_PERMISSIONS.MANAGE_SETTINGS);
  const canViewSettings = hasPermission(SETTINGS_PERMISSIONS.READ_SETTINGS);

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);

      const [settingsResult, statsResult, balanceResult] =
        await Promise.allSettled([
          smsSettingsApiClient.getSmsSettings(),
          smsSettingsApiClient.getSmsUsageStats(),
          smsSettingsApiClient.getSmsBalance(),
        ]);

      // Handle settings
      if (
        settingsResult.status === "fulfilled" &&
        settingsResult.value.success
      ) {
        const smsSettings = settingsResult.value.data;
        setSettings(smsSettings);
        setFormData({
          enabled: smsSettings?.enabled || false,
          senderName: smsSettings?.senderName || "",
          phonePrefix: smsSettings?.phonePrefix || "+212",
          apiKey: smsSettings?.apiKey || "",
          lowBalanceAlert: smsSettings?.lowBalanceAlert || 100,
        });
      }

      // Handle stats
      if (statsResult.status === "fulfilled" && statsResult.value.success) {
        setUsageStats(statsResult.value.data);
      }

      // Handle balance
      if (balanceResult.status === "fulfilled" && balanceResult.value.success) {
        setBalance(balanceResult.value.data);
      }
    } catch (error) {
      console.error("Error fetching SMS data:", error);
      toast.error("Failed to load SMS settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canViewSettings) {
      fetchData();
    }
  }, [canViewSettings]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canManageSettings) {
      toast.error("You don't have permission to update SMS settings");
      return;
    }

    setSaving(true);
    try {
      const result = await smsSettingsApiClient.updateSmsSettings(formData);

      if (result.success) {
        setSettings(result.data);
        toast.success("SMS settings updated successfully");
      } else {
        toast.error(result.error?.message || "Failed to update SMS settings");
      }
    } catch (error) {
      console.error("Error updating SMS settings:", error);
      toast.error("An error occurred while updating settings");
    } finally {
      setSaving(false);
    }
  };

  // Handle test SMS configuration
  const handleTestConfiguration = async () => {
    if (!canManageSettings) {
      toast.error("You don't have permission to test SMS configuration");
      return;
    }

    setTesting(true);
    try {
      const result = await smsSettingsApiClient.testSmsConfiguration();

      if (result.success && result.data?.success) {
        toast.success(result.data.message || "SMS configuration test passed");
      } else {
        toast.error(result.data?.message || "SMS configuration test failed");
      }
    } catch (error) {
      console.error("Error testing SMS configuration:", error);
      toast.error("Failed to test SMS configuration");
    } finally {
      setTesting(false);
    }
  };

  // Handle balance recharge
  const handleRecharge = async () => {
    if (!canManageSettings) {
      toast.error("You don't have permission to recharge SMS balance");
      return;
    }

    const amount = Number(rechargeAmount);
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setSaving(true);
    try {
      const result = await smsSettingsApiClient.rechargeSmsBalance({
        amount,
        reference: rechargeReference || undefined,
      });

      if (result.success) {
        setSettings(result.data);
        setBalance({
          balance: result.data.balance,
          lastUpdated: result.data.updatedAt,
        });
        toast.success(`SMS balance recharged with ${amount} credits`);
        setRechargeDialog(false);
        setRechargeAmount("");
        setRechargeReference("");
      } else {
        toast.error(result.error?.message || "Failed to recharge balance");
      }
    } catch (error) {
      console.error("Error recharging balance:", error);
      toast.error("An error occurred while recharging balance");
    } finally {
      setSaving(false);
    }
  };

  // Handle send test SMS
  const handleSendTestSms = async () => {
    if (!canManageSettings) {
      toast.error("You don't have permission to send test SMS");
      return;
    }

    if (!testPhone || !testMessage) {
      toast.error("Please enter phone number and message");
      return;
    }

    setTesting(true);
    try {
      const result = await smsSettingsApiClient.sendTestSms({
        customMessage: testMessage,
        phoneNumber: testPhone,
      });

      if (result.success && result.data?.success) {
        toast.success(result.data.message || "Test SMS sent successfully");
        setTestDialog(false);
        setTestPhone("");
        setTestMessage("");
      } else {
        toast.error(result.data?.message || "Failed to send test SMS");
      }
    } catch (error) {
      console.error("Error sending test SMS:", error);
      toast.error("Failed to send test SMS");
    } finally {
      setTesting(false);
    }
  };

  // Format balance display
  const formatBalance = (balance: number) => {
    return new Intl.NumberFormat().format(balance);
  };

  if (!canViewSettings) {
    return (
      <div className="container mx-auto py-8">
        <Alert color="destructive">
          <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to view SMS settings.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center space-x-2">
            <Icon
              icon="heroicons:arrow-path"
              className="w-5 h-5 animate-spin"
            />
            <span>Loading SMS settings...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-default-900">SMS Settings</h1>
          <p className="text-default-600">
            Configure SMS notifications and manage templates
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/settings/sms/templates">
            <Button variant="outline">
              <Icon icon="heroicons:document-text" className="w-4 h-4 mr-2" />
              SMS Templates
            </Button>
          </Link>
          <Link href="/settings">
            <Button variant="outline">
              <Icon icon="heroicons:arrow-left" className="w-4 h-4 mr-2" />
              Back to Settings
            </Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList>
          <TabsTrigger value="settings">Configuration</TabsTrigger>
          <TabsTrigger value="usage">Usage & Statistics</TabsTrigger>
          <TabsTrigger value="balance">Balance Management</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6">
          {/* SMS Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon
                  icon="heroicons:device-phone-mobile"
                  className="w-5 h-5"
                />
                SMS Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Enable SMS */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable SMS Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow the system to send SMS notifications
                    </p>
                  </div>
                  <Switch
                    checked={formData.enabled}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, enabled: checked }))
                    }
                    disabled={!canManageSettings}
                  />
                </div>

                {formData.enabled && (
                  <>
                    {/* Sender Name */}
                    <div className="space-y-2">
                      <Label htmlFor="senderName">Sender Name *</Label>
                      <Input
                        id="senderName"
                        value={formData.senderName}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            senderName: e.target.value,
                          }))
                        }
                        placeholder="Your Company Name"
                        disabled={!canManageSettings}
                        maxLength={11}
                      />
                      <p className="text-xs text-muted-foreground">
                        Maximum 11 characters. This will appear as the sender of
                        SMS messages.
                      </p>
                    </div>

                    {/* Phone Prefix */}
                    <div className="space-y-2">
                      <Label htmlFor="phonePrefix">Phone Prefix *</Label>
                      <Input
                        id="phonePrefix"
                        value={formData.phonePrefix}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            phonePrefix: e.target.value,
                          }))
                        }
                        placeholder="+212"
                        disabled={!canManageSettings}
                      />
                      <p className="text-xs text-muted-foreground">
                        Default country code for phone numbers (e.g., +212 for
                        Morocco)
                      </p>
                    </div>

                    {/* API Key */}
                    <div className="space-y-2">
                      <Label htmlFor="apiKey">SMS API Key</Label>
                      <Input
                        id="apiKey"
                        type="password"
                        value={formData.apiKey}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            apiKey: e.target.value,
                          }))
                        }
                        placeholder="Your SMS provider API key"
                        disabled={!canManageSettings}
                      />
                      <p className="text-xs text-muted-foreground">
                        API key from your SMS service provider. Keep this
                        secure.
                      </p>
                    </div>

                    {/* Low Balance Alert */}
                    <div className="space-y-2">
                      <Label htmlFor="lowBalanceAlert">
                        Low Balance Alert Threshold
                      </Label>
                      <Input
                        id="lowBalanceAlert"
                        type="number"
                        value={formData.lowBalanceAlert}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            lowBalanceAlert: Number(e.target.value),
                          }))
                        }
                        min="0"
                        step="1"
                        disabled={!canManageSettings}
                      />
                      <p className="text-xs text-muted-foreground">
                        Receive alerts when SMS balance falls below this amount
                      </p>
                    </div>
                  </>
                )}

                {/* Action buttons */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-2">
                    {formData.enabled &&
                      formData.apiKey &&
                      canManageSettings && (
                        <>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleTestConfiguration}
                            disabled={testing}
                          >
                            {testing && (
                              <Icon
                                icon="heroicons:arrow-path"
                                className="w-4 h-4 mr-2 animate-spin"
                              />
                            )}
                            Test Configuration
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setTestDialog(true)}
                            disabled={testing}
                          >
                            <Icon
                              icon="heroicons:paper-airplane"
                              className="w-4 h-4 mr-2"
                            />
                            Send Test SMS
                          </Button>
                        </>
                      )}
                  </div>

                  {canManageSettings && (
                    <Button type="submit" disabled={saving}>
                      {saving && (
                        <Icon
                          icon="heroicons:arrow-path"
                          className="w-4 h-4 mr-2 animate-spin"
                        />
                      )}
                      Save Settings
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="space-y-6">
          {/* Usage Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      Total Sent
                    </p>
                    <p className="text-2xl font-bold">
                      {formatBalance(usageStats?.totalSent || 0)}
                    </p>
                  </div>
                  <Icon
                    icon="heroicons:chart-bar-square"
                    className="w-8 h-8 text-blue-500"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      This Month
                    </p>
                    <p className="text-2xl font-bold">
                      {formatBalance(usageStats?.thisMonth || 0)}
                    </p>
                  </div>
                  <Icon
                    icon="heroicons:calendar-days"
                    className="w-8 h-8 text-green-500"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      Success Rate
                    </p>
                    <p className="text-2xl font-bold">
                      {(usageStats?.successRate || 0).toFixed(1)}%
                    </p>
                  </div>
                  <Icon
                    icon="heroicons:check-circle"
                    className="w-8 h-8 text-green-500"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      Avg Cost
                    </p>
                    <p className="text-2xl font-bold">
                      {(usageStats?.averageCost || 0).toFixed(2)}
                    </p>
                  </div>
                  <Icon
                    icon="heroicons:currency-dollar"
                    className="w-8 h-8 text-orange-500"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="balance" className="space-y-6">
          {/* Balance Management */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon icon="heroicons:wallet" className="w-5 h-5" />
                  Current Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <div className="text-3xl font-bold text-primary">
                    {formatBalance(balance?.balance || settings?.balance || 0)}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    SMS Credits
                  </p>
                  {balance?.lastUpdated && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Updated:{" "}
                      {new Date(balance.lastUpdated).toLocaleDateString()}
                    </p>
                  )}
                </div>

                {/* Low balance warning */}
                {settings &&
                  balance &&
                  balance.balance < settings.lowBalanceAlert && (
                    <Alert color="warning" className="mt-4">
                      <Icon
                        icon="heroicons:exclamation-triangle"
                        className="h-4 w-4"
                      />
                      <AlertDescription>
                        Low balance! Consider recharging soon.
                      </AlertDescription>
                    </Alert>
                  )}

                {canManageSettings && (
                  <Button
                    className="w-full mt-4"
                    onClick={() => setRechargeDialog(true)}
                  >
                    <Icon icon="heroicons:plus" className="w-4 h-4 mr-2" />
                    Recharge Balance
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Balance Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Alert Threshold
                    </Label>
                    <p className="text-lg font-semibold">
                      {formatBalance(settings?.lowBalanceAlert || 0)} credits
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Status
                    </Label>
                    <div className="mt-1">
                      <Badge
                        color={
                          settings &&
                          balance &&
                          balance.balance < settings.lowBalanceAlert
                            ? "warning"
                            : "success"
                        }
                      >
                        {settings &&
                        balance &&
                        balance.balance < settings.lowBalanceAlert
                          ? "Low Balance"
                          : "Sufficient"}
                      </Badge>
                    </div>
                  </div>
                </div>

                <Alert color="info" variant="soft">
                  <Icon
                    icon="heroicons:information-circle"
                    className="h-4 w-4"
                  />
                  <AlertDescription>
                    <strong>SMS Credits Usage:</strong>
                    <br />
                    • 1 credit = 1 standard SMS (160 characters)
                    <br />
                    • Long messages use multiple credits
                    <br />• Delivery reports are free
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Recharge Dialog */}
      <Dialog open={rechargeDialog} onOpenChange={setRechargeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recharge SMS Balance</DialogTitle>
            <DialogDescription>
              Add credits to your SMS balance to continue sending notifications.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Amount (Credits) *</Label>
              <Input
                type="number"
                value={rechargeAmount}
                onChange={(e) => setRechargeAmount(e.target.value)}
                placeholder="1000"
                min="1"
                step="1"
              />
            </div>

            <div className="space-y-2">
              <Label>Reference (Optional)</Label>
              <Input
                value={rechargeReference}
                onChange={(e) => setRechargeReference(e.target.value)}
                placeholder="Payment reference or note"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRechargeDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleRecharge} disabled={saving}>
              {saving && (
                <Icon
                  icon="heroicons:arrow-path"
                  className="w-4 h-4 mr-2 animate-spin"
                />
              )}
              Recharge Balance
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Test SMS Dialog */}
      <Dialog open={testDialog} onOpenChange={setTestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Test SMS</DialogTitle>
            <DialogDescription>
              Send a test SMS to verify your configuration is working.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Phone Number *</Label>
              <Input
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="+212123456789"
              />
            </div>

            <div className="space-y-2">
              <Label>Message *</Label>
              <Textarea
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                placeholder="Test message from your SMS system"
                rows={3}
                maxLength={160}
              />
              <p className="text-xs text-muted-foreground">
                {testMessage.length}/160 characters
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTestDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendTestSms} disabled={testing}>
              {testing && (
                <Icon
                  icon="heroicons:arrow-path"
                  className="w-4 h-4 mr-2 animate-spin"
                />
              )}
              Send Test SMS
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const SmsSettingsPage = () => {
  return (
    <ProtectedRoute
      requiredPermissions={[SETTINGS_PERMISSIONS.READ_SETTINGS]}
      requiredAccessLevel="FULL"
    >
      <SmsSettingsPageContent />
    </ProtectedRoute>
  );
};

export default SmsSettingsPage;
