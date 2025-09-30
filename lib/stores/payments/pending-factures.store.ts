// /lib/stores/payments/pending-factures.store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { facturesApiClient } from "@/lib/api/clients/payments/factures.client";
import { toast } from "sonner";

interface PendingFacture {
  id: string;
  reference: string;
  clientId: string;
  clientName: string;
  clientCode: string;
  parcelsCount: number;
  totalAmount: number;
  status: "PENDING" | "READY";
  createdAt: string;
  parcels: any[];
}

interface PendingFacturesState {
  pendingFactures: PendingFacture[];
  isLoading: boolean;
  error: string | null;
  filters: any;
  selectedIds: string[];
  statistics: any;
  
  fetchPendingFactures: () => Promise<void>;
  fetchStatistics: () => Promise<void>;
  setFilters: (filters: any) => void;
  setSelectedIds: (ids: string[]) => void;
  clearSelectedIds: () => void;
  resetState: () => void;
}

export const usePendingFacturesStore = create<PendingFacturesState>()(
  persist(
    (set, get) => ({
      pendingFactures: [],
      isLoading: false,
      error: null,
      filters: {},
      selectedIds: [],
      statistics: null,

      fetchPendingFactures: async () => {
        set({ isLoading: true, error: null });
        
        try {
          // Mock data - remplacer par API réel
          const mockData: PendingFacture[] = [
            {
              id: "1",
              reference: "PEND-2025-001",
              clientId: "101",
              clientName: "CLIENT PASS",
              clientCode: "GERIE - (101)",
              parcelsCount: 100,
              totalAmount: 8100,
              status: "PENDING",
              createdAt: "2025-09-20T13:12:00",
              parcels: []
            },
            // Plus de données...
          ];
          
          set({ pendingFactures: mockData, isLoading: false });
        } catch (error) {
          set({ error: "Failed to load", isLoading: false });
        }
      },

      fetchStatistics: async () => {
        set({
          statistics: {
            totalPending: 3,
            totalAmount: 26410,
            totalParcels: 310,
            totalClients: 3
          }
        });
      },

      setFilters: (filters) => {
        set({ filters });
        get().fetchPendingFactures();
      },

      setSelectedIds: (ids) => set({ selectedIds: ids }),
      clearSelectedIds: () => set({ selectedIds: [] }),
      resetState: () => set({ 
        pendingFactures: [], 
        isLoading: false, 
        error: null,
        filters: {},
        selectedIds: [],
        statistics: null 
      }),
    }),
    {
      name: "pending-factures-store",
      version: 1,
    }
  )
);