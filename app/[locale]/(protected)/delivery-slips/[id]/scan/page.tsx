"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "@/i18n/routing";
import { useDeliverySlipsStore } from "@/lib/stores/parcels/delivery-slips.store";
import { useAuthStore } from "@/lib/stores/auth/auth.store";
import { ProtectedRoute } from "@/components/route/protected-route";
import { PARCELS_PERMISSIONS } from "@/lib/constants/parcels";
import { DeliverySlipStatus } from "@/lib/types/parcels/delivery-slips.types";
import { toast } from "sonner";
import { cn } from "@/lib/utils/ui.utils";

interface ScanResult {
  success: boolean;
  code: string;
  timestamp: Date;
  message?: string;
  error?: string;
}

const ScanSpecificSlipPageContent = () => {
  const router = useRouter();
  const params = useParams();
  const slipId = params?.id as string;

  const { hasPermission } = useAuthStore();
  const {
    currentDeliverySlip,
    fetchDeliverySlipById,
    addParcelsToSlip,
    isLoading,
    error,
  } = useDeliverySlipsStore();

  const [scanInput, setScanInput] = useState("");
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [sessionStats, setSessionStats] = useState({
    totalScans: 0,
    successfulScans: 0,
    failedScans: 0,
    startTime: new Date(),
  });

  const scanInputRef = useRef<HTMLInputElement>(null);

  const canScanSlips = hasPermission(PARCELS_PERMISSIONS.DELIVERY_SLIPS_SCAN);

  // Load delivery slip data
  useEffect(() => {
    if (canScanSlips && slipId) {
      fetchDeliverySlipById(slipId);
    }
  }, [canScanSlips, slipId, fetchDeliverySlipById]);

  // Auto-focus scan input
  useEffect(() => {
    const focusInput = () => {
      if (scanInputRef.current) {
        scanInputRef.current.focus();
      }
    };

    focusInput();
    const interval = setInterval(focusInput, 1000);
    return () => clearInterval(interval);
  }, []);

  const processScan = async (code: string) => {
    if (!code.trim() || !currentDeliverySlip) return;

    // Check if already scanned
    if (scanResults.some((result) => result.code === code)) {
      toast.warning("This parcel has already been scanned");
      return;
    }

    setIsScanning(true);

    try {
      const success = await addParcelsToSlip(currentDeliverySlip.id, {
        parcelIds: [code], // This might need adjustment based on your API
        markAsScanned: true,
        comment: "Scanned via dedicated slip scanner",
      });

      const result: ScanResult = {
        success,
        code,
        timestamp: new Date(),
        message: success ? "Parcel added successfully" : "Failed to add parcel",
        error: success ? undefined : "Parcel not found or invalid",
      };

      setScanResults((prev) => [result, ...prev]);
      setSessionStats((prev) => ({
        ...prev,
        totalScans: prev.totalScans + 1,
        successfulScans: success
          ? prev.successfulScans + 1
          : prev.successfulScans,
        failedScans: !success ? prev.failedScans + 1 : prev.failedScans,
      }));

      if (success) {
        toast.success(`Parcel ${code} scanned successfully`);
        // Refresh slip data
        fetchDeliverySlipById(currentDeliverySlip.id);
      } else {
        toast.error(`Failed to scan parcel ${code}`);
      }
    } catch (error) {
      const result: ScanResult = {
        success: false,
        code,
        timestamp: new Date(),
        error: error instanceof Error ? error.message : "Unknown error",
      };

      setScanResults((prev) => [result, ...prev]);
      setSessionStats((prev) => ({
        ...prev,
        totalScans: prev.totalScans + 1,
        failedScans: prev.failedScans + 1,
      }));

      toast.error(`Error scanning ${code}: ${result.error}`);
    } finally {
      setIsScanning(false);
      setScanInput("");
    }
  };

  const handleManualScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (scanInput.trim()) {
      processScan(scanInput.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (scanInput.trim()) {
        processScan(scanInput.trim());
      }
    }
  };

  const clearSession = () => {
    setScanResults([]);
    setSessionStats({
      totalScans: 0,
      successfulScans: 0,
      failedScans: 0,
      startTime: new Date(),
    });
    setScanInput("");
  };

  if (!canScanSlips) {
    return (
      <div className="container mx-auto py-8">
        <Alert color="destructive">
          <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to scan delivery slips. Please contact
            your administrator.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center justify-center space-x-2">
              <Icon
                icon="heroicons:arrow-path"
                className="w-5 h-5 animate-spin"
              />
              <span>Loading delivery slip...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentDeliverySlip || error) {
    return (
      <div className="container mx-auto py-8">
        <Alert color="destructive">
          <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
          <AlertDescription>
            {error || "Delivery slip not found or has been deleted."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const canModify = currentDeliverySlip.status === DeliverySlipStatus.PENDING;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-default-900">Scan Parcels</h1>
          <p className="text-default-600">
            {currentDeliverySlip.reference} • Scan parcels into this delivery
            slip
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/delivery-slips/${currentDeliverySlip.id}`}>
            <Button variant="outline">
              <Icon icon="heroicons:eye" className="w-4 h-4 mr-2" />
              View Details
            </Button>
          </Link>
          <Link href="/delivery-slips">
            <Button variant="outline">
              <Icon icon="heroicons:arrow-left" className="w-4 h-4 mr-2" />
              Back to List
            </Button>
          </Link>
        </div>
      </div>

      {/* Status Warning */}
      {!canModify && (
        <Alert color="warning">
          <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
          <AlertDescription>
            This delivery slip has status "{currentDeliverySlip.status}" and
            cannot be modified. Only pending slips can be scanned.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Scanner */}
        <div className="lg:col-span-2 space-y-6">
          {/* Slip Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon icon="heroicons:document-text" className="w-5 h-5" />
                Delivery Slip Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Reference</Label>
                  <p className="font-mono">{currentDeliverySlip.reference}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge color="secondary">{currentDeliverySlip.status}</Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Total Parcels</Label>
                  <p>{currentDeliverySlip.summary.totalParcels}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Scanned Parcels</Label>
                  <p className="text-green-600">
                    {currentDeliverySlip.summary.scannedParcels} /{" "}
                    {currentDeliverySlip.summary.totalParcels}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Scan Progress</span>
                  <span>
                    {Math.round(
                      (currentDeliverySlip.summary.scannedParcels /
                        currentDeliverySlip.summary.totalParcels) *
                        100
                    )}
                    %
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{
                      width: `${
                        (currentDeliverySlip.summary.scannedParcels /
                          currentDeliverySlip.summary.totalParcels) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Scanner Interface */}
          {canModify && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon icon="heroicons:qr-code" className="w-5 h-5" />
                  Scanner Interface
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Scan or enter parcel code:</Label>
                  <form onSubmit={handleManualScan} className="flex gap-2">
                    <Input
                      ref={scanInputRef}
                      value={scanInput}
                      onChange={(e) => setScanInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Click here before scanning or type parcel code..."
                      className="flex-1 font-mono"
                      disabled={isScanning}
                      autoComplete="off"
                    />
                    <Button
                      type="submit"
                      disabled={!scanInput.trim() || isScanning}
                    >
                      {isScanning ? (
                        <Icon
                          icon="heroicons:arrow-path"
                          className="w-4 h-4 animate-spin"
                        />
                      ) : (
                        <Icon icon="heroicons:plus" className="w-4 h-4" />
                      )}
                    </Button>
                  </form>
                </div>

                {/* Instructions */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">
                    Scanning Instructions:
                  </h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Click in the input field above before scanning</li>
                    <li>• Use a barcode scanner to scan parcel codes</li>
                    <li>• Press Enter or click + to manually add codes</li>
                    <li>• Each successful scan adds the parcel to this slip</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Scan Results */}
          {scanResults.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Icon icon="heroicons:list-bullet" className="w-5 h-5" />
                    Scan Results ({scanResults.length})
                  </CardTitle>
                  <Button size="sm" variant="outline" onClick={clearSession}>
                    <Icon icon="heroicons:trash" className="w-4 h-4 mr-2" />
                    Clear Session
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {scanResults.map((result, index) => (
                    <div
                      key={index}
                      className={cn(
                        "flex items-center justify-between p-3 border rounded-lg",
                        result.success
                          ? "bg-green-50 border-green-200"
                          : "bg-red-50 border-red-200"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          icon={
                            result.success
                              ? "heroicons:check-circle"
                              : "heroicons:x-circle"
                          }
                          className={cn(
                            "w-5 h-5",
                            result.success ? "text-green-600" : "text-red-600"
                          )}
                        />
                        <div>
                          <code className="text-sm font-medium">
                            {result.code}
                          </code>
                          <div className="text-xs text-muted-foreground">
                            {result.timestamp.toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs">
                        {result.success ? result.message : result.error}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Current Parcels */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon icon="heroicons:cube" className="w-5 h-5" />
                Current Parcels ({currentDeliverySlip.items.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {currentDeliverySlip.items.length === 0 ? (
                  <div className="text-center py-8">
                    <Icon
                      icon="heroicons:inbox"
                      className="w-12 h-12 text-muted-foreground mx-auto mb-4"
                    />
                    <p className="text-muted-foreground">
                      No parcels in this delivery slip yet
                    </p>
                  </div>
                ) : (
                  currentDeliverySlip.items.map((item) => (
                    <div
                      key={item.parcelId}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {item.scanned ? (
                          <Icon
                            icon="heroicons:check-circle"
                            className="w-5 h-5 text-green-600"
                          />
                        ) : (
                          <Icon
                            icon="heroicons:clock"
                            className="w-5 h-5 text-yellow-600"
                          />
                        )}
                        <div>
                          <code className="text-sm font-medium">
                            {item.parcel.code}
                          </code>
                          <div className="text-xs text-muted-foreground">
                            {item.parcel.recipientName} •{" "}
                            {item.parcel.recipientPhone}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge color="primary" className="text-xs">
                          {item.parcel.price.toFixed(2)} DH
                        </Badge>
                        <div className="text-xs text-muted-foreground">
                          To: {item.parcel.destinationCity}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Session Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon icon="heroicons:chart-bar" className="w-5 h-5" />
                Session Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Total scans:
                  </span>
                  <span className="font-medium">{sessionStats.totalScans}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Successful:
                  </span>
                  <span className="font-medium text-green-600">
                    {sessionStats.successfulScans}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Failed:</span>
                  <span className="font-medium text-red-600">
                    {sessionStats.failedScans}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Success rate:
                  </span>
                  <span className="font-medium">
                    {sessionStats.totalScans > 0
                      ? Math.round(
                          (sessionStats.successfulScans /
                            sessionStats.totalScans) *
                            100
                        )
                      : 0}
                    %
                  </span>
                </div>
                <div className="flex justify-between text-xs border-t pt-2">
                  <span className="text-muted-foreground">
                    Session started:
                  </span>
                  <span>{sessionStats.startTime.toLocaleTimeString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Slip Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon
                  icon="heroicons:clipboard-document-list"
                  className="w-5 h-5"
                />
                Slip Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Reference:
                  </span>
                  <code className="text-sm font-medium">
                    {currentDeliverySlip.reference}
                  </code>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <Badge color="secondary">{currentDeliverySlip.status}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">City:</span>
                  <span className="text-sm">
                    {currentDeliverySlip.city?.name || "Not specified"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Total value:
                  </span>
                  <span className="font-medium">
                    {currentDeliverySlip.summary.totalValue.toFixed(2)} DH
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon icon="heroicons:bolt" className="w-5 h-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href={`/delivery-slips/${currentDeliverySlip.id}`}>
                <Button variant="outline" className="w-full">
                  <Icon icon="heroicons:eye" className="w-4 h-4 mr-2" />
                  View Slip Details
                </Button>
              </Link>

              {canModify && (
                <Link href={`/delivery-slips/${currentDeliverySlip.id}/edit`}>
                  <Button variant="outline" className="w-full">
                    <Icon icon="heroicons:pencil" className="w-4 h-4 mr-2" />
                    Edit Slip
                  </Button>
                </Link>
              )}

              <Link href="/delivery-slips/scan">
                <Button variant="outline" className="w-full">
                  <Icon icon="heroicons:qr-code" className="w-4 h-4 mr-2" />
                  General Scanner
                </Button>
              </Link>

              <Link href="/delivery-slips">
                <Button variant="outline" className="w-full">
                  <Icon icon="heroicons:list-bullet" className="w-4 h-4 mr-2" />
                  All Delivery Slips
                </Button>
              </Link>

              {canModify &&
                currentDeliverySlip.summary.unscannedParcels === 0 && (
                  <Button
                    className="w-full"
                    onClick={() => {
                      // Quick receive action
                      router.push(
                        `/delivery-slips/${currentDeliverySlip.id}?action=receive`
                      );
                    }}
                  >
                    <Icon icon="heroicons:check" className="w-4 h-4 mr-2" />
                    Mark as Received
                  </Button>
                )}
            </CardContent>
          </Card>

          {/* Help */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon
                  icon="heroicons:question-mark-circle"
                  className="w-5 h-5"
                />
                Scanning Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm space-y-2">
                <p className="font-medium">For best results:</p>
                <ul className="text-muted-foreground space-y-1 text-xs">
                  <li>• Keep the input field focused</li>
                  <li>• Scan codes one at a time</li>
                  <li>• Wait for confirmation before next scan</li>
                  <li>• Check scan results for any errors</li>
                </ul>
              </div>
              <div className="text-sm space-y-2">
                <p className="font-medium">Troubleshooting:</p>
                <ul className="text-muted-foreground space-y-1 text-xs">
                  <li>• Ensure parcels are not already in other slips</li>
                  <li>• Verify parcel codes are correct</li>
                  <li>• Contact support for persistent issues</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

// Main component wrapped with ProtectedRoute
const ScanSpecificSlipPage = () => {
  return (
    <ProtectedRoute
      requiredPermissions={[PARCELS_PERMISSIONS.DELIVERY_SLIPS_SCAN]}
      requiredAccessLevel="LIMITED"
      allowedAccountStatuses={["ACTIVE"]}
    >
      <ScanSpecificSlipPageContent />
    </ProtectedRoute>
  );
};

export default ScanSpecificSlipPage;
