import { Warehouse, Stock } from './product.types';

// API Request/Response types
export interface WarehouseListParams {
  skip?: number;
  take?: number;
  includeStocks?: boolean;
  search?: string;
  includeRelations?: boolean;
}

export interface CreateWarehouseRequest {
  name: string;
  tenantId: string;
  location?: string;
}

export interface UpdateWarehouseRequest {
  name?: string;
  location?: string;
}

export interface WarehouseFilters {
  search?: string;
  hasStocks?: boolean;
  stockStatus?: 'high_stock' | 'low_stock' | 'no_stock';
}

export interface WarehouseSortOptions {
  field: 'name' | 'location' | 'createdAt' | 'updatedAt';
  direction: 'asc' | 'desc';
}

// UI State types
export interface WarehousePageState {
  warehouses: Warehouse[];
  loading: boolean;
  error: string | null;
  filters: WarehouseFilters;
  sort: WarehouseSortOptions;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface WarehouseCardProps {
  warehouse: Warehouse;
  onEdit?: (warehouse: Warehouse) => void;
  onDelete?: (warehouse: Warehouse) => void;
  onView?: (warehouse: Warehouse) => void;
  showActions?: boolean;
}

export interface WarehouseListProps {
  warehouses: Warehouse[];
  loading?: boolean;
  onWarehouseSelect?: (warehouse: Warehouse) => void;
  onWarehouseEdit?: (warehouse: Warehouse) => void;
  onWarehouseDelete?: (warehouse: Warehouse) => void;
  showFilters?: boolean;
  showPagination?: boolean;
}

// Extended warehouse with computed properties
export interface WarehouseWithStats extends Warehouse {
  "warehouse": {
    "id": string;
    "tenantId": string;
    "name": string;
    "location": string;
    "createdAt": string;
    "updatedAt": string;
},
"stats": {
    "totalStockItems": number;
    "totalQuantity": number;
    "totalReserved": number;
    "availableQuantity": number;
    "uniqueProducts": number;
    "uniqueVariants": number;
    "lowStockItemsCount": number;
    "outOfStockItemsCount": number;
    "lowStockItems": [];
    "outOfStockItems": []
}
}

// Warehouse stock management types
export interface WarehouseStockSummary {
  warehouse: {
    id: string;
    tenantId: string;
    name: string;
    location: string;
    createdAt: string;
    updatedAt: string;
    stocks?: Stock[];
  };
  summary: {
    _sum: {
      quantity: number;
      reserved: number;
    };
    _count: {
      id: number;
    };
    warehouseId: string;
  };
}

export interface StockMovementRequest {
  warehouseId: string;
  productId?: string;
  variantId?: string;
  quantity: number;
  reason: 'INBOUND' | 'OUTBOUND' | 'ADJUSTMENT' | 'TRANSFER';
  reference?: string;
  notes?: string;
}

export interface StockTransferRequest {
  fromWarehouseId: string;
  toWarehouseId: string;
  productId?: string;
  variantId?: string;
  quantity: number;
  reference?: string;
  notes?: string;
}

// Form validation schemas (for use with react-hook-form and zod)
export interface WarehouseFormData {
  name: string;
  location?: string;
}

export interface StockMovementFormData {
  productId?: string;
  variantId?: string;
  quantity: number;
  reason: 'INBOUND' | 'OUTBOUND' | 'ADJUSTMENT' | 'TRANSFER';
  reference?: string;
  notes?: string;
}

export interface StockTransferFormData {
  toWarehouseId: string;
  productId?: string;
  variantId?: string;
  quantity: number;
  reference?: string;
  notes?: string;
}
