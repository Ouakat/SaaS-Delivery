import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authApiClient } from "@/lib/api/clients/auth/auth.client";
import { usersApiClient } from "@/lib/api/clients/auth/users.client";
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
  login: (credentials: LoginRequest) => Promise<LoginResult>;
  register: (userData: RegisterRequest) => Promise<RegisterResult>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  checkAuth: () => Promise<void>;

  // Account status management
  updateAccountStatus: () => Promise<AccountStatusResponse | null>;
  completeProfile: (profileData: any) => Promise<ProfileResult>;

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
  getUserProfile: () => Promise<User | null>;
}

// Result types for better type safety
interface LoginResult {
  success: boolean;
  error?: string;
  redirectTo?: string;
  accessLevel?: AccessLevel;
  requirements?: string[];
  message?: string;
}

interface RegisterResult {
  success: boolean;
  error?: string;
  message?: string;
  accountStatus?: AccountStatus;
  nextSteps?: string[];
}

interface ProfileResult {
  success: boolean;
  error?: string;
  message?: string;
}

// Constants
const TOKEN_STORAGE_KEY = "auth_token";
const REFRESH_TOKEN_STORAGE_KEY = "refresh_token";
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const AUTO_REFRESH_THRESHOLD = 2 * 60 * 1000; // 2 minutes before expiry

// Storage utilities
const tokenStorage = {
  store: (accessToken: string, refreshToken: string, expiresIn: number) => {
    if (typeof window === "undefined") return;

    const tokenExpiryDays = Math.ceil(expiresIn / (24 * 60 * 60));

    // Store in localStorage and cookies
    localStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
    setCookie(TOKEN_STORAGE_KEY, accessToken, tokenExpiryDays);
    setCookie(REFRESH_TOKEN_STORAGE_KEY, refreshToken, tokenExpiryDays);

    // Cross-tab communication
    localStorage.setItem("auth_login", Date.now().toString());
    localStorage.removeItem("auth_logout");
  },

  clear: () => {
    if (typeof window === "undefined") return;

    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
    deleteCookie(TOKEN_STORAGE_KEY);
    deleteCookie(REFRESH_TOKEN_STORAGE_KEY);

    // Cross-tab communication
    localStorage.setItem("auth_logout", Date.now().toString());
    localStorage.removeItem("auth_login");
  },

  get: () => {
    if (typeof window === "undefined")
      return { accessToken: null, refreshToken: null };

    const accessToken =
      localStorage.getItem(TOKEN_STORAGE_KEY) || getCookie(TOKEN_STORAGE_KEY);
    const refreshToken =
      localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY) ||
      getCookie(REFRESH_TOKEN_STORAGE_KEY);

    return { accessToken, refreshToken };
  },
};

// Access level helpers
const accessLevelHelpers = {
  canAccess: (current: AccessLevel | null, required: AccessLevel): boolean => {
    const levels = ["NO_ACCESS", "PROFILE_ONLY", "LIMITED", "FULL"];
    const currentIndex = levels.indexOf(current || "NO_ACCESS");
    const requiredIndex = levels.indexOf(required);
    return currentIndex >= requiredIndex;
  },

  getRedirectPath: (
    accessLevel: AccessLevel | null,
    accountStatus: AccountStatus | null
  ): string => {
    if (accessLevel === "PROFILE_ONLY" || accountStatus === "INACTIVE") {
      return "/profile/complete";
    }
    return "/dashboard";
  },
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
      accountStatus: null,
      validationStatus: null,
      accessLevel: null,
      requirements: [],
      hasBlueCheckmark: false,

      // Optimized login method
      login: async (credentials: LoginRequest): Promise<LoginResult> => {
        set({ isLoading: true, error: null });

        try {
          const response = await authApiClient.login(credentials);

          if (!response.success || !response.data) {
            const error = response.error?.message || "Login failed";
            set({
              isLoading: false,
              error,
              isInitialized: true,
              isAuthenticated: false,
            });
            return { success: false, error };
          }

          const loginData = response.data;

          // Handle access denied scenarios
          if (loginData.accessDenied) {
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

          // Handle successful login
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

            tokenStorage.store(accessToken, refreshToken, expiresIn);

            // Determine access level and redirect
            const accessLevel: AccessLevel = loginData.fullAccess
              ? "FULL"
              : loginData.limitedAccess
              ? "LIMITED"
              : loginData.profileAccess || loginData.requiresProfileCompletion
              ? "PROFILE_ONLY"
              : "NO_ACCESS";

            const redirectTo = accessLevelHelpers.getRedirectPath(
              accessLevel,
              loginData.accountStatus
            );

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

          const error = "Invalid login response";
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

      // Optimized register method
      register: async (userData: RegisterRequest): Promise<RegisterResult> => {
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
            return { success: true, message, accountStatus, nextSteps };
          }

          const error = response.error?.message || "Registration failed";
          set({ isLoading: false, error, isInitialized: true });
          return { success: false, error };
        } catch (error: any) {
          const errorMessage =
            error?.message || "Network error during registration";
          set({ isLoading: false, error: errorMessage, isInitialized: true });
          return { success: false, error: errorMessage };
        }
      },

      // Optimized logout method
      logout: async () => {
        const { refreshToken } = get();

        // Clear tokens immediately for better UX
        tokenStorage.clear();
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

        // Call logout API in background
        if (refreshToken) {
          authApiClient.logout({ refreshToken }).catch(console.error);
        }
      },

      // Optimized refresh session
      refreshSession: async (): Promise<boolean> => {
        const { isRefreshing, refreshPromise, refreshToken } = get();

        if (isRefreshing && refreshPromise) return refreshPromise;
        if (!refreshToken) {
          await get().logout();
          return false;
        }

        const promise = (async (): Promise<boolean> => {
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

              tokenStorage.store(accessToken, newRefreshToken, expiresIn);

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

              // Update account status in background
              get().updateAccountStatus().catch(console.error);
              return true;
            }

            set({ isRefreshing: false, refreshPromise: null });
            await get().logout();
            return false;
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

      // Optimized checkAuth - prevents infinite loops
      checkAuth: async (): Promise<void> => {
        const state = get();

        // Early return conditions to prevent loops
        if (state.isCheckingAuth && state.checkAuthPromise)
          return state.checkAuthPromise;
        if (state.isRefreshing) return Promise.resolve();
        if (state.isInitialized && state.isAuthenticated && state.user)
          return Promise.resolve();

        const promise = (async (): Promise<void> => {
          set({ isCheckingAuth: true, checkAuthPromise: null });

          try {
            const { accessToken, refreshToken } = tokenStorage.get();

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

            // Set tokens without triggering additional calls
            set({ accessToken, refreshToken });

            // Single API call for profile
            const profileResponse = await authApiClient.getProfile();

            if (profileResponse.success && profileResponse.data) {
              const profile = profileResponse.data;

              set({
                user: profile,
                isAuthenticated: true,
                isLoading: false,
                lastActivity: Date.now(),
                isInitialized: true,
                error: null,
                isCheckingAuth: false,
                checkAuthPromise: null,
              });

              // Update status in background without blocking
              get().updateAccountStatus().catch(console.error);
            } else {
              // Try refresh without recursive calls
              set({ isCheckingAuth: false, checkAuthPromise: null });

              const currentState = get();
              if (!currentState.isRefreshing) {
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
            }
          } catch (error) {
            console.error("Auth check failed:", error);
            set({
              user: null,
              isAuthenticated: false,
              accessToken: null,
              refreshToken: null,
              tokenExpiresAt: null,
              isLoading: false,
              isInitialized: true,
              error:
                error instanceof Error
                  ? error.message
                  : "Authentication failed",
              isCheckingAuth: false,
              checkAuthPromise: null,
            });
          }
        })();

        set({ checkAuthPromise: promise });
        return promise;
      },

      // Account status management
      updateAccountStatus: async (): Promise<AccountStatusResponse | null> => {
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
      completeProfile: async (profileData: any): Promise<ProfileResult> => {
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
              accessLevel: "LIMITED",
              isLoading: false,
            });

            return { success: true, message };
          }

          const error = response.error?.message || "Failed to complete profile";
          set({ isLoading: false, error });
          return { success: false, error };
        } catch (error: any) {
          const errorMessage = error?.message || "Network error";
          set({ isLoading: false, error: errorMessage });
          return { success: false, error: errorMessage };
        }
      },

      // Utility methods
      getUserProfile: async (): Promise<User | null> => {
        const { user, isAuthenticated, isCheckingAuth } = get();
        if (user && isAuthenticated) return user;
        if (!isCheckingAuth) await get().checkAuth();
        return get().user;
      },

      updateUser: (userData: Partial<User>) => {
        const { user } = get();
        if (user) set({ user: { ...user, ...userData } });
      },

      updateProfile: async (profileData: any): Promise<boolean> => {
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

      // Permission methods
      hasPermission: (permission: string): boolean => {
        const { user } = get();
        if (!user?.role?.permissions) return false;
        const permissions = user.role.permissions;
        return permissions.includes(permission) || permissions.includes("*");
      },

      hasAnyPermission: (permissions: string[]): boolean =>
        permissions.some((permission) => get().hasPermission(permission)),

      hasAllPermissions: (permissions: string[]): boolean =>
        permissions.every((permission) => get().hasPermission(permission)),

      hasRole: (roleName: string): boolean => {
        const { user } = get();
        return user?.role?.name === roleName;
      },

      hasUserType: (userType: UserType): boolean => {
        const { user } = get();
        return user?.userType === userType;
      },

      // Access level utilities
      canAccessDashboard: (): boolean => {
        const { accessLevel } = get();
        return accessLevelHelpers.canAccess(accessLevel, "LIMITED");
      },

      canAccessFullFeatures: (): boolean => {
        const { accessLevel } = get();
        return accessLevelHelpers.canAccess(accessLevel, "FULL");
      },

      needsProfileCompletion: (): boolean => {
        const { accessLevel, accountStatus } = get();
        return accessLevel === "PROFILE_ONLY" || accountStatus === "INACTIVE";
      },

      needsValidation: (): boolean => {
        const { accountStatus, validationStatus } = get();
        return (
          accountStatus === "PENDING_VALIDATION" &&
          validationStatus === "PENDING"
        );
      },

      isAccountBlocked: (): boolean => {
        const { accessLevel, accountStatus } = get();
        return (
          accessLevel === "NO_ACCESS" ||
          accountStatus === "PENDING" ||
          accountStatus === "REJECTED" ||
          accountStatus === "SUSPENDED"
        );
      },

      // Session utilities
      updateLastActivity: () => set({ lastActivity: Date.now() }),

      isSessionExpired: (): boolean => {
        const { lastActivity } = get();
        return Date.now() - lastActivity > SESSION_TIMEOUT;
      },

      getTimeUntilExpiry: (): number => {
        const { tokenExpiresAt } = get();
        return tokenExpiresAt ? Math.max(0, tokenExpiresAt - Date.now()) : 0;
      },

      setSessionTimeoutWarning: (show: boolean) =>
        set({ sessionTimeoutWarning: show }),

      extendSession: async (): Promise<void> => {
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

      // State management
      clearError: () => set({ error: null }),
      setLoading: (loading: boolean) => set({ isLoading: loading }),
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
      version: 5,
      migrate: (persistedState: any, version: number) => {
        if (version < 5) {
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
