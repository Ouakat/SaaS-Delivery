export enum DeliverySlipStatus {
  PENDING = "PENDING",
  RECEIVED = "RECEIVED",
  CANCELLED = "CANCELLED",
}

export interface DeliverySlip {
  id: string;
  tenantId: string;
  userId: string;
  reference: string;
  cityId?: string;
  status: DeliverySlipStatus;
  receivedAt?: Date;
  receivedBy?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;

  // Relations
  city?: {
    id: string;
    name: string;
    ref: string;
  };
  creator?: {
    id: string;
    name: string;
    email: string;
  };
  items: DeliverySlipItem[];
  summary: {
    totalParcels: number;
    scannedParcels: number;
    unscannedParcels: number;
    totalValue: number;
  };
}

export interface DeliverySlipItem {
  deliverySlipId: string;
  parcelId: string;
  scanned: boolean;
  scannedAt?: Date;
  scannedBy?: string;
  parcel: {
    id: string;
    code: string;
    recipientName: string;
    recipientPhone: string;
    destinationCity: string;
    price: number;
    statusCode: string;
    statusName: string;
  };
}

export interface CreateDeliverySlipRequest {
  cityId?: string;
  parcelIds?: string[];
  notes?: string;
  autoReceive?: boolean;
}

export interface UpdateDeliverySlipRequest {
  cityId?: string;
  notes?: string;
  status?: DeliverySlipStatus;
}

export interface DeliverySlipFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: DeliverySlipStatus;
  cityId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortParcel?: "asc" | "desc";
}

export interface AddParcelsToSlipRequest {
  parcelIds: string[];
  comment?: string;
  markAsScanned?: boolean;
}

export interface RemoveParcelsFromSlipRequest {
  parcelIds: string[];
  reason?: string;
}

export interface ReceiveSlipRequest {
  notes?: string;
  parcelIds?: string[];
  forceReceive?: boolean;
}

export interface DeliverySlipStats {
  totalSlips: number;
  pendingSlips: number;
  receivedSlips: number;
  cancelledSlips: number;
  totalParcelsInSlips: number;
  totalValueInSlips: number;
  averageParcelsPerSlip: number;
  recentActivity: Array<{
    date: string;
    slipsCreated: number;
    slipsReceived: number;
  }>;
  topCities: Array<{
    cityName: string;
    slipCount: number;
    parcelCount: number;
  }>;
}

export interface BulkSlipActionRequest {
  slipIds: string[];
  action: string;
  comment?: string;
}

export interface AvailableParcel {
  id: string;
  code: string;
  recipientName: string;
  recipientPhone: string;
  price: number;
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

export interface PaginatedDeliverySlips {
  data: DeliverySlip[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
