import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/lib/types";
import { AuthManager } from "@/lib/auth";
import { apiClient } from "@/lib/api/client";

// INTERFACES
interface AuthState {
  // Auth state
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Auth actions
  login: (
    email: string,
    password: string,
    tenantId?: string
  ) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
  setUser: (user: User) => void;

  // Network-specific actions
  networkLogin: (
    email: string,
    password: string,
    tenantId?: string
  ) => Promise<boolean>;
  networkLogout: () => void;
  networkCheckAuth: () => Promise<void>;
}

// AUTH STORE
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,

      // Standard login method (using AuthManager)
      login: async (email: string, password: string, tenantId?: string) => {
        set({ isLoading: true });

        try {
          const response = await apiClient.login(email, password);

          if (response.success && response.data) {
            const { user, token } = response.data;
            AuthManager.setTokens(token);

            set({
              user,
              isAuthenticated: true,
              isLoading: false,
            });

            // Set tenant if provided
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

      // Standard logout method
      logout: () => {
        AuthManager.removeTokens();
        set({
          user: null,
          isAuthenticated: false,
        });

        // Call logout endpoint
        apiClient.logout().catch(console.error);
      },

      // Standard auth check method
      checkAuth: async () => {
        if (!AuthManager.isTokenValid()) {
          // Try to refresh token
          const refreshed = await AuthManager.refreshToken();
          if (!refreshed) {
            get().logout();
            return;
          }
        }

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

      // Update user method
      updateUser: (userData: Partial<User>) => {
        const { user } = get();
        if (user) {
          set({ user: { ...user, ...userData } });
        }
      },

      // Network login method (using apiClient)
      networkLogin: async (
        email: string,
        password: string,
        tenantId?: string
      ) => {
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

            // Set tenant in network API client
            if (tenantId) {
              apiClient.setTenant(tenantId);
            }

            return true;
          }
        } catch (error) {
          console.error("Network login failed:", error);
        }

        set({ isLoading: false });
        return false;
      },

      // Network logout method
      networkLogout: () => {
        apiClient.logout();
        set({
          user: null,
          isAuthenticated: false,
        });
      },

      // Network auth check method
      networkCheckAuth: async () => {
        try {
          const response = await apiClient.getProfile();
          if (response.success && response.data) {
            set({
              user: response.data,
              isAuthenticated: true,
            });
          }
        } catch (error) {
          console.error("Network auth check failed:", error);
          get().networkLogout();
        }
      },

      // Set user directly
      setUser: (user: User) => {
        set({ user, isAuthenticated: true });
      },
    }),
    {
      name: "auth-store",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);