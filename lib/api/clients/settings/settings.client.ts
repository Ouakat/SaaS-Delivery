import { BaseApiClient, ApiResponse } from "../../base.client";
import type {
  GeneralSettings,
  CreateGeneralSettingsRequest,
  UpdateGeneralSettingsRequest,
  GeneralSettingsPreview,
  UploadResponse,
} from "@/lib/types/settings/general.types";

export class SettingsApiClient extends BaseApiClient {
  constructor() {
    super("settings");
  }

  // Override to use settings service URL
  private getSettingsUrl(endpoint: string): string {
    const settingsBaseUrl =
      process.env.NEXT_PUBLIC_SETTINGS_SERVICE_URL || "http://localhost:3002";
    return `${settingsBaseUrl}${endpoint}`;
  }

  // ========================================
  // GENERAL SETTINGS ENDPOINTS
  // ========================================

  async getGeneralSettings(): Promise<ApiResponse<GeneralSettings>> {
    try {
      const response = await fetch(
        this.getSettingsUrl("/api/general-settings"),
        {
          method: "GET",
          headers: {
            ...this.client.defaults.headers.common,
            Authorization: `Bearer ${
              typeof window !== "undefined"
                ? localStorage.getItem("auth_token")
                : ""
            }`,
            "X-Tenant-ID":
              typeof window !== "undefined"
                ? localStorage.getItem("utl_tenant_id") || ""
                : "",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: "SERVER_ERROR" as const,
            message: data.message || "Failed to fetch general settings",
            statusCode: response.status,
            timestamp: new Date().toISOString(),
          },
          timestamp: new Date().toISOString(),
        };
      }

      return {
        success: true,
        data: data.data,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: "NETWORK_ERROR" as const,
          message: error.message || "Network error occurred",
          timestamp: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      };
    }
  }

  async createGeneralSettings(
    request: CreateGeneralSettingsRequest
  ): Promise<ApiResponse<GeneralSettings>> {
    try {
      const response = await fetch(
        this.getSettingsUrl("/api/general-settings"),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${
              typeof window !== "undefined"
                ? localStorage.getItem("auth_token")
                : ""
            }`,
            "X-Tenant-ID":
              typeof window !== "undefined"
                ? localStorage.getItem("utl_tenant_id") || ""
                : "",
          },
          body: JSON.stringify(request),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: "SERVER_ERROR" as const,
            message: data.message || "Failed to create general settings",
            statusCode: response.status,
            timestamp: new Date().toISOString(),
          },
          timestamp: new Date().toISOString(),
        };
      }

      return {
        success: true,
        data: data.data,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: "NETWORK_ERROR" as const,
          message: error.message || "Network error occurred",
          timestamp: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      };
    }
  }

  async updateGeneralSettings(
    request: UpdateGeneralSettingsRequest
  ): Promise<ApiResponse<GeneralSettings>> {
    try {
      const response = await fetch(
        this.getSettingsUrl("/api/general-settings"),
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${
              typeof window !== "undefined"
                ? localStorage.getItem("auth_token")
                : ""
            }`,
            "X-Tenant-ID":
              typeof window !== "undefined"
                ? localStorage.getItem("utl_tenant_id") || ""
                : "",
          },
          body: JSON.stringify(request),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: "SERVER_ERROR" as const,
            message: data.message || "Failed to update general settings",
            statusCode: response.status,
            timestamp: new Date().toISOString(),
          },
          timestamp: new Date().toISOString(),
        };
      }

      return {
        success: true,
        data: data.data,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: "NETWORK_ERROR" as const,
          message: error.message || "Network error occurred",
          timestamp: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      };
    }
  }

  async deleteGeneralSettings(): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(
        this.getSettingsUrl("/api/general-settings"),
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${
              typeof window !== "undefined"
                ? localStorage.getItem("auth_token")
                : ""
            }`,
            "X-Tenant-ID":
              typeof window !== "undefined"
                ? localStorage.getItem("utl_tenant_id") || ""
                : "",
          },
        }
      );

      if (!response.ok) {
        const data = await response.json();
        return {
          success: false,
          error: {
            code: "SERVER_ERROR" as const,
            message: data.message || "Failed to delete general settings",
            statusCode: response.status,
            timestamp: new Date().toISOString(),
          },
          timestamp: new Date().toISOString(),
        };
      }

      return {
        success: true,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: "NETWORK_ERROR" as const,
          message: error.message || "Network error occurred",
          timestamp: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      };
    }
  }

  async uploadLogo(file: File): Promise<ApiResponse<UploadResponse>> {
    try {
      const formData = new FormData();
      formData.append("logo", file);

      const response = await fetch(
        this.getSettingsUrl("/api/general-settings/upload-logo"),
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${
              typeof window !== "undefined"
                ? localStorage.getItem("auth_token")
                : ""
            }`,
            "X-Tenant-ID":
              typeof window !== "undefined"
                ? localStorage.getItem("utl_tenant_id") || ""
                : "",
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: "SERVER_ERROR" as const,
            message: data.message || "Failed to upload logo",
            statusCode: response.status,
            timestamp: new Date().toISOString(),
          },
          timestamp: new Date().toISOString(),
        };
      }

      return {
        success: true,
        data: {
          url: data.data.logoUrl || data.data.url,
          filename: data.data.filename || file.name,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: "NETWORK_ERROR" as const,
          message: error.message || "Network error occurred",
          timestamp: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      };
    }
  }

  async uploadFavicon(file: File): Promise<ApiResponse<UploadResponse>> {
    try {
      const formData = new FormData();
      formData.append("favicon", file);

      const response = await fetch(
        this.getSettingsUrl("/api/general-settings/upload-favicon"),
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${
              typeof window !== "undefined"
                ? localStorage.getItem("auth_token")
                : ""
            }`,
            "X-Tenant-ID":
              typeof window !== "undefined"
                ? localStorage.getItem("utl_tenant_id") || ""
                : "",
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: "SERVER_ERROR" as const,
            message: data.message || "Failed to upload favicon",
            statusCode: response.status,
            timestamp: new Date().toISOString(),
          },
          timestamp: new Date().toISOString(),
        };
      }

      return {
        success: true,
        data: {
          url: data.data.faviconUrl || data.data.url,
          filename: data.data.filename || file.name,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: "NETWORK_ERROR" as const,
          message: error.message || "Network error occurred",
          timestamp: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      };
    }
  }

  async getPreviewSettings(): Promise<ApiResponse<GeneralSettingsPreview>> {
    try {
      const response = await fetch(
        this.getSettingsUrl("/api/general-settings/preview"),
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${
              typeof window !== "undefined"
                ? localStorage.getItem("auth_token")
                : ""
            }`,
            "X-Tenant-ID":
              typeof window !== "undefined"
                ? localStorage.getItem("utl_tenant_id") || ""
                : "",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: "SERVER_ERROR" as const,
            message: data.message || "Failed to fetch preview settings",
            statusCode: response.status,
            timestamp: new Date().toISOString(),
          },
          timestamp: new Date().toISOString(),
        };
      }

      return {
        success: true,
        data: data.data,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: "NETWORK_ERROR" as const,
          message: error.message || "Network error occurred",
          timestamp: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      };
    }
  }

  async resetBranding(): Promise<ApiResponse<GeneralSettings>> {
    try {
      const response = await fetch(
        this.getSettingsUrl("/api/general-settings/reset-branding"),
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${
              typeof window !== "undefined"
                ? localStorage.getItem("auth_token")
                : ""
            }`,
            "X-Tenant-ID":
              typeof window !== "undefined"
                ? localStorage.getItem("utl_tenant_id") || ""
                : "",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: "SERVER_ERROR" as const,
            message: data.message || "Failed to reset branding",
            statusCode: response.status,
            timestamp: new Date().toISOString(),
          },
          timestamp: new Date().toISOString(),
        };
      }

      return {
        success: true,
        data: data.data,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: "NETWORK_ERROR" as const,
          message: error.message || "Network error occurred",
          timestamp: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      };
    }
  }
}

// Export singleton instance
export const settingsApiClient = new SettingsApiClient();
