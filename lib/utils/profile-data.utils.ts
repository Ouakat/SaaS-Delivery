interface AddressObject {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

/**
 * Safely formats address data for display
 * Handles both string and object formats from different data sources
 */
export function formatAddress(
  address: string | AddressObject | null | undefined
): string {
  if (!address) return "Not provided";

  // If it's already a string, return it
  if (typeof address === "string") {
    return address.trim() || "Not provided";
  }

  // If it's an object, format it
  if (typeof address === "object" && address !== null) {
    const parts = [
      address.street,
      address.city,
      address.state,
      address.zipCode,
      address.country,
    ].filter((part) => part && part.trim().length > 0);

    return parts.length > 0 ? parts.join(", ") : "Not provided";
  }

  return "Not provided";
}

/**
 * Safely extracts phone number from user data
 */
export function formatPhone(user: any, profile: any): string {
  const phone = user?.phone || profile?.phone;
  return phone && typeof phone === "string" ? phone : "Not provided";
}

/**
 * Safely extracts city from user data
 */
export function formatCity(user: any, profile: any): string {
  // Check user-level city first
  if (user?.city && typeof user.city === "string") {
    return user.city;
  }

  // Check profile-level city
  if (profile?.city && typeof profile.city === "string") {
    return profile.city;
  }

  // Check address object city
  if (
    profile?.address &&
    typeof profile.address === "object" &&
    profile.address.city
  ) {
    return profile.address.city;
  }

  return "Not provided";
}

/**
 * Safely formats user name
 */
export function formatUserName(user: any): string {
  if (user?.name && typeof user.name === "string") {
    return user.name.trim();
  }

  // Fallback to email prefix
  if (user?.email && typeof user.email === "string") {
    const emailPrefix = user.email.split("@")[0];
    return emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
  }

  return "Unknown User";
}

/**
 * Safely formats email with validation
 */
export function formatEmail(user: any): string {
  return user?.email && typeof user.email === "string"
    ? user.email
    : "Not provided";
}

/**
 * Safely extracts CIN from profile
 */
export function formatCIN(profile: any): string {
  return profile?.cin && typeof profile.cin === "string"
    ? profile.cin
    : "Not provided";
}

/**
 * Safely formats date values
 */
export function formatDate(
  dateValue: string | Date | null | undefined,
  fallback: string = "Unknown"
): string {
  if (!dateValue) return fallback;

  try {
    const date =
      typeof dateValue === "string" ? new Date(dateValue) : dateValue;
    if (isNaN(date.getTime())) return fallback;
    return date.toLocaleDateString();
  } catch (error) {
    return fallback;
  }
}

/**
 * Creates safe profile information array for display
 */
export function createProfileInfoArray(profileData: any) {
  if (!profileData) return [];

  const profile = profileData.profile || {};

  return [
    {
      icon: "Mail",
      label: "Email",
      value: formatEmail(profileData),
      href: profileData?.email ? `mailto:${profileData.email}` : undefined,
    },
    {
      icon: "Phone",
      label: "Phone",
      value: formatPhone(profileData, profile),
      href: (() => {
        const phone = formatPhone(profileData, profile);
        return phone !== "Not provided" ? `tel:${phone}` : undefined;
      })(),
    },
    {
      icon: "MapPin",
      label: "City",
      value: formatCity(profileData, profile),
    },
    {
      icon: "MapPin",
      label: "Full Address",
      value: formatAddress(profile.address),
    },
    {
      icon: "FileText",
      label: "National ID (CIN)",
      value: formatCIN(profile),
    },
    {
      icon: "Building",
      label: "Organization",
      value: profileData.tenant?.name || "Not provided",
    },
    {
      icon: "Users",
      label: "Role",
      value: profileData.role?.name || "No role assigned",
    },
    {
      icon: "Calendar",
      label: "Joined",
      value: formatDate(profileData.createdAt, "Unknown"),
    },
    {
      icon: "Calendar",
      label: "Last Login",
      value: formatDate(profileData.lastLogin, "Never"),
    },
  ];
}

/**
 * Validates profile data structure
 */
export function validateProfileData(profileData: any): boolean {
  if (!profileData || typeof profileData !== "object") {
    console.warn("Invalid profile data: not an object");
    return false;
  }

  // Check for required fields
  const requiredFields = ["id", "email"];
  for (const field of requiredFields) {
    if (!profileData[field]) {
      console.warn(`Invalid profile data: missing ${field}`);
      return false;
    }
  }

  return true;
}

/**
 * Safely gets nested object property
 */
export function safeGet(obj: any, path: string, fallback: any = null): any {
  try {
    return path.split(".").reduce((current, key) => {
      return current && typeof current === "object" && key in current
        ? current[key]
        : fallback;
    }, obj);
  } catch (error) {
    return fallback;
  }
}

/**
 * Debug helper for profile data issues
 */
export function debugProfileData(profileData: any) {
  if (process.env.NODE_ENV !== "development") return;

  console.group("Profile Data Debug");
  console.log("Raw profile data:", profileData);
  console.log("Profile object:", profileData?.profile);
  console.log("Address type:", typeof profileData?.profile?.address);
  console.log("Address value:", profileData?.profile?.address);
  console.log(
    "Formatted address:",
    formatAddress(profileData?.profile?.address)
  );
  console.groupEnd();
}
