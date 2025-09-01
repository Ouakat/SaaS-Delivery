import axios, { AxiosInstance, AxiosResponse } from "axios";
import { getTenantFromUrl } from "@/lib/utils";

import type { ApiResponse, PaginatedResponse } from "@/lib/types/response";

import type {
  User,
  Parcel,
  Merchant,
  DeliveryAgent,
  Invoice,
  Claim,
} from "@/lib/types/prisma";

class ApiClient {
  private client: AxiosInstance;
  private tenantId: string | null = null;
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    this.tenantId = getTenantFromUrl();

    // Initialize axios instance
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Setup interceptors
    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token
        const token = this.getToken();

        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired, try refresh
          const refreshed = await this.refreshToken();
          if (refreshed) {
            // Retry original request
            return this.client.request(error.config);
          } else {
            // Redirect to login
            if (typeof window !== "undefined") {
              window.location.href = "/auth/login";
            }
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // Token management
  private getToken(): string | null {
    if (typeof window === "undefined") return null;
    return (
      localStorage.getItem("auth_token")
    );
  }

  private setToken(token: string): void {
    if (typeof window === "undefined") return;
    localStorage.setItem("auth_token", token);
  }

  private removeToken(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem("auth_token");
    localStorage.removeItem("refresh_token");
  }

  // Tenant management
  setTenant(tenantId: string): void {
    this.tenantId = tenantId;
  }

  getTenant(): string | null {
    return this.tenantId;
  }

  // Auth methods
  async login(
    email: string,
    password: string
  ): Promise<
    ApiResponse<{ user: User; token: string; refreshToken?: string }>
  > {
    try {
      const response = await this.client.post("/api/auth/login", {
        email,
        password,
        tenantId: this.tenantId,
      });

      if (response.data.success && response.data.data) {
        const { token, refreshToken } = response.data.data;
        this.setToken(token);

        if (refreshToken) {
          localStorage.setItem("refresh_token", refreshToken);
        }
      }

      return response.data;
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  }










  async register(
    userData: any,
    tenantId?: string
  ): Promise<
    ApiResponse<{ user: User; token: string; refreshToken?: string }>
  > {
    try {
      if (tenantId) this.setTenant(tenantId);

      const response = await this.client.post("/api/auth/register", userData);

      if (response.data.success && response.data.data) {
        const { token, accessToken, refreshToken } = response.data.data;
        this.setToken(token || accessToken);

        if (refreshToken) {
          localStorage.setItem("refresh_token", refreshToken);
          localStorage.setItem("network_refresh_token", refreshToken);
        }
      }

      return response.data;
    } catch (error) {
      console.error("Registration failed:", error);
      throw error;
    }
  }

  async refreshToken(): Promise<boolean> {
    try {
      const refreshToken =
        localStorage.getItem("refresh_token") ||
        localStorage.getItem("network_refresh_token");

      if (!refreshToken) return false;

      const response = await this.client.post("/api/auth/refresh", {
        refreshToken,
      });

      if (response.data.success && response.data.data) {
        const {
          token,
          accessToken,
          refreshToken: newRefreshToken,
        } = response.data.data;
        this.setToken(token || accessToken);

        if (newRefreshToken) {
          localStorage.setItem("refresh_token", newRefreshToken);
          localStorage.setItem("network_refresh_token", newRefreshToken);
        }
        return true;
      }
    } catch (error) {
      console.error("Token refresh failed:", error);
      this.removeToken();
    }
    return false;
  }

  async logout(): Promise<void> {
    try {
      const refreshToken =
        localStorage.getItem("refresh_token") ||
        localStorage.getItem("network_refresh_token");

      if (refreshToken) {
        await this.client.post("/api/auth/logout", { refreshToken });
      }
    } catch (error) {
      console.error("Logout error:", error);
      // Ignore logout errors
    } finally {
      this.removeToken();
    }
  }

  async getProfile(): Promise<ApiResponse<User>> {
    try {
      const response = await this.client.get("/api/auth/profile");
      return response.data;
    } catch (error) {
      console.error("Get profile failed:", error);
      throw error;
    }
  }

  // Generic CRUD methods
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.get(`/api${endpoint}`);
      return response.data;
    } catch (error) {
      console.error("GET request failed:", error);
      throw error;
    }
  }

  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.post(`/api${endpoint}`, data);
      return response.data;
    } catch (error) {
      console.error("POST request failed:", error);
      throw error;
    }
  }

  async put<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.put(`/api${endpoint}`, data);
      return response.data;
    } catch (error) {
      console.error("PUT request failed:", error);
      throw error;
    }
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.delete(`/api${endpoint}`);
      return response.data;
    } catch (error) {
      console.error("DELETE request failed:", error);
      throw error;
    }
  }

  // Paginated requests
  async getPaginated<T>(
    endpoint: string,
    params?: Record<string, string | number>
  ): Promise<PaginatedResponse<T>> {
    try {
      const response = await this.client.get(`/api${endpoint}`, { params });
      return response.data.data || response.data;
    } catch (error) {
      console.error("Paginated request failed:", error);
      throw error;
    }
  }

  // Parcel methods
  async getParcels(params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<PaginatedResponse<Parcel>> {
    return this.getPaginated("/parcels", params);
  }

  async getParcel(id: string): Promise<ApiResponse<Parcel>> {
    return this.get(`/parcels/${id}`);
  }

  async trackParcel(trackingNumber: string): Promise<ApiResponse<Parcel>> {
    return this.get(`/parcels/track/${trackingNumber}`);
  }

  async createParcel(parcelData: any): Promise<ApiResponse<Parcel>> {
    return this.post("/parcels", parcelData);
  }

  async updateParcelStatus(
    id: string,
    status: string,
    location?: string,
    description?: string
  ): Promise<ApiResponse<Parcel>> {
    return this.put(`/parcels/${id}/status`, { status, location, description });
  }

  async getParcelStats(): Promise<ApiResponse<any>> {
    return this.get("/parcels/stats");
  }

  // Merchant methods
  async getMerchants(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<PaginatedResponse<Merchant>> {
    return this.getPaginated("/merchants", params);
  }

  async getMerchant(id: string): Promise<ApiResponse<Merchant>> {
    return this.get(`/merchants/${id}`);
  }

  async createMerchant(merchantData: any): Promise<ApiResponse<Merchant>> {
    return this.post("/merchants", merchantData);
  }

  async updateMerchant(
    id: string,
    merchantData: any
  ): Promise<ApiResponse<Merchant>> {
    return this.put(`/merchants/${id}`, merchantData);
  }

  // Delivery Agent methods
  async getDeliveryAgents(params?: {
    page?: number;
    limit?: number;
    isOnline?: boolean;
    search?: string;
  }): Promise<PaginatedResponse<DeliveryAgent>> {
    return this.getPaginated("/delivery-agents", params);
  }

  async getDeliveryAgent(id: string): Promise<ApiResponse<DeliveryAgent>> {
    return this.get(`/delivery-agents/${id}`);
  }

  async createDeliveryAgent(
    agentData: any
  ): Promise<ApiResponse<DeliveryAgent>> {
    return this.post("/delivery-agents", agentData);
  }

  async updateDeliveryAgent(
    id: string,
    agentData: any
  ): Promise<ApiResponse<DeliveryAgent>> {
    return this.put(`/delivery-agents/${id}`, agentData);
  }

  async updateAgentLocation(
    id: string,
    location: { lat: number; lng: number }
  ): Promise<ApiResponse<DeliveryAgent>> {
    return this.put(`/delivery-agents/${id}/location`, location);
  }

  // Invoice methods
  async getInvoices(params?: {
    page?: number;
    limit?: number;
    status?: string;
    merchantId?: string;
  }): Promise<PaginatedResponse<Invoice>> {
    return this.getPaginated("/invoices", params);
  }

  async getInvoice(id: string): Promise<ApiResponse<Invoice>> {
    return this.get(`/invoices/${id}`);
  }

  async createInvoice(invoiceData: any): Promise<ApiResponse<Invoice>> {
    return this.post("/invoices", invoiceData);
  }

  async updateInvoiceStatus(
    id: string,
    status: string
  ): Promise<ApiResponse<Invoice>> {
    return this.put(`/invoices/${id}/status`, { status });
  }

  // Claim methods
  async getClaims(params?: {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
  }): Promise<PaginatedResponse<Claim>> {
    return this.getPaginated("/claims", params);
  }

  async getClaim(id: string): Promise<ApiResponse<Claim>> {
    return this.get(`/claims/${id}`);
  }

  async createClaim(claimData: any): Promise<ApiResponse<Claim>> {
    return this.post("/claims", claimData);
  }

  async updateClaimStatus(
    id: string,
    status: string,
    resolution?: string
  ): Promise<ApiResponse<Claim>> {
    return this.put(`/claims/${id}/status`, { status, resolution });
  }

  // Analytics and reporting
  async getDashboardStats(): Promise<ApiResponse<any>> {
    return this.get("/analytics/dashboard");
  }

  async getRevenueStats(params?: {
    period?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<any>> {
    return this.get("/analytics/revenue", params);
  }

  // File upload
  async uploadFile(
    file: File,
    path?: string
  ): Promise<ApiResponse<{ url: string }>> {
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (path) formData.append("path", path);

      const response = await this.client.post("/api/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return response.data;
    } catch (error) {
      console.error("File upload failed:", error);
      throw error;
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
