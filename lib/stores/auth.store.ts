import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authApiClient } from "@/lib/api/clients/auth.client";
import { usersApiClient } from "@/lib/api/clients/users.client";
import { setCookie, getCookie, deleteCookie } from "@/lib/utils/cookie.utils";
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

  // Prevent infinite loops
  isCheckingAuth: boolean;
  isRefreshing: boolean;

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

// Helper function to store tokens in both localStorage and cookies
const storeTokens = (
  accessToken: string,
  refreshToken: string,
  expiresIn: number
) => {
  if (typeof window === "undefined") return;

  // Store in localStorage for client-side access
  localStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);

  // Store in cookies for server-side middleware access
  const tokenExpiryDays = Math.ceil(expiresIn / (24 * 60 * 60)); // Convert seconds to days
  setCookie(TOKEN_STORAGE_KEY, accessToken, tokenExpiryDays);
  setCookie(REFRESH_TOKEN_STORAGE_KEY, refreshToken, tokenExpiryDays);

  // Cross-tab communication
  localStorage.setItem("auth_login", Date.now().toString());
  localStorage.removeItem("auth_logout");
};

// Helper function to clear tokens from both localStorage and cookies
const clearTokens = () => {
  if (typeof window === "undefined") return;

  // Clear localStorage
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);

  // Clear cookies
  deleteCookie(TOKEN_STORAGE_KEY);
  deleteCookie(REFRESH_TOKEN_STORAGE_KEY);

  // Cross-tab communication
  localStorage.setItem("auth_logout", Date.now().toString());
  localStorage.removeItem("auth_login");
};

// Helper function to get tokens (prioritize localStorage, fallback to cookies)
const getStoredTokens = () => {
  if (typeof window === "undefined")
    return { accessToken: null, refreshToken: null };

  const accessToken =
    localStorage.getItem(TOKEN_STORAGE_KEY) || getCookie(TOKEN_STORAGE_KEY);
  const refreshToken =
    localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY) ||
    getCookie(REFRESH_TOKEN_STORAGE_KEY);

  return { accessToken, refreshToken };
};

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
      isCheckingAuth: false,
      isRefreshing: false,

      // Login method
      login: async (credentials: LoginRequest) => {
        set({ isLoading: true, error: null });

        try {
          const response = await authApiClient.login(credentials);

          if (response.success && response.data) {
            const { user, accessToken, refreshToken, expiresIn } =
              response.data;
            const tokenExpiresAt = Date.now() + expiresIn * 1000;

            // Store tokens in both localStorage and cookies
            storeTokens(accessToken, refreshToken, expiresIn);

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

      // Register method
      register: async (userData: RegisterRequest) => {
        set({ isLoading: true, error: null });

        try {
          const response = await authApiClient.register(userData);

          if (response.success && response.data) {
            // Since API returns LoginResponse, we can auto-login the user
            const { user, accessToken, refreshToken, expiresIn } =
              response.data;
            const tokenExpiresAt = Date.now() + expiresIn * 1000;

            // Store tokens
            storeTokens(accessToken, refreshToken, expiresIn);

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

      // Logout method
      logout: async () => {
        const { refreshToken } = get();

        try {
          if (refreshToken) {
            await authApiClient.logout({ refreshToken });
          }
        } catch (error) {
          console.error("Logout API call failed:", error);
        }

        // Clear all tokens
        clearTokens();

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
          isCheckingAuth: false,
          isRefreshing: false,
        });
      },

      // Refresh session method
      refreshSession: async () => {
        const { refreshToken, isRefreshing } = get();

        if (isRefreshing) return false;

        if (!refreshToken) {
          await get().logout();
          return false;
        }

        set({ isRefreshing: true });

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

            // Store new tokens
            storeTokens(accessToken, newRefreshToken, expiresIn);

            set({
              user,
              accessToken,
              refreshToken: newRefreshToken,
              tokenExpiresAt,
              lastActivity: Date.now(),
              sessionTimeoutWarning: false,
              isInitialized: true,
              isAuthenticated: true,
              isRefreshing: false,
            });

            return true;
          } else {
            set({ isRefreshing: false });
            await get().logout();
            return false;
          }
        } catch (error) {
          console.error("Token refresh failed:", error);
          set({ isRefreshing: false });
          await get().logout();
          return false;
        }
      },

      // Check auth method
      checkAuth: async () => {
        const { isCheckingAuth, isRefreshing } = get();

        if (isCheckingAuth || isRefreshing) return;

        set({ isCheckingAuth: true });

        try {
          const { accessToken, refreshToken } = getStoredTokens();

          if (!accessToken || !refreshToken) {
            set({
              isAuthenticated: false,
              isLoading: false,
              isInitialized: true,
              user: null,
              accessToken: null,
              refreshToken: null,
              tokenExpiresAt: null,
              isCheckingAuth: false,
            });
            return;
          }

          // Set tokens for API calls
          set({
            accessToken,
            refreshToken,
          });

          // Verify token with server
          const response = await authApiClient.getProfile();

          if (response.success && response.data) {
            set({
              user: response.data,
              isAuthenticated: true,
              isLoading: false,
              lastActivity: Date.now(),
              isInitialized: true,
              error: null,
              isCheckingAuth: false,
            });
          } else {
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
                isCheckingAuth: false,
              });
            } else {
              set({ isCheckingAuth: false });
            }
          }
        } catch (error) {
          console.error("Auth check failed:", error);

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
              isCheckingAuth: false,
            });
          } else {
            set({ isCheckingAuth: false });
          }
        }
      },

      // Session extension method
      extendSession: async () => {
        const { isAuthenticated, tokenExpiresAt, isRefreshing } = get();

        if (!isAuthenticated || isRefreshing) return;

        const timeUntilExpiry = tokenExpiresAt
          ? tokenExpiresAt - Date.now()
          : 0;

        if (timeUntilExpiry <= AUTO_REFRESH_THRESHOLD) {
          await get().refreshSession();
        } else {
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
      }),
      version: 2,
      migrate: (persistedState: any, version: number) => {
        if (version < 2) {
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

// Session monitoring remains the same...
if (typeof window !== "undefined") {
  let monitoringInterval: NodeJS.Timeout;
  let isMonitoring = false;

  const startSessionMonitoring = () => {
    if (isMonitoring) return;
    isMonitoring = true;

    const checkSession = () => {
      const state = useAuthStore.getState();

      if (
        !state.isAuthenticated ||
        !state.isInitialized ||
        state.isCheckingAuth ||
        state.isRefreshing
      ) {
        return;
      }

      const timeUntilExpiry = state.getTimeUntilExpiry();
      const timeSinceActivity = Date.now() - state.lastActivity;

      if (
        timeUntilExpiry <= WARNING_THRESHOLD &&
        !state.sessionTimeoutWarning
      ) {
        state.setSessionTimeoutWarning(true);
      }

      if (timeUntilExpiry <= AUTO_REFRESH_THRESHOLD && timeUntilExpiry > 0) {
        state.refreshSession().catch(console.error);
      }

      if (timeSinceActivity > SESSION_TIMEOUT) {
        state.logout().catch(console.error);
      }
    };

    monitoringInterval = setInterval(checkSession, 60 * 1000);

    const handleStorageChange = (e: StorageEvent) => {
      const state = useAuthStore.getState();

      if (e.key === "auth_logout" && e.newValue) {
        state.logout();
      } else if (
        e.key === "auth_login" &&
        e.newValue &&
        !state.isAuthenticated
      ) {
        state.checkAuth();
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        const state = useAuthStore.getState();
        if (state.isAuthenticated && !state.isCheckingAuth) {
          state.updateLastActivity();
          const timeSinceActivity = Date.now() - state.lastActivity;
          if (timeSinceActivity > 5 * 60 * 1000) {
            state.checkAuth();
          }
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (monitoringInterval) {
        clearInterval(monitoringInterval);
      }
      window.removeEventListener("storage", handleStorageChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      isMonitoring = false;
    };
  };

  startSessionMonitoring();
}
