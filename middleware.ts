import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { locales } from "@/config";

// Protected routes that require authentication
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

// Auth routes that should redirect if already logged in
const authRoutes = ["/auth/login", "/auth/register", "/auth/forgot-password"];

function isProtectedRoute(pathname: string): boolean {
  const routeWithoutLocale = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, "") || "/";
  return protectedRoutes.some((route) => routeWithoutLocale.startsWith(route));
}

function isAuthRoute(pathname: string): boolean {
  const routeWithoutLocale = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, "") || "/";
  return authRoutes.some((route) => routeWithoutLocale.startsWith(route));
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

function isTokenValid(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp > currentTime;
  } catch {
    return false;
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

  const token = getAuthToken(request);
  const isAuthenticated = token && isTokenValid(token);

  // Handle protected routes
  if (isProtectedRoute(pathname)) {
    if (!isAuthenticated) {
      const locale = pathname.match(/^\/([a-z]{2})/)?.[1] || "en";
      const loginUrl = `/${locale}/auth/login`;
      return NextResponse.redirect(new URL(loginUrl, request.url));
    }
  }

  // Handle auth routes (prevent logged-in users from accessing login/register)
  if (isAuthRoute(pathname) && isAuthenticated) {
    const locale = pathname.match(/^\/([a-z]{2})/)?.[1] || "en";
    return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
  }

  // Add security headers
  const headers = new Headers(response?.headers);
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

  return new NextResponse(response?.body, {
    status: response?.status,
    statusText: response?.statusText,
    headers,
  });
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|images|icons).*)"],
};
