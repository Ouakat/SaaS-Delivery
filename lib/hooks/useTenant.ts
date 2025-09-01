import { useEffect } from "react";
import { useTenantStore } from "@/lib/stores/tenant";
import { useAuthStore } from "@/lib/stores/auth";
import { useRouter } from "next/navigation";

export interface UseTenantOptions {
  requireTenant?: boolean;
  autoFetchTenants?: boolean;
  redirectToTenantSelect?: boolean;
  requiredFeatures?: string[];
  requiredPermissions?: string[];
}

export function useTenant(options: UseTenantOptions = {}) {
  const {
    requireTenant = true,
    autoFetchTenants = true,
    redirectToTenantSelect = true,
    requiredFeatures = [],
    requiredPermissions = [],
  } = options;

  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const {
    currentTenant,
    tenants,
    isLoading,
    error,
    setTenant,
    fetchTenants,
    switchTenant,
    getTenantSettings,
    hasFeature,
    getTenantPermissions,
    canAccessResource,
  } = useTenantStore();

  // Auto-fetch tenants when authenticated
  useEffect(() => {
    if (isAuthenticated && autoFetchTenants && tenants.length === 0) {
      fetchTenants();
    }
  }, [isAuthenticated, autoFetchTenants, tenants.length, fetchTenants]);

  // Handle tenant requirement and redirection
  useEffect(() => {
    if (isAuthenticated && requireTenant && !isLoading) {
      if (!currentTenant && redirectToTenantSelect) {
        router.push("/tenant-select");
      }
    }
  }, [
    isAuthenticated,
    requireTenant,
    currentTenant,
    isLoading,
    redirectToTenantSelect,
    router,
  ]);

  // Check required features
  const hasRequiredFeatures = () => {
    if (requiredFeatures.length === 0) return true;
    return requiredFeatures.every((feature) => hasFeature(feature));
  };

  // Check required permissions
  const hasRequiredPermissions = () => {
    if (requiredPermissions.length === 0) return true;
    return requiredPermissions.every((permission) =>
      canAccessResource(permission)
    );
  };

  // Check if user has access based on features and permissions
  const hasAccess = hasRequiredFeatures() && hasRequiredPermissions();

  // Switch tenant with error handling
  const switchToTenant = async (tenantId: string) => {
    try {
      const success = await switchTenant(tenantId);
      if (!success) {
        throw new Error("Failed to switch tenant");
      }
      return true;
    } catch (error) {
      console.error("Error switching tenant:", error);
      return false;
    }
  };

  // Get tenant by ID from the tenants list
  const getTenantById = (tenantId: string) => {
    return tenants.find((tenant) => tenant.id === tenantId) || null;
  };

  // Check if current tenant is active/valid
  const isTenantValid = () => {
    return currentTenant && currentTenant.status === "active";
  };

  // Get tenant features list
  const getTenantFeatures = () => {
    return currentTenant?.features || [];
  };

  // Get tenant theme/branding settings
  const getTenantBranding = () => {
    const settings = getTenantSettings();
    return settings?.branding || {};
  };

  // Get tenant configuration
  const getTenantConfig = () => {
    const settings = getTenantSettings();
    return settings?.config || {};
  };

  return {
    // State
    currentTenant,
    tenants,
    isLoading,
    error,
    hasAccess,

    // Actions
    setTenant,
    switchToTenant,
    fetchTenants,

    // Utilities
    getTenantById,
    getTenantSettings,
    getTenantFeatures,
    getTenantBranding,
    getTenantConfig,
    isTenantValid,

    // Permission checks
    hasFeature,
    hasRequiredFeatures,
    hasRequiredPermissions,
    canAccessResource,
    getTenantPermissions,
  };
}
