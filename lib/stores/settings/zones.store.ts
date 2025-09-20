import { create } from "zustand";
import { persist } from "zustand/middleware";
import { zonesApiClient } from "@/lib/api/clients/settings/zones.client";
import { citiesApiClient } from "@/lib/api/clients/settings/cities.client";
import type {
  Zone,
  CreateZoneRequest,
  UpdateZoneRequest,
  ZoneFilters,
  ZoneStatistics,
  AvailableCity,
} from "@/lib/types/settings/zones.types";
import { toast } from "sonner";

interface ZonesState {
  // Data state
  zones: Zone[];
  activeZones: Zone[];
  currentZone: Zone | null;
  availableCities: AvailableCity[];
  statistics: ZoneStatistics | null;

  // UI state
  loading: boolean;
  error: string | null;
  filters: ZoneFilters;
  selectedZones: string[];

  // Pagination
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };

  // Actions
  setFilters: (filters: Partial<ZoneFilters>) => void;
  clearFilters: () => void;
  setSelectedZones: (zoneIds: string[]) => void;
  clearSelection: () => void;
  setError: (error: string | null) => void;
  clearError: () => void;

  // API actions
  fetchZones: (filters?: ZoneFilters) => Promise<void>;
  fetchActiveZones: () => Promise<void>;
  fetchZoneById: (id: string) => Promise<Zone | null>;
  fetchAvailableCities: () => Promise<void>;
  fetchStatistics: () => Promise<void>;

  // CRUD operations
  createZone: (data: CreateZoneRequest) => Promise<Zone | null>;
  updateZone: (id: string, data: UpdateZoneRequest) => Promise<Zone | null>;
  deleteZone: (id: string) => Promise<boolean>;
  toggleZoneStatus: (id: string) => Promise<boolean>;

  // Zone cities management
  addCitiesToZone: (zoneId: string, cityIds: string[]) => Promise<boolean>;
  removeCitiesFromZone: (zoneId: string, cityIds: string[]) => Promise<boolean>;

  // Bulk operations
  bulkDeleteZones: (zoneIds: string[]) => Promise<boolean>;
  bulkToggleStatus: (zoneIds: string[]) => Promise<boolean>;

  // Export
  exportZones: (filters?: ZoneFilters) => Promise<string | null>;

  // Utility methods
  getZoneById: (id: string) => Zone | undefined;
  getZonesByStatus: (status: boolean) => Zone[];
  getZonesCount: () => { total: number; active: number; inactive: number };
  refreshData: () => Promise<void>;
}

const DEFAULT_FILTERS: ZoneFilters = {
  page: 1,
  limit: 10,
  search: "",
  status: undefined,
};

const DEFAULT_PAGINATION = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
  hasNext: false,
  hasPrev: false,
};

export const useZonesStore = create<ZonesState>()(
  persist(
    (set, get) => ({
      // Initial state
      zones: [],
      activeZones: [],
      currentZone: null,
      availableCities: [],
      statistics: null,
      loading: false,
      error: null,
      filters: DEFAULT_FILTERS,
      selectedZones: [],
      pagination: DEFAULT_PAGINATION,

      // Filter and selection actions
      setFilters: (newFilters) => {
        const currentFilters = get().filters;
        const updatedFilters = { ...currentFilters, ...newFilters };

        // Reset page when filters change (except page itself)
        if (Object.keys(newFilters).some((key) => key !== "page")) {
          updatedFilters.page = 1;
        }

        set({ filters: updatedFilters });
        get().fetchZones(updatedFilters);
      },

      clearFilters: () => {
        set({ filters: DEFAULT_FILTERS });
        get().fetchZones(DEFAULT_FILTERS);
      },

      setSelectedZones: (zoneIds) => set({ selectedZones: zoneIds }),

      clearSelection: () => set({ selectedZones: [] }),

      setError: (error) => set({ error }),

      clearError: () => set({ error: null }),

      // Fetch zones with filters
      fetchZones: async (filters) => {
        set({ loading: true, error: null });

        try {
          const filtersToUse = filters || get().filters;
          const response = await zonesApiClient.getZones(filtersToUse);

          if (response.data) {
            set({
              zones: response.data[0].data,
              pagination: response.data[0].meta,
              loading: false,
            });
          } else {
            throw new Error(response.error?.message || "Failed to fetch zones");
          }
        } catch (error: any) {
          console.error("Error fetching zones:", error);
          set({
            error: error.message || "Failed to fetch zones",
            loading: false,
          });
          toast.error("Failed to fetch zones");
        }
      },

      // Fetch active zones only
      fetchActiveZones: async () => {
        try {
          const response = await zonesApiClient.getActiveZones();

          if (response.success && response.data) {
            set({ activeZones: response.data });
          }
        } catch (error: any) {
          console.error("Error fetching active zones:", error);
          toast.error("Failed to fetch active zones");
        }
      },

      // Fetch single zone
      fetchZoneById: async (id) => {
        set({ loading: true, error: null });

        try {
          const response = await zonesApiClient.getZoneById(id);

          if (response.success && response.data) {
            set({
              currentZone: response.data,
              loading: false,
            });
            return response.data;
          } else {
            throw new Error(response.error?.message || "Zone not found");
          }
        } catch (error: any) {
          console.error("Error fetching zone:", error);
          set({
            error: error.message || "Failed to fetch zone",
            loading: false,
            currentZone: null,
          });
          toast.error("Failed to fetch zone details");
          return null;
        }
      },

      // Fetch available cities for zone assignment
      fetchAvailableCities: async () => {
        try {
          const response = await citiesApiClient.getCities({
            page: 1,
            limit: 100,
            status: true,
          });

          if (response.success && response.data) {
            set({ availableCities: response.data.data });
          }
        } catch (error: any) {
          console.error("Error fetching available cities:", error);
          toast.error("Failed to fetch cities");
        }
      },

      // Fetch statistics
      fetchStatistics: async () => {
        try {
          const response = await zonesApiClient.getZoneStatistics();

          if (response.success && response.data) {
            set({ statistics: response.data });
          }
        } catch (error: any) {
          console.error("Error fetching zone statistics:", error);
        }
      },

      // Create zone
      createZone: async (data) => {
        set({ loading: true, error: null });

        try {
          const response = await zonesApiClient.createZone(data);

          if (response.success && response.data) {
            // Add to zones list
            const currentZones = get().zones;
            set({
              zones: [response.data, ...currentZones],
              loading: false,
            });

            // Update active zones if the new zone is active
            if (response.data.status) {
              get().fetchActiveZones();
            }

            // Update statistics
            get().fetchStatistics();

            toast.success("Zone created successfully");
            return response.data;
          } else {
            throw new Error(response.error?.message || "Failed to create zone");
          }
        } catch (error: any) {
          console.error("Error creating zone:", error);
          set({
            error: error.message || "Failed to create zone",
            loading: false,
          });
          toast.error(error.message || "Failed to create zone");
          return null;
        }
      },

      // Update zone
      updateZone: async (id, data) => {
        set({ loading: true, error: null });

        try {
          const response = await zonesApiClient.updateZone(id, data);

          if (response.success && response.data) {
            // Update in zones list
            const currentZones = get().zones;
            const updatedZones = currentZones.map((zone) =>
              zone.id === id ? response.data : zone
            );

            set({
              zones: updatedZones,
              currentZone: response.data,
              loading: false,
            });

            // Refresh active zones
            get().fetchActiveZones();

            // Update statistics
            get().fetchStatistics();

            toast.success("Zone updated successfully");
            return response.data;
          } else {
            throw new Error(response.error?.message || "Failed to update zone");
          }
        } catch (error: any) {
          console.error("Error updating zone:", error);
          set({
            error: error.message || "Failed to update zone",
            loading: false,
          });
          toast.error(error.message || "Failed to update zone");
          return null;
        }
      },

      // Delete zone
      deleteZone: async (id) => {
        try {
          const response = await zonesApiClient.deleteZone(id);

          if (response.success) {
            // Remove from zones list
            const currentZones = get().zones;
            const updatedZones = currentZones.filter((zone) => zone.id !== id);

            set({
              zones: updatedZones,
              currentZone: null,
            });

            // Update selected zones if needed
            const selectedZones = get().selectedZones;
            if (selectedZones.includes(id)) {
              set({
                selectedZones: selectedZones.filter((zoneId) => zoneId !== id),
              });
            }

            // Refresh active zones and statistics
            get().fetchActiveZones();
            get().fetchStatistics();

            toast.success("Zone deleted successfully");
            return true;
          } else {
            throw new Error(response.error?.message || "Failed to delete zone");
          }
        } catch (error: any) {
          console.error("Error deleting zone:", error);
          toast.error(error.message || "Failed to delete zone");
          return false;
        }
      },

      // Toggle zone status
      toggleZoneStatus: async (id) => {
        try {
          const response = await zonesApiClient.toggleZoneStatus(id);

          if (response.success && response.data) {
            // Update in zones list
            const currentZones = get().zones;
            const updatedZones = currentZones.map((zone) =>
              zone.id === id ? response.data : zone
            );

            set({ zones: updatedZones });

            // Refresh active zones
            get().fetchActiveZones();

            toast.success(
              `Zone ${
                response.data.status ? "activated" : "deactivated"
              } successfully`
            );
            return true;
          } else {
            throw new Error(
              response.error?.message || "Failed to toggle zone status"
            );
          }
        } catch (error: any) {
          console.error("Error toggling zone status:", error);
          toast.error(error.message || "Failed to toggle zone status");
          return false;
        }
      },

      // Add cities to zone
      addCitiesToZone: async (zoneId, cityIds) => {
        try {
          const response = await zonesApiClient.addCitiesToZone(
            zoneId,
            cityIds
          );

          if (response.success && response.data) {
            // Update current zone if it matches
            const currentZone = get().currentZone;
            if (currentZone?.id === zoneId) {
              set({ currentZone: response.data });
            }

            toast.success("Cities added to zone successfully");
            return true;
          } else {
            throw new Error(
              response.error?.message || "Failed to add cities to zone"
            );
          }
        } catch (error: any) {
          console.error("Error adding cities to zone:", error);
          toast.error(error.message || "Failed to add cities to zone");
          return false;
        }
      },

      // Remove cities from zone
      removeCitiesFromZone: async (zoneId, cityIds) => {
        try {
          const response = await zonesApiClient.removeCitiesFromZone(
            zoneId,
            cityIds
          );

          if (response.success && response.data) {
            // Update current zone if it matches
            const currentZone = get().currentZone;
            if (currentZone?.id === zoneId) {
              set({ currentZone: response.data });
            }

            toast.success("Cities removed from zone successfully");
            return true;
          } else {
            throw new Error(
              response.error?.message || "Failed to remove cities from zone"
            );
          }
        } catch (error: any) {
          console.error("Error removing cities from zone:", error);
          toast.error(error.message || "Failed to remove cities from zone");
          return false;
        }
      },

      // Bulk delete zones
      bulkDeleteZones: async (zoneIds) => {
        try {
          const response = await zonesApiClient.bulkDeleteZones(zoneIds);

          if (response.success) {
            // Remove deleted zones from list
            const currentZones = get().zones;
            const remainingZones = currentZones.filter(
              (zone) => !zoneIds.includes(zone.id)
            );

            set({
              zones: remainingZones,
              selectedZones: [],
            });

            // Refresh data
            get().fetchActiveZones();
            get().fetchStatistics();

            toast.success(
              `Successfully deleted ${
                response.data?.successful || zoneIds.length
              } zone(s)`
            );

            if (response.data?.failed && response.data.failed.length > 0) {
              toast.warning(
                `Failed to delete ${response.data.failed.length} zone(s)`
              );
            }

            return true;
          } else {
            throw new Error(
              response.error?.message || "Failed to delete zones"
            );
          }
        } catch (error: any) {
          console.error("Error bulk deleting zones:", error);
          toast.error(error.message || "Failed to delete zones");
          return false;
        }
      },

      // Bulk toggle status
      bulkToggleStatus: async (zoneIds) => {
        try {
          const response = await zonesApiClient.bulkToggleStatus(zoneIds);

          if (response.success) {
            // Refresh zones to get updated statuses
            await get().fetchZones();

            set({ selectedZones: [] });

            toast.success(
              `Successfully updated ${
                response.data?.successful || zoneIds.length
              } zone(s)`
            );

            if (response.data?.failed && response.data.failed.length > 0) {
              toast.warning(
                `Failed to update ${response.data.failed.length} zone(s)`
              );
            }

            return true;
          } else {
            throw new Error(
              response.error?.message || "Failed to update zones"
            );
          }
        } catch (error: any) {
          console.error("Error bulk toggling zone status:", error);
          toast.error(error.message || "Failed to update zones");
          return false;
        }
      },

      // Export zones
      exportZones: async (filters) => {
        try {
          const filtersToUse = filters || get().filters;
          const response = await zonesApiClient.exportZones(filtersToUse);

          if (response.success && response.data) {
            toast.success("Export completed successfully");
            return response.data.downloadUrl;
          } else {
            throw new Error(
              response.error?.message || "Failed to export zones"
            );
          }
        } catch (error: any) {
          console.error("Error exporting zones:", error);
          toast.error(error.message || "Failed to export zones");
          return null;
        }
      },

      // Utility methods
      getZoneById: (id) => {
        return get().zones.find((zone) => zone.id === id);
      },

      getZonesByStatus: (status) => {
        return get().zones.filter((zone) => zone.status === status);
      },

      getZonesCount: () => {
        const zones = get().zones;
        return {
          total: zones.length,
          active: zones.filter((zone) => zone.status).length,
          inactive: zones.filter((zone) => !zone.status).length,
        };
      },

      // Refresh all data
      refreshData: async () => {
        const promises = [
          get().fetchZones(),
          get().fetchActiveZones(),
          get().fetchStatistics(),
          get().fetchAvailableCities(),
        ];

        await Promise.allSettled(promises);
      },
    }),
    {
      name: "zones-store",
      partialize: (state) => ({
        filters: state.filters,
        selectedZones: state.selectedZones,
      }),
      version: 1,
    }
  )
);
