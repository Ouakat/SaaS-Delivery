"use client";
import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { useDropzone } from "react-dropzone";
import Papa from "papaparse";
import type { City } from "@/lib/types/settings/cities.types";
import type {
  BulkTariffImportRequest,
  BulkImportResult,
  TariffCSVRow,
  CreateTariffRequest,
} from "@/lib/types/settings/tariffs.types";

interface BulkImportFormProps {
  onImport: (data: BulkTariffImportRequest) => Promise<BulkImportResult | null>;
  onCancel: () => void;
  isLoading?: boolean;
  cities: City[];
}

interface ParsedRow extends TariffCSVRow {
  rowIndex: number;
  errors: string[];
}

interface ValidationResult {
  validTariffs: CreateTariffRequest[];
  invalidRows: ParsedRow[];
  summary: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
  };
}

const BulkImportForm = ({
  onImport,
  onCancel,
  isLoading = false,
  cities,
}: BulkImportFormProps) => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] =
    useState<ValidationResult | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [importResult, setImportResult] = useState<BulkImportResult | null>(
    null
  );

  // Create a map of city references to city IDs for quick lookup
  const cityRefMap = React.useMemo(() => {
    const map = new Map<string, string>();
    cities.forEach((city) => {
      map.set(city.ref.toLowerCase(), city.id);
    });
    return map;
  }, [cities]);

  const validateRow = (row: TariffCSVRow, rowIndex: number): ParsedRow => {
    const errors: string[] = [];

    // Check required fields
    if (!row.pickupCityRef?.trim()) {
      errors.push("Missing pickup city reference");
    }
    if (!row.destinationCityRef?.trim()) {
      errors.push("Missing destination city reference");
    }
    if (
      row.deliveryPrice === undefined ||
      row.deliveryPrice === null ||
      row.deliveryPrice < 0
    ) {
      errors.push("Invalid delivery price");
    }
    if (
      row.returnPrice === undefined ||
      row.returnPrice === null ||
      row.returnPrice < 0
    ) {
      errors.push("Invalid return price");
    }
    if (
      row.refusalPrice === undefined ||
      row.refusalPrice === null ||
      row.refusalPrice < 0
    ) {
      errors.push("Invalid refusal price");
    }
    if (!row.deliveryDelay || row.deliveryDelay < 1) {
      errors.push("Invalid delivery delay");
    }

    // Validate city references exist
    if (row.pickupCityRef && !cityRefMap.has(row.pickupCityRef.toLowerCase())) {
      errors.push(`Unknown pickup city reference: ${row.pickupCityRef}`);
    }
    if (
      row.destinationCityRef &&
      !cityRefMap.has(row.destinationCityRef.toLowerCase())
    ) {
      errors.push(
        `Unknown destination city reference: ${row.destinationCityRef}`
      );
    }

    // Check that pickup and destination are different
    if (
      row.pickupCityRef &&
      row.destinationCityRef &&
      row.pickupCityRef.toLowerCase() === row.destinationCityRef.toLowerCase()
    ) {
      errors.push("Pickup and destination cities cannot be the same");
    }

    return {
      ...row,
      rowIndex,
      errors,
    };
  };

  const validateCSVData = (data: any[]): ValidationResult => {
    const validTariffs: CreateTariffRequest[] = [];
    const invalidRows: ParsedRow[] = [];

    data.forEach((row, index) => {
      const validatedRow = validateRow(row, index + 1);

      if (validatedRow.errors.length === 0) {
        // Convert to CreateTariffRequest
        const pickupCityId = cityRefMap.get(
          validatedRow.pickupCityRef.toLowerCase()
        );
        const destinationCityId = cityRefMap.get(
          validatedRow.destinationCityRef.toLowerCase()
        );

        if (pickupCityId && destinationCityId) {
          validTariffs.push({
            pickupCityId,
            destinationCityId,
            deliveryPrice: validatedRow.deliveryPrice,
            returnPrice: validatedRow.returnPrice,
            refusalPrice: validatedRow.refusalPrice,
            deliveryDelay: validatedRow.deliveryDelay,
          });
        }
      } else {
        invalidRows.push(validatedRow);
      }
    });

    return {
      validTariffs,
      invalidRows,
      summary: {
        totalRows: data.length,
        validRows: validTariffs.length,
        invalidRows: invalidRows.length,
      },
    };
  };

  const handleFileUpload = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      setUploadedFile(file);
      setValidationError(null);
      setValidationResult(null);
      setImportResult(null);
      setIsValidating(true);

      try {
        const text = await file.text();

        Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: true,
          complete: (results: any) => {
            if (results.errors.length > 0) {
              setValidationError(
                `CSV parsing error: ${results.errors[0].message}`
              );
              setIsValidating(false);
              return;
            }

            const validationResult = validateCSVData(results.data);
            setValidationResult(validationResult);
            setIsValidating(false);
          },
          error: (error: any) => {
            setValidationError(`Failed to parse CSV: ${error.message}`);
            setIsValidating(false);
          },
        });
      } catch (error) {
        setValidationError("Failed to read file");
        setIsValidating(false);
      }
    },
    [cityRefMap]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFileUpload,
    accept: {
      "text/csv": [".csv"],
      "application/vnd.ms-excel": [".csv"],
    },
    multiple: false,
  });

  const handleImport = async () => {
    if (!validationResult) return;

    const result = await onImport({
      tariffs: validationResult.validTariffs,
    });

    if (result) {
      setImportResult(result);
    }
  };

  const handleReset = () => {
    setUploadedFile(null);
    setValidationResult(null);
    setValidationError(null);
    setImportResult(null);
  };

  return (
    <div className="space-y-6">
      {/* File Upload Area */}
      {!uploadedFile && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? "border-primary bg-primary/5"
              : "border-gray-300 hover:border-gray-400"
          }`}
        >
          <input {...getInputProps()} />
          <Icon
            icon="heroicons:document-arrow-up"
            className="w-12 h-12 mx-auto mb-4 text-gray-400"
          />
          {isDragActive ? (
            <p className="text-lg">Drop the CSV file here...</p>
          ) : (
            <>
              <p className="text-lg mb-2">Drag & drop your CSV file here</p>
              <p className="text-sm text-muted-foreground mb-4">
                or click to browse files
              </p>
              <Button type="button">
                <Icon icon="heroicons:folder-open" className="w-4 h-4 mr-2" />
                Choose File
              </Button>
            </>
          )}
        </div>
      )}

      {/* File Info */}
      {uploadedFile && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Icon
                  icon="heroicons:document-text"
                  className="w-8 h-8 text-green-600"
                />
                <div>
                  <p className="font-medium">{uploadedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(uploadedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleReset}>
                <Icon icon="heroicons:x-mark" className="w-4 h-4 mr-2" />
                Remove
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validation Loading */}
      {isValidating && (
        <Alert color="info">
          <Icon icon="heroicons:arrow-path" className="h-4 w-4 animate-spin" />
          <AlertDescription>Validating CSV data...</AlertDescription>
        </Alert>
      )}

      {/* Validation Error */}
      {validationError && (
        <Alert color="destructive">
          <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
          <AlertDescription>{validationError}</AlertDescription>
        </Alert>
      )}

      {/* Validation Results */}
      {validationResult && (
        <div className="space-y-4">
          {/* Summary */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-3">Validation Summary</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {validationResult.summary.totalRows}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total Rows
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {validationResult.summary.validRows}
                  </div>
                  <div className="text-sm text-muted-foreground">Valid</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {validationResult.summary.invalidRows}
                  </div>
                  <div className="text-sm text-muted-foreground">Invalid</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Invalid Rows */}
          {validationResult.invalidRows.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium mb-3 text-red-600">
                  Invalid Rows ({validationResult.invalidRows.length})
                </h3>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {validationResult.invalidRows.map((row, index) => (
                    <div
                      key={index}
                      className="border-l-4 border-red-500 pl-4 py-2 bg-red-50"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Badge
                          color="primary"
                          className="text-red-600 border-red-600"
                        >
                          Row {row.rowIndex}
                        </Badge>
                        <span className="text-sm">
                          {row.pickupCityRef} → {row.destinationCityRef}
                        </span>
                      </div>
                      <ul className="list-disc list-inside space-y-1">
                        {row.errors.map((error, errorIndex) => (
                          <li key={errorIndex} className="text-sm text-red-600">
                            {error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Valid Rows Preview */}
          {validationResult.validTariffs.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium mb-3 text-green-600">
                  Valid Tariffs ({validationResult.validTariffs.length})
                </h3>
                <div className="text-sm text-muted-foreground mb-3">
                  These tariffs will be imported:
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {validationResult.validTariffs
                    .slice(0, 5)
                    .map((tariff, index) => {
                      const pickupCity = cities.find(
                        (c) => c.id === tariff.pickupCityId
                      );
                      const destinationCity = cities.find(
                        (c) => c.id === tariff.destinationCityId
                      );
                      return (
                        <div
                          key={index}
                          className="flex items-center justify-between text-sm"
                        >
                          <span>
                            {pickupCity?.name} → {destinationCity?.name}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-green-600">
                              ${tariff.deliveryPrice}
                            </span>
                            <span className="text-muted-foreground">|</span>
                            <span className="text-orange-600">
                              ${tariff.returnPrice}
                            </span>
                            <span className="text-muted-foreground">|</span>
                            <span className="text-red-600">
                              ${tariff.refusalPrice}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  {validationResult.validTariffs.length > 5 && (
                    <div className="text-center text-sm text-muted-foreground">
                      ... and {validationResult.validTariffs.length - 5} more
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Import Result */}
      {importResult && (
        <Alert color={importResult.failed > 0 ? "warning" : "success"}>
          <Icon
            icon={
              importResult.failed > 0
                ? "heroicons:exclamation-triangle"
                : "heroicons:check-circle"
            }
            className="h-4 w-4"
          />
          <AlertDescription>
            <div className="space-y-2">
              <div className="font-medium">Import Complete</div>
              <div className="text-sm">
                Successfully imported {importResult.success} tariffs
                {importResult.failed > 0 && `, ${importResult.failed} failed`}
              </div>
              {importResult.errors.length > 0 && (
                <details className="text-sm">
                  <summary className="cursor-pointer">View Errors</summary>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    {importResult.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-4 pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>

        {validationResult && !importResult && (
          <Button
            type="button"
            onClick={handleImport}
            disabled={isLoading || validationResult.validTariffs.length === 0}
          >
            {isLoading && (
              <Icon
                icon="heroicons:arrow-path"
                className="mr-2 h-4 w-4 animate-spin"
              />
            )}
            Import {validationResult.validTariffs.length} Tariffs
          </Button>
        )}
      </div>
    </div>
  );
};

export default BulkImportForm;
