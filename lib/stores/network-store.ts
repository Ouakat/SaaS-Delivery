import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiClient } from "../api/client";

interface User {
  id: string;
  email: string;
  name?: string;
  role: "ADMIN" | "MERCHANT" | "DELIVERY_AGENT";
  tenantId: string;
  avatar?: string;
}

interface Tenant {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  settings: any;
}

interface NetworkState {
  // Auth state
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Tenant state
  currentTenant: Tenant | null;

  // Actions
  login: (
    email: string,
    password: string,
    tenantId?: string
  ) => Promise<boolean>;
  logout: () => void;
  setUser: (user: User) => void;
  setTenant: (tenant: Tenant) => void;
  checkAuth: () => Promise<void>;
}

export const useNetworkStore = create<NetworkState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      currentTenant: null,

      login: async (email: string, password: string, tenantId?: string) => {
        set({ isLoading: true });

        try {
          const response = await apiClient.login(email, password, tenantId);

          if (response.success && response.data) {
            const { user } = response.data;
            set({
              user,
              isAuthenticated: true,
              isLoading: false,
            });

            // Set tenant in API client
            if (tenantId) {
              apiClient.setTenant(tenantId);
            }

            return true;
          }
        } catch (error) {
          console.error("Login failed:", error);
        }

        set({ isLoading: false });
        return false;
      },

      logout: () => {
        apiClient.logout();
        set({
          user: null,
          isAuthenticated: false,
          currentTenant: null,
        });
      },

      setUser: (user: User) => {
        set({ user, isAuthenticated: true });
      },

      setTenant: (tenant: Tenant) => {
        set({ currentTenant: tenant });
        apiClient.setTenant(tenant.id);
      },

      checkAuth: async () => {
        try {
          const response = await apiClient.getProfile();
          if (response.success && response.data) {
            set({
              user: response.data,
              isAuthenticated: true,
            });
          }
        } catch (error) {
          console.error("Auth check failed:", error);
          get().logout();
        }
      },
    }),
    {
      name: "network-store",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        currentTenant: state.currentTenant,
      }),
    }
  )
);
