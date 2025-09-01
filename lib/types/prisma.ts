// prisma
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  tenantId: string;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserRole {
  id: string;
  name: UserRoleName;
  description: string;
  permissions: string[];
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export type UserRoleName = "admin" | "merchant" | "delivery_agent";

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  primaryColor: string;
  settings: TenantSettings;
  isActive: boolean;
  createdAt: string;
}

export interface TenantSettings {
  currency: string;
  timezone: string;
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  features: {
    realTimeTracking: boolean;
    autoInvoicing: boolean;
    customBranding: boolean;
  };
}















export interface Parcel {
  id: string;
  trackingNumber: string;
  tenantId: string;
  merchantId: string;
  deliveryAgentId?: string;
  status: ParcelStatus;
  sender: ContactInfo;
  recipient: ContactInfo;
  dimensions: ParcelDimensions;
  weight: number;
  value: number;
  description: string;
  pickupAddress: Address;
  deliveryAddress: Address;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  deliveredAt?: string;
}

export type ParcelStatus =
  | "new"
  | "pickup_scheduled"
  | "picked_up"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "failed_delivery"
  | "returned";

export interface ContactInfo {
  name: string;
  phone: string;
  email?: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface ParcelDimensions {
  length: number;
  width: number;
  height: number;
  unit: "cm" | "inch";
}

export interface Merchant {
  id: string;
  tenantId: string;
  businessName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: Address;
  isActive: boolean;
  createdAt: string;
}

export interface DeliveryAgent {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  phone: string;
  vehicleType: string;
  licenseNumber?: string;
  isOnline: boolean;
  currentLocation?: {
    lat: number;
    lng: number;
    timestamp: string;
  };
  rating: number;
  completedDeliveries: number;
  createdAt: string;
}

export interface Invoice {
  id: string;
  tenantId: string;
  merchantId: string;
  invoiceNumber: string;
  parcels: string[];
  amount: number;
  currency: string;
  status: InvoiceStatus;
  dueDate: string;
  createdAt: string;
  paidAt?: string;
}

export type InvoiceStatus = "pending" | "paid" | "overdue" | "cancelled";

export interface Claim {
  id: string;
  tenantId: string;
  parcelId: string;
  merchantId: string;
  type: ClaimType;
  description: string;
  status: ClaimStatus;
  resolution?: string;
  createdAt: string;
  resolvedAt?: string;
}

export type ClaimType = "damaged" | "lost" | "delayed" | "other";
export type ClaimStatus = "open" | "in_progress" | "resolved" | "rejected";
