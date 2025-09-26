import { BaseApiClient, ApiResponse } from "../../base.client";
import type {
  Parcel,
  CreateParcelRequest,
  UpdateParcelRequest,
  ParcelFilters,
  ParcelStatistics,
  ChangeParcelStatusRequest,
  BulkParcelActionRequest,
  BulkActionResult,
  ParcelTrackingInfo,
  PaginatedParcelsResponse,
} from "@/lib/types/parcels/parcels.types";

export class ParcelsApiClient extends BaseApiClient {
  constructor() {
    super("parcels");
  }

  // ========================================
  // PARCEL MANAGEMENT ENDPOINTS
  // ========================================

  /**
   * Create a new parcel
   */
  async createParcel(
    request: CreateParcelRequest
  ): Promise<ApiResponse<Parcel>> {
    return this.post<Parcel>("/api/parcels", request);
  }

  /**
   * Get parcels with filters and pagination
   */
  async getParcels(filters?: ParcelFilters) {
    return this.getPaginated<Parcel>("/api/parcels", filters);
  }

  /**
   * Get single parcel by ID
   */
  async getParcelById(id: string): Promise<ApiResponse<Parcel>> {
    return this.get<Parcel>(`/api/parcels/${id}`);
  }

  /**
   * Update parcel
   */
  async updateParcel(
    id: string,
    request: UpdateParcelRequest
  ): Promise<ApiResponse<Parcel>> {
    return this.patch<Parcel>(`/api/parcels/${id}`, request);
  }

  /**
   * Delete parcel (soft delete)
   */
  async deleteParcel(id: string): Promise<ApiResponse<void>> {
    return this.delete<void>(`/api/parcels/${id}`);
  }

  /**
   * Change parcel status
   */
  async changeParcelStatus(
    id: string,
    request: ChangeParcelStatusRequest
  ): Promise<ApiResponse<Parcel>> {
    return this.patch<Parcel>(`/api/parcels/${id}/status`, request);
  }

  /**
   * Update payment status
   */
  async updatePaymentStatus(
    id: string,
    paymentStatus: string,
    comment?: string
  ): Promise<ApiResponse<Parcel>> {
    return this.patch<Parcel>(`/api/parcels/${id}/payment-status`, {
      paymentStatus,
      comment,
    });
  }

  /**
   * Record delivery attempt
   */
  async recordDeliveryAttempt(
    id: string,
    data: {
      success: boolean;
      reason?: string;
      nextAttempt?: string;
    }
  ): Promise<ApiResponse<Parcel>> {
    return this.post<Parcel>(`/api/parcels/${id}/delivery-attempt`, data);
  }

  // ========================================
  // SPECIALIZED PARCEL QUERIES
  // ========================================

  /**
   * Get current user's parcels (seller view)
   */
  async getMyParcels(filters?: ParcelFilters) {
    return this.getPaginated<Parcel>("/api/parcels/my-parcels", filters);
  }

  /**
   * Get parcels ready for pickup
   */
  async getPickupReadyParcels(filters?: ParcelFilters) {
    return this.getPaginated<Parcel>("/api/parcels/pickup-ready", filters);
  }

  /**
   * Get parcels by status
   */
  async getParcelsByStatus(statusCode: string, filters?: ParcelFilters) {
    return this.getPaginated<Parcel>(
      `/api/parcels/by-status/${statusCode}`,
      filters
    );
  }

  /**
   * Search parcels by phone number
   */
  async searchParcelsByPhone(phone: string, filters?: ParcelFilters) {
    return this.getPaginated<Parcel>(`/api/parcels/search/${phone}`, filters);
  }

  // ========================================
  // PARCEL HISTORY AND TRACKING
  // ========================================

  /**
   * Get parcel status history
   */
  async getParcelHistory(id: string): Promise<
    ApiResponse<
      Array<{
        id: string;
        statusCode: string;
        statusName: string;
        comment?: string;
        changedAt: string;
        changedBy?: string;
      }>
    >
  > {
    return this.get(`/api/parcels/${id}/history`);
  }

  /**
   * Track parcel (public endpoint)
   */
  async trackParcel(id: string): Promise<ApiResponse<ParcelTrackingInfo>> {
    return this.get<ParcelTrackingInfo>(`/api/parcels/${id}/tracking`);
  }

  // ========================================
  // BULK OPERATIONS
  // ========================================

  /**
   * Perform bulk action on multiple parcels
   */
  async bulkAction(
    request: BulkParcelActionRequest
  ): Promise<ApiResponse<BulkActionResult>> {
    return this.post<BulkActionResult>("/api/parcels/bulk-action", request);
  }

  /**
   * Bulk status change
   */
  async bulkChangeStatus(
    parcelIds: string[],
    statusCode: string,
    comment?: string
  ): Promise<ApiResponse<BulkActionResult>> {
    return this.post<BulkActionResult>("/api/parcels/bulk-action", {
      parcelIds,
      action: "CHANGE_STATUS",
      statusCode,
      comment,
    });
  }

  /**
   * Bulk delete parcels
   */
  async bulkDeleteParcels(
    parcelIds: string[]
  ): Promise<ApiResponse<BulkActionResult>> {
    return this.post<BulkActionResult>("/api/parcels/bulk-action", {
      parcelIds,
      action: "DELETE",
    });
  }

  // ========================================
  // STATISTICS AND ANALYTICS
  // ========================================

  /**
   * Get parcel statistics
   */
  async getParcelStatistics(): Promise<ApiResponse<ParcelStatistics>> {
    return this.get<ParcelStatistics>("/api/parcels/statistics");
  }

  // ========================================
  // UTILITY OPERATIONS
  // ========================================

  /**
   * Duplicate an existing parcel
   */
  async duplicateParcel(
    id: string,
    overrides?: Partial<CreateParcelRequest>
  ): Promise<ApiResponse<Parcel>> {
    return this.post<Parcel>(`/api/parcels/${id}/duplicate`, overrides || {});
  }

  /**
   * Calculate shipping cost for a route
   */
  async calculateShippingCost(
    pickupCityId: string,
    destinationCityId: string
  ): Promise<
    ApiResponse<{
      deliveryPrice: number;
      returnPrice: number;
      refusalPrice: number;
      deliveryDelay: number;
      tariffId: string;
    }>
  > {
    return this.get(
      `/api/tariffs/calculate?pickupCityId=${pickupCityId}&destinationCityId=${destinationCityId}`
    );
  }

  /**
   * Validate parcel data before creation
   */
  async validateParcelData(data: CreateParcelRequest): Promise<
    ApiResponse<{
      isValid: boolean;
      errors: string[];
      warnings: string[];
      estimatedCost: {
        deliveryPrice: number;
        returnPrice: number;
        refusalPrice: number;
        deliveryDelay: number;
      };
    }>
  > {
    return this.post("/api/parcels/validate", data);
  }

  // ========================================
  // EXPORT OPERATIONS
  // ========================================

  /**
   * Export parcels to Excel
   */
  async exportParcels(filters?: ParcelFilters): Promise<
    ApiResponse<{
      downloadUrl: string;
      filename: string;
      totalRecords: number;
    }>
  > {
    return this.post("/api/parcels/export", { filters });
  }

  /**
   * Export parcel labels (for printing)
   */
  async exportParcelLabels(parcelIds: string[]): Promise<
    ApiResponse<{
      downloadUrl: string;
      filename: string;
    }>
  > {
    return this.post("/api/parcels/export-labels", { parcelIds });
  }

  // ========================================
  // SCANNING OPERATIONS (for mobile/barcode integration)
  // ========================================

  /**
   * Scan parcel by barcode/QR code
   */
  async scanParcel(code: string): Promise<
    ApiResponse<{
      parcel: Parcel;
      scanValid: boolean;
      allowedActions: string[];
    }>
  > {
    return this.post("/api/parcels/scan", { code });
  }

  /**
   * Process scanned parcels for operations
   */
  async processScan(
    codes: string[],
    operation: string,
    metadata?: any
  ): Promise<
    ApiResponse<{
      processed: number;
      failed: number;
      results: Array<{
        code: string;
        success: boolean;
        error?: string;
        parcel?: Parcel;
      }>;
    }>
  > {
    return this.post("/api/parcels/process-scan", {
      codes,
      operation,
      metadata,
    });
  }
}

// Export singleton instance
export const parcelsApiClient = new ParcelsApiClient();
