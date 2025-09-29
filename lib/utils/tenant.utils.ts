export function getTenantFromUrl(): string | null {
  if (typeof window === "undefined") return null;

  const hostname = window.location.hostname;

  // Handle localhost development
 // if (hostname === "localhost" || hostname === "127.0.0.1") {
    // Check for query parameter fallback
    const urlParams = new URLSearchParams(window.location.search);
    const tenantParam = urlParams.get("tenant");
    if (tenantParam) return tenantParam;

    // Check for environment variable fallback
    const devTenant = "cmg4w6pho0000wrlwk6g1znx9";
    if (devTenant) return devTenant;

    return null;
  //}

  // Production: Extract from subdomain
  const parts = hostname.split(".");

  // Must have at least 3 parts for subdomain
  if (parts.length >= 3) {
    const subdomain = parts[0];

    // Exclude common subdomains that aren't tenants
    const excludedSubdomains = [
      "www",
      "api",
      "admin",
      "app",
      "mail",
      "ftp",
      "cdn",
      "static",
    ];

    if (!excludedSubdomains.includes(subdomain.toLowerCase())) {
      return subdomain;
    }
  }

  // Fallback: Check for path-based routing
  // e.g., myapp.com/tenant/dashboard
  const pathParts = window.location.pathname.split("/").filter(Boolean);
  if (pathParts.length > 0 && pathParts[0] !== "auth") {
    // Validate that it looks like a tenant slug
    const potentialTenant = pathParts[0];
    if (/^[a-z0-9-]+$/.test(potentialTenant) && potentialTenant.length >= 2) {
      return potentialTenant;
    }
  }

  return null;
}

export function getTenantDomain(tenantSlug: string): string {
  const isProduction = process.env.NODE_ENV === "production";
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || "localhost:3000";

  if (isProduction) {
    return `${tenantSlug}.${baseDomain}`;
  } else {
    return `${baseDomain}?tenant=${tenantSlug}`;
  }
}

export function buildTenantUrl(tenantSlug: string, path: string = "/"): string {
  const domain = getTenantDomain(tenantSlug);
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";

  return `${protocol}://${domain}${path}`;
}

export function validateTenantSlug(slug: string): boolean {
  // Tenant slug validation rules
  const rules = [
    slug.length >= 2 && slug.length <= 63, // Length constraints
    /^[a-z0-9-]+$/.test(slug), // Only lowercase, numbers, hyphens
    !slug.startsWith("-") && !slug.endsWith("-"), // No leading/trailing hyphens
    !slug.includes("--"), // No consecutive hyphens
    !/^\d+$/.test(slug), // Not purely numeric
  ];

  return rules.every(Boolean);
}

export function normalizeTenantSlug(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-") // Replace invalid chars with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single
    .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens
}

export function isValidTenantDomain(domain: string): boolean {
  const domainRegex =
    /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i;
  return domainRegex.test(domain);
}
