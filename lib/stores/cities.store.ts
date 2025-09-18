import { create } from "zustand";
import { persist } from "zustand/middleware";
import { citiesApiClient } from "@/lib/api/clients/cities.client";
import type {
  City,
  CreateCityRequest,
  UpdateCityRequest,
  CityFilters,
  CitiesResponse,
  ZoneStats,
  CityStatistics,
  BulkCityAction,
  BulkActionResult,
} from "@/lib/types/settings/cities.types";

interface CitiesState {
  // Data State
  cities: City[];
  currentCity: City | null;
  pickupCities: City[];
  zoneStats: ZoneStats[];
  statistics: CityStatistics | null;
  availableZones: string[];

  // Pagination & Filtering
  filters: CityFilters;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };

  // UI State
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isBulkProcessing: boolean;
  error: string | null;
  lastFetch: number | null;

  // Selection State
  selectedCityIds: string[];

  // Actions - CRUD
  fetchCities: (filters?: CityFilters) => Promise<void>;
  fetchCityById: (id: string) => Promise<City | null>;
  createCity: (data: CreateCityRequest) => Promise<City | null>;
  updateCity: (id: string, data: UpdateCityRequest) => Promise<City | null>;
  deleteCity: (id: string) => Promise<boolean>;
  toggleCityStatus: (id: string) => Promise<City | null>;

  // Actions - Specialized
  fetchPickupCities: () => Promise<void>;
  fetchZoneStats: () => Promise<void>;
  fetchStatistics: () => Promise<void>;
  fetchAvailableZones: () => Promise<void>;

  // Actions - Bulk Operations
  bulkUpdateCities: (
    action: BulkCityAction
  ) => Promise<BulkActionResult | null>;
  bulkDeleteCities: (cityIds: string[]) => Promise<boolean>;
  bulkToggleStatus: (cityIds: string[], status: boolean) => Promise<boolean>;

  // Actions - Search & Filter
  searchCities: (query: string) => Promise<City[]>;
  getCitiesByZone: (zone: string) => Promise<City[]>;

  // Actions - Selection
  selectCity: (id: string) => void;
  deselectCity: (id: string) => void;
  selectAllCities: () => void;
  clearSelection: () => void;
  toggleCitySelection: (id: string) => void;

  // Actions - Filters & Pagination
  setFilters: (filters: Partial<CityFilters>) => void;
  clearFilters: () => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;

  // Actions - Utility
  clearError: () => void;
  setError: (error: string) => void;
  refresh: () => Promise<void>;
  setCurrentCity: (city: City | null) => void;
}

const DEFAULT_FILTERS: CityFilters = {
  page: 1,
  limit: 10,
  search: "",
  sortBy: "name",
  sortOrder: "asc",
};

export const useCitiesStore = create<CitiesState>()(
  persist(
    (set, get) => ({
      // Initial State
      cities: [],
      currentCity: null,
      pickupCities: [],
      zoneStats: [],
      statistics: null,
      availableZones: [],

      filters: DEFAULT_FILTERS,
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      },

      isLoading: false,
      isCreating: false,
      isUpdating: false,
      isDeleting: false,
      isBulkProcessing: false,
      error: null,
      lastFetch: null,

      selectedCityIds: [],

      // ========================================
      // CRUD ACTIONS
      // ========================================

      fetchCities: async (filters?: CityFilters) => {
        const state = get();
        const currentFilters = { ...state.filters, ...filters };

        // Check cache (5 minutes)
        const now = Date.now();
        if (
          state.cities.length > 0 &&
          state.lastFetch &&
          now - state.lastFetch < 5 * 60 * 1000 &&
          JSON.stringify(currentFilters) === JSON.stringify(state.filters)
        ) {
          return;
        }

        set({ isLoading: true, error: null, filters: currentFilters });

        try {
          const result = await citiesApiClient.getCities(currentFilters);

          if (result.success && result.data) {
            set({
              cities: result.data.data,
              pagination: result.data.meta,
              isLoading: false,
              error: null,
              lastFetch: now,
            });
          } else {
            set({
              error: result.error?.message || "Failed to fetch cities",
              isLoading: false,
            });
          }
        } catch (error: any) {
          console.error("Fetch cities failed:", error);
          set({
            error: error.message || "Network error occurred",
            isLoading: false,
          });
        }
      },

      fetchCityById: async (id: string) => {
        set({ isLoading: true, error: null });

        try {
          const result = await citiesApiClient.getCityById(id);

          if (result.success && result.data) {
            set({
              currentCity: result.data,
              isLoading: false,
              error: null,
            });
            return result.data;
          } else {
            set({
              error: result.error?.message || "Failed to fetch city",
              isLoading: false,
            });
            return null;
          }
        } catch (error: any) {
          console.error("Fetch city failed:", error);
          set({
            error: error.message || "Network error occurred",
            isLoading: false,
          });
          return null;
        }
      },

      createCity: async (data: CreateCityRequest) => {
        set({ isCreating: true, error: null });

        try {
          const result = await citiesApiClient.createCity(data);

          if (result.success && result.data) {
            // Add to cities list
            const state = get();
            set({
              cities: [result.data, ...state.cities],
              isCreating: false,
              error: null,
              lastFetch: null, // Force refresh on next fetch
            });

            // Update statistics
            get().fetchStatistics();
            get().fetchZoneStats();

            return result.data;
          } else {
            set({
              error: result.error?.message || "Failed to create city",
              isCreating: false,
            });
            return null;
          }
        } catch (error: any) {
          console.error("Create city failed:", error);
          set({
            error: error.message || "Network error occurred",
            isCreating: false,
          });
          return null;
        }
      },

      updateCity: async (id: string, data: UpdateCityRequest) => {
        set({ isUpdating: true, error: null });

        try {
          const result = await citiesApiClient.updateCity(id, data);

          if (result.success && result.data) {
            const state = get();

            // Update in cities list
            const updatedCities = state.cities.map((city) =>
              city.id === id ? result.data! : city
            );

            set({
              cities: updatedCities,
              currentCity:
                state.currentCity?.id === id ? result.data : state.currentCity,
              isUpdating: false,
              error: null,
            });

            // Update statistics
            get().fetchStatistics();
            get().fetchZoneStats();

            return result.data;
          } else {
            set({
              error: result.error?.message || "Failed to update city",
              isUpdating: false,
            });
            return null;
          }
        } catch (error: any) {
          console.error("Update city failed:", error);
          set({
            error: error.message || "Network error occurred",
            isUpdating: false,
          });
          return null;
        }
      },

      deleteCity: async (id: string) => {
        set({ isDeleting: true, error: null });

        try {
          const result = await citiesApiClient.deleteCity(id);

          if (result.success) {
            const state = get();

            // Remove from cities list
            const updatedCities = state.cities.filter((city) => city.id !== id);

            set({
              cities: updatedCities,
              currentCity:
                state.currentCity?.id === id ? null : state.currentCity,
              selectedCityIds: state.selectedCityIds.filter(
                (cityId) => cityId !== id
              ),
              isDeleting: false,
              error: null,
            });

            // Update statistics
            get().fetchStatistics();
            get().fetchZoneStats();

            return true;
          } else {
            set({
              error: result.error?.message || "Failed to delete city",
              isDeleting: false,
            });
            return false;
          }
        } catch (error: any) {
          console.error("Delete city failed:", error);
          set({
            error: error.message || "Network error occurred",
            isDeleting: false,
          });
          return false;
        }
      },

      toggleCityStatus: async (id: string) => {
        set({ isUpdating: true, error: null });

        try {
          const result = await citiesApiClient.toggleCityStatus(id);

          if (result.success && result.data) {
            const state = get();

            // Update in cities list
            const updatedCities = state.cities.map((city) =>
              city.id === id ? result.data! : city
            );

            set({
              cities: updatedCities,
              currentCity:
                state.currentCity?.id === id ? result.data : state.currentCity,
              isUpdating: false,
              error: null,
            });

            return result.data;
          } else {
            set({
              error: result.error?.message || "Failed to toggle city status",
              isUpdating: false,
            });
            return null;
          }
        } catch (error: any) {
          console.error("Toggle city status failed:", error);
          set({
            error: error.message || "Network error occurred",
            isUpdating: false,
          });
          return null;
        }
      },

      // ========================================
      // SPECIALIZED ACTIONS
      // ========================================

      fetchPickupCities: async () => {
        try {
          const result = await citiesApiClient.getPickupCities();

          if (result.success && result.data) {
            set({ pickupCities: result.data });
          }
        } catch (error: any) {
          console.error("Fetch pickup cities failed:", error);
        }
      },

      fetchZoneStats: async () => {
        try {
          const result = await citiesApiClient.getZoneStats();

          if (result.success && result.data) {
            set({ zoneStats: result.data });
          }
        } catch (error: any) {
          console.error("Fetch zone stats failed:", error);
        }
      },

      fetchStatistics: async () => {
        try {
          const result = await citiesApiClient.getCityStatistics();

          if (result.success && result.data) {
            set({ statistics: result.data });
          }
        } catch (error: any) {
          console.error("Fetch statistics failed:", error);
        }
      },

      fetchAvailableZones: async () => {
        try {
          const result = await citiesApiClient.getAvailableZones();

          if (result.success && result.data) {
            set({ availableZones: result.data });
          }
        } catch (error: any) {
          console.error("Fetch available zones failed:", error);
        }
      },

      // ========================================
      // BULK ACTIONS
      // ========================================

      bulkUpdateCities: async (action: BulkCityAction) => {
        set({ isBulkProcessing: true, error: null });

        try {
          const result = await citiesApiClient.bulkUpdateCities(action);

          if (result.success && result.data) {
            set({ isBulkProcessing: false });

            // Refresh data
            await get().fetchCities();
            get().fetchStatistics();
            get().fetchZoneStats();

            return result.data;
          } else {
            set({
              error:
                result.error?.message || "Failed to perform bulk operation",
              isBulkProcessing: false,
            });
            return null;
          }
        } catch (error: any) {
          console.error("Bulk update failed:", error);
          set({
            error: error.message || "Network error occurred",
            isBulkProcessing: false,
          });
          return null;
        }
      },

      bulkDeleteCities: async (cityIds: string[]) => {
        set({ isBulkProcessing: true, error: null });

        try {
          const result = await citiesApiClient.bulkDeleteCities(cityIds);

          if (result.success) {
            const state = get();

            // Remove from cities list
            const updatedCities = state.cities.filter(
              (city) => !cityIds.includes(city.id)
            );

            set({
              cities: updatedCities,
              selectedCityIds: [],
              isBulkProcessing: false,
              error: null,
            });

            get().fetchStatistics();
            get().fetchZoneStats();

            return true;
          } else {
            set({
              error: result.error?.message || "Failed to delete cities",
              isBulkProcessing: false,
            });
            return false;
          }
        } catch (error: any) {
          console.error("Bulk delete failed:", error);
          set({
            error: error.message || "Network error occurred",
            isBulkProcessing: false,
          });
          return false;
        }
      },

      bulkToggleStatus: async (cityIds: string[], status: boolean) => {
        set({ isBulkProcessing: true, error: null });

        try {
          const result = await citiesApiClient.bulkToggleStatus(
            cityIds,
            status
          );

          if (result.success) {
            set({ isBulkProcessing: false });

            // Refresh data
            await get().fetchCities();

            return true;
          } else {
            set({
              error: result.error?.message || "Failed to toggle status",
              isBulkProcessing: false,
            });
            return false;
          }
        } catch (error: any) {
          console.error("Bulk toggle status failed:", error);
          set({
            error: error.message || "Network error occurred",
            isBulkProcessing: false,
          });
          return false;
        }
      },

      // ========================================
      // SEARCH & FILTER ACTIONS
      // ========================================

      searchCities: async (query: string) => {
        try {
          const result = await citiesApiClient.searchCities(query);

          if (result.success && result.data) {
            return result.data;
          }
          return [];
        } catch (error: any) {
          console.error("Search cities failed:", error);
          return [];
        }
      },

      getCitiesByZone: async (zone: string) => {
        try {
          const result = await citiesApiClient.getCitiesByZone(zone);

          if (result.success && result.data) {
            return result.data;
          }
          return [];
        } catch (error: any) {
          console.error("Get cities by zone failed:", error);
          return [];
        }
      },

      // ========================================
      // SELECTION ACTIONS
      // ========================================

      selectCity: (id: string) => {
        const state = get();
        if (!state.selectedCityIds.includes(id)) {
          set({ selectedCityIds: [...state.selectedCityIds, id] });
        }
      },

      deselectCity: (id: string) => {
        const state = get();
        set({
          selectedCityIds: state.selectedCityIds.filter(
            (cityId) => cityId !== id
          ),
        });
      },

      selectAllCities: () => {
        const state = get();
        set({ selectedCityIds: state.cities.map((city) => city.id) });
      },

      clearSelection: () => {
        set({ selectedCityIds: [] });
      },

      toggleCitySelection: (id: string) => {
        const state = get();
        if (state.selectedCityIds.includes(id)) {
          get().deselectCity(id);
        } else {
          get().selectCity(id);
        }
      },

      // ========================================
      // FILTER & PAGINATION ACTIONS
      // ========================================

      setFilters: (filters: Partial<CityFilters>) => {
        const state = get();
        const newFilters = { ...state.filters, ...filters };
        set({ filters: newFilters, lastFetch: null });
        get().fetchCities(newFilters);
      },

      clearFilters: () => {
        set({ filters: DEFAULT_FILTERS, lastFetch: null });
        get().fetchCities(DEFAULT_FILTERS);
      },

      setPage: (page: number) => {
        get().setFilters({ page });
      },

      setPageSize: (limit: number) => {
        get().setFilters({ limit, page: 1 });
      },

      // ========================================
      // UTILITY ACTIONS
      // ========================================

      clearError: () => set({ error: null }),

      setError: (error: string) => set({ error }),

      setCurrentCity: (city: City | null) => set({ currentCity: city }),

      refresh: async () => {
        set({ lastFetch: null });
        await Promise.all([
          get().fetchCities(),
          get().fetchPickupCities(),
          get().fetchZoneStats(),
          get().fetchStatistics(),
          get().fetchAvailableZones(),
        ]);
      },
    }),
    {
      name: "cities-store",
      partialize: (state) => ({
        filters: state.filters,
        selectedCityIds: state.selectedCityIds,
        availableZones: state.availableZones,
      }),
      version: 1,
    }
  )
);
