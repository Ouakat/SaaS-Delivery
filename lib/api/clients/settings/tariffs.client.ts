import {
  BaseApiClient,
  ApiResponse,
  PaginatedResponse,
} from "../../base.client";
import type {
  Tariff,
  CreateTariffRequest,
  UpdateTariffRequest,
  TariffFilters,
  BulkTariffImportRequest,
  BulkImportResult,
  TariffCalculationRequest,
  TariffCalculationResult,
} from "@/lib/types/settings/tariffs.types";

export class TariffsApiClient extends BaseApiClient {
  constructor() {
    super("auth"); // Using auth service as the base URL
  }

  // ========================================
  // TARIFF CRUD OPERATIONS
  // ========================================

  async createTariff(
    request: CreateTariffRequest
  ): Promise<ApiResponse<Tariff>> {
    return this.post<Tariff>("/api/tariffs", request);
  }

  async getTariffs(
    filters?: TariffFilters
  ): Promise<PaginatedResponse<Tariff>> {
    return this.getPaginated<Tariff>("/api/tariffs", filters);
  }

  async getTariffById(id: string): Promise<ApiResponse<Tariff>> {
    return this.get<Tariff>(`/api/tariffs/${id}`);
  }

  async updateTariff(
    id: string,
    request: UpdateTariffRequest
  ): Promise<ApiResponse<Tariff>> {
    return this.patch<Tariff>(`/api/tariffs/${id}`, request);
  }

  async deleteTariff(id: string): Promise<ApiResponse<void>> {
    return this.delete<void>(`/api/tariffs/${id}`);
  }

  // ========================================
  // BULK OPERATIONS
  // ========================================

  async bulkImportTariffs(
    request: BulkTariffImportRequest
  ): Promise<ApiResponse<BulkImportResult>> {
    return this.post<BulkImportResult>("/api/tariffs/bulk-import", request);
  }

  async exportTariffs(filters?: TariffFilters): Promise<
    ApiResponse<{
      downloadUrl: string;
      filename: string;
    }>
  > {
    return this.post("/api/tariffs/export", { filters });
  }

  // ========================================
  // TARIFF CALCULATION
  // ========================================

  async calculateTariff(
    request: TariffCalculationRequest
  ): Promise<ApiResponse<TariffCalculationResult>> {
    const params = new URLSearchParams({
      pickupCityId: request.pickupCityId,
      destinationCityId: request.destinationCityId,
    });
    return this.get<TariffCalculationResult>(
      `/api/tariffs/calculate?${params}`
    );
  }

  // ========================================
  // TARIFF ANALYTICS AND STATS
  // ========================================

  async getTariffStats(): Promise<
    ApiResponse<{
      totalTariffs: number;
      averageDeliveryPrice: number;
      averageReturnPrice: number;
      averageRefusalPrice: number;
      averageDeliveryDelay: number;
      priceRanges: {
        range: string;
        count: number;
      }[];
      delayDistribution: {
        delay: number;
        count: number;
      }[];
      cityPairCoverage: {
        totalPossiblePairs: number;
        configuredPairs: number;
        coveragePercentage: number;
      };
    }>
  > {
    return this.get("/api/tariffs/stats");
  }

  async getMissingTariffs(filters?: {
    pickupCityId?: string;
    destinationCityId?: string;
  }): Promise<
    ApiResponse<{
      missingPairs: Array<{
        pickupCity: { id: string; name: string; ref: string };
        destinationCity: { id: string; name: string; ref: string };
      }>;
      count: number;
    }>
  > {
    return this.get("/api/tariffs/missing", { params: filters });
  }

  // ========================================
  // VALIDATION AND HELPERS
  // ========================================

  async validateTariffRoute(
    pickupCityId: string,
    destinationCityId: string,
    excludeId?: string
  ): Promise<
    ApiResponse<{
      exists: boolean;
      existingTariff?: Tariff;
    }>
  > {
    const params = new URLSearchParams({
      pickupCityId,
      destinationCityId,
      ...(excludeId && { excludeId }),
    });
    return this.get(`/api/tariffs/validate-route?${params}`);
  }

  async duplicateTariff(
    id: string,
    newPickupCityId: string,
    newDestinationCityId: string
  ): Promise<ApiResponse<Tariff>> {
    return this.post(`/api/tariffs/${id}/duplicate`, {
      pickupCityId: newPickupCityId,
      destinationCityId: newDestinationCityId,
    });
  }

  // ========================================
  // TEMPLATE OPERATIONS
  // ========================================

  async createTariffTemplate(
    name: string,
    tariffs: CreateTariffRequest[]
  ): Promise<ApiResponse<{ id: string; name: string }>> {
    return this.post("/api/tariffs/templates", { name, tariffs });
  }

  async getTariffTemplates(): Promise<
    ApiResponse<
      Array<{
        id: string;
        name: string;
        tariffCount: number;
        createdAt: string;
      }>
    >
  > {
    return this.get("/api/tariffs/templates");
  }

  async applyTariffTemplate(
    templateId: string,
    overwriteExisting?: boolean
  ): Promise<ApiResponse<BulkImportResult>> {
    return this.post(`/api/tariffs/templates/${templateId}/apply`, {
      overwriteExisting: overwriteExisting || false,
    });
  }
}

// Export singleton instance
export const tariffsApiClient = new TariffsApiClient();
