import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authApiClient } from "@/lib/api/clients/auth.client";
import { usersApiClient } from "@/lib/api/clients/users.client";
import type { User, UserType } from "@/lib/types/database/schema.types";
import type {
  LoginRequest,
  RegisterRequest,
} from "@/lib/api/clients/auth.client";

interface AuthState {
  // Core state
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Token management
  accessToken: string | null;
  refreshToken: string | null;
  tokenExpiresAt: number | null;

  // Session management
  lastActivity: number;
  sessionTimeoutWarning: boolean;

  // Actions
  login: (
    credentials: LoginRequest
  ) => Promise<{ success: boolean; error?: string }>;
  register: (
    userData: RegisterRequest
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  checkAuth: () => Promise<void>;

  // User management
  updateUser: (userData: Partial<User>) => void;
  updateProfile: (profileData: any) => Promise<boolean>;

  // Permission methods
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  hasRole: (roleName: string) => boolean;
  hasUserType: (userType: UserType) => boolean;

  // Session utilities
  updateLastActivity: () => void;
  isSessionExpired: () => boolean;
  getTimeUntilExpiry: () => number;
  setSessionTimeoutWarning: (show: boolean) => void;
  extendSession: () => Promise<void>;

  // State management
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

const TOKEN_STORAGE_KEY = "auth_token";
const REFRESH_TOKEN_STORAGE_KEY = "refresh_token";
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const WARNING_THRESHOLD = 5 * 60 * 1000; // 5 minutes before timeout
const AUTO_REFRESH_THRESHOLD = 2 * 60 * 1000; // 2 minutes before expiry

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      isInitialized: false,
      accessToken: null,
      refreshToken: null,
      tokenExpiresAt: null,
      lastActivity: Date.now(),
      sessionTimeoutWarning: false,

      // Optimized login method
      login: async (credentials: LoginRequest) => {
        set({ isLoading: true, error: null });

        try {
          const response = await authApiClient.login(credentials);

          if (response.success && response.data) {
            const { user, accessToken, refreshToken, expiresIn } =
              response.data;
            const tokenExpiresAt = Date.now() + expiresIn * 1000;

            // Store tokens securely
            if (typeof window !== "undefined") {
              localStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
              localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);

              // Notify other tabs about login
              localStorage.setItem("auth_login", Date.now().toString());
              localStorage.removeItem("auth_logout");
            }

            set({
              user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
              accessToken,
              refreshToken,
              tokenExpiresAt,
              lastActivity: Date.now(),
              isInitialized: true,
              sessionTimeoutWarning: false,
            });

            return { success: true };
          } else {
            const error = response.error?.message || "Login failed";
            set({
              isLoading: false,
              error,
              isInitialized: true,
              isAuthenticated: false,
            });
            return { success: false, error };
          }
        } catch (error: any) {
          const errorMessage = error?.message || "Network error during login";
          set({
            isLoading: false,
            error: errorMessage,
            isInitialized: true,
            isAuthenticated: false,
          });
          return { success: false, error: errorMessage };
        }
      },

      // Optimized register method
      register: async (userData: RegisterRequest) => {
        set({ isLoading: true, error: null });

        try {
          const response = await authApiClient.register(userData);

          if (response.success && response.data) {
            // Most registration flows require email verification
            // Don't auto-login after registration
            set({
              isLoading: false,
              error: null,
              isInitialized: true,
            });

            return { success: true };
          } else {
            const error = response.error?.message || "Registration failed";
            set({ isLoading: false, error, isInitialized: true });
            return { success: false, error };
          }
        } catch (error: any) {
          const errorMessage =
            error?.message || "Network error during registration";
          set({ isLoading: false, error: errorMessage, isInitialized: true });
          return { success: false, error: errorMessage };
        }
      },

      // Enhanced logout method
      logout: async () => {
        const { refreshToken } = get();

        try {
          if (refreshToken) {
            await authApiClient.logout({ refreshToken });
          }
        } catch (error) {
          console.error("Logout API call failed:", error);
        }

        // Clear everything
        if (typeof window !== "undefined") {
          localStorage.removeItem(TOKEN_STORAGE_KEY);
          localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
          localStorage.setItem("auth_logout", Date.now().toString());
          localStorage.removeItem("auth_login");
        }

        set({
          user: null,
          isAuthenticated: false,
          accessToken: null,
          refreshToken: null,
          tokenExpiresAt: null,
          error: null,
          sessionTimeoutWarning: false,
          isInitialized: true,
          lastActivity: Date.now(),
        });
      },

      // Improved refresh session method
      refreshSession: async () => {
        const { refreshToken, isAuthenticated } = get();

        if (!refreshToken || !isAuthenticated) {
          await get().logout();
          return false;
        }

        try {
          const response = await authApiClient.refreshToken({ refreshToken });

          if (response.success && response.data) {
            const {
              user,
              accessToken,
              refreshToken: newRefreshToken,
              expiresIn,
            } = response.data;
            const tokenExpiresAt = Date.now() + expiresIn * 1000;

            if (typeof window !== "undefined") {
              localStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
              localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, newRefreshToken);
            }

            set({
              user,
              accessToken,
              refreshToken: newRefreshToken,
              tokenExpiresAt,
              lastActivity: Date.now(),
              sessionTimeoutWarning: false,
              isInitialized: true,
              isAuthenticated: true,
            });

            return true;
          } else {
            await get().logout();
            return false;
          }
        } catch (error) {
          console.error("Token refresh failed:", error);
          await get().logout();
          return false;
        }
      },

      // Improved checkAuth method
      checkAuth: async () => {
        // Don't set loading if already initialized
        const { isInitialized } = get();
        if (!isInitialized) {
          set({ isLoading: true });
        }

        try {
          const storedToken =
            typeof window !== "undefined"
              ? localStorage.getItem(TOKEN_STORAGE_KEY)
              : null;
          const storedRefreshToken =
            typeof window !== "undefined"
              ? localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY)
              : null;

          if (!storedToken || !storedRefreshToken) {
            set({
              isAuthenticated: false,
              isLoading: false,
              isInitialized: true,
              user: null,
              accessToken: null,
              refreshToken: null,
              tokenExpiresAt: null,
            });
            return;
          }

          // Verify token with server
          const response = await authApiClient.getProfile();

          if (response.success && response.data) {
            console.log("🚀 ~ storedToken:", storedToken);
            console.log("🚀 ~ storedRefreshToken:", storedRefreshToken);
            set({
              user: response.data,
              isAuthenticated: true,
              isLoading: false,
              accessToken: storedToken,
              refreshToken: storedRefreshToken,
              lastActivity: Date.now(),
              isInitialized: true,
              error: null,
            });
          } else {
            // Try to refresh token
            set({
              accessToken: storedToken,
              refreshToken: storedRefreshToken,
              isAuthenticated: true, // Temporarily set for refresh attempt
            });

            const refreshed = await get().refreshSession();
            if (!refreshed) {
              set({
                user: null,
                isAuthenticated: false,
                accessToken: null,
                refreshToken: null,
                tokenExpiresAt: null,
                isLoading: false,
                isInitialized: true,
              });
            }
          }
        } catch (error) {
          console.error("Auth check failed:", error);

          // Try refresh if we have tokens
          const storedRefreshToken =
            typeof window !== "undefined"
              ? localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY)
              : null;

          if (storedRefreshToken) {
            set({
              refreshToken: storedRefreshToken,
              isAuthenticated: true, // Temporarily set for refresh attempt
            });

            const refreshed = await get().refreshSession();
            if (refreshed) return;
          }

          set({
            user: null,
            isAuthenticated: false,
            accessToken: null,
            refreshToken: null,
            tokenExpiresAt: null,
            isLoading: false,
            isInitialized: true,
          });
        }
      },

      // Session extension method
      extendSession: async () => {
        const { isAuthenticated, tokenExpiresAt } = get();

        if (!isAuthenticated) return;

        const timeUntilExpiry = tokenExpiresAt
          ? tokenExpiresAt - Date.now()
          : 0;

        // Only refresh if close to expiry
        if (timeUntilExpiry <= AUTO_REFRESH_THRESHOLD) {
          await get().refreshSession();
        } else {
          // Just update activity
          get().updateLastActivity();
        }
      },

      // Rest of the methods remain the same...
      updateUser: (userData: Partial<User>) => {
        const { user } = get();
        if (user) {
          set({ user: { ...user, ...userData } });
        }
      },

      updateProfile: async (profileData: any) => {
        const { user } = get();
        if (!user) return false;

        try {
          const response = await usersApiClient.updateUser(
            user.id,
            profileData
          );
          if (response.success && response.data) {
            set({ user: response.data });
            return true;
          }
        } catch (error) {
          console.error("Profile update failed:", error);
        }
        return false;
      },

      hasPermission: (permission: string) => {
        const { user } = get();
        if (!user?.role?.permissions) return false;
        const permissions = user.role.permissions;
        return permissions.includes(permission) || permissions.includes("*");
      },

      hasAnyPermission: (permissions: string[]) => {
        return permissions.some((permission) =>
          get().hasPermission(permission)
        );
      },

      hasAllPermissions: (permissions: string[]) => {
        return permissions.every((permission) =>
          get().hasPermission(permission)
        );
      },

      hasRole: (roleName: string) => {
        const { user } = get();
        return user?.role?.name === roleName;
      },

      hasUserType: (userType: UserType) => {
        const { user } = get();
        return user?.userType === userType;
      },

      updateLastActivity: () => {
        set({ lastActivity: Date.now() });
      },

      isSessionExpired: () => {
        const { lastActivity } = get();
        return Date.now() - lastActivity > SESSION_TIMEOUT;
      },

      getTimeUntilExpiry: () => {
        const { tokenExpiresAt } = get();
        if (!tokenExpiresAt) return 0;
        return Math.max(0, tokenExpiresAt - Date.now());
      },

      setSessionTimeoutWarning: (show: boolean) => {
        set({ sessionTimeoutWarning: show });
      },

      clearError: () => {
        set({ error: null });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: "auth-store",
      partialize: (state) => ({
        user: state.user,
        lastActivity: state.lastActivity,
        // Don't persist authentication state - let checkAuth determine this
      }),
      version: 2, // Increment version for breaking changes
      migrate: (persistedState: any, version: number) => {
        if (version < 2) {
          // Reset state for version 2 to ensure clean migration
          return {
            user: persistedState?.user || null,
            lastActivity: persistedState?.lastActivity || Date.now(),
          };
        }
        return persistedState;
      },
    }
  )
);

// Enhanced session monitoring
if (typeof window !== "undefined") {
  let monitoringInterval: NodeJS.Timeout;
  let isMonitoring = false;

  const startSessionMonitoring = () => {
    if (isMonitoring) return;
    isMonitoring = true;

    const checkSession = () => {
      const state = useAuthStore.getState();

      if (!state.isAuthenticated || !state.isInitialized) return;

      const timeUntilExpiry = state.getTimeUntilExpiry();
      const timeSinceActivity = Date.now() - state.lastActivity;

      // Show warning if close to expiry
      if (
        timeUntilExpiry <= WARNING_THRESHOLD &&
        !state.sessionTimeoutWarning
      ) {
        state.setSessionTimeoutWarning(true);
      }

      // Auto-refresh if token is expiring soon
      if (timeUntilExpiry <= AUTO_REFRESH_THRESHOLD && timeUntilExpiry > 0) {
        state.refreshSession().catch(console.error);
      }

      // Logout if session expired due to inactivity
      if (timeSinceActivity > SESSION_TIMEOUT) {
        state.logout().catch(console.error);
      }
    };

    // Check every 30 seconds
    monitoringInterval = setInterval(checkSession, 30 * 1000);

    // Handle cross-tab authentication
    const handleStorageChange = (e: StorageEvent) => {
      const state = useAuthStore.getState();

      if (e.key === "auth_logout" && e.newValue) {
        // Another tab logged out
        state.logout();
      } else if (e.key === "auth_login" && e.newValue) {
        // Another tab logged in
        state.checkAuth();
      }
    };

    // Handle visibility change
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        const state = useAuthStore.getState();
        if (state.isAuthenticated) {
          state.updateLastActivity();
          state.checkAuth(); // Verify auth when tab becomes visible
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Cleanup function
    return () => {
      if (monitoringInterval) {
        clearInterval(monitoringInterval);
      }
      window.removeEventListener("storage", handleStorageChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      isMonitoring = false;
    };
  };

  // Start monitoring
  startSessionMonitoring();
}
