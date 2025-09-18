import { BaseApiClient, ApiResponse } from "../base.client";
import type {
  PickupCity,
  CreatePickupCityRequest,
  UpdatePickupCityRequest,
  PickupCityFilters,
  PaginatedResponse,
} from "@/lib/types/settings/pickup-cities.types";

export class PickupCitiesApiClient extends BaseApiClient {
  constructor() {
    super("settings");
  }

  // ========================================
  // PICKUP CITIES CRUD OPERATIONS
  // ========================================

  async createPickupCity(
    request: CreatePickupCityRequest
  ): Promise<ApiResponse<PickupCity>> {
    return this.post<PickupCity>("/api/pickup-cities", request);
  }

  async getPickupCities(
    filters?: PickupCityFilters
  ): Promise<ApiResponse<PaginatedResponse<PickupCity>>> {
    const queryParams = new URLSearchParams();

    if (filters?.page) queryParams.append("page", filters.page.toString());
    if (filters?.limit) queryParams.append("limit", filters.limit.toString());
    if (filters?.search) queryParams.append("search", filters.search);
    if (filters?.ref) queryParams.append("ref", filters.ref);
    if (filters?.status !== undefined)
      queryParams.append("status", filters.status.toString());

    const endpoint = `/api/pickup-cities${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;
    return this.get<PaginatedResponse<PickupCity>>(endpoint);
  }

  async getActivePickupCities(): Promise<ApiResponse<PickupCity[]>> {
    return this.get<PickupCity[]>("/api/pickup-cities/active");
  }

  async getPickupCityById(id: string): Promise<ApiResponse<PickupCity>> {
    return this.get<PickupCity>(`/api/pickup-cities/${id}`);
  }

  async updatePickupCity(
    id: string,
    request: UpdatePickupCityRequest
  ): Promise<ApiResponse<PickupCity>> {
    return this.patch<PickupCity>(`/api/pickup-cities/${id}`, request);
  }

  async deletePickupCity(id: string): Promise<ApiResponse<void>> {
    return this.delete<void>(`/api/pickup-cities/${id}`);
  }

  async togglePickupCityStatus(id: string): Promise<ApiResponse<PickupCity>> {
    return this.patch<PickupCity>(`/api/pickup-cities/${id}/toggle-status`, {});
  }

  // ========================================
  // BULK OPERATIONS
  // ========================================

  async bulkCreatePickupCities(
    pickupCities: CreatePickupCityRequest[]
  ): Promise<ApiResponse<{ successful: number; failed: string[] }>> {
    return this.post("/api/pickup-cities/bulk-create", { pickupCities });
  }

  async bulkDeletePickupCities(
    ids: string[]
  ): Promise<ApiResponse<{ successful: number; failed: string[] }>> {
    return this.delete("/api/pickup-cities/bulk-delete", { data: { ids } });
  }

  async bulkToggleStatus(
    ids: string[],
    status: boolean
  ): Promise<ApiResponse<{ successful: number; failed: string[] }>> {
    return this.patch("/api/pickup-cities/bulk-toggle-status", { ids, status });
  }

  // ========================================
  // STATISTICS AND ANALYTICS
  // ========================================

  async getPickupCityStatistics(): Promise<
    ApiResponse<{
      total: number;
      active: number;
      inactive: number;
      withTariffs: number;
      withoutTariffs: number;
    }>
  > {
    return this.get("/api/pickup-cities/statistics");
  }

  // ========================================
  // EXPORT OPERATIONS
  // ========================================

  async exportPickupCities(
    filters?: PickupCityFilters
  ): Promise<ApiResponse<{ downloadUrl: string; filename: string }>> {
    return this.post("/api/pickup-cities/export", { filters });
  }
}

// Export singleton instance
export const pickupCitiesApiClient = new PickupCitiesApiClient();
