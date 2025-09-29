// /lib/stores/payments/livreur-details.store.ts
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
  amount: number;
  totalPrice: number;
  selected?: boolean;
}

interface LivreurInfo {
  id: string;
  name: string;
  zone: string;
  phone?: string;
  code?: string;
}

interface LivreurDetailsState {
  livreurInfo: LivreurInfo | null;
  availableOrders: Order[];
  addedOrders: Order[];
  isLoading: boolean;
  filters: {
    search: string;
    city?: string;
    status?: string;
  };
  
  fetchLivreurDetails: (livreurId: string) => Promise<void>;
  setFilters: (filters: Partial<LivreurDetailsState['filters']>) => void;
  selectOrder: (orderId: string) => void;
  selectAllOrders: () => void;
  addSelectedOrders: () => void;
  removeFromAdded: (orderId: string) => void;
  generateBon: (data: any) => Promise<void>;
}

export const useLivreurDetailsStore = create<LivreurDetailsState>((set, get) => ({
  livreurInfo: null,
  availableOrders: [],
  addedOrders: [],
  isLoading: false,
  filters: {
    search: "",
  },

  fetchLivreurDetails: async (livreurId) => {
    set({ isLoading: true });
    
    // Mock data
    const mockLivreur: LivreurInfo = {
      id: livreurId,
      name: "Hassan Mohammed",
      zone: "HUB CASABLANCA",
      phone: "0612345678",
      code: "LIV-001"
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
        amount: 220,
        totalPrice: 210,
        selected: false
      }
    ];

    set({
      livreurInfo: mockLivreur,
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
    // Implement API call
    console.log("Generating bon with data:", data);
  }
}));