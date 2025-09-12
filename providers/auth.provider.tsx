"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth.store";
import { useTenantStore } from "@/lib/stores/tenant.store";
import { getTenantFromUrl } from "@/lib/utils/tenant.utils";
import { toast } from "sonner";

interface AuthProviderProps {
  children: React.ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const initializationRef = useRef(false);
  const router = useRouter();
  const pathname = usePathname();

  const {
    checkAuth,
    isAuthenticated,
    logout,
    user,
    isInitialized: authInitialized,
    isCheckingAuth,
    accountStatus,
    validationStatus,
    accessLevel,
    requirements,
    updateAccountStatus,
    isAccountBlocked,
    needsProfileCompletion,
    needsValidation,
  } = useAuthStore();

  const { fetchCurrentTenant, currentTenant } = useTenantStore();

  // Route access validation
  const validateRouteAccess = useCallback(() => {
    if (!isAuthenticated || !user || !pathname) return true;

    // Public routes that don't need validation
    const publicRoutes = ["/auth", "/"];
    if (publicRoutes.some((route) => pathname.startsWith(route))) {
      return true;
    }

    // Check if account is blocked
    if (isAccountBlocked()) {
      let message = "Access denied.";
      let redirectTo = "/auth/login";

      switch (accountStatus) {
        case "PENDING":
          message = "Your account is pending admin approval.";
          break;
        case "REJECTED":
          message = "Your account has been rejected. Please contact support.";
          break;
        case "SUSPENDED":
          message = "Your account has been suspended. Please contact support.";
          break;
      }

      toast.error(message);
      router.replace(redirectTo);
      return false;
    }

    // Handle profile completion requirement
    if (needsProfileCompletion()) {
      if (
        !pathname.includes("/profile/complete") &&
        !pathname.includes("/auth")
      ) {
        toast.info("Please complete your profile to continue.");
        router.replace("/profile/complete");
        return false;
      }
    }

    // Handle validation requirement
    if (needsValidation()) {
      const limitedRoutes = [
        "/dashboard",
        "/profile",
        "/settings",
        "/validation-status",
      ];
      const isLimitedRoute = limitedRoutes.some((route) =>
        pathname.startsWith(route)
      );

      if (!isLimitedRoute && !pathname.includes("/auth")) {
        toast.warning(
          "This feature requires profile validation. You have limited access until validation is complete."
        );
        router.replace("/dashboard");
        return false;
      }
    }

    return true;
  }, [
    isAuthenticated,
    user,
    pathname,
    accountStatus,
    isAccountBlocked,
    needsProfileCompletion,
    needsValidation,
    router,
  ]);

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
      } else {
        console.warn("No tenant ID found in URL - this may cause issues");
      }

      // Only check auth if not already initialized
      if (!authInitialized && !isCheckingAuth) {
        await checkAuth();
      }

      // Get fresh auth state after check
      const authState = useAuthStore.getState();

      // Fetch account status and tenant data if authenticated
      if (authState.isAuthenticated && authState.user) {
        try {
          // Update account status to get latest workflow state
          await updateAccountStatus();

          // Fetch current tenant data if not already loaded
          if (!currentTenant) {
            await fetchCurrentTenant();
          }
        } catch (error) {
          console.warn("Failed to fetch account status or tenant data:", error);
          // Don't block initialization for these failures
        }
      }
    } catch (error) {
      console.error("Auth initialization failed:", error);

      // Handle specific initialization errors
      if (error instanceof Error) {
        if (error.message.includes("tenant")) {
          toast.error("Invalid tenant. Please check your URL.");
          router.replace("/auth/login");
        } else if (error.message.includes("network")) {
          toast.error("Network error. Please check your connection.");
        }
      }
    } finally {
      setIsInitialized(true);
    }
  }, [
    checkAuth,
    fetchCurrentTenant,
    authInitialized,
    currentTenant,
    isCheckingAuth,
    updateAccountStatus,
    router,
  ]);

  // Initialize only once on mount
  useEffect(() => {
    if (isInitialized || initializationRef.current) {
      return;
    }

    initializeAuth();
  }, [initializeAuth, isInitialized]);

  // Route access validation effect
  useEffect(() => {
    if (!isInitialized || isCheckingAuth) return;

    // Small delay to allow auth state to settle
    const timeout = setTimeout(() => {
      validateRouteAccess();
    }, 100);

    return () => clearTimeout(timeout);
  }, [
    isInitialized,
    isCheckingAuth,
    pathname,
    isAuthenticated,
    accountStatus,
    accessLevel,
    validateRouteAccess,
  ]);

  // Session monitoring and cross-tab communication
  useEffect(() => {
    if (!isInitialized) return;

    let eventThrottleTimer: NodeJS.Timeout | null = null;
    let sessionCheckTimer: NodeJS.Timeout | null = null;

    const handleStorageChange = (e: StorageEvent) => {
      // Throttle events to prevent excessive calls
      if (eventThrottleTimer) {
        clearTimeout(eventThrottleTimer);
      }

      eventThrottleTimer = setTimeout(() => {
        const state = useAuthStore.getState();

        // Handle logout in other tabs
        if (e.key === "auth_logout" && e.newValue && state.isAuthenticated) {
          toast.info("You have been logged out in another tab.");
          logout();
        }
        // Handle login in other tabs
        else if (
          e.key === "auth_login" &&
          e.newValue &&
          !state.isAuthenticated
        ) {
          toast.info("You have been logged in from another tab.");
          window.location.reload(); // Refresh to sync state
        }
        // Handle token changes
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
      // Check session when tab becomes visible
      if (!document.hidden && isAuthenticated && user) {
        const state = useAuthStore.getState();
        if (!state.isCheckingAuth && !state.isRefreshing) {
          // Update activity and check if session is still valid
          state.updateLastActivity();

          // Check for account status changes if user has been away
          const timeSinceActivity = Date.now() - state.lastActivity;
          if (timeSinceActivity > 5 * 60 * 1000) {
            // 5 minutes
            updateAccountStatus().catch(console.error);
          }
        }
      }
    };

    const handleOnline = () => {
      // Re-validate session when coming back online
      if (isAuthenticated && user) {
        const state = useAuthStore.getState();
        if (!state.isCheckingAuth && !state.isRefreshing) {
          setTimeout(() => {
            if (!state.isCheckingAuth && !state.isRefreshing) {
              checkAuth().catch(console.error);
              updateAccountStatus().catch(console.error);
            }
          }, 2000);
        }
      }
    };

    const handleOffline = () => {
      toast.warning("You're offline. Some features may not work properly.");
    };

    // Periodic session validation for authenticated users
    const startSessionMonitoring = () => {
      sessionCheckTimer = setInterval(() => {
        const state = useAuthStore.getState();

        if (
          state.isAuthenticated &&
          !state.isCheckingAuth &&
          !state.isRefreshing
        ) {
          // Check if session is expired
          if (state.isSessionExpired()) {
            toast.error("Your session has expired. Please sign in again.");
            logout();
            return;
          }

          // Show session timeout warning
          const timeUntilExpiry = state.getTimeUntilExpiry();
          if (
            timeUntilExpiry <= 5 * 60 * 1000 &&
            !state.sessionTimeoutWarning
          ) {
            // 5 minutes
            state.setSessionTimeoutWarning(true);
            toast.warning(
              "Your session will expire soon. Please save your work.",
              {
                duration: 10000,
                action: {
                  label: "Extend Session",
                  onClick: () => {
                    state.extendSession().catch(console.error);
                    state.setSessionTimeoutWarning(false);
                  },
                },
              }
            );
          }
        }
      }, 60 * 1000); // Check every minute
    };

    // Add event listeners
    window.addEventListener("storage", handleStorageChange);
    document.addEventListener("visibilitychange", handleVisibilityChange, {
      passive: true,
    });
    window.addEventListener("online", handleOnline, { passive: true });
    window.addEventListener("offline", handleOffline, { passive: true });

    // Start session monitoring for authenticated users
    if (isAuthenticated) {
      startSessionMonitoring();
    }

    return () => {
      if (eventThrottleTimer) clearTimeout(eventThrottleTimer);
      if (sessionCheckTimer) clearInterval(sessionCheckTimer);

      window.removeEventListener("storage", handleStorageChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [
    isInitialized,
    isAuthenticated,
    checkAuth,
    logout,
    user,
    updateAccountStatus,
  ]);

  // Show requirements to user if any
  useEffect(() => {
    if (!isInitialized || !isAuthenticated || !requirements.length) return;

    // Show requirements as informational toasts (not blocking)
    if (requirements.includes("Admin approval required")) {
      toast.info("Your account is pending admin approval.", {
        duration: 10000,
      });
    } else if (requirements.includes("Complete profile information")) {
      toast.info("Please complete your profile information.", {
        duration: 10000,
      });
    } else if (requirements.includes("Profile validation by admin")) {
      toast.info("Your profile is being validated by an admin.", {
        duration: 10000,
      });
    }
  }, [isInitialized, isAuthenticated, requirements]);

  return <>{children}</>;
}
