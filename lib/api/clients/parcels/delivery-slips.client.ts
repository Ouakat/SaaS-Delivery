import { BaseApiClient, ApiResponse } from "../../base.client";
import type {
  DeliverySlip,
  CreateDeliverySlipRequest,
  UpdateDeliverySlipRequest,
  DeliverySlipFilters,
  AddParcelsToSlipRequest,
  RemoveParcelsFromSlipRequest,
  ReceiveSlipRequest,
  DeliverySlipStats,
  BulkSlipActionRequest,
  AvailableParcel,
  PaginatedDeliverySlips,
} from "@/lib/types/parcels/delivery-slips.types";

export class DeliverySlipsApiClient extends BaseApiClient {
  constructor() {
    super("parcels");
  }

  // ========================================
  // DELIVERY SLIP MANAGEMENT ENDPOINTS
  // ========================================

  /**
   * Create new delivery slip
   */
  async createDeliverySlip(
    request: CreateDeliverySlipRequest
  ): Promise<ApiResponse<DeliverySlip>> {
    return this.post<DeliverySlip>("/api/delivery-slips", request);
  }

  /**
   * Get delivery slips with filters and pagination
   */
  async getDeliverySlips(filters?: DeliverySlipFilters) {
    return this.getPaginated<DeliverySlip>("/api/delivery-slips", filters);
  }

  /**
   * Get delivery slip by ID
   */
  async getDeliverySlipById(id: string): Promise<ApiResponse<DeliverySlip>> {
    return this.get<DeliverySlip>(`/api/delivery-slips/${id}`);
  }

  /**
   * Update delivery slip
   */
  async updateDeliverySlip(
    id: string,
    request: UpdateDeliverySlipRequest
  ): Promise<ApiResponse<DeliverySlip>> {
    return this.patch<DeliverySlip>(`/api/delivery-slips/${id}`, request);
  }

  /**
   * Delete delivery slip
   */
  async deleteDeliverySlip(id: string): Promise<ApiResponse<void>> {
    return this.delete<void>(`/api/delivery-slips/${id}`);
  }

  // ========================================
  // PARCEL MANAGEMENT WITHIN SLIPS
  // ========================================

  /**
   * Add parcels to delivery slip
   */
  async addParcelsToSlip(
    slipId: string,
    request: AddParcelsToSlipRequest
  ): Promise<ApiResponse<DeliverySlip>> {
    return this.post<DeliverySlip>(
      `/api/delivery-slips/${slipId}/add-parcels`,
      request
    );
  }

  /**
   * Remove parcels from delivery slip
   */
  async removeParcelsFromSlip(
    slipId: string,
    request: RemoveParcelsFromSlipRequest
  ): Promise<ApiResponse<DeliverySlip>> {
    return this.post<DeliverySlip>(
      `/api/delivery-slips/${slipId}/remove-parcels`,
      request
    );
  }

  /**
   * Get available parcels for delivery slips
   */
  async getAvailableParcels(
    cityId?: string
  ): Promise<ApiResponse<AvailableParcel[]>> {
    const params = cityId ? { cityId } : {};
    return this.get<AvailableParcel[]>(
      "/api/delivery-slips/available-parcels",
      { params }
    );
  }

  // ========================================
  // DELIVERY SLIP OPERATIONS
  // ========================================

  /**
   * Mark delivery slip as received
   */
  async receiveSlip(
    slipId: string,
    request: ReceiveSlipRequest
  ): Promise<ApiResponse<DeliverySlip>> {
    return this.post<DeliverySlip>(
      `/api/delivery-slips/${slipId}/receive`,
      request
    );
  }

  /**
   * Scan parcel into delivery slip
   */
  async scanParcelIntoSlip(
    slipId: string,
    parcelCode: string
  ): Promise<ApiResponse<any>> {
    return this.post<any>(`/api/delivery-slips/${slipId}/scan/${parcelCode}`);
  }

  // ========================================
  // BULK OPERATIONS
  // ========================================

  /**
   * Perform bulk actions on delivery slips
   */
  async bulkAction(
    request: BulkSlipActionRequest
  ): Promise<
    ApiResponse<{ success: number; failed: number; errors: string[] }>
  > {
    return this.post<{ success: number; failed: number; errors: string[] }>(
      "/api/delivery-slips/bulk-action",
      request
    );
  }

  // ========================================
  // STATISTICS AND ANALYTICS
  // ========================================

  /**
   * Get delivery slip statistics
   */
  async getDeliverySlipStats(): Promise<ApiResponse<DeliverySlipStats>> {
    return this.get<DeliverySlipStats>("/api/delivery-slips/statistics");
  }

  // ========================================
  // EXPORT AND DOWNLOAD OPERATIONS
  // ========================================

  /**
   * Export delivery slips
   */
  async exportDeliverySlips(filters?: DeliverySlipFilters): Promise<Blob> {
    try {
      const response = await this.client.post(
        "/api/delivery-slips/export",
        filters || {},
        {
          responseType: "blob",
        }
      );
      return response.data; // Return the blob directly
    } catch (error) {
      throw error;
    }
  }

  /**
   * Download delivery slip PDF
   */
  async downloadSlipPdf(id: string): Promise<ApiResponse<Blob>> {
    return this.get<Blob>(`/api/delivery-slips/${id}/pdf`, {
      responseType: "blob",
    });
  }

  /**
   * Download delivery slip labels
   */
  async downloadSlipLabels(id: string): Promise<ApiResponse<Blob>> {
    return this.get<Blob>(`/api/delivery-slips/${id}/labels`, {
      responseType: "blob",
    });
  }

  // ========================================
  // UTILITY OPERATIONS
  // ========================================

  /**
   * Get delivery slip barcode
   */
  async getSlipBarcode(id: string): Promise<ApiResponse<any>> {
    return this.get<any>(`/api/delivery-slips/${id}/barcode`);
  }
}

// Export singleton instance
export const deliverySlipsApiClient = new DeliverySlipsApiClient();
