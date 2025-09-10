import { BaseApiClient, ApiResponse } from "../base.client";
import type {
  User,
  CreateUserRequest,
  UpdateUserRequest,
  UserFilters,
} from "@/lib/types/database/schema.types";

export class UsersApiClient extends BaseApiClient {
  constructor() {
    super("users");
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
    return this.patch<{ message: string }>(
      `/api/users/${id}/change-password`,
      request
    );
  }
}

// Export singleton instance
export const usersApiClient = new UsersApiClient();
