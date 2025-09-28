// /lib/types/payments/factures.types.ts
export enum FactureStatus {
    DRAFT = "DRAFT",
    SENT = "SENT",
    PAID = "PAID",
    OVERDUE = "OVERDUE",
    CANCELLED = "CANCELLED",
  }
  
  export interface Facture {
    id: string;
    reference: string;
    clientId: string;
    clientName: string;
    clientCode: string;
    clientEmail?: string;
    clientPhone?: string;
    totalAmount: number;
    taxAmount: number;
    discountAmount: number;
    netAmount: number;
    status: FactureStatus;
    dueDate: string;
    createdDate: string;
    paymentDate?: string;
    paymentMethod?: string;
    notes?: string;
    items: FactureItem[];
    colisCount: number;
    createdAt: string;
    updatedAt: string;
    createdBy?: string;
    updatedBy?: string;
  }
  
  export interface FactureItem {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    taxRate: number;
    taxAmount: number;
  }
  
  export interface CreateFactureRequest {
    clientId: string;
    items: Omit<FactureItem, 'id'>[];
    dueDate: string;
    notes?: string;
    discountAmount?: number;
  }
  
  export interface UpdateFactureRequest {
    status?: FactureStatus;
    dueDate?: string;
    notes?: string;
    items?: Omit<FactureItem, 'id'>[];
  }
  
  export interface FactureFilters {
    page?: number;
    limit?: number;
    search?: string;
    status?: FactureStatus;
    clientId?: string;
    startDate?: string;
    endDate?: string;
    minAmount?: number;
    maxAmount?: number;
    // sortBy?: string;
    // sortOrder?: "asc" | "desc";
  }
  
  export interface FactureStatistics {
    totalFactures: number;
    totalAmount: number;
    paidAmount: number;
    pendingAmount: number;
    overdueAmount: number;
    facturesByStatus: Record<string, number>;
    monthlyRevenue: Array<{
      month: string;
      amount: number;
      count: number;
    }>;
    topClients: Array<{
      clientName: string;
      totalAmount: number;
      factureCount: number;
    }>;
  }
  
  export interface PaginatedFacturesResponse {
    data: Facture[];
    meta: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }
  
  // Status configurations
  export const FACTURE_STATUS_COLORS: Record<FactureStatus, string> = {
    [FactureStatus.DRAFT]: "#6B7280",
    [FactureStatus.SENT]: "#3B82F6",
    [FactureStatus.PAID]: "#22C55E",
    [FactureStatus.OVERDUE]: "#EF4444",
    [FactureStatus.CANCELLED]: "#DC2626",
  };
  
  export const FACTURE_STATUS_LABELS: Record<FactureStatus, string> = {
    [FactureStatus.DRAFT]: "Brouillon",
    [FactureStatus.SENT]: "Envoyée",
    [FactureStatus.PAID]: "Payée",
    [FactureStatus.OVERDUE]: "En retard",
    [FactureStatus.CANCELLED]: "Annulée",
  };