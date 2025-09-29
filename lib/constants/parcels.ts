export const PARCELS_PERMISSIONS = {
  // Cities Management
  CITIES_READ: "cities:read",
  CITIES_CREATE: "cities:create",
  CITIES_UPDATE: "cities:update",
  CITIES_DELETE: "cities:delete",

  // Zones Management
  ZONES_READ: "zones:read",
  ZONES_CREATE: "zones:create",
  ZONES_UPDATE: "zones:update",
  ZONES_DELETE: "zones:delete",

  // Tariffs Management
  TARIFFS_READ: "tariffs:read",
  TARIFFS_CREATE: "tariffs:create",
  TARIFFS_UPDATE: "tariffs:update",
  TARIFFS_DELETE: "tariffs:delete",

  // Parcels Management
  PARCELS_READ: "parcels:read",
  PARCELS_MANAGE: "parcels:read",
  PARCELS_CREATE: "parcels:create",
  PARCELS_UPDATE: "parcels:update",
  PARCELS_DELETE: "parcels:delete",
  PARCELS_TRACK: "parcels:read",
  PARCELS_MANAGE_STATUS: "parcels:read",

  // Parcel Status Management
  PARCEL_STATUSES_READ: "parcel_statuses:read",
  PARCEL_STATUSES_CREATE: "parcel_statuses:create",
  PARCEL_STATUSES_UPDATE: "parcel_statuses:update",
  PARCEL_STATUSES_DELETE: "parcel_statuses:delete",

  // Delivery Slips Management
  DELIVERY_SLIPS_READ: "delivery_slips:read",
  DELIVERY_SLIPS_CREATE: "delivery_slips:create",
  DELIVERY_SLIPS_UPDATE: "delivery_slips:update",
  DELIVERY_SLIPS_DELETE: "delivery_slips:delete",
  DELIVERY_SLIPS_RECEIVE: "delivery_slips:read",
  DELIVERY_SLIPS_BULK: "delivery_slips:read",
  DELIVERY_SLIPS_SCAN: "delivery_slips:read",

  // Shipping Slips Management
  SHIPPING_SLIPS_READ: "shipping_slips:read",
  SHIPPING_SLIPS_CREATE: "shipping_slips:create",
  SHIPPING_SLIPS_UPDATE: "shipping_slips:update",
  SHIPPING_SLIPS_DELETE: "shipping_slips:delete",
  SHIPPING_SLIPS_SHIP: "shipping_slips:read",
  SHIPPING_SLIPS_RECEIVE: "shipping_slips:read",
  SHIPPING_SLIPS_BULK: "shipping_slips:read",
  SHIPPING_SLIPS_SCAN: "shipping_slips:read",

  // Distribution Slips Management
  DISTRIBUTION_SLIPS_READ: "distribution_slips:read",
  DISTRIBUTION_SLIPS_CREATE: "distribution_slips:create",
  DISTRIBUTION_SLIPS_UPDATE: "distribution_slips:update",
  DISTRIBUTION_SLIPS_DELETE: "distribution_slips:delete",
  DISTRIBUTION_SLIPS_ASSIGN: "distribution_slips:read",

  // Return Slips Management
  RETURN_SLIPS_READ: "return_slips:read",
  RETURN_SLIPS_CREATE: "return_slips:create",
  RETURN_SLIPS_UPDATE: "return_slips:update",
  RETURN_SLIPS_DELETE: "return_slips:delete",
  RETURN_SLIPS_PROCESS: "return_slips:read",

  // Payment Slips Management
  PAYMENT_SLIPS_READ: "payment_slips:read",
  PAYMENT_SLIPS_CREATE: "payment_slips:create",
  PAYMENT_SLIPS_UPDATE: "payment_slips:update",
  PAYMENT_SLIPS_DELETE: "payment_slips:delete",
  PAYMENT_SLIPS_PROCESS: "payment_slips:read",
  PAYMENT_SLIPS_VERIFY: "payment_slips:read",
  PAYMENT_SLIPS_PAY: "payment_slips:read",
  PAYMENT_SLIPS_CANCEL: "payment_slips:read",

  // Scanner Operations
  SCANNER_USE: "scanner:read",
  SCANNER_ADMIN: "scanner:read",

  // Reports and Analytics
  PARCELS_REPORTS: "parcels:read",
  PARCELS_ANALYTICS: "parcels:read",
  PARCELS_EXPORT: "parcels:read",

  // Cities Management
  READ_CITIES: "cities:read",
  MANAGE_CITIES: "cities:read",

  // Pickup Cities Management
  READ_PICKUP_CITIES: "pickup_cities:read",
  CREATE_PICKUP_CITY: "pickup_cities:create",
  UPDATE_PICKUP_CITY: "pickup_cities:update",
  DELETE_PICKUP_CITY: "pickup_cities:delete",

  // Tariffs
  READ_TARIFFS: "tariffs:read",
  MANAGE_TARIFFS: "tariffs:read",
  BULK_IMPORT_TARIFFS: "tariffs:read",

  // Zones
  READ_ZONES: "zones:read",
  CREATE_ZONE: "zones:create",
  MANAGE_ZONES: "zones:read",
  UPDATE_ZONE: "zones:update",
  DELETE_ZONE: "zones:delete",
  EXPORT_ZONES: "zones:read",

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
  EXPORT_DATA: "data:read",
} as const;
