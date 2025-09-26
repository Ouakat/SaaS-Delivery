import { BaseApiClient, ApiResponse } from "../../base.client";
import type {
  DeliverySlip,
  CreateDeliverySlipRequest,
  UpdateDeliverySlipRequest,
  DeliverySlipFilters,
  DeliverySlipStatistics,
  AvailableParcel,
  AddParcelsToSlipRequest,
  RemoveParcelsFromSlipRequest,
  ReceiveSlipRequest,
  BulkSlipActionRequest,
  ScanParcelResult,
} from "@/lib/types/parcels/delivery-slips.types";

export class DeliverySlipsApiClient extends BaseApiClient {
  constructor() {
    super("parcels");
  }

  // ========================================
  // DELIVERY SLIPS CRUD OPERATIONS
  // ========================================

  async createDeliverySlip(
    request: CreateDeliverySlipRequest
  ): Promise<ApiResponse<DeliverySlip>> {
    return this.post<DeliverySlip>("/api/delivery-slips", request);
  }

  async getDeliverySlips(filters?: DeliverySlipFilters) {
    return this.getPaginated<DeliverySlip>("/api/delivery-slips", filters);
  }

  async getDeliverySlipById(id: string): Promise<ApiResponse<DeliverySlip>> {
    return this.get<DeliverySlip>(`/api/delivery-slips/${id}`);
  }

  async updateDeliverySlip(
    id: string,
    request: UpdateDeliverySlipRequest
  ): Promise<ApiResponse<DeliverySlip>> {
    return this.patch<DeliverySlip>(`/api/delivery-slips/${id}`, request);
  }

  async deleteDeliverySlip(id: string): Promise<ApiResponse<void>> {
    return this.delete<void>(`/api/delivery-slips/${id}`);
  }

  // ========================================
  // PARCEL MANAGEMENT IN SLIPS
  // ========================================

  async getAvailableParcels(
    cityId?: string
  ): Promise<ApiResponse<AvailableParcel[]>> {
    const params = cityId ? `?cityId=${cityId}` : "";
    return this.get<AvailableParcel[]>(
      `/api/delivery-slips/available-parcels${params}`
    );
  }

  async addParcelsToSlip(
    id: string,
    request: AddParcelsToSlipRequest
  ): Promise<ApiResponse<DeliverySlip>> {
    return this.post<DeliverySlip>(
      `/api/delivery-slips/${id}/add-parcels`,
      request
    );
  }

  async removeParcelsFromSlip(
    id: string,
    request: RemoveParcelsFromSlipRequest
  ): Promise<ApiResponse<DeliverySlip>> {
    return this.post<DeliverySlip>(
      `/api/delivery-slips/${id}/remove-parcels`,
      request
    );
  }

  // ========================================
  // SLIP WORKFLOW OPERATIONS
  // ========================================

  async receiveSlip(
    id: string,
    request: ReceiveSlipRequest
  ): Promise<ApiResponse<DeliverySlip>> {
    return this.post<DeliverySlip>(
      `/api/delivery-slips/${id}/receive`,
      request
    );
  }

  async bulkSlipAction(
    request: BulkSlipActionRequest
  ): Promise<
    ApiResponse<{ success: number; failed: number; errors: string[] }>
  > {
    return this.post(`/api/delivery-slips/bulk-action`, request);
  }

  // ========================================
  // SCANNER INTEGRATION
  // ========================================

  async scanParcelToSlip(
    slipId: string,
    parcelCode: string
  ): Promise<ApiResponse<ScanParcelResult>> {
    return this.post<ScanParcelResult>(
      `/api/delivery-slips/${slipId}/scan/${parcelCode}`,
      {}
    );
  }

  async generateSlipBarcode(id: string): Promise<
    ApiResponse<{
      reference: string;
      barcodeData: string;
      barcodeImage: string;
      qrCodeImage: string;
    }>
  > {
    return this.get(`/api/delivery-slips/${id}/barcode`);
  }

  // ========================================
  // DOCUMENT GENERATION
  // ========================================

  async downloadSlipPdf(id: string): Promise<ApiResponse<Blob>> {
    try {
      const response = await this.client.get(`/api/delivery-slips/${id}/pdf`, {
        responseType: "blob",
      });

      return {
        success: true,
        data: response.data,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw error;
    }
  }

  async downloadParcelLabels(id: string): Promise<ApiResponse<Blob>> {
    try {
      const response = await this.client.get(
        `/api/delivery-slips/${id}/labels`,
        {
          responseType: "blob",
        }
      );

      return {
        success: true,
        data: response.data,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw error;
    }
  }

  // ========================================
  // STATISTICS AND ANALYTICS
  // ========================================

  async getStatistics(): Promise<ApiResponse<DeliverySlipStatistics>> {
    return this.get<DeliverySlipStatistics>("/api/delivery-slips/statistics");
  }

  // ========================================
  // SEARCH AND FILTERS
  // ========================================

  async searchDeliverySlips(
    query: string
  ): Promise<ApiResponse<DeliverySlip[]>> {
    return this.get<DeliverySlip[]>(
      `/api/delivery-slips?search=${encodeURIComponent(query)}&limit=20`
    );
  }

  async getSlipsByStatus(status: string): Promise<ApiResponse<DeliverySlip[]>> {
    return this.get<DeliverySlip[]>(`/api/delivery-slips?status=${status}`);
  }

  async getSlipsByCity(cityId: string): Promise<ApiResponse<DeliverySlip[]>> {
    return this.get<DeliverySlip[]>(`/api/delivery-slips?cityId=${cityId}`);
  }

  async getSlipsByDateRange(
    startDate: string,
    endDate: string
  ): Promise<ApiResponse<DeliverySlip[]>> {
    return this.get<DeliverySlip[]>(
      `/api/delivery-slips?startDate=${startDate}&endDate=${endDate}`
    );
  }

  // ========================================
  // VALIDATION HELPERS
  // ========================================

  async validateSlipReference(reference: string): Promise<
    ApiResponse<{
      isUnique: boolean;
      exists: boolean;
      slip?: DeliverySlip;
    }>
  > {
    return this.get(`/api/delivery-slips/validate-reference/${reference}`);
  }

  async checkParcelAvailability(parcelIds: string[]): Promise<
    ApiResponse<{
      available: string[];
      unavailable: string[];
      conflicts: Array<{
        parcelId: string;
        reason: string;
        conflictingSlip?: string;
      }>;
    }>
  > {
    return this.post(`/api/delivery-slips/check-parcels`, { parcelIds });
  }
}

// Export singleton instance
export const deliverySlipsApiClient = new DeliverySlipsApiClient();
