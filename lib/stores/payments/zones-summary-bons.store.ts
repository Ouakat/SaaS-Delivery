// /lib/stores/payments/zones-summary-bons.store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ZoneSummary {
  id: string;
  zone: string;
  ordersDelivered: number;
  ordersReturned: number;
  ordersRefused: number;
  ordersPending: number;
  totalOrders: number;
}

interface ZonesSummaryBonsState {
  zones: ZoneSummary[];
  isLoading: boolean;
  error: string | null;
  statistics: any;
  
  fetchZonesSummary: () => Promise<void>;
  fetchStatistics: () => Promise<void>;
  exportData: (format: 'excel' | 'pdf') => Promise<void>;
}

export const useZonesSummaryBonsStore = create<ZonesSummaryBonsState>()(
  persist(
    (set, get) => ({
      zones: [],
      isLoading: false,
      error: null,
      statistics: null,

      fetchZonesSummary: async () => {
        set({ isLoading: true, error: null });
        
        try {
          // Mock data
          const mockData: ZoneSummary[] = [
            { 
              id: "1", 
              zone: "HUB CASABLANCA", 
              ordersDelivered: 145,
              ordersReturned: 22,
              ordersRefused: 8,
              ordersPending: 35,
              totalOrders: 210
            },
            { 
              id: "2", 
              zone: "HUB TANGER", 
              ordersDelivered: 98,
              ordersReturned: 15,
              ordersRefused: 5,
              ordersPending: 22,
              totalOrders: 140
            },
            { 
              id: "3", 
              zone: "HUB RABAT", 
              ordersDelivered: 76,
              ordersReturned: 10,
              ordersRefused: 3,
              ordersPending: 16,
              totalOrders: 105
            },
            { 
              id: "4", 
              zone: "HUB MARRAKECH", 
              ordersDelivered: 62,
              ordersReturned: 8,
              ordersRefused: 2,
              ordersPending: 13,
              totalOrders: 85
            }
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
        
        const totalDelivered = zones.reduce((sum, z) => sum + z.ordersDelivered, 0);
        const totalRefused = zones.reduce((sum, z) => sum + z.ordersRefused, 0);
        const totalPending = zones.reduce((sum, z) => sum + z.ordersPending, 0);
        const totalOrders = zones.reduce((sum, z) => sum + z.totalOrders, 0);
        
        const stats = {
          totalZones: zones.length,
          totalDelivered,
          totalRefused,
          totalPending,
          globalSuccessRate: totalOrders > 0 
            ? ((totalDelivered / totalOrders) * 100).toFixed(1)
            : "0"
        };
        
        set({ statistics: stats });
      },

      exportData: async (format) => {
        console.log(`Exporting zones summary as ${format}`);
      },
    }),
    {
      name: "zones-summary-bons-store",
      version: 1,
    }
  )
);