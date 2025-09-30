import { create } from "zustand";
import { persist } from "zustand/middleware";
import { shippingSlipsApiClient } from "@/lib/api/clients/parcels/shipping-slips.client";
import type {
  ShippingSlip,
  CreateShippingSlipRequest,
  UpdateShippingSlipRequest,
  ShippingSlipFilters,
  ShippingSlipStats,
  AddParcelsToShippingSlipRequest,
  RemoveParcelsFromShippingSlipRequest,
  AvailableParcel,
  ShippingSlipStatus,
} from "@/lib/types/parcels/shipping-slips.types";
import { toast } from "sonner";

interface ShippingSlipsState {
  // Core state
  shippingSlips: ShippingSlip[];
  currentShippingSlip: ShippingSlip | null;
  availableParcels: AvailableParcel[];
  statistics: ShippingSlipStats | null;

  // UI state
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
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
  filters: ShippingSlipFilters;

  // Selection for bulk operations
  selectedSlipIds: string[];

  // Actions
  setFilters: (filters: Partial<ShippingSlipFilters>) => void;
  clearFilters: () => void;
  setSelectedSlipIds: (ids: string[]) => void;
  clearSelectedSlipIds: () => void;

  // API Actions
  fetchShippingSlips: () => Promise<void>;
  fetchShippingSlipById: (id: string) => Promise<ShippingSlip | null>;
  createShippingSlip: (
    data: CreateShippingSlipRequest
  ) => Promise<ShippingSlip | null>;
  updateShippingSlip: (
    id: string,
    data: UpdateShippingSlipRequest
  ) => Promise<ShippingSlip | null>;
  deleteShippingSlip: (id: string) => Promise<boolean>;

  // Slip operations
  addParcelsToSlip: (
    slipId: string,
    data: AddParcelsToShippingSlipRequest
  ) => Promise<boolean>;
  removeParcelsFromSlip: (
    slipId: string,
    data: RemoveParcelsFromShippingSlipRequest
  ) => Promise<boolean>;
  scanParcel: (slipId: string, parcelCode: string) => Promise<boolean>;
  bulkScanParcels: (slipId: string, parcelCodes: string[]) => Promise<any>;
  markAsShipped: (slipId: string) => Promise<boolean>;
  markAsReceived: (slipId: string) => Promise<boolean>;
  cancelShippingSlip: (slipId: string) => Promise<boolean>;

  // Available parcels
  fetchAvailableParcels: (
    destinationZoneId: string,
    search?: string
  ) => Promise<void>;

  // Statistics
  fetchStatistics: () => Promise<void>;

  // PDF generation
  generatePDF: (id: string) => Promise<boolean>;

  // Utility methods
  getSlipById: (id: string) => ShippingSlip | undefined;
  getSlipsByStatus: (status: ShippingSlipStatus) => ShippingSlip[];
  resetState: () => void;
  clearError: () => void;
}

const DEFAULT_FILTERS: ShippingSlipFilters = {
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

export const useShippingSlipsStore = create<ShippingSlipsState>()(
  persist(
    (set, get) => ({
      // Initial state
      shippingSlips: [],
      currentShippingSlip: null,
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

        if ("search" in newFilters || "status" in newFilters) {
          set({ filters: { ...updatedFilters, page: 1 } });
        }

        get().fetchShippingSlips();
      },

      clearFilters: () => {
        set({ filters: DEFAULT_FILTERS });
        get().fetchShippingSlips();
      },

      setSelectedSlipIds: (ids) => set({ selectedSlipIds: ids }),
      clearSelectedSlipIds: () => set({ selectedSlipIds: [] }),

      // Fetch shipping slips
      fetchShippingSlips: async () => {
        const { filters } = get();
        set({ isLoading: true, error: null });

        try {
          const response = await shippingSlipsApiClient.getShippingSlips(
            filters
          );

          if (response.data && response.data.length > 0) {
            set({
              shippingSlips: response.data[0].data,
              pagination: response.data[0].meta,
              isLoading: false,
            });
          } else {
            throw new Error(
              response.error?.message || "Failed to fetch shipping slips"
            );
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "An unexpected error occurred";
          console.error("Error fetching shipping slips:", error);
          set({ error: errorMessage, isLoading: false });
          toast.error("Failed to fetch shipping slips");
        }
      },

      // Fetch shipping slip by ID
      fetchShippingSlipById: async (id: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await shippingSlipsApiClient.getShippingSlipById(id);

          if (response.success && response.data) {
            set({
              currentShippingSlip: response.data,
              isLoading: false,
            });
            return response.data;
          } else {
            throw new Error(
              response.error?.message || "Shipping slip not found"
            );
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "An unexpected error occurred";
          console.error("Error fetching shipping slip:", error);
          set({
            error: errorMessage,
            isLoading: false,
            currentShippingSlip: null,
          });
          toast.error("Failed to fetch shipping slip");
          return null;
        }
      },

      // Create shipping slip
      createShippingSlip: async (data: CreateShippingSlipRequest) => {
        set({ isCreating: true, error: null });

        try {
          const response = await shippingSlipsApiClient.createShippingSlip(
            data
          );

          if (response.success && response.data) {
            const newSlip = response.data;

            const { shippingSlips } = get();
            set({
              shippingSlips: [newSlip, ...shippingSlips],
              isCreating: false,
            });

            toast.success("Shipping slip created successfully");
            get().fetchShippingSlips();

            return newSlip;
          } else {
            throw new Error(
              response.error?.message || "Failed to create shipping slip"
            );
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "An unexpected error occurred";
          console.error("Error creating shipping slip:", error);
          set({ error: errorMessage, isCreating: false });
          toast.error(`Failed to create shipping slip: ${errorMessage}`);
          return null;
        }
      },

      // Update shipping slip
      updateShippingSlip: async (
        id: string,
        data: UpdateShippingSlipRequest
      ) => {
        set({ isUpdating: true, error: null });

        try {
          const response = await shippingSlipsApiClient.updateShippingSlip(
            id,
            data
          );

          if (response.success && response.data) {
            const updatedSlip = response.data;

            const { shippingSlips } = get();
            const updatedList = shippingSlips.map((slip) =>
              slip.id === id ? updatedSlip : slip
            );

            set({
              shippingSlips: updatedList,
              currentShippingSlip: updatedSlip,
              isUpdating: false,
            });

            toast.success("Shipping slip updated successfully");
            return updatedSlip;
          } else {
            throw new Error(
              response.error?.message || "Failed to update shipping slip"
            );
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "An unexpected error occurred";
          console.error("Error updating shipping slip:", error);
          set({ error: errorMessage, isUpdating: false });
          toast.error(`Failed to update shipping slip: ${errorMessage}`);
          return null;
        }
      },

      // Delete shipping slip
      deleteShippingSlip: async (id: string) => {
        set({ isDeleting: true, error: null });

        try {
          const response = await shippingSlipsApiClient.deleteShippingSlip(id);

          if (response.success) {
            const { shippingSlips } = get();
            const updatedList = shippingSlips.filter((slip) => slip.id !== id);

            set({
              shippingSlips: updatedList,
              currentShippingSlip: null,
              isDeleting: false,
            });

            toast.success("Shipping slip deleted successfully");
            get().fetchShippingSlips();

            return true;
          } else {
            throw new Error(
              response.error?.message || "Failed to delete shipping slip"
            );
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "An unexpected error occurred";
          console.error("Error deleting shipping slip:", error);
          set({ error: errorMessage, isDeleting: false });
          toast.error(`Failed to delete shipping slip: ${errorMessage}`);
          return false;
        }
      },

      // Add parcels to slip
      addParcelsToSlip: async (
        slipId: string,
        data: AddParcelsToShippingSlipRequest
      ) => {
        try {
          const response = await shippingSlipsApiClient.addParcelsToSlip(
            slipId,
            data
          );

          if (response.success && response.data) {
            const updatedSlip = response.data;

            const { currentShippingSlip } = get();
            if (currentShippingSlip?.id === slipId) {
              set({ currentShippingSlip: updatedSlip });
            }

            const { shippingSlips } = get();
            const updatedList = shippingSlips.map((slip) =>
              slip.id === slipId ? updatedSlip : slip
            );
            set({ shippingSlips: updatedList });

            toast.success("Parcels added to shipping slip successfully");
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
        data: RemoveParcelsFromShippingSlipRequest
      ) => {
        try {
          const response = await shippingSlipsApiClient.removeParcelsFromSlip(
            slipId,
            data
          );

          if (response.success && response.data) {
            const updatedSlip = response.data;

            const { currentShippingSlip } = get();
            if (currentShippingSlip?.id === slipId) {
              set({ currentShippingSlip: updatedSlip });
            }

            const { shippingSlips } = get();
            const updatedList = shippingSlips.map((slip) =>
              slip.id === slipId ? updatedSlip : slip
            );
            set({ shippingSlips: updatedList });

            toast.success("Parcels removed from shipping slip successfully");
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

      // Scan parcel
      scanParcel: async (slipId: string, parcelCode: string) => {
        try {
          const response = await shippingSlipsApiClient.scanParcel(
            slipId,
            parcelCode
          );

          if (response.success) {
            toast.success("Parcel scanned successfully");

            if (get().currentShippingSlip?.id === slipId) {
              get().fetchShippingSlipById(slipId);
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

      // Bulk scan parcels
      bulkScanParcels: async (slipId: string, parcelCodes: string[]) => {
        try {
          const response = await shippingSlipsApiClient.bulkScanParcels(
            slipId,
            parcelCodes
          );

          if (response.success && response.data) {
            toast.success(
              `Scanned ${response.data.scannedCount} of ${parcelCodes.length} parcels`
            );

            if (get().currentShippingSlip?.id === slipId) {
              get().fetchShippingSlipById(slipId);
            }

            return response.data;
          } else {
            throw new Error(
              response.error?.message || "Failed to bulk scan parcels"
            );
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "An unexpected error occurred";
          console.error("Error bulk scanning parcels:", error);
          toast.error(`Failed to bulk scan: ${errorMessage}`);
          return null;
        }
      },

      // Mark as shipped
      markAsShipped: async (slipId: string) => {
        try {
          const response = await shippingSlipsApiClient.markAsShipped(slipId);

          if (response.success && response.data) {
            const updatedSlip = response.data;

            const { currentShippingSlip } = get();
            if (currentShippingSlip?.id === slipId) {
              set({ currentShippingSlip: updatedSlip });
            }

            const { shippingSlips } = get();
            const updatedList = shippingSlips.map((slip) =>
              slip.id === slipId ? updatedSlip : slip
            );
            set({ shippingSlips: updatedList });

            toast.success("Shipping slip marked as shipped");
            return true;
          } else {
            throw new Error(
              response.error?.message || "Failed to mark as shipped"
            );
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "An unexpected error occurred";
          console.error("Error marking as shipped:", error);
          toast.error(`Failed to mark as shipped: ${errorMessage}`);
          return false;
        }
      },

      // Mark as received
      markAsReceived: async (slipId: string) => {
        try {
          const response = await shippingSlipsApiClient.markAsReceived(slipId);

          if (response.success && response.data) {
            const updatedSlip = response.data;

            const { currentShippingSlip } = get();
            if (currentShippingSlip?.id === slipId) {
              set({ currentShippingSlip: updatedSlip });
            }

            const { shippingSlips } = get();
            const updatedList = shippingSlips.map((slip) =>
              slip.id === slipId ? updatedSlip : slip
            );
            set({ shippingSlips: updatedList });

            toast.success("Shipping slip marked as received");
            return true;
          } else {
            throw new Error(
              response.error?.message || "Failed to mark as received"
            );
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "An unexpected error occurred";
          console.error("Error marking as received:", error);
          toast.error(`Failed to mark as received: ${errorMessage}`);
          return false;
        }
      },

      // Cancel shipping slip
      cancelShippingSlip: async (slipId: string) => {
        try {
          const response = await shippingSlipsApiClient.cancelShippingSlip(
            slipId
          );

          if (response.success && response.data) {
            const updatedSlip = response.data;

            const { currentShippingSlip } = get();
            if (currentShippingSlip?.id === slipId) {
              set({ currentShippingSlip: updatedSlip });
            }

            const { shippingSlips } = get();
            const updatedList = shippingSlips.map((slip) =>
              slip.id === slipId ? updatedSlip : slip
            );
            set({ shippingSlips: updatedList });

            toast.success("Shipping slip cancelled successfully");
            return true;
          } else {
            throw new Error(
              response.error?.message || "Failed to cancel shipping slip"
            );
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "An unexpected error occurred";
          console.error("Error cancelling shipping slip:", error);
          toast.error(`Failed to cancel: ${errorMessage}`);
          return false;
        }
      },

      // Fetch available parcels
      fetchAvailableParcels: async (
        destinationZoneId: string,
        search?: string
      ) => {
        try {
          const response = await shippingSlipsApiClient.getAvailableParcels(
            destinationZoneId,
            search
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
          const response = await shippingSlipsApiClient.getShippingSlipStats();

          if (response.success && response.data) {
            set({ statistics: response.data });
          } else {
            throw new Error(
              response.error?.message || "Failed to fetch statistics"
            );
          }
        } catch (error) {
          console.error("Error fetching shipping slip statistics:", error);
        }
      },

      // Generate PDF
      generatePDF: async (id: string) => {
        try {
          const response = await shippingSlipsApiClient.generatePDF(id);

          if (response.success && response.data) {
            const url = window.URL.createObjectURL(response.data);
            const a = document.createElement("a");
            a.href = url;
            a.download = `shipping-slip-${id}.pdf`;
            a.click();
            window.URL.revokeObjectURL(url);

            toast.success("PDF downloaded successfully");
            return true;
          } else {
            throw new Error(
              response.error?.message || "Failed to generate PDF"
            );
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "An unexpected error occurred";
          console.error("Error generating PDF:", error);
          toast.error(`Failed to generate PDF: ${errorMessage}`);
          return false;
        }
      },

      // Utility methods
      getSlipById: (id: string) => {
        return get().shippingSlips.find((slip) => slip.id === id);
      },

      getSlipsByStatus: (status: ShippingSlipStatus) => {
        return get().shippingSlips.filter((slip) => slip.status === status);
      },

      resetState: () => {
        set({
          shippingSlips: [],
          currentShippingSlip: null,
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
      name: "shipping-slips-store",
      partialize: (state) => ({
        filters: state.filters,
        selectedSlipIds: state.selectedSlipIds,
      }),
      version: 1,
    }
  )
);
