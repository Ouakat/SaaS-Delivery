import { create } from "zustand";
import { persist } from "zustand/middleware";
import { tenantsApiClient } from "@/lib/api/clients/tenants.client";
import { sanitizeTenantData } from "@/lib/utils/data-sanitizer.utils";
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

      // Basic setters with data sanitization
      setTenant: (tenant: ExtendedTenant) => {
        try {
          // Sanitize tenant data to prevent React render errors
          const sanitizedTenant = sanitizeTenantData(tenant);

          set({ currentTenant: sanitizedTenant, error: null });

          // Update API client tenant context
          if (typeof window !== "undefined") {
            localStorage.setItem("current_tenant_id", sanitizedTenant.id);
          }
        } catch (error) {
          console.error("Error setting tenant:", error);
          set({ error: "Failed to set tenant data" });
        }
      },

      setTenants: (tenants: ExtendedTenant[]) => {
        try {
          // Sanitize all tenant data
          const sanitizedTenants = tenants.map((tenant) =>
            sanitizeTenantData(tenant)
          );
          set({ tenants: sanitizedTenants, error: null });
        } catch (error) {
          console.error("Error setting tenants:", error);
          set({ error: "Failed to set tenants data" });
        }
      },

      addTenant: (tenant: ExtendedTenant) => {
        try {
          const { tenants } = get();
          const sanitizedTenant = sanitizeTenantData(tenant);
          set({ tenants: [...tenants, sanitizedTenant] });
        } catch (error) {
          console.error("Error adding tenant:", error);
          set({ error: "Failed to add tenant" });
        }
      },

      updateTenant: (tenantId: string, updates: Partial<ExtendedTenant>) => {
        try {
          const { tenants, currentTenant } = get();

          // Sanitize updates
          const sanitizedUpdates = sanitizeTenantData(updates);

          // Update in tenants list
          const updatedTenants = tenants.map((tenant) =>
            tenant.id === tenantId ? { ...tenant, ...sanitizedUpdates } : tenant
          );
          set({ tenants: updatedTenants });

          // Update current tenant if it's the one being updated
          if (currentTenant?.id === tenantId) {
            set({ currentTenant: { ...currentTenant, ...sanitizedUpdates } });
          }
        } catch (error) {
          console.error("Error updating tenant:", error);
          set({ error: "Failed to update tenant" });
        }
      },

      removeTenant: (tenantId: string) => {
        try {
          const { tenants, currentTenant } = get();

          const updatedTenants = tenants.filter(
            (tenant) => tenant.id !== tenantId
          );
          set({ tenants: updatedTenants });

          // Clear current tenant if it's the one being removed
          if (currentTenant?.id === tenantId) {
            get().clearCurrentTenant();
          }
        } catch (error) {
          console.error("Error removing tenant:", error);
          set({ error: "Failed to remove tenant" });
        }
      },

      clearCurrentTenant: () => {
        set({ currentTenant: null });

        if (typeof window !== "undefined") {
          localStorage.removeItem("current_tenant_id");
        }
      },

      // API Actions with enhanced error handling
      fetchTenants: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await tenantsApiClient.getTenants();

          if (response.success && response.data) {
            // Sanitize all tenant data
            const sanitizedTenants = Array.isArray(response.data)
              ? response.data.map((tenant) => sanitizeTenantData(tenant))
              : [sanitizeTenantData(response.data)];

            set({
              tenants: sanitizedTenants,
              isLoading: false,
              error: null,
            });
          } else {
            throw new Error(
              response.error?.message || "Failed to fetch tenants"
            );
          }
        } catch (paginatedError: any) {
          console.warn("Primary getTenants failed:", paginatedError.message);

          try {
            // Fallback to current tenant
            const fallbackResponse = await tenantsApiClient.getCurrentTenant();

            if (fallbackResponse.success && fallbackResponse.data) {
              const sanitizedTenant = sanitizeTenantData(fallbackResponse.data);

              set({
                tenants: [sanitizedTenant],
                isLoading: false,
                error: null,
              });
            } else {
              throw new Error(
                fallbackResponse.error?.message || "Failed to fetch tenant data"
              );
            }
          } catch (fallbackError: any) {
            console.error("All tenant fetch methods failed:", fallbackError);
            set({
              isLoading: false,
              error:
                fallbackError?.message ||
                "Network error while fetching tenants",
            });
          }
        }
      },

      fetchCurrentTenant: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await tenantsApiClient.getCurrentTenant();

          if (response.success && response.data) {
            // Sanitize tenant data to prevent React render errors
            const sanitizedTenant = sanitizeTenantData(response.data);

            set({
              currentTenant: sanitizedTenant,
              isLoading: false,
              error: null,
            });

            // Update localStorage
            if (typeof window !== "undefined") {
              localStorage.setItem("current_tenant_id", sanitizedTenant.id);
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
          const response = await tenantsApiClient.getCurrentTenant();

          if (response.success && response.data) {
            const sanitizedTenant = sanitizeTenantData(response.data);

            set({ isLoading: false, error: null });
            return sanitizedTenant;
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
        try {
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
        } catch (error: any) {
          console.error("Switch tenant failed:", error);
          set({ error: error?.message || "Failed to switch tenant" });
          return false;
        }
      },

      updateTenantSettings: async (settings: any) => {
        try {
          const response = await tenantsApiClient.updateTenantSettings(
            settings
          );

          if (response.success && response.data) {
            const { currentTenant } = get();
            if (currentTenant) {
              // Sanitize settings data
              const sanitizedSettings = sanitizeTenantData({
                settings: response.data.settings,
              });

              get().updateTenant(currentTenant.id, {
                settings: sanitizedSettings.settings,
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

      // Utility methods (no changes needed)
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
      version: 2, // Increment version to handle migration
      migrate: (persistedState: any, version: number) => {
        if (version < 2) {
          // Sanitize any persisted data that might have problematic objects
          return {
            currentTenant: persistedState?.currentTenant
              ? sanitizeTenantData(persistedState.currentTenant)
              : null,
            tenants: Array.isArray(persistedState?.tenants)
              ? persistedState.tenants.map((tenant: any) =>
                  sanitizeTenantData(tenant)
                )
              : [],
          };
        }
        return persistedState;
      },
    }
  )
);

// Helper function to initialize tenant from URL/localStorage with error handling
export const initializeTenantFromContext = async () => {
  if (typeof window === "undefined") return;

  try {
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
        await store.fetchTenantById(storedTenantId);
      }
    }
  } catch (error) {
    console.error("Failed to initialize tenant context:", error);
    // Clear potentially corrupted data
    if (typeof window !== "undefined") {
      localStorage.removeItem("current_tenant_id");
    }
  }
};

// Auto-initialize on client side with error handling
if (typeof window !== "undefined") {
  // Initialize tenant context when store is first accessed
  setTimeout(() => {
    initializeTenantFromContext().catch((error) => {
      console.error("Auto-initialization failed:", error);
    });
  }, 0);
}
