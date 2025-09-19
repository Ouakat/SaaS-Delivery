"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth/auth.store";
import { useTenantStore } from "@/lib/stores/auth/tenant.store";
import { getTenantFromUrl } from "@/lib/utils/tenant.utils";
import { toast } from "sonner";

interface AuthProviderProps {
  children: React.ReactNode;
}

// Constants
const THROTTLE_DELAY = 500;
const SESSION_CHECK_INTERVAL = 60 * 1000; // 1 minute
const SESSION_WARNING_TIME = 5 * 60 * 1000; // 5 minutes
const ACTIVITY_THRESHOLD = 5 * 60 * 1000; // 5 minutes
const ONLINE_RECHECK_DELAY = 2000;

const PUBLIC_ROUTES = ["/auth", "/"];
const LIMITED_ROUTES = [
  "/dashboard",
  "/profile",
  "/settings",
  "/validation-status",
];

const ACCOUNT_STATUS_MESSAGES = {
  PENDING: "Your account is pending admin approval.",
  REJECTED: "Your account has been rejected. Please contact support.",
  SUSPENDED: "Your account has been suspended. Please contact support.",
} as const;

const REQUIREMENT_MESSAGES = {
  "Admin approval required": "Your account is pending admin approval.",
  "Complete profile information": "Please complete your profile information.",
  "Profile validation by admin": "Your profile is being validated by an admin.",
} as const;

export default function AuthProvider({ children }: AuthProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const initializationRef = useRef(false);
  const timersRef = useRef<{
    eventThrottle?: NodeJS.Timeout;
    sessionCheck?: NodeJS.Timeout;
    routeValidation?: NodeJS.Timeout;
  }>({});

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
    accessLevel,
    requirements,
    updateAccountStatus,
    isAccountBlocked,
    needsProfileCompletion,
    needsValidation,
  } = useAuthStore();

  const { fetchCurrentTenant, currentTenant } = useTenantStore();

  // Cleanup timers utility
  const cleanupTimers = useCallback(() => {
    Object.values(timersRef.current).forEach((timer) => {
      if (timer) clearTimeout(timer);
    });
    timersRef.current = {};
  }, []);

  // Route access validation
  const validateRouteAccess = useCallback(() => {
    if (!isAuthenticated || !user || !pathname) return true;

    // Skip validation for public routes
    if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
      return true;
    }

    // Check blocked account
    if (isAccountBlocked()) {
      const message =
        ACCOUNT_STATUS_MESSAGES[
          accountStatus as keyof typeof ACCOUNT_STATUS_MESSAGES
        ] || "Access denied.";
      toast.error(message);
      router.replace("/auth/login");
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
      return true;
    }

    // Handle validation requirement
    if (needsValidation()) {
      const isLimitedRoute = LIMITED_ROUTES.some((route) =>
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

  // Initialize auth and tenant context
  const initializeAuth = useCallback(async () => {
    if (initializationRef.current) return;
    initializationRef.current = true;

    try {
      // Set tenant context
      const tenantId = getTenantFromUrl();
      if (tenantId) {
        localStorage.setItem("utl_tenant_id", tenantId);
      } else {
        console.warn("No tenant ID found in URL");
      }

      // Check authentication if needed
      if (!authInitialized && !isCheckingAuth) {
        await checkAuth();
      }

      // Get fresh auth state and fetch additional data if authenticated
      const authState = useAuthStore.getState();
      if (authState.isAuthenticated && authState.user) {
        const promises = [];

        // Update account status
        promises.push(
          updateAccountStatus().catch((error) => {
            console.warn("Failed to fetch account status:", error);
          })
        );

        // Fetch tenant data if not loaded
        if (!currentTenant) {
          promises.push(
            fetchCurrentTenant().catch((error) => {
              console.warn("Failed to fetch tenant data:", error);
            })
          );
        }

        // Execute in parallel, don't block on failures
        await Promise.allSettled(promises);
      }
    } catch (error) {
      console.error("Auth initialization failed:", error);

      // Handle specific errors with appropriate user feedback
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

  // Session monitoring setup
  const setupSessionMonitoring = useCallback(() => {
    if (!isAuthenticated) return;

    const sessionCheckTimer = setInterval(() => {
      const state = useAuthStore.getState();

      if (
        !state.isAuthenticated ||
        state.isCheckingAuth ||
        state.isRefreshing
      ) {
        return;
      }

      // Check session expiry
      if (state.isSessionExpired()) {
        toast.error("Your session has expired. Please sign in again.");
        logout();
        return;
      }

      // Session timeout warning
      const timeUntilExpiry = state.getTimeUntilExpiry();
      if (
        timeUntilExpiry <= SESSION_WARNING_TIME &&
        !state.sessionTimeoutWarning
      ) {
        state.setSessionTimeoutWarning(true);
        toast.warning("Your session will expire soon. Please save your work.", {
          duration: 10000,
          action: {
            label: "Extend Session",
            onClick: () => {
              state.extendSession().catch(console.error);
              state.setSessionTimeoutWarning(false);
            },
          },
        });
      }
    }, SESSION_CHECK_INTERVAL);

    timersRef.current.sessionCheck = sessionCheckTimer;
  }, [isAuthenticated, logout]);

  // Cross-tab communication handlers
  const handleStorageChange = useCallback(
    (e: StorageEvent) => {
      if (timersRef.current.eventThrottle) {
        clearTimeout(timersRef.current.eventThrottle);
      }

      timersRef.current.eventThrottle = setTimeout(() => {
        const state = useAuthStore.getState();

        switch (e.key) {
          case "auth_logout":
            if (e.newValue && state.isAuthenticated) {
              toast.info("You have been logged out in another tab.");
              logout();
            }
            break;
          case "auth_login":
            if (e.newValue && !state.isAuthenticated) {
              toast.info("You have been logged in from another tab.");
              window.location.reload();
            }
            break;
          case "auth_token":
            if (e.newValue && !state.isAuthenticated) {
              checkAuth().catch(console.error);
            }
            break;
        }
      }, THROTTLE_DELAY);
    },
    [logout, checkAuth]
  );

  const handleVisibilityChange = useCallback(() => {
    if (document.hidden || !isAuthenticated || !user) return;

    const state = useAuthStore.getState();
    if (state.isCheckingAuth || state.isRefreshing) return;

    state.updateLastActivity();

    // Check account status if user has been away
    const timeSinceActivity = Date.now() - state.lastActivity;
    if (timeSinceActivity > ACTIVITY_THRESHOLD) {
      updateAccountStatus().catch(console.error);
    }
  }, [isAuthenticated, user, updateAccountStatus]);

  const handleOnline = useCallback(() => {
    if (!isAuthenticated || !user) return;

    const state = useAuthStore.getState();
    if (state.isCheckingAuth || state.isRefreshing) return;

    setTimeout(() => {
      const currentState = useAuthStore.getState();
      if (!currentState.isCheckingAuth && !currentState.isRefreshing) {
        Promise.allSettled([checkAuth(), updateAccountStatus()]).catch(
          console.error
        );
      }
    }, ONLINE_RECHECK_DELAY);
  }, [isAuthenticated, user, checkAuth, updateAccountStatus]);

  const handleOffline = useCallback(() => {
    toast.warning("You're offline. Some features may not work properly.");
  }, []);

  // Main initialization effect
  useEffect(() => {
    if (isInitialized || initializationRef.current) return;
    initializeAuth();
  }, [initializeAuth, isInitialized]);

  // Route validation effect
  useEffect(() => {
    if (!isInitialized || isCheckingAuth) return;

    if (timersRef.current.routeValidation) {
      clearTimeout(timersRef.current.routeValidation);
    }

    timersRef.current.routeValidation = setTimeout(() => {
      validateRouteAccess();
    }, 100);

    return () => {
      if (timersRef.current.routeValidation) {
        clearTimeout(timersRef.current.routeValidation);
      }
    };
  }, [
    isInitialized,
    isCheckingAuth,
    pathname,
    isAuthenticated,
    accountStatus,
    accessLevel,
    validateRouteAccess,
  ]);

  // Event listeners and session monitoring
  useEffect(() => {
    if (!isInitialized) return;

    // Add event listeners
    window.addEventListener("storage", handleStorageChange);
    document.addEventListener("visibilitychange", handleVisibilityChange, {
      passive: true,
    });
    window.addEventListener("online", handleOnline, { passive: true });
    window.addEventListener("offline", handleOffline, { passive: true });

    // Setup session monitoring
    setupSessionMonitoring();

    return () => {
      // Cleanup event listeners
      window.removeEventListener("storage", handleStorageChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);

      // Cleanup timers
      cleanupTimers();
    };
  }, [
    isInitialized,
    handleStorageChange,
    handleVisibilityChange,
    handleOnline,
    handleOffline,
    setupSessionMonitoring,
    cleanupTimers,
  ]);

  // Requirements notifications
  useEffect(() => {
    if (!isInitialized || !isAuthenticated || !requirements.length) return;

    // Show only the first unhandled requirement to avoid toast spam
    const firstRequirement =
      requirements[0] as keyof typeof REQUIREMENT_MESSAGES;
    const message = REQUIREMENT_MESSAGES[firstRequirement];

    if (message) {
      toast.info(message, { duration: 10000 });
    }
  }, [isInitialized, isAuthenticated, requirements]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupTimers();
      initializationRef.current = false;
    };
  }, [cleanupTimers]);

  return <>{children}</>;
}
