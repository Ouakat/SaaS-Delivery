// /lib/stores/payments/factures.store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { facturesApiClient } from "@/lib/api/clients/payments/factures.client";
import type {
  Facture,
  CreateFactureRequest,
  UpdateFactureRequest,
  FactureFilters,
  FactureStatistics,
  FactureStatus,
  PaginatedFacturesResponse,
} from "@/lib/types/payments/factures.types";
import { toast } from "sonner";

interface FacturesState {
  // Core state
  factures: Facture[];
  currentFacture: Facture | null;
  statistics: FactureStatistics | null;

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
  filters: FactureFilters;
  selectedIds: string[];

  // Actions
  setFilters: (filters: Partial<FactureFilters>) => void;
  clearFilters: () => void;
  setSelectedIds: (ids: string[]) => void;
  clearSelectedIds: () => void;

  // API Actions
  fetchFactures: () => Promise<void>;
  fetchMyFactures: () => Promise<void>;
  fetchFactureById: (id: string) => Promise<Facture | null>;
  createFacture: (data: CreateFactureRequest) => Promise<Facture | null>;
  updateFacture: (id: string, data: UpdateFactureRequest) => Promise<Facture | null>;
  deleteFacture: (id: string) => Promise<boolean>;
  changeFactureStatus: (id: string, status: FactureStatus) => Promise<boolean>;
  
  // Bulk operations
  bulkDeleteFactures: (ids: string[]) => Promise<boolean>;
  bulkChangeStatus: (ids: string[], status: FactureStatus) => Promise<boolean>;
  
  // Statistics
  fetchStatistics: () => Promise<void>;
  
  // Export
  exportFactures: (format: 'excel' | 'pdf') => Promise<void>;
  
  // Utility
  resetState: () => void;
  clearError: () => void;
}

const DEFAULT_FILTERS: FactureFilters = {
  page: 1,
  limit: 10,
  search: "",
  status: undefined,
  clientId: undefined,
  startDate: undefined,
  endDate: undefined,
//   sortBy: "createdAt",
//   sortOrder: "desc",
};

const DEFAULT_PAGINATION = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
  hasNext: false,
  hasPrev: false,
};

export const useFacturesStore = create<FacturesState>()(
  persist(
    (set, get) => ({
      // Initial state
      factures: [],
      currentFacture: null,
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
        get().fetchFactures();
      },

      clearFilters: () => {
        set({ filters: DEFAULT_FILTERS });
        get().fetchFactures();
      },

      setSelectedIds: (ids) => set({ selectedIds: ids }),
      clearSelectedIds: () => set({ selectedIds: [] }),

      // Fetch factures
      fetchFactures: async () => {
        const { filters } = get();
        set({ isLoading: true, error: null });

        try {
            const cleanFilters = {
                page: filters.page,
                limit: filters.limit,
                search: filters.search || undefined,
                status: filters.status || undefined,
                clientId: filters.clientId || undefined,
                startDate: filters.startDate || undefined,
                endDate: filters.endDate || undefined,
                //sortBy: filters.sortBy || undefined,
              };

              // أزل الحقول الفارغة
            Object.keys(cleanFilters).forEach(key => {
                if (cleanFilters[key] === undefined || cleanFilters[key] === "") {
                delete cleanFilters[key];
                }
            });


            // بيانات تجريبية مؤقتة
            // const mockData = {
            //     data: [
            //     {
            //         id: "1",
            //         reference: "FCT-200925-0142430-21-296",
            //         clientId: "101",
            //         clientName: "CLIENT PASS",
            //         clientCode: "GERIE - (101)",
            //         totalAmount: 81,
            //         status: "PAID" as FactureStatus,
            //         colisCount: 1,
            //         createdAt: "2025-09-20T13:12:00",
            //         // باقي الحقول
            //     }
            //     ],
            //     meta: {
            //     page: 1,
            //     limit: 10,
            //     total: 5,
            //     totalPages: 1,
            //     hasNext: false,
            //     hasPrev: false
            //     }
            // };
        
            // set({
            //     factures: mockData.data,
            //     pagination: mockData.meta,
            //     isLoading: false,
            // });

          const response = await facturesApiClient.getFactures(cleanFilters);
          if (response.success) {
            const responseData = response.data;
            
            // استخراج البيانات الصحيحة
            const factures = responseData?.data || [];
            const meta = responseData?.meta || DEFAULT_PAGINATION;
            
            set({
              factures: factures,
              pagination: meta,
              isLoading: false,
            });
          } else {
            throw new Error("Failed to fetch factures");
          }
        } catch (error) {
            set({ 
                error: "Failed to fetch factures", 
                isLoading: false,
                factures: [],
                pagination: DEFAULT_PAGINATION 
              });
          toast.error("Failed to fetch factures");
        }
      },

      fetchMyFactures: async () => {
        const { filters } = get();
        set({ isLoading: true, error: null });

        try {
          const response = await facturesApiClient.getMyFactures(filters);
          if (response.success && response.data) {
            set({
              factures: response.data.data,
              pagination: response.data.meta,
              isLoading: false,
            });
          }
        } catch (error) {
          set({ error: "Failed to fetch your factures", isLoading: false });
          toast.error("Failed to fetch your factures");
        }
      },

      fetchFactureById: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await facturesApiClient.getFactureById(id);
          if (response.success && response.data) {
            set({ currentFacture: response.data, isLoading: false });
            return response.data;
          }
          return null;
        } catch (error) {
          set({ error: "Failed to fetch facture details", isLoading: false });
          toast.error("Failed to fetch facture details");
          return null;
        }
      },

      createFacture: async (data) => {
        set({ isCreating: true, error: null });

        try {
          const response = await facturesApiClient.createFacture(data);
          if (response.success && response.data) {
            toast.success("Facture created successfully");
            get().fetchFactures();
            return response.data;
          }
          return null;
        } catch (error) {
          set({ error: "Failed to create facture", isCreating: false });
          toast.error("Failed to create facture");
          return null;
        }
      },

      updateFacture: async (id, data) => {
        set({ isUpdating: true, error: null });

        try {
          const response = await facturesApiClient.updateFacture(id, data);
          if (response.success && response.data) {
            toast.success("Facture updated successfully");
            get().fetchFactures();
            return response.data;
          }
          return null;
        } catch (error) {
          set({ error: "Failed to update facture", isUpdating: false });
          toast.error("Failed to update facture");
          return null;
        }
      },

      deleteFacture: async (id) => {
        set({ isDeleting: true, error: null });

        try {
          const response = await facturesApiClient.deleteFacture(id);
          if (response.success) {
            toast.success("Facture deleted successfully");
            get().fetchFactures();
            return true;
          }
          return false;
        } catch (error) {
          set({ error: "Failed to delete facture", isDeleting: false });
          toast.error("Failed to delete facture");
          return false;
        }
      },

      changeFactureStatus: async (id, status) => {
        try {
          const response = await facturesApiClient.changeFactureStatus(id, status);
          if (response.success) {
            toast.success(`Facture status changed to ${status}`);
            get().fetchFactures();
            return true;
          }
          return false;
        } catch (error) {
          toast.error("Failed to change facture status");
          return false;
        }
      },

      bulkDeleteFactures: async (ids) => {
        set({ isDeleting: true, error: null });

        try {
          const response = await facturesApiClient.bulkDeleteFactures(ids);
          if (response.success) {
            toast.success(`${ids.length} factures deleted successfully`);
            set({ selectedIds: [], isDeleting: false });
            get().fetchFactures();
            return true;
          }
          return false;
        } catch (error) {
          set({ error: "Failed to delete factures", isDeleting: false });
          toast.error("Failed to delete factures");
          return false;
        }
      },

      bulkChangeStatus: async (ids, status) => {
        try {
          const response = await facturesApiClient.bulkChangeStatus(ids, status);
          if (response.success) {
            toast.success(`${ids.length} factures status changed to ${status}`);
            set({ selectedIds: [] });
            get().fetchFactures();
            return true;
          }
          return false;
        } catch (error) {
          toast.error("Failed to change factures status");
          return false;
        }
      },

      fetchStatistics: async () => {
        try {
          // إذا لم يكن هناك endpoint للإحصائيات، استخدم بيانات مؤقتة
          set({ 
            statistics: {
              totalFactures: 0,
              totalAmount: 0,
              paidAmount: 0,
              pendingAmount: 0,
              overdueAmount: 0,
              facturesByStatus: {},
              monthlyRevenue: [],
              topClients: []
            }
          });
        } catch (error) {
          console.error("Failed to fetch statistics:", error);
        }
      },

      exportFactures: async (format) => {
        try {
          const { filters } = get();
          const response = await facturesApiClient.exportFactures(filters, format);
          if (response.success && response.data) {
            window.open(response.data.downloadUrl, '_blank');
            toast.success(`Factures exported to ${format.toUpperCase()}`);
          }
        } catch (error) {
          toast.error(`Failed to export factures to ${format}`);
        }
      },

      resetState: () => {
        set({
          factures: [],
          currentFacture: null,
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
      name: "factures-store",
      partialize: (state) => ({
        filters: state.filters,
        pagination: state.pagination,
      }),
      version: 1,
    }
  )
);