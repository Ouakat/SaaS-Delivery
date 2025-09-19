import { BaseApiClient, ApiResponse } from "../../base.client";
import type {
  Tenant,
  User,
  UserFilters,
} from "@/lib/types/database/schema.types";

export class TenantsApiClient extends BaseApiClient {
  constructor() {
    super("tenants");
  }

  // ========================================
  // TENANT MANAGEMENT ENDPOINTS
  // ========================================

  async createTenant(request: {
    name: string;
    slug: string;
    domain: string;
    logo?: string;
    settings?: any;
    isActive?: boolean;
  }): Promise<ApiResponse<Tenant>> {
    return this.post<Tenant>("/api/tenants", request);
  }

  async getTenants(filters?: {
    page?: number;
    limit?: number;
    name?: string;
    slug?: string;
    isActive?: boolean;
  }) {
    return this.getPaginated<Tenant>("/api/tenants", filters);
  }

  async getCurrentTenant(): Promise<ApiResponse<Tenant & { stats: any }>> {
    return this.get<Tenant & { stats: any }>("/api/tenants/current");
  }

  async updateCurrentTenant(request: {
    name?: string;
    slug?: string;
    domain?: string;
    logo?: string;
    settings?: any;
    isActive?: boolean;
  }): Promise<ApiResponse<Tenant>> {
    return this.patch<Tenant>("/api/tenants/current", request);
  }

  async getTenantStats() {
    return this.get<{
      totalUsers: number;
      activeUsers: number;
      newUsersThisMonth: number;
      totalRoles: number;
      totalParcels: number;
      parcelsThisMonth: number;
      totalInvoices: number;
      invoicesThisMonth: number;
      totalClaims: number;
      claimsThisMonth: number;
      recentActivity: any;
      trends: any;
    }>("/api/tenants/current/stats");
  }

  async getTenantUsers(filters?: UserFilters) {
    return this.getPaginated<User>("/api/tenants/current/users", filters);
  }

  async updateTenantSettings(settings: any): Promise<ApiResponse<Tenant>> {
    return this.patch<Tenant>("/api/tenants/current/settings", settings);
  }
}

// Export singleton instance
export const tenantsApiClient = new TenantsApiClient();
