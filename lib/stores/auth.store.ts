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
  isInitialized: boolean; // Add this to track if auth check is complete

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

  // State management
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

const TOKEN_STORAGE_KEY = "auth_token";
const REFRESH_TOKEN_STORAGE_KEY = "refresh_token";
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const WARNING_THRESHOLD = 5 * 60 * 1000; // 5 minutes before timeout

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      isInitialized: false, // Add this
      accessToken: null,
      refreshToken: null,
      tokenExpiresAt: null,
      lastActivity: Date.now(),
      sessionTimeoutWarning: false,

      // Login method
      login: async (credentials: LoginRequest) => {
        set({ isLoading: true, error: null });

        try {
          const response = await authApiClient.login(credentials);

          if (response.success && response.data) {
            const { user, accessToken, refreshToken, expiresIn } =
              response.data;
            const tokenExpiresAt = Date.now() + expiresIn * 1000;

            // Store tokens in localStorage
            if (typeof window !== "undefined") {
              localStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
              localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
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
            });

            return { success: true };
          } else {
            const error = response.error?.message || "Login failed";
            set({ isLoading: false, error, isInitialized: true });
            return { success: false, error };
          }
        } catch (error: any) {
          const errorMessage = error?.message || "Network error during login";
          set({ isLoading: false, error: errorMessage, isInitialized: true });
          return { success: false, error: errorMessage };
        }
      },

      // Register method
      register: async (userData: RegisterRequest) => {
        set({ isLoading: true, error: null });

        try {
          const response = await authApiClient.register(userData);

          if (response.success && response.data) {
            const { user, accessToken, refreshToken, expiresIn } =
              response.data;
            const tokenExpiresAt = Date.now() + expiresIn * 1000;

            // Store tokens
            if (typeof window !== "undefined") {
              localStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
              localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
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
          // Continue with local cleanup even if API call fails
        }

        // Clear local storage
        if (typeof window !== "undefined") {
          localStorage.removeItem(TOKEN_STORAGE_KEY);
          localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
        }

        // Reset state
        set({
          user: null,
          isAuthenticated: false,
          accessToken: null,
          refreshToken: null,
          tokenExpiresAt: null,
          error: null,
          sessionTimeoutWarning: false,
          isInitialized: true, // Keep initialized state
        });
      },

      // Refresh session method
      refreshSession: async () => {
        const { refreshToken } = get();

        if (!refreshToken) {
          get().logout();
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

            // Update stored tokens
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
            });

            return true;
          } else {
            get().logout();
            return false;
          }
        } catch (error) {
          console.error("Token refresh failed:", error);
          get().logout();
          return false;
        }
      },

      // Check authentication status - FIXED VERSION
      checkAuth: async () => {
        set({ isLoading: true });

        try {
          // Check if tokens exist in localStorage
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
            set({
              user: response.data,
              isAuthenticated: true,
              isLoading: false,
              accessToken: storedToken,
              refreshToken: storedRefreshToken,
              lastActivity: Date.now(),
              isInitialized: true,
            });
          } else {
            // Token is invalid, try to refresh
            const refreshed = await get().refreshSession();
            if (!refreshed) {
              // If refresh fails, ensure we're logged out
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
          // Try to refresh token
          const refreshed = await get().refreshSession();
          if (!refreshed) {
            // If refresh fails, ensure we're logged out
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
      },

      // Update user data (local state only)
      updateUser: (userData: Partial<User>) => {
        const { user } = get();
        if (user) {
          set({ user: { ...user, ...userData } });
        }
      },

      // Update user profile (API call)
      updateProfile: async (profileData: any) => {
        const { user } = get();
        if (!user) return false;

        try {
          // Use the users client instead of auth client
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

      // Permission checking methods
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

      // Session management
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

      // Utility methods
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
        // IMPORTANT: Don't persist isAuthenticated - let checkAuth determine this
        // isAuthenticated: state.isAuthenticated, // Remove this line
      }),
      version: 1,
    }
  )
);

// Session timeout monitoring (client-side only)
if (typeof window !== "undefined") {
  let timeoutWarningTimer: NodeJS.Timeout;
  let timeoutTimer: NodeJS.Timeout;

  const setupSessionMonitoring = () => {
    const checkSession = () => {
      const state = useAuthStore.getState();

      if (!state.isAuthenticated) return;

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
      if (timeUntilExpiry <= 2 * 60 * 1000 && timeUntilExpiry > 0) {
        state.refreshSession();
      }

      // Logout if session expired due to inactivity
      if (timeSinceActivity > SESSION_TIMEOUT) {
        state.logout();
      }
    };

    // Check every minute
    setInterval(checkSession, 60 * 1000);

    // Initial check
    checkSession();
  };

  // Start monitoring when store is loaded
  setupSessionMonitoring();
}
