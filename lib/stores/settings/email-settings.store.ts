import { create } from "zustand";
import { persist } from "zustand/middleware";
import { emailSettingsApiClient } from "@/lib/api/clients/settings/email-settings.client";
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
  // Email Settings State
  emailSettings: EmailSettings | null;
  settingsLoading: boolean;
  settingsError: string | null;

  // Templates State
  templates: EmailTemplate[];
  selectedTemplate: EmailTemplate | null;
  templatesLoading: boolean;
  selectedTemplateLoading: boolean;
  templatesError: string | null;

  // Templates Pagination & Filters State
  templatesFilters: EmailTemplateFilters;
  templatesPagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };

  // Stats State
  stats: EmailStats | null;
  statsLoading: boolean;

  // UI State
  actionLoading: boolean;
  lastFetch: number | null;

  // Settings Actions
  fetchEmailSettings: () => Promise<void>;
  updateEmailSettings: (data: UpdateEmailSettingsRequest) => Promise<boolean>;
  testSmtpConnection: () => Promise<{ success: boolean; message: string }>;
  sendTestEmail: (
    data: TestEmailRequest
  ) => Promise<{ success: boolean; message: string }>;

  // Template Actions
  fetchTemplates: (filters?: EmailTemplateFilters) => Promise<void>;
  fetchEmailTemplates: (filters?: EmailTemplateFilters) => Promise<void>; // Alias for fetchTemplates
  fetchTemplateById: (id: string) => Promise<void>;
  createEmailTemplate: (data: CreateEmailTemplateRequest) => Promise<boolean>;
  updateEmailTemplate: (
    id: string,
    data: UpdateEmailTemplateRequest
  ) => Promise<boolean>;
  deleteEmailTemplate: (id: string) => Promise<boolean>;
  toggleTemplateStatus: (id: string) => Promise<boolean>;
  duplicateTemplate: (id: string, newName?: string) => Promise<boolean>;
  bulkDeleteTemplates: (templateIds: string[]) => Promise<boolean>;

  // Filter & Pagination Actions
  setTemplatesFilters: (filters: Partial<EmailTemplateFilters>) => void;

  // Stats Actions
  fetchEmailStats: () => Promise<void>;

  // Utility Actions
  clearError: () => void;
  setError: (error: string) => void;
  refresh: () => Promise<void>;
  clearSelectedTemplate: () => void;
}

export const useEmailSettingsStore = create<EmailSettingsState>()(
  persist(
    (set, get) => ({
      // Initial State
      emailSettings: null,
      settingsLoading: false,
      settingsError: null,
      templates: [],
      selectedTemplate: null,
      templatesLoading: false,
      selectedTemplateLoading: false,
      templatesError: null,
      stats: null,
      statsLoading: false,
      actionLoading: false,
      lastFetch: null,

      // Templates Pagination & Filters Initial State
      templatesFilters: {
        page: 1,
        limit: 10,
        category: undefined,
        enabled: undefined,
        search: undefined,
        sortBy: "updatedAt",
        sortOrder: "desc",
      },
      templatesPagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      },

      // Settings Actions
      fetchEmailSettings: async () => {
        const state = get();

        // Check if we need to fetch (cache for 5 minutes)
        const now = Date.now();
        if (
          state.emailSettings &&
          state.lastFetch &&
          now - state.lastFetch < 5 * 60 * 1000
        ) {
          return;
        }

        set({ settingsLoading: true, settingsError: null });

        try {
          const result = await emailSettingsApiClient.getEmailSettings();

          if (result.success) {
            set({
              emailSettings: result.data,
              settingsLoading: false,
              settingsError: null,
              lastFetch: now,
            });
          } else {
            set({
              settingsError:
                result.error?.message || "Failed to fetch email settings",
              settingsLoading: false,
            });
          }
        } catch (error: any) {
          console.error("Fetch email settings failed:", error);
          set({
            settingsError: error.message || "Network error occurred",
            settingsLoading: false,
          });
        }
      },

      updateEmailSettings: async (data: UpdateEmailSettingsRequest) => {
        set({ settingsLoading: true, settingsError: null });

        try {
          const result = await emailSettingsApiClient.updateEmailSettings(data);

          if (result.success) {
            set({
              emailSettings: result.data,
              settingsLoading: false,
              settingsError: null,
              lastFetch: Date.now(),
            });
            return true;
          } else {
            set({
              settingsError:
                result.error?.message || "Failed to update email settings",
              settingsLoading: false,
            });
            return false;
          }
        } catch (error: any) {
          console.error("Update email settings failed:", error);
          set({
            settingsError: error.message || "Network error occurred",
            settingsLoading: false,
          });
          return false;
        }
      },

      // Fix for testSmtpConnection method
      testSmtpConnection: async (): Promise<{
        success: boolean;
        message: string;
      }> => {
        set({ actionLoading: true, settingsError: null });

        try {
          const result = await emailSettingsApiClient.testSmtpConnection();

          set({ actionLoading: false });

          if (result.success && result.data) {
            return result.data;
          } else {
            const errorMessage =
              result.error?.message || "Connection test failed";
            set({ settingsError: errorMessage });
            return {
              success: false,
              message: errorMessage,
            };
          }
        } catch (error: any) {
          console.error("SMTP connection test failed:", error);
          const errorMessage = error.message || "Network error occurred";
          set({
            settingsError: errorMessage,
            actionLoading: false,
          });
          return {
            success: false,
            message: errorMessage,
          };
        }
      },

      // Fix for sendTestEmail method
      sendTestEmail: async (
        data: TestEmailRequest
      ): Promise<{ success: boolean; message: string }> => {
        set({ actionLoading: true, settingsError: null });

        try {
          const result = await emailSettingsApiClient.sendTestEmail(data);

          set({ actionLoading: false });

          if (result.success && result.data) {
            return result.data;
          } else {
            const errorMessage = result.error?.message || "Test email failed";
            set({ settingsError: errorMessage });
            return {
              success: false,
              message: errorMessage,
            };
          }
        } catch (error: any) {
          console.error("Send test email failed:", error);
          const errorMessage = error.message || "Network error occurred";
          set({
            settingsError: errorMessage,
            actionLoading: false,
          });
          return {
            success: false,
            message: errorMessage,
          };
        }
      },

      // Template Actions
      fetchTemplates: async (filters?: EmailTemplateFilters) => {
        const state = get();
        const currentFilters = filters || state.templatesFilters;

        set({ templatesLoading: true, templatesError: null });

        try {
          const result = await emailSettingsApiClient.getEmailTemplates(
            currentFilters
          );

          if (result.data) {
            // Handle both paginated and non-paginated responses
            const templatesData = result.data;

            const pagination = result.data?.pagination || {
              page: currentFilters.page || 1,
              limit: currentFilters.limit || 10,
              total: templatesData.length,
              totalPages: Math.ceil(
                templatesData.length / (currentFilters.limit || 10)
              ),
            };

            set({
              templates: templatesData,
              templatesPagination: pagination,
              templatesLoading: false,
              templatesError: null,
            });
          } else {
            set({
              templatesError:
                result.error?.message || "Failed to fetch templates",
              templatesLoading: false,
            });
          }
        } catch (error: any) {
          console.error("Fetch templates failed:", error);
          set({
            templatesError: error.message || "Network error occurred",
            templatesLoading: false,
          });
        }
      },

      // Alias for fetchTemplates to match component usage
      fetchEmailTemplates: async (filters?: EmailTemplateFilters) => {
        return get().fetchTemplates(filters);
      },

      fetchTemplateById: async (id: string) => {
        set({ selectedTemplateLoading: true, templatesError: null });

        try {
          const result = await emailSettingsApiClient.getEmailTemplateById(id);

          if (result.success) {
            set({
              selectedTemplate: result.data,
              selectedTemplateLoading: false,
              templatesError: null,
            });
          } else {
            set({
              templatesError:
                result.error?.message || "Failed to fetch template",
              selectedTemplateLoading: false,
              selectedTemplate: null,
            });
          }
        } catch (error: any) {
          console.error("Fetch template by ID failed:", error);
          set({
            templatesError: error.message || "Network error occurred",
            selectedTemplateLoading: false,
            selectedTemplate: null,
          });
        }
      },

      createEmailTemplate: async (data: CreateEmailTemplateRequest) => {
        set({ actionLoading: true, templatesError: null });

        try {
          const result = await emailSettingsApiClient.createEmailTemplate(data);

          if (result.success) {
            // Refresh templates list
            get().fetchTemplates();
            set({ actionLoading: false });
            return true;
          } else {
            set({
              templatesError:
                result.error?.message || "Failed to create template",
              actionLoading: false,
            });
            return false;
          }
        } catch (error: any) {
          console.error("Create template failed:", error);
          set({
            templatesError: error.message || "Network error occurred",
            actionLoading: false,
          });
          return false;
        }
      },

      updateEmailTemplate: async (
        id: string,
        data: UpdateEmailTemplateRequest
      ) => {
        set({ actionLoading: true, templatesError: null });

        try {
          const result = await emailSettingsApiClient.updateEmailTemplate(
            id,
            data
          );

          if (result.success) {
            // Update selected template if it's the one being updated
            const state = get();
            if (state.selectedTemplate?.id === id) {
              set({ selectedTemplate: result.data });
            }

            // Update template in list
            const updatedTemplates = state.templates.map((template) =>
              template.id === id ? result.data : template
            );
            set({ templates: updatedTemplates, actionLoading: false });
            return true;
          } else {
            set({
              templatesError:
                result.error?.message || "Failed to update template",
              actionLoading: false,
            });
            return false;
          }
        } catch (error: any) {
          console.error("Update template failed:", error);
          set({
            templatesError: error.message || "Network error occurred",
            actionLoading: false,
          });
          return false;
        }
      },

      deleteEmailTemplate: async (id: string) => {
        set({ actionLoading: true, templatesError: null });

        try {
          const result = await emailSettingsApiClient.deleteEmailTemplate(id);

          if (result.success) {
            // Remove from templates list
            const state = get();
            const updatedTemplates = state.templates.filter(
              (template) => template.id !== id
            );

            // Clear selected template if it's the one being deleted
            const selectedTemplate =
              state.selectedTemplate?.id === id ? null : state.selectedTemplate;

            set({
              templates: updatedTemplates,
              selectedTemplate,
              actionLoading: false,
            });
            return true;
          } else {
            set({
              templatesError:
                result.error?.message || "Failed to delete template",
              actionLoading: false,
            });
            return false;
          }
        } catch (error: any) {
          console.error("Delete template failed:", error);
          set({
            templatesError: error.message || "Network error occurred",
            actionLoading: false,
          });
          return false;
        }
      },

      toggleTemplateStatus: async (id: string) => {
        set({ actionLoading: true, templatesError: null });

        try {
          const result = await emailSettingsApiClient.toggleTemplateStatus(id);

          if (result.success) {
            // Update selected template if it's the one being toggled
            const state = get();
            if (state.selectedTemplate?.id === id) {
              set({ selectedTemplate: result.data });
            }

            // Update template in list
            const updatedTemplates = state.templates.map((template) =>
              template.id === id ? result.data : template
            );
            set({ templates: updatedTemplates, actionLoading: false });
            return true;
          } else {
            set({
              templatesError:
                result.error?.message || "Failed to toggle template status",
              actionLoading: false,
            });
            return false;
          }
        } catch (error: any) {
          console.error("Toggle template status failed:", error);
          set({
            templatesError: error.message || "Network error occurred",
            actionLoading: false,
          });
          return false;
        }
      },

      duplicateTemplate: async (id: string, newName?: string) => {
        set({ actionLoading: true, templatesError: null });

        try {
          const result = await emailSettingsApiClient.duplicateTemplate(
            id,
            newName
          );

          if (result.success) {
            // Refresh templates list
            get().fetchTemplates();
            set({ actionLoading: false });
            return true;
          } else {
            set({
              templatesError:
                result.error?.message || "Failed to duplicate template",
              actionLoading: false,
            });
            return false;
          }
        } catch (error: any) {
          console.error("Duplicate template failed:", error);
          set({
            templatesError: error.message || "Network error occurred",
            actionLoading: false,
          });
          return false;
        }
      },

      // Bulk Operations
      bulkDeleteTemplates: async (templateIds: string[]) => {
        set({ actionLoading: true, templatesError: null });

        try {
          const result = await emailSettingsApiClient.bulkDeleteTemplates(
            templateIds
          );

          if (result.success) {
            // Remove deleted templates from the list
            const state = get();
            const updatedTemplates = state.templates.filter(
              (template) => !templateIds.includes(template.id)
            );

            // Clear selected template if it was deleted
            const selectedTemplate = templateIds.includes(
              state.selectedTemplate?.id || ""
            )
              ? null
              : state.selectedTemplate;

            set({
              templates: updatedTemplates,
              selectedTemplate,
              actionLoading: false,
            });
            return true;
          } else {
            set({
              templatesError:
                result.error?.message || "Failed to delete templates",
              actionLoading: false,
            });
            return false;
          }
        } catch (error: any) {
          console.error("Bulk delete templates failed:", error);
          set({
            templatesError: error.message || "Network error occurred",
            actionLoading: false,
          });
          return false;
        }
      },

      // Filter & Pagination Actions
      setTemplatesFilters: (filters: Partial<EmailTemplateFilters>) => {
        const state = get();
        const newFilters = { ...state.templatesFilters, ...filters };
        set({ templatesFilters: newFilters });
      },

      // Stats Actions
      fetchEmailStats: async () => {
        set({ statsLoading: true });

        try {
          const result = await emailSettingsApiClient.getEmailStats();

          if (result.success) {
            set({ stats: result.data, statsLoading: false });
          } else {
            console.error("Fetch email stats failed:", result.error);
            set({ statsLoading: false });
          }
        } catch (error: any) {
          console.error("Fetch email stats failed:", error);
          set({ statsLoading: false });
        }
      },

      // Utility Actions
      clearError: () => set({ settingsError: null, templatesError: null }),

      setError: (error: string) => set({ settingsError: error }),

      refresh: async () => {
        set({ lastFetch: null });
        await get().fetchEmailSettings();
        await get().fetchTemplates();
        await get().fetchEmailStats();
      },

      clearSelectedTemplate: () => set({ selectedTemplate: null }),
    }),
    {
      name: "email-settings-store",
      partialize: (state) => ({
        emailSettings: state.emailSettings,
        templates: state.templates,
        stats: state.stats,
        lastFetch: state.lastFetch,
        templatesFilters: state.templatesFilters,
      }),
      version: 1,
    }
  )
);
