import { useEffect, useCallback, useState } from "react";
import { useAuthStore } from "@/lib/stores/auth";
import { useTenantStore } from "@/lib/stores/tenant";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export interface UseAuthOptions {
  requireAuth?: boolean;
  requireTenant?: boolean;
  allowedRoles?: string[];
  redirectToLogin?: string;
  redirectToTenantSelect?: string;
  redirectUnauthorized?: string;
}

export interface AuthError {
  type: 'auth' | 'tenant' | 'role' | 'network';
  message: string;
  code?: string;
}

export function useAuth(options: UseAuthOptions = {}) {
  const {
    requireAuth = true,
    requireTenant = false,
    allowedRoles = [],
    redirectToLogin = "/auth/login",
    redirectToTenantSelect = "/tenant-select",
    redirectUnauthorized = "/unauthorized",
  } = options;

  const [authError, setAuthError] = useState<AuthError | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const {
    user,
    isAuthenticated,
    checkAuth,
    logout,
    isLoading: authLoading,
  } = useAuthStore();
  
  const { 
    currentTenant, 
    clearCurrentTenant, 
    fetchTenants,
    isLoading: tenantLoading,
  } = useTenantStore();
  
  const router = useRouter();

  // Initialize auth check
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        await checkAuth();
        
        if (mounted && isAuthenticated && requireTenant) {
          await fetchTenants();
        }
      } catch (error) {
        console.error("Auth initialization failed:", error);
        if (mounted) {
          setAuthError({
            type: 'auth',
            message: 'Failed to initialize authentication',
          });
        }
      } finally {
        if (mounted) {
          setIsInitializing(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, [checkAuth, isAuthenticated, requireTenant, fetchTenants]);

  // Handle authentication requirement
  useEffect(() => {
    if (isInitializing || authLoading) return;

    if (requireAuth && !isAuthenticated && user === null) {
      setAuthError({
        type: 'auth',
        message: 'Authentication required',
      });
      router.push(redirectToLogin);
      return;
    }

    // Clear auth error if user is now authenticated
    if (isAuthenticated && authError?.type === 'auth') {
      setAuthError(null);
    }
  }, [
    isAuthenticated,
    user,
    requireAuth,
    authLoading,
    isInitializing,
    router,
    redirectToLogin,
    authError,
  ]);

  // Handle tenant requirement
  useEffect(() => {
    if (isInitializing || authLoading || tenantLoading) return;

    if (isAuthenticated && requireTenant && !currentTenant) {
      setAuthError({
        type: 'tenant',
        message: 'Tenant selection required',
      });
      router.push(redirectToTenantSelect);
      return;
    }

    // Clear tenant error if tenant is now selected
    if (currentTenant && authError?.type === 'tenant') {
      setAuthError(null);
    }
  }, [
    isAuthenticated,
    currentTenant,
    requireTenant,
    authLoading,
    tenantLoading,
    isInitializing,
    router,
    redirectToTenantSelect,
    authError,
  ]);

  // Handle role-based access control
  useEffect(() => {
    if (isInitializing || authLoading) return;
    
    if (isAuthenticated && user && allowedRoles.length > 0) {
      if (!allowedRoles.includes(user.role)) {
        setAuthError({
          type: 'role',
          message: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
        });
        router.push(redirectUnauthorized);
        return;
      }
    }

    // Clear role error if user now has required role
    if (user && allowedRoles.length > 0 && allowedRoles.includes(user.role) && authError?.type === 'role') {
      setAuthError(null);
    }
  }, [
    isAuthenticated,
    user,
    allowedRoles,
    authLoading,
    isInitializing,
    router,
    redirectUnauthorized,
    authError,
  ]);

  // Enhanced logout that also clears tenant data and shows feedback
  const enhancedLogout = useCallback(async () => {
    try {
      clearCurrentTenant();
      logout();
      setAuthError(null);
      toast.success("Successfully logged out");
      router.push(redirectToLogin);
    } catch (error) {
      console.error("Logout failed:", error);
      toast.error("Logout failed");
    }
  }, [clearCurrentTenant, logout, router, redirectToLogin]);

  // Check if user is fully authenticated (including tenant if required)
  const isFullyAuthenticated = useCallback(() => {
    if (!isAuthenticated || !user) return false;
    if (requireTenant && !currentTenant) return false;
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) return false;
    return true;
  }, [isAuthenticated, user, requireTenant, currentTenant, allowedRoles]);

  // Get user role with type safety
  const getUserRole = useCallback(() => {
    return user?.role || null;
  }, [user]);

  // Check if user has specific role
  const hasRole = useCallback((role: string) => {
    return user?.role === role;
  }, [user]);

  // Check if user has any of the specified roles
  const hasAnyRole = useCallback((roles: string[]) => {
    return user?.role ? roles.includes(user.role) : false;
  }, [user]);

  // Get user permissions with fallback
  const getUserPermissions = useCallback(() => {
    return user?.permissions || [];
  }, [user]);

  // Check if user has specific permission
  const hasPermission = useCallback((permission: string) => {
    const permissions = getUserPermissions();
    return permissions.includes(permission) || permissions.includes("*");
  }, [getUserPermissions]);

  // Check if user has any of the specified permissions
  const hasAnyPermission = useCallback((permissions: string[]) => {
    const userPermissions = getUserPermissions();
    return permissions.some(permission => 
      userPermissions.includes(permission) || userPermissions.includes("*")
    );
  }, [getUserPermissions]);

  // Get loading state (considering all loading states)
  const isLoading = authLoading || tenantLoading || isInitializing;

  // Check if there are any blocking errors
  const hasBlockingError = authError?.type === 'auth' || authError?.type === 'tenant' || authError?.type === 'role';

  // Refresh authentication state
  const refreshAuth = useCallback(async () => {
    try {
      setAuthError(null);
      await checkAuth();
      if (isAuthenticated && requireTenant) {
        await fetchTenants();
      }
      return true;
    } catch (error) {
      console.error("Auth refresh failed:", error);
      setAuthError({
        type: 'network',
        message: 'Failed to refresh authentication',
      });
      return false;
    }
  }, [checkAuth, isAuthenticated, requireTenant, fetchTenants]);

  return {
    // Core auth state
    user,
    isAuthenticated,
    isLoading,
    currentTenant,
    
    // Enhanced state
    isFullyAuthenticated: isFullyAuthenticated(),
    authError,
    hasBlockingError,
    isInitializing,

    // Actions
    logout: enhancedLogout,
    refreshAuth,

    // User utilities
    getUserRole,
    hasRole,
    hasAnyRole,
    getUserPermissions,
    hasPermission,
    hasAnyPermission,

    // Error handling
    clearError: () => setAuthError(null),
  };
}