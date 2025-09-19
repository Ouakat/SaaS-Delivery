import { create } from "zustand";
import { emailSettingsApiClient } from "@/lib/api/clients/settings/email-settings.client";
import { toast } from "sonner";
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

interface EmailSettingsState {
  // Settings state
  emailSettings: EmailSettings | null;
  settingsLoading: boolean;
  settingsError: string | null;

  // Templates state
  templates: EmailTemplate[];
  templatesLoading: boolean;
  templatesError: string | null;
  templatesFilters: EmailTemplateFilters;
  templatesPagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };

  // Selected template for editing/viewing
  selectedTemplate: EmailTemplate | null;
  selectedTemplateLoading: boolean;

  // Stats
  stats: EmailStats | null;
  statsLoading: boolean;

  // Actions - Settings
  fetchEmailSettings: () => Promise<void>;
  updateEmailSettings: (data: UpdateEmailSettingsRequest) => Promise<boolean>;
  testSmtpConnection: () => Promise<boolean>;
  sendTestEmail: (data: TestEmailRequest) => Promise<boolean>;
  fetchEmailStats: () => Promise<void>;

  // Actions - Templates
  fetchEmailTemplates: (filters?: EmailTemplateFilters) => Promise<void>;
  fetchTemplateById: (id: string) => Promise<void>;
  createEmailTemplate: (data: CreateEmailTemplateRequest) => Promise<boolean>;
  updateEmailTemplate: (
    id: string,
    data: UpdateEmailTemplateRequest
  ) => Promise<boolean>;
  deleteEmailTemplate: (id: string) => Promise<boolean>;
  toggleTemplateStatus: (id: string) => Promise<boolean>;
  duplicateTemplate: (id: string, newName?: string) => Promise<boolean>;
  bulkUpdateTemplates: (
    templateIds: string[],
    updates: any
  ) => Promise<boolean>;
  bulkDeleteTemplates: (templateIds: string[]) => Promise<boolean>;

  // Utility actions
  setTemplatesFilters: (filters: Partial<EmailTemplateFilters>) => void;
  clearSelectedTemplate: () => void;
  clearErrors: () => void;
}

export const useEmailSettingsStore = create<EmailSettingsState>((set, get) => ({
  // Initial state
  emailSettings: null,
  settingsLoading: false,
  settingsError: null,

  templates: [],
  templatesLoading: false,
  templatesError: null,
  templatesFilters: {
    page: 1,
    limit: 10,
  },
  templatesPagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },

  selectedTemplate: null,
  selectedTemplateLoading: false,

  stats: null,
  statsLoading: false,

  // Settings actions
  fetchEmailSettings: async () => {
    set({ settingsLoading: true, settingsError: null });
    try {
      const response = await emailSettingsApiClient.getEmailSettings();
      if (response.success && response.data) {
        set({
          emailSettings: response.data,
          settingsLoading: false,
        });
      } else {
        throw new Error(
          response.error?.message || "Failed to fetch email settings"
        );
      }
    } catch (error: any) {
      const message = error?.message || "Failed to fetch email settings";
      set({
        settingsError: message,
        settingsLoading: false,
      });
      toast.error(message);
    }
  },

  updateEmailSettings: async (data: UpdateEmailSettingsRequest) => {
    set({ settingsLoading: true, settingsError: null });
    try {
      const response = await emailSettingsApiClient.updateEmailSettings(data);
      if (response.success && response.data) {
        set({
          emailSettings: response.data,
          settingsLoading: false,
        });
        toast.success("Email settings updated successfully");
        return true;
      } else {
        throw new Error(
          response.error?.message || "Failed to update email settings"
        );
      }
    } catch (error: any) {
      const message = error?.message || "Failed to update email settings";
      set({
        settingsError: message,
        settingsLoading: false,
      });
      toast.error(message);
      return false;
    }
  },

  testSmtpConnection: async () => {
    try {
      const response = await emailSettingsApiClient.testSmtpConnection();
      if (response.success && response.data?.success) {
        toast.success(response.data.message || "SMTP connection successful");
        return true;
      } else {
        toast.error(
          response.data?.message ||
            response.error?.message ||
            "SMTP connection failed"
        );
        return false;
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to test SMTP connection");
      return false;
    }
  },

  sendTestEmail: async (data: TestEmailRequest) => {
    try {
      const response = await emailSettingsApiClient.sendTestEmail(data);
      if (response.success && response.data?.success) {
        toast.success(response.data.message || "Test email sent successfully");
        return true;
      } else {
        toast.error(
          response.data?.message ||
            response.error?.message ||
            "Failed to send test email"
        );
        return false;
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to send test email");
      return false;
    }
  },

  fetchEmailStats: async () => {
    set({ statsLoading: true });
    try {
      const response = await emailSettingsApiClient.getEmailStats();
      if (response.success && response.data) {
        set({
          stats: response.data,
          statsLoading: false,
        });
      } else {
        throw new Error(
          response.error?.message || "Failed to fetch email stats"
        );
      }
    } catch (error: any) {
      set({ statsLoading: false });
      console.error("Failed to fetch email stats:", error);
    }
  },

  // Template actions
  fetchEmailTemplates: async (filters?: EmailTemplateFilters) => {
    set({ templatesLoading: true, templatesError: null });
    try {
      const currentFilters = { ...get().templatesFilters, ...filters };
      set({ templatesFilters: currentFilters });

      const response = await emailSettingsApiClient.getEmailTemplates(
        currentFilters
      );
      if (response.data) {
        set({
          templates: response.data,
          templatesPagination: response.pagination || {
            page: 1,
            limit: 10,
            total: response.data.length,
            totalPages: 1,
          },
          templatesLoading: false,
        });
      } else {
        throw new Error("Failed to fetch email templates");
      }
    } catch (error: any) {
      const message = error?.message || "Failed to fetch email templates";
      set({
        templatesError: message,
        templatesLoading: false,
      });
      toast.error(message);
    }
  },

  fetchTemplateById: async (id: string) => {
    set({ selectedTemplateLoading: true });
    try {
      const response = await emailSettingsApiClient.getEmailTemplateById(id);
      if (response.success && response.data) {
        set({
          selectedTemplate: response.data,
          selectedTemplateLoading: false,
        });
      } else {
        throw new Error(response.error?.message || "Failed to fetch template");
      }
    } catch (error: any) {
      set({ selectedTemplateLoading: false });
      toast.error(error?.message || "Failed to fetch template");
    }
  },

  createEmailTemplate: async (data: CreateEmailTemplateRequest) => {
    try {
      const response = await emailSettingsApiClient.createEmailTemplate(data);
      if (response.success && response.data) {
        // Add to templates list
        set((state) => ({
          templates: [response.data!, ...state.templates],
        }));
        toast.success("Email template created successfully");
        return true;
      } else {
        throw new Error(response.error?.message || "Failed to create template");
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to create template");
      return false;
    }
  },

  updateEmailTemplate: async (id: string, data: UpdateEmailTemplateRequest) => {
    try {
      const response = await emailSettingsApiClient.updateEmailTemplate(
        id,
        data
      );
      if (response.success && response.data) {
        // Update in templates list
        set((state) => ({
          templates: state.templates.map((template) =>
            template.id === id ? response.data! : template
          ),
          selectedTemplate:
            state.selectedTemplate?.id === id
              ? response.data!
              : state.selectedTemplate,
        }));
        toast.success("Email template updated successfully");
        return true;
      } else {
        throw new Error(response.error?.message || "Failed to update template");
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to update template");
      return false;
    }
  },

  deleteEmailTemplate: async (id: string) => {
    try {
      const response = await emailSettingsApiClient.deleteEmailTemplate(id);
      if (response.success) {
        // Remove from templates list
        set((state) => ({
          templates: state.templates.filter((template) => template.id !== id),
          selectedTemplate:
            state.selectedTemplate?.id === id ? null : state.selectedTemplate,
        }));
        toast.success("Email template deleted successfully");
        return true;
      } else {
        throw new Error(response.error?.message || "Failed to delete template");
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to delete template");
      return false;
    }
  },

  toggleTemplateStatus: async (id: string) => {
    try {
      const response = await emailSettingsApiClient.toggleTemplateStatus(id);
      if (response.success && response.data) {
        // Update in templates list
        set((state) => ({
          templates: state.templates.map((template) =>
            template.id === id ? response.data! : template
          ),
        }));
        toast.success("Template status updated successfully");
        return true;
      } else {
        throw new Error(
          response.error?.message || "Failed to update template status"
        );
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to update template status");
      return false;
    }
  },

  duplicateTemplate: async (id: string, newName?: string) => {
    try {
      const response = await emailSettingsApiClient.duplicateTemplate(
        id,
        newName
      );
      if (response.success && response.data) {
        // Add to templates list
        set((state) => ({
          templates: [response.data!, ...state.templates],
        }));
        toast.success("Email template duplicated successfully");
        return true;
      } else {
        throw new Error(
          response.error?.message || "Failed to duplicate template"
        );
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to duplicate template");
      return false;
    }
  },

  bulkUpdateTemplates: async (templateIds: string[], updates: any) => {
    try {
      const response = await emailSettingsApiClient.bulkUpdateTemplates(
        templateIds,
        updates
      );
      if (response.success && response.data) {
        // Refresh templates
        await get().fetchEmailTemplates();
        toast.success(
          `${response.data.updated} templates updated successfully`
        );
        if (response.data.failed.length > 0) {
          toast.warning(
            `${response.data.failed.length} templates failed to update`
          );
        }
        return true;
      } else {
        throw new Error(
          response.error?.message || "Failed to update templates"
        );
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to update templates");
      return false;
    }
  },

  bulkDeleteTemplates: async (templateIds: string[]) => {
    try {
      const response = await emailSettingsApiClient.bulkDeleteTemplates(
        templateIds
      );
      if (response.success && response.data) {
        // Remove from templates list
        set((state) => ({
          templates: state.templates.filter(
            (template) => !templateIds.includes(template.id)
          ),
        }));
        toast.success(
          `${response.data.deleted} templates deleted successfully`
        );
        if (response.data.failed.length > 0) {
          toast.warning(
            `${response.data.failed.length} templates failed to delete`
          );
        }
        return true;
      } else {
        throw new Error(
          response.error?.message || "Failed to delete templates"
        );
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to delete templates");
      return false;
    }
  },

  // Utility actions
  setTemplatesFilters: (filters: Partial<EmailTemplateFilters>) => {
    set((state) => ({
      templatesFilters: { ...state.templatesFilters, ...filters },
    }));
  },

  clearSelectedTemplate: () => {
    set({ selectedTemplate: null });
  },

  clearErrors: () => {
    set({ settingsError: null, templatesError: null });
  },
}));
