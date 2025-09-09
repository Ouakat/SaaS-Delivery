"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth.store";
import { useTenantStore } from "@/lib/stores/tenant.store";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireTenant?: boolean;
  allowedRoles?: string[];
  allowedUserTypes?: string[];
  fallback?: React.ReactNode;
}

export function ProtectedRoute({
  children,
  requireAuth = true,
  requireTenant = true,
  allowedRoles = [],
  allowedUserTypes = [],
  fallback,
}: ProtectedRouteProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  const { user, isAuthenticated, checkAuth, hasRole, hasUserType } =
    useAuthStore();

  const { currentTenant, fetchTenants } = useTenantStore();

  // Initialize auth and tenant data
  useEffect(() => {
    const initialize = async () => {
      try {
        await checkAuth();

        // If user is authenticated and tenant is required, fetch tenants
        const authState = useAuthStore.getState();
        if (authState.isAuthenticated && requireTenant) {
          await fetchTenants();
        }
      } catch (error) {
        console.error("Auth initialization failed:", error);
      } finally {
        setIsInitialized(true);
        setIsLoading(false);
      }
    };

    if (!isInitialized) {
      initialize();
    }
  }, [checkAuth, fetchTenants, requireTenant, isInitialized]);

  // Handle redirects after initialization
  useEffect(() => {
    if (!isInitialized || isLoading) return;

    // Redirect to login if auth is required but user is not authenticated
    if (requireAuth && !isAuthenticated) {
      router.push(
        `/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`
      );
      return;
    }

    // Redirect to tenant selection if tenant is required but not selected
    if (requireTenant && isAuthenticated && !currentTenant) {
      router.push("/tenant-select");
      return;
    }
  }, [
    isInitialized,
    isLoading,
    requireAuth,
    requireTenant,
    isAuthenticated,
    currentTenant,
    router,
  ]);

  // Show loading state during initialization
  if (isLoading || !isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if user meets authentication requirements
  if (requireAuth && !isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  // Check if user meets tenant requirements
  if (requireTenant && !currentTenant) {
    return null; // Will redirect via useEffect
  }

  // Check role-based access
  if (allowedRoles.length > 0 && user) {
    const hasValidRole = allowedRoles.some((role) => hasRole(role));
    if (!hasValidRole) {
      return (
        fallback || (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center space-y-4">
              <h2 className="text-lg font-semibold">Access Denied</h2>
              <p className="text-muted-foreground">
                You don't have the required permissions to access this page.
              </p>
              <button
                onClick={() => router.push("/dashboard")}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        )
      );
    }
  }

  // Check user type-based access
  if (allowedUserTypes.length > 0 && user) {
    const hasValidUserType = allowedUserTypes.some((type) =>
      hasUserType(type as any)
    );
    if (!hasValidUserType) {
      return (
        fallback || (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center space-y-4">
              <h2 className="text-lg font-semibold">Access Denied</h2>
              <p className="text-muted-foreground">
                Your account type doesn't have access to this page.
              </p>
              <button
                onClick={() => router.push("/dashboard")}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        )
      );
    }
  }

  // Render protected content
  return <>{children}</>;
}

// Convenience components for common use cases
export function AdminRoute({
  children,
  ...props
}: Omit<ProtectedRouteProps, "allowedRoles">) {
  return (
    <ProtectedRoute {...props} allowedRoles={["admin"]}>
      {children}
    </ProtectedRoute>
  );
}

export function ManagerRoute({
  children,
  ...props
}: Omit<ProtectedRouteProps, "allowedRoles">) {
  return (
    <ProtectedRoute {...props} allowedRoles={["admin", "manager"]}>
      {children}
    </ProtectedRoute>
  );
}

export function TenantRoute({ children, ...props }: ProtectedRouteProps) {
  return (
    <ProtectedRoute {...props} requireTenant={true}>
      {children}
    </ProtectedRoute>
  );
}
