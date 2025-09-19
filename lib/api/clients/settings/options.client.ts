import {
  BaseApiClient,
  ApiResponse,
  PaginatedResponse,
} from "../../base.client";
import type {
  ParcelStatus,
  ClientType,
  Bank,
  CreateParcelStatusRequest,
  UpdateParcelStatusRequest,
  CreateClientTypeRequest,
  UpdateClientTypeRequest,
  CreateBankRequest,
  UpdateBankRequest,
  ParcelStatusFilters,
  ClientTypeFilters,
  BankFilters,
  OptionStats,
  BulkActionResult,
} from "@/lib/types/settings/options.types";

export class OptionsApiClient extends BaseApiClient {
  constructor() {
    super("settings");
  }

  // ========================================
  // PARCEL STATUSES
  // ========================================

  async getParcelStatuses(
    filters?: ParcelStatusFilters
  ): Promise<ApiResponse<ParcelStatus[]>> {
    return this.get<ParcelStatus[]>("/api/options/parcel-statuses", {
      params: filters,
    });
  }

  async getParcelStatusById(id: string): Promise<ApiResponse<ParcelStatus>> {
    return this.get<ParcelStatus>(`/api/options/parcel-statuses/${id}`);
  }

  async createParcelStatus(
    data: CreateParcelStatusRequest
  ): Promise<ApiResponse<ParcelStatus>> {
    return this.post<ParcelStatus>("/api/options/parcel-statuses", data);
  }

  async updateParcelStatus(
    id: string,
    data: UpdateParcelStatusRequest
  ): Promise<ApiResponse<ParcelStatus>> {
    return this.patch<ParcelStatus>(`/api/options/parcel-statuses/${id}`, data);
  }

  async deleteParcelStatus(id: string): Promise<ApiResponse<void>> {
    return this.delete<void>(`/api/options/parcel-statuses/${id}`);
  }

  async toggleParcelStatusStatus(
    id: string
  ): Promise<ApiResponse<ParcelStatus>> {
    return this.patch<ParcelStatus>(
      `/api/options/parcel-statuses/${id}/toggle-status`,
      {}
    );
  }

  async getActiveParcelStatuses(): Promise<ApiResponse<ParcelStatus[]>> {
    return this.get<ParcelStatus[]>("/api/options/parcel-statuses/active");
  }

  async bulkDeleteParcelStatuses(
    ids: string[]
  ): Promise<ApiResponse<BulkActionResult>> {
    return this.post<BulkActionResult>(
      "/api/options/parcel-statuses/bulk-delete",
      { ids }
    );
  }

  async bulkToggleParcelStatuses(
    ids: string[]
  ): Promise<ApiResponse<BulkActionResult>> {
    return this.post<BulkActionResult>(
      "/api/options/parcel-statuses/bulk-toggle",
      { ids }
    );
  }

  // ========================================
  // CLIENT TYPES
  // ========================================

  async getClientTypes(
    filters?: ClientTypeFilters
  ): Promise<ApiResponse<ClientType[]>> {
    return this.get<ClientType[]>("/api/options/client-types", {
      params: filters,
    });
  }

  async getClientTypeById(id: string): Promise<ApiResponse<ClientType>> {
    return this.get<ClientType>(`/api/options/client-types/${id}`);
  }

  async createClientType(
    data: CreateClientTypeRequest
  ): Promise<ApiResponse<ClientType>> {
    return this.post<ClientType>("/api/options/client-types", data);
  }

  async updateClientType(
    id: string,
    data: UpdateClientTypeRequest
  ): Promise<ApiResponse<ClientType>> {
    return this.patch<ClientType>(`/api/options/client-types/${id}`, data);
  }

  async deleteClientType(id: string): Promise<ApiResponse<void>> {
    return this.delete<void>(`/api/options/client-types/${id}`);
  }

  async toggleClientTypeStatus(id: string): Promise<ApiResponse<ClientType>> {
    return this.patch<ClientType>(
      `/api/options/client-types/${id}/toggle-status`,
      {}
    );
  }

  async getActiveClientTypes(): Promise<ApiResponse<ClientType[]>> {
    return this.get<ClientType[]>("/api/options/client-types/active");
  }

  async bulkDeleteClientTypes(
    ids: string[]
  ): Promise<ApiResponse<BulkActionResult>> {
    return this.post<BulkActionResult>(
      "/api/options/client-types/bulk-delete",
      {
        ids,
      }
    );
  }

  async bulkToggleClientTypes(
    ids: string[]
  ): Promise<ApiResponse<BulkActionResult>> {
    return this.post<BulkActionResult>(
      "/api/options/client-types/bulk-toggle",
      {
        ids,
      }
    );
  }

  // ========================================
  // BANKS
  // ========================================

  async getBanks(filters?: BankFilters): Promise<ApiResponse<Bank[]>> {
    return this.get<Bank[]>("/api/options/banks", {
      params: filters,
    });
  }

  async getBankById(id: string): Promise<ApiResponse<Bank>> {
    return this.get<Bank>(`/api/options/banks/${id}`);
  }

  async createBank(data: CreateBankRequest): Promise<ApiResponse<Bank>> {
    return this.post<Bank>("/api/options/banks", data);
  }

  async updateBank(
    id: string,
    data: UpdateBankRequest
  ): Promise<ApiResponse<Bank>> {
    return this.patch<Bank>(`/api/options/banks/${id}`, data);
  }

  async deleteBank(id: string): Promise<ApiResponse<void>> {
    return this.delete<void>(`/api/options/banks/${id}`);
  }

  async toggleBankStatus(id: string): Promise<ApiResponse<Bank>> {
    return this.patch<Bank>(`/api/options/banks/${id}/toggle-status`, {});
  }

  async getActiveBanks(): Promise<ApiResponse<Bank[]>> {
    return this.get<Bank[]>("/api/options/banks/active");
  }

  async bulkDeleteBanks(ids: string[]): Promise<ApiResponse<BulkActionResult>> {
    return this.post<BulkActionResult>("/api/options/banks/bulk-delete", {
      ids,
    });
  }

  async bulkToggleBanks(ids: string[]): Promise<ApiResponse<BulkActionResult>> {
    return this.post<BulkActionResult>("/api/options/banks/bulk-toggle", {
      ids,
    });
  }

  // ========================================
  // STATISTICS
  // ========================================

  async getOptionsStats(): Promise<ApiResponse<OptionStats>> {
    return this.get<OptionStats>("/api/options/stats");
  }

  async exportOptions(
    type: "parcel-statuses" | "client-types" | "banks",
    filters?: any
  ): Promise<ApiResponse<{ downloadUrl: string; filename: string }>> {
    return this.post(`/api/options/${type}/export`, { filters });
  }

  // ========================================
  // BULK IMPORT
  // ========================================

  async importParcelStatuses(
    data: CreateParcelStatusRequest[]
  ): Promise<ApiResponse<BulkActionResult>> {
    return this.post<BulkActionResult>(
      "/api/options/parcel-statuses/bulk-import",
      data
    );
  }

  async importClientTypes(
    data: CreateClientTypeRequest[]
  ): Promise<ApiResponse<BulkActionResult>> {
    return this.post<BulkActionResult>(
      "/api/options/client-types/bulk-import",
      data
    );
  }

  async importBanks(
    data: CreateBankRequest[]
  ): Promise<ApiResponse<BulkActionResult>> {
    return this.post<BulkActionResult>("/api/options/banks/bulk-import", data);
  }
}

// Export singleton instance
export const optionsApiClient = new OptionsApiClient();
