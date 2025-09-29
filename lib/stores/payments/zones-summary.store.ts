// /lib/stores/payments/zones-summary.store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ZoneSummary {
  id: string;
  zone: string;
  ordersDelivered: number;
  ordersReturned: number;
  ordersRefused: number;
  livreurCount: number;
  totalAmount?: number;
  successRate?: number;
}

interface ZonesSummaryState {
  zones: ZoneSummary[];
  isLoading: boolean;
  error: string | null;
  statistics: any;
  
  fetchZonesSummary: () => Promise<void>;
  fetchStatistics: () => Promise<void>;
  exportData: (format: 'excel' | 'pdf') => Promise<void>;
}

export const useZonesSummaryStore = create<ZonesSummaryState>()(
  persist(
    (set, get) => ({
      zones: [],
      isLoading: false,
      error: null,
      statistics: null,

      fetchZonesSummary: async () => {
        set({ isLoading: true, error: null });
        
        try {
          // Mock data - remplacer par API réel
          const mockData: ZoneSummary[] = [
            { 
              id: "1", 
              zone: "HUB CASABLANCA", 
              ordersDelivered: 245, 
              ordersReturned: 32,
              ordersRefused: 18, 
              livreurCount: 10,
              totalAmount: 45000
            },
            { 
              id: "2", 
              zone: "HUB TANGER", 
              ordersDelivered: 189, 
              ordersReturned: 28,
              ordersRefused: 12, 
              livreurCount: 8,
              totalAmount: 38000
            },
            { 
              id: "3", 
              zone: "HUB RABAT", 
              ordersDelivered: 156, 
              ordersReturned: 22,
              ordersRefused: 9, 
              livreurCount: 6,
              totalAmount: 32000
            },
            { 
              id: "4", 
              zone: "HUB MARRAKECH", 
              ordersDelivered: 134, 
              ordersReturned: 19,
              ordersRefused: 7, 
              livreurCount: 5,
              totalAmount: 28000
            },
            { 
              id: "5", 
              zone: "HUB FES", 
              ordersDelivered: 98, 
              ordersReturned: 15,
              ordersRefused: 5, 
              livreurCount: 4,
              totalAmount: 21000
            },
          ];
          
          set({ 
            zones: mockData,
            isLoading: false 
          });
        } catch (error) {
          set({ 
            error: "Failed to load zones summary", 
            isLoading: false 
          });
        }
      },

      fetchStatistics: async () => {
        const { zones } = get();
        
        const stats = {
          totalZones: zones.length,
          totalDelivered: zones.reduce((sum, z) => sum + z.ordersDelivered, 0),
          totalReturned: zones.reduce((sum, z) => sum + z.ordersReturned, 0),
          totalRefused: zones.reduce((sum, z) => sum + z.ordersRefused, 0),
          totalLivreurs: zones.reduce((sum, z) => sum + z.livreurCount, 0),
          totalAmount: zones.reduce((sum, z) => sum + (z.totalAmount || 0), 0),
        };
        
        set({ statistics: stats });
      },

      exportData: async (format) => {
        // Implement export logic
        console.log(`Exporting zones summary as ${format}`);
      },
    }),
    {
      name: "zones-summary-store",
      version: 1,
    }
  )
);