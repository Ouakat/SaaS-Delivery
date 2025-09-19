export interface EmailSettings {
  id: string;
  enabled: boolean;
  fromName: string;
  fromEmail: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass?: string; // Never returned by API for security
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

export interface EmailTemplate {
  id: string;
  category: EmailTemplateCategory;
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  placeholders: string[];
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export type EmailTemplateCategory =
  | "PARCEL"
  | "INVOICE"
  | "CUSTOMER"
  | "NOTIFICATION"
  | "MARKETING"
  | "SYSTEM";

export interface CreateEmailTemplateRequest {
  category: EmailTemplateCategory;
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  placeholders: string[];
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
  page?: number;
  limit?: number;
  category?: EmailTemplateCategory;
  search?: string;
  enabled?: boolean;
}

export interface TestEmailRequest {
  to: string;
  templateId?: string;
  subject?: string;
  htmlContent?: string;
  textContent?: string;
  placeholderValues?: Record<string, string>;
}

export interface EmailStats {
  totalTemplates: number;
  activeTemplates: number;
  templatesByCategory: Record<EmailTemplateCategory, number>;
  settingsConfigured: boolean;
  lastConfigured?: string;
}

// Email template categories with metadata
export const EMAIL_TEMPLATE_CATEGORIES = {
  PARCEL: {
    label: "Parcel Notifications",
    description:
      "Templates for parcel status updates and delivery notifications",
    color: "blue",
    icon: "heroicons:cube",
    defaultPlaceholders: [
      "{TRACKING_NUMBER}",
      "{CLIENT_NAME}",
      "{COMPANY_NAME}",
      "{STATUS}",
    ],
  },
  INVOICE: {
    label: "Invoice Communications",
    description: "Templates for invoice notifications and payment reminders",
    color: "green",
    icon: "heroicons:document-text",
    defaultPlaceholders: [
      "{INVOICE_REF}",
      "{CLIENT_NAME}",
      "{AMOUNT}",
      "{COMPANY_NAME}",
    ],
  },
  CUSTOMER: {
    label: "Customer Service",
    description: "Templates for customer support and service communications",
    color: "purple",
    icon: "heroicons:chat-bubble-left-right",
    defaultPlaceholders: ["{CLIENT_NAME}", "{COMPANY_NAME}", "{SUPPORT_AGENT}"],
  },
  NOTIFICATION: {
    label: "System Notifications",
    description: "Templates for system alerts and administrative notifications",
    color: "orange",
    icon: "heroicons:bell",
    defaultPlaceholders: ["{USER_NAME}", "{COMPANY_NAME}", "{DATE}"],
  },
  MARKETING: {
    label: "Marketing & Promotions",
    description:
      "Templates for promotional campaigns and marketing communications",
    color: "pink",
    icon: "heroicons:megaphone",
    defaultPlaceholders: ["{CLIENT_NAME}", "{COMPANY_NAME}", "{OFFER}"],
  },
  SYSTEM: {
    label: "System Messages",
    description: "Templates for system-generated messages and alerts",
    color: "gray",
    icon: "heroicons:cog-6-tooth",
    defaultPlaceholders: ["{USER_NAME}", "{COMPANY_NAME}", "{SYSTEM_MESSAGE}"],
  },
} as const;

// Common placeholders that can be used across templates
export const COMMON_PLACEHOLDERS = [
  "{COMPANY_NAME}",
  "{COMPANY_EMAIL}",
  "{COMPANY_PHONE}",
  "{COMPANY_WEBSITE}",
  "{CLIENT_NAME}",
  "{CLIENT_EMAIL}",
  "{CLIENT_PHONE}",
  "{TRACKING_NUMBER}",
  "{ORDER_REF}",
  "{INVOICE_REF}",
  "{AMOUNT}",
  "{DATE}",
  "{TIME}",
  "{STATUS}",
  "{DELIVERY_ADDRESS}",
  "{PICKUP_ADDRESS}",
  "{DELIVERY_DATE}",
  "{SUPPORT_EMAIL}",
  "{SUPPORT_PHONE}",
  "{USER_NAME}",
  "{SYSTEM_MESSAGE}",
] as const;

export type CommonPlaceholder = (typeof COMMON_PLACEHOLDERS)[number];
