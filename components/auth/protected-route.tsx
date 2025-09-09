"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth.store";
import { useTenantStore } from "@/lib/stores/tenant.store";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  requiredPermissions?: string[];
}

export function ProtectedRoute({
  children,
  requiredRoles = [],
  requiredPermissions = [],
}: ProtectedRouteProps) {
  const router = useRouter();
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const initRef = useRef(false);

  const { isAuthenticated, isLoading, checkAuth, user, error, isCheckingAuth } =
    useAuthStore();

  const { fetchTenants } = useTenantStore();

  // FIXED: Initialize authentication - prevent multiple calls
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const initialize = async () => {
      try {
        // Only call checkAuth if not already checking
        if (!isCheckingAuth) {
          await checkAuth();
        }

        // Check access after auth is confirmed
        const authState = useAuthStore.getState();
        if (authState.isAuthenticated && authState.user) {
          // Check role/permission requirements using the store methods
          const hasRequiredRoles =
            requiredRoles.length === 0 ||
            requiredRoles.some((role) => authState.hasRole(role));

          const hasRequiredPermissions =
            requiredPermissions.length === 0 ||
            authState.hasAnyPermission(requiredPermissions);

          setHasAccess(hasRequiredRoles && hasRequiredPermissions);

          // Fetch tenant data
          try {
            await fetchTenants();
          } catch (error) {
            console.error("Failed to fetch tenant data:", error);
          }
        } else {
          setHasAccess(false);
        }
      } catch (error) {
        console.error("Auth initialization failed:", error);
        setHasAccess(false);
      } finally {
        setIsInitialized(true);
      }
    };

    initialize();
  }, []); // Empty dependency array - only run once

  // FIXED: Handle redirects - use separate effect with proper dependencies
  useEffect(() => {
    if (!isInitialized || isLoading || isCheckingAuth) return;

    if (!isAuthenticated) {
      const loginUrl = `/auth/login`;
      router.replace(loginUrl);
      return;
    }

    if (
      (isAuthenticated && !hasAccess && requiredRoles.length > 0) ||
      requiredPermissions.length > 0
    ) {
      router.replace("/unauthorized");
      return;
    }
  }, [
    isInitialized,
    isLoading,
    isAuthenticated,
    hasAccess,
    router,
    isCheckingAuth,
    requiredRoles.length,
    requiredPermissions.length,
  ]);

  // Show loading during initialization
  if (!isInitialized || isLoading || isCheckingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Initializing...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="text-red-500 text-lg">Authentication Error</div>
          <p className="text-muted-foreground">{error}</p>
          <button
            onClick={() => {
              initRef.current = false;
              window.location.reload();
            }}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Don't render content if not authenticated or no access
  if (
    !isAuthenticated ||
    (!hasAccess && (requiredRoles.length > 0 || requiredPermissions.length > 0))
  ) {
    return null;
  }

  return <>{children}</>;
}
