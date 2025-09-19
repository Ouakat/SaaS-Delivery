export interface Zone {
  id: string;
  tenantId: string;
  name: string;
  status: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
  _count?: {
    cities: number;
  };
  cities?: ZoneCity[];
}

export interface ZoneCity {
  id: string;
  name: string;
  ref: string;
  zone?: string;
  pickupCity?: boolean;
  status?: boolean;
}

export interface CreateZoneRequest {
  name: string;
  cityIds: string[];
  status?: boolean;
}

export interface UpdateZoneRequest {
  name?: string;
  cityIds?: string[];
  status?: boolean;
}

export interface ZoneFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: boolean;
}

export interface ZoneStatistics {
  total: number;
  active: number;
  inactive: number;
  totalCities: number;
  averageCitiesPerZone: number;
  zonesWithNoCities: number;
  largestZone: {
    name: string;
    cityCount: number;
  };
  smallestZone: {
    name: string;
    cityCount: number;
  };
}

export interface BulkZoneOperation {
  successful: number;
  failed: string[];
}

// Form validation schemas
export interface ZoneFormData {
  name: string;
  cityIds: string[];
  status: boolean;
}

// Table and UI types
export interface ZoneTableColumn {
  key: keyof Zone | string;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: "left" | "center" | "right";
}

export interface ZoneAction {
  label: string;
  icon?: string;
  color?: "primary" | "success" | "warning" | "danger";
  permission?: string;
  onClick: (zone: Zone) => void;
}

export interface ZoneModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  zone?: Zone;
  mode: "create" | "edit" | "view";
}

// Available cities for zone assignment
export interface AvailableCity {
  id: string;
  name: string;
  ref: string;
  zone?: string;
  pickupCity: boolean;
  status: boolean;
}

// Zone creation/edit form state
export interface ZoneFormState {
  loading: boolean;
  error: string | null;
  success: boolean;
  cities: AvailableCity[];
  citiesLoading: boolean;
}

// Export types
export interface ExportZoneData {
  name: string;
  status: string;
  cityCount: number;
  cities: string;
  createdAt: string;
  updatedAt: string;
}
