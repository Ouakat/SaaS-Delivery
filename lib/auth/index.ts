// ==========================================
// src/lib/auth/index.ts - Auth Utilities
// ==========================================
import { jwtDecode } from "jwt-decode";
import type { User } from "@/lib/types";

interface JWTPayload {
  sub: string;
  email: string;
  role: string;
  tenantId: string;
  exp: number;
  iat: number;
}

export class AuthManager {
  private static TOKEN_KEY = "auth_token";
  private static REFRESH_KEY = "refresh_token";

  static setTokens(token: string, refreshToken?: string) {
    localStorage.setItem(this.TOKEN_KEY, token);
    if (refreshToken) {
      localStorage.setItem(this.REFRESH_KEY, refreshToken);
    }
  }

  static getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  static getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_KEY);
  }

  static removeTokens() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
  }

  static isTokenValid(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const payload: JWTPayload = jwtDecode(token);
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
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
        role: payload.role as any,
        tenantId: payload.tenantId,
      };
    } catch {
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
        this.setTokens(response.data.token, response.data.refreshToken);
        return true;
      }
    } catch (error) {
      console.error("Token refresh failed:", error);
    }

    return false;
  }
}
