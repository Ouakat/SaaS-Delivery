import {
  BaseApiClient,
  ApiResponse,
  PaginatedResponse,
} from "../../base.client";

export interface Zone {
  id: string;
  tenantId: string;
  name: string;
  status: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
  _count?: {
    cities: number;
  };
  cities?: Array<{
    id: string;
    name: string;
    ref: string;
  }>;
}

export interface CreateZoneRequest {
  name: string;
  cityIds: string[];
  status?: boolean;
}

export interface UpdateZoneRequest {
  name?: string;
  cityIds?: string[];
  status?: boolean;
}

export interface ZoneFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: boolean;
}

export class ZonesApiClient extends BaseApiClient {
  constructor() {
    super("parcels");
  }

  // ========================================
  // ZONES CRUD OPERATIONS
  // ========================================

  async createZone(data: CreateZoneRequest): Promise<ApiResponse<Zone>> {
    return this.post<Zone>("/api/zones", data);
  }

  async getZones(filters?: ZoneFilters): Promise<PaginatedResponse<Zone>> {
    return this.getPaginated<Zone>("/api/zones", filters);
  }

  async getActiveZones(): Promise<ApiResponse<Zone[]>> {
    return this.get<Zone[]>("/api/zones/active");
  }

  async getZoneById(id: string): Promise<ApiResponse<Zone>> {
    return this.get<Zone>(`/api/zones/${id}`);
  }

  async updateZone(
    id: string,
    data: UpdateZoneRequest
  ): Promise<ApiResponse<Zone>> {
    return this.patch<Zone>(`/api/zones/${id}`, data);
  }

  async deleteZone(id: string): Promise<ApiResponse<void>> {
    return this.delete<void>(`/api/zones/${id}`);
  }

  async toggleZoneStatus(id: string): Promise<ApiResponse<Zone>> {
    return this.patch<Zone>(`/api/zones/${id}/toggle-status`, {});
  }

  // ========================================
  // ZONE CITIES MANAGEMENT
  // ========================================

  async getZoneCities(zoneId: string): Promise<ApiResponse<any[]>> {
    return this.get<any[]>(`/api/zones/${zoneId}/cities`);
  }

  async addCitiesToZone(
    zoneId: string,
    cityIds: string[]
  ): Promise<ApiResponse<Zone>> {
    return this.patch<Zone>(`/api/zones/${zoneId}/cities/add`, { cityIds });
  }

  async removeCitiesFromZone(
    zoneId: string,
    cityIds: string[]
  ): Promise<ApiResponse<Zone>> {
    return this.patch<Zone>(`/api/zones/${zoneId}/cities/remove`, { cityIds });
  }

  // ========================================
  // BULK OPERATIONS
  // ========================================

  async bulkDeleteZones(zoneIds: string[]): Promise<
    ApiResponse<{
      successful: number;
      failed: string[];
    }>
  > {
    return this.post("/api/zones/bulk/delete", { zoneIds });
  }

  async bulkToggleStatus(zoneIds: string[]): Promise<
    ApiResponse<{
      successful: number;
      failed: string[];
    }>
  > {
    return this.patch("/api/zones/bulk/toggle-status", { zoneIds });
  }

  // ========================================
  // STATISTICS AND ANALYTICS
  // ========================================

  async getZoneStatistics(): Promise<
    ApiResponse<{
      total: number;
      active: number;
      inactive: number;
      totalCities: number;
      averageCitiesPerZone: number;
      zonesWithNoCities: number;
      largestZone: {
        name: string;
        cityCount: number;
      };
      smallestZone: {
        name: string;
        cityCount: number;
      };
    }>
  > {
    return this.get("/api/zones/statistics");
  }

  // ========================================
  // EXPORT FUNCTIONALITY
  // ========================================
  async exportZones(filters?: ZoneFilters): Promise<
    ApiResponse<{
      downloadUrl: string;
      filename: string;
      totalRecords: number;
      generatedAt: string;
    }>
  > {
    return this.post("/api/zones/export", {
      page: filters?.page || 1,
      limit: filters?.limit || 1000,
      search: filters?.search || "",
      status: filters?.status,
    });
  }
}

// Export singleton instance
export const zonesApiClient = new ZonesApiClient();
