import {
  BaseApiClient,
  ApiResponse,
  PaginatedResponse,
} from "../../base.client";
import type {
  ParcelStatus,
  CreateParcelStatusRequest,
  UpdateParcelStatusRequest,
  ParcelStatusFilters,
  OptionStats,
  BulkActionResult,
} from "@/lib/types/parcels/parcel-statuses.types";

export class ParcelStatusesApiClient extends BaseApiClient {
  constructor() {
    super("parcels");
  }

  // ========================================
  // PARCEL STATUSES - Fixed endpoints
  // ========================================

  async getParcelStatuses(
    filters?: ParcelStatusFilters
  ): Promise<ApiResponse<ParcelStatus[]>> {
    return this.get<ParcelStatus[]>("/api/parcel-statuses", {
      params: filters,
    });
  }

  async getParcelStatusById(id: string): Promise<ApiResponse<ParcelStatus>> {
    return this.get<ParcelStatus>(`/api/parcel-statuses/${id}`);
  }

  async createParcelStatus(
    data: CreateParcelStatusRequest
  ): Promise<ApiResponse<ParcelStatus>> {
    return this.post<ParcelStatus>("/api/parcel-statuses", data);
  }

  async updateParcelStatus(
    id: string,
    data: UpdateParcelStatusRequest
  ): Promise<ApiResponse<ParcelStatus>> {
    return this.patch<ParcelStatus>(`/api/parcel-statuses/${id}`, data);
  }

  async deleteParcelStatus(id: string): Promise<ApiResponse<void>> {
    return this.delete<void>(`/api/parcel-statuses/${id}`);
  }

  async toggleParcelStatusStatus(
    id: string
  ): Promise<ApiResponse<ParcelStatus>> {
    return this.patch<ParcelStatus>(
      `/api/parcel-statuses/${id}/toggle-status`,
      {}
    );
  }

  async getActiveParcelStatuses(): Promise<ApiResponse<ParcelStatus[]>> {
    return this.get<ParcelStatus[]>("/api/parcel-statuses", {
      params: { status: true },
    });
  }

  // ========================================
  // STATISTICS - Fixed endpoint
  // ========================================

  async getParcelStatusesStats(): Promise<ApiResponse<OptionStats>> {
    return this.get<OptionStats>("/api/parcel-statuses/stats");
  }

  // ========================================
  // BULK OPERATIONS (if you want to add these later)
  // ========================================

  async bulkDeleteParcelStatuses(
    ids: string[]
  ): Promise<ApiResponse<BulkActionResult>> {
    // Note: This endpoint doesn't exist in your backend yet
    // You would need to implement it if you want bulk delete functionality
    return this.post<BulkActionResult>("/api/parcel-statuses/bulk-delete", {
      ids,
    });
  }

  async bulkToggleParcelStatuses(
    ids: string[]
  ): Promise<ApiResponse<BulkActionResult>> {
    // Note: This endpoint doesn't exist in your backend yet
    // You would need to implement it if you want bulk toggle functionality
    return this.post<BulkActionResult>("/api/parcel-statuses/bulk-toggle", {
      ids,
    });
  }

  // ========================================
  // EXPORT/IMPORT (if you want to add these later)
  // ========================================

  async exportParcelStatuses(
    filters?: any
  ): Promise<ApiResponse<{ downloadUrl: string; filename: string }>> {
    return this.post(`/api/parcel-statuses/export`, { filters });
  }

  async importParcelStatuses(
    data: CreateParcelStatusRequest[]
  ): Promise<ApiResponse<BulkActionResult>> {
    return this.post<BulkActionResult>(
      "/api/parcel-statuses/bulk-import",
      data
    );
  }
}

// Export singleton instance
export const parcelStatusesApiClient = new ParcelStatusesApiClient();
