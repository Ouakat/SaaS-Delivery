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

// Define public auth routes (accessible without authentication)
const publicAuthRoutes = [
  "/register",
  "/forgot-password",
  "/auth/register",
  "/auth/forgot-password",
];

// Define auth routes that should redirect to dashboard if authenticated
const authRoutes = ["/auth/login"];

function isProtectedRoute(pathname: string): boolean {
  const routeWithoutLocale = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, "") || "/";
  return protectedRoutes.some((route) => routeWithoutLocale.startsWith(route));
}

function isPublicAuthRoute(pathname: string): boolean {
  const routeWithoutLocale = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, "") || "/";
  return publicAuthRoutes.some((route) => routeWithoutLocale.startsWith(route));
}

function isAuthRoute(pathname: string): boolean {
  const routeWithoutLocale = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, "") || "/";
  return authRoutes.some((route) => routeWithoutLocale.startsWith(route));
}

function isRootRoute(pathname: string): boolean {
  return pathname === "/" || pathname.match(/^\/[a-z]{2}$/);
}

function getAuthToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  const tokenCookie = request.cookies.get("auth_token");
  if (tokenCookie) {
    return tokenCookie.value;
  }

  return null;
}

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
  } catch {
    return true;
  }
}

function getTenantFromRequest(request: NextRequest): string | null {
  const hostname = request.nextUrl.hostname;

  if (hostname === "localhost" || hostname === "127.0.0.1") {
    const tenantParam = request.nextUrl.searchParams.get("tenant");
    if (tenantParam) return tenantParam;
    return process.env.NEXT_PUBLIC_DEV_TENANT_ID || null;
  }

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

  // Handle internationalization first
  const defaultLocale = "en";
  const handleI18nRouting = createMiddleware({
    locales,
    defaultLocale,
  });

  let response = handleI18nRouting(request);

  if (response && response.status >= 300 && response.status < 400) {
    return response;
  }

  const tenantId = getTenantFromRequest(request);
  const token = getAuthToken(request);
  const isAuthenticated = token && !isTokenExpired(token);

  // Handle public auth routes - allow access regardless of auth status
  if (isPublicAuthRoute(pathname)) {
    console.log("📝 Public auth route accessed:", pathname);
    // Don't redirect, allow access to register/forgot-password
  }

  // Handle old auth login route - redirect to root or dashboard
  else if (isAuthRoute(pathname)) {
    const localeMatch = pathname.match(/^\/([a-z]{2})/);
    const locale = localeMatch ? localeMatch[1] : defaultLocale;

    if (isAuthenticated) {
      const redirectTo = request.nextUrl.searchParams.get("redirect");
      const dashboardUrl = new URL(
        redirectTo || `/${locale}/dashboard`,
        request.url
      );
      response = NextResponse.redirect(dashboardUrl);
    } else {
      const rootUrl = new URL(`/${locale}`, request.url);
      if (request.nextUrl.searchParams.get("redirect")) {
        rootUrl.searchParams.set(
          "redirect",
          request.nextUrl.searchParams.get("redirect")!
        );
      }
      response = NextResponse.redirect(rootUrl);
    }
  }

  // Handle protected routes
  else if (isProtectedRoute(pathname)) {
    if (!isAuthenticated) {
      const localeMatch = pathname.match(/^\/([a-z]{2})/);
      const locale = localeMatch ? localeMatch[1] : defaultLocale;
      const rootUrl = new URL(`/${locale}`, request.url);
      rootUrl.searchParams.set("redirect", pathname);
      response = NextResponse.redirect(rootUrl);
    }
  }

  // Handle root route
  else if (isRootRoute(pathname)) {
    if (isAuthenticated) {
      const localeMatch = pathname.match(/^\/([a-z]{2})/);
      const locale = localeMatch ? localeMatch[1] : defaultLocale;
      const redirectTo = request.nextUrl.searchParams.get("redirect");
      const dashboardUrl = new URL(
        redirectTo || `/${locale}/dashboard`,
        request.url
      );
      response = NextResponse.redirect(dashboardUrl);
    }
  }

  // Add headers
  if (response) {
    response.headers.set("network-locale", defaultLocale);
    if (tenantId) {
      response.headers.set("x-tenant-id", tenantId);
    }
    response.headers.set("x-frame-options", "DENY");
    response.headers.set("x-content-type-options", "nosniff");
    response.headers.set("referrer-policy", "origin-when-cross-origin");

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
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|images|icons).*)"],
};
