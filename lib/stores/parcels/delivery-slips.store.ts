import { create } from "zustand";
import { persist } from "zustand/middleware";
import { deliverySlipsApiClient } from "@/lib/api/clients/parcels/delivery-slips.client";
import type {
  DeliverySlip,
  CreateDeliverySlipRequest,
  UpdateDeliverySlipRequest,
  DeliverySlipFilters,
  AddParcelsToSlipRequest,
  RemoveParcelsFromSlipRequest,
  ReceiveSlipRequest,
  DeliverySlipStats,
  BulkSlipActionRequest,
  AvailableParcel,
  PaginatedDeliverySlips,
  DeliverySlipStatus,
} from "@/lib/types/parcels/delivery-slips.types";
import { toast } from "sonner";

interface DeliverySlipsState {
  // Core state
  deliverySlips: DeliverySlip[];
  currentDeliverySlip: DeliverySlip | null;
  availableParcels: AvailableParcel[];
  statistics: DeliverySlipStats | null;

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
  filters: DeliverySlipFilters;

  // Selection state for bulk operations
  selectedSlipIds: string[];

  // Actions
  setFilters: (filters: Partial<DeliverySlipFilters>) => void;
  clearFilters: () => void;
  setSelectedSlipIds: (ids: string[]) => void;
  clearSelectedSlipIds: () => void;

  // API Actions
  fetchDeliverySlips: () => Promise<void>;
  fetchDeliverySlipById: (id: string) => Promise<DeliverySlip | null>;
  createDeliverySlip: (
    data: CreateDeliverySlipRequest
  ) => Promise<DeliverySlip | null>;
  updateDeliverySlip: (
    id: string,
    data: UpdateDeliverySlipRequest
  ) => Promise<DeliverySlip | null>;
  deleteDeliverySlip: (id: string) => Promise<boolean>;

  // Slip operations
  addParcelsToSlip: (
    slipId: string,
    data: AddParcelsToSlipRequest
  ) => Promise<boolean>;
  removeParcelsFromSlip: (
    slipId: string,
    data: RemoveParcelsFromSlipRequest
  ) => Promise<boolean>;
  receiveSlip: (slipId: string, data: ReceiveSlipRequest) => Promise<boolean>;
  scanParcelIntoSlip: (slipId: string, parcelCode: string) => Promise<boolean>;

  // Bulk operations
  bulkAction: (data: BulkSlipActionRequest) => Promise<boolean>;

  // Available parcels
  fetchAvailableParcels: (cityId?: string) => Promise<void>;

  // Statistics
  fetchStatistics: () => Promise<void>;

  // Document operations
  downloadSlipPdf: (id: string) => Promise<boolean>;
  downloadSlipLabels: (id: string) => Promise<boolean>;
  getSlipBarcode: (id: string) => Promise<any | null>;

  // Export
  exportDeliverySlips: (
    filters?: DeliverySlipFilters
  ) => Promise<string | null>;

  // Utility methods
  getSlipById: (id: string) => DeliverySlip | undefined;
  getSlipsByStatus: (status: DeliverySlipStatus) => DeliverySlip[];
  resetState: () => void;
  clearError: () => void;
}

const DEFAULT_FILTERS: DeliverySlipFilters = {
  page: 1,
  limit: 10,
  search: "",
  sortBy: "createdAt",
  sortOrder: "desc",
};

const DEFAULT_PAGINATION = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
  hasNext: false,
  hasPrev: false,
};

export const useDeliverySlipsStore = create<DeliverySlipsState>()(
  persist(
    (set, get) => ({
      // Initial state
      deliverySlips: [],
      currentDeliverySlip: null,
      availableParcels: [],
      statistics: null,
      isLoading: false,
      isCreating: false,
      isUpdating: false,
      isDeleting: false,
      error: null,
      pagination: DEFAULT_PAGINATION,
      filters: DEFAULT_FILTERS,
      selectedSlipIds: [],

      // Filter actions
      setFilters: (newFilters) => {
        const updatedFilters = { ...get().filters, ...newFilters };
        set({ filters: updatedFilters });

        // Reset to page 1 if search or other filters changed
        if ("search" in newFilters || "status" in newFilters) {
          set({ filters: { ...updatedFilters, page: 1 } });
        }

        // Auto-fetch with new filters
        get().fetchDeliverySlips();
      },

      clearFilters: () => {
        set({ filters: DEFAULT_FILTERS });
        get().fetchDeliverySlips();
      },

      setSelectedSlipIds: (ids) => set({ selectedSlipIds: ids }),
      clearSelectedSlipIds: () => set({ selectedSlipIds: [] }),

      // Fetch delivery slips with filters and pagination
      fetchDeliverySlips: async () => {
        const { filters } = get();
        set({ isLoading: true, error: null });

        try {
          const response = await deliverySlipsApiClient.getDeliverySlips(
            filters
          );
          console.log("🚀 ~ response:", response)

          if (response.success && response.data) {
            set({
              deliverySlips: response.data.data,
              pagination: response.data.meta,
              isLoading: false,
            });
          } else {
            throw new Error(
              response.error?.message || "Failed to fetch delivery slips"
            );
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "An unexpected error occurred";
          console.error("Error fetching delivery slips:", error);
          set({ error: errorMessage, isLoading: false });
          toast.error("Failed to fetch delivery slips");
        }
      },

      // Fetch delivery slip by ID
      fetchDeliverySlipById: async (id: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await deliverySlipsApiClient.getDeliverySlipById(id);

          if (response.success && response.data) {
            set({
              currentDeliverySlip: response.data,
              isLoading: false,
            });
            return response.data;
          } else {
            throw new Error(
              response.error?.message || "Delivery slip not found"
            );
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "An unexpected error occurred";
          console.error("Error fetching delivery slip:", error);
          set({
            error: errorMessage,
            isLoading: false,
            currentDeliverySlip: null,
          });
          toast.error("Failed to fetch delivery slip");
          return null;
        }
      },

      // Create delivery slip
      createDeliverySlip: async (data: CreateDeliverySlipRequest) => {
        set({ isCreating: true, error: null });

        try {
          const response = await deliverySlipsApiClient.createDeliverySlip(
            data
          );

          if (response.success && response.data) {
            const newSlip = response.data;

            // Add to list if it matches current filters
            const { deliverySlips } = get();
            set({
              deliverySlips: [newSlip, ...deliverySlips],
              isCreating: false,
            });

            toast.success("Delivery slip created successfully");

            // Refresh the list to get accurate pagination
            get().fetchDeliverySlips();

            return newSlip;
          } else {
            throw new Error(
              response.error?.message || "Failed to create delivery slip"
            );
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "An unexpected error occurred";
          console.error("Error creating delivery slip:", error);
          set({ error: errorMessage, isCreating: false });
          toast.error(`Failed to create delivery slip: ${errorMessage}`);
          return null;
        }
      },

      // Update delivery slip
      updateDeliverySlip: async (
        id: string,
        data: UpdateDeliverySlipRequest
      ) => {
        set({ isUpdating: true, error: null });

        try {
          const response = await deliverySlipsApiClient.updateDeliverySlip(
            id,
            data
          );

          if (response.success && response.data) {
            const updatedSlip = response.data;

            // Update in list
            const { deliverySlips } = get();
            const updatedList = deliverySlips.map((slip) =>
              slip.id === id ? updatedSlip : slip
            );

            set({
              deliverySlips: updatedList,
              currentDeliverySlip: updatedSlip,
              isUpdating: false,
            });

            toast.success("Delivery slip updated successfully");
            return updatedSlip;
          } else {
            throw new Error(
              response.error?.message || "Failed to update delivery slip"
            );
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "An unexpected error occurred";
          console.error("Error updating delivery slip:", error);
          set({ error: errorMessage, isUpdating: false });
          toast.error(`Failed to update delivery slip: ${errorMessage}`);
          return null;
        }
      },

      // Delete delivery slip
      deleteDeliverySlip: async (id: string) => {
        set({ isDeleting: true, error: null });

        try {
          const response = await deliverySlipsApiClient.deleteDeliverySlip(id);

          if (response.success) {
            // Remove from list
            const { deliverySlips } = get();
            const updatedList = deliverySlips.filter((slip) => slip.id !== id);

            set({
              deliverySlips: updatedList,
              currentDeliverySlip: null,
              isDeleting: false,
            });

            toast.success("Delivery slip deleted successfully");

            // Refresh to get accurate pagination
            get().fetchDeliverySlips();

            return true;
          } else {
            throw new Error(
              response.error?.message || "Failed to delete delivery slip"
            );
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "An unexpected error occurred";
          console.error("Error deleting delivery slip:", error);
          set({ error: errorMessage, isDeleting: false });
          toast.error(`Failed to delete delivery slip: ${errorMessage}`);
          return false;
        }
      },

      // Add parcels to slip
      addParcelsToSlip: async (
        slipId: string,
        data: AddParcelsToSlipRequest
      ) => {
        try {
          const response = await deliverySlipsApiClient.addParcelsToSlip(
            slipId,
            data
          );

          if (response.success && response.data) {
            const updatedSlip = response.data;

            // Update current slip if it matches
            const { currentDeliverySlip } = get();
            if (currentDeliverySlip?.id === slipId) {
              set({ currentDeliverySlip: updatedSlip });
            }

            // Update in list
            const { deliverySlips } = get();
            const updatedList = deliverySlips.map((slip) =>
              slip.id === slipId ? updatedSlip : slip
            );
            set({ deliverySlips: updatedList });

            toast.success("Parcels added to delivery slip successfully");
            return true;
          } else {
            throw new Error(
              response.error?.message || "Failed to add parcels to slip"
            );
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "An unexpected error occurred";
          console.error("Error adding parcels to slip:", error);
          toast.error(`Failed to add parcels: ${errorMessage}`);
          return false;
        }
      },

      // Remove parcels from slip
      removeParcelsFromSlip: async (
        slipId: string,
        data: RemoveParcelsFromSlipRequest
      ) => {
        try {
          const response = await deliverySlipsApiClient.removeParcelsFromSlip(
            slipId,
            data
          );

          if (response.success && response.data) {
            const updatedSlip = response.data;

            // Update current slip if it matches
            const { currentDeliverySlip } = get();
            if (currentDeliverySlip?.id === slipId) {
              set({ currentDeliverySlip: updatedSlip });
            }

            // Update in list
            const { deliverySlips } = get();
            const updatedList = deliverySlips.map((slip) =>
              slip.id === slipId ? updatedSlip : slip
            );
            set({ deliverySlips: updatedList });

            toast.success("Parcels removed from delivery slip successfully");
            return true;
          } else {
            throw new Error(
              response.error?.message || "Failed to remove parcels from slip"
            );
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "An unexpected error occurred";
          console.error("Error removing parcels from slip:", error);
          toast.error(`Failed to remove parcels: ${errorMessage}`);
          return false;
        }
      },

      // Receive slip
      receiveSlip: async (slipId: string, data: ReceiveSlipRequest) => {
        try {
          const response = await deliverySlipsApiClient.receiveSlip(
            slipId,
            data
          );

          if (response.success && response.data) {
            const updatedSlip = response.data;

            // Update current slip if it matches
            const { currentDeliverySlip } = get();
            if (currentDeliverySlip?.id === slipId) {
              set({ currentDeliverySlip: updatedSlip });
            }

            // Update in list
            const { deliverySlips } = get();
            const updatedList = deliverySlips.map((slip) =>
              slip.id === slipId ? updatedSlip : slip
            );
            set({ deliverySlips: updatedList });

            toast.success("Delivery slip marked as received successfully");
            return true;
          } else {
            throw new Error(
              response.error?.message || "Failed to receive slip"
            );
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "An unexpected error occurred";
          console.error("Error receiving slip:", error);
          toast.error(`Failed to receive slip: ${errorMessage}`);
          return false;
        }
      },

      // Scan parcel into slip
      scanParcelIntoSlip: async (slipId: string, parcelCode: string) => {
        try {
          const response = await deliverySlipsApiClient.scanParcelIntoSlip(
            slipId,
            parcelCode
          );

          if (response.success) {
            toast.success("Parcel scanned successfully");

            // Refresh current slip to get updated data
            if (get().currentDeliverySlip?.id === slipId) {
              get().fetchDeliverySlipById(slipId);
            }

            return true;
          } else {
            throw new Error(response.error?.message || "Failed to scan parcel");
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "An unexpected error occurred";
          console.error("Error scanning parcel:", error);
          toast.error(`Failed to scan parcel: ${errorMessage}`);
          return false;
        }
      },

      // Bulk action
      bulkAction: async (data: BulkSlipActionRequest) => {
        try {
          const response = await deliverySlipsApiClient.bulkAction(data);

          if (response.success && response.data) {
            toast.success(
              `Bulk action completed: ${response.data.success} successful, ${response.data.failed} failed`
            );

            if (response.data.failed > 0) {
              toast.warning(`${response.data.failed} slips failed to process`);
            }

            // Clear selection and refresh
            set({ selectedSlipIds: [] });
            get().fetchDeliverySlips();

            return true;
          } else {
            throw new Error(
              response.error?.message || "Failed to execute bulk action"
            );
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "An unexpected error occurred";
          console.error("Error executing bulk action:", error);
          toast.error(`Failed to execute bulk action: ${errorMessage}`);
          return false;
        }
      },

      // Fetch available parcels
      fetchAvailableParcels: async (cityId?: string) => {
        try {
          const response = await deliverySlipsApiClient.getAvailableParcels(
            cityId
          );

          if (response.success && response.data) {
            set({ availableParcels: response.data });
          } else {
            throw new Error(
              response.error?.message || "Failed to fetch available parcels"
            );
          }
        } catch (error) {
          console.error("Error fetching available parcels:", error);
          toast.error("Failed to fetch available parcels");
        }
      },

      // Fetch statistics
      fetchStatistics: async () => {
        try {
          const response = await deliverySlipsApiClient.getDeliverySlipStats();

          if (response.success && response.data) {
            set({ statistics: response.data });
          } else {
            throw new Error(
              response.error?.message || "Failed to fetch statistics"
            );
          }
        } catch (error) {
          console.error("Error fetching delivery slip statistics:", error);
        }
      },

      // Download slip PDF
      downloadSlipPdf: async (id: string) => {
        try {
          const response = await deliverySlipsApiClient.downloadSlipPdf(id);

          if (response.success && response.data) {
            // Create download link
            const url = window.URL.createObjectURL(response.data);
            const a = document.createElement("a");
            a.href = url;
            a.download = `delivery-slip-${id}.pdf`;
            a.click();
            window.URL.revokeObjectURL(url);

            toast.success("PDF downloaded successfully");
            return true;
          } else {
            throw new Error(
              response.error?.message || "Failed to download PDF"
            );
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "An unexpected error occurred";
          console.error("Error downloading PDF:", error);
          toast.error(`Failed to download PDF: ${errorMessage}`);
          return false;
        }
      },

      // Download slip labels
      downloadSlipLabels: async (id: string) => {
        try {
          const response = await deliverySlipsApiClient.downloadSlipLabels(id);

          if (response.success && response.data) {
            // Create download link
            const url = window.URL.createObjectURL(response.data);
            const a = document.createElement("a");
            a.href = url;
            a.download = `delivery-slip-labels-${id}.pdf`;
            a.click();
            window.URL.revokeObjectURL(url);

            toast.success("Labels downloaded successfully");
            return true;
          } else {
            throw new Error(
              response.error?.message || "Failed to download labels"
            );
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "An unexpected error occurred";
          console.error("Error downloading labels:", error);
          toast.error(`Failed to download labels: ${errorMessage}`);
          return false;
        }
      },

      // Get slip barcode
      getSlipBarcode: async (id: string) => {
        try {
          const response = await deliverySlipsApiClient.getSlipBarcode(id);

          if (response.success && response.data) {
            return response.data;
          } else {
            throw new Error(response.error?.message || "Failed to get barcode");
          }
        } catch (error) {
          console.error("Error getting barcode:", error);
          toast.error("Failed to get barcode");
          return null;
        }
      },

      // Export delivery slips
      exportDeliverySlips: async (filters?: DeliverySlipFilters) => {
        set({ isLoading: true, error: null });

        try {
          const filtersToUse = filters || get().filters;
          const result = await deliverySlipsApiClient.exportDeliverySlips(
            filtersToUse
          );

          if (result.success && result.data) {
            set({ isLoading: false });
            toast.success(
              `Exported ${result.data.totalRecords} delivery slips successfully`
            );
            return result.data.downloadUrl;
          } else {
            throw new Error(
              result.error?.message || "Failed to export delivery slips"
            );
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "An unexpected error occurred";
          console.error("Error exporting delivery slips:", error);
          set({
            error: errorMessage,
            isLoading: false,
          });
          toast.error(`Failed to export delivery slips: ${errorMessage}`);
          return null;
        }
      },

      // Utility methods
      getSlipById: (id: string) => {
        return get().deliverySlips.find((slip) => slip.id === id);
      },

      getSlipsByStatus: (status: DeliverySlipStatus) => {
        return get().deliverySlips.filter((slip) => slip.status === status);
      },

      resetState: () => {
        set({
          deliverySlips: [],
          currentDeliverySlip: null,
          availableParcels: [],
          statistics: null,
          error: null,
          pagination: DEFAULT_PAGINATION,
          filters: DEFAULT_FILTERS,
          selectedSlipIds: [],
          isLoading: false,
          isCreating: false,
          isUpdating: false,
          isDeleting: false,
        });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "delivery-slips-store",
      partialize: (state) => ({
        filters: state.filters,
        selectedSlipIds: state.selectedSlipIds,
        // Don't persist loading states or large data
      }),
      version: 1,
    }
  )
);
