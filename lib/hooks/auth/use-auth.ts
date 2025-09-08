// lib/hooks/auth/use-auth.ts
import { useEffect, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth.store";
import { useTenantStore } from "@/lib/stores/tenant.store";
import type { UserType } from "@/lib/types/database/schema.types";

export interface UseAuthOptions {
  requireAuth?: boolean;
  requireTenant?: boolean;
  allowedUserTypes?: UserType[];
  allowedRoles?: string[];
  requiredPermissions?: string[];
  redirectToLogin?: string;
  redirectToTenantSelect?: string;
  redirectUnauthorized?: string;
  redirectOnSuccess?: string;
}

export interface AuthError {
  type: "auth" | "tenant" | "userType" | "role" | "permission" | "network";
  message: string;
  code?: string;
  details?: any;
}

export interface AuthStatus {
  isLoading: boolean;
  isAuthenticated: boolean;
  isAuthorized: boolean;
  hasValidTenant: boolean;
  error: AuthError | null;
  user: ReturnType<typeof useAuthStore>["user"];
  currentTenant: ReturnType<typeof useTenantStore>["currentTenant"];
}

export function useAuth(options: UseAuthOptions = {}) {
  const {
    requireAuth = true,
    requireTenant = true,
    allowedUserTypes = [],
    allowedRoles = [],
    requiredPermissions = [],
    redirectToLogin = "/auth/login",
    redirectToTenantSelect = "/tenant-select",
    redirectUnauthorized = "/unauthorized",
    redirectOnSuccess,
  } = options;

  const router = useRouter();
  const [authError, setAuthError] = useState<AuthError | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Auth store
  const {
    user,
    isAuthenticated,
    isLoading: authLoading,
    error: authStoreError,
    login,
    logout,
    checkAuth,
    hasPermission,
    hasAnyPermission,
    hasRole,
    hasUserType,
    clearError,
  } = useAuthStore();

  // Tenant store
  const {
    currentTenant,
    isLoading: tenantLoading,
    fetchTenants,
    clearCurrentTenant,
  } = useTenantStore();

  // Initialize authentication
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
            type: "network",
            message: "Failed to initialize authentication",
            details: error,
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

    if (requireAuth && !isAuthenticated) {
      setAuthError({
        type: "auth",
        message: "Authentication required",
      });

      const currentPath = window.location.pathname;
      const loginUrl = `${redirectToLogin}?redirect=${encodeURIComponent(
        currentPath
      )}`;
      router.push(loginUrl);
      return;
    }

    // Clear auth error if user is now authenticated
    if (isAuthenticated && authError?.type === "auth") {
      setAuthError(null);
    }
  }, [
    isAuthenticated,
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
        type: "tenant",
        message: "Tenant selection required",
      });
      router.push(redirectToTenantSelect);
      return;
    }

    // Clear tenant error if tenant is now selected
    if (currentTenant && authError?.type === "tenant") {
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

  // Handle user type restrictions
  useEffect(() => {
    if (isInitializing || authLoading || !isAuthenticated || !user) return;

    if (allowedUserTypes.length > 0 && !hasUserType(allowedUserTypes[0])) {
      // Check if user has any of the allowed user types
      const hasValidUserType = allowedUserTypes.some((userType) =>
        hasUserType(userType)
      );

      if (!hasValidUserType) {
        setAuthError({
          type: "userType",
          message: `Access denied. Required user types: ${allowedUserTypes.join(
            ", "
          )}`,
          details: { allowedUserTypes, userUserType: user.userType },
        });
        router.push(redirectUnauthorized);
        return;
      }
    }

    // Clear user type error if user now has valid type
    if (authError?.type === "userType" && allowedUserTypes.length > 0) {
      const hasValidUserType = allowedUserTypes.some((userType) =>
        hasUserType(userType)
      );
      if (hasValidUserType) {
        setAuthError(null);
      }
    }
  }, [
    isAuthenticated,
    user,
    allowedUserTypes,
    hasUserType,
    authLoading,
    isInitializing,
    router,
    redirectUnauthorized,
    authError,
  ]);

  // Handle role-based access control
  useEffect(() => {
    if (isInitializing || authLoading || !isAuthenticated || !user) return;

    if (allowedRoles.length > 0) {
      const hasValidRole = allowedRoles.some((role) => hasRole(role));

      if (!hasValidRole) {
        setAuthError({
          type: "role",
          message: `Access denied. Required roles: ${allowedRoles.join(", ")}`,
          details: { allowedRoles, userRole: user.role?.name },
        });
        router.push(redirectUnauthorized);
        return;
      }
    }

    // Clear role error if user now has valid role
    if (authError?.type === "role" && allowedRoles.length > 0) {
      const hasValidRole = allowedRoles.some((role) => hasRole(role));
      if (hasValidRole) {
        setAuthError(null);
      }
    }
  }, [
    isAuthenticated,
    user,
    allowedRoles,
    hasRole,
    authLoading,
    isInitializing,
    router,
    redirectUnauthorized,
    authError,
  ]);

  // Handle permission-based access control
  useEffect(() => {
    if (isInitializing || authLoading || !isAuthenticated || !user) return;

    if (requiredPermissions.length > 0) {
      const hasValidPermissions = hasAnyPermission(requiredPermissions);

      if (!hasValidPermissions) {
        setAuthError({
          type: "permission",
          message: `Access denied. Required permissions: ${requiredPermissions.join(
            ", "
          )}`,
          details: {
            requiredPermissions,
            userPermissions: user.role?.permissions,
          },
        });
        router.push(redirectUnauthorized);
        return;
      }
    }

    // Clear permission error if user now has valid permissions
    if (authError?.type === "permission" && requiredPermissions.length > 0) {
      const hasValidPermissions = hasAnyPermission(requiredPermissions);
      if (hasValidPermissions) {
        setAuthError(null);
      }
    }
  }, [
    isAuthenticated,
    user,
    requiredPermissions,
    hasAnyPermission,
    authLoading,
    isInitializing,
    router,
    redirectUnauthorized,
    authError,
  ]);

  // Handle redirect on success
  useEffect(() => {
    if (
      redirectOnSuccess &&
      isAuthenticated &&
      (!requireTenant || currentTenant) &&
      !authError &&
      !isInitializing &&
      !authLoading &&
      !tenantLoading
    ) {
      router.push(redirectOnSuccess);
    }
  }, [
    redirectOnSuccess,
    isAuthenticated,
    currentTenant,
    requireTenant,
    authError,
    isInitializing,
    authLoading,
    tenantLoading,
    router,
  ]);

  // Handle auth store errors
  useEffect(() => {
    if (authStoreError && !authError) {
      setAuthError({
        type: "auth",
        message: authStoreError,
      });
    }
  }, [authStoreError, authError]);

  // Enhanced logout that clears everything
  const enhancedLogout = useCallback(async () => {
    try {
      clearCurrentTenant();
      await logout();
      setAuthError(null);
      clearError();
      router.push(redirectToLogin);
    } catch (error) {
      console.error("Logout failed:", error);
      // Force cleanup even if logout fails
      clearCurrentTenant();
      setAuthError(null);
      router.push(redirectToLogin);
    }
  }, [clearCurrentTenant, logout, clearError, router, redirectToLogin]);

  // Enhanced login with error handling
  const enhancedLogin = useCallback(
    async (credentials: Parameters<typeof login>[0]) => {
      setAuthError(null);
      const result = await login(credentials);

      if (!result.success && result.error) {
        setAuthError({
          type: "auth",
          message: result.error,
        });
      }

      return result;
    },
    [login]
  );

  // Check if user is fully authorized
  const isAuthorized = useCallback(() => {
    if (!isAuthenticated || !user) return false;
    if (requireTenant && !currentTenant) return false;

    // Check user type
    if (allowedUserTypes.length > 0) {
      const hasValidUserType = allowedUserTypes.some((userType) =>
        hasUserType(userType)
      );
      if (!hasValidUserType) return false;
    }

    // Check role
    if (allowedRoles.length > 0) {
      const hasValidRole = allowedRoles.some((role) => hasRole(role));
      if (!hasValidRole) return false;
    }

    // Check permissions
    if (requiredPermissions.length > 0) {
      if (!hasAnyPermission(requiredPermissions)) return false;
    }

    return true;
  }, [
    isAuthenticated,
    user,
    requireTenant,
    currentTenant,
    allowedUserTypes,
    allowedRoles,
    requiredPermissions,
    hasUserType,
    hasRole,
    hasAnyPermission,
  ]);

  // Get current auth status
  const getAuthStatus = useCallback((): AuthStatus => {
    return {
      isLoading: isInitializing || authLoading || tenantLoading,
      isAuthenticated,
      isAuthorized: isAuthorized(),
      hasValidTenant: Boolean(currentTenant),
      error: authError,
      user,
      currentTenant,
    };
  }, [
    isInitializing,
    authLoading,
    tenantLoading,
    isAuthenticated,
    isAuthorized,
    currentTenant,
    authError,
    user,
  ]);

  // Permission check utilities
  const checkPermission = useCallback(
    (permission: string) => {
      return hasPermission(permission);
    },
    [hasPermission]
  );

  const checkAnyPermission = useCallback(
    (permissions: string[]) => {
      return hasAnyPermission(permissions);
    },
    [hasAnyPermission]
  );

  const checkRole = useCallback(
    (roleName: string) => {
      return hasRole(roleName);
    },
    [hasRole]
  );

  const checkUserType = useCallback(
    (userType: UserType) => {
      return hasUserType(userType);
    },
    [hasUserType]
  );

  // Clear error manually
  const clearAuthError = useCallback(() => {
    setAuthError(null);
    clearError();
  }, [clearError]);

  // Refresh auth state
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
        type: "network",
        message: "Failed to refresh authentication",
        details: error,
      });
      return false;
    }
  }, [checkAuth, isAuthenticated, requireTenant, fetchTenants]);

  // Get loading state
  const isLoading = isInitializing || authLoading || tenantLoading;

  // Check if there are blocking errors
  const hasBlockingError = Boolean(
    authError &&
      ["auth", "tenant", "userType", "role", "permission"].includes(
        authError.type
      )
  );

  return {
    // Core auth state
    user,
    isAuthenticated,
    isAuthorized: isAuthorized(),
    isLoading,
    currentTenant,

    // Error state
    error: authError,
    hasBlockingError,
    isInitializing,

    // Actions
    login: enhancedLogin,
    logout: enhancedLogout,
    refreshAuth,

    // Permission utilities
    hasPermission: checkPermission,
    hasAnyPermission: checkAnyPermission,
    hasRole: checkRole,
    hasUserType: checkUserType,

    // Status utilities
    getAuthStatus,

    // Error handling
    clearError: clearAuthError,

    // Computed states
    canAccess: isAuthorized() && !hasBlockingError,
    needsAuth: requireAuth && !isAuthenticated,
    needsTenant: requireTenant && isAuthenticated && !currentTenant,
  };
}
