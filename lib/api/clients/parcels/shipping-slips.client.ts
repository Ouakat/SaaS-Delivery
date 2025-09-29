import { BaseApiClient, ApiResponse } from "../../base.client";
import type {
  ShippingSlip,
  CreateShippingSlipRequest,
  UpdateShippingSlipRequest,
  ShippingSlipFilters,
  ShippingSlipStats,
  AddParcelsToShippingSlipRequest,
  RemoveParcelsFromShippingSlipRequest,
  AvailableParcel,
  PaginatedShippingSlips,
} from "@/lib/types/parcels/shipping-slips.types";

export class ShippingSlipsApiClient extends BaseApiClient {
  constructor() {
    super("parcels");
  }

  // ========================================
  // SHIPPING SLIP MANAGEMENT
  // ========================================

  async createShippingSlip(
    request: CreateShippingSlipRequest
  ): Promise<ApiResponse<ShippingSlip>> {
    return this.post<ShippingSlip>("/api/shipping-slips", request);
  }

  async getShippingSlips(filters?: ShippingSlipFilters) {
    return this.getPaginated<ShippingSlip>("/api/shipping-slips", filters);
  }

  async getShippingSlipById(id: string): Promise<ApiResponse<ShippingSlip>> {
    return this.get<ShippingSlip>(`/api/shipping-slips/${id}`);
  }

  async updateShippingSlip(
    id: string,
    request: UpdateShippingSlipRequest
  ): Promise<ApiResponse<ShippingSlip>> {
    return this.patch<ShippingSlip>(`/api/shipping-slips/${id}`, request);
  }

  async deleteShippingSlip(id: string): Promise<ApiResponse<void>> {
    return this.delete<void>(`/api/shipping-slips/${id}`);
  }

  // ========================================
  // PARCEL MANAGEMENT
  // ========================================

  async addParcelsToSlip(
    slipId: string,
    request: AddParcelsToShippingSlipRequest
  ): Promise<ApiResponse<ShippingSlip>> {
    return this.post<ShippingSlip>(
      `/api/shipping-slips/${slipId}/add-parcels`,
      request
    );
  }

  async removeParcelsFromSlip(
    slipId: string,
    request: RemoveParcelsFromShippingSlipRequest
  ): Promise<ApiResponse<ShippingSlip>> {
    return this.post<ShippingSlip>(
      `/api/shipping-slips/${slipId}/remove-parcels`,
      request
    );
  }

  async getAvailableParcels(
    destinationZoneId: string,
    search?: string
  ): Promise<ApiResponse<AvailableParcel[]>> {
    const params = { destinationZoneId, search };
    return this.get<AvailableParcel[]>(
      "/api/shipping-slips/available-parcels",
      {
        params,
      }
    );
  }

  // ========================================
  // SHIPPING OPERATIONS
  // ========================================

  async scanParcel(
    slipId: string,
    parcelCode: string
  ): Promise<ApiResponse<any>> {
    return this.post<any>(`/api/shipping-slips/${slipId}/scan-parcel`, {
      parcelCode,
    });
  }

  async bulkScanParcels(
    slipId: string,
    parcelCodes: string[]
  ): Promise<ApiResponse<any>> {
    return this.post<any>(`/api/shipping-slips/${slipId}/scan-bulk`, {
      parcelCodes,
    });
  }

  async markAsShipped(slipId: string): Promise<ApiResponse<ShippingSlip>> {
    return this.post<ShippingSlip>(`/api/shipping-slips/${slipId}/ship`);
  }

  async markAsReceived(slipId: string): Promise<ApiResponse<ShippingSlip>> {
    return this.post<ShippingSlip>(`/api/shipping-slips/${slipId}/receive`);
  }

  async cancelShippingSlip(slipId: string): Promise<ApiResponse<ShippingSlip>> {
    return this.post<ShippingSlip>(`/api/shipping-slips/${slipId}/cancel`);
  }

  // ========================================
  // STATISTICS
  // ========================================

  async getShippingSlipStats(): Promise<ApiResponse<ShippingSlipStats>> {
    return this.get<ShippingSlipStats>("/api/shipping-slips/stats");
  }

  // ========================================
  // EXPORT
  // ========================================

  async generatePDF(id: string): Promise<ApiResponse<Blob>> {
    return this.get<Blob>(`/api/shipping-slips/${id}/pdf`, {
      responseType: "blob",
    });
  }
}

export const shippingSlipsApiClient = new ShippingSlipsApiClient();
