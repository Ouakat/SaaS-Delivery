// User Types
export const USER_TYPES = {
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
  EMPLOYEE: "EMPLOYEE",
  CLIENT: "CLIENT",
  USER: "USER",
} as const;

// User Management Permissions
export const USER_PERMISSIONS = {
  READ_USERS: "users:read",
  CREATE_USER: "users:create",
  UPDATE_USER: "users:update",
  DELETE_USER: "users:delete",
  MANAGE_USER_ROLES: "users:manage_roles",
  READ_USER_ANALYTICS: "users:analytics",
} as const;

// Role Management Permissions
export const ROLE_PERMISSIONS = {
  READ_ROLES: "roles:read",
  CREATE_ROLE: "roles:create",
  UPDATE_ROLE: "roles:update",
  DELETE_ROLE: "roles:delete",
  ASSIGN_PERMISSIONS: "roles:assign",
} as const;

// Admin Specific Permissions
export const ADMIN_PERMISSIONS = {
  FULL_ACCESS: "admin:full_access",
  SYSTEM_SETTINGS: "admin:system_settings",
  TENANT_MANAGEMENT: "admin:tenant_management",
} as const;

// Combined permissions for easy access
export const PERMISSIONS = {
  ...USER_PERMISSIONS,
  ...ROLE_PERMISSIONS,
  ...ADMIN_PERMISSIONS,
} as const;

// Permission groups for easier management
export const PERMISSION_GROUPS = {
  USER_MANAGEMENT: [
    USER_PERMISSIONS.READ_USERS,
    USER_PERMISSIONS.CREATE_USER,
    USER_PERMISSIONS.UPDATE_USER,
    USER_PERMISSIONS.DELETE_USER,
    USER_PERMISSIONS.MANAGE_USER_ROLES,
    USER_PERMISSIONS.READ_USER_ANALYTICS,
  ],
  ROLE_MANAGEMENT: [
    ROLE_PERMISSIONS.READ_ROLES,
    ROLE_PERMISSIONS.CREATE_ROLE,
    ROLE_PERMISSIONS.UPDATE_ROLE,
    ROLE_PERMISSIONS.DELETE_ROLE,
    ROLE_PERMISSIONS.ASSIGN_PERMISSIONS,
  ],
  ADMIN_ONLY: [
    ADMIN_PERMISSIONS.FULL_ACCESS,
    ADMIN_PERMISSIONS.SYSTEM_SETTINGS,
    ADMIN_PERMISSIONS.TENANT_MANAGEMENT,
  ],
} as const;
