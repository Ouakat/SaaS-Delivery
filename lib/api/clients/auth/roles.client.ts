import { BaseApiClient, ApiResponse } from "../../base.client";
import type { Role, User, UserType } from "@/lib/types/database/schema.types";

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

export class RolesApiClient extends BaseApiClient {
  constructor() {
    super("roles");
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
}

// Export singleton instance
export const rolesApiClient = new RolesApiClient();
