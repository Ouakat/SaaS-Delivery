export interface GeneralSettings {
  id: string;
  tenantId: string;
  logo?: string;
  favicon?: string;
  companyName: string;
  website: string;
  address: string;
  phone: string;
  email: string;
  currencySymbol: string;
  sidebarColor?: string;
  links: {
    termsOfService?: string;
    privacyPolicy?: string;
    support?: string;
    help?: string;
  };
  socials: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    youtube?: string;
  };
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface CreateGeneralSettingsRequest {
  companyName: string;
  website: string;
  address: string;
  phone: string;
  email: string;
  currencySymbol: string;
  sidebarColor?: string;
  links?: {
    termsOfService?: string;
    privacyPolicy?: string;
    support?: string;
    help?: string;
  };
  socials?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    youtube?: string;
  };
  logo?: string;
  favicon?: string;
}

export interface UpdateGeneralSettingsRequest
  extends Partial<CreateGeneralSettingsRequest> {}

export interface GeneralSettingsPreview {
  companyName: string;
  logo?: string;
  favicon?: string;
  website: string;
  currencySymbol: string;
  socials: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    youtube?: string;
  };
}

export interface UploadResponse {
  url: string;
  filename: string;
}
