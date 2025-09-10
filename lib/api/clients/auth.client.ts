import { BaseApiClient, ApiResponse } from "../base.client";
import type { User } from "@/lib/types/database/schema.types";

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

// Fixed RegisterRequest to match your API
export interface RegisterRequest {
  email: string;
  password: string;
  name: string; // Changed from firstName/lastName to single name field
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

export class AuthApiClient extends BaseApiClient {
  constructor() {
    super("auth");
  }

  // ========================================
  // AUTHENTICATION ENDPOINTS
  // ========================================

  async login(request: LoginRequest): Promise<ApiResponse<LoginResponse>> {
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
