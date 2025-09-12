export enum AccountStatus {
  PENDING = "PENDING",
  INACTIVE = "INACTIVE",
  PENDING_VALIDATION = "PENDING_VALIDATION",
  ACTIVE = "ACTIVE",
  REJECTED = "REJECTED",
  SUSPENDED = "SUSPENDED",
}

export enum ValidationStatus {
  PENDING = "PENDING",
  VALIDATED = "VALIDATED",
  REJECTED = "REJECTED",
}

export type AccessLevel = "NO_ACCESS" | "PROFILE_ONLY" | "LIMITED" | "FULL";

// Updated LoginResponse to match backend AuthResponseDto
export interface LoginResponse {
  user?: {
    id: string;
    email: string;
    name?: string;
    userType: string;
    avatar?: string;
    phone?: string;
    city?: string;
    profile: any;
    accountStatus: AccountStatus;
    validationStatus: ValidationStatus;
    profileCompleted: boolean;
    role: {
      id: string;
      name: string;
      permissions: string[];
      userTypes: string[];
    };
    tenant: {
      id: string;
      name: string;
      slug: string;
    };
    isActive: boolean;
    lastLogin?: Date;
    createdAt: Date;
  };

  accessToken?: string;
  refreshToken?: string;
  tokenType?: string;
  expiresIn?: number;
  message: string;

  // Workflow status indicators from backend
  accountStatus?: AccountStatus;
  requiresApproval?: boolean;
  requiresProfileCompletion?: boolean;
  profileAccess?: boolean;
  limitedAccess?: boolean;
  fullAccess?: boolean;
  pendingValidation?: boolean;
  accessDenied?: boolean;
  validationStatus?: ValidationStatus;
}

// Registration response
export interface RegisterResponse {
  success: boolean;
  message: string;
  accountStatus: AccountStatus;
  user?: {
    id: string;
    email: string;
    name?: string;
    userType: string;
    createdAt: Date;
  };
  nextSteps?: string[];
  estimatedApprovalTime?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
  roleId?: string;
  profile?: any;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface CompleteProfileRequest {
  phone?: string;
  city?: string;
  address: string;
  cin: string;
  cinDocuments?: string[];
  bankDetails?: string;
  profilePhoto?: string;
}

// Account status response for /auth/status endpoint
export interface AccountStatusResponse {
  accountStatus: AccountStatus;
  validationStatus: ValidationStatus;
  profileCompleted: boolean;
  accessLevel: AccessLevel;
  requirements: string[];
  hasBlueCheckmark: boolean;
  statusMessage?: string;
  nextAction?: string;
  estimatedWaitTime?: string;
}
