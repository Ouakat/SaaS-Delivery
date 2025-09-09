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
  const { fetchTenants } = useTenantStore();

  const initializeAuth = useCallback(async () => {
    try {
      // Set tenant context from URL
      const tenantId = getTenantFromUrl();
      if (tenantId) {
        localStorage.setItem("tenant_context", tenantId);
      }

      // Check authentication status
      await checkAuth();

      // Fetch tenant data if authenticated
      const authState = useAuthStore.getState();
      if (authState.isAuthenticated) {
        try {
          // Uncomment when tenant endpoint is ready
          // await fetchTenants();
        } catch (error) {
          console.error("Failed to fetch tenant data:", error);
        }
      }
    } catch (error) {
      console.error("Auth initialization failed:", error);
    } finally {
      setIsInitialized(true);
    }
  }, [checkAuth, fetchTenants]);

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
