// /lib/constants/payments.ts
export const PAYMENTS_PERMISSIONS = {
    // Factures Management
    FACTURES_READ: "payments:read",
    FACTURES_CREATE: "payments:create",
    FACTURES_UPDATE: "payments:update",
    FACTURES_DELETE: "payments:delete",
    FACTURES_MANAGE: "payments:manage",
    FACTURES_EXPORT: "payments:export",
    FACTURES_SEND: "payments:send",
    FACTURES_CANCEL: "payments:cancel",
    FACTURES_VALIDATE: "payments:validate",
    FACTURES_PAY: "payments:pay",
    
    // Payments Management
    PAYMENTS_READ: "payments:read",
    PAYMENTS_CREATE: "payments:create",
    PAYMENTS_UPDATE: "payments:update",
    PAYMENTS_DELETE: "payments:delete",
    PAYMENTS_MANAGE: "payments:manage",
    PAYMENTS_VALIDATE: "payments:validate",
    PAYMENTS_EXPORT: "payments:export",
    
    // Reports
    PAYMENTS_REPORTS: "payments:reports",
    PAYMENTS_ANALYTICS: "payments:analytics",
    
    // Bulk Operations
    FACTURES_BULK_OPERATIONS: "payments:bulk_operations",
    PAYMENTS_BULK_OPERATIONS: "payments:bulk_operations",
  } as const;