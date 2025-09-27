// ========================================
// ENUMS (matching your Prisma schema)
// ========================================

export enum UserType {
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  SUPPORT = "SUPPORT",
  SELLER = "SELLER",
  LIVREUR = "LIVREUR",
  CUSTOMER = "CUSTOMER",
  BUYER = "BUYER",
  VENDOR = "VENDOR",
  WAREHOUSE = "WAREHOUSE",
  DISPATCHER = "DISPATCHER",
}

export enum ParcelStatus {
  NEW = "NEW",
  ASSIGNED = "ASSIGNED",
  PICKUP_SCHEDULED = "PICKUP_SCHEDULED",
  PICKED_UP = "PICKED_UP",
  IN_TRANSIT = "IN_TRANSIT",
  OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY",
  DELIVERED = "DELIVERED",
  FAILED_DELIVERY = "FAILED_DELIVERY",
  RETURNED = "RETURNED",
  CANCELLED = "CANCELLED",
}

export enum InvoiceStatus {
  DRAFT = "DRAFT",
  PENDING = "PENDING",
  SENT = "SENT",
  PAID = "PAID",
  OVERDUE = "OVERDUE",
  CANCELLED = "CANCELLED",
}

export enum ClaimType {
  DAMAGED = "DAMAGED",
  LOST = "LOST",
  DELAYED = "DELAYED",
  WRONG_ADDRESS = "WRONG_ADDRESS",
  CUSTOMER_COMPLAINT = "CUSTOMER_COMPLAINT",
  OTHER = "OTHER",
}

export enum ClaimStatus {
  OPEN = "OPEN",
  IN_PROGRESS = "IN_PROGRESS",
  RESOLVED = "RESOLVED",
  REJECTED = "REJECTED",
  ESCALATED = "ESCALATED",
}

export enum ClaimPriority {
  LOW = "LOW",
  NORMAL = "NORMAL",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

export enum NotificationType {
  PARCEL_STATUS = "PARCEL_STATUS",
  INVOICE_DUE = "INVOICE_DUE",
  CLAIM_CREATED = "CLAIM_CREATED",
  SYSTEM_ALERT = "SYSTEM_ALERT",
  ASSIGNMENT = "ASSIGNMENT",
  PAYMENT_RECEIVED = "PAYMENT_RECEIVED",
  USER_ACTION = "USER_ACTION",
}

// ========================================
// CORE ENTITIES
// ========================================

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  logo?: string;
  settings: Json;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  password: string;
  name?: string;
  roleId: string;
  userType: UserType;
  avatar?: string;
  isActive: boolean;
  tenantId: string;
  profile: Json;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  tenant: Tenant;
  role: Role;
  sentParcels?: Parcel[];
  assignedParcels?: Parcel[];
  notifications?: Notification[];
  auditLogs?: AuditLog[];
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  userTypes: UserType[];
  tenantId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  tenant: Tenant;
  users?: User[];
}

export interface Parcel {
  id: string;
  trackingNumber: string;
  status: ParcelStatus;
  senderInfo: Json;
  recipientInfo: Json;
  dimensions: Json;
  weight: number;
  value: number;
  description?: string;
  pickupAddress: Json;
  deliveryAddress: Json;
  notes?: string;
  senderId?: string;
  agentId?: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
  deliveredAt?: Date;
  estimatedCost?: number;
  actualCost?: number;

  // Relations
  tenant: Tenant;
  senderUser?: User;
  agent?: User;
  claims?: Claim[];
  trackingEvents?: TrackingEvent[];
}

export interface TrackingEvent {
  id: string;
  parcelId: string;
  status: ParcelStatus;
  location?: string;
  description?: string;
  timestamp: Date;
  createdBy?: string;
  metadata?: Json;

  // Relations
  parcel: Parcel;
}

export interface Rate {
  id: string;
  name: string;
  description?: string;
  basePrice: number;
  weightRate: number;
  distanceRate: number;
  zoneFrom: string;
  zoneTo: string;
  userTypes: UserType[];
  tenantId: string;
  isActive: boolean;
  validFrom?: Date;
  validTo?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  tenant: Tenant;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  parcels: string[];
  amount: number;
  currency: string;
  status: InvoiceStatus;
  dueDate: Date;
  payerId?: string;
  tenantId: string;
  paidAmount?: number;
  paymentMethod?: string;
  createdAt: Date;
  updatedAt: Date;
  paidAt?: Date;

  // Relations
  tenant: Tenant;
}

export interface Claim {
  id: string;
  type: ClaimType;
  description: string;
  status: ClaimStatus;
  priority: ClaimPriority;
  resolution?: string;
  parcelId: string;
  filedBy?: string;
  assignedTo?: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;

  // Relations
  tenant: Tenant;
  parcel: Parcel;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  userId?: string;
  userTypes: UserType[];
  tenantId: string;
  isRead: boolean;
  data?: Json;
  expiresAt?: Date;
  createdAt: Date;

  // Relations
  tenant: Tenant;
  user?: User;
}

export interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValues?: Json;
  newValues?: Json;
  userId?: string;
  userType?: UserType;
  tenantId: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  timestamp: Date;

  // Relations
  tenant: Tenant;
  user?: User;
}

// ========================================
// UTILITY TYPES
// ========================================

export type Json =
  | string
  | number
  | boolean
  | Json[]
  | { [key: string]: Json }
  | null;

// API Request/Response types
export interface CreateUserRequest {
  email: string;
  password: string;
  name?: string;
  userType: UserType;
  roleId: string;
  profile?: Json;
}

export interface UpdateUserRequest {
  name?: string;
  roleId?: string;
  profile?: Json;
  isActive?: boolean;
}

export interface CreateParcelRequest {
  senderInfo: Json;
  recipientInfo: Json;
  dimensions: Json;
  weight: number;
  value: number;
  description?: string;
  pickupAddress: Json;
  deliveryAddress: Json;
  notes?: string;
}

export interface UpdateParcelStatusRequest {
  status: ParcelStatus;
  location?: string;
  description?: string;
}

export interface CreateClaimRequest {
  type: ClaimType;
  description: string;
  priority: ClaimPriority;
  parcelId: string;
}

// Pagination types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortParcel?: "asc" | "desc";
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Filter types
export interface ParcelFilters extends PaginationParams {
  status?: ParcelStatus;
  senderId?: string;
  agentId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface InvoiceFilters extends PaginationParams {
  status?: InvoiceStatus;
  payerId?: string;
  dueFrom?: string;
  dueTo?: string;
}

export interface ClaimFilters extends PaginationParams {
  status?: ClaimStatus;
  type?: ClaimType;
  priority?: ClaimPriority;
  assignedTo?: string;
}

export interface UserFilters extends PaginationParams {
  userType?: UserType;
  roleId?: string;
  isActive?: boolean;
  search?: string;
}
