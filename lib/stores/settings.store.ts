// lib/stores/settings.store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { settingsApiClient } from "@/lib/api/clients/settings.client";
import type { GeneralSettings } from "@/lib/types/settings/general.types";

interface SettingsState {
  generalSettings: GeneralSettings | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchGeneralSettings: () => Promise<void>;
  updateGeneralSettings: (data: Partial<GeneralSettings>) => Promise<boolean>;
  uploadLogo: (file: File) => Promise<boolean>;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      generalSettings: null,
      isLoading: false,
      error: null,

      fetchGeneralSettings: async () => {
        set({ isLoading: true, error: null });
        try {
          const result = await settingsApiClient.getGeneralSettings();
          if (result.success) {
            set({ generalSettings: result.data, isLoading: false });
          } else {
            set({
              error: result.error?.message || "Failed to fetch settings",
              isLoading: false,
            });
          }
        } catch (error) {
          set({ error: "Network error", isLoading: false });
        }
      },

      updateGeneralSettings: async (data) => {
        set({ isLoading: true });
        try {
          const result = await settingsApiClient.updateGeneralSettings(data);
          if (result.success) {
            set({ generalSettings: result.data, isLoading: false });
            return true;
          }
          set({
            error: result.error?.message || "Update failed",
            isLoading: false,
          });
          return false;
        } catch (error) {
          set({ error: "Network error", isLoading: false });
          return false;
        }
      },

      uploadLogo: async (file) => {
        try {
          const result = await settingsApiClient.uploadLogo(file);
          return result.success;
        } catch (error) {
          return false;
        }
      },
    }),
    {
      name: "settings-store",
      partialize: (state) => ({ generalSettings: state.generalSettings }),
    }
  )
);
