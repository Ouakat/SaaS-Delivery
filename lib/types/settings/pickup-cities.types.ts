export interface PickupCity {
  id: string;
  tenantId: string;
  ref: string;
  name: string;
  status: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: string | null;
  updatedBy?: string | null;
  _count?: {
    tariffs: number;
  };
}

export interface CreatePickupCityRequest {
  ref: string;
  name: string;
  status?: boolean;
}

export interface UpdatePickupCityRequest {
  ref?: string;
  name?: string;
  status?: boolean;
}

export interface PickupCityFilters {
  page?: number;
  limit?: number;
  search?: string;
  ref?: string;
  status?: boolean;
  sortBy?: "name" | "ref" | "status" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface PickupCityStatistics {
  total: number;
  active: number;
  inactive: number;
  withTariffs: number;
  withoutTariffs: number;
}

export interface BulkOperationResult {
  successful: number;
  failed: string[];
  errors?: Array<{
    id: string;
    error: string;
  }>;
}

export interface ExportResult {
  downloadUrl: string;
  filename: string;
}
