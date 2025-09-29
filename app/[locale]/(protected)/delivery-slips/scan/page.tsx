"use client";
import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
  parcelDetails?: any;
  message?: string;
  error?: string;
}

interface ScanSession {
  slipId: string | null;
  scannedCodes: string[];
  results: ScanResult[];
  startTime: Date;
}

const ScannerDeliverySlipsPageContent = () => {
  const { hasPermission } = useAuthStore();
  const {
    deliverySlips,
    currentDeliverySlip,
    fetchDeliverySlips,
    fetchDeliverySlipById,
    scanParcelIntoSlip,
    addParcelsToSlip,
  } = useDeliverySlipsStore();

  const [scanInput, setScanInput] = useState("");
  const [selectedSlipId, setSelectedSlipId] = useState<string>("");
  const [scanSession, setScanSession] = useState<ScanSession>({
    slipId: null,
    scannedCodes: [],
    results: [],
    startTime: new Date(),
  });
  const [isScanning, setIsScanning] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string>("");
  const [lastScanResult, setLastScanResult] = useState<ScanResult | null>(null);

  const scanInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const canScanSlips = hasPermission(PARCELS_PERMISSIONS.DELIVERY_SLIPS_SCAN);

  // Load delivery slips on mount
  useEffect(() => {
    if (canScanSlips) {
      fetchDeliverySlips();
    }
  }, [canScanSlips, fetchDeliverySlips]);

  // Auto-focus scan input
  useEffect(() => {
    const focusInput = () => {
      if (scanInputRef.current && !showCamera) {
        scanInputRef.current.focus();
      }
    };

    focusInput();
    const interval = setInterval(focusInput, 1000);
    return () => clearInterval(interval);
  }, [showCamera, selectedSlipId]);

  // Load selected slip details
  useEffect(() => {
    if (selectedSlipId) {
      fetchDeliverySlipById(selectedSlipId);
      setScanSession((prev) => ({
        ...prev,
        slipId: selectedSlipId,
        startTime: new Date(),
      }));
    }
  }, [selectedSlipId, fetchDeliverySlipById]);

  const handleSlipSelection = (slipId: string) => {
    setSelectedSlipId(slipId);
    // Clear previous session data
    setScanSession({
      slipId,
      scannedCodes: [],
      results: [],
      startTime: new Date(),
    });
    setLastScanResult(null);
  };

  const processScan = async (code: string) => {
    if (!code.trim() || !selectedSlipId) return;

    // Check if already scanned
    if (scanSession.scannedCodes.includes(code)) {
      toast.warning("This parcel has already been scanned");
      return;
    }

    setIsScanning(true);

    try {
      // First, try to add the parcel to the slip
      const success = await addParcelsToSlip(selectedSlipId, {
        parcelIds: [code], // Assuming code can be used as ID or needs validation
        markAsScanned: true,
        comment: "Scanned via scanner interface",
      });

      const result: ScanResult = {
        success,
        code,
        message: success ? "Parcel added successfully" : "Failed to add parcel",
        error: success ? undefined : "Parcel not found or invalid",
      };

      // Update session
      setScanSession((prev) => ({
        ...prev,
        scannedCodes: [...prev.scannedCodes, code],
        results: [result, ...prev.results],
      }));

      setLastScanResult(result);

      if (success) {
        toast.success(`Parcel ${code} scanned successfully`);
        // Refresh slip data
        fetchDeliverySlipById(selectedSlipId);
      } else {
        toast.error(`Failed to scan parcel ${code}`);
      }
    } catch (error) {
      const result: ScanResult = {
        success: false,
        code,
        error: error instanceof Error ? error.message : "Unknown error",
      };

      setScanSession((prev) => ({
        ...prev,
        scannedCodes: [...prev.scannedCodes, code],
        results: [result, ...prev.results],
      }));

      setLastScanResult(result);
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

  const startCamera = async () => {
    try {
      setCameraError("");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
      setShowCamera(true);
    } catch (error) {
      console.error("Camera access error:", error);
      setCameraError("Unable to access camera. Please check permissions.");
      setShowCamera(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  const resetSession = () => {
    setScanSession({
      slipId: selectedSlipId,
      scannedCodes: [],
      results: [],
      startTime: new Date(),
    });
    setLastScanResult(null);
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

  const pendingSlips = deliverySlips.filter(
    (slip) => slip.status === DeliverySlipStatus.PENDING
  );

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-default-900">
            Delivery Slip Scanner
          </h1>
          <p className="text-default-600">
            Scan parcels into delivery slips using barcode or QR codes
          </p>
        </div>
        <Link href="/delivery-slips">
          <Button variant="outline">
            <Icon icon="heroicons:arrow-left" className="w-4 h-4 mr-2" />
            Back to Delivery Slips
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Scanner */}
        <div className="lg:col-span-2 space-y-6">
          {/* Slip Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon icon="heroicons:document-text" className="w-5 h-5" />
                Select Delivery Slip
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Choose delivery slip to scan into:</Label>
                <Select
                  value={selectedSlipId}
                  onValueChange={handleSlipSelection}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a delivery slip" />
                  </SelectTrigger>
                  <SelectContent>
                    {pendingSlips.map((slip) => (
                      <SelectItem key={slip.id} value={slip.id}>
                        <div className="flex items-center gap-2">
                          <span>{slip.reference}</span>
                          <Badge color="primary" className="text-xs">
                            {slip.summary.totalParcels} parcels
                          </Badge>
                          {slip.city && (
                            <Badge color="secondary" className="text-xs">
                              {slip.city.name}
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {pendingSlips.length === 0 && (
                <Alert color="warning">
                  <Icon
                    icon="heroicons:exclamation-triangle"
                    className="h-4 w-4"
                  />
                  <AlertDescription>
                    No pending delivery slips found. Create a delivery slip
                    first.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Scanner Interface */}
          {selectedSlipId && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon icon="heroicons:qr-code" className="w-5 h-5" />
                    Scanner Interface
                  </div>
                  <div className="flex gap-2">
                    {!showCamera && (
                      <Button size="sm" variant="outline" onClick={startCamera}>
                        <Icon
                          icon="heroicons:camera"
                          className="w-4 h-4 mr-2"
                        />
                        Use Camera
                      </Button>
                    )}
                    {scanSession.results.length > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={resetSession}
                      >
                        <Icon
                          icon="heroicons:arrow-path"
                          className="w-4 h-4 mr-2"
                        />
                        Reset Session
                      </Button>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Manual Input */}
                <div className="space-y-2">
                  <Label>Manual scan or barcode input:</Label>
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

                {/* Last Scan Result */}
                {lastScanResult && (
                  <Alert
                    color={lastScanResult.success ? "success" : "destructive"}
                  >
                    <Icon
                      icon={
                        lastScanResult.success
                          ? "heroicons:check-circle"
                          : "heroicons:x-circle"
                      }
                      className="h-4 w-4"
                    />
                    <AlertDescription>
                      <strong>{lastScanResult.code}:</strong>{" "}
                      {lastScanResult.message || lastScanResult.error}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Instructions */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">
                    Scanning Instructions:
                  </h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Click in the input field above before scanning</li>
                    <li>• Use a barcode scanner/gun to scan parcel codes</li>
                    <li>• Or click "Use Camera" for mobile/webcam scanning</li>
                    <li>• Press Enter or click + to manually add codes</li>
                    <li>
                      • Scanned parcels will be automatically added to the slip
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Scan Results */}
          {scanSession.results.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon icon="heroicons:list-bullet" className="w-5 h-5" />
                  Scan Results ({scanSession.results.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {scanSession.results.map((result, index) => (
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
                          {result.parcelDetails && (
                            <div className="text-xs text-muted-foreground">
                              {result.parcelDetails.recipientName}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {result.success ? result.message : result.error}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Current Slip Info */}
          {currentDeliverySlip && selectedSlipId === currentDeliverySlip.id && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon icon="heroicons:document-text" className="w-5 h-5" />
                  Current Slip
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Reference:</span>
                    <code className="font-medium">
                      {currentDeliverySlip.reference}
                    </code>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total parcels:</span>
                    <span className="font-medium">
                      {currentDeliverySlip.summary.totalParcels}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Scanned:</span>
                    <span className="font-medium text-green-600">
                      {currentDeliverySlip.summary.scannedParcels}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Pending:</span>
                    <span className="font-medium text-yellow-600">
                      {currentDeliverySlip.summary.unscannedParcels}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm border-t pt-2">
                    <span>Total value:</span>
                    <span className="font-medium">
                      {currentDeliverySlip.summary.totalValue.toFixed(2)} DH
                    </span>
                  </div>
                </div>

                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
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
          )}

          {/* Session Stats */}
          {scanSession.results.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon icon="heroicons:chart-bar" className="w-5 h-5" />
                  Session Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Scans attempted:</span>
                    <span className="font-medium">
                      {scanSession.results.length}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Successful:</span>
                    <span className="font-medium text-green-600">
                      {scanSession.results.filter((r) => r.success).length}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Failed:</span>
                    <span className="font-medium text-red-600">
                      {scanSession.results.filter((r) => !r.success).length}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Success rate:</span>
                    <span className="font-medium">
                      {scanSession.results.length > 0
                        ? Math.round(
                            (scanSession.results.filter((r) => r.success)
                              .length /
                              scanSession.results.length) *
                              100
                          )
                        : 0}
                      %
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon icon="heroicons:bolt" className="w-5 h-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/delivery-slips/create">
                <Button variant="outline" className="w-full">
                  <Icon icon="heroicons:plus" className="w-4 h-4 mr-2" />
                  Create New Slip
                </Button>
              </Link>

              {selectedSlipId && (
                <Link href={`/delivery-slips/${selectedSlipId}`}>
                  <Button variant="outline" className="w-full">
                    <Icon icon="heroicons:eye" className="w-4 h-4 mr-2" />
                    View Slip Details
                  </Button>
                </Link>
              )}

              <Link href="/delivery-slips">
                <Button variant="outline" className="w-full">
                  <Icon icon="heroicons:list-bullet" className="w-4 h-4 mr-2" />
                  All Delivery Slips
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Camera Modal */}
      <Dialog open={showCamera} onOpenChange={stopCamera}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Camera Scanner</DialogTitle>
            <DialogDescription>
              Position the barcode or QR code within the camera frame
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {cameraError ? (
              <Alert color="destructive">
                <Icon
                  icon="heroicons:exclamation-triangle"
                  className="h-4 w-4"
                />
                <AlertDescription>{cameraError}</AlertDescription>
              </Alert>
            ) : (
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-64 bg-black rounded-lg"
                />
                {/* Overlay for scan area */}
                <div className="absolute inset-0 border-2 border-primary border-dashed rounded-lg opacity-50 pointer-events-none" />
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={stopCamera}>
                Close Camera
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Main component wrapped with ProtectedRoute
const ScannerDeliverySlipsPage = () => {
  return (
    <ProtectedRoute
      requiredPermissions={[PARCELS_PERMISSIONS.DELIVERY_SLIPS_SCAN]}
      requiredAccessLevel="LIMITED"
      allowedAccountStatuses={["ACTIVE"]}
    >
      <ScannerDeliverySlipsPageContent />
    </ProtectedRoute>
  );
};

export default ScannerDeliverySlipsPage;
