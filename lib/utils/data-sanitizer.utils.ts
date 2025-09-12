/**
 * Recursively sanitizes data to ensure no objects are rendered as React children
 * Converts nested objects to strings or removes them entirely
 */
export function sanitizeDataForReact(data: any): any {
  if (data === null || data === undefined) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeDataForReact(item));
  }

  if (typeof data === "object") {
    const sanitized: any = {};

    for (const [key, value] of Object.entries(data)) {
      if (value === null || value === undefined) {
        sanitized[key] = value;
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map((item) => sanitizeDataForReact(item));
      } else if (typeof value === "object") {
        // For nested objects, we need to decide how to handle them
        // For address objects, convert to string
        if (key === "address" && isAddressObject(value)) {
          sanitized[key] = formatAddressObject(value);
        } else {
          // For other objects, recursively sanitize
          sanitized[key] = sanitizeDataForReact(value);
        }
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  return data;
}

/**
 * Checks if an object looks like an address object
 */
function isAddressObject(obj: any): boolean {
  if (!obj || typeof obj !== "object") return false;

  const addressKeys = [
    "street",
    "city",
    "state",
    "country",
    "zipCode",
    "zip",
    "postal",
  ];
  const objectKeys = Object.keys(obj);

  // If it has any address-like keys, treat it as an address
  return addressKeys.some((key) => objectKeys.includes(key));
}

/**
 * Formats an address object into a readable string
 */
function formatAddressObject(address: any): string {
  if (!address || typeof address !== "object") return "";

  const parts = [
    address.street,
    address.city,
    address.state,
    address.zipCode || address.zip || address.postal,
    address.country,
  ].filter((part) => part && typeof part === "string" && part.trim());

  return parts.join(", ");
}

/**
 * Specifically sanitizes tenant data
 */
export function sanitizeTenantData(tenant: any): any {
  if (!tenant) return tenant;

  return {
    ...tenant,
    // Ensure address is always a string
    address: isAddressObject(tenant.address)
      ? formatAddressObject(tenant.address)
      : tenant.address || "",

    // Sanitize nested profile data if present
    profile: tenant.profile
      ? sanitizeDataForReact(tenant.profile)
      : tenant.profile,

    // Sanitize settings
    settings: tenant.settings
      ? sanitizeDataForReact(tenant.settings)
      : tenant.settings,

    // Ensure all other fields are properly handled
    ...sanitizeDataForReact(tenant),
  };
}

/**
 * Specifically sanitizes user profile data
 */
export function sanitizeProfileData(profile: any): any {
  if (!profile) return profile;

  const sanitized = { ...profile };

  // Handle profile.profile nested structure
  if (sanitized.profile && typeof sanitized.profile === "object") {
    sanitized.profile = {
      ...sanitized.profile,
      // Convert address object to string
      address: isAddressObject(sanitized.profile.address)
        ? formatAddressObject(sanitized.profile.address)
        : sanitized.profile.address || "",
    };
  }

  // Handle direct address property
  if (isAddressObject(sanitized.address)) {
    sanitized.address = formatAddressObject(sanitized.address);
  }

  return sanitizeDataForReact(sanitized);
}

/**
 * Debug helper to identify problematic objects
 */
export function findProblematicObjects(
  obj: any,
  path: string = "root"
): string[] {
  const problems: string[] = [];

  if (obj === null || obj === undefined) {
    return problems;
  }

  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      problems.push(...findProblematicObjects(item, `${path}[${index}]`));
    });
    return problems;
  }

  if (typeof obj === "object") {
    // Check if this object has keys that might be rendered
    const keys = Object.keys(obj);
    if (keys.length > 0) {
      const hasComplexStructure = keys.some(
        (key) => typeof obj[key] === "object" && obj[key] !== null
      );

      if (hasComplexStructure) {
        problems.push(
          `Potentially problematic object at ${path}: {${keys.join(", ")}}`
        );
      }
    }

    // Recursively check nested objects
    for (const [key, value] of Object.entries(obj)) {
      problems.push(...findProblematicObjects(value, `${path}.${key}`));
    }
  }

  return problems;
}
