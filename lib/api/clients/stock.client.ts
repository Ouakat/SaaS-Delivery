import { BaseApiClient, PaginatedResponse } from "@/lib/api/base.client";
import { Stock, StockHistory, Warehouse } from "@/lib/types/product.types";

export interface StockAdjustmentRequest {
  change: number;
  reason: 'INBOUND' | 'OUTBOUND' | 'ADJUSTMENT' | 'RESERVATION' | 'CANCEL_RESERVATION';
  reference?: string;
}

export interface CreateStockRequest {
  warehouseId: string;
  productId?: string;
  variantId?: string;
  quantity: number;
  defective?: number;
}

export interface StockReservationRequest {
  quantity: number;
  reference?: string;
}

export class StockApiClient extends BaseApiClient {
  constructor() {
    super("products");
  }

  // Stock CRUD operations
  async getStocks(params?: {
    skip?: number;
    take?: number;
    includeRelations?: boolean;
    warehouseId?: string;
    productId?: string;
    variantId?: string;
    threshold?: number;
  }): Promise<PaginatedResponse<Stock>> {
    return this.getPaginated<Stock>("/api/stocks", params);
  }

  async getStock(id: string): Promise<Stock> {
    const response = await this.get<Stock>(`/api/stocks/${id}`);
    return response.data!;
  }

  async createStock(data: CreateStockRequest): Promise<Stock> {
    const response = await this.post<Stock>("/api/stocks", data);
    return response.data!;
  }

  async updateStock(id: string, data: Partial<CreateStockRequest>): Promise<Stock> {
    const response = await this.patch<Stock>(`/api/stocks/${id}`, data);
    return response.data!;
  }

  async deleteStock(id: string): Promise<void> {
    await this.delete(`/api/stocks/${id}`);
  }

  // Stock by location queries
  async getStocksByWarehouse(warehouseId: string, params?: {
    skip?: number;
    take?: number;
    includeRelations?: boolean;
  }): Promise<PaginatedResponse<Stock>> {
    return this.getPaginated<Stock>(`/api/stocks/by-warehouse/${warehouseId}`, params);
  }

  async getStocksByProduct(productId: string, params?: {
    skip?: number;
    take?: number;
    includeRelations?: boolean;
  }): Promise<PaginatedResponse<Stock>> {
    return this.getPaginated<Stock>(`/api/stocks/by-product/${productId}`, params);
  }

  async getStocksByVariant(variantId: string, params?: {
    skip?: number;
    take?: number;
    includeRelations?: boolean;
  }): Promise<PaginatedResponse<Stock>> {
    return this.getPaginated<Stock>(`/api/stocks/by-variant/${variantId}`, params);
  }

  // Low stock alerts
  async getLowStockItems(threshold?: number): Promise<PaginatedResponse<Stock>> {
    return this.getPaginated<Stock>("/api/stocks/low-stock", { threshold });
  }

  // Stock operations
  async adjustStock(stockId: string, adjustment: StockAdjustmentRequest): Promise<Stock> {
    const response = await this.post<Stock>(`/api/stocks/${stockId}/adjust`, adjustment);
    return response.data!;
  }

  async reserveStock(stockId: string, reservation: StockReservationRequest): Promise<Stock> {
    const response = await this.post<Stock>(`/api/stocks/${stockId}/reserve`, reservation);
    return response.data!;
  }

  async releaseReservation(stockId: string, data: { quantity: number; reference?: string }): Promise<Stock> {
    const response = await this.post<Stock>(`/api/stocks/${stockId}/release-reservation`, data);
    return response.data!;
  }

  // Stock history
  async getStockHistory(stockId: string, params?: {
    skip?: number;
    take?: number;
  }): Promise<PaginatedResponse<StockHistory>> {
    return this.getPaginated<StockHistory>(`/api/stocks/${stockId}/history`, params);
  }

  // Warehouse operations
  async getWarehouses(params?: {
    skip?: number;
    take?: number;
    includeStocks?: boolean;
    search?: string;
  }): Promise<PaginatedResponse<Warehouse>> {
    return this.getPaginated<Warehouse>("/api/warehouses", params);
  }

  async getWarehouse(id: string): Promise<Warehouse> {
    const response = await this.get<Warehouse>(`/api/warehouses/${id}`);
    return response.data!;
  }

  async getWarehouseStockSummary(warehouseId: string): Promise<any> {
    const response = await this.get(`/api/warehouses/${warehouseId}/stock-summary`);
    return response.data;
  }

  // Defective stock management
  async markDefective(stockId: string, data: { quantity: number; reason: string }): Promise<Stock> {
    const response = await this.post<Stock>(`/api/stocks/${stockId}/mark-defective`, data);
    return response.data!;
  }

  async repairDefective(stockId: string, data: { quantity: number; reason: string }): Promise<Stock> {
    const response = await this.post<Stock>(`/api/stocks/${stockId}/repair-defective`, data);
    return response.data!;
  }

  async disposeDefective(stockId: string, data: { quantity: number; reason: string }): Promise<Stock> {
    const response = await this.post<Stock>(`/api/stocks/${stockId}/dispose-defective`, data);
    return response.data!;
  }

  // Enhanced filtering for defective items
  async getDefectiveStocks(params?: {
    skip?: number;
    take?: number;
    warehouseId?: string;
    threshold?: number;
  }): Promise<PaginatedResponse<Stock>> {
    return this.getPaginated<Stock>("/api/stocks/defective", params);
  }
}

export const stockApi = new StockApiClient();
