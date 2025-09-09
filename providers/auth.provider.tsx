"use client";

import React, { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/stores/auth.store";
import { useTenantStore } from "@/lib/stores/tenant.store";
import { getTenantFromUrl } from "@/lib/utils/tenant.utils";

interface AuthProviderProps {
  children: React.ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const { checkAuth, isAuthenticated } = useAuthStore();
  const { fetchTenants } = useTenantStore();

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Get tenant from URL for context
        const tenantId = getTenantFromUrl();
        if (tenantId) {
          // Store tenant ID in localStorage for API clients
          localStorage.setItem("tenant_context", tenantId);
        }

        // Check authentication status
        await checkAuth();

        // If authenticated, fetch tenant data
        if (mounted && isAuthenticated) {
          try {
            // await fetchTenants();
          } catch (error) {
            console.error("Failed to fetch tenant data:", error);
            // Don't block app initialization for tenant fetch failures
          }
        }
      } catch (error) {
        console.error("Auth initialization failed:", error);
        // Don't block app initialization for auth failures
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
  }, [checkAuth, isAuthenticated, fetchTenants]);

  // Handle browser events for better UX
  useEffect(() => {
    if (!isInitialized) return;

    const handleFocus = () => {
      if (isAuthenticated) {
        // Silently refresh auth when user returns to tab
        checkAuth().catch(console.error);
      }
    };

    const handleOnline = () => {
      if (isAuthenticated) {
        // Refresh auth when coming back online
        checkAuth().catch(console.error);
      }
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("online", handleOnline);
    };
  }, [isInitialized, isAuthenticated, checkAuth]);

  return <>{children}</>;
}
