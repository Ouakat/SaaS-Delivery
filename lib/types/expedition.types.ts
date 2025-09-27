export type ExpeditionStatus =
  | "expedited"
  | "prepared"
  | "pointed"
  | "received"
  | "cancelled";

export type TransportMode =
  | "air"
  | "sea"
  | "road"
  | "rail"
  | "courier";

export type DiscrepancyType =
  | "quantity_short"
  | "quantity_over"
  | "damaged"
  | "wrong_item"
  | "missing_item";

export type SeverityLevel =
  | "low"
  | "medium"
  | "high"
  | "critical";

export interface ExpeditionItem {
  id: string;
  expeditionId: string;
  productId: string;
  variantId?: string;
  productName?: string;
  variantName?: string;
  quantity_sent: number;
  quantity_received: number;
  quantity_defective: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  product?: {
    id: string;
    name: string;
    sku?: string;
    hasVariants: boolean;
  };
  variant?: {
    id: string;
    name: string;
    sku: string;
    attributes: Record<string, any>;
  };
}

export interface Expedition {
  id: string;
  userId: string;
  tenantId: string;
  warehouseId: string;
  sellerId: string;
  sellerSnapshot: any; // JSON snapshot of seller details at creation time
  status: ExpeditionStatus;
  arrivalDate: string;
  transportMode: TransportMode;
  trackingNumber?: string;
  numberOfPackages: number;
  weight?: number;
  items?: ExpeditionItem[];
  receivedBy?: string;
  receivedAt?: string;
  generalNotes?: string;
  createdAt: string;
  updatedAt: string;
  warehouse?: {
    id: string;
    name: string;
    location?: string;
  };
  seller?: {
    id: string;
    name: string;
    email?: string;
  };
}

export interface CreateExpeditionDto {
  warehouseId: string;
  sellerId: string;
  sellerSnapshot: any; // JSON snapshot of seller details at creation time
  arrivalDate: string;
  transportMode: TransportMode;
  trackingNumber?: string;
  numberOfPackages: number;
  weight?: number;
  generalNotes?: string;
  items?: {
    productId: string;
    productName?: string;
    variantName?: string;
    variantId?: string;
    quantity_sent: number;
    batchNumber?: string;
  }[];
}

export interface UpdateExpeditionDto {
  warehouseId?: string;
  sellerId?: string;
  sellerSnapshot?: any; // JSON snapshot of seller details
  arrivalDate?: string;
  transportMode?: TransportMode;
  trackingNumber?: string;
  numberOfPackages?: number;
  weight?: number;
  status?: ExpeditionStatus;
  generalNotes?: string;
}

export interface BulkStatusUpdateDto {
  expeditionIds: string[];
  status: ExpeditionStatus;
  comment?: string;
}

export interface BulkStatusUpdateResponse {
  success: boolean;
  updated: number;
  failed: {
    expeditionId: string;
    reason: string;
  }[];
  data: Expedition[];
}

export interface ReceiveExpeditionDto {
  items: ReceiveExpeditionItem[];
  receivedBy: string;
  receivedAt?: string;  // ISO timestamp
  generalNotes?: string;
}

export interface ReceiveExpeditionItem {
  itemId: string;              // ExpeditionItem ID
  quantity_received: number;    // Good items count
  quantity_defective: number;   // Defective items count
  notes?: string;
  photoUrls?: string[];
}

export interface ReceiveExpeditionResponse {
  success: boolean;
  expedition: Expedition;
  stockUpdates: StockUpdate[];
  discrepancies: Discrepancy[];
}

export interface StockUpdate {
  productId: string;
  variantId?: string;
  warehouseId: string;
  previousQuantity: number;     // Previous good items
  newQuantity: number;          // New good items
  previousDefective: number;    // Previous defective count
  newDefective: number;         // New defective count
}

export interface Discrepancy {
  itemId: string;
  expectedQuantity: number;     // quantity_sent
  actualQuantity: number;       // quantity_received + quantity_defective
  difference: number;
}

export interface ExpeditionAnalyticsQuery {
  startDate: string;
  endDate: string;
  warehouseId?: string;
  sellerId?: string;
}

export interface ExpeditionAnalyticsResponse {
  statusDistribution: {
    expedited: number;
    prepared: number;
    pointed: number;
    received: number;
    cancelled: number;
  };
  arrivalTrends: {
    date: string;
    count: number;
    onTime: number;
    delayed: number;
  }[];
  defectMetrics: {
    totalItems: number;
    defectiveItems: number;
    defectRate: number;
    topDefectiveProducts: {
      productId: string;
      productName: string;
      defectCount: number;
    }[];
  };
  warehouseUtilization: {
    warehouseId: string;
    warehouseName: string;
    expeditionCount: number;
    totalPackages: number;
    totalWeight: number;
  }[];
  sellerPerformance: {
    sellerId: string;
    expeditionCount: number;
    onTimeRate: number;
    defectRate: number;
    avgProcessingTime: number;
  }[];
}

export interface ExportExpeditionsQuery {
  format: "excel" | "csv" | "pdf";
  startDate?: string;
  endDate?: string;
  status?: ExpeditionStatus;
  warehouseId?: string;
  sellerId?: string;
}

export interface ExportExpeditionsResponse {
  fileUrl: string;
  fileName: string;
  expiresAt: string;
}

export interface SearchExpeditionsDto {
  trackingNumber?: string;
  sellerIds?: string[];
  warehouseIds?: string[];
  statuses?: ExpeditionStatus[];
  transportModes?: TransportMode[];
  dateRange?: {
    start: string;
    end: string;
  };
  hasDiscrepancies?: boolean;
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface SearchExpeditionsResponse {
  expeditions: Expedition[];
  total: number;
  page: number;
  totalPages: number;
  facets: {
    statuses: { value: string; count: number }[];
    warehouses: { value: string; count: number }[];
    transportModes: { value: string; count: number }[];
  };
}

export interface UpdateExpeditionItemDto {
  quantity_sent?: number;
  quantity_received?: number;
  quantity_defective?: number;
  notes?: string;
  batchNumber?: string;
}

export interface AddExpeditionItemsDto {
  items: {
    productId: string;
    variantId?: string;
    quantity_sent: number;
    batchNumber?: string;
  }[];
}

export interface AddExpeditionItemsResponse {
  success: boolean;
  addedItems: ExpeditionItem[];
  expedition: Expedition;
}

export interface ReportDiscrepancyDto {
  itemId: string;
  type: DiscrepancyType;
  expectedQuantity: number;
  actualQuantity: number;
  reason: string;
  photoUrls?: string[];
  severity: SeverityLevel;
}

export interface ReportDiscrepancyResponse {
  success: boolean;
  discrepancyId: string;
  notificationsSent: string[];
  expedition: Expedition;
}

export interface ExpeditionHistory {
  id: string;
  expeditionId: string;
  action: string;
  fromStatus?: ExpeditionStatus;
  toStatus?: ExpeditionStatus;
  changedBy: string;
  changedByName: string;
  changedAt: string;
  comment?: string;
  details?: any;
}

export interface GenerateDocumentQuery {
  format: "pdf" | "html";
  includeItems: boolean;
  includeSignature: boolean;
}

export interface GenerateDocumentResponse {
  documentUrl: string;
  documentId: string;
  generatedAt: string;
  expiresAt: string;
}

export interface ImportExpeditionsDto {
  file: File;
  mappingRules?: {
    trackingNumber: string;
    sellerId: string;
    warehouseId: string;
    arrivalDate: string;
    [key: string]: string;
  };
  validateOnly?: boolean;
}

export interface ImportExpeditionsResponse {
  success: boolean;
  imported: number;
  failed: number;
  errors: {
    row: number;
    field: string;
    value: string;
    error: string;
  }[];
  validationReport?: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
    warnings: string[];
  };
}

export interface CloneExpeditionDto {
  includeItems: boolean;
  newArrivalDate?: string;
  newWarehouseId?: string;
}

export interface CloneExpeditionResponse {
  success: boolean;
  newExpedition: Expedition;
  message: string;
}

export interface WarehouseExpeditionsQuery {
  status?: ExpeditionStatus;
  page: number;
  limit: number;
}

export interface WarehouseExpeditionsResponse {
  expeditions: Expedition[];
  total: number;
  warehouseCapacity: {
    total: number;
    used: number;
    available: number;
  };
}

export interface SellerExpeditionsQuery {
  status?: ExpeditionStatus;
  startDate?: string;
  endDate?: string;
  page: number;
  limit: number;
}

export interface SellerExpeditionsResponse {
  expeditions: Expedition[];
  total: number;
  sellerStats: {
    totalExpeditions: number;
    averagePackages: number;
    defectRate: number;
  };
}

export interface ValidateExpeditionResponse {
  valid: boolean;
  errors: {
    field: string;
    message: string;
  }[];
  warnings: {
    field: string;
    message: string;
  }[];
  suggestions: {
    field: string;
    suggestedValue: any;
    reason: string;
  }[];
}

export interface DashboardStatistics {
  todayArrivals: number;
  weekArrivals: number;
  pendingReception: number;
  totalActive: number;
  recentExpeditions: Expedition[];
  alerts: {
    type: "overdue" | "discrepancy" | "capacity";
    message: string;
    expeditionId?: string;
    severity: "low" | "medium" | "high";
  }[];
  quickStats: {
    avgProcessingTime: number;
    defectRateTrend: number;
    onTimeDeliveryRate: number;
  };
}

export interface UpdateMultipleItemsDto {
  updates: {
    itemId: string;
    quantity_received?: number;
    quantity_defective?: number;
    notes?: string;
  }[];
}

export interface UpdateMultipleItemsResponse {
  success: boolean;
  updatedItems: ExpeditionItem[];
  expedition: Expedition;
}

export interface CancelExpeditionDto {
  reason: string;
  notifyParties: boolean;
}

export interface CancelExpeditionResponse {
  success: boolean;
  expedition: Expedition;
  notificationsSent: string[];
}

export interface AvailableProductsQuery {
  search?: string;
  warehouseId: string;
  includeVariants: boolean;
}

export interface AvailableProduct {
  id: string;
  name: string;
  sku?: string;
  hasVariants: boolean;
  variants?: {
    id: string;
    name: string;
    sku: string;
    attributes: any;
  }[];
  currentStock?: number;
}

export interface AvailableProductsResponse {
  products: AvailableProduct[];
}

export interface ExpeditionFilters {
  status?: ExpeditionStatus;
  warehouseId?: string;
  sellerId?: string;
  transportMode?: TransportMode;
  dateRange?: {
    start: Date;
    end: Date;
  };
  arrivalDateRange?: {
    start: Date;
    end: Date;
  };
  search?: string;
}

export const STATUS_COLORS: Record<ExpeditionStatus, string> = {
  expedited: "blue",
  prepared: "yellow",
  pointed: "orange",
  received: "green",
  cancelled: "red",
};

export const TRANSPORT_MODE_LABELS: Record<TransportMode, string> = {
  air: "Air Freight",
  sea: "Sea Freight",
  road: "Road Transport",
  rail: "Rail Transport",
  courier: "Courier Service",
};

export const SEVERITY_COLORS: Record<SeverityLevel, string> = {
  low: "gray",
  medium: "yellow",
  high: "orange",
  critical: "red",
};