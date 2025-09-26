import { create } from "zustand";
import { persist } from "zustand/middleware";
import { pickupCitiesApiClient } from "@/lib/api/clients/parcels/pickup-cities.client";
import type {
  PickupCity,
  CreatePickupCityRequest,
  UpdatePickupCityRequest,
  PickupCityFilters,
  PaginatedResponse,
  PickupCityStatistics,
} from "@/lib/types/parcels/pickup-cities.types";
import { toast } from "sonner";

interface PickupCitiesState {
  // Core state
  pickupCities: PickupCity[];
  activePickupCities: PickupCity[];
  selectedPickupCity: PickupCity | null;
  statistics: PickupCityStatistics | null;

  // UI state
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  error: string | null;

  // Pagination state
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };

  // Filters state
  filters: PickupCityFilters;

  // Selection state for bulk operations
  selectedIds: string[];

  // Actions
  setFilters: (filters: Partial<PickupCityFilters>) => void;
  clearFilters: () => void;
  setSelectedIds: (ids: string[]) => void;
  clearSelectedIds: () => void;

  // API Actions
  fetchPickupCities: () => Promise<void>;
  fetchActivePickupCities: () => Promise<void>;
  fetchPickupCityById: (id: string) => Promise<PickupCity | null>;
  createPickupCity: (
    data: CreatePickupCityRequest
  ) => Promise<PickupCity | null>;
  updatePickupCity: (
    id: string,
    data: UpdatePickupCityRequest
  ) => Promise<PickupCity | null>;
  deletePickupCity: (id: string) => Promise<boolean>;
  togglePickupCityStatus: (id: string) => Promise<boolean>;

  // Bulk operations
  bulkDeletePickupCities: (ids: string[]) => Promise<boolean>;
  bulkToggleStatus: (ids: string[], status: boolean) => Promise<boolean>;

  // Statistics
  fetchStatistics: () => Promise<void>;

  // Utility methods
  getPickupCityById: (id: string) => PickupCity | undefined;
  resetState: () => void;
  clearError: () => void;
}

const DEFAULT_FILTERS: PickupCityFilters = {
  page: 1,
  limit: 10,
  search: "",
  sortBy: "name",
  sortParcel: "asc",
};

const DEFAULT_PAGINATION = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
  hasNext: false,
  hasPrev: false,
};

export const usePickupCitiesStore = create<PickupCitiesState>()(
  persist(
    (set, get) => ({
      // Initial state
      pickupCities: [],
      activePickupCities: [],
      selectedPickupCity: null,
      statistics: null,
      isLoading: false,
      isCreating: false,
      isUpdating: false,
      isDeleting: false,
      error: null,
      pagination: DEFAULT_PAGINATION,
      filters: DEFAULT_FILTERS,
      selectedIds: [],

      // Filter actions
      setFilters: (newFilters) => {
        const updatedFilters = { ...get().filters, ...newFilters };
        set({ filters: updatedFilters });

        // Reset to page 1 if search or other filters changed
        if ("search" in newFilters || "status" in newFilters) {
          set({ filters: { ...updatedFilters, page: 1 } });
        }

        // Auto-fetch with new filters
        get().fetchPickupCities();
      },

      clearFilters: () => {
        set({ filters: DEFAULT_FILTERS });
        get().fetchPickupCities();
      },

      setSelectedIds: (ids) => set({ selectedIds: ids }),
      clearSelectedIds: () => set({ selectedIds: [] }),

      // Fetch pickup cities with filters and pagination
      fetchPickupCities: async () => {
        const { filters } = get();
        set({ isLoading: true, error: null });

        try {
          const response = await pickupCitiesApiClient.getPickupCities(filters);

          if (response.success && response.data) {
            set({
              pickupCities: response.data.data,
              pagination: response.data.meta,
              isLoading: false,
            });
          } else {
            throw new Error(
              response.error?.message || "Failed to fetch pickup cities"
            );
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "An unexpected error occurred";
          console.error("Error fetching pickup cities:", error);
          set({ error: errorMessage, isLoading: false });
          toast.error("Failed to fetch pickup cities");
        }
      },

      // Fetch active pickup cities only
      fetchActivePickupCities: async () => {
        try {
          const response = await pickupCitiesApiClient.getActivePickupCities();

          if (response.success && response.data) {
            set({ activePickupCities: response.data });
          } else {
            throw new Error(
              response.error?.message || "Failed to fetch active pickup cities"
            );
          }
        } catch (error) {
          console.error("Error fetching active pickup cities:", error);
          toast.error("Failed to fetch active pickup cities");
        }
      },

      // Fetch pickup city by ID
      fetchPickupCityById: async (id: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await pickupCitiesApiClient.getPickupCityById(id);

          if (response.success && response.data) {
            set({ selectedPickupCity: response.data, isLoading: false });
            return response.data;
          } else {
            throw new Error(response.error?.message || "Pickup city not found");
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "An unexpected error occurred";
          console.error("Error fetching pickup city:", error);
          set({
            error: errorMessage,
            isLoading: false,
            selectedPickupCity: null,
          });
          toast.error("Failed to fetch pickup city");
          return null;
        }
      },

      // Create pickup city
      createPickupCity: async (data: CreatePickupCityRequest) => {
        set({ isCreating: true, error: null });

        try {
          const response = await pickupCitiesApiClient.createPickupCity(data);

          if (response.success && response.data) {
            const newPickupCity = response.data;

            // Add to list if it matches current filters
            const { pickupCities } = get();
            set({
              pickupCities: [newPickupCity, ...pickupCities],
              isCreating: false,
            });

            toast.success("Pickup city created successfully");

            // Refresh the list to get accurate pagination
            get().fetchPickupCities();

            return newPickupCity;
          } else {
            throw new Error(
              response.error?.message || "Failed to create pickup city"
            );
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "An unexpected error occurred";
          console.error("Error creating pickup city:", error);
          set({ error: errorMessage, isCreating: false });
          toast.error(`Failed to create pickup city: ${errorMessage}`);
          return null;
        }
      },

      // Update pickup city
      updatePickupCity: async (id: string, data: UpdatePickupCityRequest) => {
        set({ isUpdating: true, error: null });

        try {
          const response = await pickupCitiesApiClient.updatePickupCity(
            id,
            data
          );

          if (response.success && response.data) {
            const updatedPickupCity = response.data;

            // Update in list
            const { pickupCities } = get();
            const updatedList = pickupCities.map((city) =>
              city.id === id ? updatedPickupCity : city
            );

            set({
              pickupCities: updatedList,
              selectedPickupCity: updatedPickupCity,
              isUpdating: false,
            });

            toast.success("Pickup city updated successfully");
            return updatedPickupCity;
          } else {
            throw new Error(
              response.error?.message || "Failed to update pickup city"
            );
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "An unexpected error occurred";
          console.error("Error updating pickup city:", error);
          set({ error: errorMessage, isUpdating: false });
          toast.error(`Failed to update pickup city: ${errorMessage}`);
          return null;
        }
      },

      // Delete pickup city
      deletePickupCity: async (id: string) => {
        set({ isDeleting: true, error: null });

        try {
          const response = await pickupCitiesApiClient.deletePickupCity(id);

          if (response.success) {
            // Remove from list
            const { pickupCities } = get();
            const updatedList = pickupCities.filter((city) => city.id !== id);

            set({
              pickupCities: updatedList,
              selectedPickupCity: null,
              isDeleting: false,
            });

            toast.success("Pickup city deleted successfully");

            // Refresh to get accurate pagination
            get().fetchPickupCities();

            return true;
          } else {
            throw new Error(
              response.error?.message || "Failed to delete pickup city"
            );
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "An unexpected error occurred";
          console.error("Error deleting pickup city:", error);
          set({ error: errorMessage, isDeleting: false });
          toast.error(`Failed to delete pickup city: ${errorMessage}`);
          return false;
        }
      },

      // Toggle pickup city status
      togglePickupCityStatus: async (id: string) => {
        try {
          const response = await pickupCitiesApiClient.togglePickupCityStatus(
            id
          );

          if (response.success && response.data) {
            const updatedPickupCity = response.data;

            // Update in list
            const { pickupCities } = get();
            const updatedList = pickupCities.map((city) =>
              city.id === id ? updatedPickupCity : city
            );

            set({
              pickupCities: updatedList,
              selectedPickupCity: updatedPickupCity,
            });

            const status = updatedPickupCity.status
              ? "activated"
              : "deactivated";
            toast.success(`Pickup city ${status} successfully`);

            return true;
          } else {
            throw new Error(
              response.error?.message || "Failed to toggle pickup city status"
            );
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "An unexpected error occurred";
          console.error("Error toggling pickup city status:", error);
          toast.error(`Failed to toggle status: ${errorMessage}`);
          return false;
        }
      },

      // Bulk delete pickup cities
      bulkDeletePickupCities: async (ids: string[]) => {
        set({ isDeleting: true, error: null });

        try {
          const response = await pickupCitiesApiClient.bulkDeletePickupCities(
            ids
          );

          if (response.success && response.data) {
            toast.success(
              `${response.data.successful} pickup cities deleted successfully`
            );

            if (response.data.failed.length > 0) {
              toast.warning(
                `${response.data.failed.length} pickup cities could not be deleted`
              );
            }

            // Clear selection and refresh
            set({ selectedIds: [], isDeleting: false });
            get().fetchPickupCities();

            return true;
          } else {
            throw new Error(
              response.error?.message || "Failed to delete pickup cities"
            );
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "An unexpected error occurred";
          console.error("Error bulk deleting pickup cities:", error);
          set({ error: errorMessage, isDeleting: false });
          toast.error(`Failed to delete pickup cities: ${errorMessage}`);
          return false;
        }
      },

      // Bulk toggle status
      bulkToggleStatus: async (ids: string[], status: boolean) => {
        try {
          const response = await pickupCitiesApiClient.bulkToggleStatus(
            ids,
            status
          );

          if (response.success && response.data) {
            const action = status ? "activated" : "deactivated";
            toast.success(
              `${response.data.successful} pickup cities ${action} successfully`
            );

            if (response.data.failed.length > 0) {
              toast.warning(
                `${response.data.failed.length} pickup cities could not be ${action}`
              );
            }

            // Clear selection and refresh
            set({ selectedIds: [] });
            get().fetchPickupCities();

            return true;
          } else {
            throw new Error(
              response.error?.message || "Failed to update pickup city status"
            );
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "An unexpected error occurred";
          console.error("Error bulk toggling pickup city status:", error);
          toast.error(`Failed to update status: ${errorMessage}`);
          return false;
        }
      },

      // Fetch statistics
      fetchStatistics: async () => {
        try {
          const response =
            await pickupCitiesApiClient.getPickupCityStatistics();

          if (response.success && response.data) {
            set({ statistics: response.data });
          } else {
            throw new Error(
              response.error?.message || "Failed to fetch statistics"
            );
          }
        } catch (error) {
          console.error("Error fetching pickup city statistics:", error);
        }
      },

      // Utility methods
      getPickupCityById: (id: string) => {
        const { pickupCities } = get();
        return pickupCities.find((city) => city.id === id);
      },

      resetState: () => {
        set({
          pickupCities: [],
          activePickupCities: [],
          selectedPickupCity: null,
          statistics: null,
          error: null,
          pagination: DEFAULT_PAGINATION,
          filters: DEFAULT_FILTERS,
          selectedIds: [],
          isLoading: false,
          isCreating: false,
          isUpdating: false,
          isDeleting: false,
        });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "pickup-cities-store",
      partialize: (state) => ({
        activePickupCities: state.activePickupCities,
        statistics: state.statistics,
        // Don't persist loading states or selections
      }),
      version: 1,
    }
  )
);
