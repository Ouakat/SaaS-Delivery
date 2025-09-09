import { useEffect, useCallback, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth.store";
import { useTenantStore } from "@/lib/stores/tenant.store";
import type { UserType, User } from "@/lib/types/database/schema.types";
import type { ExtendedTenant } from "@/lib/stores/tenant.store";

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
  user: User | null;
  currentTenant: ExtendedTenant | null;
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

  // Use refs to track if redirects have already happened to prevent loops
  const redirectedToLogin = useRef(false);
  const redirectedToTenant = useRef(false);
  const redirectedToUnauthorized = useRef(false);
  const hasInitialized = useRef(false);
  const initPromise = useRef<Promise<void> | null>(null);

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

  // Memoized permission checking functions to prevent dependency changes
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

  // Memoized authorization check
  const isAuthorized = useCallback(() => {
    if (!isAuthenticated || !user) return false;
    if (requireTenant && !currentTenant) return false;

    // Check user type
    if (allowedUserTypes.length > 0) {
      const hasValidUserType = allowedUserTypes.some((userType) =>
        checkUserType(userType)
      );
      if (!hasValidUserType) return false;
    }

    // Check role
    if (allowedRoles.length > 0) {
      const hasValidRole = allowedRoles.some((role) => checkRole(role));
      if (!hasValidRole) return false;
    }

    // Check permissions
    if (requiredPermissions.length > 0) {
      if (!checkAnyPermission(requiredPermissions)) return false;
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
    checkUserType,
    checkRole,
    checkAnyPermission,
  ]);

  // Initialize authentication - only run once
  useEffect(() => {
    if (hasInitialized.current || initPromise.current) return;

    const initializeAuth = async () => {
      try {
        // First check auth
        await checkAuth();

        // If authenticated and requires tenant, fetch tenants
        // We need to check the current auth state after checkAuth completes
        const authStore = useAuthStore.getState();
        if (authStore.isAuthenticated && requireTenant && !currentTenant) {
          await fetchTenants();
        }
      } catch (error) {
        console.error("Auth initialization failed:", error);
        setAuthError({
          type: "network",
          message: "Failed to initialize authentication",
          details: error,
        });
      } finally {
        setIsInitializing(false);
        hasInitialized.current = true;
        initPromise.current = null;
      }
    };

    // Store the promise to prevent multiple concurrent initializations
    initPromise.current = initializeAuth();

    return () => {
      // Cleanup function - cancel any pending operations if needed
    };
  }, []); // Empty dependency array - only run once

  // Handle authentication requirement
  useEffect(() => {
    if (isInitializing || authLoading) return;
    if (redirectedToLogin.current) return;

    if (requireAuth && !isAuthenticated) {
      redirectedToLogin.current = true;

      setAuthError({
        type: "auth",
        message: "Authentication required",
      });

      const loginUrl = `${redirectToLogin}`;
      router.push(loginUrl);
      return;
    }

    // Reset redirect flag if user is now authenticated
    if (isAuthenticated && authError?.type === "auth") {
      redirectedToLogin.current = false;
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
    if (redirectedToTenant.current) return;

    if (isAuthenticated && requireTenant && !currentTenant) {
      redirectedToTenant.current = true;

      setAuthError({
        type: "tenant",
        message: "Tenant selection required",
      });
      router.push(redirectToTenantSelect);
      return;
    }

    // Reset redirect flag if tenant is now selected
    if (currentTenant && authError?.type === "tenant") {
      redirectedToTenant.current = false;
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

  // Handle authorization checks
  useEffect(() => {
    if (isInitializing || authLoading || !isAuthenticated || !user) return;
    if (redirectedToUnauthorized.current) return;

    const authorized = isAuthorized();

    if (!authorized) {
      redirectedToUnauthorized.current = true;

      // Determine error type
      let errorType: AuthError["type"] = "permission";
      let errorMessage = "Access denied";

      if (
        allowedUserTypes.length > 0 &&
        !allowedUserTypes.some((ut) => checkUserType(ut))
      ) {
        errorType = "userType";
        errorMessage = `Access denied. Required user types: ${allowedUserTypes.join(
          ", "
        )}`;
      } else if (
        allowedRoles.length > 0 &&
        !allowedRoles.some((role) => checkRole(role))
      ) {
        errorType = "role";
        errorMessage = `Access denied. Required roles: ${allowedRoles.join(
          ", "
        )}`;
      } else if (
        requiredPermissions.length > 0 &&
        !checkAnyPermission(requiredPermissions)
      ) {
        errorType = "permission";
        errorMessage = `Access denied. Required permissions: ${requiredPermissions.join(
          ", "
        )}`;
      }

      setAuthError({
        type: errorType,
        message: errorMessage,
        details: {
          allowedUserTypes,
          allowedRoles,
          requiredPermissions,
          userUserType: user.userType,
          userRole: user.role?.name,
          userPermissions: user.role?.permissions,
        },
      });

      router.push(redirectUnauthorized);
      return;
    }

    // Reset redirect flag if user is now authorized
    if (
      authorized &&
      (authError?.type === "userType" ||
        authError?.type === "role" ||
        authError?.type === "permission")
    ) {
      redirectedToUnauthorized.current = false;
      setAuthError(null);
    }
  }, [
    isAuthenticated,
    user,
    isAuthorized,
    authLoading,
    isInitializing,
    router,
    redirectUnauthorized,
    authError,
    allowedUserTypes,
    allowedRoles,
    requiredPermissions,
    checkUserType,
    checkRole,
    checkAnyPermission,
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
      !tenantLoading &&
      isAuthorized()
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
    isAuthorized,
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
      // Reset redirect flags
      redirectedToLogin.current = false;
      redirectedToTenant.current = false;
      redirectedToUnauthorized.current = false;
      hasInitialized.current = false;

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
      // Reset redirect flags on new login attempt
      redirectedToLogin.current = false;
      redirectedToTenant.current = false;
      redirectedToUnauthorized.current = false;

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

  // Clear error manually
  const clearAuthError = useCallback(() => {
    setAuthError(null);
    clearError();
    // Reset redirect flags when clearing errors
    redirectedToLogin.current = false;
    redirectedToTenant.current = false;
    redirectedToUnauthorized.current = false;
  }, [clearError]);

  // Refresh auth state
  const refreshAuth = useCallback(async () => {
    try {
      setAuthError(null);
      await checkAuth();
      const authStore = useAuthStore.getState();
      if (authStore.isAuthenticated && requireTenant) {
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
  }, [checkAuth, requireTenant, fetchTenants]);

  // Get loading state
  const isLoading = isInitializing || authLoading || tenantLoading;

  // Check if there are blocking errors
  const hasBlockingError = Boolean(
    authError &&
      ["auth", "tenant", "userType", "role", "permission"].includes(
        authError.type
      )
  );

  const authorizedValue = isAuthorized();

  return {
    // Core auth state
    user,
    isAuthenticated,
    isAuthorized: authorizedValue,
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
    canAccess: authorizedValue && !hasBlockingError,
    needsAuth: requireAuth && !isAuthenticated,
    needsTenant: requireTenant && isAuthenticated && !currentTenant,
  };
}
