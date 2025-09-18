import { BaseApiClient, ApiResponse } from "../base.client";
import type {
  City,
  CreateCityRequest,
  UpdateCityRequest,
  CityFilters,
  CitiesResponse,
  ZoneStats,
  CityStatistics,
  BulkCityAction,
  BulkActionResult,
  CityExportData,
} from "@/lib/types/settings/cities.types";

export class CitiesApiClient extends BaseApiClient {
  constructor() {
    super("auth"); // Using auth service base URL but will override endpoints
  }

  // Override to use settings service URL
  private getSettingsUrl(endpoint: string): string {
    const settingsBaseUrl =
      process.env.NEXT_PUBLIC_SETTINGS_API_URL || "http://localhost:3002";
    return `${settingsBaseUrl}${endpoint}`;
  }

  private async makeRequest<T>(
    method: "GET" | "POST" | "PATCH" | "DELETE",
    endpoint: string,
    body?: any
  ): Promise<ApiResponse<T>> {
    try {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${
          typeof window !== "undefined"
            ? localStorage.getItem("auth_token")
            : ""
        }`,
        "X-Tenant-ID":
          typeof window !== "undefined"
            ? localStorage.getItem("utl_tenant_id") || ""
            : "",
      };

      if (body && method !== "GET") {
        headers["Content-Type"] = "application/json";
      }

      const response = await fetch(this.getSettingsUrl(endpoint), {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: "SERVER_ERROR" as const,
            message: data.message || `Failed to ${method} ${endpoint}`,
            statusCode: response.status,
            timestamp: new Date().toISOString(),
          },
          timestamp: new Date().toISOString(),
        };
      }

      return {
        success: true,
        data: data.data || data,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: "NETWORK_ERROR" as const,
          message: error.message || "Network error occurred",
          timestamp: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      };
    }
  }

  // ========================================
  // CITIES CRUD OPERATIONS
  // ========================================

  async getCities(filters?: CityFilters): Promise<ApiResponse<CitiesResponse>> {
    const queryParams = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          queryParams.append(key, value.toString());
        }
      });
    }

    const endpoint = `/api/cities${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;
    return this.makeRequest<CitiesResponse>("GET", endpoint);
  }

  async getCityById(id: string): Promise<ApiResponse<City>> {
    return this.makeRequest<City>("GET", `/api/cities/${id}`);
  }

  async createCity(request: CreateCityRequest): Promise<ApiResponse<City>> {
    return this.makeRequest<City>("POST", "/api/cities", request);
  }

  async updateCity(
    id: string,
    request: UpdateCityRequest
  ): Promise<ApiResponse<City>> {
    return this.makeRequest<City>("PATCH", `/api/cities/${id}`, request);
  }

  async deleteCity(id: string): Promise<ApiResponse<void>> {
    return this.makeRequest<void>("DELETE", `/api/cities/${id}`);
  }

  async toggleCityStatus(id: string): Promise<ApiResponse<City>> {
    return this.makeRequest<City>("PATCH", `/api/cities/${id}/toggle-status`);
  }

  // ========================================
  // SPECIALIZED ENDPOINTS
  // ========================================

  async getPickupCities(): Promise<ApiResponse<City[]>> {
    return this.makeRequest<City[]>("GET", "/api/cities/pickup");
  }

  async getZoneStats(): Promise<ApiResponse<ZoneStats[]>> {
    return this.makeRequest<ZoneStats[]>("GET", "/api/cities/zones/stats");
  }

  async getCityStatistics(): Promise<ApiResponse<CityStatistics>> {
    return this.makeRequest<CityStatistics>("GET", "/api/cities/statistics");
  }

  // ========================================
  // BULK OPERATIONS
  // ========================================

  async bulkUpdateCities(
    action: BulkCityAction
  ): Promise<ApiResponse<BulkActionResult>> {
    return this.makeRequest<BulkActionResult>(
      "POST",
      "/api/cities/bulk",
      action
    );
  }

  async bulkDeleteCities(
    cityIds: string[]
  ): Promise<ApiResponse<BulkActionResult>> {
    return this.makeRequest<BulkActionResult>(
      "POST",
      "/api/cities/bulk-delete",
      { cityIds }
    );
  }

  async bulkToggleStatus(
    cityIds: string[],
    status: boolean
  ): Promise<ApiResponse<BulkActionResult>> {
    return this.makeRequest<BulkActionResult>(
      "POST",
      "/api/cities/bulk-toggle",
      {
        cityIds,
        status,
      }
    );
  }

  // ========================================
  // IMPORT/EXPORT
  // ========================================

  async exportCities(
    filters?: CityFilters
  ): Promise<ApiResponse<CityExportData[]>> {
    const queryParams = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          queryParams.append(key, value.toString());
        }
      });
    }

    const endpoint = `/api/cities/export${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;
    return this.makeRequest<CityExportData[]>("GET", endpoint);
  }

  async importCities(
    cities: CreateCityRequest[]
  ): Promise<ApiResponse<BulkActionResult>> {
    return this.makeRequest<BulkActionResult>("POST", "/api/cities/import", {
      cities,
    });
  }

  // ========================================
  // SEARCH AND FILTERS
  // ========================================

  async searchCities(query: string): Promise<ApiResponse<City[]>> {
    return this.makeRequest<City[]>(
      "GET",
      `/api/cities/search?q=${encodeURIComponent(query)}`
    );
  }

  async getCitiesByZone(zone: string): Promise<ApiResponse<City[]>> {
    return this.makeRequest<City[]>(
      "GET",
      `/api/cities/zone/${encodeURIComponent(zone)}`
    );
  }

  async getAvailableZones(): Promise<ApiResponse<string[]>> {
    return this.makeRequest<string[]>("GET", "/api/cities/zones");
  }

  // ========================================
  // VALIDATION
  // ========================================

  async validateCityRef(
    ref: string,
    excludeId?: string
  ): Promise<ApiResponse<{ available: boolean }>> {
    const params = new URLSearchParams({ ref });
    if (excludeId) {
      params.append("excludeId", excludeId);
    }
    return this.makeRequest<{ available: boolean }>(
      "GET",
      `/api/cities/validate-ref?${params.toString()}`
    );
  }

  async validateCityName(
    name: string,
    excludeId?: string
  ): Promise<ApiResponse<{ available: boolean }>> {
    const params = new URLSearchParams({ name });
    if (excludeId) {
      params.append("excludeId", excludeId);
    }
    return this.makeRequest<{ available: boolean }>(
      "GET",
      `/api/cities/validate-name?${params.toString()}`
    );
  }
}

// Export singleton instance
export const citiesApiClient = new CitiesApiClient();
