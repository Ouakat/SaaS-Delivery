import { BaseApiClient, PaginatedResponse } from "@/lib/api/base.client";
import { Warehouse, Stock } from "@/lib/types/product.types";
import {
  WarehouseListParams,
  CreateWarehouseRequest,
  UpdateWarehouseRequest,
  WarehouseWithStats,
  WarehouseStockSummary,
  StockMovementRequest,
  StockTransferRequest,
} from "@/lib/types/warehouse.types";

export class WarehouseApiClient extends BaseApiClient {
  constructor() {
    super("products"); // Using 'products' service from API_CONFIG (assuming warehouses are part of the same service)
  }

  // Warehouses API
  async getWarehouses(params?: WarehouseListParams): Promise<PaginatedResponse<Warehouse>> {
    return this.getPaginated<Warehouse>("/api/warehouses", params);
  }

  async getWarehouse(id: string, params?: { includeStocks?: boolean }): Promise<Warehouse> {
    const response = await this.get<Warehouse>(`/api/warehouses/${id}`, { params });
    return response.data!;
  }

  async getWarehouseWithStats(id: string): Promise<WarehouseWithStats> {
    const response = await this.get<WarehouseWithStats>(`/api/warehouses/${id}/stats`);
    return response.data!;
  }

  async createWarehouse(data: CreateWarehouseRequest): Promise<Warehouse> {
    const response = await this.post<Warehouse>("/api/warehouses", data);
    return response.data!;
  }

  async updateWarehouse(id: string, data: UpdateWarehouseRequest): Promise<Warehouse> {
    const response = await this.patch<Warehouse>(`/api/warehouses/${id}`, data);
    return response.data!;
  }

  async deleteWarehouse(id: string): Promise<void> {
    await this.delete(`/api/warehouses/${id}`);
  }

  // Warehouse Stock Management API
  async getWarehouseStocks(warehouseId: string, params?: {
    skip?: number;
    take?: number;
    includeProduct?: boolean;
    includeVariant?: boolean;
    search?: string;
  }): Promise<PaginatedResponse<Stock>> {
    return this.getPaginated<Stock>(`/api/warehouses/${warehouseId}/stocks`, params);
  }

  async getWarehouseStockSummary(warehouseId: string): Promise<WarehouseStockSummary> {
    const response = await this.get<WarehouseStockSummary>(`/api/warehouses/${warehouseId}/stock-summary`);
    return response.data!;
  }

  async getAllWarehouseStockSummaries(): Promise<WarehouseStockSummary[]> {
    const response = await this.get<WarehouseStockSummary[]>("/api/warehouses/stock-summaries");
    return response.data!;
  }

  // Stock Movement Operations
  async createStockMovement(warehouseId: string, data: StockMovementRequest): Promise<Stock> {
    const response = await this.post<Stock>(`/api/warehouses/${warehouseId}/stock-movements`, data);
    return response.data!;
  }

  async transferStock(data: StockTransferRequest): Promise<{
    fromStock: Stock;
    toStock: Stock;
  }> {
    const response = await this.post(`/api/warehouses/stock-transfers`, data);
    return response.data!;
  }

  async getStockHistory(warehouseId: string, params?: {
    skip?: number;
    take?: number;
    productId?: string;
    variantId?: string;
    reason?: string;
    dateFrom?: string;
    dateTo?: string;
  }) {
    return this.getPaginated(`/api/warehouses/${warehouseId}/stock-history`, params);
  }

  // Utility methods for warehouse management
  async searchWarehouses(query: string, params?: Omit<WarehouseListParams, 'search'>): Promise<PaginatedResponse<Warehouse>> {
    return this.getWarehouses({ ...params, search: query });
  }

  async getWarehousesByLocation(location: string): Promise<Warehouse[]> {
    const response = await this.get<Warehouse[]>(`/api/warehouses/by-location`, {
      params: { location }
    });
    return response.data!;
  }

  async getWarehousesWithLowStock(threshold: number = 10): Promise<Warehouse[]> {
    const response = await this.get<Warehouse[]>(`/api/warehouses/low-stock`, {
      params: { threshold }
    });
    return response.data!;
  }

  async getWarehouseCapacityReport(warehouseId: string): Promise<{
    totalCapacity: number;
    usedCapacity: number;
    availableCapacity: number;
    utilizationPercentage: number;
  }> {
    const response = await this.get(`/api/warehouses/${warehouseId}/capacity-report`);
    return response.data!;
  }

  // Stock level management
  async adjustStockLevel(warehouseId: string, stockId: string, newQuantity: number, reason?: string): Promise<Stock> {
    const response = await this.patch<Stock>(`/api/warehouses/${warehouseId}/stocks/${stockId}/adjust`, {
      quantity: newQuantity,
      reason: reason || 'ADJUSTMENT'
    });
    return response.data!;
  }

  async reserveStock(warehouseId: string, stockId: string, quantity: number, reference?: string): Promise<Stock> {
    const response = await this.patch<Stock>(`/api/warehouses/${warehouseId}/stocks/${stockId}/reserve`, {
      quantity,
      reference
    });
    return response.data!;
  }

  async releaseReservedStock(warehouseId: string, stockId: string, quantity: number, reference?: string): Promise<Stock> {
    const response = await this.patch<Stock>(`/api/warehouses/${warehouseId}/stocks/${stockId}/release`, {
      quantity,
      reference
    });
    return response.data!;
  }

  // Bulk operations
  async bulkUpdateStocks(warehouseId: string, updates: Array<{
    stockId: string;
    quantity?: number;
    reserved?: number;
    reason?: string;
  }>): Promise<Stock[]> {
    const response = await this.patch<Stock[]>(`/api/warehouses/${warehouseId}/stocks/bulk-update`, {
      updates
    });
    return response.data!;
  }

  async exportWarehouseData(warehouseId: string, format: 'csv' | 'xlsx' = 'csv'): Promise<Blob> {
    const response = await this.client.get(`/api/warehouses/${warehouseId}/export`, {
      params: { format },
      responseType: 'blob'
    });
    return response.data;
  }

  async importWarehouseData(warehouseId: string, file: File): Promise<{
    success: boolean;
    imported: number;
    errors: Array<{ row: number; error: string; }>;
  }> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await this.post(`/api/warehouses/${warehouseId}/import`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data!;
  }
}

// Create singleton instance
export const warehouseApi = new WarehouseApiClient();
