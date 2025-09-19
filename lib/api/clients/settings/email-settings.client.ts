import { BaseApiClient, ApiResponse } from "../../base.client";
import type {
  EmailSettings,
  UpdateEmailSettingsRequest,
  EmailTemplate,
  CreateEmailTemplateRequest,
  UpdateEmailTemplateRequest,
  EmailTemplateFilters,
  TestEmailRequest,
  EmailStats,
  EmailTemplateCategory,
} from "@/lib/types/settings/email.types";

export class EmailSettingsApiClient extends BaseApiClient {
  constructor() {
    super("settings");
  }

  // ========================================
  // EMAIL SETTINGS ENDPOINTS
  // ========================================

  /**
   * Get email settings for current tenant
   */
  async getEmailSettings(): Promise<ApiResponse<EmailSettings>> {
    return this.get<EmailSettings>("/api/email-settings");
  }

  /**
   * Update email settings
   */
  async updateEmailSettings(
    data: UpdateEmailSettingsRequest
  ): Promise<ApiResponse<EmailSettings>> {
    return this.patch<EmailSettings>("/api/email-settings", data);
  }

  /**
   * Test SMTP connection
   */
  async testSmtpConnection(): Promise<
    ApiResponse<{ success: boolean; message: string }>
  > {
    return this.post<{ success: boolean; message: string }>(
      "/api/email-settings/test-connection"
    );
  }

  /**
   * Send test email
   */
  async sendTestEmail(
    data: TestEmailRequest
  ): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return this.post<{ success: boolean; message: string }>(
      "/api/email-settings/send-test",
      data
    );
  }

  /**
   * Get email settings statistics
   */
  async getEmailStats(): Promise<ApiResponse<EmailStats>> {
    return this.get<EmailStats>("/api/email-settings/stats");
  }

  // ========================================
  // EMAIL TEMPLATES ENDPOINTS
  // ========================================

  /**
   * Get all email templates with optional filters
   */
  async getEmailTemplates(filters?: EmailTemplateFilters) {
    return this.getPaginated<EmailTemplate>(
      "/api/email-settings/templates",
      filters
    );
  }

  /**
   * Get templates by category
   */
  async getTemplatesByCategory(
    category: EmailTemplateCategory
  ): Promise<ApiResponse<EmailTemplate[]>> {
    return this.get<EmailTemplate[]>(
      `/api/email-settings/templates/category/${category}`
    );
  }

  /**
   * Get email template by ID
   */
  async getEmailTemplateById(id: string): Promise<ApiResponse<EmailTemplate>> {
    return this.get<EmailTemplate>(`/api/email-settings/templates/${id}`);
  }

  /**
   * Create new email template
   */
  async createEmailTemplate(
    data: CreateEmailTemplateRequest
  ): Promise<ApiResponse<EmailTemplate>> {
    return this.post<EmailTemplate>("/api/email-settings/templates", data);
  }

  /**
   * Update email template
   */
  async updateEmailTemplate(
    id: string,
    data: UpdateEmailTemplateRequest
  ): Promise<ApiResponse<EmailTemplate>> {
    return this.patch<EmailTemplate>(
      `/api/email-settings/templates/${id}`,
      data
    );
  }

  /**
   * Delete email template
   */
  async deleteEmailTemplate(id: string): Promise<ApiResponse<void>> {
    return this.delete<void>(`/api/email-settings/templates/${id}`);
  }

  /**
   * Toggle email template status
   */
  async toggleTemplateStatus(id: string): Promise<ApiResponse<EmailTemplate>> {
    return this.patch<EmailTemplate>(
      `/api/email-settings/templates/${id}/toggle-status`
    );
  }

  /**
   * Duplicate email template
   */
  async duplicateTemplate(
    id: string,
    newName?: string
  ): Promise<ApiResponse<EmailTemplate>> {
    return this.post<EmailTemplate>(
      `/api/email-settings/templates/${id}/duplicate`,
      {
        name: newName,
      }
    );
  }

  /**
   * Preview email template with placeholder values
   */
  async previewTemplate(
    id: string,
    placeholderValues?: Record<string, string>
  ): Promise<
    ApiResponse<{ subject: string; htmlContent: string; textContent: string }>
  > {
    return this.post<{
      subject: string;
      htmlContent: string;
      textContent: string;
    }>(`/api/email-settings/templates/${id}/preview`, { placeholderValues });
  }

  /**
   * Send email using template
   */
  async sendTemplatedEmail(
    templateId: string,
    data: {
      to: string | string[];
      placeholderValues?: Record<string, string>;
      attachments?: Array<{
        filename: string;
        path?: string;
        content?: Buffer | string;
        contentType?: string;
      }>;
    }
  ): Promise<ApiResponse<{ success: boolean; messageId: string }>> {
    return this.post<{ success: boolean; messageId: string }>(
      `/api/email-settings/templates/${templateId}/send`,
      data
    );
  }

  /**
   * Bulk operations on templates
   */
  async bulkUpdateTemplates(
    templateIds: string[],
    updates: Partial<Pick<EmailTemplate, "enabled" | "category">>
  ): Promise<ApiResponse<{ updated: number; failed: string[] }>> {
    return this.patch<{ updated: number; failed: string[] }>(
      "/api/email-settings/templates/bulk",
      {
        templateIds,
        updates,
      }
    );
  }

  /**
   * Bulk delete templates
   */
  async bulkDeleteTemplates(
    templateIds: string[]
  ): Promise<ApiResponse<{ deleted: number; failed: string[] }>> {
    return this.delete<{ deleted: number; failed: string[] }>(
      "/api/email-settings/templates/bulk",
      {
        data: { templateIds },
      }
    );
  }

  /**
   * Export templates as JSON
   */
  async exportTemplates(
    templateIds?: string[]
  ): Promise<ApiResponse<{ templates: EmailTemplate[]; exportedAt: string }>> {
    return this.post<{ templates: EmailTemplate[]; exportedAt: string }>(
      "/api/email-settings/templates/export",
      { templateIds }
    );
  }

  /**
   * Import templates from JSON
   */
  async importTemplates(
    templates: Omit<EmailTemplate, "id" | "createdAt" | "updatedAt">[]
  ): Promise<
    ApiResponse<{ imported: number; skipped: number; errors: string[] }>
  > {
    return this.post<{ imported: number; skipped: number; errors: string[] }>(
      "/api/email-settings/templates/import",
      { templates }
    );
  }

  /**
   * Get available placeholders for a category
   */
  async getCategoryPlaceholders(category: EmailTemplateCategory): Promise<
    ApiResponse<{
      placeholders: string[];
      descriptions: Record<string, string>;
    }>
  > {
    return this.get<{
      placeholders: string[];
      descriptions: Record<string, string>;
    }>(`/api/email-settings/placeholders/${category}`);
  }

  /**
   * Validate template content
   */
  async validateTemplate(
    data: Pick<
      EmailTemplate,
      "subject" | "htmlContent" | "textContent" | "placeholders"
    >
  ): Promise<
    ApiResponse<{
      valid: boolean;
      errors: string[];
      warnings: string[];
      usedPlaceholders: string[];
      unusedPlaceholders: string[];
    }>
  > {
    return this.post<{
      valid: boolean;
      errors: string[];
      warnings: string[];
      usedPlaceholders: string[];
      unusedPlaceholders: string[];
    }>("/api/email-settings/templates/validate", data);
  }

  /**
   * Get template usage statistics
   */
  async getTemplateStats(
    templateId: string,
    dateRange?: { from: string; to: string }
  ): Promise<
    ApiResponse<{
      templateId: string;
      sentCount: number;
      deliveryRate: number;
      lastUsed?: string;
      usageByDate: Array<{ date: string; count: number }>;
    }>
  > {
    const params = dateRange
      ? new URLSearchParams({
          from: dateRange.from,
          to: dateRange.to,
        }).toString()
      : "";

    return this.get<{
      templateId: string;
      sentCount: number;
      deliveryRate: number;
      lastUsed?: string;
      usageByDate: Array<{ date: string; count: number }>;
    }>(
      `/api/email-settings/templates/${templateId}/stats${
        params ? `?${params}` : ""
      }`
    );
  }
}

// Export singleton instance
export const emailSettingsApiClient = new EmailSettingsApiClient();
