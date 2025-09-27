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
  PARCELS_TRACK: "parcels:track",
  PARCELS_MANAGE_STATUS: "parcels:manage_status",

  // Parcel Status Management
  PARCEL_STATUSES_READ: "parcel-statuses:read",
  PARCEL_STATUSES_CREATE: "parcel-statuses:create",
  PARCEL_STATUSES_UPDATE: "parcel-statuses:update",
  PARCEL_STATUSES_DELETE: "parcel-statuses:delete",

  // Delivery Slips Management
  DELIVERY_SLIPS_READ: "delivery-slips:read",
  DELIVERY_SLIPS_CREATE: "delivery-slips:create",
  DELIVERY_SLIPS_UPDATE: "delivery-slips:update",
  DELIVERY_SLIPS_DELETE: "delivery-slips:delete",
  DELIVERY_SLIPS_RECEIVE: "delivery-slips:receive",

  // Shipping Slips Management
  SHIPPING_SLIPS_READ: "shipping-slips:read",
  SHIPPING_SLIPS_CREATE: "shipping-slips:create",
  SHIPPING_SLIPS_UPDATE: "shipping-slips:update",
  SHIPPING_SLIPS_DELETE: "shipping-slips:delete",
  SHIPPING_SLIPS_SHIP: "shipping-slips:ship",
  SHIPPING_SLIPS_RECEIVE: "shipping-slips:receive",

  // Distribution Slips Management
  DISTRIBUTION_SLIPS_READ: "distribution-slips:read",
  DISTRIBUTION_SLIPS_CREATE: "distribution-slips:create",
  DISTRIBUTION_SLIPS_UPDATE: "distribution-slips:update",
  DISTRIBUTION_SLIPS_DELETE: "distribution-slips:delete",
  DISTRIBUTION_SLIPS_ASSIGN: "distribution-slips:assign",

  // Return Slips Management
  RETURN_SLIPS_READ: "return-slips:read",
  RETURN_SLIPS_CREATE: "return-slips:create",
  RETURN_SLIPS_UPDATE: "return-slips:update",
  RETURN_SLIPS_DELETE: "return-slips:delete",
  RETURN_SLIPS_PROCESS: "return-slips:process",

  // Payment Slips Management
  PAYMENT_SLIPS_READ: "payment-slips:read",
  PAYMENT_SLIPS_CREATE: "payment-slips:create",
  PAYMENT_SLIPS_UPDATE: "payment-slips:update",
  PAYMENT_SLIPS_DELETE: "payment-slips:delete",
  PAYMENT_SLIPS_PROCESS: "payment-slips:process",
  PAYMENT_SLIPS_VERIFY: "payment-slips:verify",
  PAYMENT_SLIPS_PAY: "payment-slips:pay",
  PAYMENT_SLIPS_CANCEL: "payment-slips:cancel",

  // Scanner Operations
  SCANNER_USE: "scanner:use",
  SCANNER_ADMIN: "scanner:admin",

  // Reports and Analytics
  PARCELS_REPORTS: "parcels:reports",
  PARCELS_ANALYTICS: "parcels:analytics",
  PARCELS_EXPORT: "parcels:export",

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
  READ_SMS_SETTINGS: "sms-settings:read",
  MANAGE_SMS_SETTINGS: "sms-settings:read",
  MANAGE_SMS_TEMPLATES: "sms-templates:read",

  // Email Settings
  READ_EMAIL_SETTINGS: "email_settings:read",
  MANAGE_EMAIL_SETTINGS: "email_settings:read",
  MANAGE_EMAIL_TEMPLATES: "email-templates:read",

  // Data Operations
  EXPORT_DATA: "data:export",
} as const;
