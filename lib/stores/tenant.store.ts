import { create } from "zustand";
import { persist } from "zustand/middleware";
import { tenantsApiClient } from "@/lib/api/clients/tenants.client"; // Changed import
import type { Tenant } from "@/lib/types/database/schema.types";

// Extended tenant interface for UI needs
export interface ExtendedTenant extends Tenant {
  // Additional UI-specific properties
  features?: string[];
  permissions?: string[];
  stats?: {
    totalUsers?: number;
    activeUsers?: number;
    totalParcels?: number;
    totalInvoices?: number;
    totalClaims?: number;
  };
}

interface TenantState {
  // Core state
  currentTenant: ExtendedTenant | null;
  tenants: ExtendedTenant[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setTenant: (tenant: ExtendedTenant) => void;
  setTenants: (tenants: ExtendedTenant[]) => void;
  addTenant: (tenant: ExtendedTenant) => void;
  updateTenant: (tenantId: string, updates: Partial<ExtendedTenant>) => void;
  removeTenant: (tenantId: string) => void;
  clearCurrentTenant: () => void;

  // API Actions
  fetchTenants: () => Promise<void>;
  fetchCurrentTenant: () => Promise<void>;
  fetchTenantById: (tenantId: string) => Promise<ExtendedTenant | null>;
  switchTenant: (tenantId: string) => Promise<boolean>;
  updateTenantSettings: (settings: any) => Promise<boolean>;

  // Utility methods
  getTenantSettings: () => any;
  getCurrentTenantId: () => string | null;
  isTenantActive: (tenantId: string) => boolean;

  // Feature/Permission checking
  hasFeature: (feature: string) => boolean;
  getTenantPermissions: () => string[];
  canAccessResource: (resource: string) => boolean;

  // Error handling
  clearError: () => void;
  setError: (error: string) => void;
}

export const useTenantStore = create<TenantState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentTenant: null,
      tenants: [],
      isLoading: false,
      error: null,

      // Basic setters
      setTenant: (tenant: ExtendedTenant) => {
        set({ currentTenant: tenant, error: null });

        // Update API client tenant context
        if (typeof window !== "undefined") {
          localStorage.setItem("current_tenant_id", tenant.id);
        }
      },

      setTenants: (tenants: ExtendedTenant[]) => {
        set({ tenants, error: null });
      },

      addTenant: (tenant: ExtendedTenant) => {
        const { tenants } = get();
        set({ tenants: [...tenants, tenant] });
      },

      updateTenant: (tenantId: string, updates: Partial<ExtendedTenant>) => {
        const { tenants, currentTenant } = get();

        // Update in tenants list
        const updatedTenants = tenants.map((tenant) =>
          tenant.id === tenantId ? { ...tenant, ...updates } : tenant
        );
        set({ tenants: updatedTenants });

        // Update current tenant if it's the one being updated
        if (currentTenant?.id === tenantId) {
          set({ currentTenant: { ...currentTenant, ...updates } });
        }
      },

      removeTenant: (tenantId: string) => {
        const { tenants, currentTenant } = get();

        const updatedTenants = tenants.filter(
          (tenant) => tenant.id !== tenantId
        );
        set({ tenants: updatedTenants });

        // Clear current tenant if it's the one being removed
        if (currentTenant?.id === tenantId) {
          get().clearCurrentTenant();
        }
      },

      clearCurrentTenant: () => {
        set({ currentTenant: null });

        if (typeof window !== "undefined") {
          localStorage.removeItem("current_tenant_id");
        }
      },

      // API Actions
      fetchTenants: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await tenantsApiClient.getTenants();

          set({
            tenants: response.data,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          console.error("Fetch tenants failed:", error);
          set({
            isLoading: false,
            error: error?.message || "Network error while fetching tenants",
          });
        }
      },

      fetchCurrentTenant: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await tenantsApiClient.getCurrentTenant(); // Updated client

          if (response.success && response.data) {
            const tenantData = response.data;
            set({
              currentTenant: tenantData,
              isLoading: false,
              error: null,
            });

            // Update localStorage
            if (typeof window !== "undefined") {
              localStorage.setItem("current_tenant_id", tenantData.id);
            }
          } else {
            set({
              isLoading: false,
              error:
                response.error?.message || "Failed to fetch current tenant",
            });
          }
        } catch (error: any) {
          console.error("Fetch current tenant failed:", error);
          set({
            isLoading: false,
            error: error?.message || "Network error while fetching tenant",
          });
        }
      },

      fetchTenantById: async (tenantId: string) => {
        set({ isLoading: true, error: null });

        try {
          // For now, we'll use the current tenant endpoint
          // You might want to add a specific endpoint for fetching by ID
          const response = await tenantsApiClient.getCurrentTenant(); // Updated client

          if (response.success && response.data) {
            set({ isLoading: false, error: null });
            return response.data;
          } else {
            set({
              isLoading: false,
              error: response.error?.message || "Failed to fetch tenant",
            });
            return null;
          }
        } catch (error: any) {
          console.error("Fetch tenant by ID failed:", error);
          set({
            isLoading: false,
            error: error?.message || "Network error while fetching tenant",
          });
          return null;
        }
      },

      switchTenant: async (tenantId: string) => {
        const { tenants } = get();

        // Check if tenant exists in local list
        const tenant = tenants.find((t) => t.id === tenantId);

        if (tenant) {
          get().setTenant(tenant);
          return true;
        } else {
          // Try to fetch the tenant
          const fetchedTenant = await get().fetchTenantById(tenantId);
          if (fetchedTenant) {
            get().setTenant(fetchedTenant);
            return true;
          }
        }

        set({ error: "Failed to switch to tenant" });
        return false;
      },

      updateTenantSettings: async (settings: any) => {
        try {
          const response = await tenantsApiClient.updateTenantSettings(
            settings
          ); // Updated client

          if (response.success && response.data) {
            const { currentTenant } = get();
            if (currentTenant) {
              get().updateTenant(currentTenant.id, {
                settings: response.data.settings,
              });
            }
            return true;
          } else {
            set({
              error: response.error?.message || "Failed to update settings",
            });
            return false;
          }
        } catch (error: any) {
          console.error("Update tenant settings failed:", error);
          set({
            error: error?.message || "Network error while updating settings",
          });
          return false;
        }
      },

      // Utility methods
      getTenantSettings: () => {
        const { currentTenant } = get();
        return currentTenant?.settings || {};
      },

      getCurrentTenantId: () => {
        const { currentTenant } = get();
        return currentTenant?.id || null;
      },

      isTenantActive: (tenantId: string) => {
        const { currentTenant } = get();
        return currentTenant?.id === tenantId && currentTenant?.isActive;
      },

      // Feature checking
      hasFeature: (feature: string) => {
        const { currentTenant } = get();
        if (!currentTenant?.features) return false;
        return currentTenant.features.includes(feature);
      },

      getTenantPermissions: () => {
        const { currentTenant } = get();
        return currentTenant?.permissions || [];
      },

      canAccessResource: (resource: string) => {
        const permissions = get().getTenantPermissions();
        return permissions.includes(resource) || permissions.includes("*");
      },

      // Error handling
      clearError: () => {
        set({ error: null });
      },

      setError: (error: string) => {
        set({ error });
      },
    }),
    {
      name: "tenant-store",
      partialize: (state) => ({
        currentTenant: state.currentTenant,
        tenants: state.tenants,
        // Don't persist loading states or errors
      }),
      version: 1,
    }
  )
);

// Helper function to initialize tenant from URL/localStorage
export const initializeTenantFromContext = () => {
  if (typeof window === "undefined") return;

  const store = useTenantStore.getState();

  // Try to get tenant from localStorage first
  const storedTenantId = localStorage.getItem("current_tenant_id");

  if (storedTenantId && !store.currentTenant) {
    // Try to find tenant in local list or fetch it
    const existingTenant = store.tenants.find((t) => t.id === storedTenantId);

    if (existingTenant) {
      store.setTenant(existingTenant);
    } else {
      // Fetch tenant data
      store.fetchTenantById(storedTenantId);
    }
  }
};

// Auto-initialize on client side
if (typeof window !== "undefined") {
  // Initialize tenant context when store is first accessed
  setTimeout(() => {
    initializeTenantFromContext();
  }, 0);
}
