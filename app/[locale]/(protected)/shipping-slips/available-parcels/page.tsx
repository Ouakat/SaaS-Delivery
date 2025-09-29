"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "@/i18n/routing";
import { useShippingSlipsStore } from "@/lib/stores/parcels/shipping-slips.store";
import { useZonesStore } from "@/lib/stores/parcels/zones.store";
import { useAuthStore } from "@/lib/stores/auth/auth.store";
import { ProtectedRoute } from "@/components/route/protected-route";
import { PARCELS_PERMISSIONS } from "@/lib/constants/parcels";
import { toast } from "sonner";
import { cn } from "@/lib/utils/ui.utils";

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const AvailableParcelsPageContent = () => {
  const { hasPermission } = useAuthStore();
  const {
    availableParcels,
    fetchAvailableParcels,
    createShippingSlip,
    isLoading,
    error,
  } = useShippingSlipsStore();

  const { zones, fetchZones } = useZonesStore();

  const [selectedZone, setSelectedZone] = useState<string>("");
  const [selectedParcels, setSelectedParcels] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  const canReadSlips = hasPermission(PARCELS_PERMISSIONS.SHIPPING_SLIPS_READ);
  const canCreateSlips = hasPermission(
    PARCELS_PERMISSIONS.SHIPPING_SLIPS_CREATE
  );

  // Initialize data
  useEffect(() => {
    if (canReadSlips) {
      fetchZones();
    }
  }, [canReadSlips, fetchZones]);

  // Fetch available parcels when zone changes
  useEffect(() => {
    if (selectedZone) {
      fetchAvailableParcels(selectedZone, searchTerm);
    }
  }, [selectedZone, searchTerm, fetchAvailableParcels]);

  const handleZoneSelection = (zoneId: string) => {
    setSelectedZone(zoneId);
    setSelectedParcels([]);
    setSearchTerm("");
    setPage(1);
  };

  const handleParcelSelection = (parcelId: string, checked: boolean) => {
    if (checked) {
      setSelectedParcels((prev) => [...prev, parcelId]);
    } else {
      setSelectedParcels((prev) => prev.filter((id) => id !== parcelId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedParcels(availableParcels.map((p) => p.id));
    } else {
      setSelectedParcels([]);
    }
  };

  const handleCreateSlip = async () => {
    if (!selectedZone || selectedParcels.length === 0) {
      toast.error("Please select a zone and at least one parcel");
      return;
    }

    const slip = await createShippingSlip({
      destinationZoneId: selectedZone,
      parcelIds: selectedParcels,
    });

    if (slip) {
      toast.success("Shipping slip created successfully");
      setSelectedParcels([]);
      // Refresh available parcels
      fetchAvailableParcels(selectedZone, searchTerm);
    }
  };

  if (!canReadSlips) {
    return (
      <div className="container mx-auto py-8">
        <Alert color="destructive">
          <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to view available parcels.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const selectedZoneData = zones.find((z) => z.id === selectedZone);
  const totalValue = availableParcels
    .filter((p) => selectedParcels.includes(p.id))
    .reduce((sum, p) => sum + Number(p.price), 0);

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-default-900">
            Available Parcels for Shipping
          </h1>
          <p className="text-default-600">
            View and select parcels ready for inter-zone transfer
          </p>
        </div>
        <Link href="/shipping-slips">
          <Button variant="outline">
            <Icon icon="heroicons:arrow-left" className="w-4 h-4 mr-2" />
            Back to Shipping Slips
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
          {/* Zone Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon icon="heroicons:map-pin" className="w-5 h-5" />
                Select Destination Zone
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Destination Zone</Label>
                <Select
                  value={selectedZone}
                  onValueChange={handleZoneSelection}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a destination zone" />
                  </SelectTrigger>
                  <SelectContent>
                    {zones
                      .filter((zone) => zone.status)
                      .map((zone) => (
                        <SelectItem key={zone.id} value={zone.id}>
                          {zone.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedZone && (
                <Alert color="info" variant="soft">
                  <Icon
                    icon="heroicons:information-circle"
                    className="h-4 w-4"
                  />
                  <AlertDescription>
                    Showing parcels with destination cities in{" "}
                    <strong>{selectedZoneData?.name}</strong> that are ready for
                    shipping (status: COLLECTED).
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Available Parcels Table */}
          {selectedZone && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Icon icon="heroicons:cube" className="w-5 h-5" />
                    Available Parcels ({availableParcels.length})
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {selectedParcels.length > 0 && (
                      <Badge color="primary">
                        {selectedParcels.length} selected
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search */}
                <div className="flex gap-4">
                  <Input
                    placeholder="Search by code, recipient name, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1"
                  />
                </div>

                {/* Table */}
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Icon
                      icon="heroicons:arrow-path"
                      className="w-6 h-6 animate-spin"
                    />
                  </div>
                ) : availableParcels.length === 0 ? (
                  <div className="text-center py-8">
                    <Icon
                      icon="heroicons:inbox"
                      className="w-12 h-12 text-muted-foreground mx-auto mb-4"
                    />
                    <p className="text-muted-foreground">
                      {searchTerm
                        ? "No parcels match your search"
                        : "No available parcels for this zone"}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <Checkbox
                              checked={
                                availableParcels.length > 0 &&
                                selectedParcels.length ===
                                  availableParcels.length
                              }
                              onCheckedChange={handleSelectAll}
                            />
                          </TableHead>
                          <TableHead>Code</TableHead>
                          <TableHead>Recipient</TableHead>
                          <TableHead>From → To</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {availableParcels.map((parcel) => (
                          <TableRow key={parcel.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedParcels.includes(parcel.id)}
                                onCheckedChange={(checked) =>
                                  handleParcelSelection(
                                    parcel.id,
                                    checked as boolean
                                  )
                                }
                              />
                            </TableCell>
                            <TableCell>
                              <code className="text-sm font-medium">
                                {parcel.code}
                              </code>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">
                                  {parcel.recipientName}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {parcel.recipientPhone}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 text-sm">
                                <Badge color="secondary" className="text-xs">
                                  {parcel.pickupCity.name}
                                </Badge>
                                <Icon
                                  icon="heroicons:arrow-right"
                                  className="w-4 h-4 text-muted-foreground"
                                />
                                <Badge color="primary" className="text-xs">
                                  {parcel.destinationCity.name}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge color="primary" className="text-xs">
                                {Number(parcel.price).toFixed(2)} DH
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              {formatDate(parcel.createdAt.toString())}
                            </TableCell>
                            <TableCell>
                              <Badge color="secondary" className="text-xs">
                                {parcel.parcelStatusCode}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
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
                Selection Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Available parcels:
                  </span>
                  <span className="font-medium">{availableParcels.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Selected parcels:
                  </span>
                  <span className="font-medium text-primary">
                    {selectedParcels.length}
                  </span>
                </div>
                {selectedParcels.length > 0 && (
                  <>
                    <div className="border-t pt-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          Total value:
                        </span>
                        <span className="font-medium">
                          {totalValue.toFixed(2)} DH
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {canCreateSlips && selectedParcels.length > 0 && (
                <div className="border-t pt-4 space-y-2">
                  <Button
                    onClick={handleCreateSlip}
                    disabled={!selectedZone || selectedParcels.length === 0}
                    className="w-full"
                  >
                    <Icon icon="heroicons:plus" className="w-4 h-4 mr-2" />
                    Create Shipping Slip
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedParcels([])}
                    className="w-full"
                  >
                    Clear Selection
                  </Button>
                </div>
              )}
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
              <Link href="/shipping-slips/create">
                <Button variant="outline" className="w-full">
                  <Icon icon="heroicons:plus" className="w-4 h-4 mr-2" />
                  Create New Slip
                </Button>
              </Link>

              <Link href="/shipping-slips">
                <Button variant="outline" className="w-full">
                  <Icon icon="heroicons:list-bullet" className="w-4 h-4 mr-2" />
                  All Shipping Slips
                </Button>
              </Link>

              <Link href="/shipping-slips/stats">
                <Button variant="outline" className="w-full">
                  <Icon icon="heroicons:chart-bar" className="w-4 h-4 mr-2" />
                  View Statistics
                </Button>
              </Link>
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
                Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm space-y-2">
                <p className="font-medium">Available Parcels Criteria:</p>
                <ul className="text-muted-foreground space-y-1 text-xs">
                  <li>• Status must be "COLLECTED"</li>
                  <li>• Destination city must be in selected zone</li>
                  <li>• Not already in another shipping slip</li>
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
const AvailableParcelsPage = () => {
  return (
    <ProtectedRoute
      requiredPermissions={[PARCELS_PERMISSIONS.SHIPPING_SLIPS_READ]}
      requiredAccessLevel="LIMITED"
      allowedAccountStatuses={["ACTIVE"]}
    >
      <AvailableParcelsPageContent />
    </ProtectedRoute>
  );
};

export default AvailableParcelsPage;
