// /lib/stores/payments/zone-details.store.ts
import { create } from "zustand";

interface Order {
  id: string;
  code: string;
  client: string;
  clientCode: string;
  phone: string;
  date: string;
  status: string;
  city: string;
  livreur?: string;
  amount: number;
  totalPrice: number;
  selected?: boolean;
}

interface ZoneInfo {
  id: string;
  name: string;
  totalLivreurs: number;
  totalOrders: number;
}

interface ZoneDetailsState {
  zoneInfo: ZoneInfo | null;
  availableOrders: Order[];
  addedOrders: Order[];
  isLoading: boolean;
  filters: {
    search: string;
    city?: string;
    livreur?: string;
    status?: string;
  };
  
  fetchZoneDetails: (zoneId: string) => Promise<void>;
  setFilters: (filters: Partial<ZoneDetailsState['filters']>) => void;
  selectOrder: (orderId: string) => void;
  selectAllOrders: () => void;
  addSelectedOrders: () => void;
  removeFromAdded: (orderId: string) => void;
  generateBon: (data: any) => Promise<void>;
}

export const useZoneDetailsStore = create<ZoneDetailsState>((set, get) => ({
  zoneInfo: null,
  availableOrders: [],
  addedOrders: [],
  isLoading: false,
  filters: {
    search: "",
  },

  fetchZoneDetails: async (zoneId) => {
    set({ isLoading: true });
    
    // Mock data
    const mockZone: ZoneInfo = {
      id: zoneId,
      name: "HUB CASABLANCA",
      totalLivreurs: 12,
      totalOrders: 150
    };

    const mockOrders: Order[] = [
      {
        id: "1",
        code: "CMD-150920251048357621",
        client: "Aliexpress",
        clientCode: "(841)",
        phone: "0650094257",
        date: "2025-09-18 09:39",
        status: "Livré",
        city: "Casablanca",
        livreur: "Hassan",
        amount: 345,
        totalPrice: 335,
        selected: false
      },
      {
        id: "2",
        code: "CMD-150920251048357622",
        client: "Amazon",
        clientCode: "(542)",
        phone: "0661234567",
        date: "2025-09-18 10:15",
        status: "Livré",
        city: "Rabat",
        livreur: "Ali",
        amount: 580,
        totalPrice: 560,
        selected: false
      },
      {
        id: "3",
        code: "CMD-150920251048357623",
        client: "Jumia",
        clientCode: "(123)",
        phone: "0677889900",
        date: "2025-09-18 11:22",
        status: "Livré",
        city: "Marrakech",
        livreur: "Youssef",
        amount: 220,
        totalPrice: 210,
        selected: false
      }
    ];

    set({
      zoneInfo: mockZone,
      availableOrders: mockOrders,
      isLoading: false
    });
  },

  setFilters: (newFilters) => {
    const { filters } = get();
    set({ filters: { ...filters, ...newFilters } });
  },

  selectOrder: (orderId) => {
    const { availableOrders } = get();
    set({
      availableOrders: availableOrders.map(order =>
        order.id === orderId ? { ...order, selected: !order.selected } : order
      )
    });
  },

  selectAllOrders: () => {
    const { availableOrders } = get();
    const allSelected = availableOrders.every(o => o.selected);
    set({
      availableOrders: availableOrders.map(order => ({
        ...order,
        selected: !allSelected
      }))
    });
  },

  addSelectedOrders: () => {
    const { availableOrders, addedOrders } = get();
    const selectedOrders = availableOrders.filter(o => o.selected);
    
    set({
      addedOrders: [...addedOrders, ...selectedOrders],
      availableOrders: availableOrders.filter(o => !o.selected)
    });
  },

  removeFromAdded: (orderId) => {
    const { addedOrders, availableOrders } = get();
    const orderToRemove = addedOrders.find(o => o.id === orderId);
    
    if (orderToRemove) {
      set({
        addedOrders: addedOrders.filter(o => o.id !== orderId),
        availableOrders: [...availableOrders, { ...orderToRemove, selected: false }]
      });
    }
  },

  generateBon: async (data) => {
    console.log("Generating zone bon with data:", data);
  }
}));