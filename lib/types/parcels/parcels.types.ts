export enum PaymentStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  INVOICED = "INVOICED",
}

export interface Parcel {
  id: string;
  tenantId: string;
  userId: string;
  code: string;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  alternativePhone?: string;
  pickupCityId: string;
  destinationCityId: string;
  trackingCode?: string;
  productName?: string;
  quantity?: number;
  price: number;
  comment?: string;
  cannotOpen: boolean;
  canReplace: boolean;
  isStock: boolean;
  parcelStatusId: string;
  parcelStatusCode: string;
  paymentStatus: PaymentStatus;
  deliveryPrice: number;
  returnPrice: number;
  refusalPrice: number;
  deliveryDelay: number;
  tariffId?: string;
  deliveryAttempts: number;
  lastAttemptDate?: string;
  deliveredAt?: string;
  deliveredBy?: string;
  returnedAt?: string;
  returnReason?: string;
  refusedAt?: string;
  refusalReason?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;

  // Relations
  pickupCity?: {
    id: string;
    name: string;
    ref: string;
  };
  destinationCity?: {
    id: string;
    name: string;
    ref: string;
  };
  parcelStatus?: {
    id: string;
    code: string;
    name: string;
    color: string;
  };
  tariff?: {
    id: string;
    deliveryPrice: number;
    returnPrice: number;
    refusalPrice: number;
    deliveryDelay: number;
  };
  statusHistory?: ParcelStatusHistory[];
}

export interface ParcelStatusHistory {
  id: string;
  parcelId: string;
  parcelStatusId: string;
  statusCode: string;
  comment?: string;
  changedBy?: string;
  changedAt: string;
  parcelStatus?: {
    code: string;
    name: string;
    color: string;
  };
}

export interface CreateParcelRequest {
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  alternativePhone?: string;
  pickupCityId: string;
  destinationCityId: string;
  trackingCode?: string;
  productName?: string;
  quantity?: number;
  price: number;
  comment?: string;
  cannotOpen?: boolean;
  canReplace?: boolean;
  isStock?: boolean;
}

export interface UpdateParcelRequest {
  recipientName?: string;
  recipientPhone?: string;
  recipientAddress?: string;
  alternativePhone?: string;
  destinationCityId?: string;
  trackingCode?: string;
  productName?: string;
  quantity?: number;
  price?: number;
  comment?: string;
  cannotOpen?: boolean;
  canReplace?: boolean;
  isStock?: boolean;
}

export interface ParcelFilters {
  page?: number;
  limit?: number;
  search?: string;
  statusCode?: string;
  paymentStatus?: PaymentStatus;
  pickupCityId?: string;
  destinationCityId?: string;
  customerPhone?: string;
  startDate?: string;
  endDate?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  sortParcel?: "asc" | "desc";
  userId?: string; // For filtering user-specific parcels
}

export interface ParcelStatistics {
  totalParcels: number;
  parcelsByStatus: Record<string, number>;
  parcelsByPaymentStatus: Record<string, number>;
  totalRevenue: number;
  averageParcelValue: number;
  deliverySuccessRate: number;
  averageDeliveryTime: number;
  topDestinationCities: Array<{
    cityName: string;
    parcelCount: number;
    percentage: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    parcels: number;
    revenue: number;
  }>;
}

export interface ChangeParcelStatusRequest {
  statusCode: string;
  comment?: string;
}

export interface BulkParcelActionRequest {
  parcelIds: string[];
  action: string;
  comment?: string;
}

export interface BulkActionResult {
  success: number;
  failed: number;
  errors: string[];
}

export interface ParcelTrackingInfo {
  code: string;
  status: string;
  statusName: string;
  statusColor: string;
  recipientName: string;
  destinationCity: string;
  deliveredAt?: string;
  deliveryDelay: number;
  history: Array<{
    statusCode: string;
    statusName: string;
    changedAt: string;
    comment?: string;
  }>;
}

// Pagination response type
export interface PaginatedParcelsResponse {
  data: Parcel[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Common status configurations
export const PARCEL_STATUS_COLORS: Record<string, string> = {
  NEW_PACKAGE: "#3B82F6", // Blue
  RECEIVED: "#10B981", // Emerald
  COLLECTED: "#8B5CF6", // Purple
  DISPATCHED: "#F59E0B", // Amber
  PUT_IN_DISTRIBUTION: "#06B6D4", // Cyan
  OUT_FOR_DELIVERY: "#F97316", // Orange
  DELIVERED: "#22C55E", // Green
  RETURNED: "#EF4444", // Red
  REFUSED: "#DC2626", // Red-600
  CANCELLED: "#6B7280", // Gray
};

export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  [PaymentStatus.PENDING]: "#F59E0B", // Amber
  [PaymentStatus.PAID]: "#22C55E", // Green
  [PaymentStatus.INVOICED]: "#3B82F6", // Blue
};

export const PARCEL_STATUS_LABELS: Record<string, string> = {
  NEW_PACKAGE: "Nouveau Colis",
  RECEIVED: "Reçu",
  COLLECTED: "Ramassé",
  DISPATCHED: "Expédié",
  PUT_IN_DISTRIBUTION: "Mis en distribution",
  OUT_FOR_DELIVERY: "En cours de livraison",
  DELIVERED: "Livré",
  RETURNED: "Retourné",
  REFUSED: "Refusé",
  CANCELLED: "Annulé",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  [PaymentStatus.PENDING]: "En attente",
  [PaymentStatus.PAID]: "Payé",
  [PaymentStatus.INVOICED]: "Facturé",
};
