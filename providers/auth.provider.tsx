"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useAuthStore } from "@/lib/stores/auth.store";
import { useTenantStore } from "@/lib/stores/tenant.store";
import { getTenantFromUrl } from "@/lib/utils/tenant.utils";

interface AuthProviderProps {
  children: React.ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const { checkAuth, isAuthenticated, logout } = useAuthStore();
  const { fetchCurrentTenant } = useTenantStore();

  const initializeAuth = useCallback(async () => {
    try {
      // Set tenant context from URL
      const tenantId = getTenantFromUrl();
      if (tenantId) {
        localStorage.setItem("utl_tenant_id", tenantId);
      }

      // Check authentication status
      await checkAuth();

      // Fetch current tenant data if authenticated
      const authState = useAuthStore.getState();
      if (authState.isAuthenticated) {
        try {
          // Use fetchCurrentTenant instead of fetchTenants
          await fetchCurrentTenant();
        } catch (error) {
          console.error("Failed to fetch current tenant data:", error);
        }
      }
    } catch (error) {
      console.error("Auth initialization failed:", error);
    } finally {
      setIsInitialized(true);
    }
  }, [checkAuth, fetchCurrentTenant]);

  // Initialize on mount
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Handle browser events for better UX
  useEffect(() => {
    if (!isInitialized) return;

    const handleVisibilityChange = () => {
      if (!document.hidden && isAuthenticated) {
        // Silently refresh auth when tab becomes visible
        checkAuth().catch(console.error);
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      // Handle logout in other tabs
      if (e.key === "auth_logout") {
        logout();
      }
      // Handle login in other tabs
      if (e.key === "auth_token" && e.newValue) {
        checkAuth().catch(console.error);
      }
    };

    const handleOnline = () => {
      if (isAuthenticated) {
        checkAuth().catch(console.error);
      }
    };

    // Add event listeners
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("online", handleOnline);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("online", handleOnline);
    };
  }, [isInitialized, isAuthenticated, checkAuth, logout]);

  return <>{children}</>;
}
