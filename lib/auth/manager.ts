import { jwtDecode } from "jwt-decode";
import type { User } from "@/lib/types/prisma";
import { apiClient } from "@/lib/api/client";

interface JWTPayload {
  sub: string;
  email: string;
  name: string;
  role: string;
  tenantId: string;
  permissions: string[];
  exp: number;
  iat: number;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export class AuthManager {
  private static TOKEN_KEY = "auth_token";
  private static REFRESH_KEY = "refresh_token";

  private static USER_KEY = "auth_user";
  private static PERMISSIONS_KEY = "auth_permissions";
  private static EXPIRES_KEY = "auth_expires";

  // Authentication Methods
  static async login(
    email: string,
    password: string,
    tenantId?: string
  ): Promise<{
    success: boolean;
    user?: User;
    error?: string;
  }> {
    try {
      const response = await apiClient.login(email, password, tenantId);

      if (response.success && response.data) {
        const { user, token, refreshToken } = response.data;

        // Decode token to get expiration
        const payload: JWTPayload = jwtDecode(token);
        const expiresAt = payload.exp * 1000;

        // Set tokens and user data
        this.setTokens({
          accessToken: token,
          refreshToken: refreshToken || "",
          expiresAt,
        });

        this.setUser(user, payload.permissions || []);

        // Set tenant if provided
        if (tenantId) {
          apiClient.setTenant(tenantId);
        }

        return {
          success: true,
          user,
        };
      } else {
        return {
          success: false,
          error: response.error || "Login failed",
        };
      }
    } catch (error: any) {
      console.error("Login failed:", error);
      return {
        success: false,
        error:
          error?.response?.data?.message || error?.message || "Login failed",
      };
    }
  }

  static async logout(): Promise<void> {
    try {
      const refreshToken = this.getRefreshToken();

      // Call logout endpoint if refresh token exists
      if (refreshToken) {
        await apiClient.logout();
      }
    } catch (error) {
      console.error("Logout request failed:", error);
      // Continue with local cleanup even if server request fails
    } finally {
      // Always clean up local storage
      this.removeTokens();
    }
  }















  
  // Token Management
  static setTokens(tokens: AuthTokens): void {
    try {
      localStorage.setItem(this.TOKEN_KEY, tokens.accessToken);
      localStorage.setItem(this.REFRESH_KEY, tokens.refreshToken);
      localStorage.setItem(this.EXPIRES_KEY, tokens.expiresAt.toString());

      // Also set as httpOnly cookie for SSR
      document.cookie = `auth_token=${tokens.accessToken}; path=/; secure; samesite=strict; max-age=${tokens.expiresAt}`;
    } catch (error) {
      console.error("Failed to set tokens:", error);
    }
  }

  static getToken(): string | null {
    try {
      return localStorage.getItem(this.TOKEN_KEY);
    } catch (error) {
      return null;
    }
  }

  static getRefreshToken(): string | null {
    try {
      return localStorage.getItem(this.REFRESH_KEY);
    } catch (error) {
      return null;
    }
  }

  static removeTokens(): void {
    try {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_KEY);
      localStorage.removeItem(this.USER_KEY);
      localStorage.removeItem(this.PERMISSIONS_KEY);
      localStorage.removeItem(this.EXPIRES_KEY);

      // Remove cookie
      document.cookie =
        "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    } catch (error) {
      console.error("Failed to remove tokens:", error);
    }
  }

  // User Management
  static setUser(user: User, permissions: string[]): void {
    try {
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
      localStorage.setItem(this.PERMISSIONS_KEY, JSON.stringify(permissions));
    } catch (error) {
      console.error("Failed to set user data:", error);
    }
  }

  static getUser(): User | null {
    try {
      const userData = localStorage.getItem(this.USER_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      return null;
    }
  }

  static getPermissions(): string[] {
    try {
      const permissions = localStorage.getItem(this.PERMISSIONS_KEY);
      return permissions ? JSON.parse(permissions) : [];
    } catch (error) {
      return [];
    }
  }

  // Token Validation
  static isTokenValid(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const payload: JWTPayload = jwtDecode(token);
      const expirationTime = payload.exp * 1000;
      const currentTime = Date.now();

      // Add 5 minutes buffer for token refresh
      return expirationTime > currentTime + 5 * 60 * 1000;
    } catch (error) {
      return false;
    }
  }

  static getTokenExpirationTime(): number | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const payload: JWTPayload = jwtDecode(token);
      return payload.exp * 1000;
    } catch (error) {
      return null;
    }
  }

  static getUserFromToken(): Partial<User> | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const payload: JWTPayload = jwtDecode(token);
      return {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        role: payload.role as any,
        tenantId: payload.tenantId,
      };
    } catch (error) {
      return null;
    }
  }

  static async refreshToken(): Promise<boolean> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return false;

    try {
      const response = await apiClient.post("/auth/refresh", {
        refreshToken,
      });

      if (response.success && response.data) {
        // const { token, refreshToken: newRefreshToken, user } = response.data;

        // // Decode new token
        // const payload: JWTPayload = jwtDecode(token);
        // const expiresAt = payload.exp * 1000;

        // // Update tokens and user data
        // this.setTokens({
        //   accessToken: token,
        //   refreshToken: newRefreshToken || refreshToken,
        //   expiresAt,
        // });

        // if (user) {
        //   this.setUser(user, payload.permissions || []);
        // }

        return true;
      }
    } catch (error) {
      console.error("Token refresh failed:", error);
      // If refresh fails, logout user
      this.removeTokens();
    }

    return false;
  }

  // Permission Checking
  static hasPermission(permission: string): boolean {
    const permissions = this.getPermissions();
    return (
      permissions.includes(permission) ||
      permissions.includes("*") ||
      permissions.includes("super_admin")
    );
  }

  static hasAnyPermission(permissionList: string[]): boolean {
    return permissionList.some((permission) => this.hasPermission(permission));
  }

  static hasAllPermissions(permissionList: string[]): boolean {
    return permissionList.every((permission) => this.hasPermission(permission));
  }

  static hasRole(role: string): boolean {
    const user = this.getUser();
    return user?.role.name === role;
  }

  static hasAnyRole(roles: string[]): boolean {
    const user = this.getUser();
    return user ? roles.includes(user.role.name) : false;
  }

  // Auto-refresh token setup
  static setupTokenRefresh(): void {
    const checkAndRefresh = async () => {
      const token = this.getToken();
      if (!token) return;

      try {
        const payload: JWTPayload = jwtDecode(token);
        const expirationTime = payload.exp * 1000;
        const currentTime = Date.now();
        const timeUntilExpiry = expirationTime - currentTime;

        // Refresh token if it expires in less than 10 minutes
        if (timeUntilExpiry < 10 * 60 * 1000 && timeUntilExpiry > 0) {
          const refreshed = await this.refreshToken();
          if (!refreshed) {
            // If refresh fails, redirect to login
            window.location.href = "/auth/login?error=session_expired";
          }
        }
      } catch (error) {
        console.error("Token refresh check failed:", error);
      }
    };

    // Check every 5 minutes
    setInterval(checkAndRefresh, 5 * 60 * 1000);

    // Also check on visibility change (when user returns to tab)
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        checkAndRefresh();
      }
    });

    // Initial check
    checkAndRefresh();
  }

  // Session Management
  static isAuthenticated(): boolean {
    return this.isTokenValid() && this.getUser() !== null;
  }

  static getSessionInfo(): {
    isAuthenticated: boolean;
    user: User | null;
    permissions: string[];
    expiresAt: number | null;
  } {
    return {
      isAuthenticated: this.isAuthenticated(),
      user: this.getUser(),
      permissions: this.getPermissions(),
      expiresAt: this.getTokenExpirationTime(),
    };
  }
}
