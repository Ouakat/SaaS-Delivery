// /lib/api/clients/payments/factures.client.ts
import { BaseApiClient, ApiResponse } from "../../base.client";
import type {
  Facture,
  CreateFactureRequest,
  UpdateFactureRequest,
  FactureFilters,
  FactureStatistics,
  FactureStatus,
  PaginatedFacturesResponse,
} from "@/lib/types/payments/factures.types";

export class FacturesApiClient extends BaseApiClient {
  constructor() {
    super("payments");
  }

  async createFacture(request: CreateFactureRequest): Promise<ApiResponse<Facture>> {
    return this.post<Facture>("/api/payments", request);
  }

  async getFactures(filters?: FactureFilters): Promise<ApiResponse<PaginatedFacturesResponse>> {
    return this.getPaginated<Facture>("/api/payments", filters);
  }

  async getMyFactures(filters?: FactureFilters): Promise<ApiResponse<PaginatedFacturesResponse>> {
    return this.getPaginated<Facture>("/api/payments/my-factures", filters);
  }

  async getFactureById(id: string): Promise<ApiResponse<Facture>> {
    return this.get<Facture>(`/api/payments/${id}`);
  }

  async updateFacture(id: string, request: UpdateFactureRequest): Promise<ApiResponse<Facture>> {
    return this.patch<Facture>(`/api/payments/${id}`, request);
  }

  async deleteFacture(id: string): Promise<ApiResponse<void>> {
    return this.delete<void>(`/api/payments/${id}`);
  }

  async changeFactureStatus(id: string, status: FactureStatus): Promise<ApiResponse<Facture>> {
    return this.patch<Facture>(`/api/payments/${id}/status`, { status });
  }

  async bulkDeleteFactures(ids: string[]): Promise<ApiResponse<void>> {
    return this.post<void>("/api/payments/bulk-delete", { ids });
  }

  async bulkChangeStatus(ids: string[], status: FactureStatus): Promise<ApiResponse<void>> {
    return this.post<void>("/api/payments/bulk-status", { ids, status });
  }

  async getFactureStatistics(): Promise<ApiResponse<FactureStatistics>> {
    return this.get<FactureStatistics>("/api/payments/statistics");
  }

  async exportFactures(filters: FactureFilters, format: 'excel' | 'pdf'): Promise<ApiResponse<{ downloadUrl: string }>> {
    return this.post("/api/payments/export", { filters, format });
  }

  async sendFacture(id: string, email: string): Promise<ApiResponse<void>> {
    return this.post<void>(`/api/payments/${id}/send`, { email });
  }

  async duplicateFacture(id: string): Promise<ApiResponse<Facture>> {
    return this.post<Facture>(`/api/payments/${id}/duplicate`);
  }

  async printFacture(id: string): Promise<ApiResponse<{ downloadUrl: string }>> {
    return this.get(`/api/payments/${id}/print`);
  }
}

export const facturesApiClient = new FacturesApiClient();