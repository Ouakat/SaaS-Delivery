// /lib/stores/payments/livreurs-summary.store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface LivreurSummary {
  id: string;
  name: string;
  code?: string;
  phone?: string;
  zone: string;
  zoneId: string;
  ordersDelivered: number;
  ordersReturned: number;
  ordersRefused: number;
  totalAmount: number;
}

interface LivreursSummaryState {
  livreurs: LivreurSummary[];
  isLoading: boolean;
  error: string | null;
  statistics: any;
  searchTerm: string;
  
  setSearchTerm: (term: string) => void;
  fetchLivreursByZone: (zoneId: string) => Promise<void>;
  fetchStatistics: (zoneId: string) => Promise<void>;
  generateBonForLivreur: (livreurId: string) => Promise<void>;
}

export const useLivreursSummaryStore = create<LivreursSummaryState>()(
  persist(
    (set, get) => ({
      livreurs: [],
      isLoading: false,
      error: null,
      statistics: null,
      searchTerm: "",

      setSearchTerm: (term) => set({ searchTerm: term }),

      fetchLivreursByZone: async (zoneId) => {
        set({ isLoading: true, error: null });
        
        try {
          // Mock data - remplacer par API réel
          const mockData: LivreurSummary[] = [
            { 
              id: "1", 
              name: "Ali Mohammed",
              code: "LIV-001",
              phone: "0612345678",
              zone: "HUB CASABLANCA",
              zoneId: zoneId,
              ordersDelivered: 45,
              ordersReturned: 8,
              ordersRefused: 3,
              totalAmount: 12500
            },
            { 
              id: "2", 
              name: "Ahmed Benali",
              code: "LIV-002",
              phone: "0623456789",
              zone: "HUB CASABLANCA",
              zoneId: zoneId,
              ordersDelivered: 38,
              ordersReturned: 5,
              ordersRefused: 2,
              totalAmount: 9800
            },
            { 
              id: "3", 
              name: "Youssef Alami",
              code: "LIV-003",
              phone: "0634567890",
              zone: "HUB CASABLANCA",
              zoneId: zoneId,
              ordersDelivered: 52,
              ordersReturned: 10,
              ordersRefused: 4,
              totalAmount: 15600
            },
            { 
              id: "4", 
              name: "Karim Hassani",
              code: "LIV-004",
              phone: "0645678901",
              zone: "HUB CASABLANCA",
              zoneId: zoneId,
              ordersDelivered: 29,
              ordersReturned: 3,
              ordersRefused: 1,
              totalAmount: 7200
            },
          ];
          
          set({ 
            livreurs: mockData,
            isLoading: false 
          });
        } catch (error) {
          set({ 
            error: "Failed to load livreurs", 
            isLoading: false 
          });
        }
      },

      fetchStatistics: async (zoneId) => {
        const { livreurs } = get();
        
        const stats = {
          totalLivreurs: livreurs.length,
          totalDelivered: livreurs.reduce((sum, l) => sum + l.ordersDelivered, 0),
          totalReturned: livreurs.reduce((sum, l) => sum + l.ordersReturned, 0),
          totalRefused: livreurs.reduce((sum, l) => sum + l.ordersRefused, 0),
          totalAmount: livreurs.reduce((sum, l) => sum + l.totalAmount, 0),
        };
        
        set({ statistics: stats });
      },

      generateBonForLivreur: async (livreurId) => {
        // Implement generation logic
        console.log(`Generating bon for livreur ${livreurId}`);
      },
    }),
    {
      name: "livreurs-summary-store",
      version: 1,
    }
  )
);