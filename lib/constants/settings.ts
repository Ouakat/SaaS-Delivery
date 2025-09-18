// Settings Permissions
export const SETTINGS_PERMISSIONS = {
  // General Settings
  READ_GENERAL_SETTINGS: "settings:read_general",
  MANAGE_GENERAL_SETTINGS: "settings:manage_general",
  UPLOAD_BRANDING: "settings:upload_branding",

  // Cities Management
  READ_CITIES: "settings:read_cities",
  MANAGE_CITIES: "settings:manage_cities",

  // Pickup Cities
  READ_PICKUP_CITIES: "settings:read_pickup_cities",
  MANAGE_PICKUP_CITIES: "settings:manage_pickup_cities",

  // Tariffs
  READ_TARIFFS: "settings:read_tariffs",
  MANAGE_TARIFFS: "settings:manage_tariffs",
  BULK_IMPORT_TARIFFS: "settings:bulk_import_tariffs",

  // Zones
  READ_ZONES: "settings:read_zones",
  MANAGE_ZONES: "settings:manage_zones",

  // Options
  READ_OPTIONS: "settings:read_options",
  MANAGE_OPTIONS: "settings:manage_options",

  // SMS Settings
  READ_SMS_SETTINGS: "settings:read_sms",
  MANAGE_SMS_SETTINGS: "settings:manage_sms",
  MANAGE_SMS_TEMPLATES: "settings:manage_sms_templates",

  // Email Settings
  READ_EMAIL_SETTINGS: "settings:read_email",
  MANAGE_EMAIL_SETTINGS: "settings:manage_email",
  MANAGE_EMAIL_TEMPLATES: "settings:manage_email_templates",
} as const;

// Settings Module Configuration
export const SETTINGS_MODULES = [
  {
    title: "General Settings",
    description: "Company information, branding, and basic configuration",
    href: "/settings/general",
    icon: "heroicons:building-office",
    permission: SETTINGS_PERMISSIONS.READ_GENERAL_SETTINGS,
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
