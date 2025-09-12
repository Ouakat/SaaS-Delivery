import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { locales } from "@/config";

// Account status and access level types
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
  sub: string; // userId
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
  accountStatus?: AccountStatus;
  validationStatus?: ValidationStatus;
  profileCompleted?: boolean;
  isActive?: boolean;
}

// Route configuration based on access levels
const routeConfig = {
  // Public routes (no auth required)
  public: ["/", "/about", "/contact", "/terms", "/privacy"],

  // Auth routes that should redirect if already logged in
  auth: [
    "/auth/login",
    "/auth/register",
    "/auth/forgot-password",
    "/auth/reset-password",
  ],

  // Profile-only routes (PROFILE_ONLY access)
  profileOnly: ["/profile/complete", "/profile/edit"],

  // Limited access routes (LIMITED access)
  limited: [
    "/dashboard",
    "/profile",
    "/settings/profile",
    "/notifications",
    "/validation-status",
    "/upload-documents",
  ],

  // Full access routes (FULL access required)
  fullAccess: [
    "/users",
    "/roles",
    "/analytics",
    "/settings/admin",
    "/reports",
    "/management",
  ],

  // Routes that require specific permissions or validation
  protected: [
    "/dashboard",
    "/parcels",
    "/invoices",
    "/claims",
    "/users",
    "/roles",
    "/settings",
    "/analytics",
  ],

  // Validated-only routes (require VALIDATED status)
  validatedOnly: [
    "/parcels",
    "/invoices",
    "/claims",
    "/marketplace",
    "/orders",
    "/transactions",
  ],
};

function removeLocalePrefix(pathname: string): string {
  return pathname.replace(/^\/[a-z]{2}(?=\/|$)/, "") || "/";
}

function getLocaleFromPath(pathname: string): string {
  const match = pathname.match(/^\/([a-z]{2})/);
  return match?.[1] || "en";
}

function isRouteInCategory(pathname: string, routes: string[]): boolean {
  const routeWithoutLocale = removeLocalePrefix(pathname);
  return routes.some((route) => routeWithoutLocale.startsWith(route));
}

function getAuthToken(request: NextRequest): string | null {
  // Check cookie first (more reliable for SSR)
  const tokenCookie = request.cookies.get("auth_token");
  if (tokenCookie?.value) return tokenCookie.value;

  // Fallback to Authorization header
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  return null;
}

function decodeToken(token: string): TokenPayload | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload;
  } catch {
    return null;
  }
}

function isTokenValid(token: string): boolean {
  try {
    const payload = decodeToken(token);
    if (!payload) return false;

    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp > currentTime;
  } catch {
    return false;
  }
}

// Simulate getting user session data (in real app, you'd call your API or decode from token)
function getUserSessionFromToken(token: string): UserSession | null {
  const payload = decodeToken(token);
  if (!payload) return null;

  // In a real implementation, you might:
  // 1. Call your API to get full user data
  // 2. Store additional user info in the token
  // 3. Use a cache/Redis to store session data

  // For now, we'll extract what we can from the token
  return {
    userId: payload.sub,
    email: payload.email,
    userType: payload.userType,
    // These would come from your API or be stored in token claims
    accountStatus: undefined, // You'd need to fetch this
    validationStatus: undefined,
    profileCompleted: undefined,
    isActive: undefined,
  };
}

function getAccessLevel(user: UserSession): AccessLevel {
  // If we don't have account status info, default to limited access for authenticated users
  if (!user.accountStatus) {
    return "LIMITED";
  }

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
}

function canAccessRoute(
  pathname: string,
  user: UserSession | null
): {
  allowed: boolean;
  redirectTo?: string;
  reason?: string;
} {
  const routeWithoutLocale = removeLocalePrefix(pathname);
  const locale = getLocaleFromPath(pathname);

  // Public routes - always allowed
  if (isRouteInCategory(pathname, routeConfig.public)) {
    return { allowed: true };
  }

  // Auth routes - redirect if authenticated
  if (isRouteInCategory(pathname, routeConfig.auth)) {
    if (user) {
      // return {
      //   allowed: false,
      //   redirectTo: `/${locale}/dashboard`,
      //   reason: "Already authenticated",
      // };
    }
    return { allowed: true };
  }

  // No user session - redirect to login
  if (!user) {
    return {
      allowed: false,
      redirectTo: `/${locale}/auth/login`,
      reason: "Authentication required",
    };
  }

  const accessLevel = getAccessLevel(user);

  // Handle NO_ACCESS
  if (accessLevel === "NO_ACCESS") {
    return {
      allowed: false,
      redirectTo: `/${locale}/auth/login`,
      reason: getBlockedReason(user.accountStatus),
    };
  }

  // Handle PROFILE_ONLY access
  if (accessLevel === "PROFILE_ONLY") {
    if (isRouteInCategory(pathname, routeConfig.profileOnly)) {
      return { allowed: true };
    }
    return {
      allowed: false,
      redirectTo: `/${locale}/profile/complete`,
      reason: "Profile completion required",
    };
  }

  // Handle LIMITED access
  if (accessLevel === "LIMITED") {
    // Allow profile and limited routes
    if (
      isRouteInCategory(pathname, routeConfig.profileOnly) ||
      isRouteInCategory(pathname, routeConfig.limited)
    ) {
      return { allowed: true };
    }

    // Block full access routes
    if (isRouteInCategory(pathname, routeConfig.fullAccess)) {
      // return {
      //   allowed: false,
      //   redirectTo: `/${locale}/dashboard`,
      //   reason: "Insufficient permissions - validation required",
      // };
    }

    // Block validated-only routes if not validated
    if (
      user.validationStatus !== "VALIDATED" &&
      isRouteInCategory(pathname, routeConfig.validatedOnly)
    ) {
      // return {
      //   allowed: false,
      //   redirectTo: `/${locale}/dashboard`,
      //   reason: "Profile validation required for this feature",
      // };
    }

    // Allow other routes by default for LIMITED access
    return { allowed: true };
  }

  // FULL access - allow everything
  return { allowed: true };
}

function getBlockedReason(accountStatus?: AccountStatus): string {
  switch (accountStatus) {
    case "PENDING":
      return "Account pending approval";
    case "REJECTED":
      return "Account rejected - contact support";
    case "SUSPENDED":
      return "Account suspended - contact support";
    default:
      return "Access denied";
  }
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle internationalization first
  const handleI18nRouting = createMiddleware({
    locales,
    defaultLocale: "en",
  });

  let response = handleI18nRouting(request);

  // If i18n middleware wants to redirect, let it
  if (response && response.status >= 300 && response.status < 400) {
    return response;
  }

  // Get authentication info
  const token = getAuthToken(request);
  const isAuthenticated = token && isTokenValid(token);
  const userSession = isAuthenticated ? getUserSessionFromToken(token!) : null;

  // Check route access
  const { allowed, redirectTo, reason } = canAccessRoute(pathname, userSession);

  if (!allowed && redirectTo) {
    // Add redirect reason as query parameter for frontend to show appropriate message
    const redirectUrl = new URL(redirectTo, request.url);
    // if (reason) {
    //   redirectUrl.searchParams.set("reason", reason);
    //   // Also set original path for post-login redirect
    //   if (!isRouteInCategory(pathname, routeConfig.auth)) {
    //     redirectUrl.searchParams.set("redirect", pathname);
    //   }
    // }
    // return NextResponse.redirect(redirectUrl);
  }

  // Add security headers and user context
  const headers = new Headers(response?.headers);

  // Security headers
  headers.set("x-frame-options", "DENY");
  headers.set("x-content-type-options", "nosniff");
  headers.set("referrer-policy", "origin-when-cross-origin");
  headers.set("x-xss-protection", "1; mode=block");

  if (process.env.NODE_ENV === "production") {
    headers.set(
      "strict-transport-security",
      "max-age=31536000; includeSubDomains"
    );
  }

  // Add user context headers for server components (optional)
  if (userSession) {
    headers.set("x-user-id", userSession.userId);
    headers.set("x-user-type", userSession.userType);
    if (userSession.accountStatus) {
      headers.set("x-account-status", userSession.accountStatus);
    }
  }

  return new NextResponse(response?.body, {
    status: response?.status,
    statusText: response?.statusText,
    headers,
  });
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|images|icons).*)"],
};
