import { BaseApiClient, ApiResponse } from "../../base.client";
import type {
  User,
  CreateUserRequest,
  UpdateUserRequest,
  UserFilters,
} from "@/lib/types/database/schema.types";

// New types for the enhanced functionality
export interface ApproveRegistrationRequest {
  approve: boolean;
  message?: string;
}

export interface ValidateProfileRequest {
  action: "VALIDATE" | "REJECT";
  notes?: string;
}

export interface CompleteProfileRequest {
  phone?: string;
  city?: string;
  address: string;
  cin: string;
  cinDocuments?: string[];
  bankDetails?: any;
  profilePhoto?: string;
}

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

  // ========================================
  // NEW ENHANCED USER WORKFLOW ENDPOINTS
  // ========================================

  /**
   * Get all users with PENDING account status awaiting admin approval
   */
  async getPendingRegistrations(): Promise<ApiResponse<User[]>> {
    return this.get<User[]>("/api/users/pending-registrations");
  }

  /**
   * Get all users with PENDING_VALIDATION status awaiting profile validation
   */
  async getPendingValidations(): Promise<ApiResponse<User[]>> {
    return this.get<User[]>("/api/users/pending-validations");
  }

  /**
   * Approve or reject a user registration (for PENDING users)
   */
  async approveRegistration(
    userId: string,
    request: ApproveRegistrationRequest
  ): Promise<ApiResponse<User>> {
    return this.patch<User>(
      `/api/users/${userId}/approve-registration`,
      request
    );
  }

  /**
   * Validate or reject a user profile (for PENDING_VALIDATION users)
   */
  async validateProfile(
    userId: string,
    request: ValidateProfileRequest
  ): Promise<ApiResponse<User>> {
    return this.patch<User>(`/api/users/${userId}/validate-profile`, request);
  }

  /**
   * Suspend a user account (moves to SUSPENDED status)
   */
  async suspendUser(userId: string): Promise<ApiResponse<User>> {
    return this.patch<User>(`/api/users/${userId}/suspend`, {});
  }

  /**
   * Complete user profile (moves from INACTIVE to PENDING_VALIDATION)
   */
  async completeProfile(
    request: CompleteProfileRequest
  ): Promise<ApiResponse<User>> {
    return this.patch<User>("/api/users/me/complete-profile", request);
  }

  /**
   * Get current user profile
   */
  async getMyProfile(): Promise<ApiResponse<User>> {
    return this.get<User>("/api/users/me");
  }

  /**
   * Assign a role to a user
   */
  async assignRole(userId: string, roleId: string): Promise<ApiResponse<User>> {
    return this.patch<User>(`/api/users/${userId}/role`, { roleId });
  }

  /**
   * Get user permissions based on their role and account status
   */
  async getUserPermissions(userId: string): Promise<
    ApiResponse<{
      userId: string;
      email: string;
      userType: string;
      accountStatus: string;
      validationStatus: string;
      role: any;
      permissions: string[];
      isActive: boolean;
    }>
  > {
    return this.get(`/api/users/${userId}/permissions`);
  }

  // ========================================
  // BULK OPERATIONS
  // ========================================

  /**
   * Bulk approve multiple registrations
   */
  async bulkApproveRegistrations(
    userIds: string[],
    message?: string
  ): Promise<ApiResponse<{ successful: number; failed: string[] }>> {
    return this.post("/api/users/bulk/approve-registrations", {
      userIds,
      message,
    });
  }

  /**
   * Bulk validate multiple profiles
   */
  async bulkValidateProfiles(
    userIds: string[],
    action: "VALIDATE" | "REJECT",
    notes?: string
  ): Promise<ApiResponse<{ successful: number; failed: string[] }>> {
    return this.post("/api/users/bulk/validate-profiles", {
      userIds,
      action,
      notes,
    });
  }

  /**
   * Bulk suspend multiple users
   */
  async bulkSuspendUsers(
    userIds: string[]
  ): Promise<ApiResponse<{ successful: number; failed: string[] }>> {
    return this.post("/api/users/bulk/suspend", { userIds });
  }

  /**
   * Export users with current filters
   */
  async exportUsers(filters?: UserFilters): Promise<
    ApiResponse<{
      downloadUrl: string;
      filename: string;
    }>
  > {
    return this.post("/api/users/export", { filters });
  }

  // ========================================
  // STATISTICS AND ANALYTICS
  // ========================================

  /**
   * Get user statistics for dashboard
   */
  async getUserStatistics(): Promise<
    ApiResponse<{
      total: number;
      active: number;
      inactive: number;
      pending: number;
      pendingValidation: number;
      suspended: number;
      rejected: number;
      validated: number;
      byUserType: Record<string, number>;
      recentRegistrations: number;
      pendingActions: number;
    }>
  > {
    return this.get("/api/users/statistics");
  }

  /**
   * Get user activity timeline
   */
  async getUserActivity(
    userId: string,
    limit?: number
  ): Promise<
    ApiResponse<
      Array<{
        id: string;
        action: string;
        timestamp: string;
        performedBy: {
          id: string;
          name: string;
          email: string;
        };
        details?: any;
      }>
    >
  > {
    const params = limit ? `?limit=${limit}` : "";
    return this.get(`/api/users/${userId}/activity${params}`);
  }
}

// Export singleton instance
export const usersApiClient = new UsersApiClient();
