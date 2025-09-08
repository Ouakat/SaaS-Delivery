export const API_CONFIG = {
  // Microservice endpoints
  services: {
    auth: {
      baseURL:
        process.env.NEXT_PUBLIC_AUTH_SERVICE_URL || "http://localhost:3001",
      timeout: 10000,
    },
    parcel: {
      baseURL:
        process.env.NEXT_PUBLIC_PARCEL_SERVICE_URL || "http://localhost:3002",
      timeout: 15000,
    },
    invoice: {
      baseURL:
        process.env.NEXT_PUBLIC_INVOICE_SERVICE_URL || "http://localhost:3003",
      timeout: 10000,
    },
    claim: {
      baseURL:
        process.env.NEXT_PUBLIC_CLAIM_SERVICE_URL || "http://localhost:3004",
      timeout: 10000,
    },
    notification: {
      baseURL:
        process.env.NEXT_PUBLIC_NOTIFICATION_SERVICE_URL ||
        "http://localhost:3005",
      timeout: 5000,
    },
  },

  // Global settings
  global: {
    defaultTimeout: 10000,
    retryAttempts: 3,
    retryDelay: 1000,
    maxConcurrentRequests: 10,
  },

  // Headers
  headers: {
    common: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    tenant: "X-Tenant-ID",
    authorization: "Authorization",
  },

  // Rate limiting
  rateLimits: {
    auth: {
      login: { requests: 10, window: 60000 }, // 10 requests per minute
      register: { requests: 5, window: 60000 },
      forgotPassword: { requests: 5, window: 3600000 }, // 5 per hour
    },
    api: {
      default: { requests: 100, window: 60000 }, // 100 requests per minute
      upload: { requests: 20, window: 60000 },
    },
  },

  // Error codes
  errorCodes: {
    NETWORK_ERROR: "NETWORK_ERROR",
    TIMEOUT_ERROR: "TIMEOUT_ERROR",
    AUTH_ERROR: "AUTH_ERROR",
    TENANT_ERROR: "TENANT_ERROR",
    VALIDATION_ERROR: "VALIDATION_ERROR",
    PERMISSION_ERROR: "PERMISSION_ERROR",
    RATE_LIMIT_ERROR: "RATE_LIMIT_ERROR",
    SERVER_ERROR: "SERVER_ERROR",
  },

  // Status codes
  statusCodes: {
    SUCCESS: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
  },
} as const;

export type ServiceName = keyof typeof API_CONFIG.services;
export type ErrorCode = keyof typeof API_CONFIG.errorCodes;
