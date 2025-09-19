"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth/auth.store";
import { useTenantStore } from "@/lib/stores/auth/tenant.store";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  Info,
  CheckCircle,
  Clock,
  Shield,
  UserX,
} from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  requiredPermissions?: string[];
  requiredUserTypes?: string[]; // Added this line
  requiredAccessLevel?: "NO_ACCESS" | "PROFILE_ONLY" | "LIMITED" | "FULL";
  allowedAccountStatuses?: string[];
  requireValidation?: boolean;
}

interface AccessResult {
  allowed: boolean;
  reason?: string;
  redirectTo?: string;
  showMessage?: boolean;
  messageType?: "info" | "warning" | "error";
}

// Constants
const ACCESS_LEVELS = ["NO_ACCESS", "PROFILE_ONLY", "LIMITED", "FULL"] as const;

const STATUS_CONFIGS = {
  PENDING: {
    icon: Clock,
    color: "text-blue-600",
    message:
      "Your account is pending admin approval. You'll receive an email notification once approved.",
    action: null,
  },
  INACTIVE: {
    icon: Info,
    color: "text-orange-600",
    message:
      "Please complete your profile information to activate your account.",
    action: { label: "Complete Profile", path: "/profile/complete" },
  },
  PENDING_VALIDATION: {
    icon: Shield,
    color: "text-yellow-600",
    message:
      "Your profile is under review. You have limited access until validation is complete.",
    action: null,
  },
  ACTIVE: {
    icon: CheckCircle,
    color: "text-green-600",
    message: "Your account is fully active and validated.",
    action: null,
  },
  REJECTED: {
    icon: UserX,
    color: "text-red-600",
    message:
      "Your account has been rejected. Please contact support for assistance.",
    action: { label: "Contact Support", path: "/contact" },
  },
  SUSPENDED: {
    icon: UserX,
    color: "text-red-600",
    message: "Your account has been suspended. Please contact support.",
    action: { label: "Contact Support", path: "/contact" },
  },
} as const;

const BLOCKED_REASONS = {
  PENDING: "Your account is pending admin approval",
  REJECTED: "Your account has been rejected. Please contact support",
  SUSPENDED: "Your account has been suspended. Please contact support",
} as const;

export function ProtectedRoute({
  children,
  requiredRoles = [],
  requiredPermissions = [],
  requiredUserTypes = [], // Added this line
  requiredAccessLevel,
  allowedAccountStatuses = [],
  requireValidation = false,
}: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isInitialized, setIsInitialized] = useState(false);
  const [accessResult, setAccessResult] = useState<AccessResult>({
    allowed: false,
  });
  const initRef = useRef(false);
  const lastCheckRef = useRef<string>("");

  // Stable selectors to prevent unnecessary re-renders
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const user = useAuthStore((state) => state.user);
  const error = useAuthStore((state) => state.error);
  const isCheckingAuth = useAuthStore((state) => state.isCheckingAuth);
  const accountStatus = useAuthStore((state) => state.accountStatus);
  const validationStatus = useAuthStore((state) => state.validationStatus);
  const accessLevel = useAuthStore((state) => state.accessLevel);
  const requirements = useAuthStore((state) => state.requirements);
  const hasBlueCheckmark = useAuthStore((state) => state.hasBlueCheckmark);

  // Stable method references
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const isAccountBlocked = useAuthStore((state) => state.isAccountBlocked);
  const needsProfileCompletion = useAuthStore(
    (state) => state.needsProfileCompletion
  );
  const needsValidation = useAuthStore((state) => state.needsValidation);
  const hasRole = useAuthStore((state) => state.hasRole);
  const hasAnyPermission = useAuthStore((state) => state.hasAnyPermission);
  const hasUserType = useAuthStore((state) => state.hasUserType); // Added this line

  const { fetchCurrentTenant, currentTenant } = useTenantStore();

  // Stable access check function with useCallback
  const checkAccess = useCallback((): AccessResult => {
    // Not authenticated
    if (!isAuthenticated || !user) {
      return {
        allowed: false,
        redirectTo: "/auth/login",
        reason: "Authentication required",
      };
    }

    // Account blocked scenarios
    if (isAccountBlocked()) {
      const status = accountStatus;
      const reason = status
        ? BLOCKED_REASONS[status as keyof typeof BLOCKED_REASONS]
        : "Access denied";
      const messageType = status === "PENDING" ? "info" : "error";

      return {
        allowed: false,
        redirectTo: "/auth/login",
        reason,
        showMessage: true,
        messageType,
      };
    }

    // Profile completion check
    if (needsProfileCompletion()) {
      if (
        pathname.includes("/profile/complete") ||
        pathname.includes("/auth")
      ) {
        return { allowed: true };
      }

      return {
        allowed: false,
        redirectTo: "/profile/complete",
        reason: "Please complete your profile to continue",
        showMessage: true,
        messageType: "info",
      };
    }

    // Access level check
    if (requiredAccessLevel) {
      const requiredIndex = ACCESS_LEVELS.indexOf(requiredAccessLevel);
      const currentIndex = ACCESS_LEVELS.indexOf(accessLevel || "NO_ACCESS");

      if (currentIndex < requiredIndex) {
        const isValidationRequired =
          requiredAccessLevel === "FULL" && needsValidation();
        const reason = isValidationRequired
          ? "This feature requires profile validation"
          : "Insufficient access level";

        return {
          allowed: false,
          redirectTo: "/dashboard",
          reason,
          showMessage: true,
          messageType: "warning",
        };
      }
    }

    // Account status check
    if (allowedAccountStatuses.length > 0 && accountStatus) {
      if (!allowedAccountStatuses.includes(accountStatus)) {
        return {
          allowed: false,
          redirectTo: "/dashboard",
          reason: "Your account status does not allow access to this feature",
          showMessage: true,
          messageType: "warning",
        };
      }
    }

    // Validation requirement check
    if (requireValidation && validationStatus !== "VALIDATED") {
      return {
        allowed: false,
        redirectTo: "/dashboard",
        reason: "This feature requires a validated account",
        showMessage: true,
        messageType: "warning",
      };
    }

    // User type check (Added this section)
    if (requiredUserTypes.length > 0) {
      const hasRequiredUserType = requiredUserTypes.some(
        (userType) => user.userType === userType
      );
      if (!hasRequiredUserType) {
        return {
          allowed: false,
          redirectTo: "/unauthorized",
          reason: "Access restricted to specific user types",
          showMessage: true,
          messageType: "error",
        };
      }
    }

    // Role check
    if (requiredRoles.length > 0) {
      const hasRequiredRole = requiredRoles.some((role) => hasRole(role));
      if (!hasRequiredRole) {
        return {
          allowed: false,
          redirectTo: "/unauthorized",
          reason: "Insufficient role permissions",
          showMessage: true,
          messageType: "error",
        };
      }
    }

    // Permission check
    if (requiredPermissions.length > 0) {
      const hasRequiredPermissions = hasAnyPermission(requiredPermissions);
      if (!hasRequiredPermissions) {
        return {
          allowed: false,
          redirectTo: "/unauthorized",
          reason: "Insufficient permissions",
          showMessage: true,
          messageType: "error",
        };
      }
    }

    return { allowed: true };
  }, [
    isAuthenticated,
    user,
    isAccountBlocked,
    accountStatus,
    needsProfileCompletion,
    pathname,
    accessLevel,
    requiredAccessLevel,
    needsValidation,
    allowedAccountStatuses,
    requireValidation,
    validationStatus,
    requiredUserTypes, // Added this line
    requiredRoles,
    hasRole,
    requiredPermissions,
    hasAnyPermission,
  ]);

  // Create a unique key for the current state to prevent unnecessary re-checks
  const stateKey = useMemo(() => {
    return [
      isAuthenticated,
      user?.id,
      user?.userType, // Added this line
      accountStatus,
      validationStatus,
      accessLevel,
      pathname,
      requiredAccessLevel,
      JSON.stringify(allowedAccountStatuses),
      requireValidation,
      JSON.stringify(requiredUserTypes), // Added this line
      JSON.stringify(requiredRoles),
      JSON.stringify(requiredPermissions),
    ].join("|");
  }, [
    isAuthenticated,
    user?.id,
    user?.userType, // Added this line
    accountStatus,
    validationStatus,
    accessLevel,
    pathname,
    requiredAccessLevel,
    allowedAccountStatuses,
    requireValidation,
    requiredUserTypes, // Added this line
    requiredRoles,
    requiredPermissions,
  ]);

  // Initialize authentication - only once
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const initialize = async () => {
      try {
        if (!isCheckingAuth) {
          await checkAuth();
        }

        // Fetch tenant data if authenticated and not loaded
        if (isAuthenticated && user && !currentTenant) {
          await fetchCurrentTenant().catch(console.error);
        }
      } catch (error) {
        console.error("Auth initialization failed:", error);
      } finally {
        setIsInitialized(true);
      }
    };

    initialize();
  }, []); // Empty dependency array - only run once

  // Check access when state changes
  useEffect(() => {
    if (!isInitialized || isLoading || isCheckingAuth) return;

    // Prevent unnecessary re-checks
    if (lastCheckRef.current === stateKey) return;
    lastCheckRef.current = stateKey;

    const result = checkAccess();
    setAccessResult(result);
  }, [isInitialized, isLoading, isCheckingAuth, stateKey, checkAccess]);

  // Handle redirects and messages - separate effect to prevent loops
  useEffect(() => {
    if (!isInitialized || isLoading || isCheckingAuth || accessResult.allowed) {
      return;
    }

    // Only show message and redirect if we have a valid access result
    if (accessResult.reason) {
      if (accessResult.showMessage) {
        const toastFn = {
          error: toast.error,
          warning: toast.warning,
          info: toast.info,
        }[accessResult.messageType || "info"];

        toastFn(accessResult.reason);
      }

      if (accessResult.redirectTo) {
        router.replace(accessResult.redirectTo);
      }
    }
  }, [
    accessResult.allowed,
    accessResult.reason,
    accessResult.redirectTo,
    accessResult.showMessage,
    accessResult.messageType,
    isInitialized,
    isLoading,
    isCheckingAuth,
    router,
  ]);

  // Loading state
  if (!isInitialized || isLoading || isCheckingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Initializing...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full space-y-6 text-center">
          <Alert variant="outline">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium">Authentication Error</div>
              <div className="text-sm mt-1">{error}</div>
            </AlertDescription>
          </Alert>
          <Button
            onClick={() => {
              initRef.current = false;
              window.location.reload();
            }}
            className="w-full"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Access denied state
  if (!accessResult.allowed) {
    const statusConfig = accountStatus
      ? STATUS_CONFIGS[accountStatus as keyof typeof STATUS_CONFIGS]
      : null;

    const IconComponent = statusConfig?.icon || AlertCircle;

    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full space-y-6 text-center">
          <div className="flex justify-center">
            <div className="rounded-full bg-default-100 p-3">
              <IconComponent
                className={`h-12 w-12 ${
                  statusConfig?.color || "text-gray-600"
                }`}
              />
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-semibold text-default-900">
              Access Status
            </h3>
            <p className="text-sm text-default-600 leading-relaxed">
              {statusConfig?.message || accessResult.reason || "Access denied"}
            </p>

            {hasBlueCheckmark && (
              <div className="flex items-center justify-center gap-2 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                Verified Account
              </div>
            )}

            {requirements.length > 0 && (
              <div className="text-left">
                <div className="text-sm font-medium text-default-700 mb-2">
                  Requirements:
                </div>
                <ul className="text-xs text-default-600 space-y-1">
                  {requirements.map((req, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-default-400" />
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="space-y-3">
            {statusConfig?.action && (
              <Button
                onClick={() => router.push(statusConfig.action!.path)}
                className="w-full"
              >
                {statusConfig.action.label}
              </Button>
            )}

            <Button
              variant="outline"
              onClick={() => router.push("/auth/login")}
              className="w-full"
            >
              Back to Login
            </Button>
          </div>

          {process.env.NODE_ENV === "development" && (
            <div className="mt-4 p-3 bg-muted rounded-lg text-xs text-left text-muted-foreground">
              <strong>Dev Info:</strong>
              <br />
              <strong>Account Status:</strong> {accountStatus}
              <br />
              <strong>Validation Status:</strong> {validationStatus}
              <br />
              <strong>Access Level:</strong> {accessLevel}
              <br />
              <strong>Required Access:</strong> {requiredAccessLevel || "Any"}
              <br />
              <strong>Required User Types:</strong>{" "}
              {requiredUserTypes.length > 0
                ? requiredUserTypes.join(", ")
                : "Any"}
              <br />
              <strong>Current User Type:</strong> {user?.userType || "None"}
              <br />
              <strong>Reason:</strong> {accessResult.reason}
            </div>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
