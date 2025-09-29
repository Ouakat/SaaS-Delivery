export enum ShippingSlipStatus {
  PENDING = "PENDING",
  SHIPPED = "SHIPPED",
  RECEIVED = "RECEIVED",
  CANCELLED = "CANCELLED",
}

export interface ShippingSlip {
  id: string;
  tenantId: string;
  reference: string;
  destinationZoneId: string;
  status: ShippingSlipStatus;
  shippedAt?: Date;
  shippedBy?: string;
  receivedAt?: Date;
  receivedBy?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;

  // Relations
  destinationZone?: {
    id: string;
    name: string;
  };
  items: ShippingSlipItem[];
  _count?: {
    items: number;
    scannedItems: number;
    totalValue: number;
  };
}

export interface ShippingSlipItem {
  shippingSlipId: string;
  parcelId: string;
  scanned: boolean;
  scannedAt?: Date;
  scannedBy?: string;
  parcel?: {
    id: string;
    code: string;
    recipientName: string;
    recipientPhone: string;
    destinationCity: {
      id: string;
      name: string;
      ref: string;
    };
    price: number;
    parcelStatusCode: string;
  };
}

export interface CreateShippingSlipRequest {
  destinationZoneId: string;
  parcelIds?: string[];
}

export interface UpdateShippingSlipRequest {
  destinationZoneId?: string;
  status?: ShippingSlipStatus;
  parcelIds?: string[];
}

export interface ShippingSlipFilters {
  page?: number;
  limit?: number;
  search?: string;
  destinationZoneId?: string;
  status?: ShippingSlipStatus;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface ShippingSlipStats {
  total: number;
  pending: number;
  inTransit: number;
  completed: number;
  cancelled: number;
  packagesShippedThisMonth: number;
  averagePackagesPerSlip: number;
  topDestinationZones: Array<{
    zoneId: string;
    zoneName: string;
    count: number;
    percentage: number;
  }>;
}

export interface AddParcelsToShippingSlipRequest {
  parcelIds: string[];
}

export interface RemoveParcelsFromShippingSlipRequest {
  parcelIds: string[];
}

export interface AvailableParcel {
  id: string;
  code: string;
  recipientName: string;
  recipientPhone: string;
  price: number;
  parcelStatusCode: string;
  createdAt: Date;
  pickupCity: {
    id: string;
    name: string;
    ref: string;
  };
  destinationCity: {
    id: string;
    name: string;
    ref: string;
  };
}

export interface PaginatedShippingSlips {
  data: ShippingSlip[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
