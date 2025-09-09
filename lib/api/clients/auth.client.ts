import { BaseApiClient, ApiResponse } from "../base.client";
import type {
  User,
  Role,
  Tenant,
  UserType,
  CreateUserRequest,
  UpdateUserRequest,
  UserFilters,
} from "@/lib/types/database/schema.types";

// Auth-specific types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface RegisterRequest extends CreateUserRequest {
  password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface CreateRoleRequest {
  name: string;
  description?: string;
  permissions: string[];
  userTypes: UserType[];
  isActive?: boolean;
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
  permissions?: string[];
  userTypes?: UserType[];
  isActive?: boolean;
}

export class AuthApiClient extends BaseApiClient {
  constructor() {
    super("auth");
  }

  // ========================================
  // AUTHENTICATION ENDPOINTS
  // ========================================

  async login(request: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    console.log("🚀 ~ AuthApiClient ~ login ~ request:", request)
    return this.post<LoginResponse>("/api/auth/login", request);
  }

  async register(
    
    request: RegisterRequest
  ): Promise<ApiResponse<LoginResponse>> {
    return this.post<LoginResponse>("/api/auth/register", request);
  }

  async refreshToken(
    request: RefreshTokenRequest
  ): Promise<ApiResponse<LoginResponse>> {
    return this.post<LoginResponse>("/api/auth/refresh", request);
  }

  async logout(request: RefreshTokenRequest): Promise<ApiResponse<void>> {
    return this.post<void>("/api/auth/logout", request);
  }

  async getProfile(): Promise<ApiResponse<User>> {
    return this.get<User>("/api/auth/profile");
  }

  async forgotPassword(
    request: ForgotPasswordRequest
  ): Promise<ApiResponse<{ message: string }>> {
    return this.post<{ message: string }>("/api/auth/forgot-password", request);
  }

  async resetPassword(
    request: ResetPasswordRequest
  ): Promise<ApiResponse<{ message: string }>> {
    return this.post<{ message: string }>("/api/auth/reset-password", request);
  }

  // ========================================
  // ROLE MANAGEMENT ENDPOINTS
  // ========================================

  async createRole(request: CreateRoleRequest): Promise<ApiResponse<Role>> {
    return this.post<Role>("/api/roles", request);
  }

  async getRoles(filters?: {
    page?: number;
    limit?: number;
    name?: string;
    userType?: UserType;
    isActive?: boolean;
  }) {
    return this.getPaginated<Role>("/api/roles", filters);
  }

  async getRoleById(id: string): Promise<ApiResponse<Role>> {
    return this.get<Role>(`/api/roles/${id}`);
  }

  async updateRole(
    id: string,
    request: UpdateRoleRequest
  ): Promise<ApiResponse<Role>> {
    return this.patch<Role>(`/api/roles/${id}`, request);
  }

  async deleteRole(id: string): Promise<ApiResponse<void>> {
    return this.delete<void>(`/api/roles/${id}`);
  }

  async deactivateRole(id: string): Promise<ApiResponse<Role>> {
    return this.patch<Role>(`/api/roles/${id}/deactivate`, {});
  }

  async reactivateRole(id: string): Promise<ApiResponse<Role>> {
    return this.patch<Role>(`/api/roles/${id}/reactivate`, {});
  }

  async duplicateRole(
    id: string,
    request: { name: string; userTypes?: UserType[] }
  ): Promise<ApiResponse<Role>> {
    return this.post<Role>(`/api/roles/${id}/duplicate`, request);
  }

  async getRoleUsers(id: string, filters?: { page?: number; limit?: number }) {
    return this.getPaginated<User>(`/api/roles/${id}/users`, filters);
  }

  async getRolesByUserType(userType: UserType) {
    return this.get<{ userType: UserType; roles: Role[] }>(
      `/api/roles/user-types/${userType}/roles`
    );
  }

  async getAvailablePermissions() {
    return this.get<{
      permissions: Array<{
        key: string;
        category: string;
        description: string;
        applicableUserTypes: UserType[];
      }>;
      categories: string[];
      userTypes: Array<{
        type: UserType;
        name: string;
        description: string;
        defaultPermissions: string[];
      }>;
    }>("/api/roles/permissions");
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

  // ========================================
  // USER MANAGEMENT ENDPOINTS
  // ========================================

  async createUser(request: CreateUserRequest): Promise<ApiResponse<User>> {
    return this.post<User>("/api/users", request);
  }

  async getUsers(filters?: UserFilters) {
    return this.getPaginated<User>("/api/users", filters);
  }

  async getUserById(id: string): Promise<ApiResponse<User>> {
    return this.get<User>(`/api/users/${id}`);
  }

  async updateUser(
    id: string,
    request: UpdateUserRequest
  ): Promise<ApiResponse<User>> {
    return this.patch<User>(`/api/users/${id}`, request);
  }

  async deleteUser(id: string): Promise<ApiResponse<void>> {
    return this.delete<void>(`/api/users/${id}`);
  }

  async deactivateUser(id: string): Promise<ApiResponse<User>> {
    return this.patch<User>(`/api/users/${id}/deactivate`, {});
  }

  async reactivateUser(id: string): Promise<ApiResponse<User>> {
    return this.patch<User>(`/api/users/${id}/reactivate`, {});
  }

  async changeUserPassword(
    id: string,
    request: {
      currentPassword: string;
      newPassword: string;
    }
  ): Promise<ApiResponse<{ message: string }>> {
    return this.post<{ message: string }>(
      `/api/users/${id}/change-password`,
      request
    );
  }

  // ========================================
  // HEALTH CHECK ENDPOINTS
  // ========================================

  async getHealthStatus() {
    return this.get<{
      status: string;
      timestamp: string;
      uptime: string;
      version: string;
      checks: Record<string, string>;
      metrics: Record<string, string>;
    }>("/api/health");
  }

  async getReadinessStatus() {
    return this.get<{
      status: string;
      timestamp: string;
      checks: Record<string, string>;
    }>("/api/health/ready");
  }

  async getLivenessStatus() {
    return this.get<{
      status: string;
      timestamp: string;
      uptime: string;
    }>("/api/health/live");
  }
}

// Export singleton instance
export const authApiClient = new AuthApiClient();
