import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { parcelStatusesApiClient } from "@/lib/api/clients/parcels/parcel-statuses";
import { toast } from "sonner";
import type {
  ParcelStatus,
  CreateParcelStatusRequest,
  UpdateParcelStatusRequest,
  ParcelStatusFilters,
  OptionStats,
} from "@/lib/types/parcels/parcel-statuses.types";

interface ParcelStatusesState {
  // Parcel Statuses
  parcelStatuses: ParcelStatus[];
  parcelStatusesLoading: boolean;
  parcelStatusesFilters: ParcelStatusFilters;

  // Stats
  stats: OptionStats | null;
  statsLoading: boolean;

  // General
  error: string | null;

  // Actions - Parcel Statuses
  fetchParcelStatuses: () => Promise<void>;
  createParcelStatus: (data: CreateParcelStatusRequest) => Promise<boolean>;
  updateParcelStatus: (
    id: string,
    data: UpdateParcelStatusRequest
  ) => Promise<boolean>;
  deleteParcelStatus: (id: string) => Promise<boolean>;
  toggleParcelStatusStatus: (id: string) => Promise<boolean>;
  setParcelStatusesFilters: (filters: Partial<ParcelStatusFilters>) => void;
  bulkDeleteParcelStatuses: (ids: string[]) => Promise<boolean>;
  bulkToggleParcelStatuses: (ids: string[]) => Promise<boolean>;

  // Actions - Stats
  fetchStats: () => Promise<void>;

  // Utility Actions
  clearError: () => void;
  refreshAll: () => Promise<void>;
}

export const useParcelStatusesStore = create<ParcelStatusesState>()(
  devtools(
    (set, get) => ({
      // Initial State
      parcelStatuses: [],
      parcelStatusesLoading: false,
      parcelStatusesFilters: { page: 1, limit: 10 },

      stats: null,
      statsLoading: false,
      error: null,

      // Parcel Statuses Actions
      fetchParcelStatuses: async () => {
        set({ parcelStatusesLoading: true, error: null });
        try {
          const response = await parcelStatusesApiClient.getParcelStatuses(
            get().parcelStatusesFilters
          );
          if (response.success && response.data) {
            set({ parcelStatuses: response.data });
          } else {
            set({
              error:
                typeof response.error === "string"
                  ? response.error
                  : response.error?.message ||
                    "Failed to fetch parcel statuses",
            });
          }
        } catch (error) {
          console.error("Failed to fetch parcel statuses:", error);
          set({ error: "Failed to fetch parcel statuses" });
        } finally {
          set({ parcelStatusesLoading: false });
        }
      },

      createParcelStatus: async (data: CreateParcelStatusRequest) => {
        try {
          const response = await parcelStatusesApiClient.createParcelStatus(
            data
          );
          if (response.success && response.data) {
            // Add the new status to the beginning of the array
            set((state) => ({
              parcelStatuses: [response.data!, ...state.parcelStatuses],
            }));
            toast.success("Parcel status created successfully");
            return true;
          } else {
            toast.error(
              typeof response.error === "string"
                ? response.error
                : response.error?.message || "Failed to create parcel status"
            );

            return false;
          }
        } catch (error) {
          console.error("Failed to create parcel status:", error);
          toast.error("Failed to create parcel status");
          return false;
        }
      },

      updateParcelStatus: async (
        id: string,
        data: UpdateParcelStatusRequest
      ) => {
        try {
          const response = await parcelStatusesApiClient.updateParcelStatus(
            id,
            data
          );
          if (response.success && response.data) {
            // Update the status in the array
            set((state) => ({
              parcelStatuses: state.parcelStatuses.map((status) =>
                status.id === id ? response.data! : status
              ),
            }));
            toast.success("Parcel status updated successfully");
            return true;
          } else {
            toast.error(
              typeof response.error === "string"
                ? response.error
                : response.error?.message || "Failed to update parcel status"
            );

            return false;
          }
        } catch (error) {
          console.error("Failed to update parcel status:", error);
          toast.error("Failed to update parcel status");
          return false;
        }
      },

      deleteParcelStatus: async (id: string) => {
        try {
          const response = await parcelStatusesApiClient.deleteParcelStatus(id);
          if (response.success) {
            // Remove the status from the array
            set((state) => ({
              parcelStatuses: state.parcelStatuses.filter(
                (status) => status.id !== id
              ),
            }));
            toast.success("Parcel status deleted successfully");
            return true;
          } else {
            toast.error(
              typeof response.error === "string"
                ? response.error
                : response.error?.message || "Failed to delete parcel status"
            );

            return false;
          }
        } catch (error) {
          console.error("Failed to delete parcel status:", error);
          toast.error("Failed to delete parcel status");
          return false;
        }
      },

      toggleParcelStatusStatus: async (id: string) => {
        try {
          const response =
            await parcelStatusesApiClient.toggleParcelStatusStatus(id);
          if (response.success && response.data) {
            // Update the status in the array
            set((state) => ({
              parcelStatuses: state.parcelStatuses.map((status) =>
                status.id === id ? response.data! : status
              ),
            }));
            const newStatus = response.data.status
              ? "activated"
              : "deactivated";
            toast.success(`Parcel status ${newStatus} successfully`);
            return true;
          } else {
            toast.error(
              typeof response.error === "string"
                ? response.error
                : response.error?.message || "Failed to toggle parcel status"
            );

            return false;
          }
        } catch (error) {
          console.error("Failed to toggle parcel status:", error);
          toast.error("Failed to toggle parcel status");
          return false;
        }
      },

      setParcelStatusesFilters: (filters: Partial<ParcelStatusFilters>) => {
        set((state) => ({
          parcelStatusesFilters: { ...state.parcelStatusesFilters, ...filters },
        }));
      },

      bulkDeleteParcelStatuses: async (ids: string[]) => {
        try {
          // Since bulk delete doesn't exist in backend yet, do individual deletes
          const promises = ids.map((id) => get().deleteParcelStatus(id));
          const results = await Promise.all(promises);
          const successCount = results.filter(Boolean).length;

          if (successCount === ids.length) {
            toast.success(
              `${successCount} parcel statuses deleted successfully`
            );
            return true;
          } else {
            toast.error(
              `Only ${successCount} of ${ids.length} parcel statuses were deleted`
            );
            return false;
          }
        } catch (error) {
          console.error("Failed to bulk delete parcel statuses:", error);
          toast.error("Failed to delete parcel statuses");
          return false;
        }
      },

      bulkToggleParcelStatuses: async (ids: string[]) => {
        try {
          // Since bulk toggle doesn't exist in backend yet, do individual toggles
          const promises = ids.map((id) => get().toggleParcelStatusStatus(id));
          const results = await Promise.all(promises);
          const successCount = results.filter(Boolean).length;

          if (successCount === ids.length) {
            toast.success(
              `${successCount} parcel statuses toggled successfully`
            );
            return true;
          } else {
            toast.error(
              `Only ${successCount} of ${ids.length} parcel statuses were toggled`
            );
            return false;
          }
        } catch (error) {
          console.error("Failed to bulk toggle parcel statuses:", error);
          toast.error("Failed to toggle parcel statuses");
          return false;
        }
      },

      // Stats Actions
      fetchStats: async () => {
        set({ statsLoading: true });
        try {
          const response =
            await parcelStatusesApiClient.getParcelStatusesStats();
          if (response.success && response.data) {
            set({ stats: response.data });
          } else {
            console.error("Failed to fetch stats:", response.error);
          }
        } catch (error) {
          console.error("Failed to fetch stats:", error);
        } finally {
          set({ statsLoading: false });
        }
      },

      // Utility Actions
      clearError: () => set({ error: null }),

      refreshAll: async () => {
        await Promise.all([get().fetchParcelStatuses(), get().fetchStats()]);
      },
    }),
    { name: "parcel-statuses-store" }
  )
);
