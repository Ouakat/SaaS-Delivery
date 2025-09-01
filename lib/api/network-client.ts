import axios, { AxiosInstance, AxiosResponse } from "axios";

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class NetworkApiClient {
  private client: AxiosInstance;
  private tenantId: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add tenant header
        if (this.tenantId) {
          config.headers["X-Tenant-ID"] = this.tenantId;
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
            window.location.href = "/auth/login";
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // Token management
  private getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("network_token");
  }

  private setToken(token: string): void {
    if (typeof window === "undefined") return;
    localStorage.setItem("network_token", token);
  }

  private removeToken(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem("network_token");
    localStorage.removeItem("network_refresh_token");
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
    password: string,
    tenantId?: string
  ): Promise<ApiResponse<any>> {
    if (tenantId) this.setTenant(tenantId);

    const response = await this.client.post("/api/auth/login", {
      email,
      password,
    });

    if (response.data.success && response.data.data) {
      this.setToken(response.data.data.accessToken);
      localStorage.setItem(
        "network_refresh_token",
        response.data.data.refreshToken
      );
    }

    return response.data;
  }

  async register(userData: any, tenantId?: string): Promise<ApiResponse<any>> {
    if (tenantId) this.setTenant(tenantId);

    const response = await this.client.post("/api/auth/register", userData);

    if (response.data.success && response.data.data) {
      this.setToken(response.data.data.accessToken);
      localStorage.setItem(
        "network_refresh_token",
        response.data.data.refreshToken
      );
    }

    return response.data;
  }

  async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = localStorage.getItem("network_refresh_token");
      if (!refreshToken) return false;

      const response = await this.client.post("/api/auth/refresh", {
        refreshToken,
      });

      if (response.data.success && response.data.data) {
        this.setToken(response.data.data.accessToken);
        localStorage.setItem(
          "network_refresh_token",
          response.data.data.refreshToken
        );
        return true;
      }
    } catch (error) {
      this.removeToken();
    }
    return false;
  }

  async logout(): Promise<void> {
    const refreshToken = localStorage.getItem("network_refresh_token");
    if (refreshToken) {
      try {
        await this.client.post("/api/auth/logout", { refreshToken });
      } catch (error) {
        // Ignore logout errors
      }
    }
    this.removeToken();
  }

  async getProfile(): Promise<ApiResponse<any>> {
    const response = await this.client.get("/api/auth/profile");
    return response.data;
  }

  // Generic CRUD methods
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    const response = await this.client.get(`/api${endpoint}`);
    return response.data;
  }

  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    const response = await this.client.post(`/api${endpoint}`, data);
    return response.data;
  }

  async put<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    const response = await this.client.put(`/api${endpoint}`, data);
    return response.data;
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    const response = await this.client.delete(`/api${endpoint}`);
    return response.data;
  }

  // Paginated requests
  async getPaginated<T>(
    endpoint: string,
    params?: Record<string, string | number>
  ): Promise<PaginatedResponse<T>> {
    const response = await this.client.get(`/api${endpoint}`, { params });
    return response.data.data;
  }

  // Network specific methods
  async getParcels(params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }) {
    return this.getPaginated("/parcels", params);
  }

  async getParcel(id: string) {
    return this.get(`/parcels/${id}`);
  }

  async trackParcel(trackingNumber: string) {
    return this.get(`/parcels/track/${trackingNumber}`);
  }

  async createParcel(parcelData: any) {
    return this.post("/parcels", parcelData);
  }

  async updateParcelStatus(
    id: string,
    status: string,
    location?: string,
    description?: string
  ) {
    return this.put(`/parcels/${id}/status`, { status, location, description });
  }

  async getMerchants(params?: { page?: number; limit?: number }) {
    return this.getPaginated("/merchants", params);
  }

  async getDeliveryAgents(params?: {
    page?: number;
    limit?: number;
    isOnline?: boolean;
  }) {
    return this.getPaginated("/delivery-agents", params);
  }

  async getInvoices(params?: { page?: number; limit?: number }) {
    return this.getPaginated("/invoices", params);
  }

  async getClaims(params?: { page?: number; limit?: number }) {
    return this.getPaginated("/claims", params);
  }

  async getStats() {
    return this.get("/parcels/stats");
  }
}

export const networkApi = new NetworkApiClient();
