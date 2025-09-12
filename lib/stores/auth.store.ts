import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authApiClient } from "@/lib/api/clients/auth.client";
import { usersApiClient } from "@/lib/api/clients/users.client";
import { setCookie, getCookie, deleteCookie } from "@/lib/utils/cookie.utils";
import type { User, UserType } from "@/lib/types/database/schema.types";
import type {
  LoginRequest,
  RegisterRequest,
  AccountStatusResponse,
  AccountStatus,
  ValidationStatus,
  AccessLevel,
} from "@/lib/types/auth/auth.types";

interface AuthState {
  // Core state
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Account status workflow
  accountStatus: AccountStatus | null;
  validationStatus: ValidationStatus | null;
  accessLevel: AccessLevel | null;
  requirements: string[];
  hasBlueCheckmark: boolean;

  // Token management
  accessToken: string | null;
  refreshToken: string | null;
  tokenExpiresAt: number | null;

  // Session management
  lastActivity: number;
  sessionTimeoutWarning: boolean;

  // Prevent infinite loops and duplicate calls
  isCheckingAuth: boolean;
  isRefreshing: boolean;
  checkAuthPromise: Promise<void> | null;
  refreshPromise: Promise<boolean> | null;

  // Actions
  login: (credentials: LoginRequest) => Promise<{
    success: boolean;
    error?: string;
    redirectTo?: string;
    accessLevel?: AccessLevel;
    requirements?: string[];
    message?: string;
  }>;
  register: (userData: RegisterRequest) => Promise<{
    success: boolean;
    error?: string;
    message?: string;
    accountStatus?: AccountStatus;
    nextSteps?: string[];
  }>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  checkAuth: () => Promise<void>;

  // Account status management
  updateAccountStatus: () => Promise<AccountStatusResponse | null>;
  completeProfile: (profileData: any) => Promise<{
    success: boolean;
    error?: string;
    message?: string;
  }>;

  // User management
  updateUser: (userData: Partial<User>) => void;
  updateProfile: (profileData: any) => Promise<boolean>;

  // Permission methods
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  hasRole: (roleName: string) => boolean;
  hasUserType: (userType: UserType) => boolean;

  // Access level utilities
  canAccessDashboard: () => boolean;
  canAccessFullFeatures: () => boolean;
  needsProfileCompletion: () => boolean;
  needsValidation: () => boolean;
  isAccountBlocked: () => boolean;

  // Session utilities
  updateLastActivity: () => void;
  isSessionExpired: () => boolean;
  getTimeUntilExpiry: () => number;
  setSessionTimeoutWarning: (show: boolean) => void;
  extendSession: () => Promise<void>;

  // State management
  clearError: () => void;
  setLoading: (loading: boolean) => void;

  // Cache management
  getUserProfile: () => Promise<User | null>;
}

const TOKEN_STORAGE_KEY = "auth_token";
const REFRESH_TOKEN_STORAGE_KEY = "refresh_token";
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const WARNING_THRESHOLD = 5 * 60 * 1000; // 5 minutes before timeout
const AUTO_REFRESH_THRESHOLD = 2 * 60 * 1000; // 2 minutes before expiry

// Helper functions remain the same...
const storeTokens = (
  accessToken: string,
  refreshToken: string,
  expiresIn: number
) => {
  if (typeof window === "undefined") return;

  localStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);

  const tokenExpiryDays = Math.ceil(expiresIn / (24 * 60 * 60));
  setCookie(TOKEN_STORAGE_KEY, accessToken, tokenExpiryDays);
  setCookie(REFRESH_TOKEN_STORAGE_KEY, refreshToken, tokenExpiryDays);

  localStorage.setItem("auth_login", Date.now().toString());
  localStorage.removeItem("auth_logout");
};

const clearTokens = () => {
  if (typeof window === "undefined") return;

  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
  deleteCookie(TOKEN_STORAGE_KEY);
  deleteCookie(REFRESH_TOKEN_STORAGE_KEY);

  localStorage.setItem("auth_logout", Date.now().toString());
  localStorage.removeItem("auth_login");
};

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
      checkAuthPromise: null,
      refreshPromise: null,

      // Account status state
      accountStatus: null,
      validationStatus: null,
      accessLevel: null,
      requirements: [],
      hasBlueCheckmark: false,

      // Enhanced login method
      login: async (credentials: LoginRequest) => {
        set({ isLoading: true, error: null });

        try {
          const response = await authApiClient.login(credentials);

          if (response.success && response.data) {
            const loginData = response.data;

            // Handle different login scenarios based on backend response
            if (loginData.accessDenied) {
              // Account blocked scenarios (PENDING, REJECTED, SUSPENDED)
              set({
                isLoading: false,
                error: loginData.message,
                isInitialized: true,
                isAuthenticated: false,
                accountStatus: loginData.accountStatus || null,
              });

              return {
                success: false,
                error: loginData.message,
                accessLevel: "NO_ACCESS",
              };
            }

            // Successful login scenarios with different access levels
            if (
              loginData.user &&
              loginData.accessToken &&
              loginData.refreshToken
            ) {
              const {
                user,
                accessToken,
                refreshToken,
                expiresIn = 86400,
              } = loginData;
              const tokenExpiresAt = Date.now() + expiresIn * 1000;

              // Store tokens
              storeTokens(accessToken, refreshToken, expiresIn);

              // Determine access level based on response flags
              let accessLevel: AccessLevel = "NO_ACCESS";
              let redirectTo = "/dashboard";

              if (loginData.fullAccess) {
                accessLevel = "FULL";
                redirectTo = "/dashboard";
              } else if (loginData.limitedAccess) {
                accessLevel = "LIMITED";
                redirectTo = "/dashboard";
              } else if (
                loginData.profileAccess ||
                loginData.requiresProfileCompletion
              ) {
                accessLevel = "PROFILE_ONLY";
                redirectTo = "/profile/complete";
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
                accountStatus: loginData.accountStatus || user.accountStatus,
                validationStatus:
                  loginData.validationStatus || user.validationStatus,
                accessLevel,
                requirements: [],
                hasBlueCheckmark: user.validationStatus === "VALIDATED",
                checkAuthPromise: null,
                refreshPromise: null,
              });

              return {
                success: true,
                redirectTo,
                accessLevel,
                message: loginData.message,
              };
            }
          }

          // Login failed
          const error = response.error?.message || "Login failed";
          set({
            isLoading: false,
            error,
            isInitialized: true,
            isAuthenticated: false,
          });
          return { success: false, error };
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

      // Enhanced register method
      register: async (userData: RegisterRequest) => {
        set({ isLoading: true, error: null });

        try {
          const response = await authApiClient.register(userData);

          if (response.success && response.data) {
            const { success, message, accountStatus, nextSteps } =
              response.data;

            set({
              isLoading: false,
              error: null,
              isInitialized: true,
              accountStatus,
            });

            return {
              success: true,
              message,
              accountStatus,
              nextSteps,
            };
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

      // Account status management
      updateAccountStatus: async () => {
        try {
          const response = await authApiClient.getAccountStatus();

          if (response.success && response.data) {
            const status = response.data;

            set({
              accountStatus: status.accountStatus,
              validationStatus: status.validationStatus,
              accessLevel: status.accessLevel,
              requirements: status.requirements,
              hasBlueCheckmark: status.hasBlueCheckmark,
            });

            return status;
          }
        } catch (error) {
          console.error("Failed to update account status:", error);
        }
        return null;
      },

      // Complete profile method
      completeProfile: async (profileData: any) => {
        set({ isLoading: true, error: null });

        try {
          const response = await authApiClient.completeProfile(profileData);

          if (response.success && response.data) {
            const { user, message, accountStatus, validationStatus } =
              response.data;

            set({
              user,
              accountStatus,
              validationStatus,
              accessLevel: "LIMITED", // Profile completed but pending validation
              isLoading: false,
            });

            return {
              success: true,
              message,
            };
          } else {
            const error =
              response.error?.message || "Failed to complete profile";
            set({ isLoading: false, error });
            return { success: false, error };
          }
        } catch (error: any) {
          const errorMessage = error?.message || "Network error";
          set({ isLoading: false, error: errorMessage });
          return { success: false, error: errorMessage };
        }
      },

      // Access level utilities
      canAccessDashboard: () => {
        const { accessLevel } = get();
        return accessLevel === "FULL" || accessLevel === "LIMITED";
      },

      canAccessFullFeatures: () => {
        const { accessLevel } = get();
        return accessLevel === "FULL";
      },

      needsProfileCompletion: () => {
        const { accessLevel, accountStatus } = get();
        return accessLevel === "PROFILE_ONLY" || accountStatus === "INACTIVE";
      },

      needsValidation: () => {
        const { accountStatus, validationStatus } = get();
        return (
          accountStatus === "PENDING_VALIDATION" &&
          validationStatus === "PENDING"
        );
      },

      isAccountBlocked: () => {
        const { accessLevel, accountStatus } = get();
        return (
          accessLevel === "NO_ACCESS" ||
          accountStatus === "PENDING" ||
          accountStatus === "REJECTED" ||
          accountStatus === "SUSPENDED"
        );
      },

      // Rest of the methods remain largely the same but updated for new types...
      logout: async () => {
        const { refreshToken } = get();

        try {
          if (refreshToken) {
            await authApiClient.logout({ refreshToken });
          }
        } catch (error) {
          console.error("Logout API call failed:", error);
        }

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
          checkAuthPromise: null,
          refreshPromise: null,
          accountStatus: null,
          validationStatus: null,
          accessLevel: null,
          requirements: [],
          hasBlueCheckmark: false,
        });
      },

      // Enhanced refresh session with status update
      refreshSession: async () => {
        const { isRefreshing, refreshPromise } = get();

        if (isRefreshing && refreshPromise) {
          return refreshPromise;
        }

        const { refreshToken } = get();
        if (!refreshToken) {
          await get().logout();
          return false;
        }

        const promise = (async () => {
          set({ isRefreshing: true });

          try {
            const response = await authApiClient.refreshToken({ refreshToken });

            if (response.success && response.data) {
              const {
                user,
                accessToken,
                refreshToken: newRefreshToken,
                expiresIn = 86400,
              } = response.data;
              const tokenExpiresAt = Date.now() + expiresIn * 1000;

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
                refreshPromise: null,
              });

              // Update account status after refresh
              get().updateAccountStatus();

              return true;
            } else {
              set({ isRefreshing: false, refreshPromise: null });
              await get().logout();
              return false;
            }
          } catch (error) {
            console.error("Token refresh failed:", error);
            set({ isRefreshing: false, refreshPromise: null });
            await get().logout();
            return false;
          }
        })();

        set({ refreshPromise: promise });
        return promise;
      },

      // Enhanced checkAuth with status loading
      checkAuth: async () => {
        const {
          isCheckingAuth,
          isRefreshing,
          checkAuthPromise,
          isInitialized,
        } = get();

        if ((isCheckingAuth || isRefreshing) && checkAuthPromise) {
          return checkAuthPromise;
        }

        const { isAuthenticated, user } = get();
        if (isInitialized && isAuthenticated && user) {
          return Promise.resolve();
        }

        const promise = (async () => {
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
                checkAuthPromise: null,
              });
              return;
            }

            set({ accessToken, refreshToken });

            // Get profile and account status
            const [profileResponse, statusResponse] = await Promise.all([
              authApiClient.getProfile(),
              authApiClient.getAccountStatus().catch(() => null), // Don't fail if status endpoint fails
            ]);

            if (profileResponse.success && profileResponse.data) {
              const user = profileResponse.data;

              // Set user data
              set({
                user,
                isAuthenticated: true,
                isLoading: false,
                lastActivity: Date.now(),
                isInitialized: true,
                error: null,
                isCheckingAuth: false,
                checkAuthPromise: null,
              });

              // Update account status if available
              if (statusResponse?.success && statusResponse.data) {
                const status = statusResponse.data;
                set({
                  accountStatus: status.accountStatus,
                  validationStatus: status.validationStatus,
                  accessLevel: status.accessLevel,
                  requirements: status.requirements,
                  hasBlueCheckmark: status.hasBlueCheckmark,
                });
              }
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
                  checkAuthPromise: null,
                });
              } else {
                set({ isCheckingAuth: false, checkAuthPromise: null });
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
                checkAuthPromise: null,
              });
            } else {
              set({ isCheckingAuth: false, checkAuthPromise: null });
            }
          }
        })();

        set({ checkAuthPromise: promise });
        return promise;
      },

      // Keep existing utility methods...
      getUserProfile: async () => {
        const { user, isAuthenticated, isCheckingAuth } = get();

        if (user && isAuthenticated) {
          return user;
        }

        if (!isCheckingAuth) {
          await get().checkAuth();
        }

        return get().user;
      },

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
        accountStatus: state.accountStatus,
        validationStatus: state.validationStatus,
        accessLevel: state.accessLevel,
      }),
      version: 4,
      migrate: (persistedState: any, version: number) => {
        if (version < 4) {
          return {
            user: persistedState?.user || null,
            lastActivity: persistedState?.lastActivity || Date.now(),
            accountStatus: persistedState?.accountStatus || null,
            validationStatus: persistedState?.validationStatus || null,
            accessLevel: persistedState?.accessLevel || null,
          };
        }
        return persistedState;
      },
    }
  )
);
