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
  createdBy: string | null;
  updatedBy: string | null;
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

export interface CitiesFilters {
  page?: number;
  limit?: number;
  search?: string;
  ref?: string;
  zone?: string;
  pickupCity?: boolean;
  status?: boolean;
}

export interface ZoneStats {
  zone: string;
  count: number;
}

export interface CitiesPaginatedResponse {
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
