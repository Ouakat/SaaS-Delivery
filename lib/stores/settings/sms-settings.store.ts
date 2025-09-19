import { create } from "zustand";
import { persist } from "zustand/middleware";
import { smsSettingsApiClient } from "@/lib/api/clients/settings/sms-settings.client";
import type {
  SmsSettings,
  SmsTemplate,
  SmsUsageStats,
  SmsTemplateFilters,
  CreateSmsTemplateRequest,
  UpdateSmsTemplateRequest,
} from "@/lib/types/settings/sms.types";

interface SmsSettingsState {
  // Settings state
  settings: SmsSettings | null;
  isLoading: boolean;
  error: string | null;

  // Templates state
  templates: SmsTemplate[];
  templatesLoading: boolean;
  templatesError: string | null;
  templatesPagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };

  // Usage stats
  usageStats: SmsUsageStats | null;
  balance: { balance: number; lastUpdated: string } | null;

  // Actions
  fetchSettings: () => Promise<void>;
  updateSettings: (data: any) => Promise<boolean>;
  testConfiguration: () => Promise<boolean>;
  rechargeBalance: (amount: number, reference?: string) => Promise<boolean>;

  // Template actions
  fetchTemplates: (filters?: SmsTemplateFilters) => Promise<void>;
  createTemplate: (
    data: CreateSmsTemplateRequest
  ) => Promise<SmsTemplate | null>;
  updateTemplate: (
    id: string,
    data: UpdateSmsTemplateRequest
  ) => Promise<SmsTemplate | null>;
  deleteTemplate: (id: string) => Promise<boolean>;
  toggleTemplateStatus: (id: string) => Promise<boolean>;
  duplicateTemplate: (id: string, name: string) => Promise<SmsTemplate | null>;

  // Usage actions
  fetchUsageStats: () => Promise<void>;
  fetchBalance: () => Promise<void>;

  // Utility actions
  clearError: () => void;
  setError: (error: string) => void;
}

export const useSmsSettingsStore = create<SmsSettingsState>()(
  persist(
    (set, get) => ({
      // Initial state
      settings: null,
      isLoading: false,
      error: null,
      templates: [],
      templatesLoading: false,
      templatesError: null,
      templatesPagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      },
      usageStats: null,
      balance: null,

      // Settings actions
      fetchSettings: async () => {
        set({ isLoading: true, error: null });
        try {
          const result = await smsSettingsApiClient.getSmsSettings();
          if (result.success && result.data) {
            set({ settings: result.data, isLoading: false });
          } else {
            set({
              error: result.error?.message || "Failed to fetch SMS settings",
              isLoading: false,
            });
          }
        } catch (error: any) {
          set({
            error: error.message || "An error occurred while fetching settings",
            isLoading: false,
          });
        }
      },

      updateSettings: async (data: any) => {
        set({ isLoading: true, error: null });
        try {
          const result = await smsSettingsApiClient.updateSmsSettings(data);
          if (result.success && result.data) {
            set({ settings: result.data, isLoading: false });
            return true;
          } else {
            set({
              error: result.error?.message || "Failed to update SMS settings",
              isLoading: false,
            });
            return false;
          }
        } catch (error: any) {
          set({
            error: error.message || "An error occurred while updating settings",
            isLoading: false,
          });
          return false;
        }
      },

      testConfiguration: async () => {
        try {
          const result = await smsSettingsApiClient.testSmsConfiguration();
          return result.success && result.data?.success;
        } catch (error) {
          return false;
        }
      },

      rechargeBalance: async (amount: number, reference?: string) => {
        set({ isLoading: true, error: null });
        try {
          const result = await smsSettingsApiClient.rechargeSmsBalance({
            amount,
            reference,
          });
          if (result.success && result.data) {
            set({
              settings: result.data,
              balance: {
                balance: result.data.balance,
                lastUpdated: result.data.updatedAt,
              },
              isLoading: false,
            });
            return true;
          } else {
            set({
              error: result.error?.message || "Failed to recharge balance",
              isLoading: false,
            });
            return false;
          }
        } catch (error: any) {
          set({
            error:
              error.message || "An error occurred while recharging balance",
            isLoading: false,
          });
          return false;
        }
      },

      // Template actions
      fetchTemplates: async (filters?: SmsTemplateFilters) => {
        set({ templatesLoading: true, templatesError: null });
        try {
          const result = await smsSettingsApiClient.getSmsTemplates(filters);
          if (result.success && result.data) {
            set({
              templates: result.data.data,
              templatesPagination: result.data.meta,
              templatesLoading: false,
            });
          } else {
            set({
              templatesError:
                result.error?.message || "Failed to fetch templates",
              templatesLoading: false,
            });
          }
        } catch (error: any) {
          set({
            templatesError:
              error.message || "An error occurred while fetching templates",
            templatesLoading: false,
          });
        }
      },

      createTemplate: async (data: CreateSmsTemplateRequest) => {
        try {
          const result = await smsSettingsApiClient.createSmsTemplate(data);
          if (result.success && result.data) {
            const { templates } = get();
            set({ templates: [...templates, result.data] });
            return result.data;
          } else {
            set({
              templatesError:
                result.error?.message || "Failed to create template",
            });
            return null;
          }
        } catch (error: any) {
          set({
            templatesError:
              error.message || "An error occurred while creating template",
          });
          return null;
        }
      },

      updateTemplate: async (id: string, data: UpdateSmsTemplateRequest) => {
        try {
          const result = await smsSettingsApiClient.updateSmsTemplate(id, data);
          if (result.success && result.data) {
            const { templates } = get();
            const updatedTemplates = templates.map((template) =>
              template.id === id ? result.data! : template
            );
            set({ templates: updatedTemplates });
            return result.data;
          } else {
            set({
              templatesError:
                result.error?.message || "Failed to update template",
            });
            return null;
          }
        } catch (error: any) {
          set({
            templatesError:
              error.message || "An error occurred while updating template",
          });
          return null;
        }
      },

      deleteTemplate: async (id: string) => {
        try {
          const result = await smsSettingsApiClient.deleteSmsTemplate(id);
          if (result.success) {
            const { templates } = get();
            const filteredTemplates = templates.filter(
              (template) => template.id !== id
            );
            set({ templates: filteredTemplates });
            return true;
          } else {
            set({
              templatesError:
                result.error?.message || "Failed to delete template",
            });
            return false;
          }
        } catch (error: any) {
          set({
            templatesError:
              error.message || "An error occurred while deleting template",
          });
          return false;
        }
      },

      toggleTemplateStatus: async (id: string) => {
        try {
          const result = await smsSettingsApiClient.toggleSmsTemplateStatus(id);
          if (result.success && result.data) {
            const { templates } = get();
            const updatedTemplates = templates.map((template) =>
              template.id === id ? result.data! : template
            );
            set({ templates: updatedTemplates });
            return true;
          } else {
            set({
              templatesError:
                result.error?.message || "Failed to toggle template status",
            });
            return false;
          }
        } catch (error: any) {
          set({
            templatesError:
              error.message ||
              "An error occurred while toggling template status",
          });
          return false;
        }
      },

      duplicateTemplate: async (id: string, name: string) => {
        try {
          const result = await smsSettingsApiClient.duplicateSmsTemplate(
            id,
            name
          );
          if (result.success && result.data) {
            const { templates } = get();
            set({ templates: [...templates, result.data] });
            return result.data;
          } else {
            set({
              templatesError:
                result.error?.message || "Failed to duplicate template",
            });
            return null;
          }
        } catch (error: any) {
          set({
            templatesError:
              error.message || "An error occurred while duplicating template",
          });
          return null;
        }
      },

      // Usage actions
      fetchUsageStats: async () => {
        try {
          const result = await smsSettingsApiClient.getSmsUsageStats();
          if (result.success && result.data) {
            set({ usageStats: result.data });
          }
        } catch (error) {
          console.error("Failed to fetch usage stats:", error);
        }
      },

      fetchBalance: async () => {
        try {
          const result = await smsSettingsApiClient.getSmsBalance();
          if (result.success && result.data) {
            set({ balance: result.data });
          }
        } catch (error) {
          console.error("Failed to fetch balance:", error);
        }
      },

      // Utility actions
      clearError: () => set({ error: null, templatesError: null }),
      setError: (error: string) => set({ error }),
    }),
    {
      name: "sms-settings-store",
      partialize: (state) => ({
        settings: state.settings,
        templates: state.templates,
        usageStats: state.usageStats,
        balance: state.balance,
      }),
      version: 1,
    }
  )
);
