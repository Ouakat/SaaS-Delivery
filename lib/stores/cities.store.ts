import { create } from "zustand";
import { persist } from "zustand/middleware";
import { citiesApiClient } from "@/lib/api/clients/cities.client";
import type {
  City,
  CreateCityRequest,
  UpdateCityRequest,
  CitiesFilters,
  ZoneStats,
} from "@/lib/types/settings/cities.types";
import { toast } from "sonner";

interface CitiesState {
  // Core state
  cities: City[];
  currentCity: City | null;
  isLoading: boolean;
  error: string | null;

  // Pagination
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };

  // Filters
  filters: CitiesFilters;

  // Additional data
  pickupCities: City[];
  zoneStats: ZoneStats[];
  availableZones: string[];

  // Selection for bulk operations
  selectedCityIds: string[];

  // Actions
  setCities: (cities: City[]) => void;
  setCurrentCity: (city: City | null) => void;
  setPagination: (pagination: Partial<CitiesState["pagination"]>) => void;
  setFilters: (filters: Partial<CitiesFilters>) => void;
  clearError: () => void;
  setSelectedCityIds: (ids: string[]) => void;

  // API Actions
  fetchCities: () => Promise<void>;
  fetchCityById: (id: string) => Promise<City | null>;
  createCity: (data: CreateCityRequest) => Promise<boolean>;
  updateCity: (id: string, data: UpdateCityRequest) => Promise<boolean>;
  deleteCity: (id: string) => Promise<boolean>;
  toggleCityStatus: (id: string) => Promise<boolean>;
  fetchPickupCities: () => Promise<void>;
  fetchZoneStats: () => Promise<void>;
  fetchAvailableZones: () => Promise<void>;

  // Bulk operations
  bulkDeleteCities: (ids: string[]) => Promise<boolean>;
  bulkUpdateStatus: (ids: string[], status: boolean) => Promise<boolean>;

  // Search and validation
  searchCities: (query: string) => Promise<City[]>;
  validateCityRef: (ref: string, excludeId?: string) => Promise<boolean>;

  // Reset state
  resetState: () => void;
}

const initialState = {
  cities: [],
  currentCity: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  },
  filters: {
    page: 1,
    limit: 10,
  },
  pickupCities: [],
  zoneStats: [],
  availableZones: [],
  selectedCityIds: [],
};

export const useCitiesStore = create<CitiesState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Setters
      setCities: (cities) => set({ cities }),

      setCurrentCity: (city) => set({ currentCity: city }),

      setPagination: (pagination) =>
        set((state) => ({
          pagination: { ...state.pagination, ...pagination },
        })),

      setFilters: (filters) => {
        set((state) => {
          const newFilters = { ...state.filters, ...filters };
          // Reset to page 1 when filters change (except page change)
          if (filters.page === undefined) {
            newFilters.page = 1;
          }
          return { filters: newFilters };
        });
        // Auto-fetch when filters change
        get().fetchCities();
      },

      clearError: () => set({ error: null }),

      setSelectedCityIds: (ids) => set({ selectedCityIds: ids }),

      // Fetch cities with current filters
      fetchCities: async () => {
        set({ isLoading: true, error: null });

        try {
          const { filters } = get();
          const response = await citiesApiClient.getCities(filters);

          if (response.success && response.data) {
            set({
              cities: response.data.data,
              pagination: response.data.meta,
              isLoading: false,
            });
          } else {
            throw new Error(
              response.error?.message || "Failed to fetch cities"
            );
          }
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || "An error occurred while fetching cities",
          });
          toast.error("Failed to fetch cities");
        }
      },

      // Fetch single city by ID
      fetchCityById: async (id: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await citiesApiClient.getCityById(id);

          if (response.success && response.data) {
            set({ currentCity: response.data, isLoading: false });
            return response.data;
          } else {
            throw new Error(response.error?.message || "City not found");
          }
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || "Failed to fetch city",
          });
          toast.error("Failed to fetch city details");
          return null;
        }
      },

      // Create new city
      createCity: async (data: CreateCityRequest) => {
        set({ isLoading: true, error: null });

        try {
          const response = await citiesApiClient.createCity(data);

          if (response.success && response.data) {
            // Add to local state
            set((state) => ({
              cities: [response.data!, ...state.cities],
              isLoading: false,
            }));

            toast.success("City created successfully");
            return true;
          } else {
            throw new Error(response.error?.message || "Failed to create city");
          }
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || "Failed to create city",
          });
          toast.error(error.message || "Failed to create city");
          return false;
        }
      },

      // Update city
      updateCity: async (id: string, data: UpdateCityRequest) => {
        set({ isLoading: true, error: null });

        try {
          const response = await citiesApiClient.updateCity(id, data);

          if (response.success && response.data) {
            // Update in local state
            set((state) => ({
              cities: state.cities.map((city) =>
                city.id === id ? response.data! : city
              ),
              currentCity:
                state.currentCity?.id === id
                  ? response.data!
                  : state.currentCity,
              isLoading: false,
            }));

            toast.success("City updated successfully");
            return true;
          } else {
            throw new Error(response.error?.message || "Failed to update city");
          }
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || "Failed to update city",
          });
          toast.error(error.message || "Failed to update city");
          return false;
        }
      },

      // Delete city
      deleteCity: async (id: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await citiesApiClient.deleteCity(id);

          if (response.success) {
            // Remove from local state
            set((state) => ({
              cities: state.cities.filter((city) => city.id !== id),
              currentCity:
                state.currentCity?.id === id ? null : state.currentCity,
              isLoading: false,
            }));

            toast.success("City deleted successfully");
            return true;
          } else {
            throw new Error(response.error?.message || "Failed to delete city");
          }
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || "Failed to delete city",
          });
          toast.error(error.message || "Failed to delete city");
          return false;
        }
      },

      // Toggle city status
      toggleCityStatus: async (id: string) => {
        try {
          const response = await citiesApiClient.toggleCityStatus(id);

          if (response.success && response.data) {
            // Update in local state
            set((state) => ({
              cities: state.cities.map((city) =>
                city.id === id ? response.data! : city
              ),
              currentCity:
                state.currentCity?.id === id
                  ? response.data!
                  : state.currentCity,
            }));

            const status = response.data.status ? "activated" : "deactivated";
            toast.success(`City ${status} successfully`);
            return true;
          } else {
            throw new Error(
              response.error?.message || "Failed to toggle city status"
            );
          }
        } catch (error: any) {
          toast.error(error.message || "Failed to toggle city status");
          return false;
        }
      },

      // Fetch pickup cities
      fetchPickupCities: async () => {
        try {
          const response = await citiesApiClient.getPickupCities();

          if (response.success && response.data) {
            set({ pickupCities: response.data });
          }
        } catch (error: any) {
          console.error("Failed to fetch pickup cities:", error);
        }
      },

      // Fetch zone statistics
      fetchZoneStats: async () => {
        try {
          const response = await citiesApiClient.getZoneStats();

          if (response.success && response.data) {
            set({ zoneStats: response.data });
          }
        } catch (error: any) {
          console.error("Failed to fetch zone stats:", error);
        }
      },

      // Fetch available zones
      fetchAvailableZones: async () => {
        try {
          const response = await citiesApiClient.getAvailableZones();

          if (response.success && response.data) {
            set({ availableZones: response.data });
          }
        } catch (error: any) {
          console.error("Failed to fetch available zones:", error);
        }
      },

      // Bulk delete cities
      bulkDeleteCities: async (ids: string[]) => {
        set({ isLoading: true, error: null });

        try {
          const response = await citiesApiClient.bulkDeleteCities(ids);

          if (response.success) {
            // Remove from local state
            set((state) => ({
              cities: state.cities.filter((city) => !ids.includes(city.id)),
              selectedCityIds: [],
              isLoading: false,
            }));

            toast.success(
              `${
                response.data?.deleted || ids.length
              } cities deleted successfully`
            );
            return true;
          } else {
            throw new Error(
              response.error?.message || "Failed to delete cities"
            );
          }
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || "Failed to delete cities",
          });
          toast.error(error.message || "Failed to delete cities");
          return false;
        }
      },

      // Bulk update status
      bulkUpdateStatus: async (ids: string[], status: boolean) => {
        set({ isLoading: true, error: null });

        try {
          const response = await citiesApiClient.bulkUpdateCitiesStatus(
            ids,
            status
          );

          if (response.success) {
            // Update in local state
            set((state) => ({
              cities: state.cities.map((city) =>
                ids.includes(city.id) ? { ...city, status } : city
              ),
              selectedCityIds: [],
              isLoading: false,
            }));

            const action = status ? "activated" : "deactivated";
            toast.success(
              `${
                response.data?.updated || ids.length
              } cities ${action} successfully`
            );
            return true;
          } else {
            throw new Error(
              response.error?.message || "Failed to update cities"
            );
          }
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || "Failed to update cities",
          });
          toast.error(error.message || "Failed to update cities");
          return false;
        }
      },

      // Search cities
      searchCities: async (query: string) => {
        try {
          const response = await citiesApiClient.searchCities(query);

          if (response.success && response.data) {
            return response.data;
          }
          return [];
        } catch (error) {
          console.error("Failed to search cities:", error);
          return [];
        }
      },

      // Validate city reference
      validateCityRef: async (ref: string, excludeId?: string) => {
        try {
          const response = await citiesApiClient.validateCityRef(
            ref,
            excludeId
          );

          if (response.success && response.data) {
            return response.data.isUnique;
          }
          return false;
        } catch (error) {
          console.error("Failed to validate city reference:", error);
          return false;
        }
      },

      // Reset state
      resetState: () => set(initialState),
    }),
    {
      name: "cities-store",
      partialize: (state) => ({
        filters: state.filters,
        pagination: state.pagination,
      }),
      version: 1,
    }
  )
);
