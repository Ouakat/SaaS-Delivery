export interface Tariff {
  id: string;
  tenantId: string;
  pickupCityId: string;
  destinationCityId: string;
  deliveryPrice: number;
  returnPrice: number;
  refusalPrice: number;
  deliveryDelay: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;

  // Relations
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

export interface CreateTariffRequest {
  pickupCityId: string;
  destinationCityId: string;
  deliveryPrice: number;
  returnPrice: number;
  refusalPrice: number;
  deliveryDelay: number;
}

export interface UpdateTariffRequest {
  pickupCityId?: string;
  destinationCityId?: string;
  deliveryPrice?: number;
  returnPrice?: number;
  refusalPrice?: number;
  deliveryDelay?: number;
}

export interface TariffFilters {
  page?: number;
  limit?: number;
  pickupCityId?: string;
  destinationCityId?: string;
  minPrice?: number;
  maxPrice?: number;
  maxDelay?: number;
  search?: string;
}

export interface BulkTariffImportRequest {
  tariffs: CreateTariffRequest[];
}

export interface BulkImportResult {
  success: number;
  failed: number;
  errors: string[];
}

export interface TariffCalculationRequest {
  pickupCityId: string;
  destinationCityId: string;
}

export interface TariffCalculationResult {
  deliveryPrice: number;
  returnPrice: number;
  refusalPrice: number;
  deliveryDelay: number;
  pickupCity: string;
  destinationCity: string;
}

// For CSV import/export
export interface TariffCSVRow {
  pickupCityRef: string;
  destinationCityRef: string;
  deliveryPrice: number;
  returnPrice: number;
  refusalPrice: number;
  deliveryDelay: number;
}
