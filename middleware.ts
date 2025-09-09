import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { locales } from "@/config";

// Define protected routes that require authentication
const protectedRoutes = [
  "/dashboard",
  "/parcels",
  "/invoices",
  "/claims",
  "/users",
  "/roles",
  "/settings",
  "/analytics",
];

// Define public routes that don't require authentication
const publicRoutes = [
  "/",
  "/login",
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
];

// Define auth routes (redirect to dashboard if already authenticated)
const authRoutes = ["/login", "/auth/login", "/auth/register"];

function isProtectedRoute(pathname: string): boolean {
  // Remove locale prefix for route checking
  const routeWithoutLocale = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, "") || "/";

  return protectedRoutes.some((route) => routeWithoutLocale.startsWith(route));
}

function isPublicRoute(pathname: string): boolean {
  // Remove locale prefix for route checking
  const routeWithoutLocale = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, "") || "/";

  return publicRoutes.some(
    (route) =>
      routeWithoutLocale === route || routeWithoutLocale.startsWith(route)
  );
}

function isAuthRoute(pathname: string): boolean {
  // Remove locale prefix for route checking
  const routeWithoutLocale = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, "") || "/";

  return authRoutes.some(
    (route) =>
      routeWithoutLocale === route || routeWithoutLocale.startsWith(route)
  );
}

function getAuthToken(request: NextRequest): string | null {
  // Try to get token from Authorization header
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  // Try to get token from cookie
  const tokenCookie = request.cookies.get("auth_token");
  if (tokenCookie) {
    return tokenCookie.value;
  }

  return null;
}

function isTokenExpired(token: string): boolean {
  try {
    // Simple JWT expiration check (you might want to use a proper JWT library)
    const payload = JSON.parse(atob(token.split(".")[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
  } catch {
    return true; // If we can't parse the token, consider it expired
  }
}

function getTenantFromRequest(request: NextRequest): string | null {
  const hostname = request.nextUrl.hostname;

  // Handle localhost development
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    // Check for query parameter
    const tenantParam = request.nextUrl.searchParams.get("tenant");
    if (tenantParam) return tenantParam;

    // Check for path-based routing
    const pathParts = request.nextUrl.pathname.split("/").filter(Boolean);
    if (pathParts.length > 1 && pathParts[0] === "platform") {
      return pathParts[1];
    }

    return process.env.NEXT_PUBLIC_DEV_TENANT_ID || null;
  }

  // Production: Extract from subdomain
  const parts = hostname.split(".");
  if (parts.length >= 3) {
    const subdomain = parts[0];
    const excludedSubdomains = ["www", "api", "admin", "app"];

    if (!excludedSubdomains.includes(subdomain.toLowerCase())) {
      return subdomain;
    }
  }

  return null;
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get tenant information
  const tenantId = getTenantFromRequest(request);

  // Step 1: Handle internationalization
  const defaultLocale = request.headers.get("network-locale") || "en";
  const handleI18nRouting = createMiddleware({
    locales,
    defaultLocale,
  });

  let response = handleI18nRouting(request);

  // Step 2: Handle authentication logic
  const token = getAuthToken(request);
  const isAuthenticated = token && !isTokenExpired(token);

  // Handle protected routes
  if (isProtectedRoute(pathname)) {
    if (!isAuthenticated) {
      // Redirect to login with return URL
      const loginUrl = new URL("/", request.url);
      loginUrl.searchParams.set("redirect", pathname);

      response = NextResponse.redirect(loginUrl);
    }
  }

  // Handle auth routes (redirect authenticated users to dashboard)
  else if (isAuthRoute(pathname) && isAuthenticated) {
    // Check if there's a redirect parameter
    const redirectTo = request.nextUrl.searchParams.get("redirect");
    const dashboardUrl = new URL(redirectTo || "/dashboard", request.url);

    response = NextResponse.redirect(dashboardUrl);
  }

  // Handle root route
  else if (pathname === "/" || pathname.match(/^\/[a-z]{2}$/)) {
    if (isAuthenticated) {
      // Redirect authenticated users to dashboard
      const dashboardUrl = new URL("/dashboard", request.url);
      response = NextResponse.redirect(dashboardUrl);
    }
    // If not authenticated, root route will show login (handled in page.tsx)
  }

  // Step 3: Add custom headers
  response.headers.set("network-locale", defaultLocale);

  // Add tenant information to headers for use in components
  if (tenantId) {
    response.headers.set("x-tenant-id", tenantId);
  }

  // Add security headers
  response.headers.set("x-frame-options", "DENY");
  response.headers.set("x-content-type-options", "nosniff");
  response.headers.set("referrer-policy", "origin-when-cross-origin");

  // For development: Add CORS headers
  if (process.env.NODE_ENV === "development") {
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Tenant-ID"
    );
  }

  return response;
}

export const config = {
  // Match all routes except static files and API routes
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!api|_next/static|_next/image|favicon.ico|images|icons).*)",
  ],
};
