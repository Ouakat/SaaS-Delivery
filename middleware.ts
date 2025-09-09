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

// Define auth routes (these should redirect to dashboard if user is authenticated)
const authRoutes = [
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
];

function isProtectedRoute(pathname: string): boolean {
  // Remove locale prefix for route checking
  const routeWithoutLocale = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, "") || "/";
  return protectedRoutes.some((route) => routeWithoutLocale.startsWith(route));
}

function isAuthRoute(pathname: string): boolean {
  // Remove locale prefix for route checking
  const routeWithoutLocale = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, "") || "/";
  return authRoutes.some((route) => routeWithoutLocale.startsWith(route));
}

function isRootRoute(pathname: string): boolean {
  // Check if it's root with locale (e.g., "/en", "/fr") or just "/"
  return pathname === "/" || pathname.match(/^\/[a-z]{2}$/);
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
    // Simple JWT expiration check
    const payload = JSON.parse(atob(token.split(".")[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
  } catch {
    return true;
  }
}

function getTenantFromRequest(request: NextRequest): string | null {
  const hostname = request.nextUrl.hostname;

  // Handle localhost development
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    const tenantParam = request.nextUrl.searchParams.get("tenant");
    if (tenantParam) return tenantParam;

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

  // Step 1: Handle internationalization first
  const defaultLocale = request.headers.get("network-locale") || "en";
  const handleI18nRouting = createMiddleware({
    locales,
    defaultLocale,
  });

  let response = handleI18nRouting(request);

  // Step 2: Handle authentication logic
  const token = getAuthToken(request);
  const isAuthenticated = token && !isTokenExpired(token);

  // Handle protected routes - redirect to root (login page)
  if (isProtectedRoute(pathname)) {
    if (!isAuthenticated) {
      const rootUrl = new URL("/", request.url);
      rootUrl.searchParams.set("redirect", pathname);
      response = NextResponse.redirect(rootUrl);
    }
  }

  // Handle old auth routes - redirect authenticated users to dashboard
  else if (isAuthRoute(pathname)) {
    if (isAuthenticated) {
      const redirectTo = request.nextUrl.searchParams.get("redirect");
      // const dashboardUrl = new URL(redirectTo || "/dashboard", request.url);
      // response = NextResponse.redirect(dashboardUrl);
    } else {
      // Redirect old auth routes to root with redirect parameter
      const rootUrl = new URL("/", request.url);
      if (request.nextUrl.searchParams.get("redirect")) {
        rootUrl.searchParams.set(
          "redirect",
          request.nextUrl.searchParams.get("redirect")!
        );
      }
      response = NextResponse.redirect(rootUrl);
    }
  }

  // Handle root route - this is now the login page
  else if (isRootRoute(pathname)) {
    if (isAuthenticated) {
      // Redirect authenticated users to dashboard
      const redirectTo = request.nextUrl.searchParams.get("redirect");
      // const dashboardUrl = new URL(redirectTo || "/dashboard", request.url);
      // response = NextResponse.redirect(dashboardUrl);
    }
    // If not authenticated, root route will show login (handled in page.tsx)
  }

  // Step 3: Add custom headers
  response.headers.set("network-locale", defaultLocale);

  // Add tenant information to headers
  if (tenantId) {
    response.headers.set("x-tenant-id", tenantId);
  }

  // Add security headers
  response.headers.set("x-frame-options", "DENY");
  response.headers.set("x-content-type-options", "nosniff");
  response.headers.set("referrer-policy", "origin-when-cross-origin");

  // Development CORS headers
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
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|images|icons).*)"],
};
