import { BaseApiClient, ApiResponse } from "../../base.client";
import type {
  SmsSettings,
  SmsTemplate,
  CreateSmsTemplateRequest,
  UpdateSmsSettingsRequest,
  UpdateSmsTemplateRequest,
  RechargeBalanceRequest,
  SmsTemplateFilters,
  SmsUsageStats,
  SmsRechargeHistory,
} from "@/lib/types/settings/sms.types";

export class SmsSettingsApiClient extends BaseApiClient {
  constructor() {
    super("settings");
  }

  // ========================================
  // SMS SETTINGS ENDPOINTS
  // ========================================

  /**
   * Get SMS settings for the current tenant
   */
  async getSmsSettings(): Promise<ApiResponse<SmsSettings>> {
    return this.get<SmsSettings>("/api/sms-settings");
  }

  /**
   * Update SMS settings
   */
  async updateSmsSettings(
    request: UpdateSmsSettingsRequest
  ): Promise<ApiResponse<SmsSettings>> {
    return this.patch<SmsSettings>("/api/sms-settings", request);
  }

  /**
   * Test SMS configuration
   */
  async testSmsConfiguration(): Promise<
    ApiResponse<{ success: boolean; message: string }>
  > {
    return this.post<{ success: boolean; message: string }>(
      "/api/sms-settings/test",
      {}
    );
  }

  /**
   * Recharge SMS balance
   */
  async rechargeSmsBalance(
    request: RechargeBalanceRequest
  ): Promise<ApiResponse<SmsSettings>> {
    return this.post<SmsSettings>("/api/sms-settings/recharge", request);
  }

  /**
   * Get SMS usage statistics
   */
  async getSmsUsageStats(): Promise<ApiResponse<SmsUsageStats>> {
    return this.get<SmsUsageStats>("/api/sms-settings/usage-stats");
  }

  /**
   * Get SMS recharge history
   */
  async getSmsRechargeHistory(filters?: {
    page?: number;
    limit?: number;
  }): Promise<
    ApiResponse<{
      data: SmsRechargeHistory[];
      meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
      };
    }>
  > {
    return this.get<{
      data: SmsRechargeHistory[];
      meta: any;
    }>("/api/sms-settings/recharge-history", {
      params: filters,
    });
  }

  /**
   * Get current SMS balance
   */
  async getSmsBalance(): Promise<
    ApiResponse<{ balance: number; lastUpdated: string }>
  > {
    return this.get<{ balance: number; lastUpdated: string }>(
      "/api/sms-settings/balance"
    );
  }

  // ========================================
  // SMS TEMPLATES ENDPOINTS
  // ========================================

  /**
   * Get all SMS templates with pagination and filtering
   */
  async getSmsTemplates(filters?: SmsTemplateFilters): Promise<
    ApiResponse<{
      data: SmsTemplate[];
      meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
      };
    }>
  > {
    return this.get<{
      data: SmsTemplate[];
      meta: any;
    }>("/api/sms-settings/templates", {
      params: filters,
    });
  }

  /**
   * Get all active SMS templates (no pagination)
   */
  async getActiveSmsTemplates(): Promise<ApiResponse<SmsTemplate[]>> {
    return this.get<SmsTemplate[]>("/api/sms-settings/templates/active");
  }

  /**
   * Get SMS template by ID
   */
  async getSmsTemplateById(id: string): Promise<ApiResponse<SmsTemplate>> {
    return this.get<SmsTemplate>(`/api/sms-settings/templates/${id}`);
  }

  /**
   * Create new SMS template
   */
  async createSmsTemplate(
    request: CreateSmsTemplateRequest
  ): Promise<ApiResponse<SmsTemplate>> {
    return this.post<SmsTemplate>("/api/sms-settings/templates", request);
  }

  /**
   * Update SMS template
   */
  async updateSmsTemplate(
    id: string,
    request: UpdateSmsTemplateRequest
  ): Promise<ApiResponse<SmsTemplate>> {
    return this.patch<SmsTemplate>(
      `/api/sms-settings/templates/${id}`,
      request
    );
  }

  /**
   * Delete SMS template
   */
  async deleteSmsTemplate(id: string): Promise<ApiResponse<void>> {
    return this.delete<void>(`/api/sms-settings/templates/${id}`);
  }

  /**
   * Toggle SMS template status
   */
  async toggleSmsTemplateStatus(id: string): Promise<ApiResponse<SmsTemplate>> {
    return this.patch<SmsTemplate>(
      `/api/sms-settings/templates/${id}/toggle-status`,
      {}
    );
  }

  /**
   * Duplicate SMS template
   */
  async duplicateSmsTemplate(
    id: string,
    name: string
  ): Promise<ApiResponse<SmsTemplate>> {
    return this.post<SmsTemplate>(
      `/api/sms-settings/templates/${id}/duplicate`,
      {
        name,
      }
    );
  }

  /**
   * Preview SMS template with sample data
   */
  async previewSmsTemplate(
    id: string,
    sampleData: Record<string, string>
  ): Promise<ApiResponse<{ preview: string }>> {
    return this.post<{ preview: string }>(
      `/api/sms-settings/templates/${id}/preview`,
      {
        sampleData,
      }
    );
  }

  /**
   * Get available SMS placeholders
   */
  async getSmsPlaceholders(): Promise<
    ApiResponse<{
      placeholders: Array<{
        key: string;
        label: string;
        description: string;
        category: string;
      }>;
      categories: string[];
    }>
  > {
    return this.get<{
      placeholders: Array<{
        key: string;
        label: string;
        description: string;
        category: string;
      }>;
      categories: string[];
    }>("/api/sms-settings/placeholders");
  }

  /**
   * Send test SMS
   */
  async sendTestSms(data: {
    templateId?: string;
    customMessage?: string;
    phoneNumber: string;
    sampleData?: Record<string, string>;
  }): Promise<
    ApiResponse<{ success: boolean; message: string; smsId?: string }>
  > {
    return this.post<{ success: boolean; message: string; smsId?: string }>(
      "/api/sms-settings/send-test",
      data
    );
  }

  // ========================================
  // BULK OPERATIONS
  // ========================================

  /**
   * Bulk create SMS templates
   */
  async bulkCreateSmsTemplates(templates: CreateSmsTemplateRequest[]): Promise<
    ApiResponse<{
      successful: number;
      failed: number;
      errors: Array<{
        index: number;
        error: string;
      }>;
      created: SmsTemplate[];
    }>
  > {
    return this.post<{
      successful: number;
      failed: number;
      errors: Array<{
        index: number;
        error: string;
      }>;
      created: SmsTemplate[];
    }>("/api/sms-settings/templates/bulk-create", { templates });
  }

  /**
   * Bulk update SMS templates status
   */
  async bulkUpdateSmsTemplatesStatus(
    templateIds: string[],
    status: boolean
  ): Promise<
    ApiResponse<{
      successful: number;
      failed: number;
      errors: string[];
    }>
  > {
    return this.patch<{
      successful: number;
      failed: number;
      errors: string[];
    }>("/api/sms-settings/templates/bulk-status", {
      templateIds,
      status,
    });
  }

  /**
   * Bulk delete SMS templates
   */
  async bulkDeleteSmsTemplates(templateIds: string[]): Promise<
    ApiResponse<{
      successful: number;
      failed: number;
      errors: string[];
    }>
  > {
    return this.delete<{
      successful: number;
      failed: number;
      errors: string[];
    }>("/api/sms-settings/templates/bulk-delete", {
      data: { templateIds },
    });
  }

  // ========================================
  // IMPORT/EXPORT
  // ========================================

  /**
   * Export SMS templates
   */
  async exportSmsTemplates(filters?: SmsTemplateFilters): Promise<
    ApiResponse<{
      downloadUrl: string;
      filename: string;
    }>
  > {
    return this.post<{
      downloadUrl: string;
      filename: string;
    }>("/api/sms-settings/templates/export", { filters });
  }

  /**
   * Import SMS templates from file
   */
  async importSmsTemplates(file: FormData): Promise<
    ApiResponse<{
      successful: number;
      failed: number;
      errors: Array<{
        row: number;
        error: string;
      }>;
      imported: SmsTemplate[];
    }>
  > {
    return this.post<{
      successful: number;
      failed: number;
      errors: Array<{
        row: number;
        error: string;
      }>;
      imported: SmsTemplate[];
    }>("/api/sms-settings/templates/import", file, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  }
}

// Export singleton instance
export const smsSettingsApiClient = new SmsSettingsApiClient();
