import { BaseApiClient, ApiResponse } from "../../base.client";
import type {
  City,
  CreateCityRequest,
  UpdateCityRequest,
  CitiesFilters,
  CitiesPaginatedResponse,
  ZoneStats,
} from "@/lib/types/settings/cities.types";

export class CitiesApiClient extends BaseApiClient {
  constructor() {
    super("settings");
  }

  // ========================================
  // CITIES MANAGEMENT ENDPOINTS
  // ========================================

  /**
   * Create a new city
   */
  async createCity(request: CreateCityRequest): Promise<ApiResponse<City>> {
    return this.post<City>("/api/cities", request);
  }

  /**
   * Get all cities with pagination and filters
   */
  async getCities(
    filters?: CitiesFilters
  ): Promise<ApiResponse<CitiesPaginatedResponse>> {
    const params = new URLSearchParams();

    if (filters?.page) params.append("page", filters.page.toString());
    if (filters?.limit) params.append("limit", filters.limit.toString());
    if (filters?.search) params.append("search", filters.search);
    if (filters?.ref) params.append("ref", filters.ref);
    if (filters?.zone) params.append("zone", filters.zone);
    if (filters?.pickupCity !== undefined)
      params.append("pickupCity", filters.pickupCity.toString());
    if (filters?.status !== undefined)
      params.append("status", filters.status.toString());

    const queryString = params.toString();
    const endpoint = `/api/cities${queryString ? `?${queryString}` : ""}`;

    return this.get<CitiesPaginatedResponse>(endpoint);
  }

  /**
   * Get active pickup cities only
   */
  async getPickupCities(): Promise<ApiResponse<City[]>> {
    return this.get<City[]>("/api/cities/pickup");
  }

  /**
   * Get zone statistics
   */
  async getZoneStats(): Promise<ApiResponse<ZoneStats[]>> {
    return this.get<ZoneStats[]>("/api/cities/zones/stats");
  }

  /**
   * Get city by ID
   */
  async getCityById(id: string): Promise<ApiResponse<City>> {
    return this.get<City>(`/api/cities/${id}`);
  }

  /**
   * Update city
   */
  async updateCity(
    id: string,
    request: UpdateCityRequest
  ): Promise<ApiResponse<City>> {
    return this.patch<City>(`/api/cities/${id}`, request);
  }

  /**
   * Delete city
   */
  async deleteCity(id: string): Promise<ApiResponse<void>> {
    return this.delete<void>(`/api/cities/${id}`);
  }

  /**
   * Toggle city status (active/inactive)
   */
  async toggleCityStatus(id: string): Promise<ApiResponse<City>> {
    return this.patch<City>(`/api/cities/${id}/toggle-status`, {});
  }

  /**
   * Bulk delete cities
   */
  async bulkDeleteCities(
    cityIds: string[]
  ): Promise<ApiResponse<{ deleted: number; failed: string[] }>> {
    return this.post(`/api/cities/bulk-delete`, { cityIds });
  }

  /**
   * Bulk update cities status
   */
  async bulkUpdateCitiesStatus(
    cityIds: string[],
    status: boolean
  ): Promise<ApiResponse<{ updated: number; failed: string[] }>> {
    return this.post(`/api/cities/bulk-update-status`, { cityIds, status });
  }

  /**
   * Export cities to Excel
   */
  async exportCities(
    filters?: CitiesFilters
  ): Promise<ApiResponse<{ downloadUrl: string; filename: string }>> {
    return this.post("/api/cities/export", { filters });
  }

  /**
   * Import cities from Excel
   */
  async importCities(
    file: File
  ): Promise<ApiResponse<{ imported: number; failed: string[] }>> {
    const formData = new FormData();
    formData.append("file", file);

    return this.post("/api/cities/import", formData);
  }

  /**
   * Get cities statistics for dashboard
   */
  async getCitiesStats(): Promise<
    ApiResponse<{
      total: number;
      active: number;
      inactive: number;
      pickupCities: number;
      byZone: Record<string, number>;
      recentlyAdded: number;
    }>
  > {
    return this.get("/api/cities/stats");
  }

  /**
   * Search cities by name or ref (for autocomplete)
   */
  async searchCities(query: string, limit = 10): Promise<ApiResponse<City[]>> {
    return this.get(
      `/api/cities/search?q=${encodeURIComponent(query)}&limit=${limit}`
    );
  }

  /**
   * Validate city reference uniqueness
   */
  async validateCityRef(
    ref: string,
    excludeId?: string
  ): Promise<ApiResponse<{ isUnique: boolean }>> {
    const params = new URLSearchParams({ ref });
    if (excludeId) params.append("excludeId", excludeId);

    return this.get(`/api/cities/validate-ref?${params.toString()}`);
  }

  /**
   * Get cities by zone
   */
  async getCitiesByZone(zone: string): Promise<ApiResponse<City[]>> {
    return this.get(`/api/cities/by-zone/${encodeURIComponent(zone)}`);
  }

  /**
   * Get available zones
   */
  async getAvailableZones(): Promise<ApiResponse<string[]>> {
    return this.get("/api/cities/zones");
  }
}

// Export singleton instance
export const citiesApiClient = new CitiesApiClient();
