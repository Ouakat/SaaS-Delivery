export enum EmailTemplateCategory {
  INVOICE = "INVOICE",
  VERIFICATION = "VERIFICATION",
  PARCEL_NOTIFICATION = "PARCEL_NOTIFICATION",
  PAYMENT_REMINDER = "PAYMENT_REMINDER",
  WELCOME = "WELCOME",
  MARKETING = "MARKETING",
  PASSWORD_RESET = "PASSWORD_RESET",
  ACCOUNT_UPDATE = "ACCOUNT_UPDATE",
  PARCEL = "PARCEL",
  CUSTOMER = "CUSTOMER",
  NOTIFICATION = "NOTIFICATION",
  SYSTEM = "SYSTEM",
}

// Email Settings Types
export interface EmailSettings {
  id: string;
  enabled: boolean;
  fromName: string;
  fromEmail: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateEmailSettingsRequest {
  enabled?: boolean;
  fromName?: string;
  fromEmail?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
}

// Email Template Types
export interface EmailTemplate {
  id: string;
  category: EmailTemplateCategory;
  name: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  placeholders: string[];
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmailTemplateRequest {
  category: EmailTemplateCategory;
  name: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  placeholders?: string[];
}

export interface UpdateEmailTemplateRequest {
  name?: string;
  subject?: string;
  htmlContent?: string;
  textContent?: string;
  placeholders?: string[];
  enabled?: boolean;
}

export interface EmailTemplateFilters {
  category?: EmailTemplateCategory;
  enabled?: boolean;
  search?: string;
  sortBy?: "name" | "category" | "createdAt" | "updatedAt";
  sortParcel?: "asc" | "desc";
  page?: number;
  limit?: number;
}

// Test Email Types
export interface TestEmailRequest {
  to: string;
  subject?: string;
  content?: string;
}

// Email Stats Types
export interface EmailStats {
  totalTemplates: number;
  activeTemplates: number;
  templatesByCategory: Record<string, number>;
  lastConfigured?: string;
  emailsSentThisMonth?: number;
  deliveryRate?: number;
}

// Bulk Operations Types
export interface BulkUpdateTemplatesRequest {
  templateIds: string[];
  updates: Partial<Pick<EmailTemplate, "enabled" | "category">>;
}

export interface BulkDeleteTemplatesRequest {
  templateIds: string[];
}

// Import/Export Types
export interface ImportTemplatesRequest {
  templates: Omit<EmailTemplate, "id" | "createdAt" | "updatedAt">[];
}

export interface ExportTemplatesResponse {
  templates: EmailTemplate[];
  exportedAt: string;
}

// Template Preview Types
export interface PreviewTemplateRequest {
  placeholderValues?: Record<string, string>;
}

export interface PreviewTemplateResponse {
  subject: string;
  htmlContent: string;
  textContent: string;
}

// Send Email Types
export interface SendTemplatedEmailRequest {
  to: string | string[];
  placeholderValues?: Record<string, string>;
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: Buffer | string;
    contentType?: string;
  }>;
}

export interface SendEmailResponse {
  success: boolean;
  messageId: string;
}

// Template Categories Configuration
export const EMAIL_TEMPLATE_CATEGORIES = {
  [EmailTemplateCategory.INVOICE]: {
    label: "Invoice",
    icon: "heroicons:document-text",
    color: "blue",
    description: "Templates for invoice notifications and billing",
    defaultPlaceholders: [
      "{INVOICE_REF}",
      "{CLIENT_NAME}",
      "{AMOUNT}",
      "{DUE_DATE}",
      "{COMPANY_NAME}",
    ],
  },
  [EmailTemplateCategory.VERIFICATION]: {
    label: "Verification",
    icon: "heroicons:shield-check",
    color: "green",
    description: "Email verification and confirmation templates",
    defaultPlaceholders: [
      "{USER_NAME}",
      "{VERIFICATION_CODE}",
      "{VERIFICATION_LINK}",
      "{EXPIRY_TIME}",
    ],
  },
  [EmailTemplateCategory.PARCEL_NOTIFICATION]: {
    label: "Parcel",
    icon: "heroicons:shopping-bag",
    color: "purple",
    description: "Parcel confirmation and tracking notifications",
    defaultPlaceholders: [
      "{PARCEL_NUMBER}",
      "{CUSTOMER_NAME}",
      "{TRACKING_NUMBER}",
      "{DELIVERY_ADDRESS}",
      "{PARCEL_TOTAL}",
    ],
  },
  [EmailTemplateCategory.PAYMENT_REMINDER]: {
    label: "Payment",
    icon: "heroicons:credit-card",
    color: "orange",
    description: "Payment reminders and overdue notifications",
    defaultPlaceholders: [
      "{CLIENT_NAME}",
      "{INVOICE_REF}",
      "{AMOUNT_DUE}",
      "{DUE_DATE}",
      "{LATE_FEE}",
    ],
  },
  [EmailTemplateCategory.WELCOME]: {
    label: "Welcome",
    icon: "heroicons:hand-raised",
    color: "indigo",
    description: "Welcome messages for new users",
    defaultPlaceholders: [
      "{USER_NAME}",
      "{LOGIN_URL}",
      "{SUPPORT_EMAIL}",
      "{COMPANY_NAME}",
    ],
  },
  [EmailTemplateCategory.MARKETING]: {
    label: "Marketing",
    icon: "heroicons:megaphone",
    color: "pink",
    description: "Promotional and marketing campaigns",
    defaultPlaceholders: [
      "{RECIPIENT_NAME}",
      "{OFFER_DETAILS}",
      "{PROMO_CODE}",
      "{EXPIRY_DATE}",
      "{UNSUBSCRIBE_LINK}",
    ],
  },
  [EmailTemplateCategory.PASSWORD_RESET]: {
    label: "Password",
    icon: "heroicons:key",
    color: "red",
    description: "Password reset and security notifications",
    defaultPlaceholders: [
      "{USER_NAME}",
      "{RESET_LINK}",
      "{RESET_CODE}",
      "{EXPIRY_TIME}",
    ],
  },
  [EmailTemplateCategory.ACCOUNT_UPDATE]: {
    label: "Account",
    icon: "heroicons:user-circle",
    color: "gray",
    description: "Account updates and profile changes",
    defaultPlaceholders: [
      "{USER_NAME}",
      "{UPDATE_DETAILS}",
      "{EFFECTIVE_DATE}",
      "{CONTACT_SUPPORT}",
    ],
  },
  [EmailTemplateCategory.PARCEL]: {
    label: "Parcel",
    icon: "heroicons:cube",
    color: "blue",
    description:
      "Templates for parcel status updates and delivery notifications",
    defaultPlaceholders: [
      "{TRACKING_NUMBER}",
      "{CLIENT_NAME}",
      "{COMPANY_NAME}",
      "{STATUS}",
      "{DELIVERY_ADDRESS}",
    ],
  },
  [EmailTemplateCategory.CUSTOMER]: {
    label: "Customer Service",
    icon: "heroicons:chat-bubble-left-right",
    color: "purple",
    description: "Templates for customer support and service communications",
    defaultPlaceholders: [
      "{CLIENT_NAME}",
      "{COMPANY_NAME}",
      "{SUPPORT_AGENT}",
      "{TICKET_NUMBER}",
    ],
  },
  [EmailTemplateCategory.NOTIFICATION]: {
    label: "System Notifications",
    icon: "heroicons:bell",
    color: "orange",
    description: "Templates for system alerts and administrative notifications",
    defaultPlaceholders: [
      "{USER_NAME}",
      "{COMPANY_NAME}",
      "{DATE}",
      "{NOTIFICATION_TYPE}",
    ],
  },
  [EmailTemplateCategory.SYSTEM]: {
    label: "System Messages",
    icon: "heroicons:cog-6-tooth",
    color: "gray",
    description: "Templates for system-generated messages and alerts",
    defaultPlaceholders: [
      "{USER_NAME}",
      "{COMPANY_NAME}",
      "{SYSTEM_MESSAGE}",
      "{ACTION_REQUIRED}",
    ],
  },
} as const;

// Common placeholders that can be used across all templates
export const COMMON_PLACEHOLDERS = [
  "{COMPANY_NAME}",
  "{COMPANY_EMAIL}",
  "{COMPANY_PHONE}",
  "{COMPANY_WEBSITE}",
  "{COMPANY_ADDRESS}",
  "{CLIENT_NAME}",
  "{CLIENT_EMAIL}",
  "{CLIENT_PHONE}",
  "{USER_NAME}",
  "{USER_EMAIL}",
  "{TRACKING_NUMBER}",
  "{PARCEL_REF}",
  "{PARCEL_NUMBER}",
  "{INVOICE_REF}",
  "{INVOICE_NUMBER}",
  "{AMOUNT}",
  "{AMOUNT_DUE}",
  "{PARCEL_TOTAL}",
  "{DATE}",
  "{TIME}",
  "{DUE_DATE}",
  "{DELIVERY_DATE}",
  "{STATUS}",
  "{DELIVERY_ADDRESS}",
  "{PICKUP_ADDRESS}",
  "{SUPPORT_EMAIL}",
  "{SUPPORT_PHONE}",
  "{SYSTEM_MESSAGE}",
  "{ACTION_REQUIRED}",
  "{VERIFICATION_CODE}",
  "{VERIFICATION_LINK}",
  "{RESET_LINK}",
  "{RESET_CODE}",
  "{LOGIN_URL}",
  "{EXPIRY_TIME}",
  "{EFFECTIVE_DATE}",
  "{TICKET_NUMBER}",
  "{SUPPORT_AGENT}",
  "{NOTIFICATION_TYPE}",
  "{OFFER_DETAILS}",
  "{PROMO_CODE}",
  "{UNSUBSCRIBE_LINK}",
  "{RECIPIENT_NAME}",
  "{CUSTOMER_NAME}",
  "{LATE_FEE}",
  "{UPDATE_DETAILS}",
  "{CONTACT_SUPPORT}",
] as const;

export type CommonPlaceholder = (typeof COMMON_PLACEHOLDERS)[number];

// Validation Types
export interface TemplateValidationRequest {
  subject: string;
  htmlContent: string;
  textContent?: string;
  placeholders: string[];
}

export interface TemplateValidationResponse {
  valid: boolean;
  errors: string[];
  warnings: string[];
  usedPlaceholders: string[];
  unusedPlaceholders: string[];
}

// Template Statistics Types
export interface TemplateStatsRequest {
  from?: string;
  to?: string;
}

export interface TemplateStatsResponse {
  templateId: string;
  sentCount: number;
  deliveryRate: number;
  lastUsed?: string;
  usageByDate: Array<{ date: string; count: number }>;
}

// Category Placeholders Types
export interface CategoryPlaceholdersResponse {
  placeholders: string[];
  descriptions: Record<string, string>;
}

// API Response Types
export interface BulkOperationResponse {
  updated?: number;
  deleted?: number;
  failed: string[];
}

export interface ImportTemplatesResponse {
  imported: number;
  skipped: number;
  errors: string[];
}
