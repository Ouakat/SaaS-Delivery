import { create } from "zustand";
import { persist } from "zustand/middleware";
import { parcelsApiClient } from "@/lib/api/clients/parcels/parcels.client";
import type {
  Parcel,
  CreateParcelRequest,
  UpdateParcelRequest,
  ParcelFilters,
  ParcelStatistics,
  ChangeParcelStatusRequest,
  BulkParcelActionRequest,
  BulkActionResult,
  PaginatedParcelsResponse,
} from "@/lib/types/parcels/parcels.types";
import { toast } from "sonner";

interface ParcelsState {
  // Core state
  parcels: Parcel[];
  myParcels: Parcel[];
  currentParcel: Parcel | null;
  statistics: ParcelStatistics | null;

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
  filters: ParcelFilters;

  // Selection state for bulk operations
  selectedIds: string[];

  parcelHistory: Array<{
    id: string;
    statusCode: string;
    statusName: string;
    comment?: string;
    changedAt: string;
    changedBy?: string;
  }>;
  isLoadingHistory: boolean;

  // Actions
  setFilters: (filters: Partial<ParcelFilters>) => void;
  clearFilters: () => void;
  setSelectedIds: (ids: string[]) => void;
  clearSelectedIds: () => void;

  // API Actions
  fetchParcels: () => Promise<void>;
  fetchMyParcels: () => Promise<void>;
  fetchParcelById: (id: string) => Promise<Parcel | null>;
  createParcel: (data: CreateParcelRequest) => Promise<Parcel | null>;
  updateParcel: (
    id: string,
    data: UpdateParcelRequest
  ) => Promise<Parcel | null>;
  deleteParcel: (id: string) => Promise<boolean>;
  changeParcelStatus: (
    id: string,
    data: ChangeParcelStatusRequest
  ) => Promise<boolean>;
  updatePaymentStatus: (
    id: string,
    paymentStatus: string,
    comment?: string
  ) => Promise<boolean>;

  // Specialized fetches
  fetchPickupReadyParcels: () => Promise<void>;
  fetchParcelsByStatus: (statusCode: string) => Promise<void>;
  searchParcelsByPhone: (phone: string) => Promise<void>;

  // Bulk operations
  bulkAction: (
    data: BulkParcelActionRequest
  ) => Promise<BulkActionResult | null>;
  bulkChangeStatus: (
    parcelIds: string[],
    statusCode: string,
    comment?: string
  ) => Promise<boolean>;
  bulkDeleteParcels: (parcelIds: string[]) => Promise<boolean>;

  // Statistics
  fetchStatistics: () => Promise<void>;
  fetchParcelHistory: (id: string) => Promise<void>;

  // Utility methods
  getParcelById: (id: string) => Parcel | undefined;
  getParcelsByStatus: (statusCode: string) => Parcel[];
  resetState: () => void;
  clearError: () => void;
}

const DEFAULT_FILTERS: ParcelFilters = {
  page: 1,
  limit: 10,
  search: "",
  sortBy: "createdAt",
  sortParcel: "desc",
};

const DEFAULT_PAGINATION = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
  hasNext: false,
  hasPrev: false,
};

export const useParcelsStore = create<ParcelsState>()(
  persist(
    (set, get) => ({
      // Initial state
      parcels: [],
      myParcels: [],
      currentParcel: null,
      statistics: null,
      isLoading: false,
      isCreating: false,
      isUpdating: false,
      isDeleting: false,
      error: null,
      pagination: DEFAULT_PAGINATION,
      filters: DEFAULT_FILTERS,
      selectedIds: [],
      parcelHistory: [],
      isLoadingHistory: false,

      // Filter actions
      setFilters: (newFilters) => {
        const updatedFilters = { ...get().filters, ...newFilters };
        set({ filters: updatedFilters });

        // Reset to page 1 if search or other filters changed
        if ("search" in newFilters || "statusCode" in newFilters) {
          set({ filters: { ...updatedFilters, page: 1 } });
        }

        // Auto-fetch with new filters
        get().fetchParcels();
      },

      clearFilters: () => {
        set({ filters: DEFAULT_FILTERS });
        get().fetchParcels();
      },

      setSelectedIds: (ids) => set({ selectedIds: ids }),
      clearSelectedIds: () => set({ selectedIds: [] }),

      // Fetch parcels with filters and pagination
      fetchParcels: async () => {
        const { filters } = get();
        set({ isLoading: true, error: null });

        try {
          const response = await parcelsApiClient.getParcels(filters);

          if (response.data && response.data.length) {
            set({
              parcels: response.data[0].data,
              pagination: response.data[0].meta,
              isLoading: false,
            });
          } else {
            throw new Error(
              response.error?.message || "Failed to fetch parcels"
            );
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "An unexpected error occurred";
          console.error("Error fetching parcels:", error);
          set({ error: errorMessage, isLoading: false });
          toast.error("Failed to fetch parcels");
        }
      },

      // Fetch current user's parcels
      fetchMyParcels: async () => {
        const { filters } = get();
        set({ isLoading: true, error: null });

        try {
          const response = await parcelsApiClient.getMyParcels(filters);

          if (response.success && response.data) {
            set({
              myParcels: response.data.data,
              pagination: response.data.meta,
              isLoading: false,
            });
          } else {
            throw new Error(
              response.error?.message || "Failed to fetch my parcels"
            );
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "An unexpected error occurred";
          console.error("Error fetching my parcels:", error);
          set({ error: errorMessage, isLoading: false });
          toast.error("Failed to fetch your parcels");
        }
      },

      // Fetch parcel by ID
      fetchParcelById: async (id: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await parcelsApiClient.getParcelById(id);

          if (response.success && response.data) {
            set({ currentParcel: response.data, isLoading: false });
            return response.data;
          } else {
            throw new Error(response.error?.message || "Parcel not found");
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "An unexpected error occurred";
          console.error("Error fetching parcel:", error);
          set({
            error: errorMessage,
            isLoading: false,
            currentParcel: null,
          });
          toast.error("Failed to fetch parcel details");
          return null;
        }
      },

      // Create parcel
      createParcel: async (data: CreateParcelRequest) => {
        set({ isCreating: true, error: null });

        try {
          const response = await parcelsApiClient.createParcel(data);

          if (response.success && response.data) {
            const newParcel = response.data;

            // Add to list if it matches current filters
            const { parcels } = get();
            set({
              parcels: [newParcel, ...parcels],
              isCreating: false,
            });

            toast.success("Parcel created successfully");

            // Refresh the list to get accurate pagination
            get().fetchParcels();

            return newParcel;
          } else {
            throw new Error(
              response.error?.message || "Failed to create parcel"
            );
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "An unexpected error occurred";
          console.error("Error creating parcel:", error);
          set({ error: errorMessage, isCreating: false });
          toast.error(`Failed to create parcel: ${errorMessage}`);
          return null;
        }
      },

      // Update parcel
      updateParcel: async (id: string, data: UpdateParcelRequest) => {
        set({ isUpdating: true, error: null });

        try {
          const response = await parcelsApiClient.updateParcel(id, data);

          if (response.success && response.data) {
            const updatedParcel = response.data;

            // Update in list
            const { parcels } = get();
            const updatedList = parcels.map((parcel) =>
              parcel.id === id ? updatedParcel : parcel
            );

            set({
              parcels: updatedList,
              currentParcel: updatedParcel,
              isUpdating: false,
            });

            toast.success("Parcel updated successfully");
            return updatedParcel;
          } else {
            throw new Error(
              response.error?.message || "Failed to update parcel"
            );
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "An unexpected error occurred";
          console.error("Error updating parcel:", error);
          set({ error: errorMessage, isUpdating: false });
          toast.error(`Failed to update parcel: ${errorMessage}`);
          return null;
        }
      },

      // Delete parcel
      deleteParcel: async (id: string) => {
        set({ isDeleting: true, error: null });

        try {
          const response = await parcelsApiClient.deleteParcel(id);

          if (response.success) {
            // Remove from list
            const { parcels } = get();
            const updatedList = parcels.filter((parcel) => parcel.id !== id);

            set({
              parcels: updatedList,
              currentParcel: null,
              isDeleting: false,
            });

            toast.success("Parcel deleted successfully");

            // Refresh to get accurate pagination
            get().fetchParcels();

            return true;
          } else {
            throw new Error(
              response.error?.message || "Failed to delete parcel"
            );
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "An unexpected error occurred";
          console.error("Error deleting parcel:", error);
          set({ error: errorMessage, isDeleting: false });
          toast.error(`Failed to delete parcel: ${errorMessage}`);
          return false;
        }
      },

      // Change parcel status
      changeParcelStatus: async (
        id: string,
        data: ChangeParcelStatusRequest
      ) => {
        try {
          const response = await parcelsApiClient.changeParcelStatus(id, data);

          if (response.success && response.data) {
            const updatedParcel = response.data;

            // Update in list
            const { parcels } = get();
            const updatedList = parcels.map((parcel) =>
              parcel.id === id ? updatedParcel : parcel
            );

            set({
              parcels: updatedList,
              currentParcel: updatedParcel,
            });

            toast.success(`Parcel status changed to ${data.statusCode}`);
            return true;
          } else {
            throw new Error(
              response.error?.message || "Failed to change parcel status"
            );
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "An unexpected error occurred";
          console.error("Error changing parcel status:", error);
          toast.error(`Failed to change status: ${errorMessage}`);
          return false;
        }
      },

      // Update payment status
      updatePaymentStatus: async (
        id: string,
        paymentStatus: string,
        comment?: string
      ) => {
        try {
          const response = await parcelsApiClient.updatePaymentStatus(
            id,
            paymentStatus,
            comment
          );

          if (response.success && response.data) {
            const updatedParcel = response.data;

            // Update in list
            const { parcels } = get();
            const updatedList = parcels.map((parcel) =>
              parcel.id === id ? updatedParcel : parcel
            );

            set({
              parcels: updatedList,
              currentParcel: updatedParcel,
            });

            toast.success(`Payment status updated to ${paymentStatus}`);
            return true;
          } else {
            throw new Error(
              response.error?.message || "Failed to update payment status"
            );
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "An unexpected error occurred";
          console.error("Error updating payment status:", error);
          toast.error(`Failed to update payment status: ${errorMessage}`);
          return false;
        }
      },

      // Fetch pickup ready parcels
      fetchPickupReadyParcels: async () => {
        const { filters } = get();
        set({ isLoading: true, error: null });

        try {
          const response = await parcelsApiClient.getPickupReadyParcels(
            filters
          );

          if (response.success && response.data) {
            set({
              parcels: response.data.data,
              pagination: response.data.meta,
              isLoading: false,
            });
          }
        } catch (error) {
          console.error("Error fetching pickup ready parcels:", error);
          toast.error("Failed to fetch pickup ready parcels");
          set({ isLoading: false });
        }
      },

      // Fetch parcels by status
      fetchParcelsByStatus: async (statusCode: string) => {
        const { filters } = get();
        set({ isLoading: true, error: null });

        try {
          const response = await parcelsApiClient.getParcelsByStatus(
            statusCode,
            filters
          );

          if (response.success && response.data) {
            set({
              parcels: response.data.data,
              pagination: response.data.meta,
              isLoading: false,
            });
          }
        } catch (error) {
          console.error("Error fetching parcels by status:", error);
          toast.error("Failed to fetch parcels by status");
          set({ isLoading: false });
        }
      },

      // Search parcels by phone
      searchParcelsByPhone: async (phone: string) => {
        const { filters } = get();
        set({ isLoading: true, error: null });

        try {
          const response = await parcelsApiClient.searchParcelsByPhone(
            phone,
            filters
          );

          if (response.success && response.data) {
            set({
              parcels: response.data.data,
              pagination: response.data.meta,
              isLoading: false,
            });
          }
        } catch (error) {
          console.error("Error searching parcels by phone:", error);
          toast.error("Failed to search parcels by phone");
          set({ isLoading: false });
        }
      },

      // Bulk action
      bulkAction: async (data: BulkParcelActionRequest) => {
        set({ isLoading: true, error: null });

        try {
          const response = await parcelsApiClient.bulkAction(data);

          if (response.success && response.data) {
            toast.success(
              `Bulk action completed: ${response.data.success} successful, ${response.data.failed} failed`
            );

            if (response.data.failed > 0) {
              toast.warning(
                `${response.data.failed} parcels could not be processed`
              );
            }

            // Clear selection and refresh
            set({ selectedIds: [], isLoading: false });
            get().fetchParcels();

            return response.data;
          } else {
            throw new Error(
              response.error?.message || "Failed to perform bulk action"
            );
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "An unexpected error occurred";
          console.error("Error performing bulk action:", error);
          set({ error: errorMessage, isLoading: false });
          toast.error(`Failed to perform bulk action: ${errorMessage}`);
          return null;
        }
      },

      // Bulk change status
      bulkChangeStatus: async (
        parcelIds: string[],
        statusCode: string,
        comment?: string
      ) => {
        try {
          const response = await parcelsApiClient.bulkChangeStatus(
            parcelIds,
            statusCode,
            comment
          );

          if (response.success && response.data) {
            toast.success(
              `${response.data.success} parcels status changed successfully`
            );

            if (response.data.failed > 0) {
              toast.warning(
                `${response.data.failed} parcels could not be updated`
              );
            }

            // Clear selection and refresh
            set({ selectedIds: [] });
            get().fetchParcels();

            return true;
          } else {
            throw new Error(
              response.error?.message || "Failed to change parcels status"
            );
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "An unexpected error occurred";
          console.error("Error changing parcels status:", error);
          toast.error(`Failed to change status: ${errorMessage}`);
          return false;
        }
      },

      // Bulk delete parcels
      bulkDeleteParcels: async (parcelIds: string[]) => {
        set({ isDeleting: true, error: null });

        try {
          const response = await parcelsApiClient.bulkDeleteParcels(parcelIds);

          if (response.success && response.data) {
            toast.success(
              `${response.data.success} parcels deleted successfully`
            );

            if (response.data.failed > 0) {
              toast.warning(
                `${response.data.failed} parcels could not be deleted`
              );
            }

            // Clear selection and refresh
            set({ selectedIds: [], isDeleting: false });
            get().fetchParcels();

            return true;
          } else {
            throw new Error(
              response.error?.message || "Failed to delete parcels"
            );
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "An unexpected error occurred";
          console.error("Error bulk deleting parcels:", error);
          set({ error: errorMessage, isDeleting: false });
          toast.error(`Failed to delete parcels: ${errorMessage}`);
          return false;
        }
      },

      // Fetch statistics
      fetchStatistics: async () => {
        try {
          const response = await parcelsApiClient.getParcelStatistics();

          if (response.success && response.data) {
            set({ statistics: response.data });
          } else {
            throw new Error(
              response.error?.message || "Failed to fetch statistics"
            );
          }
        } catch (error) {
          console.error("Error fetching parcel statistics:", error);
        }
      },

      fetchParcelHistory: async (id: string) => {
        set({ isLoadingHistory: true, error: null });

        try {
          const response = await parcelsApiClient.getParcelHistory(id);

          if (response.success && response.data) {
            set({
              parcelHistory: response.data,
              isLoadingHistory: false,
            });
          } else {
            throw new Error(
              response.error?.message || "Failed to fetch parcel history"
            );
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "An unexpected error occurred";
          console.error("Error fetching parcel history:", error);
          set({
            error: errorMessage,
            isLoadingHistory: false,
            parcelHistory: [],
          });
          toast.error("Failed to fetch parcel history");
        }
      },

      // Utility methods
      getParcelById: (id: string) => {
        const { parcels } = get();
        return parcels.find((parcel) => parcel.id === id);
      },

      getParcelsByStatus: (statusCode: string) => {
        const { parcels } = get();
        return parcels.filter(
          (parcel) => parcel.parcelStatusCode === statusCode
        );
      },

      resetState: () => {
        set({
          parcels: [],
          myParcels: [],
          currentParcel: null,
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
      name: "parcels-store",
      partialize: (state) => ({
        filters: state.filters,
        pagination: state.pagination,
        // Don't persist loading states or selections
      }),
      version: 1,
    }
  )
);
