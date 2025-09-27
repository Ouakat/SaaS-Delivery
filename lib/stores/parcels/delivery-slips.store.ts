import { create } from "zustand";
import { persist } from "zustand/middleware";
import { deliverySlipsApiClient } from "@/lib/api/clients/parcels/delivery-slips.client";
import type {
  DeliverySlip,
  CreateDeliverySlipRequest,
  UpdateDeliverySlipRequest,
  DeliverySlipFilters,
  DeliverySlipStatistics,
  AvailableParcel,
  AddParcelsToSlipRequest,
  RemoveParcelsFromSlipRequest,
  ReceiveSlipRequest,
  BulkSlipActionRequest,
} from "@/lib/types/parcels/delivery-slips.types";
import { toast } from "sonner";

interface DeliverySlipsState {
  // Core data
  deliverySlips: DeliverySlip[];
  availableParcels: AvailableParcel[];
  selectedDeliverySlip: DeliverySlip | null;
  statistics: DeliverySlipStatistics | null;

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
  selectedIds: string[];

  // Actions
  setFilters: (filters: Partial<DeliverySlipFilters>) => void;
  clearFilters: () => void;
  setSelectedIds: (ids: string[]) => void;
  clearSelectedIds: () => void;

  // API Actions
  fetchDeliverySlips: () => Promise<void>;
  fetchAvailableParcels: (cityId?: string) => Promise<void>;
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
    id: string,
    data: AddParcelsToSlipRequest
  ) => Promise<boolean>;
  removeParcelsFromSlip: (
    id: string,
    data: RemoveParcelsFromSlipRequest
  ) => Promise<boolean>;
  receiveSlip: (id: string, data: ReceiveSlipRequest) => Promise<boolean>;

  // Bulk operations
  bulkSlipAction: (data: BulkSlipActionRequest) => Promise<boolean>;

  // Scanner integration
  scanParcelToSlip: (slipId: string, parcelCode: string) => Promise<boolean>;

  // Statistics
  fetchStatistics: () => Promise<void>;

  // Utility methods
  getDeliverySlipById: (id: string) => DeliverySlip | undefined;
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
      availableParcels: [],
      selectedDeliverySlip: null,
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
        if (
          "search" in newFilters ||
          "status" in newFilters ||
          "cityId" in newFilters
        ) {
          set({ filters: { ...updatedFilters, page: 1 } });
        }

        // Auto-fetch with new filters
        get().fetchDeliverySlips();
      },

      clearFilters: () => {
        set({ filters: DEFAULT_FILTERS });
        get().fetchDeliverySlips();
      },

      setSelectedIds: (ids) => set({ selectedIds: ids }),
      clearSelectedIds: () => set({ selectedIds: [] }),

      // Fetch delivery slips with filters and pagination
      fetchDeliverySlips: async () => {
        const { filters } = get();
        set({ isLoading: true, error: null });

        try {
          const response = await deliverySlipsApiClient.getDeliverySlips(
            filters
          );

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

      // Fetch available parcels for creating delivery slips
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

      // Fetch delivery slip by ID
      fetchDeliverySlipById: async (id: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await deliverySlipsApiClient.getDeliverySlipById(id);

          if (response.success && response.data) {
            set({ selectedDeliverySlip: response.data, isLoading: false });
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
            selectedDeliverySlip: null,
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
            const newDeliverySlip = response.data;

            // Add to list if it matches current filters
            const { deliverySlips } = get();
            set({
              deliverySlips: [newDeliverySlip, ...deliverySlips],
              isCreating: false,
            });

            toast.success("Delivery slip created successfully");

            // Refresh the list to get accurate pagination
            get().fetchDeliverySlips();

            return newDeliverySlip;
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
            const updatedDeliverySlip = response.data;

            // Update in list
            const { deliverySlips } = get();
            const updatedList = deliverySlips.map((slip) =>
              slip.id === id ? updatedDeliverySlip : slip
            );

            set({
              deliverySlips: updatedList,
              selectedDeliverySlip: updatedDeliverySlip,
              isUpdating: false,
            });

            toast.success("Delivery slip updated successfully");
            return updatedDeliverySlip;
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
              selectedDeliverySlip: null,
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
      addParcelsToSlip: async (id: string, data: AddParcelsToSlipRequest) => {
        try {
          const response = await deliverySlipsApiClient.addParcelsToSlip(
            id,
            data
          );

          if (response.success && response.data) {
            const updatedSlip = response.data;

            // Update in list and selected slip
            const { deliverySlips } = get();
            const updatedList = deliverySlips.map((slip) =>
              slip.id === id ? updatedSlip : slip
            );

            set({
              deliverySlips: updatedList,
              selectedDeliverySlip: updatedSlip,
            });

            toast.success(
              `${data.parcelIds.length} parcels added to delivery slip`
            );
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
        id: string,
        data: RemoveParcelsFromSlipRequest
      ) => {
        try {
          const response = await deliverySlipsApiClient.removeParcelsFromSlip(
            id,
            data
          );

          if (response.success && response.data) {
            const updatedSlip = response.data;

            // Update in list and selected slip
            const { deliverySlips } = get();
            const updatedList = deliverySlips.map((slip) =>
              slip.id === id ? updatedSlip : slip
            );

            set({
              deliverySlips: updatedList,
              selectedDeliverySlip: updatedSlip,
            });

            toast.success(
              `${data.parcelIds.length} parcels removed from delivery slip`
            );
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
      receiveSlip: async (id: string, data: ReceiveSlipRequest) => {
        try {
          const response = await deliverySlipsApiClient.receiveSlip(id, data);

          if (response.success && response.data) {
            const updatedSlip = response.data;

            // Update in list and selected slip
            const { deliverySlips } = get();
            const updatedList = deliverySlips.map((slip) =>
              slip.id === id ? updatedSlip : slip
            );

            set({
              deliverySlips: updatedList,
              selectedDeliverySlip: updatedSlip,
            });

            toast.success("Delivery slip marked as received");
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

      // Bulk slip actions
      bulkSlipAction: async (data: BulkSlipActionRequest) => {
        try {
          const response = await deliverySlipsApiClient.bulkSlipAction(data);

          if (response.success && response.data) {
            const { successful, failed, errors } = response.data;

            if (successful > 0) {
              toast.success(`${successful} slips processed successfully`);
            }

            if (failed > 0) {
              toast.warning(`${failed} slips failed to process`);
              if (errors.length > 0) {
                console.error("Bulk action errors:", errors);
              }
            }

            // Clear selection and refresh
            set({ selectedIds: [] });
            get().fetchDeliverySlips();

            return true;
          } else {
            throw new Error(
              response.error?.message || "Failed to process bulk action"
            );
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "An unexpected error occurred";
          console.error("Error processing bulk action:", error);
          toast.error(`Failed to process bulk action: ${errorMessage}`);
          return false;
        }
      },

      // Scanner integration
      scanParcelToSlip: async (slipId: string, parcelCode: string) => {
        try {
          const response = await deliverySlipsApiClient.scanParcelToSlip(
            slipId,
            parcelCode
          );

          if (response.success && response.data) {
            const { success, message, parcelDetails } = response.data;

            if (success) {
              toast.success(message || "Parcel scanned successfully");

              // Refresh the selected slip
              await get().fetchDeliverySlipById(slipId);

              return true;
            } else {
              toast.error(response.data.error || "Failed to scan parcel");
              return false;
            }
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

      // Fetch statistics
      fetchStatistics: async () => {
        try {
          const response = await deliverySlipsApiClient.getStatistics();

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

      // Utility methods
      getDeliverySlipById: (id: string) => {
        const { deliverySlips } = get();
        return deliverySlips.find((slip) => slip.id === id);
      },

      resetState: () => {
        set({
          deliverySlips: [],
          availableParcels: [],
          selectedDeliverySlip: null,
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
      name: "delivery-slips-store",
      partialize: (state) => ({
        filters: state.filters,
        selectedIds: state.selectedIds,
        // Don't persist loading states or data
      }),
      version: 1,
    }
  )
);
