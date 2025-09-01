export const PARCEL_STATUSES = [
  { value: "new", label: "New" },
  { value: "pickup_scheduled", label: "Pickup Scheduled" },
  { value: "picked_up", label: "Picked Up" },
  { value: "in_transit", label: "In Transit" },
  { value: "out_for_delivery", label: "Out for Delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "failed_delivery", label: "Failed Delivery" },
  { value: "returned", label: "Returned" },
] as const;

export const USER_ROLES = [
  { value: "admin", label: "Administrator" },
  { value: "merchant", label: "Merchant" },
  { value: "delivery_agent", label: "Delivery Agent" },
] as const;

export const CLAIM_TYPES = [
  { value: "damaged", label: "Damaged Package" },
  { value: "lost", label: "Lost Package" },
  { value: "delayed", label: "Delayed Delivery" },
  { value: "other", label: "Other" },
] as const;

export const CLAIM_STATUSES = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "rejected", label: "Rejected" },
] as const;

export const INVOICE_STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "overdue", label: "Overdue" },
  { value: "cancelled", label: "Cancelled" },
] as const;

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    LOGOUT: "/auth/logout",
    REGISTER: "/auth/register",
    REFRESH: "/auth/refresh",
    PROFILE: "/auth/profile",
  },
  PARCELS: {
    LIST: "/parcels",
    CREATE: "/parcels",
    UPDATE: (id: string) => `/parcels/${id}`,
    DELETE: (id: string) => `/parcels/${id}`,
    TRACK: (trackingNumber: string) => `/parcels/track/${trackingNumber}`,
  },
  MERCHANTS: {
    LIST: "/merchants",
    CREATE: "/merchants",
    UPDATE: (id: string) => `/merchants/${id}`,
    DELETE: (id: string) => `/merchants/${id}`,
  },
  AGENTS: {
    LIST: "/delivery-agents",
    CREATE: "/delivery-agents",
    UPDATE: (id: string) => `/delivery-agents/${id}`,
    DELETE: (id: string) => `/delivery-agents/${id}`,
  },
  INVOICES: {
    LIST: "/invoices",
    CREATE: "/invoices",
    UPDATE: (id: string) => `/invoices/${id}`,
    DELETE: (id: string) => `/invoices/${id}`,
  },
  CLAIMS: {
    LIST: "/claims",
    CREATE: "/claims",
    UPDATE: (id: string) => `/claims/${id}`,
    DELETE: (id: string) => `/claims/${id}`,
  },
} as const;
