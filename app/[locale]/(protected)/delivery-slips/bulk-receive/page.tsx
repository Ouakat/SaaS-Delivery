"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Link } from "@/i18n/routing";
import { useDeliverySlipsStore } from "@/lib/stores/parcels/delivery-slips.store";
import { useCitiesStore } from "@/lib/stores/parcels/cities.store";
import { useAuthStore } from "@/lib/stores/auth/auth.store";
import { ProtectedRoute } from "@/components/route/protected-route";
import { PARCELS_PERMISSIONS } from "@/lib/constants/parcels";
import { DeliverySlipStatus } from "@/lib/types/parcels/delivery-slips.types";
import { toast } from "sonner";
import { cn } from "@/lib/utils/ui.utils";

interface BulkReceiveData {
  slipIds: string[];
  notes: string;
  forceReceive: boolean;
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const BulkReceiveDeliverySlipsPageContent = () => {
  const { hasPermission } = useAuthStore();
  const { deliverySlips, fetchDeliverySlips, bulkAction, isLoading, error } =
    useDeliverySlipsStore();
  const { cities, fetchCities } = useCitiesStore();

  const [selectedSlips, setSelectedSlips] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [forceReceive, setForceReceive] = useState(false);
  const [filterCity, setFilterCity] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const canReceiveSlips = hasPermission(
    PARCELS_PERMISSIONS.DELIVERY_SLIPS_RECEIVE
  );
  const canBulkActions = hasPermission(PARCELS_PERMISSIONS.DELIVERY_SLIPS_BULK);

  // Load data on mount
  useEffect(() => {
    if (canReceiveSlips) {
      fetchDeliverySlips();
      fetchCities();
    }
  }, [canReceiveSlips, fetchDeliverySlips, fetchCities]);

  // Filter pending slips
  const pendingSlips = deliverySlips.filter(
    (slip) => slip.status === DeliverySlipStatus.PENDING
  );

  // Apply filters
  const filteredSlips = pendingSlips.filter((slip) => {
    const matchesSearch =
      slip.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      slip.items.some(
        (item) =>
          item.parcel.recipientName
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          item.parcel.recipientPhone.includes(searchTerm)
      );

    const matchesCity =
      filterCity === "all" ||
      slip.cityId === filterCity ||
      (!slip.cityId && filterCity === "none");

    return matchesSearch && matchesCity;
  });

  const handleSlipSelection = (slipId: string, checked: boolean) => {
    if (checked) {
      setSelectedSlips((prev) => [...prev, slipId]);
    } else {
      setSelectedSlips((prev) => prev.filter((id) => id !== slipId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedSlips(filteredSlips.map((slip) => slip.id));
    } else {
      setSelectedSlips([]);
    }
  };

  const getSlipStats = () => {
    const selectedSlipData = filteredSlips.filter((slip) =>
      selectedSlips.includes(slip.id)
    );

    return {
      totalSlips: selectedSlipData.length,
      totalParcels: selectedSlipData.reduce(
        (sum, slip) => sum + slip.summary.totalParcels,
        0
      ),
      totalValue: selectedSlipData.reduce(
        (sum, slip) => sum + slip.summary.totalValue,
        0
      ),
      unscannedParcels: selectedSlipData.reduce(
        (sum, slip) => sum + slip.summary.unscannedParcels,
        0
      ),
    };
  };

  const handleBulkReceive = async () => {
    if (selectedSlips.length === 0) {
      toast.error("Please select at least one delivery slip");
      return;
    }

    setIsProcessing(true);

    try {
      const success = await bulkAction({
        slipIds: selectedSlips,
        action: "RECEIVE",
        comment: notes || "Bulk received via bulk receive page",
      });

      if (success) {
        toast.success(
          `Successfully processed ${selectedSlips.length} delivery slips`
        );
        setSelectedSlips([]);
        setNotes("");
        setShowConfirmDialog(false);
        // Refresh data
        fetchDeliverySlips();
      }
    } catch (error) {
      toast.error("Failed to process bulk receive operation");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!canReceiveSlips || !canBulkActions) {
    return (
      <div className="container mx-auto py-8">
        <Alert color="destructive">
          <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to perform bulk receive operations. Please
            contact your administrator.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const stats = getSlipStats();

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-default-900">
            Bulk Receive Delivery Slips
          </h1>
          <p className="text-default-600">
            Process multiple delivery slips for bulk receiving operations
          </p>
        </div>
        <Link href="/delivery-slips">
          <Button variant="outline">
            <Icon icon="heroicons:arrow-left" className="w-4 h-4 mr-2" />
            Back to Delivery Slips
          </Button>
        </Link>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert color="destructive">
          <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon icon="heroicons:funnel" className="w-5 h-5" />
                Filters & Search
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Search delivery slips:</Label>
                  <Input
                    placeholder="Search by reference, customer name, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Filter by city:</Label>
                  <Select value={filterCity} onValueChange={setFilterCity}>
                    <SelectTrigger>
                      <SelectValue placeholder="All cities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All cities</SelectItem>
                      <SelectItem value="none">No city specified</SelectItem>
                      {cities
                        .filter((city) => city.pickupCity && city.status)
                        .map((city) => (
                          <SelectItem key={city.id} value={city.id}>
                            {city.name} ({city.ref})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Slips Selection */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Icon icon="heroicons:document-text" className="w-5 h-5" />
                  Select Delivery Slips ({filteredSlips.length})
                </CardTitle>
                <div className="flex items-center gap-2">
                  {selectedSlips.length > 0 && (
                    <Badge color="secondary">
                      {selectedSlips.length} selected
                    </Badge>
                  )}
                  {filteredSlips.length > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleSelectAll(
                          selectedSlips.length !== filteredSlips.length
                        )
                      }
                    >
                      {selectedSlips.length === filteredSlips.length
                        ? "Deselect All"
                        : "Select All"}
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredSlips.length === 0 ? (
                <div className="text-center py-8">
                  <Icon
                    icon="heroicons:document-text"
                    className="w-12 h-12 text-muted-foreground mx-auto mb-4"
                  />
                  <p className="text-muted-foreground">
                    {pendingSlips.length === 0
                      ? "No pending delivery slips found"
                      : "No delivery slips match your filters"}
                  </p>
                  {pendingSlips.length === 0 && (
                    <Link href="/delivery-slips/create">
                      <Button className="mt-4">
                        <Icon icon="heroicons:plus" className="w-4 h-4 mr-2" />
                        Create Delivery Slip
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={
                              filteredSlips.length > 0 &&
                              selectedSlips.length === filteredSlips.length
                            }
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>City</TableHead>
                        <TableHead>Parcels</TableHead>
                        <TableHead>Scanned</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Progress</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSlips.map((slip) => (
                        <TableRow key={slip.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedSlips.includes(slip.id)}
                              onCheckedChange={(checked) =>
                                handleSlipSelection(slip.id, checked as boolean)
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <div>
                              <code className="text-sm font-medium">
                                {slip.reference}
                              </code>
                              <Badge color="secondary" className="ml-2 text-xs">
                                {slip.status}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatDate(slip.createdAt)}
                          </TableCell>
                          <TableCell>
                            {slip.city ? (
                              <Badge color="primary" className="text-xs">
                                {slip.city.name}
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                Not specified
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <span className="font-medium">
                                {slip.summary.totalParcels}
                              </span>
                              <span className="text-muted-foreground">
                                {" "}
                                total
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <span className="font-medium text-green-600">
                                {slip.summary.scannedParcels}
                              </span>
                              {slip.summary.unscannedParcels > 0 && (
                                <span className="text-yellow-600">
                                  {" "}
                                  ({slip.summary.unscannedParcels} pending)
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge color="primary" className="text-xs">
                              {slip.summary.totalValue.toFixed(2)} DH
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-primary h-2 rounded-full"
                                  style={{
                                    width: `${
                                      slip.summary.totalParcels > 0
                                        ? (slip.summary.scannedParcels /
                                            slip.summary.totalParcels) *
                                          100
                                        : 0
                                    }%`,
                                  }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {slip.summary.totalParcels > 0
                                  ? Math.round(
                                      (slip.summary.scannedParcels /
                                        slip.summary.totalParcels) *
                                        100
                                    )
                                  : 0}
                                %
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bulk Action Settings */}
          {selectedSlips.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon icon="heroicons:cog-6-tooth" className="w-5 h-5" />
                  Bulk Receive Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Notes (Optional)</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add notes for this bulk receive operation..."
                    rows={3}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label>Force receive</Label>
                    <p className="text-xs text-muted-foreground">
                      Force receive even if some parcels are not scanned
                    </p>
                  </div>
                  <Checkbox
                    checked={forceReceive}
                    onCheckedChange={setForceReceive}
                  />
                </div>

                {stats.unscannedParcels > 0 && !forceReceive && (
                  <Alert color="warning">
                    <Icon
                      icon="heroicons:exclamation-triangle"
                      className="h-4 w-4"
                    />
                    <AlertDescription>
                      {stats.unscannedParcels} parcels across selected slips
                      have not been scanned. Enable "Force receive" to proceed
                      anyway.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowConfirmDialog(true)}
                    disabled={
                      isProcessing ||
                      (stats.unscannedParcels > 0 && !forceReceive)
                    }
                    className="flex-1"
                  >
                    {isProcessing ? (
                      <Icon
                        icon="heroicons:arrow-path"
                        className="mr-2 h-4 w-4 animate-spin"
                      />
                    ) : (
                      <Icon icon="heroicons:check" className="mr-2 h-4 w-4" />
                    )}
                    Receive {selectedSlips.length} Slip
                    {selectedSlips.length !== 1 ? "s" : ""}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedSlips([])}
                    disabled={isProcessing}
                  >
                    Clear Selection
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon
                  icon="heroicons:clipboard-document-list"
                  className="w-5 h-5"
                />
                Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Available slips:
                  </span>
                  <span className="font-medium">{pendingSlips.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Filtered slips:
                  </span>
                  <span className="font-medium">{filteredSlips.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Selected slips:
                  </span>
                  <span className="font-medium text-primary">
                    {selectedSlips.length}
                  </span>
                </div>

                {selectedSlips.length > 0 && (
                  <>
                    <div className="border-t pt-3 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          Total parcels:
                        </span>
                        <span className="font-medium">
                          {stats.totalParcels}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          Scanned parcels:
                        </span>
                        <span className="font-medium text-green-600">
                          {stats.totalParcels - stats.unscannedParcels}
                        </span>
                      </div>
                      {stats.unscannedParcels > 0 && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">
                            Unscanned parcels:
                          </span>
                          <span className="font-medium text-yellow-600">
                            {stats.unscannedParcels}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between border-t pt-2">
                        <span className="text-sm text-muted-foreground">
                          Total value:
                        </span>
                        <span className="font-medium">
                          {stats.totalValue.toFixed(2)} DH
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon icon="heroicons:chart-bar" className="w-5 h-5" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {pendingSlips.length}
                  </div>
                  <div className="text-xs text-blue-600">Pending</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {pendingSlips.reduce(
                      (sum, slip) => sum + slip.summary.totalParcels,
                      0
                    )}
                  </div>
                  <div className="text-xs text-green-600">Total Parcels</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Ready to receive:</span>
                  <span className="font-medium">
                    {
                      pendingSlips.filter(
                        (slip) => slip.summary.unscannedParcels === 0
                      ).length
                    }
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Need scanning:</span>
                  <span className="font-medium">
                    {
                      pendingSlips.filter(
                        (slip) => slip.summary.unscannedParcels > 0
                      ).length
                    }
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
              <Link href="/delivery-slips/scan">
                <Button variant="outline" className="w-full">
                  <Icon icon="heroicons:qr-code" className="w-4 h-4 mr-2" />
                  Scanner Interface
                </Button>
              </Link>

              <Link href="/delivery-slips/create">
                <Button variant="outline" className="w-full">
                  <Icon icon="heroicons:plus" className="w-4 h-4 mr-2" />
                  Create New Slip
                </Button>
              </Link>

              <Link href="/delivery-slips">
                <Button variant="outline" className="w-full">
                  <Icon icon="heroicons:list-bullet" className="w-4 h-4 mr-2" />
                  All Delivery Slips
                </Button>
              </Link>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setSelectedSlips([]);
                  setSearchTerm("");
                  setFilterCity("all");
                  setNotes("");
                  setForceReceive(false);
                }}
              >
                <Icon icon="heroicons:arrow-path" className="w-4 h-4 mr-2" />
                Reset All Filters
              </Button>
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
                Help
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm space-y-2">
                <p className="font-medium">Bulk Receive Process:</p>
                <ul className="text-muted-foreground space-y-1 text-xs">
                  <li>1. Filter and select delivery slips</li>
                  <li>2. Review unscanned parcels</li>
                  <li>3. Enable force receive if needed</li>
                  <li>4. Add notes and confirm operation</li>
                </ul>
              </div>
              <div className="text-sm space-y-2">
                <p className="font-medium">Best Practices:</p>
                <ul className="text-muted-foreground space-y-1 text-xs">
                  <li>• Scan all parcels before receiving</li>
                  <li>• Use force receive only when necessary</li>
                  <li>• Add meaningful notes for tracking</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Bulk Receive</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to mark {selectedSlips.length} delivery slip
              {selectedSlips.length !== 1 ? "s" : ""} as received. This will
              affect {stats.totalParcels} parcel
              {stats.totalParcels !== 1 ? "s" : ""} with a total value of{" "}
              {stats.totalValue.toFixed(2)} DH.
              {stats.unscannedParcels > 0 && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-sm text-yellow-800">
                    <strong>Warning:</strong> {stats.unscannedParcels} parcels
                    have not been scanned yet. They will be automatically marked
                    as scanned.
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkReceive}
              disabled={isProcessing}
            >
              {isProcessing && (
                <Icon
                  icon="heroicons:arrow-path"
                  className="mr-2 h-4 w-4 animate-spin"
                />
              )}
              Confirm Receive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// Main component wrapped with ProtectedRoute
const BulkReceiveDeliverySlipsPage = () => {
  return (
    <ProtectedRoute
      requiredPermissions={[
        PARCELS_PERMISSIONS.DELIVERY_SLIPS_RECEIVE,
        PARCELS_PERMISSIONS.DELIVERY_SLIPS_BULK,
      ]}
      requiredAccessLevel="LIMITED"
      allowedAccountStatuses={["ACTIVE"]}
    >
      <BulkReceiveDeliverySlipsPageContent />
    </ProtectedRoute>
  );
};

export default BulkReceiveDeliverySlipsPage;
