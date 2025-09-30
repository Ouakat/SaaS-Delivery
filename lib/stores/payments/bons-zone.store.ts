// /lib/stores/payments/bons-zone.store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface BonZone {
  id: string;
  reference: string;
  createdDate: string;
  statusChangeDate?: string;
  zone: string;
  status: string;
  colisCount: number;
  livreurCount: number;
  total: string;
}

interface BonsZoneState {
  bonsZone: BonZone[];
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
  
  fetchBonsZone: () => Promise<void>;
  fetchStatistics: () => Promise<void>;
  setFilters: (filters: any) => void;
  generateBon: (id: string) => Promise<void>;
}

const DEFAULT_PAGINATION = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
};

export const useBonsZoneStore = create<BonsZoneState>()(
  persist(
    (set, get) => ({
      bonsZone: [],
      isLoading: false,
      error: null,
      filters: {},
      pagination: DEFAULT_PAGINATION,
      statistics: null,

      fetchBonsZone: async () => {
        set({ isLoading: true });
        
        // Mock data
        const mockData: BonZone[] = [
          {
            id: "1",
            reference: "BPZ-200925-0301620-16-197",
            createdDate: "2025-09-20 13:05",
            zone: "HUB CASABLANCA",
            status: "Attente De Paiement",
            colisCount: 45,
            livreurCount: 5,
            total: "12500 DH"
          },
          {
            id: "2",
            reference: "BPZ-200925-0301610-91-491",
            createdDate: "2025-09-20 01:30",
            statusChangeDate: "2025-09-20 08:33",
            zone: "HUB TANGER",
            status: "En Cours de Traitement",
            colisCount: 112,
            livreurCount: 8,
            total: "28800 DH"
          },
          {
            id: "3",
            reference: "BPZ-200925-0301600-73-490",
            createdDate: "2025-09-20 01:30",
            statusChangeDate: "2025-09-20 09:28",
            zone: "HUB RABAT",
            status: "Payé",
            colisCount: 87,
            livreurCount: 6,
            total: "25720 DH"
          }
        ];
        
        set({ 
          bonsZone: mockData,
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
            totalZones: 3,
            pendingBons: 1,
            totalColis: 244,
            totalAmount: 67020
          }
        });
      },

      setFilters: (filters) => {
        set({ filters });
        get().fetchBonsZone();
      },

      generateBon: async (id) => {
        console.log("Generating PDF for bon:", id);
      },
    }),
    {
      name: "bons-zone-store",
      version: 1,
    }
  )
);