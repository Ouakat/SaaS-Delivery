export interface Product {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  basePrice: number;
  hasVariants: boolean;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  variants?: ProductVariant[];
  stocks?: Stock[];
}

export interface ProductVariant {
  id: string;
  productId: string;
  tenantId: string;
  sku: string;
  name: string;
  additionalPrice: number;
  attributes: Record<string, any>; // e.g., { "color": "red", "size": "XL" }
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  product?: Product;
  stocks?: Stock[];
}

export interface Warehouse {
  id: string;
  tenantId: string;
  name: string;
  location?: string;
  createdAt: Date;
  updatedAt: Date;
  stocks?: Stock[];
}

export interface Stock {
  id: string;
  tenantId: string;
  warehouseId: string;
  productId?: string;
  variantId?: string;
  quantity: number;        // Good/sellable items
  reserved: number;        // Reserved from good items
  defective: number;       // Defective items count
  updatedAt: Date;
  warehouse?: Warehouse;
  product?: Product;
  variant?: ProductVariant;
  history?: StockHistory[];
}

export interface StockHistory {
  id: string;
  stockId: string;
  change: number;
  previousQuantity: number;
  newQuantity: number;
  reason: 'INBOUND' | 'OUTBOUND' | 'ADJUSTMENT' | 'RESERVATION' | 'CANCEL_RESERVATION';
  reference?: string;
  createdAt: Date;
}

// API Request/Response types
export interface ProductListParams {
  skip?: number;
  take?: number;
  includeVariants?: boolean;
  where?: object;
  includeStocks?: boolean;
  search?: string;
  includeRelations?: boolean;
}

export interface CreateProductRequest {
  name: string;
  description?: string;
  basePrice: number;
  hasVariants?: boolean;
  imageUrl?: string;
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  basePrice?: number;
  hasVariants?: boolean;
  imageUrl?: string;
}

export interface ProductFilters {
  hasVariants?: boolean;
  priceMin?: number;
  priceMax?: number;
  stockStatus?: 'in_stock' | 'low_stock' | 'out_of_stock';
  search?: string;
}

export interface ProductSortOptions {
  field: 'name' | 'basePrice' | 'createdAt' | 'updatedAt';
  direction: 'asc' | 'desc';
}

// UI State types
export interface ProductPageState {
  products: Product[];
  loading: boolean;
  error: string | null;
  filters: ProductFilters;
  sort: ProductSortOptions;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ProductCardProps {
  product: Product;
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
  onView?: (product: Product) => void;
  showActions?: boolean;
}

export interface ProductListProps {
  products: Product[];
  loading?: boolean;
  onProductSelect?: (product: Product) => void;
  onProductEdit?: (product: Product) => void;
  onProductDelete?: (product: Product) => void;
  showFilters?: boolean;
  showPagination?: boolean;
}
