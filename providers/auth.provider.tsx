"use client";

import React, { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/stores/auth.store";
import { useTenantStore } from "@/lib/stores/tenant.store";
import { getTenantFromUrl } from "@/lib/utils/tenant.utils";
import { toast } from "sonner";

interface AuthProviderProps {
  children: React.ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const { checkAuth, isAuthenticated } = useAuthStore();
  const { setTenant, fetchTenants } = useTenantStore();

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Get tenant from URL
        const tenantId = getTenantFromUrl();
        if (tenantId) {
          // Set tenant context (this will be used by API clients)
          setTenant({ id: tenantId } as any); // You'll need to fetch full tenant data later
        }

        // Check authentication status
        await checkAuth();

        // If authenticated and tenant is available, fetch tenant data
        if (mounted && isAuthenticated && tenantId) {
          try {
            await fetchTenants();
          } catch (error) {
            console.error("Failed to fetch tenant data:", error);
            // Don't block app initialization for tenant fetch failures
          }
        }
      } catch (error) {
        console.error("Auth initialization failed:", error);
        // Don't show error toast on initialization failures
        // The login form will handle auth errors
      } finally {
        if (mounted) {
          setIsInitialized(true);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, [checkAuth, isAuthenticated, setTenant, fetchTenants]);

  // Handle browser tab focus to refresh auth
  useEffect(() => {
    const handleFocus = () => {
      if (isInitialized && isAuthenticated) {
        // Silently check auth status when user returns to tab
        checkAuth().catch(() => {
          // If auth check fails, the auth store will handle logout
        });
      }
    };

    const handleOnline = () => {
      if (isInitialized && isAuthenticated) {
        // When coming back online, refresh auth state
        checkAuth().catch(() => {
          toast.error("Unable to verify session. Please sign in again.");
        });
      }
    };

    // Only add listeners after initialization
    if (isInitialized) {
      window.addEventListener("focus", handleFocus);
      window.addEventListener("online", handleOnline);

      return () => {
        window.removeEventListener("focus", handleFocus);
        window.removeEventListener("online", handleOnline);
      };
    }
  }, [isInitialized, isAuthenticated, checkAuth]);

  // Show minimal loading state during initialization
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Initializing...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
