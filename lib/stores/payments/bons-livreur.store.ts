// /lib/stores/payments/bons-livreur.store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface BonLivreur {
  id: string;
  reference: string;
  createdDate: string;
  statusChangeDate?: string;
  zone: string;
  livreur: string;
  status: string;
  colisCount: number;
  totalAmount: number;
  livreAmount: number;
  retourAmount: number;
  refuseAmount: number;
}

interface BonsLivreurState {
  bonsLivreur: BonLivreur[];
  isLoading: boolean;
  error: string | null;
  filters: any;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  statistics: any;
  
  fetchBonsLivreur: () => Promise<void>;
  fetchStatistics: () => Promise<void>;
  setFilters: (filters: any) => void;
  exportBons: (filters: any) => Promise<void>;
  generateBon: (id: string) => Promise<void>;
}

const DEFAULT_PAGINATION = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
};

export const useBonsLivreurStore = create<BonsLivreurState>()(
  persist(
    (set, get) => ({
      bonsLivreur: [],
      isLoading: false,
      error: null,
      filters: {},
      pagination: DEFAULT_PAGINATION,
      statistics: null,

      fetchBonsLivreur: async () => {
        set({ isLoading: true });
        
        // Mock data
        const mockData: BonLivreur[] = [
          {
            id: "1",
            reference: "BPL-200925-0301620-16-197",
            createdDate: "2025-09-20 13:05",
            zone: "HUB CASABLANCA",
            livreur: "AGENCE AIN BARJA",
            status: "Attente",
            colisCount: 1,
            totalAmount: 100,
            livreAmount: 191,
            retourAmount: 0,
            refuseAmount: 0,
          },
          {
            id: "2",
            reference: "BPL-200925-0301610-91-491",
            createdDate: "2025-09-20 01:30",
            statusChangeDate: "2025-09-20 08:33",
            zone: "HUB TANGER",
            livreur: "Nabil TNG",
            status: "En Cours",
            colisCount: 11,
            totalAmount: 2788,
            livreAmount: 0,
            retourAmount: 0,
            refuseAmount: 0,
          },
          {
            id: "3",
            reference: "BPL-200925-0301600-73-490",
            createdDate: "2025-09-20 01:30",
            statusChangeDate: "2025-09-20 09:28",
            zone: "HUB CASABLANCA",
            livreur: "Fouad Rampouz",
            status: "Payé",
            colisCount: 13,
            totalAmount: 2572,
            livreAmount: 4669,
            retourAmount: 1969,
            refuseAmount: 0,
          },
        ];
        
        set({ 
          bonsLivreur: mockData,
          pagination: {
            ...DEFAULT_PAGINATION,
            total: mockData.length,
            totalPages: Math.ceil(mockData.length / 10),
          },
          isLoading: false 
        });
      },

      fetchStatistics: async () => {
        set({
          statistics: {
            totalBons: 3,
            pendingBons: 1,
            totalAmount: 5460,
            totalLivreurs: 3,
            totalZones: 2,
          }
        });
      },

      setFilters: (filters) => {
        set({ filters });
        get().fetchBonsLivreur();
      },

      exportBons: async (filters) => {
        // Implement export logic
        console.log("Exporting with filters:", filters);
      },

      generateBon: async (id) => {
        // Implement PDF generation
        console.log("Generating PDF for bon:", id);
      },
    }),
    {
      name: "bons-livreur-store",
      version: 1,
    }
  )
);