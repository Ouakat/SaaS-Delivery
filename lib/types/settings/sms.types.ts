export interface SmsSettings {
  id: string;
  tenantId: string;
  enabled: boolean;
  senderName: string;
  phonePrefix: string;
  apiKey?: string;
  balance: number;
  lowBalanceAlert: number;
  createdAt: string;
  updatedAt: string;
}

export interface SmsTemplate {
  id: string;
  tenantId: string;
  name: string;
  content: string;
  placeholders: string[];
  status: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSmsTemplateRequest {
  name: string;
  content: string;
  placeholders: string[];
}

export interface UpdateSmsSettingsRequest {
  enabled?: boolean;
  senderName?: string;
  phonePrefix?: string;
  apiKey?: string;
  lowBalanceAlert?: number;
}

export interface UpdateSmsTemplateRequest {
  name?: string;
  content?: string;
  placeholders?: string[];
  status?: boolean;
}

export interface RechargeBalanceRequest {
  amount: number;
  reference?: string;
}

export interface SmsTemplateFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: boolean;
}

export interface SmsUsageStats {
  totalSent: number;
  thisMonth: number;
  lastMonth: number;
  successRate: number;
  averageCost: number;
}

export interface SmsRechargeHistory {
  id: string;
  amount: number;
  reference?: string;
  previousBalance: number;
  newBalance: number;
  createdAt: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
}

export const SMS_PLACEHOLDERS = {
  CLIENT_NAME: "{CLIENT_NAME}",
  TRACKING_NUMBER: "{TRACKING_NUMBER}",
  COMPANY_NAME: "{COMPANY_NAME}",
  DELIVERY_DATE: "{DELIVERY_DATE}",
  PICKUP_DATE: "{PICKUP_DATE}",
  DRIVER_NAME: "{DRIVER_NAME}",
  DRIVER_PHONE: "{DRIVER_PHONE}",
  STATUS: "{STATUS}",
  ADDRESS: "{ADDRESS}",
  AMOUNT: "{AMOUNT}",
  REFERENCE: "{REFERENCE}",
} as const;

export const SMS_TEMPLATE_EXAMPLES = [
  {
    name: "Parcel Confirmation",
    content:
      "Hello {CLIENT_NAME}, your parcel {TRACKING_NUMBER} has been confirmed. Track it at {COMPANY_NAME}.",
    placeholders: ["{CLIENT_NAME}", "{TRACKING_NUMBER}", "{COMPANY_NAME}"],
  },
  {
    name: "Out for Delivery",
    content:
      "Your package {TRACKING_NUMBER} is out for delivery. Expected delivery today. - {COMPANY_NAME}",
    placeholders: ["{TRACKING_NUMBER}", "{COMPANY_NAME}"],
  },
  {
    name: "Delivery Confirmation",
    content:
      "Package {TRACKING_NUMBER} delivered successfully to {ADDRESS}. Thank you for choosing {COMPANY_NAME}!",
    placeholders: ["{TRACKING_NUMBER}", "{ADDRESS}", "{COMPANY_NAME}"],
  },
  {
    name: "Pickup Scheduled",
    content:
      "Pickup scheduled for {PICKUP_DATE}. Driver: {DRIVER_NAME} ({DRIVER_PHONE}). Ref: {TRACKING_NUMBER}",
    placeholders: [
      "{PICKUP_DATE}",
      "{DRIVER_NAME}",
      "{DRIVER_PHONE}",
      "{TRACKING_NUMBER}",
    ],
  },
] as const;
