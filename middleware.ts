import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { locales } from "@/config";

// Types
type AccountStatus =
  | "PENDING"
  | "INACTIVE"
  | "PENDING_VALIDATION"
  | "ACTIVE"
  | "REJECTED"
  | "SUSPENDED";
type ValidationStatus = "PENDING" | "VALIDATED" | "REJECTED";
type AccessLevel = "NO_ACCESS" | "PROFILE_ONLY" | "LIMITED" | "FULL";

interface TokenPayload {
  sub: string;
  email: string;
  roleId: string;
  userType: string;
  tenantId: string;
  exp: number;
  iat: number;
}

interface UserSession {
  userId: string;
  email: string;
  userType: string;
  accountStatus: AccountStatus;
  validationStatus: ValidationStatus;
  profileCompleted: boolean;
  isActive: boolean;
  tenantId: string;
}

interface TenantInfo {
  id: string;
  domain: string;
  name: string;
}

// Constants
const ROUTE_PATTERNS = {
  public: new Set(["/", "/about", "/contact", "/terms", "/privacy"]),
  auth: new Set([
    "/auth/login",
    "/auth/register",
    "/auth/forgot-password",
    "/auth/reset-password",
  ]),
  profileOnly: new Set(["/profile/complete", "/profile/edit"]),
  limited: new Set([
    "/dashboard",
    "/profile",
    "/settings/profile",
    "/notifications",
    "/validation-status",
    "/upload-documents",
  ]),
  fullAccess: new Set([
    "/users",
    "/roles",
    "/analytics",
    "/settings/admin",
    "/reports",
    "/management",
  ]),
  validatedOnly: new Set([
    "/parcels",
    "/invoices",
    "/claims",
    "/marketplace",
    "/parcels",
    "/transactions",
  ]),
} as const;

const LOCALE_REGEX = /^\/([a-z]{2})(?=\/|$)/;
const BEARER_PREFIX = "Bearer ";

// Security headers
const SECURITY_HEADERS = {
  "x-frame-options": "DENY",
  "x-content-type-options": "nosniff",
  "referrer-policy": "origin-when-cross-origin",
  "x-xss-protection": "1; mode=block",
} as const;

// Cache for user data and tenant info
const userCache = new Map<string, { data: UserSession; expiry: number }>();
const tenantCache = new Map<string, { data: TenantInfo; expiry: number }>();
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

// Logging utility
const log = (level: "INFO" | "WARN" | "ERROR", message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[MIDDLEWARE ${level}] ${timestamp}: ${message}`;

  if (data) {
    console.log(logMessage, data);
  } else {
    console.log(logMessage);
  }
};

// Core functions
const removeLocalePrefix = (pathname: string): string =>
  pathname.replace(LOCALE_REGEX, "") || "/";

const getLocaleFromPath = (pathname: string): string =>
  pathname.match(LOCALE_REGEX)?.[1] || "en";

const isRouteInCategory = (pathname: string, routes: Set<string>): boolean => {
  const routeWithoutLocale = removeLocalePrefix(pathname);
  if (routes.has(routeWithoutLocale)) return true;
  for (const route of Array.from(routes)) {
    if (routeWithoutLocale.startsWith(route + "/")) return true;
  }
  return false;
};

const getAuthToken = (request: NextRequest): string | null => {
  const cookieToken = request.cookies.get("auth_token")?.value;
  if (cookieToken) return cookieToken;
  const authHeader = request.headers.get("authorization");
  return authHeader?.startsWith(BEARER_PREFIX)
    ? authHeader.slice(BEARER_PREFIX.length)
    : null;
};

const decodeJWTPayload = (token: string): TokenPayload | null => {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
};

const isTokenValid = (payload: TokenPayload): boolean => {
  const now = Math.floor(Date.now() / 1000);
  return payload.exp > now;
};

// Get tenant ID based on environment
const getTenantId = async (request: NextRequest): Promise<string | null> => {
  const isDev = process.env.NODE_ENV === "development";
  const url = new URL(request.url);

  log("INFO", `Getting tenant ID for environment: ${process.env.NODE_ENV}`, {
    isDev,
    hostname: url.hostname,
    searchParams: Object.fromEntries(url.searchParams),
  });

  if (isDev) {
    // Development: Check URL param first, then environment variable
    const tenantFromUrl = url.searchParams.get("tenant");
    if (tenantFromUrl) {
      log("INFO", "Using tenant from URL parameter", { tenant: tenantFromUrl });
      return tenantFromUrl;
    }

    const devTenantId = process.env.NEXT_PUBLIC_DEV_TENANT_ID;
    if (devTenantId) {
      log("INFO", "Using tenant from environment variable", {
        tenant: devTenantId,
      });
      return devTenantId;
    }

    log("WARN", "No tenant ID found in development mode");
    return null;
  }

  // Production: Get tenant by domain
  const domain = url.hostname;
  const cacheKey = `tenant_${domain}`;
  const cached = tenantCache.get(cacheKey);

  if (cached && cached.expiry > Date.now()) {
    log("INFO", "Using cached tenant info", {
      tenantId: cached.data.id,
      domain,
    });
    return cached.data.id;
  }

  try {
    const backendUrl =
      process.env.NEXT_PUBLIC_AUTH_SERVICE_URL || "http://localhost:3001";
    const tenantApiUrl = `${backendUrl}/api/tenants/by-domain/${domain}`;

    log("INFO", "Fetching tenant by domain", { domain, apiUrl: tenantApiUrl });

    const response = await fetch(tenantApiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(3000),
    });

    if (!response.ok) {
      log("ERROR", "Failed to fetch tenant by domain", {
        status: response.status,
        statusText: response.statusText,
        domain,
      });
      return null;
    }

    const result = await response.json();

    if (result.success && result.data) {
      const tenantInfo: TenantInfo = {
        id: result.data.id,
        domain: result.data.domain,
        name: result.data.name,
      };

      // Cache tenant info
      tenantCache.set(cacheKey, {
        data: tenantInfo,
        expiry: Date.now() + CACHE_DURATION,
      });

      log("INFO", "Successfully fetched tenant by domain", {
        tenantId: tenantInfo.id,
        tenantName: tenantInfo.name,
        domain,
      });

      return tenantInfo.id;
    }

    log("WARN", "Invalid tenant API response", { response: result });
    return null;
  } catch (error: any) {
    log("ERROR", "Error fetching tenant by domain", {
      error: error.message,
      domain,
    });
    return null;
  }
};

// Get real user data from your API with tenant context
const fetchUserData = async (
  userId: string,
  token: string,
  tenantId: string
): Promise<UserSession | null> => {
  const cacheKey = `${tenantId}_${userId}`;
  const cached = userCache.get(cacheKey);

  if (cached && cached.expiry > Date.now()) {
    log("INFO", "Using cached user data", { userId, tenantId });
    return cached.data;
  }

  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_AUTH_SERVICE_URL || "http://localhost:3001";
    const apiUrl = `${baseUrl}/api/auth/profile`;

    log("INFO", "Fetching user data from API", {
      userId,
      tenantId,
      apiUrl,
      hasToken: !!token,
    });

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-Tenant-ID": tenantId,
      },
      signal: AbortSignal.timeout(2500),
    });

    if (!response.ok) {
      log("ERROR", "Failed to fetch user data", {
        status: response.status,
        statusText: response.statusText,
        userId,
        tenantId,
      });
      return null;
    }

    const result = await response.json();

    if (!result.success || !result.data) {
      log("WARN", "Invalid user API response", {
        response: result,
        userId,
        tenantId,
      });
      return null;
    }

    const user = result.data;
    const userSession: UserSession = {
      userId: user.id || userId,
      email: user.email,
      userType: user.userType,
      accountStatus: user.accountStatus || "PENDING",
      validationStatus: user.validationStatus || "PENDING",
      profileCompleted: user.profileCompleted || false,
      isActive: user.isActive || false,
      tenantId: user.tenantId || tenantId,
    };

    // Cache for 2 minutes
    userCache.set(cacheKey, {
      data: userSession,
      expiry: Date.now() + CACHE_DURATION,
    });

    log("INFO", "Successfully fetched user data", {
      userId: userSession.userId,
      userType: userSession.userType,
      accountStatus: userSession.accountStatus,
      validationStatus: userSession.validationStatus,
      tenantId: userSession.tenantId,
    });

    return userSession;
  } catch (error: any) {
    log("ERROR", "Error fetching user data", {
      error: error.message,
      userId,
      tenantId,
    });
    return null;
  }
};

const getAccessLevel = (user: UserSession): AccessLevel => {
  const accessLevel = (() => {
    switch (user.accountStatus) {
      case "PENDING":
      case "REJECTED":
      case "SUSPENDED":
        return "NO_ACCESS";
      case "INACTIVE":
        return "PROFILE_ONLY";
      case "PENDING_VALIDATION":
        return "LIMITED";
      case "ACTIVE":
        return user.validationStatus === "VALIDATED" ? "FULL" : "LIMITED";
      default:
        return "NO_ACCESS";
    }
  })();

  log("INFO", "Calculated access level", {
    userId: user.userId,
    userType: user.userType,
    accountStatus: user.accountStatus,
    validationStatus: user.validationStatus,
    accessLevel,
  });

  return accessLevel;
};

const checkRouteAccess = (pathname: string, user: UserSession | null) => {
  const locale = getLocaleFromPath(pathname);
  const routeWithoutLocale = removeLocalePrefix(pathname);

  log("INFO", "Checking route access", {
    pathname,
    routeWithoutLocale,
    locale,
    hasUser: !!user,
    userType: user?.userType,
    accountStatus: user?.accountStatus,
  });

  // Public routes
  if (isRouteInCategory(pathname, ROUTE_PATTERNS.public)) {
    log("INFO", "Route access granted - public route", { pathname });
    return { allowed: true };
  }

  // Auth routes
  if (isRouteInCategory(pathname, ROUTE_PATTERNS.auth)) {
    if (user) {
      log("INFO", "Redirecting authenticated user from auth route", {
        pathname,
        userId: user.userId,
      });
      return { allowed: false, redirectTo: `/${locale}/dashboard` };
    }
    log("INFO", "Route access granted - auth route for unauthenticated user", {
      pathname,
    });
    return { allowed: true };
  }

  // Require authentication
  if (!user) {
    log("INFO", "Route access denied - authentication required", { pathname });
    return { allowed: false, redirectTo: `/${locale}/auth/login` };
  }

  const accessLevel = getAccessLevel(user);

  // No access
  if (accessLevel === "NO_ACCESS") {
    log("WARN", "Route access denied - no access level", {
      pathname,
      userId: user.userId,
      accountStatus: user.accountStatus,
    });
    return { allowed: false, redirectTo: `/${locale}/auth/login` };
  }

  // Profile-only access
  if (accessLevel === "PROFILE_ONLY") {
    const allowed = isRouteInCategory(pathname, ROUTE_PATTERNS.profileOnly);
    log(
      "INFO",
      `Route access ${allowed ? "granted" : "denied"} - profile only`,
      {
        pathname,
        userId: user.userId,
        accessLevel,
      }
    );
    return allowed
      ? { allowed: true }
      : { allowed: false, redirectTo: `/${locale}/profile/complete` };
  }

  // Limited access
  if (accessLevel === "LIMITED") {
    if (
      isRouteInCategory(pathname, ROUTE_PATTERNS.profileOnly) ||
      isRouteInCategory(pathname, ROUTE_PATTERNS.limited)
    ) {
      log("INFO", "Route access granted - limited access allowed", {
        pathname,
        userId: user.userId,
      });
      return { allowed: true };
    }

    if (isRouteInCategory(pathname, ROUTE_PATTERNS.fullAccess)) {
      log("WARN", "Route access denied - full access required", {
        pathname,
        userId: user.userId,
        accessLevel,
      });
      return { allowed: false, redirectTo: `/${locale}/dashboard` };
    }

    if (
      user.validationStatus !== "VALIDATED" &&
      isRouteInCategory(pathname, ROUTE_PATTERNS.validatedOnly)
    ) {
      log("WARN", "Route access denied - validation required", {
        pathname,
        userId: user.userId,
        validationStatus: user.validationStatus,
      });
      return { allowed: false, redirectTo: `/${locale}/dashboard` };
    }

    log("INFO", "Route access granted - limited access default", {
      pathname,
      userId: user.userId,
    });
    return { allowed: true };
  }

  // Full access
  log("INFO", "Route access granted - full access", {
    pathname,
    userId: user.userId,
    accessLevel,
  });
  return { allowed: true };
};

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const startTime = Date.now();

  log("INFO", "=== MIDDLEWARE START ===", {
    pathname,
    method: request.method,
    userAgent: request.headers.get("user-agent")?.slice(0, 100),
  });

  // Handle i18n first
  const i18nMiddleware = createMiddleware({
    locales,
    defaultLocale: "en",
  });
  const i18nResponse = i18nMiddleware(request);

  if (i18nResponse?.status >= 300 && i18nResponse.status < 400) {
    log("INFO", "I18n redirect triggered", {
      status: i18nResponse.status,
      location: i18nResponse.headers.get("location"),
    });
    return i18nResponse;
  }

  // Get tenant ID
  const tenantId = await getTenantId(request);
  if (!tenantId) {
    log("ERROR", "No tenant ID found - blocking request", { pathname });
    return NextResponse.json({ error: "Tenant not found" }, { status: 400 });
  }

  // Get and validate token
  const token = getAuthToken(request);
  let userSession: UserSession | null = null;

  if (token) {
    log("INFO", "Token found, validating...", { hasToken: true });
    const payload = decodeJWTPayload(token);

    if (payload && isTokenValid(payload)) {
      log("INFO", "Token is valid, fetching user data...", {
        userId: payload.sub,
        userType: payload.userType,
        tenantId: payload.tenantId,
      });

      // Fetch real user data from API with tenant context
      userSession = await fetchUserData(payload.sub, token, tenantId);
    } else {
      log("WARN", "Invalid or expired token", { hasPayload: !!payload });
    }
  } else {
    log("INFO", "No token found", { pathname });
  }

  // Check access
  const { allowed, redirectTo } = checkRouteAccess(pathname, userSession);

  if (!allowed && redirectTo) {
    log("INFO", "Access denied - redirecting", {
      from: pathname,
      to: redirectTo,
      userId: userSession?.userId,
    });
    return NextResponse.redirect(new URL(redirectTo, request.url));
  }

  // Add headers
  const headers = new Headers(i18nResponse?.headers);
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    headers.set(key, value);
  });

  // Add tenant and user context headers
  headers.set("x-tenant-id", tenantId);

  if (userSession) {
    headers.set("x-user-id", userSession.userId);
    headers.set("x-user-type", userSession.userType);
    headers.set("x-account-status", userSession.accountStatus);
    headers.set("x-validation-status", userSession.validationStatus);
  }

  const executionTime = Date.now() - startTime;
  log("INFO", "=== MIDDLEWARE END ===", {
    pathname,
    allowed,
    executionTime: `${executionTime}ms`,
    tenantId,
    userId: userSession?.userId,
    userType: userSession?.userType,
    accessLevel: userSession ? getAccessLevel(userSession) : "NO_USER",
  });

  return new NextResponse(i18nResponse?.body, {
    status: i18nResponse?.status,
    statusText: i18nResponse?.statusText,
    headers,
  });
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|images|icons).*)"],
};
