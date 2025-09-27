export interface ParcelStatus {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  color: string;
  isLocked: boolean;
  status: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface ClientType {
  id: string;
  tenantId: string;
  name: string;
  status: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface Bank {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  status: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

// Request types
export interface CreateParcelStatusRequest {
  code: string;
  name: string;
  color: string;
  isLocked?: boolean;
  status?: boolean;
}

export interface UpdateParcelStatusRequest {
  code?: string;
  name?: string;
  color?: string;
  status?: boolean;
}

export interface CreateClientTypeRequest {
  name: string;
  status?: boolean;
}

export interface UpdateClientTypeRequest {
  name?: string;
  status?: boolean;
}

export interface CreateBankRequest {
  name: string;
  code: string;
  status?: boolean;
}

export interface UpdateBankRequest {
  name?: string;
  code?: string;
  status?: boolean;
}

// Filter types
export interface ParcelStatusFilters {
  page?: number;
  limit?: number;
  search?: string;
  code?: string;
  status?: boolean;
  isLocked?: boolean;
}

export interface ClientTypeFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: boolean;
}

export interface BankFilters {
  page?: number;
  limit?: number;
  search?: string;
  code?: string;
  status?: boolean;
}

// UI specific types
export interface OptionCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
  href: string;
  count?: number;
  color: string;
}

export interface OptionStats {
  totalParcelStatuses: number;
  activeParcelStatuses: number;
  totalClientTypes: number;
  activeClientTypes: number;
  totalBanks: number;
  activeBanks: number;
}

export interface BulkActionResult {
  successful: number;
  failed: string[];
  errors?: Array<{
    id: string;
    error: string;
  }>;
}
