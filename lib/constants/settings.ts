export const SETTINGS_PERMISSIONS = {
  // General Settings
  READ_SETTINGS: "settings:read",
  MANAGE_SETTINGS: "settings:red",
  UPLOAD_BRANDING: "settings:upload_branding",

  // Cities Management
  READ_CITIES: "cities:read",
  MANAGE_CITIES: "cities:read",

  // Pickup Cities Management
  READ_PICKUP_CITIES: "pickup-cities:read",
  CREATE_PICKUP_CITY: "pickup-cities:create",
  UPDATE_PICKUP_CITY: "pickup-cities:update",
  DELETE_PICKUP_CITY: "pickup-cities:delete",

  // Tariffs
  READ_TARIFFS: "tariffs:read",
  MANAGE_TARIFFS: "tariffs:read",
  BULK_IMPORT_TARIFFS: "tariffs:bulk_import",

  // Zones
  READ_ZONES: "zones:read",
  MANAGE_ZONES: "zones:read",

  // Options
  READ_OPTIONS: "options:read",
  MANAGE_OPTIONS: "options:read",

  // SMS Settings
  READ_SMS_SETTINGS: "sms_settings:read",
  MANAGE_SMS_SETTINGS: "sms_settings:read",
  MANAGE_SMS_TEMPLATES: "sms_templates:read",

  // Email Settings
  READ_EMAIL_SETTINGS: "email_settings:read",
  MANAGE_EMAIL_SETTINGS: "email_settings:read",
  MANAGE_EMAIL_TEMPLATES: "email_templates:read",

  // Data Operations
  EXPORT_DATA: "data:export",
} as const;

// Settings permission groups for easier management
export const SETTINGS_PERMISSION_GROUPS: any = {
  GENERAL_SETTINGS: [
    SETTINGS_PERMISSIONS.READ_SETTINGS,
    SETTINGS_PERMISSIONS.MANAGE_SETTINGS,
    SETTINGS_PERMISSIONS.UPLOAD_BRANDING,
  ],
  CITIES_MANAGEMENT: [
    SETTINGS_PERMISSIONS.READ_CITIES,
    SETTINGS_PERMISSIONS.MANAGE_CITIES,
  ],
  PICKUP_CITIES: [
    SETTINGS_PERMISSIONS.READ_PICKUP_CITIES,
    SETTINGS_PERMISSIONS.CREATE_PICKUP_CITY,
    SETTINGS_PERMISSIONS.UPDATE_PICKUP_CITY,
    SETTINGS_PERMISSIONS.DELETE_PICKUP_CITY,
  ],
  TARIFFS: [
    SETTINGS_PERMISSIONS.READ_TARIFFS,
    SETTINGS_PERMISSIONS.MANAGE_TARIFFS,
    SETTINGS_PERMISSIONS.BULK_IMPORT_TARIFFS,
  ],
  ZONES: [SETTINGS_PERMISSIONS.READ_ZONES, SETTINGS_PERMISSIONS.MANAGE_ZONES],
  OPTIONS: [
    SETTINGS_PERMISSIONS.READ_OPTIONS,
    SETTINGS_PERMISSIONS.MANAGE_OPTIONS,
  ],
  SMS_SETTINGS: [
    SETTINGS_PERMISSIONS.READ_SMS_SETTINGS,
    SETTINGS_PERMISSIONS.MANAGE_SMS_SETTINGS,
    SETTINGS_PERMISSIONS.MANAGE_SMS_TEMPLATES,
  ],
  EMAIL_SETTINGS: [
    SETTINGS_PERMISSIONS.READ_EMAIL_SETTINGS,
    SETTINGS_PERMISSIONS.MANAGE_EMAIL_SETTINGS,
    SETTINGS_PERMISSIONS.MANAGE_EMAIL_TEMPLATES,
  ],
} as const;

// Extended role permissions for settings (add these to your existing ROLE_PERMISSIONS)
export const SETTINGS_ROLE_PERMISSIONS = {
  ADMIN: [
    // Full settings access
    ...Object.values(SETTINGS_PERMISSIONS),
  ],
  MANAGER: [
    // Read access to most settings, read some
    SETTINGS_PERMISSIONS.READ_SETTINGS,
    SETTINGS_PERMISSIONS.READ_CITIES,
    SETTINGS_PERMISSIONS.MANAGE_CITIES,
    ...SETTINGS_PERMISSION_GROUPS.PICKUP_CITIES,
    SETTINGS_PERMISSIONS.READ_TARIFFS,
    SETTINGS_PERMISSIONS.MANAGE_TARIFFS,
    SETTINGS_PERMISSIONS.READ_ZONES,
    SETTINGS_PERMISSIONS.MANAGE_ZONES,
    SETTINGS_PERMISSIONS.READ_OPTIONS,
    SETTINGS_PERMISSIONS.EXPORT_DATA,
  ],
  EMPLOYEE: [
    // Read-only access to basic settings
    SETTINGS_PERMISSIONS.READ_SETTINGS,
    SETTINGS_PERMISSIONS.READ_CITIES,
    SETTINGS_PERMISSIONS.READ_PICKUP_CITIES,
    SETTINGS_PERMISSIONS.READ_TARIFFS,
    SETTINGS_PERMISSIONS.READ_ZONES,
    SETTINGS_PERMISSIONS.READ_OPTIONS,
  ],
  CLIENT: [
    // Limited read access
    SETTINGS_PERMISSIONS.READ_PICKUP_CITIES,
    SETTINGS_PERMISSIONS.READ_TARIFFS,
  ],
  USER: [
    // Minimal access
    SETTINGS_PERMISSIONS.READ_PICKUP_CITIES,
  ],
} as const;

// Settings Module Configuration
export const SETTINGS_MODULES = [
  {
    title: "General Settings",
    description: "Company information, branding, and basic configuration",
    href: "/settings/general",
    icon: "heroicons:building-office",
    permission: SETTINGS_PERMISSIONS.READ_SETTINGS,
    category: "core",
  },
  {
    title: "Cities Management",
    description: "Manage delivery cities and zones",
    href: "/settings/cities",
    icon: "heroicons:map-pin",
    permission: SETTINGS_PERMISSIONS.READ_CITIES,
    category: "logistics",
  },
  {
    title: "Pickup Cities",
    description: "Configure pickup locations and service areas",
    href: "/settings/pickup-cities",
    icon: "heroicons:truck",
    permission: SETTINGS_PERMISSIONS.READ_PICKUP_CITIES,
    category: "logistics",
  },
  {
    title: "Tariffs Management",
    description: "Set delivery pricing and shipping costs",
    href: "/settings/tariffs",
    icon: "heroicons:currency-dollar",
    permission: SETTINGS_PERMISSIONS.READ_TARIFFS,
    category: "pricing",
  },
  {
    title: "Zones Management",
    description: "Organize cities into delivery zones",
    href: "/settings/zones",
    icon: "heroicons:globe-americas",
    permission: SETTINGS_PERMISSIONS.READ_ZONES,
    category: "logistics",
  },
  {
    title: "System Options",
    description: "Parcel statuses, client types, and banks",
    href: "/settings/options",
    icon: "heroicons:cog-6-tooth",
    permission: SETTINGS_PERMISSIONS.READ_OPTIONS,
    category: "system",
  },
  {
    title: "SMS Settings",
    description: "Configure SMS notifications and templates",
    href: "/settings/sms",
    icon: "heroicons:device-phone-mobile",
    permission: SETTINGS_PERMISSIONS.READ_SMS_SETTINGS,
    category: "communications",
  },
  {
    title: "Email Settings",
    description: "Configure email notifications and templates",
    href: "/settings/email",
    icon: "heroicons:envelope",
    permission: SETTINGS_PERMISSIONS.READ_EMAIL_SETTINGS,
    category: "communications",
  },
] as const;

// Category Colors and Icons
export const SETTINGS_CATEGORIES = {
  core: {
    label: "Core Settings",
    color: "bg-blue-100 text-blue-800",
    icon: "heroicons:building-office",
  },
  logistics: {
    label: "Logistics",
    color: "bg-green-100 text-green-800",
    icon: "heroicons:truck",
  },
  pricing: {
    label: "Pricing",
    color: "bg-yellow-100 text-yellow-800",
    icon: "heroicons:currency-dollar",
  },
  system: {
    label: "System",
    color: "bg-gray-100 text-gray-800",
    icon: "heroicons:cog-6-tooth",
  },
  communications: {
    label: "Communications",
    color: "bg-purple-100 text-purple-800",
    icon: "heroicons:chat-bubble-left-right",
  },
} as const;

// File Upload Configuration
export const FILE_UPLOAD_CONFIG = {
  logo: {
    maxSize: 5 * 1024 * 1024, // 5MB
    acceptedTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
    dimensions: {
      maxWidth: 2000,
      maxHeight: 2000,
      minWidth: 100,
      minHeight: 100,
    },
  },
  favicon: {
    maxSize: 1 * 1024 * 1024, // 1MB
    acceptedTypes: [
      "image/x-icon",
      "image/vnd.microsoft.icon",
      "image/ico",
      "image/png",
    ],
    dimensions: {
      maxWidth: 256,
      maxHeight: 256,
      minWidth: 16,
      minHeight: 16,
    },
  },
} as const;

// Form Validation Messages
export const VALIDATION_MESSAGES = {
  required: "This field is required",
  email: "Please enter a valid email address",
  url: "Please enter a valid URL",
  phone: "Please enter a valid phone number",
  minLength: (length: number) => `Must be at least ${length} characters`,
  maxLength: (length: number) => `Must not exceed ${length} characters`,
  fileSize: (maxSize: string) => `File size must not exceed ${maxSize}`,
  fileType: (types: string[]) => `Only ${types.join(", ")} files are allowed`,
} as const;

// Settings-specific helper functions
export const canAccessSettingsModule = (
  userPermissions: string[],
  modulePermission: string
): boolean => {
  return userPermissions.includes(modulePermission);
};

export const getAccessibleSettingsModules = (userPermissions: string[]) => {
  return SETTINGS_MODULES.filter((module) =>
    canAccessSettingsModule(userPermissions, module.permission)
  );
};

export const getSettingsModulesByCategory = (
  category: keyof typeof SETTINGS_CATEGORIES,
  userPermissions?: string[]
) => {
  const modules = SETTINGS_MODULES.filter(
    (module) => module.category === category
  );

  if (userPermissions) {
    return modules.filter((module) =>
      canAccessSettingsModule(userPermissions, module.permission)
    );
  }

  return modules;
};
