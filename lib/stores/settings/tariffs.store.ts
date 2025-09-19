import { create } from "zustand";
import { tariffsApiClient } from "@/lib/api/clients/settings/tariffs.client";
import type {
  Tariff,
  CreateTariffRequest,
  UpdateTariffRequest,
  TariffFilters,
  TariffCalculationRequest,
  TariffCalculationResult,
  BulkTariffImportRequest,
  BulkImportResult,
} from "@/lib/types/settings/tariffs.types";
import { toast } from "sonner";

interface TariffState {
  // State
  tariffs: Tariff[];
  currentTariff: Tariff | null;
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
  filters: TariffFilters;

  // Stats
  stats: {
    totalTariffs: number;
    averageDeliveryPrice: number;
    averageReturnPrice: number;
    averageRefusalPrice: number;
    averageDeliveryDelay: number;
    priceRanges: { range: string; count: number }[];
    delayDistribution: { delay: number; count: number }[];
    cityPairCoverage: {
      totalPossiblePairs: number;
      configuredPairs: number;
      coveragePercentage: number;
    };
  } | null;

  // Missing tariffs
  missingTariffs: Array<{
    pickupCity: { id: string; name: string; ref: string };
    destinationCity: { id: string; name: string; ref: string };
  }>;

  // Calculation result
  calculationResult: TariffCalculationResult | null;

  // Actions
  fetchTariffs: () => Promise<void>;
  fetchTariffById: (id: string) => Promise<void>;
  createTariff: (data: CreateTariffRequest) => Promise<boolean>;
  updateTariff: (id: string, data: UpdateTariffRequest) => Promise<boolean>;
  deleteTariff: (id: string) => Promise<boolean>;
  bulkImportTariffs: (
    data: BulkTariffImportRequest
  ) => Promise<BulkImportResult | null>;
  calculateTariff: (data: TariffCalculationRequest) => Promise<boolean>;
  fetchStats: () => Promise<void>;
  fetchMissingTariffs: () => Promise<void>;
  validateRoute: (
    pickupCityId: string,
    destinationCityId: string,
    excludeId?: string
  ) => Promise<boolean>;
  duplicateTariff: (
    id: string,
    pickupCityId: string,
    destinationCityId: string
  ) => Promise<boolean>;

  // Filter actions
  setFilters: (filters: Partial<TariffFilters>) => void;
  resetFilters: () => void;

  // Utility actions
  setCurrentTariff: (tariff: Tariff | null) => void;
  clearError: () => void;
  clearCalculationResult: () => void;
}

const initialFilters: TariffFilters = {
  page: 1,
  limit: 10,
  search: "",
};

export const useTariffsStore = create<TariffState>((set, get) => ({
  // Initial state
  tariffs: [],
  currentTariff: null,
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
  filters: initialFilters,
  stats: null,
  missingTariffs: [],
  calculationResult: null,

  // Fetch tariffs with filters
  fetchTariffs: async () => {
    const { filters } = get();
    set({ isLoading: true, error: null });

    try {
      const result = await tariffsApiClient.getTariffs(filters);

      if (result.data) {
        set({
          tariffs: result.data,
          pagination: result.pagination,
          isLoading: false,
        });
      } else {
        throw new Error("Failed to fetch tariffs");
      }
    } catch (error: any) {
      console.error("Error fetching tariffs:", error);
      set({
        error: error?.message || "Failed to fetch tariffs",
        isLoading: false,
      });
      toast.error("Failed to fetch tariffs");
    }
  },

  // Fetch single tariff
  fetchTariffById: async (id: string) => {
    set({ isLoading: true, error: null });

    try {
      const result = await tariffsApiClient.getTariffById(id);

      if (result.success && result.data) {
        set({
          currentTariff: result.data,
          isLoading: false,
        });
      } else {
        throw new Error(result.error?.message || "Failed to fetch tariff");
      }
    } catch (error: any) {
      console.error("Error fetching tariff:", error);
      set({
        error: error?.message || "Failed to fetch tariff",
        isLoading: false,
      });
      toast.error("Failed to fetch tariff details");
    }
  },

  // Create tariff
  createTariff: async (data: CreateTariffRequest) => {
    set({ isLoading: true, error: null });

    try {
      const result = await tariffsApiClient.createTariff(data);

      if (result.success && result.data) {
        // Refresh the list
        await get().fetchTariffs();
        set({ isLoading: false });
        toast.success("Tariff created successfully");
        return true;
      } else {
        throw new Error(result.error?.message || "Failed to create tariff");
      }
    } catch (error: any) {
      console.error("Error creating tariff:", error);
      const errorMessage = error?.message || "Failed to create tariff";
      set({
        error: errorMessage,
        isLoading: false,
      });
      toast.error(errorMessage);
      return false;
    }
  },

  // Update tariff
  updateTariff: async (id: string, data: UpdateTariffRequest) => {
    set({ isLoading: true, error: null });

    try {
      const result = await tariffsApiClient.updateTariff(id, data);

      if (result.success && result.data) {
        const { tariffs, currentTariff } = get();

        // Update in list
        const updatedTariffs = tariffs.map((tariff) =>
          tariff.id === id ? result.data! : tariff
        );

        set({
          tariffs: updatedTariffs,
          currentTariff:
            currentTariff?.id === id ? result.data! : currentTariff,
          isLoading: false,
        });

        toast.success("Tariff updated successfully");
        return true;
      } else {
        throw new Error(result.error?.message || "Failed to update tariff");
      }
    } catch (error: any) {
      console.error("Error updating tariff:", error);
      const errorMessage = error?.message || "Failed to update tariff";
      set({
        error: errorMessage,
        isLoading: false,
      });
      toast.error(errorMessage);
      return false;
    }
  },

  // Delete tariff
  deleteTariff: async (id: string) => {
    set({ isLoading: true, error: null });

    try {
      const result = await tariffsApiClient.deleteTariff(id);

      if (result.success) {
        const { tariffs, currentTariff } = get();

        // Remove from list
        const updatedTariffs = tariffs.filter((tariff) => tariff.id !== id);

        set({
          tariffs: updatedTariffs,
          currentTariff: currentTariff?.id === id ? null : currentTariff,
          isLoading: false,
        });

        toast.success("Tariff deleted successfully");
        return true;
      } else {
        throw new Error(result.error?.message || "Failed to delete tariff");
      }
    } catch (error: any) {
      console.error("Error deleting tariff:", error);
      const errorMessage = error?.message || "Failed to delete tariff";
      set({
        error: errorMessage,
        isLoading: false,
      });
      toast.error(errorMessage);
      return false;
    }
  },

  // Bulk import tariffs
  bulkImportTariffs: async (data: BulkTariffImportRequest) => {
    set({ isLoading: true, error: null });

    try {
      const result = await tariffsApiClient.bulkImportTariffs(data);

      if (result.success && result.data) {
        // Refresh the list
        await get().fetchTariffs();
        set({ isLoading: false });

        const importResult = result.data;
        if (importResult.failed > 0) {
          toast.warning(
            `Import completed: ${importResult.success} successful, ${importResult.failed} failed`
          );
        } else {
          toast.success(
            `Successfully imported ${importResult.success} tariffs`
          );
        }

        return importResult;
      } else {
        throw new Error(result.error?.message || "Failed to import tariffs");
      }
    } catch (error: any) {
      console.error("Error importing tariffs:", error);
      const errorMessage = error?.message || "Failed to import tariffs";
      set({
        error: errorMessage,
        isLoading: false,
      });
      toast.error(errorMessage);
      return null;
    }
  },

  // Calculate tariff
  calculateTariff: async (data: TariffCalculationRequest) => {
    set({ isLoading: true, error: null });

    try {
      const result = await tariffsApiClient.calculateTariff(data);

      if (result.success && result.data) {
        set({
          calculationResult: result.data,
          isLoading: false,
        });
        return true;
      } else {
        throw new Error(
          result.error?.message || "No tariff found for this route"
        );
      }
    } catch (error: any) {
      console.error("Error calculating tariff:", error);
      const errorMessage = error?.message || "Failed to calculate tariff";
      set({
        error: errorMessage,
        isLoading: false,
        calculationResult: null,
      });
      toast.error(errorMessage);
      return false;
    }
  },

  // Fetch stats
  fetchStats: async () => {
    try {
      const result = await tariffsApiClient.getTariffStats();

      if (result.success && result.data) {
        set({ stats: result.data });
      }
    } catch (error) {
      console.error("Error fetching tariff stats:", error);
    }
  },

  // Fetch missing tariffs
  fetchMissingTariffs: async () => {
    try {
      const result = await tariffsApiClient.getMissingTariffs();

      if (result.success && result.data) {
        set({ missingTariffs: result.data.missingPairs });
      }
    } catch (error) {
      console.error("Error fetching missing tariffs:", error);
    }
  },

  // Validate route
  validateRoute: async (
    pickupCityId: string,
    destinationCityId: string,
    excludeId?: string
  ) => {
    try {
      const result = await tariffsApiClient.validateTariffRoute(
        pickupCityId,
        destinationCityId,
        excludeId
      );

      if (result.success && result.data) {
        if (result.data.exists) {
          toast.error("A tariff already exists for this route");
          return false;
        }
        return true;
      }
      return true;
    } catch (error) {
      console.error("Error validating route:", error);
      return true; // Allow on validation error
    }
  },

  // Duplicate tariff
  duplicateTariff: async (
    id: string,
    pickupCityId: string,
    destinationCityId: string
  ) => {
    set({ isLoading: true, error: null });

    try {
      const result = await tariffsApiClient.duplicateTariff(
        id,
        pickupCityId,
        destinationCityId
      );

      if (result.success && result.data) {
        await get().fetchTariffs();
        set({ isLoading: false });
        toast.success("Tariff duplicated successfully");
        return true;
      } else {
        throw new Error(result.error?.message || "Failed to duplicate tariff");
      }
    } catch (error: any) {
      console.error("Error duplicating tariff:", error);
      const errorMessage = error?.message || "Failed to duplicate tariff";
      set({
        error: errorMessage,
        isLoading: false,
      });
      toast.error(errorMessage);
      return false;
    }
  },

  // Filter actions
  setFilters: (newFilters: Partial<TariffFilters>) => {
    const { filters } = get();
    const updatedFilters = { ...filters, ...newFilters };

    // Reset to page 1 when filters change (except for page changes)
    if (!newFilters.page) {
      updatedFilters.page = 1;
    }

    set({ filters: updatedFilters });

    // Auto-fetch when filters change
    get().fetchTariffs();
  },

  resetFilters: () => {
    set({ filters: initialFilters });
    get().fetchTariffs();
  },

  // Utility actions
  setCurrentTariff: (tariff: Tariff | null) => {
    set({ currentTariff: tariff });
  },

  clearError: () => {
    set({ error: null });
  },

  clearCalculationResult: () => {
    set({ calculationResult: null });
  },
}));
