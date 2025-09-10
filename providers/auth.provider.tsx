"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useAuthStore } from "@/lib/stores/auth.store";
import { useTenantStore } from "@/lib/stores/tenant.store";
import { getTenantFromUrl } from "@/lib/utils/tenant.utils";

interface AuthProviderProps {
  children: React.ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const initializationRef = useRef(false);
  const {
    checkAuth,
    isAuthenticated,
    logout,
    user,
    isInitialized: authInitialized,
  } = useAuthStore();
  const { fetchCurrentTenant, currentTenant } = useTenantStore();

  const initializeAuth = useCallback(async () => {
    // Prevent multiple initialization attempts
    if (initializationRef.current) {
      return;
    }

    initializationRef.current = true;

    try {
      // Set tenant context from URL
      const tenantId = getTenantFromUrl();
      if (tenantId) {
        localStorage.setItem("utl_tenant_id", tenantId);
      }

      // Only check auth if not already initialized
      if (!authInitialized) {
        await checkAuth();
      }

      // Fetch current tenant data if authenticated and no tenant data
      const authState = useAuthStore.getState();
      if (authState.isAuthenticated && authState.user && !currentTenant) {
        try {
          await fetchCurrentTenant();
        } catch (error) {
          console.warn("Failed to fetch current tenant data:", error);
          // Don't block initialization for tenant fetch failures
        }
      }
    } catch (error) {
      console.error("Auth initialization failed:", error);
      // Don't block initialization for auth failures
    } finally {
      setIsInitialized(true);
    }
  }, [checkAuth, fetchCurrentTenant, authInitialized, currentTenant]);

  // Initialize only once on mount
  useEffect(() => {
    // Skip if already initialized
    if (isInitialized || initializationRef.current) {
      return;
    }

    initializeAuth();
  }, [initializeAuth, isInitialized]);

  // Minimal event handlers - only for critical cross-tab communication
  useEffect(() => {
    if (!isInitialized) return;

    let eventThrottleTimer: NodeJS.Timeout | null = null;

    const handleStorageChange = (e: StorageEvent) => {
      // Throttle events to prevent excessive calls
      if (eventThrottleTimer) {
        clearTimeout(eventThrottleTimer);
      }

      eventThrottleTimer = setTimeout(() => {
        const state = useAuthStore.getState();

        // Handle logout in other tabs
        if (e.key === "auth_logout" && e.newValue && state.isAuthenticated) {
          logout();
        }
        // Handle login in other tabs
        else if (
          e.key === "auth_token" &&
          e.newValue &&
          !state.isAuthenticated
        ) {
          checkAuth().catch(console.error);
        }
      }, 500); // 500ms throttle
    };

    const handleVisibilityChange = () => {
      // Only check when tab becomes visible and user is authenticated
      if (!document.hidden && isAuthenticated && user) {
        const state = useAuthStore.getState();
        if (!state.isCheckingAuth && !state.isRefreshing) {
          state.updateLastActivity();
        }
      }
    };

    const handleOnline = () => {
      // Only check when coming back online if authenticated
      if (isAuthenticated && user) {
        const state = useAuthStore.getState();
        if (!state.isCheckingAuth && !state.isRefreshing) {
          // Use a delay to avoid immediate check after coming online
          setTimeout(() => {
            if (!state.isCheckingAuth && !state.isRefreshing) {
              checkAuth().catch(console.error);
            }
          }, 2000);
        }
      }
    };

    // Add event listeners with passive option where possible
    window.addEventListener("storage", handleStorageChange);
    document.addEventListener("visibilitychange", handleVisibilityChange, {
      passive: true,
    });
    window.addEventListener("online", handleOnline, { passive: true });

    return () => {
      if (eventThrottleTimer) {
        clearTimeout(eventThrottleTimer);
      }
      window.removeEventListener("storage", handleStorageChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("online", handleOnline);
    };
  }, [isInitialized, isAuthenticated, checkAuth, logout, user]);

  return <>{children}</>;
}
