import { useEffect } from "react";
import { useAuthStore } from "@/lib/stores/auth";
import { useTenantStore } from "@/lib/stores/tenant";
import { useRouter } from "next/navigation";

export interface UseAuthOptions {
  requireAuth?: boolean;
  requireTenant?: boolean;
  redirectToLogin?: string;
  redirectToTenantSelect?: string;
}

export function useAuth(options: UseAuthOptions = {}) {
  const {
    requireAuth = true,
    requireTenant = false,
    redirectToLogin = "/login",
    redirectToTenantSelect = "/tenant-select",
  } = options;

  const {
    user,
    isAuthenticated,
    checkAuth,
    logout,
    isLoading: authLoading,
  } = useAuthStore();
  const { currentTenant, clearCurrentTenant } = useTenantStore();
  const router = useRouter();

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Handle authentication requirement
  useEffect(() => {
    if (!authLoading && requireAuth && !isAuthenticated && user === null) {
      router.push(redirectToLogin);
    }
  }, [
    isAuthenticated,
    user,
    requireAuth,
    authLoading,
    router,
    redirectToLogin,
  ]);

  // Handle tenant requirement
  useEffect(() => {
    if (!authLoading && isAuthenticated && requireTenant && !currentTenant) {
      router.push(redirectToTenantSelect);
    }
  }, [
    isAuthenticated,
    currentTenant,
    requireTenant,
    authLoading,
    router,
    redirectToTenantSelect,
  ]);

  // Enhanced logout that also clears tenant data
  const enhancedLogout = () => {
    clearCurrentTenant();
    logout();
  };

  // Check if user is fully authenticated (including tenant if required)
  const isFullyAuthenticated = () => {
    if (!isAuthenticated) return false;
    if (requireTenant && !currentTenant) return false;
    return true;
  };

  // Get user role
  const getUserRole = () => {
    return user?.role || null;
  };

  // Check if user has specific role
  const hasRole = (role: string) => {
    return user?.role === role;
  };

  // Check if user has any of the specified roles
  const hasAnyRole = (roles: string[]) => {
    return user?.role ? roles.includes(user.role) : false;
  };

  // Get user permissions (if stored in user object)
  const getUserPermissions = () => {
    return user?.permissions || [];
  };

  // Check if user has specific permission
  const hasPermission = (permission: string) => {
    const permissions = getUserPermissions();
    return permissions.includes(permission) || permissions.includes("*");
  };

  return {
    // Core auth state
    user,
    isAuthenticated,
    isLoading: authLoading,
    currentTenant,

    // Enhanced checks
    isFullyAuthenticated: isFullyAuthenticated(),

    // Actions
    logout: enhancedLogout,

    // User utilities
    getUserRole,
    hasRole,
    hasAnyRole,
    getUserPermissions,
    hasPermission,
  };
}
