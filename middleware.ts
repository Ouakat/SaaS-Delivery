// middleware.ts (in your project root)
import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { locales } from "@/config";
import { jwtDecode } from "jwt-decode";

interface JWTPayload {
  sub: string;
  email: string;
  role: string;
  tenantId: string;
  permissions: string[];
  exp: number;
  iat: number;
}

// Define protected routes and their required permissions
const ROUTE_PERMISSIONS: Record<string, string[]> = {
  "/dashboard": ["dashboard.view"],
  "/dashboard/analytics": ["analytics.view"],
  "/dashboard/parcels": ["parcels.view"],
  "/dashboard/merchants": ["merchants.view"],
  "/dashboard/delivery-agents": ["delivery_agents.view"],
  "/dashboard/invoices": ["invoices.view"],
  "/dashboard/claims": ["claims.view"],
  "/dashboard/reports": ["reports.view"],
  "/dashboard/settings": ["settings.view"],
  "/dashboard/users": ["users.view"],
  "/admin": ["admin.access"],
  "/admin/tenants": ["tenants.manage"],
  "/admin/system": ["system.manage"],
};

// Public routes that don't require authentication (without locale prefix)
const PUBLIC_ROUTES = [
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/verify-email",
  "/",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
];

// API routes that should be handled separately
const API_ROUTES = ["/api/auth", "/api/public"];

function getPathnameWithoutLocale(pathname: string): string {
  // Remove locale prefix if present (e.g., /en/dashboard -> /dashboard)
  const localePattern = new RegExp(`^/(${locales.join("|")})`);
  return pathname.replace(localePattern, "") || "/";
}

function isPublicRoute(pathname: string): boolean {
  const cleanPath = getPathnameWithoutLocale(pathname);
  return PUBLIC_ROUTES.some(
    (route) =>
      cleanPath === route || (route !== "/" && cleanPath.startsWith(route))
  );
}

function isApiRoute(pathname: string): boolean {
  return API_ROUTES.some((route) => pathname.startsWith(route));
}

function isValidToken(token: string): { valid: boolean; payload?: JWTPayload } {
  try {
    const payload: JWTPayload = jwtDecode(token);
    const isExpired = payload.exp * 1000 <= Date.now();

    if (isExpired) {
      return { valid: false };
    }

    return { valid: true, payload };
  } catch (error) {
    return { valid: false };
  }
}

function hasPermission(
  userPermissions: string[],
  requiredPermissions: string[]
): boolean {
  // Super admin has access to everything
  if (
    userPermissions.includes("*") ||
    userPermissions.includes("super_admin")
  ) {
    return true;
  }

  // Check if user has any of the required permissions
  return requiredPermissions.some(
    (permission) =>
      userPermissions.includes(permission) ||
      userPermissions.includes(permission.split(".")[0] + ".*") // wildcard permission
  );
}

function getLocaleFromPathname(pathname: string): string {
  // Extract locale from pathname (e.g., /fr/dashboard -> fr)
  const localeMatch = pathname.match(`^/(${locales.join("|")})`);
  return localeMatch ? localeMatch[1] : "en"; // default to 'en' if no locale found
}

function createAuthenticatedResponse(
  request: NextRequest,
  response: NextResponse,
  payload: JWTPayload
): NextResponse {
  // Add user info to headers for server components
  response.headers.set("x-user-id", payload.sub);
  response.headers.set("x-user-role", payload.role);
  response.headers.set("x-user-tenant", payload.tenantId);
  response.headers.set(
    "x-user-permissions",
    JSON.stringify(payload.permissions || [])
  );
  return response;
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files and most API routes
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/images/") ||
    pathname.startsWith("/icons/") ||
    pathname.includes(".") ||
    isApiRoute(pathname)
  ) {
    return NextResponse.next();
  }

  // Step 1: Handle internationalization first
  const defaultLocale = request.headers.get("network-locale") || "en";
  const handleI18nRouting = createMiddleware({
    locales,
    defaultLocale,
  });

  // Get the i18n response
  let response = handleI18nRouting(request);
  response.headers.set("network-locale", defaultLocale);

  // Step 2: Handle authentication for protected routes
  // Allow access to public routes
  if (isPublicRoute(pathname)) {
    return response;
  }

  // Check for authentication token
  const token =
    request.cookies.get("auth_token")?.value ||
    request.headers.get("authorization")?.replace("Bearer ", "");

  if (!token) {
    // Redirect to login if no token, preserving locale
    const locale = getLocaleFromPathname(pathname);
    const loginUrl = new URL(`/${locale}/auth/login`, request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Validate token
  const { valid, payload } = isValidToken(token);

  if (!valid || !payload) {
    // Redirect to login if token is invalid, preserving locale
    const locale = getLocaleFromPathname(pathname);
    const loginUrl = new URL(`/${locale}/auth/login`, request.url);
    loginUrl.searchParams.set("redirect", pathname);
    loginUrl.searchParams.set("error", "session_expired");
    return NextResponse.redirect(loginUrl);
  }

  // Check route permissions (using clean path without locale)
  const cleanPath = getPathnameWithoutLocale(pathname);
  const requiredPermissions = ROUTE_PERMISSIONS[cleanPath];

  if (requiredPermissions) {
    const userPermissions = payload.permissions || [];

    if (!hasPermission(userPermissions, requiredPermissions)) {
      // Redirect to unauthorized page, preserving locale
      const locale = getLocaleFromPathname(pathname);
      const unauthorizedUrl = new URL(`/${locale}/unauthorized`, request.url);
      unauthorizedUrl.searchParams.set(
        "required",
        requiredPermissions.join(",")
      );
      return NextResponse.redirect(unauthorizedUrl);
    }
  }

  // Add user info to the response headers
  return createAuthenticatedResponse(request, response, payload);
}

export const config = {
  // Match internationalized pathnames and protected routes
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
