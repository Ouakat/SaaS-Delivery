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

function isProtectedRoute(pathname: string): boolean {
  // Remove locale prefix to check the actual route
  const routeWithoutLocale = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, "") || "/";
  return protectedRoutes.some((route) => routeWithoutLocale.startsWith(route));
}

function getAuthToken(request: NextRequest): string | null {
  // Check Authorization header first
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  // Check cookie
  const tokenCookie = request.cookies.get("auth_token");
  return tokenCookie?.value || null;
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

  // Check authentication for protected routes
  if (isProtectedRoute(pathname)) {
    const token = getAuthToken(request);
    const isAuthenticated = token && isTokenValid(token);

    if (!isAuthenticated) {
      // Simple redirect to root without complex URL manipulation
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // Add security headers
  const headers = new Headers(response?.headers);
  headers.set("x-frame-options", "DENY");
  headers.set("x-content-type-options", "nosniff");
  headers.set("referrer-policy", "origin-when-cross-origin");

  if (process.env.NODE_ENV === "development") {
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
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
