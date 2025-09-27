import { BaseApiClient, PaginatedResponse } from "../base.client";
import {
  Expedition,
  CreateExpeditionDto,
  UpdateExpeditionDto,
  BulkStatusUpdateDto,
  BulkStatusUpdateResponse,
  ReceiveExpeditionDto,
  ReceiveExpeditionResponse,
  ExpeditionAnalyticsQuery,
  ExpeditionAnalyticsResponse,
  ExportExpeditionsQuery,
  ExportExpeditionsResponse,
  SearchExpeditionsDto,
  SearchExpeditionsResponse,
  UpdateExpeditionItemDto,
  ExpeditionItem,
  AddExpeditionItemsDto,
  AddExpeditionItemsResponse,
  ReportDiscrepancyDto,
  ReportDiscrepancyResponse,
  ExpeditionHistory,
  GenerateDocumentQuery,
  GenerateDocumentResponse,
  ImportExpeditionsDto,
  ImportExpeditionsResponse,
  CloneExpeditionDto,
  CloneExpeditionResponse,
  WarehouseExpeditionsQuery,
  WarehouseExpeditionsResponse,
  SellerExpeditionsQuery,
  SellerExpeditionsResponse,
  ValidateExpeditionResponse,
  DashboardStatistics,
  UpdateMultipleItemsDto,
  UpdateMultipleItemsResponse,
  CancelExpeditionDto,
  CancelExpeditionResponse,
  AvailableProductsQuery,
  AvailableProductsResponse,
} from "@/lib/types/expedition.types";

export class ExpeditionClient extends BaseApiClient {
  constructor() {
    super("expeditions");
  }

  // CRUD Operations
  async create(data: CreateExpeditionDto): Promise<Expedition> {
    const response = await this.post<Expedition>("/api/expeditions", data);
    return response.data!;
  }

  async getAll(params?: Record<string, any>): Promise<PaginatedResponse<Expedition>> {
    const response = await this.getPaginated<Expedition>("/api/expeditions", params);
    return response;
  }

  async getById(id: string): Promise<Expedition> {
    const response = await this.get<Expedition>(`/api/expeditions/${id}`);
    return response.data!;
  }

  async update(id: string, data: UpdateExpeditionDto): Promise<Expedition> {
    const response = await this.put<Expedition>(`/api/expeditions/${id}`, data);
    return response.data!;
  }

  async delete(id: string): Promise<void> {
    await this.delete(`/api/expeditions/${id}`);
  }

  // Bulk Operations
  async bulkStatusUpdate(data: BulkStatusUpdateDto): Promise<BulkStatusUpdateResponse> {
    const response = await this.post<BulkStatusUpdateResponse>(
      "/api/expeditions/bulk-status",
      data
    );
    return response.data!;
  }

  // Receive Expedition
  async receive(id: string, data: ReceiveExpeditionDto): Promise<ReceiveExpeditionResponse> {
    const response = await this.post<ReceiveExpeditionResponse>(
      `/api/expeditions/${id}/receive`,
      data
    );
    return response.data!;
  }

  async validateReceive(id: string, data: ReceiveExpeditionDto): Promise<{
    valid: boolean;
    errors: Array<{ field: string; message: string; itemId?: string }>;
    warnings: Array<{ field: string; message: string; itemId?: string }>;
  }> {
    const response = await this.post(`/api/expeditions/${id}/receive/validate`, data);
    return response.data!;
  }

  // Analytics
  async getAnalytics(query: ExpeditionAnalyticsQuery): Promise<ExpeditionAnalyticsResponse> {
    const response = await this.get<ExpeditionAnalyticsResponse>("/api/expeditions/analytics", {
      params: query,
    });
    return response.data!;
  }

  // Export
  async export(query: ExportExpeditionsQuery): Promise<ExportExpeditionsResponse> {
    const response = await this.get<ExportExpeditionsResponse>("/api/expeditions/export", {
      params: query,
    });
    return response.data!;
  }

  // Search
  async search(data: SearchExpeditionsDto): Promise<SearchExpeditionsResponse> {
    const response = await this.post<SearchExpeditionsResponse>("/api/expeditions/search", data);
    return response.data!;
  }

  // Item Management
  async updateItem(
    expeditionId: string,
    itemId: string,
    data: UpdateExpeditionItemDto
  ): Promise<{ item: ExpeditionItem; expedition: Expedition }> {
    const response = await this.patch<{ item: ExpeditionItem; expedition: Expedition }>(
      `/api/expeditions/${expeditionId}/items/${itemId}`,
      data
    );
    return response.data!;
  }

  async addItems(id: string, data: AddExpeditionItemsDto): Promise<AddExpeditionItemsResponse> {
    const response = await this.post<AddExpeditionItemsResponse>(
      `/api/expeditions/${id}/items`,
      data
    );
    return response.data!;
  }

  async removeItem(expeditionId: string, itemId: string): Promise<Expedition> {
    const response = await this.delete<{ expedition: Expedition }>(
      `/api/expeditions/${expeditionId}/items/${itemId}`
    );
    return response.data!.expedition;
  }

  async updateMultipleItems(
    id: string,
    data: UpdateMultipleItemsDto
  ): Promise<UpdateMultipleItemsResponse> {
    const response = await this.patch<UpdateMultipleItemsResponse>(
      `/api/expeditions/${id}/items`,
      data
    );
    return response.data!;
  }

  // Discrepancy Management
  async reportDiscrepancy(
    id: string,
    data: ReportDiscrepancyDto
  ): Promise<ReportDiscrepancyResponse> {
    const response = await this.post<ReportDiscrepancyResponse>(
      `/api/expeditions/${id}/discrepancy`,
      data
    );
    return response.data!;
  }

  // History
  async getHistory(id: string): Promise<ExpeditionHistory[]> {
    const response = await this.get<{ history: ExpeditionHistory[] }>(
      `/api/expeditions/${id}/history`
    );
    return response.data!.history;
  }

  // Documents
  async generateReceipt(
    id: string,
    query: GenerateDocumentQuery
  ): Promise<GenerateDocumentResponse> {
    const response = await this.get<GenerateDocumentResponse>(
      `/api/expeditions/${id}/receipt`,
      { params: query }
    );
    return response.data!;
  }

  // Import/Export
  async import(data: ImportExpeditionsDto): Promise<ImportExpeditionsResponse> {
    const formData = new FormData();
    formData.append("file", data.file);
    if (data.mappingRules) {
      formData.append("mappingRules", JSON.stringify(data.mappingRules));
    }
    if (data.validateOnly !== undefined) {
      formData.append("validateOnly", String(data.validateOnly));
    }

    const response = await this.post<ImportExpeditionsResponse>("/api/expeditions/import", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data!;
  }

  // Clone
  async clone(id: string, data: CloneExpeditionDto): Promise<CloneExpeditionResponse> {
    const response = await this.post<CloneExpeditionResponse>(
      `/api/expeditions/${id}/clone`,
      data
    );
    return response.data!;
  }

  // Warehouse Operations
  async getWarehouseExpeditions(
    warehouseId: string,
    query: WarehouseExpeditionsQuery
  ): Promise<WarehouseExpeditionsResponse> {
    const response = await this.get<WarehouseExpeditionsResponse>(
      `/api/warehouses/${warehouseId}/expeditions`,
      { params: query }
    );
    return response.data!;
  }

  // Seller Operations
  async getSellerExpeditions(
    sellerId: string,
    query: SellerExpeditionsQuery
  ): Promise<SellerExpeditionsResponse> {
    const response = await this.get<SellerExpeditionsResponse>(
      `/api/sellers/${sellerId}/expeditions`,
      { params: query }
    );
    return response.data!;
  }

  // Validation
  async validate(data: CreateExpeditionDto): Promise<ValidateExpeditionResponse> {
    const response = await this.post<ValidateExpeditionResponse>("/api/expeditions/validate", data);
    return response.data!;
  }

  // Dashboard
  async getDashboardStatistics(): Promise<DashboardStatistics> {
    const response = await this.get<DashboardStatistics>("/api/expeditions/dashboard");
    return response.data!;
  }

  // Cancel
  async cancel(id: string, data: CancelExpeditionDto): Promise<CancelExpeditionResponse> {
    const response = await this.post<CancelExpeditionResponse>(
      `/api/expeditions/${id}/cancel`,
      data
    );
    return response.data!;
  }

  // Available Products
  async getAvailableProducts(query: AvailableProductsQuery): Promise<AvailableProductsResponse> {
    const response = await this.get<AvailableProductsResponse>(
      "/api/expeditions/available-products",
      { params: query }
    );
    return response.data!;
  }
}

// Export singleton instance
export const expeditionClient = new ExpeditionClient();