// lib/stores/auth.ts - Updated with complete integration
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/lib/types";
import { AuthManager } from "@/lib/auth/manager";
import { apiClient } from "@/lib/api/client";

interface AuthState {
  // Auth state
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  permissions: string[];
  sessionExpiresAt: number | null;
  lastActivity: number;

  // Auth actions
  login: (email: string, password: string, tenantId?: string) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
  setUser: (user: User) => void;
  refreshSession: () => Promise<boolean>;
  
  // Permission methods
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;

  // Session management
  updateLastActivity: () => void;
  isSessionExpired: () => boolean;
  getTimeUntilExpiry: () => number;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      permissions: [],
      sessionExpiresAt: null,
      lastActivity: Date.now(),

      // Login method with complete error handling
      login: async (email: string, password: string, tenantId?: string) => {
        set({ isLoading: true });

        try {
          const result = await AuthManager.login(email, password, tenantId);

          if (result.success && result.user) {
            const permissions = AuthManager.getPermissions();
            const expiresAt = AuthManager.getTokenExpirationTime();

            set({
              user: result.user,
              isAuthenticated: true,
              isLoading: false,
              permissions,
              sessionExpiresAt: expiresAt,
              lastActivity: Date.now(),
            });

            return true;
          } else {
            set({ isLoading: false });
            return false;
          }
        } catch (error) {
          console.error("Login failed:", error);
          set({ isLoading: false });
          return false;
        }
      },

      // Logout method with complete cleanup
      logout: () => {
        AuthManager.logout();
        set({
          user: null,
          isAuthenticated: false,
          permissions: [],
          sessionExpiresAt: null,
          lastActivity: Date.now(),
        });
      },

      // Check auth method with token validation
      checkAuth: async () => {
        set({ isLoading: true });

        try {
          if (!AuthManager.isTokenValid()) {
            // Try to refresh token
            const refreshed = await AuthManager.refreshToken();
            if (!refreshed) {
              get().logout();
              set({ isLoading: false });
              return;
            }
          }

          // Get user data from token or local storage
          let userData = AuthManager.getUser();
          let permissions = AuthManager.getPermissions();

          // Optionally verify with server
          try {
            const response = await apiClient.getProfile();
            if (response.success && response.data) {
              userData = response.data;
              // Update local storage with fresh data
              AuthManager.setUser(userData, permissions);
            }
          } catch (error) {
            console.error("Profile fetch failed:", error);
            // Continue with cached data if server request fails
          }

          if (userData) {
            const expiresAt = AuthManager.getTokenExpirationTime();
            
            set({
              user: userData as User,
              isAuthenticated: true,
              permissions,
              sessionExpiresAt: expiresAt,
              isLoading: false,
            });
          } else {
            get().logout();
            set({ isLoading: false });
          }
        } catch (error) {
          console.error("Auth check failed:", error);
          get().logout();
          set({ isLoading: false });
        }
      },

      // Update user method
      updateUser: (userData: Partial<User>) => {
        const { user } = get();
        if (user) {
          const updatedUser = { ...user, ...userData };
          set({ user: updatedUser });
          // Update in local storage
          AuthManager.setUser(updatedUser, get().permissions);
        }
      },

      // Set user method
      setUser: (user: User) => {
        const permissions = user.permissions || [];
        set({ 
          user, 
          isAuthenticated: true,
          permissions,
        });
        // Update in local storage
        AuthManager.setUser(user, permissions);
      },

      // Refresh session method
      refreshSession: async () => {
        try {
          const success = await AuthManager.refreshToken();
          if (success) {
            const userData = AuthManager.getUser();
            const permissions = AuthManager.getPermissions();
            const expiresAt = AuthManager.getTokenExpirationTime();

            if (userData) {
              set({
                user: userData as User,
                permissions,
                sessionExpiresAt: expiresAt,
                lastActivity: Date.now(),
              });
            }
          }
          return success;
        } catch (error) {
          console.error("Session refresh failed:", error);
          return false;
        }
      },

      // Permission checking methods
      hasPermission: (permission: string) => {
        const { permissions } = get();
        return AuthManager.hasPermission(permission);
      },

      hasAnyPermission: (permissionList: string[]) => {
        return AuthManager.hasAnyPermission(permissionList);
      },

      hasAllPermissions: (permissionList: string[]) => {
        return AuthManager.hasAllPermissions(permissionList);
      },

      hasRole: (role: string) => {
        return AuthManager.hasRole(role);
      },

      hasAnyRole: (roles: string[]) => {
        return AuthManager.hasAnyRole(roles);
      },

      // Session management methods
      updateLastActivity: () => {
        set({ lastActivity: Date.now() });
      },

      isSessionExpired: () => {
        const { sessionExpiresAt } = get();
        return sessionExpiresAt ? sessionExpiresAt <= Date.now() : true;
      },

      getTimeUntilExpiry: () => {
        const { sessionExpiresAt } = get();
        return sessionExpiresAt ? Math.max(0, sessionExpiresAt - Date.now()) : 0;
      },
    }),
    {
      name: "auth-store",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        permissions: state.permissions,
        sessionExpiresAt: state.sessionExpiresAt,
        lastActivity: state.lastActivity,
      }),
      // Add version for migration if needed
      version: 1,
    }
  )
);