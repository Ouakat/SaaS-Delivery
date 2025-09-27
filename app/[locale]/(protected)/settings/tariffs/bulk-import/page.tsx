"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "@/i18n/routing";
import { ProtectedRoute } from "@/components/route/protected-route";
import { SETTINGS_PERMISSIONS } from "@/lib/constants/settings";
import { useTariffsStore } from "@/lib/stores/parcels/tariffs.store";
import { useCitiesStore } from "@/lib/stores/parcels/cities.store";
import BulkImportForm from "@/components/settings/tariffs/bulk-import-form";

const BulkImportTariffsPageContent = () => {
  const router = useRouter();
  const { bulkImportTariffs, isLoading, error } = useTariffsStore();
  const { cities, fetchCities } = useCitiesStore();

  useEffect(() => {
    fetchCities();
  }, [fetchCities]);

  const handleImport = async (data: any) => {
    const result = await bulkImportTariffs(data);
    if (result && result.success > 0) {
      router.push("/settings/tariffs");
    }
    return result;
  };

  const handleCancel = () => {
    router.push("/settings/tariffs");
  };

  const generateSampleCSV = () => {
    const sampleData = [
      {
        pickupCityRef: "CAS",
        destinationCityRef: "RAB",
        deliveryPrice: 25.0,
        returnPrice: 20.0,
        refusalPrice: 15.0,
        deliveryDelay: 2,
      },
      {
        pickupCityRef: "RAB",
        destinationCityRef: "FES",
        deliveryPrice: 30.0,
        returnPrice: 25.0,
        refusalPrice: 18.0,
        deliveryDelay: 3,
      },
    ];

    const headers = [
      "pickupCityRef",
      "destinationCityRef",
      "deliveryPrice",
      "returnPrice",
      "refusalPrice",
      "deliveryDelay",
    ];

    const csvContent = [
      headers.join(","),
      ...sampleData.map((row) =>
        headers.map((header) => row[header as keyof typeof row]).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "sample-tariffs.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <ProtectedRoute
      requiredPermissions={[SETTINGS_PERMISSIONS.READ_TARIFFS]}
      requiredAccessLevel="FULL"
      requireValidation={true}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-default-900">
              Bulk Import Tariffs
            </h1>
            <p className="text-default-600">
              Import multiple tariffs from CSV file
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="md" onClick={generateSampleCSV}>
              <Icon
                icon="heroicons:document-arrow-down"
                className="w-4 h-4 mr-2"
              />
              Download Sample
            </Button>
            <Link href="/settings/tariffs">
              <Button variant="outline">
                <Icon icon="heroicons:arrow-left" className="w-4 h-4 mr-2" />
                Back to Tariffs
              </Button>
            </Link>
          </div>
        </div>

        {/* Instructions */}
        <Alert color="info">
          <Icon icon="heroicons:information-circle" className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p>
                <strong>CSV Import Instructions:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Use the provided CSV template format</li>
                <li>City references must match existing city REF codes</li>
                <li>Prices should be in decimal format (e.g., 25.50)</li>
                <li>Delivery delay should be in whole days</li>
                <li>Duplicate routes will be skipped with warnings</li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>

        {/* Error Alert */}
        {error && (
          <Alert color="destructive">
            <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Import Form */}
        <Card>
          <CardHeader>
            <CardTitle>Upload CSV File</CardTitle>
          </CardHeader>
          <CardContent>
            <BulkImportForm
              onImport={handleImport}
              onCancel={handleCancel}
              isLoading={isLoading}
              cities={cities}
            />
          </CardContent>
        </Card>

        {/* CSV Format Guide */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon icon="heroicons:document-text" className="w-5 h-5" />
              CSV Format Requirements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h4 className="font-medium text-default-900 mb-3">
                  Required Columns
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <div className="font-medium text-sm">pickupCityRef</div>
                    <div className="text-xs text-muted-foreground">
                      Reference code of the pickup city (e.g., "CAS", "RAB")
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="font-medium text-sm">
                      destinationCityRef
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Reference code of destination city (e.g., "FES", "MAR")
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="font-medium text-sm">deliveryPrice</div>
                    <div className="text-xs text-muted-foreground">
                      Price for successful delivery (e.g., 25.50)
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="font-medium text-sm">returnPrice</div>
                    <div className="text-xs text-muted-foreground">
                      Price when package is returned (e.g., 20.00)
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="font-medium text-sm">refusalPrice</div>
                    <div className="text-xs text-muted-foreground">
                      Price when package is refused (e.g., 15.00)
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="font-medium text-sm">deliveryDelay</div>
                    <div className="text-xs text-muted-foreground">
                      Expected delivery time in days (e.g., 2)
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium text-default-900 mb-3">
                  Sample CSV Content
                </h4>
                <div className="bg-muted rounded-lg p-4 font-mono text-sm">
                  <div className="text-muted-foreground mb-2">
                    # Sample tariffs CSV format
                  </div>
                  <div>
                    pickupCityRef,destinationCityRef,deliveryPrice,returnPrice,refusalPrice,deliveryDelay
                  </div>
                  <div>CAS,RAB,25.00,20.00,15.00,2</div>
                  <div>RAB,FES,30.00,25.00,18.00,3</div>
                  <div>FES,MAR,28.00,22.00,16.00,2</div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium text-default-900 mb-3">
                  Available City References
                </h4>
                <div className="flex flex-wrap gap-2">
                  {cities.map((city) => (
                    <div
                      key={city.id}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs"
                    >
                      <span className="font-mono font-medium">{city.ref}</span>
                      <span className="text-muted-foreground">-</span>
                      <span>{city.name}</span>
                    </div>
                  ))}
                </div>
                {cities.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No cities configured yet.
                    <Link
                      href="/settings/cities"
                      className="text-primary underline ml-1"
                    >
                      Configure cities first
                    </Link>
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Import Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon icon="heroicons:light-bulb" className="w-5 h-5" />
              Import Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-default-900 mb-2">
                  Best Practices
                </h4>
                <ul className="space-y-1 text-sm text-default-600">
                  <li>• Test with a small batch first</li>
                  <li>• Verify city references before import</li>
                  <li>• Use consistent decimal formatting</li>
                  <li>• Keep backup of your data</li>
                  <li>• Review import results carefully</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-default-900 mb-2">
                  Common Issues
                </h4>
                <ul className="space-y-1 text-sm text-default-600">
                  <li>• Invalid city reference codes</li>
                  <li>• Duplicate route combinations</li>
                  <li>• Incorrect number formats</li>
                  <li>• Missing required columns</li>
                  <li>• Empty or invalid data rows</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
};

export default BulkImportTariffsPageContent;
