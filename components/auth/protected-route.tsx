"use client";

import { useEffect, useState } from "react";
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
  requiredPermissions = [] 
}: ProtectedRouteProps) {
  const router = useRouter();
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);

  const { 
    isAuthenticated, 
    isLoading, 
    checkAuth, 
    user,
    error
  } = useAuthStore();

  const { fetchTenants } = useTenantStore();

  // Initialize authentication
  useEffect(() => {
    const initialize = async () => {
      try {
        await checkAuth();
        
        const authState = useAuthStore.getState();
        if (authState.isAuthenticated && authState.user) {
          // Check role/permission requirements
          const userRoles = authState.user.roles || [];
          const userPermissions = authState.user.permissions || [];
          
          const hasRequiredRoles = requiredRoles.length === 0 || 
            requiredRoles.some(role => userRoles.includes(role));
            
          const hasRequiredPermissions = requiredPermissions.length === 0 ||
            requiredPermissions.some(permission => userPermissions.includes(permission));
          
          setHasAccess(hasRequiredRoles && hasRequiredPermissions);
          
          // Fetch tenant data
          try {
            await fetchTenants();
          } catch (error) {
            console.error("Failed to fetch tenant data:", error);
          }
        }
      } catch (error) {
        console.error("Auth initialization failed:", error);
        setHasAccess(false);
      } finally {
        setIsInitialized(true);
      }
    };

    initialize();
  }, [checkAuth, fetchTenants, requiredRoles, requiredPermissions]);

  // Handle redirects after initialization
  useEffect(() => {
    if (!isInitialized || isLoading) return;

    if (!isAuthenticated) {
      const currentPath = window.location.pathname;
      const loginUrl = `/auth/login?redirect=${encodeURIComponent(currentPath)}`;
      router.replace(loginUrl);
      return;
    }

    if (isAuthenticated && !hasAccess) {
      // User is authenticated but doesn't have required permissions
      router.replace("/unauthorized");
      return;
    }
  }, [isInitialized, isLoading, isAuthenticated, hasAccess, router]);

  // Show loading during initialization
  if (!isInitialized || isLoading) {
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
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Don't render content if not authenticated or no access
  if (!isAuthenticated || !hasAccess) {
    return null;
  }

  return <>{children}</>;
}