export const API_CONFIG = {
  // Microservice endpoints
  services: {
    auth: {
      baseURL:
        process.env.NEXT_PUBLIC_AUTH_SERVICE_URL || "http://localhost:3001",
      timeout: 10000,
    },
    products: {
      baseURL:
        process.env.NEXT_PUBLIC_PRODUCTS_SERVICE_URL || "http://localhost:3007",
      timeout: 10000,
    },
    tenants: {
      baseURL:
        process.env.NEXT_PUBLIC_AUTH_SERVICE_URL || "http://localhost:3001",
      timeout: 10000,
    },
    users: {
      baseURL:
        process.env.NEXT_PUBLIC_AUTH_SERVICE_URL || "http://localhost:3001",
      timeout: 10000,
    },
    roles: {
      baseURL:
        process.env.NEXT_PUBLIC_AUTH_SERVICE_URL || "http://localhost:3001",
      timeout: 10000,
    },
    settings: {
      baseURL:
        process.env.NEXT_PUBLIC_SETTINGS_SERVICE_URL || "http://localhost:3002",
      timeout: 10000,
    },
    parcels: {
      baseURL:
        process.env.NEXT_PUBLIC_PARCELS_SERVICE_URL || "http://localhost:3003",
      timeout: 10000,
    },
    expeditions: {
      baseURL:
        process.env.NEXT_PUBLIC_EXPEDITIONS_SERVICE_URL || "http://localhost:3007",
      timeout: 10000,
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

  // Error codes - UPDATED to include missing codes
  errorCodes: {
    NETWORK_ERROR: "NETWORK_ERROR",
    TIMEOUT_ERROR: "TIMEOUT_ERROR",
    AUTH_ERROR: "AUTH_ERROR",
    TENANT_ERROR: "TENANT_ERROR",
    VALIDATION_ERROR: "VALIDATION_ERROR",
    PERMISSION_ERROR: "PERMISSION_ERROR",
    RATE_LIMIT_ERROR: "RATE_LIMIT_ERROR",
    SERVER_ERROR: "SERVER_ERROR",
    NOT_FOUND: "NOT_FOUND",
    CONFLICT: "CONFLICT",
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
