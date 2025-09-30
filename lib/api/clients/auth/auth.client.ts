import { BaseApiClient, ApiResponse } from "../../base.client";
import { getTenantFromUrl } from "@/lib/utils/tenant.utils";
import type {
  LoginRequest,
  RegisterRequest,
  LoginResponse,
  RegisterResponse,
  AccountStatusResponse,
  RefreshTokenRequest,
  CompleteProfileRequest,
  ResetPasswordRequest,
  ForgotPasswordRequest,
} from "@/lib/types/auth/auth.types";

export class AuthApiClient extends BaseApiClient {
  constructor() {
    super("auth");
  }

  async login(request: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    // Ensure tenant ID is set before login
    const tenantId = getTenantFromUrl();
    if (tenantId && tenantId !== this.tenantId) {
      this.setTenant(tenantId);
    }
    return this.post<LoginResponse>("/api/auth/login", request);
  }

  async register(
    request: RegisterRequest
  ): Promise<ApiResponse<RegisterResponse>> {
    return this.post<RegisterResponse>("/api/auth/register", request);
  }

  async refreshToken(
    request: RefreshTokenRequest
  ): Promise<ApiResponse<LoginResponse>> {
    return this.post<LoginResponse>("/api/auth/refresh", request);
  }

  async logout(request: RefreshTokenRequest): Promise<ApiResponse<void>> {
    return this.post<void>("/api/auth/logout", request);
  }

  async getProfile(): Promise<ApiResponse<any>> {
    return this.get<any>("/api/auth/profile");
  }

  async getAccountStatus(): Promise<ApiResponse<AccountStatusResponse>> {
    return this.get<AccountStatusResponse>("/api/auth/status");
  }

  async completeProfile(
    request: CompleteProfileRequest
  ): Promise<ApiResponse<any>> {
    return this.patch<any>("/api/auth/complete-profile", request);
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
}

export const authApiClient = new AuthApiClient();

