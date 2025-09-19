import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { optionsApiClient } from "@/lib/api/clients/settings/options.client";
import { toast } from "sonner";
import type {
  ParcelStatus,
  ClientType,
  Bank,
  CreateParcelStatusRequest,
  UpdateParcelStatusRequest,
  CreateClientTypeRequest,
  UpdateClientTypeRequest,
  CreateBankRequest,
  UpdateBankRequest,
  ParcelStatusFilters,
  ClientTypeFilters,
  BankFilters,
  OptionStats,
} from "@/lib/types/settings/options.types";

interface OptionsState {
  // Parcel Statuses
  parcelStatuses: ParcelStatus[];
  parcelStatusesLoading: boolean;
  parcelStatusesFilters: ParcelStatusFilters;

  // Client Types
  clientTypes: ClientType[];
  clientTypesLoading: boolean;
  clientTypesFilters: ClientTypeFilters;

  // Banks
  banks: Bank[];
  banksLoading: boolean;
  banksFilters: BankFilters;

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

  // Actions - Client Types
  fetchClientTypes: () => Promise<void>;
  createClientType: (data: CreateClientTypeRequest) => Promise<boolean>;
  updateClientType: (
    id: string,
    data: UpdateClientTypeRequest
  ) => Promise<boolean>;
  deleteClientType: (id: string) => Promise<boolean>;
  toggleClientTypeStatus: (id: string) => Promise<boolean>;
  setClientTypesFilters: (filters: Partial<ClientTypeFilters>) => void;
  bulkDeleteClientTypes: (ids: string[]) => Promise<boolean>;
  bulkToggleClientTypes: (ids: string[]) => Promise<boolean>;

  // Actions - Banks
  fetchBanks: () => Promise<void>;
  createBank: (data: CreateBankRequest) => Promise<boolean>;
  updateBank: (id: string, data: UpdateBankRequest) => Promise<boolean>;
  deleteBank: (id: string) => Promise<boolean>;
  toggleBankStatus: (id: string) => Promise<boolean>;
  setBanksFilters: (filters: Partial<BankFilters>) => void;
  bulkDeleteBanks: (ids: string[]) => Promise<boolean>;
  bulkToggleBanks: (ids: string[]) => Promise<boolean>;

  // Actions - Stats
  fetchStats: () => Promise<void>;

  // Utility Actions
  clearError: () => void;
  refreshAll: () => Promise<void>;
}

export const useOptionsStore = create<OptionsState>()(
  devtools(
    (set, get) => ({
      // Initial State
      parcelStatuses: [],
      parcelStatusesLoading: false,
      parcelStatusesFilters: { page: 1, limit: 10 },

      clientTypes: [],
      clientTypesLoading: false,
      clientTypesFilters: { page: 1, limit: 10 },

      banks: [],
      banksLoading: false,
      banksFilters: { page: 1, limit: 10 },

      stats: null,
      statsLoading: false,
      error: null,

      // Parcel Statuses Actions
      fetchParcelStatuses: async () => {
        set({ parcelStatusesLoading: true, error: null });
        try {
          const response = await optionsApiClient.getParcelStatuses(
            get().parcelStatusesFilters
          );
          if (response.success && response.data) {
            set({ parcelStatuses: response.data });
          } else {
            throw new Error(
              response.error?.message || "Failed to fetch parcel statuses"
            );
          }
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Unknown error";
          set({ error: message });
          toast.error(message);
        } finally {
          set({ parcelStatusesLoading: false });
        }
      },

      createParcelStatus: async (data: CreateParcelStatusRequest) => {
        try {
          const response = await optionsApiClient.createParcelStatus(data);
          if (response.success) {
            await get().fetchParcelStatuses();
            toast.success("Parcel status created successfully");
            return true;
          } else {
            throw new Error(
              response.error?.message || "Failed to create parcel status"
            );
          }
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Unknown error";
          set({ error: message });
          toast.error(message);
          return false;
        }
      },

      updateParcelStatus: async (
        id: string,
        data: UpdateParcelStatusRequest
      ) => {
        try {
          const response = await optionsApiClient.updateParcelStatus(id, data);
          if (response.success) {
            await get().fetchParcelStatuses();
            toast.success("Parcel status updated successfully");
            return true;
          } else {
            throw new Error(
              response.error?.message || "Failed to update parcel status"
            );
          }
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Unknown error";
          set({ error: message });
          toast.error(message);
          return false;
        }
      },

      deleteParcelStatus: async (id: string) => {
        try {
          const response = await optionsApiClient.deleteParcelStatus(id);
          if (response.success) {
            await get().fetchParcelStatuses();
            toast.success("Parcel status deleted successfully");
            return true;
          } else {
            throw new Error(
              response.error?.message || "Failed to delete parcel status"
            );
          }
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Unknown error";
          set({ error: message });
          toast.error(message);
          return false;
        }
      },

      toggleParcelStatusStatus: async (id: string) => {
        try {
          const response = await optionsApiClient.toggleParcelStatusStatus(id);
          if (response.success) {
            await get().fetchParcelStatuses();
            toast.success("Parcel status status toggled");
            return true;
          } else {
            throw new Error(
              response.error?.message || "Failed to toggle status"
            );
          }
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Unknown error";
          toast.error(message);
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
          const response = await optionsApiClient.bulkDeleteParcelStatuses(ids);
          if (response.success) {
            await get().fetchParcelStatuses();
            toast.success(
              `${response.data?.successful || 0} parcel statuses deleted`
            );
            return true;
          } else {
            throw new Error("Bulk delete failed");
          }
        } catch (error) {
          toast.error("Failed to delete selected parcel statuses");
          return false;
        }
      },

      bulkToggleParcelStatuses: async (ids: string[]) => {
        try {
          const response = await optionsApiClient.bulkToggleParcelStatuses(ids);
          if (response.success) {
            await get().fetchParcelStatuses();
            toast.success(
              `${response.data?.successful || 0} parcel statuses updated`
            );
            return true;
          } else {
            throw new Error("Bulk toggle failed");
          }
        } catch (error) {
          toast.error("Failed to toggle selected parcel statuses");
          return false;
        }
      },

      // Client Types Actions
      fetchClientTypes: async () => {
        set({ clientTypesLoading: true, error: null });
        try {
          const response = await optionsApiClient.getClientTypes(
            get().clientTypesFilters
          );
          if (response.success && response.data) {
            set({ clientTypes: response.data });
          } else {
            throw new Error(
              response.error?.message || "Failed to fetch client types"
            );
          }
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Unknown error";
          set({ error: message });
          toast.error(message);
        } finally {
          set({ clientTypesLoading: false });
        }
      },

      createClientType: async (data: CreateClientTypeRequest) => {
        try {
          const response = await optionsApiClient.createClientType(data);
          if (response.success) {
            await get().fetchClientTypes();
            toast.success("Client type created successfully");
            return true;
          } else {
            throw new Error(
              response.error?.message || "Failed to create client type"
            );
          }
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Unknown error";
          set({ error: message });
          toast.error(message);
          return false;
        }
      },

      updateClientType: async (id: string, data: UpdateClientTypeRequest) => {
        try {
          const response = await optionsApiClient.updateClientType(id, data);
          if (response.success) {
            await get().fetchClientTypes();
            toast.success("Client type updated successfully");
            return true;
          } else {
            throw new Error(
              response.error?.message || "Failed to update client type"
            );
          }
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Unknown error";
          set({ error: message });
          toast.error(message);
          return false;
        }
      },

      deleteClientType: async (id: string) => {
        try {
          const response = await optionsApiClient.deleteClientType(id);
          if (response.success) {
            await get().fetchClientTypes();
            toast.success("Client type deleted successfully");
            return true;
          } else {
            throw new Error(
              response.error?.message || "Failed to delete client type"
            );
          }
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Unknown error";
          set({ error: message });
          toast.error(message);
          return false;
        }
      },

      toggleClientTypeStatus: async (id: string) => {
        try {
          const response = await optionsApiClient.toggleClientTypeStatus(id);
          if (response.success) {
            await get().fetchClientTypes();
            toast.success("Client type status toggled");
            return true;
          } else {
            throw new Error(
              response.error?.message || "Failed to toggle status"
            );
          }
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Unknown error";
          toast.error(message);
          return false;
        }
      },

      setClientTypesFilters: (filters: Partial<ClientTypeFilters>) => {
        set((state) => ({
          clientTypesFilters: { ...state.clientTypesFilters, ...filters },
        }));
      },

      bulkDeleteClientTypes: async (ids: string[]) => {
        try {
          const response = await optionsApiClient.bulkDeleteClientTypes(ids);
          if (response.success) {
            await get().fetchClientTypes();
            toast.success(
              `${response.data?.successful || 0} client types deleted`
            );
            return true;
          } else {
            throw new Error("Bulk delete failed");
          }
        } catch (error) {
          toast.error("Failed to delete selected client types");
          return false;
        }
      },

      bulkToggleClientTypes: async (ids: string[]) => {
        try {
          const response = await optionsApiClient.bulkToggleClientTypes(ids);
          if (response.success) {
            await get().fetchClientTypes();
            toast.success(
              `${response.data?.successful || 0} client types updated`
            );
            return true;
          } else {
            throw new Error("Bulk toggle failed");
          }
        } catch (error) {
          toast.error("Failed to toggle selected client types");
          return false;
        }
      },

      // Banks Actions
      fetchBanks: async () => {
        set({ banksLoading: true, error: null });
        try {
          const response = await optionsApiClient.getBanks(get().banksFilters);
          if (response.success && response.data) {
            set({ banks: response.data });
          } else {
            throw new Error(response.error?.message || "Failed to fetch banks");
          }
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Unknown error";
          set({ error: message });
          toast.error(message);
        } finally {
          set({ banksLoading: false });
        }
      },

      createBank: async (data: CreateBankRequest) => {
        try {
          const response = await optionsApiClient.createBank(data);
          if (response.success) {
            await get().fetchBanks();
            toast.success("Bank created successfully");
            return true;
          } else {
            throw new Error(response.error?.message || "Failed to create bank");
          }
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Unknown error";
          set({ error: message });
          toast.error(message);
          return false;
        }
      },

      updateBank: async (id: string, data: UpdateBankRequest) => {
        try {
          const response = await optionsApiClient.updateBank(id, data);
          if (response.success) {
            await get().fetchBanks();
            toast.success("Bank updated successfully");
            return true;
          } else {
            throw new Error(response.error?.message || "Failed to update bank");
          }
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Unknown error";
          set({ error: message });
          toast.error(message);
          return false;
        }
      },

      deleteBank: async (id: string) => {
        try {
          const response = await optionsApiClient.deleteBank(id);
          if (response.success) {
            await get().fetchBanks();
            toast.success("Bank deleted successfully");
            return true;
          } else {
            throw new Error(response.error?.message || "Failed to delete bank");
          }
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Unknown error";
          set({ error: message });
          toast.error(message);
          return false;
        }
      },

      toggleBankStatus: async (id: string) => {
        try {
          const response = await optionsApiClient.toggleBankStatus(id);
          if (response.success) {
            await get().fetchBanks();
            toast.success("Bank status toggled");
            return true;
          } else {
            throw new Error(
              response.error?.message || "Failed to toggle status"
            );
          }
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Unknown error";
          toast.error(message);
          return false;
        }
      },

      setBanksFilters: (filters: Partial<BankFilters>) => {
        set((state) => ({
          banksFilters: { ...state.banksFilters, ...filters },
        }));
      },

      bulkDeleteBanks: async (ids: string[]) => {
        try {
          const response = await optionsApiClient.bulkDeleteBanks(ids);
          if (response.success) {
            await get().fetchBanks();
            toast.success(`${response.data?.successful || 0} banks deleted`);
            return true;
          } else {
            throw new Error("Bulk delete failed");
          }
        } catch (error) {
          toast.error("Failed to delete selected banks");
          return false;
        }
      },

      bulkToggleBanks: async (ids: string[]) => {
        try {
          const response = await optionsApiClient.bulkToggleBanks(ids);
          if (response.success) {
            await get().fetchBanks();
            toast.success(`${response.data?.successful || 0} banks updated`);
            return true;
          } else {
            throw new Error("Bulk toggle failed");
          }
        } catch (error) {
          toast.error("Failed to toggle selected banks");
          return false;
        }
      },

      // Stats Actions
      fetchStats: async () => {
        set({ statsLoading: true });
        try {
          const response = await optionsApiClient.getOptionsStats();
          if (response.success && response.data) {
            set({ stats: response.data });
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
        await Promise.all([
          get().fetchParcelStatuses(),
          get().fetchClientTypes(),
          get().fetchBanks(),
          get().fetchStats(),
        ]);
      },
    }),
    { name: "options-store" }
  )
);
