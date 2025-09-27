import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";
import { API_CONFIG, ServiceName, ErrorCode } from "@/lib/config/api.config";
import { getTenantFromUrl } from "@/lib/utils/tenant.utils";

// Extend Axios request config to include metadata
interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  metadata?: {
    startTime: number;
  };
}

export interface ApiError {
  code: ErrorCode;
  message: string;
  details?: any;
  statusCode?: number;
  timestamp: string;
  requestId?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export class BaseApiClient {
  protected client: AxiosInstance;
  protected serviceName: ServiceName;
  protected tenantId: string | null = null;

  constructor(serviceName: ServiceName, customConfig?: AxiosRequestConfig) {
    this.serviceName = serviceName;
    const serviceConfig = API_CONFIG.services[serviceName];

    // Get tenant ID from URL
    // this.tenantId = getTenantFromUrl();
    this.tenantId = 'cmfwp2d6l00007zn84qkndepd'

    // Create axios instance
    this.client = axios.create({
      baseURL: serviceConfig.baseURL,
      timeout: serviceConfig.timeout,
      headers: {
        ...API_CONFIG.headers.common,
        ...(this.tenantId && { [API_CONFIG.headers.tenant]: this.tenantId }),
      },
      ...customConfig,
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config: ExtendedAxiosRequestConfig) => {
        // Add auth token
        const token = this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add tenant ID if available
        if (this.tenantId) {
          config.headers[API_CONFIG.headers.tenant] = this.tenantId;
        }

        // Add request timestamp for debugging
        config.metadata = { startTime: Date.now() };

        return config;
      },
      (error) => Promise.reject(this.transformError(error))
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        // Log response time for monitoring
        const endTime = Date.now();
        const config = response.config as ExtendedAxiosRequestConfig;
        const startTime = config.metadata?.startTime || endTime;
        const duration = endTime - startTime;

        if (duration > 3000) {
          console.warn(
            `Slow API request detected: ${response.config.url} took ${duration}ms`
          );
        }

        return response;
      },
      async (error: AxiosError) => {
        // Handle token refresh
        if (error.response?.status === 401 && this.serviceName === "auth") {
          const refreshed = await this.attemptTokenRefresh();
          if (refreshed && error.config) {
            // Retry original request with new token
            const token = this.getAuthToken();
            if (token) {
              error.config.headers.Authorization = `Bearer ${token}`;
            }
            return this.client.request(error.config);
          }
        }

        return Promise.reject(this.transformError(error));
      }
    );
  }

  private getAuthToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("auth_token");
  }

  private async attemptTokenRefresh(): Promise<boolean> {
    try {
      const refreshToken = localStorage.getItem("refresh_token");
      if (!refreshToken) return false;

      // Only attempt refresh from auth service
      if (this.serviceName !== "auth") return false;

      const response = await axios.post(
        `${API_CONFIG.services.auth.baseURL}/api/auth/refresh`,
        { refreshToken },
        {
          headers: {
            "Content-Type": "application/json",
            ...(this.tenantId && {
              [API_CONFIG.headers.tenant]: this.tenantId,
            }),
          },
        }
      );

      if (response.data.success && response.data.data) {
        const { accessToken, refreshToken: newRefreshToken } =
          response.data.data;
        localStorage.setItem("auth_token", accessToken);
        if (newRefreshToken) {
          localStorage.setItem("refresh_token", newRefreshToken);
        }
        return true;
      }
    } catch (error) {
      console.error("Token refresh failed:", error);
      this.clearAuthTokens();
    }
    return false;
  }

  private clearAuthTokens(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("refresh_token");
    }
  }

  private transformError(error: any): ApiError {
    const timestamp = new Date().toISOString();

    // Network or timeout errors
    if (!error.response) {
      return {
        code: error.code === "ECONNABORTED" ? "TIMEOUT_ERROR" : "NETWORK_ERROR",
        message: error.message || "Network error occurred",
        timestamp,
      };
    }

    // HTTP errors with response
    const { status, data } = error.response;
    const statusCode = status;

    // Map status codes to error codes
    let code: ErrorCode = "SERVER_ERROR";
    switch (statusCode) {
      case 400:
        code = "VALIDATION_ERROR";
        break;
      case 401:
        code = "AUTH_ERROR";
        break;
      case 403:
        code = "PERMISSION_ERROR";
        break;
      case 404:
        code = "NOT_FOUND";
        break;
      case 409:
        code = "CONFLICT";
        break;
      case 429:
        code = "RATE_LIMIT_ERROR";
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        code = "SERVER_ERROR";
        break;
    }

    return {
      code,
      message:
        data?.message || data?.error || error.message || "An error occurred",
      details: data?.details,
      statusCode,
      timestamp,
      requestId: data?.requestId,
    };
  }

  // Generic HTTP methods
  protected async get<T>(
    endpoint: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.get(endpoint, config);
      return this.transformResponse<T>(response);
    } catch (error) {
      throw error; // Error is already transformed by interceptor
    }
  }

  protected async post<T>(
    endpoint: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.post(endpoint, data, config);
      return this.transformResponse<T>(response);
    } catch (error) {
      throw error;
    }
  }

  protected async put<T>(
    endpoint: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.put(endpoint, data, config);
      return this.transformResponse<T>(response);
    } catch (error) {
      throw error;
    }
  }

  protected async patch<T>(
    endpoint: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.patch(endpoint, data, config);
      return this.transformResponse<T>(response);
    } catch (error) {
      throw error;
    }
  }

  protected async delete<T>(
    endpoint: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.delete(endpoint, config);
      return this.transformResponse<T>(response);
    } catch (error) {
      throw error;
    }
  }
   protected async getList<T>(
    endpoint: string,
    params?: Record<string, any>,
    config?: AxiosRequestConfig
  ): Promise<PaginatedResponse<T>> {
    try {
      const response = await this.client.get(endpoint, {
        ...config,
        params: { ...params, ...config?.params },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
  // Paginated requests
  protected async getPaginated<T>(
    endpoint: string,
    params?: Record<string, any>,
    config?: AxiosRequestConfig
  ): Promise<PaginatedResponse<T>> {
    try {
      const response = await this.client.get(endpoint, {
        ...config,
        params: { ...params, ...config?.params },
      });

      // Handle different response formats
      if (response.data.data && response.data.pagination) {
        // Standard paginated format: { data: T[], pagination: {...} }
        return response.data;
      } else if (Array.isArray(response.data.data)) {
        // Array wrapped in data property: { data: T[] }
        return {
          data: response.data.data,
          pagination: {
            page: 1,
            limit: response.data.data.length,
            total: response.data.data.length,
            totalPages: 1,
            hasNext: false,
            hasPrev: false,
          },
        };
      } else if (Array.isArray(response.data)) {
        // Direct array response: T[]
        return {
          data: response.data,
          pagination: {
            page: 1,
            limit: response.data.length,
            total: response.data.length,
            totalPages: 1,
            hasNext: false,
            hasPrev: false,
          },
        };
      } else if (response.data.success && response.data.data) {
        // Wrapped in success envelope: { success: true, data: T[] }
        const data = Array.isArray(response.data.data)
          ? response.data.data
          : [response.data.data];
        return {
          data,
          pagination: {
            page: 1,
            limit: data.length,
            total: data.length,
            totalPages: 1,
            hasNext: false,
            hasPrev: false,
          },
        };
      }

      // Log the actual response structure for debugging
      console.error("Unexpected response structure:", {
        data: response.data,
        dataType: typeof response.data,
        isArray: Array.isArray(response.data),
        hasData: "data" in response.data,
        hasSuccess: "success" in response.data,
        hasPagination: "pagination" in response.data,
      });

      throw new Error(
        `Invalid paginated response format. Expected array or paginated object, got: ${typeof response.data}`
      );
    } catch (error) {
      throw error;
    }
  }

  private transformResponse<T>(response: AxiosResponse): ApiResponse<T> {
    return {
      success: true,
      data: response.data.data || response.data,
      message: response.data.message,
      timestamp: new Date().toISOString(),
    };
  }

  // Utility methods
  public setTenant(tenantId: string): void {
    this.tenantId = tenantId;
    this.client.defaults.headers[API_CONFIG.headers.tenant] = tenantId;
  }

  public clearTenant(): void {
    this.tenantId = null;
    delete this.client.defaults.headers[API_CONFIG.headers.tenant];
  }

  public getServiceName(): ServiceName {
    return this.serviceName;
  }

  public getBaseURL(): string {
    return this.client.defaults.baseURL || "";
  }
}
