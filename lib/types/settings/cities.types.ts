export interface City {
  id: string;
  tenantId: string;
  ref: string;
  name: string;
  zone: string;
  pickupCity: boolean;
  status: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
  _count?: {
    pickupTariffs: number;
    destinationTariffs: number;
    zones: number;
  };
}

export interface CreateCityRequest {
  ref: string;
  name: string;
  zone: string;
  pickupCity: boolean;
  status?: boolean;
}

export interface UpdateCityRequest {
  ref?: string;
  name?: string;
  zone?: string;
  pickupCity?: boolean;
  status?: boolean;
}

export interface CityFilters {
  page?: number;
  limit?: number;
  search?: string;
  ref?: string;
  zone?: string;
  pickupCity?: boolean;
  status?: boolean;
  sortBy?: "name" | "ref" | "zone" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
}

export interface CitiesResponse {
  data: City[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ZoneStats {
  zone: string;
  count: number;
}

// Form data types for UI components
export interface CityFormData {
  ref: string;
  name: string;
  zone: string;
  pickupCity: boolean;
  status: boolean;
}

// Bulk operations
export interface BulkCityAction {
  cityIds: string[];
  action: "activate" | "deactivate" | "delete" | "updateZone";
  data?: {
    zone?: string;
    status?: boolean;
  };
}

export interface BulkActionResult {
  successful: number;
  failed: number;
  errors: string[];
}

// Export/Import types
export interface CityExportData {
  ref: string;
  name: string;
  zone: string;
  pickupCity: boolean;
  status: boolean;
  createdAt: string;
  pickupTariffs: number;
  destinationTariffs: number;
}

export interface CityImportData {
  ref: string;
  name: string;
  zone: string;
  pickupCity: boolean;
  status?: boolean;
}

// Statistics and analytics
export interface CityStatistics {
  totalCities: number;
  activeCities: number;
  inactiveCities: number;
  pickupCities: number;
  zoneDistribution: ZoneStats[];
  recentlyCreated: number;
  citiesWithTariffs: number;
  avgTariffsPerCity: number;
}
