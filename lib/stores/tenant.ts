import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Tenant } from "@/lib/types/template";
import { apiClient } from "@/lib/api/client";

// INTERFACES
interface TenantState {
  // Tenant state
  currentTenant: Tenant | null;
  tenants: Tenant[];
  isLoading: boolean;
  error: string | null;

  // Tenant actions
  setTenant: (tenant: Tenant) => void;
  setTenants: (tenants: Tenant[]) => void;
  addTenant: (tenant: Tenant) => void;
  updateTenant: (tenantId: string, updates: Partial<Tenant>) => void;
  removeTenant: (tenantId: string) => void;
  clearCurrentTenant: () => void;

  // Tenant data fetching
  fetchTenants: () => Promise<void>;
  fetchTenantById: (tenantId: string) => Promise<Tenant | null>;

  // Tenant settings and utilities
  getTenantSettings: () => any;
  switchTenant: (tenantId: string) => Promise<boolean>;
  getCurrentTenantId: () => string | null;
  isTenantActive: (tenantId: string) => boolean;

  // Tenant permissions/features
  hasFeature: (feature: string) => boolean;
  getTenantPermissions: () => string[];
  canAccessResource: (resource: string) => boolean;
}

// TENANT STORE

export const useTenantStore = create<TenantState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentTenant: null,
      tenants: [],
      isLoading: false,
      error: null,

      // Set current tenant
      setTenant: (tenant: Tenant) => {
        set({ currentTenant: tenant, error: null });
        apiClient.setTenant(tenant.id);
      },

      // Set tenants list
      setTenants: (tenants: Tenant[]) => {
        set({ tenants, error: null });
      },

      // Add a new tenant
      addTenant: (tenant: Tenant) => {
        const { tenants } = get();
        const updatedTenants = [...tenants, tenant];
        set({ tenants: updatedTenants });
      },

      // Update existing tenant
      updateTenant: (tenantId: string, updates: Partial<Tenant>) => {
        const { tenants, currentTenant } = get();
        const updatedTenants = tenants.map((tenant) =>
          tenant.id === tenantId ? { ...tenant, ...updates } : tenant
        );

        set({ tenants: updatedTenants });

        // Update current tenant if it's the one being updated
        if (currentTenant?.id === tenantId) {
          set({ currentTenant: { ...currentTenant, ...updates } });
        }
      },

      // Remove tenant
      removeTenant: (tenantId: string) => {
        const { tenants, currentTenant } = get();
        const updatedTenants = tenants.filter(
          (tenant) => tenant.id !== tenantId
        );

        set({ tenants: updatedTenants });

        // Clear current tenant if it's the one being removed
        if (currentTenant?.id === tenantId) {
          set({ currentTenant: null });
        }
      },

      // Clear current tenant
      clearCurrentTenant: () => {
        set({ currentTenant: null });
      },

      // Fetch all tenants
      fetchTenants: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiClient.get("/tenants");
          if (response.success && response.data) {
            set({
              tenants: response.data,
              isLoading: false,
              error: null,
            });
          } else {
            set({
              isLoading: false,
              error: "Failed to fetch tenants",
            });
          }
        } catch (error) {
          console.error("Fetch tenants failed:", error);
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      },

      // Fetch tenant by ID
      fetchTenantById: async (tenantId: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiClient.get(`/tenants/${tenantId}`);
          if (response.success && response.data) {
            set({ isLoading: false, error: null });
            return response.data;
          } else {
            set({
              isLoading: false,
              error: "Failed to fetch tenant",
            });
            return null;
          }
        } catch (error) {
          console.error("Fetch tenant failed:", error);
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : "Unknown error",
          });
          return null;
        }
      },

      // Get tenant settings
      getTenantSettings: () => {
        const { currentTenant } = get();
        return currentTenant?.settings || {};
      },

      // Switch to a different tenant
      switchTenant: async (tenantId: string) => {
        const { tenants } = get();
        const tenant = tenants.find((t) => t.id === tenantId);

        if (tenant) {
          get().setTenant(tenant);
          return true;
        } else {
          // Try to fetch the tenant if not in local list
          const fetchedTenant = await get().fetchTenantById(tenantId);
          if (fetchedTenant) {
            get().setTenant(fetchedTenant);
            return true;
          }
        }

        return false;
      },

      // Get current tenant ID
      getCurrentTenantId: () => {
        const { currentTenant } = get();
        return currentTenant?.id || null;
      },

      // Check if tenant is currently active
      isTenantActive: (tenantId: string) => {
        const { currentTenant } = get();
        return currentTenant?.id === tenantId;
      },

      // Check if current tenant has a feature
      hasFeature: (feature: string) => {
        const { currentTenant } = get();
        if (!currentTenant?.features) return false;
        return currentTenant.features.includes(feature);
      },

      // Get current tenant permissions
      getTenantPermissions: () => {
        const { currentTenant } = get();
        return currentTenant?.permissions || [];
      },

      // Check if current tenant can access a resource
      canAccessResource: (resource: string) => {
        const permissions = get().getTenantPermissions();
        return permissions.includes(resource) || permissions.includes("*");
      },
    }),
    {
      name: "tenant-store",
      partialize: (state) => ({
        currentTenant: state.currentTenant,
        tenants: state.tenants,
      }),
    }
  )
);
