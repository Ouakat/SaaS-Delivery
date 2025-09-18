import { create } from "zustand";
import { persist } from "zustand/middleware";
import { settingsApiClient } from "@/lib/api/clients/settings.client";
import type {
  GeneralSettings,
  CreateGeneralSettingsRequest,
  UpdateGeneralSettingsRequest,
  GeneralSettingsPreview,
} from "@/lib/types/settings/general.types";

interface SettingsState {
  // General Settings State
  generalSettings: GeneralSettings | null;
  preview: GeneralSettingsPreview | null;

  // UI State
  isLoading: boolean;
  isUploading: boolean;
  error: string | null;
  lastFetch: number | null;

  // Actions
  fetchGeneralSettings: () => Promise<void>;
  createGeneralSettings: (
    data: CreateGeneralSettingsRequest
  ) => Promise<boolean>;
  updateGeneralSettings: (
    data: UpdateGeneralSettingsRequest
  ) => Promise<boolean>;
  deleteGeneralSettings: () => Promise<boolean>;

  // File Upload Actions
  uploadLogo: (file: File) => Promise<string | null>;
  uploadFavicon: (file: File) => Promise<string | null>;
  resetBranding: () => Promise<boolean>;

  // Preview Actions
  fetchPreview: () => Promise<void>;

  // Utility Actions
  clearError: () => void;
  setError: (error: string) => void;
  refresh: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      // Initial State
      generalSettings: null,
      preview: null,
      isLoading: false,
      isUploading: false,
      error: null,
      lastFetch: null,

      // Fetch General Settings
      fetchGeneralSettings: async () => {
        const state = get();

        // Check if we need to fetch (cache for 5 minutes)
        const now = Date.now();
        if (
          state.generalSettings &&
          state.lastFetch &&
          now - state.lastFetch < 5 * 60 * 1000
        ) {
          return;
        }

        set({ isLoading: true, error: null });

        try {
          const result = await settingsApiClient.getGeneralSettings();

          if (result.success) {
            set({
              generalSettings: result.data,
              isLoading: false,
              error: null,
              lastFetch: now,
            });
          } else {
            set({
              error:
                result.error?.message || "Failed to fetch general settings",
              isLoading: false,
            });
          }
        } catch (error: any) {
          console.error("Fetch general settings failed:", error);
          set({
            error: error.message || "Network error occurred",
            isLoading: false,
          });
        }
      },

      // Create General Settings
      createGeneralSettings: async (data: CreateGeneralSettingsRequest) => {
        set({ isLoading: true, error: null });

        try {
          const result = await settingsApiClient.createGeneralSettings(data);

          if (result.success) {
            set({
              generalSettings: result.data,
              isLoading: false,
              error: null,
              lastFetch: Date.now(),
            });
            return true;
          } else {
            set({
              error:
                result.error?.message || "Failed to create general settings",
              isLoading: false,
            });
            return false;
          }
        } catch (error: any) {
          console.error("Create general settings failed:", error);
          set({
            error: error.message || "Network error occurred",
            isLoading: false,
          });
          return false;
        }
      },

      // Update General Settings
      updateGeneralSettings: async (data: UpdateGeneralSettingsRequest) => {
        set({ isLoading: true, error: null });

        try {
          const result = await settingsApiClient.updateGeneralSettings(data);

          if (result.success) {
            set({
              generalSettings: result.data,
              isLoading: false,
              error: null,
              lastFetch: Date.now(),
            });

            // Refresh preview if available
            get().fetchPreview().catch(console.error);

            return true;
          } else {
            set({
              error:
                result.error?.message || "Failed to update general settings",
              isLoading: false,
            });
            return false;
          }
        } catch (error: any) {
          console.error("Update general settings failed:", error);
          set({
            error: error.message || "Network error occurred",
            isLoading: false,
          });
          return false;
        }
      },

      // Delete General Settings
      deleteGeneralSettings: async () => {
        set({ isLoading: true, error: null });

        try {
          const result = await settingsApiClient.deleteGeneralSettings();

          if (result.success) {
            set({
              generalSettings: null,
              preview: null,
              isLoading: false,
              error: null,
              lastFetch: null,
            });
            return true;
          } else {
            set({
              error:
                result.error?.message || "Failed to delete general settings",
              isLoading: false,
            });
            return false;
          }
        } catch (error: any) {
          console.error("Delete general settings failed:", error);
          set({
            error: error.message || "Network error occurred",
            isLoading: false,
          });
          return false;
        }
      },

      // Upload Logo
      uploadLogo: async (file: File) => {
        set({ isUploading: true, error: null });

        try {
          const result = await settingsApiClient.uploadLogo(file);

          if (result.success) {
            // Update general settings with new logo URL
            const currentSettings = get().generalSettings;
            if (currentSettings) {
              set({
                generalSettings: {
                  ...currentSettings,
                  logo: result.data?.url || "",
                  updatedAt: new Date().toISOString(),
                },
                isUploading: false,
              });
            }

            // Refresh preview
            get().fetchPreview().catch(console.error);

            return result.data?.url || null;
          } else {
            set({
              error: result.error?.message || "Failed to upload logo",
              isUploading: false,
            });
            return null;
          }
        } catch (error: any) {
          console.error("Upload logo failed:", error);
          set({
            error: error.message || "Network error occurred",
            isUploading: false,
          });
          return null;
        }
      },

      // Upload Favicon
      uploadFavicon: async (file: File) => {
        set({ isUploading: true, error: null });

        try {
          const result = await settingsApiClient.uploadFavicon(file);

          if (result.success) {
            // Update general settings with new favicon URL
            const currentSettings = get().generalSettings;
            if (currentSettings) {
              set({
                generalSettings: {
                  ...currentSettings,
                  favicon: result.data?.url || "",
                  updatedAt: new Date().toISOString(),
                },
                isUploading: false,
              });
            }

            // Refresh preview
            get().fetchPreview().catch(console.error);

            return result.data?.url || null;
          } else {
            set({
              error: result.error?.message || "Failed to upload favicon",
              isUploading: false,
            });
            return null;
          }
        } catch (error: any) {
          console.error("Upload favicon failed:", error);
          set({
            error: error.message || "Network error occurred",
            isUploading: false,
          });
          return null;
        }
      },

      // Reset Branding
      resetBranding: async () => {
        set({ isLoading: true, error: null });

        try {
          const result = await settingsApiClient.resetBranding();

          if (result.success) {
            set({
              generalSettings: result.data,
              isLoading: false,
              error: null,
              lastFetch: Date.now(),
            });

            // Refresh preview
            get().fetchPreview().catch(console.error);

            return true;
          } else {
            set({
              error: result.error?.message || "Failed to reset branding",
              isLoading: false,
            });
            return false;
          }
        } catch (error: any) {
          console.error("Reset branding failed:", error);
          set({
            error: error.message || "Network error occurred",
            isLoading: false,
          });
          return false;
        }
      },

      // Fetch Preview Settings
      fetchPreview: async () => {
        try {
          const result = await settingsApiClient.getPreviewSettings();

          if (result.success) {
            set({ preview: result.data });
          }
        } catch (error: any) {
          console.error("Fetch preview failed:", error);
          // Don't set error state for preview failures
        }
      },

      // Utility Actions
      clearError: () => set({ error: null }),

      setError: (error: string) => set({ error }),

      refresh: async () => {
        set({ lastFetch: null });
        await get().fetchGeneralSettings();
        await get().fetchPreview();
      },
    }),
    {
      name: "settings-store",
      partialize: (state) => ({
        generalSettings: state.generalSettings,
        preview: state.preview,
        lastFetch: state.lastFetch,
      }),
      version: 1,
    }
  )
);
