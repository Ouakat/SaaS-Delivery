"use client";

import React, { useEffect, useState } from "react";
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
import { useDeliverySlipsStore } from "@/lib/stores/parcels/delivery-slips.store";
import { useCitiesStore } from "@/lib/stores/parcels/cities.store";
import { useAuthStore } from "@/lib/stores/auth/auth.store";
import { ProtectedRoute } from "@/components/route/protected-route";
import { PARCELS_PERMISSIONS } from "@/lib/constants/parcels";
import { toast } from "sonner";
import { cn } from "@/lib/utils/ui.utils";

const AvailableParcelsPageContent = () => {
  const { hasPermission } = useAuthStore();
  const {
    availableParcels,
    fetchAvailableParcels,
    createDeliverySlip,
    isLoading,
    error,
  } = useDeliverySlipsStore();

  const { cities, fetchCities } = useCitiesStore();

  const [selectedParcels, setSelectedParcels] = useState<string[]>([]);
  const [filterCity, setFilterCity] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const canCreateSlips = hasPermission(
    PARCELS_PERMISSIONS.DELIVERY_SLIPS_CREATE
  );

  // Initialize data
  useEffect(() => {
    if (canCreateSlips) {
      fetchCities();
      fetchAvailableParcels();
    }
  }, [canCreateSlips, fetchCities, fetchAvailableParcels]);

  // Fetch available parcels when city filter changes
  useEffect(() => {
    if (filterCity && filterCity !== "all") {
      fetchAvailableParcels(filterCity);
    } else {
      fetchAvailableParcels();
    }
  }, [filterCity, fetchAvailableParcels]);

  // Filter parcels based on search
  const filteredParcels = availableParcels.filter((parcel) => {
    const matchesSearch =
      parcel.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      parcel.recipientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      parcel.recipientPhone.includes(searchTerm);

    return matchesSearch;
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedParcels(filteredParcels.map((p) => p.id));
    } else {
      setSelectedParcels([]);
    }
  };

  const handleSelectParcel = (parcelId: string, checked: boolean) => {
    if (checked) {
      setSelectedParcels((prev) => [...prev, parcelId]);
    } else {
      setSelectedParcels((prev) => prev.filter((id) => id !== parcelId));
    }
  };

  const handleCreateDeliverySlip = async () => {
    if (selectedParcels.length === 0) {
      toast.error("Please select at least one parcel");
      return;
    }

    setIsCreating(true);
    try {
      const result = await createDeliverySlip({
        parcelIds: selectedParcels,
        cityId: filterCity !== "all" ? filterCity : undefined,
        notes: `Created with ${selectedParcels.length} parcels`,
      });

      if (result) {
        toast.success("Delivery slip created successfully");
        setSelectedParcels([]);
        fetchAvailableParcels();
      }
    } catch (error) {
      toast.error("Failed to create delivery slip");
    } finally {
      setIsCreating(false);
    }
  };

  const calculateTotalValue = () => {
    return filteredParcels
      .filter((parcel) => selectedParcels.includes(parcel.id))
      .reduce((sum, parcel) => sum + Number(parcel.price), 0);
  };

  if (!canCreateSlips) {
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

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-default-900">
            Available Parcels for Delivery Slips
          </h1>
          <p className="text-default-600">
            Select parcels to create a new delivery slip
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
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Search Parcels</Label>
                  <Input
                    placeholder="Search by code, name, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Filter by Pickup City</Label>
                  <Select value={filterCity} onValueChange={setFilterCity}>
                    <SelectTrigger>
                      <SelectValue placeholder="All cities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Cities</SelectItem>
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

          {/* Available Parcels Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Icon icon="heroicons:cube" className="w-5 h-5" />
                  Available Parcels ({filteredParcels.length})
                </CardTitle>
                {filteredParcels.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={
                        selectedParcels.length === filteredParcels.length &&
                        filteredParcels.length > 0
                      }
                      onCheckedChange={handleSelectAll}
                    />
                    <Label className="text-sm">Select All</Label>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Icon
                    icon="heroicons:arrow-path"
                    className="w-8 h-8 animate-spin text-primary"
                  />
                </div>
              ) : filteredParcels.length === 0 ? (
                <div className="text-center py-8">
                  <Icon
                    icon="heroicons:inbox"
                    className="w-12 h-12 text-muted-foreground mx-auto mb-4"
                  />
                  <p className="text-muted-foreground">
                    No available parcels found
                  </p>
                  {searchTerm || filterCity !== "all" ? (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchTerm("");
                        setFilterCity("all");
                      }}
                      className="mt-4"
                    >
                      Clear Filters
                    </Button>
                  ) : null}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={
                              selectedParcels.length === filteredParcels.length
                            }
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Recipient</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Pickup City</TableHead>
                        <TableHead>Destination</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredParcels.map((parcel) => (
                        <TableRow
                          key={parcel.id}
                          className={cn(
                            "cursor-pointer hover:bg-muted/50",
                            selectedParcels.includes(parcel.id) &&
                              "bg-primary/5"
                          )}
                          onClick={() =>
                            handleSelectParcel(
                              parcel.id,
                              !selectedParcels.includes(parcel.id)
                            )
                          }
                        >
                          <TableCell>
                            <Checkbox
                              checked={selectedParcels.includes(parcel.id)}
                              onCheckedChange={(checked) =>
                                handleSelectParcel(
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
                          <TableCell>{parcel.recipientName}</TableCell>
                          <TableCell>{parcel.recipientPhone}</TableCell>
                          <TableCell>
                            <Badge color="secondary" className="text-xs">
                              {parcel.pickupCity.name}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge color="primary" className="text-xs">
                              {parcel.destinationCity.name}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">
                              {Number(parcel.price).toFixed(2)} DH
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(parcel.createdAt).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Selection Summary */}
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
                    Total Available:
                  </span>
                  <span className="font-medium">{availableParcels.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Filtered:
                  </span>
                  <span className="font-medium">{filteredParcels.length}</span>
                </div>
                <div className="flex justify-between border-t pt-3">
                  <span className="text-sm text-muted-foreground">
                    Selected:
                  </span>
                  <span className="font-medium text-primary">
                    {selectedParcels.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Total Value:
                  </span>
                  <span className="font-medium">
                    {calculateTotalValue().toFixed(2)} DH
                  </span>
                </div>
              </div>

              {selectedParcels.length > 0 && (
                <div className="pt-4 border-t space-y-2">
                  <Button
                    className="w-full"
                    onClick={handleCreateDeliverySlip}
                    disabled={isCreating}
                  >
                    {isCreating ? (
                      <Icon
                        icon="heroicons:arrow-path"
                        className="mr-2 h-4 w-4 animate-spin"
                      />
                    ) : (
                      <Icon
                        icon="heroicons:plus-circle"
                        className="mr-2 h-4 w-4"
                      />
                    )}
                    Create Delivery Slip
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setSelectedParcels([])}
                  >
                    Clear Selection
                  </Button>
                </div>
              )}
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
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {availableParcels.length}
                  </div>
                  <div className="text-xs text-blue-600">Total Available</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {selectedParcels.length}
                  </div>
                  <div className="text-xs text-green-600">Selected</div>
                </div>
              </div>
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
                <p className="font-medium">Available Parcels:</p>
                <ul className="text-muted-foreground space-y-1 text-xs">
                  <li>• Only NEW_PACKAGE status parcels appear here</li>
                  <li>• Parcels already in delivery slips are excluded</li>
                  <li>• Sellers only see their own parcels</li>
                </ul>
              </div>
              <div className="text-sm space-y-2">
                <p className="font-medium">Creating Delivery Slips:</p>
                <ul className="text-muted-foreground space-y-1 text-xs">
                  <li>• Select one or more parcels</li>
                  <li>• Filter by city for efficiency</li>
                  <li>• Click "Create Delivery Slip" to proceed</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

const AvailableParcelsPage = () => {
  return (
    <ProtectedRoute
      requiredPermissions={[PARCELS_PERMISSIONS.DELIVERY_SLIPS_CREATE]}
      requiredAccessLevel="LIMITED"
      allowedAccountStatuses={["ACTIVE"]}
    >
      <AvailableParcelsPageContent />
    </ProtectedRoute>
  );
};

export default AvailableParcelsPage;
