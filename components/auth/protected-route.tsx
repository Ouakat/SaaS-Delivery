"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth.store";
import { useTenantStore } from "@/lib/stores/tenant.store";
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
  requiredAccessLevel?: "NO_ACCESS" | "PROFILE_ONLY" | "LIMITED" | "FULL";
  allowedAccountStatuses?: string[];
  requireValidation?: boolean;
}

export function ProtectedRoute({
  children,
  requiredRoles = [],
  requiredPermissions = [],
  requiredAccessLevel,
  allowedAccountStatuses = [],
  requireValidation = false,
}: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isInitialized, setIsInitialized] = useState(false);
  const [accessResult, setAccessResult] = useState<{
    allowed: boolean;
    reason?: string;
    redirectTo?: string;
    showMessage?: boolean;
    messageType?: "info" | "warning" | "error";
  }>({ allowed: false });

  const initRef = useRef(false);

  const {
    isAuthenticated,
    isLoading,
    checkAuth,
    user,
    error,
    isCheckingAuth,
    accountStatus,
    validationStatus,
    accessLevel,
    requirements,
    hasBlueCheckmark,
    // Access level methods
    canAccessDashboard,
    canAccessFullFeatures,
    needsProfileCompletion,
    needsValidation,
    isAccountBlocked,
    // Permission methods
    hasRole,
    hasAnyPermission,
    hasAllPermissions,
  } = useAuthStore();

  const { fetchCurrentTenant, currentTenant } = useTenantStore();

  // Comprehensive access check function
  const checkAccess = useRef(
    (
      authState = useAuthStore.getState()
    ): {
      allowed: boolean;
      reason?: string;
      redirectTo?: string;
      showMessage?: boolean;
      messageType?: "info" | "warning" | "error";
    } => {
      // Not authenticated
      if (!authState.isAuthenticated || !authState.user) {
        return {
          allowed: false,
          redirectTo: "/auth/login",
          reason: "Authentication required",
        };
      }

      // Account blocked scenarios
      if (authState.isAccountBlocked()) {
        let reason = "Access denied";
        let messageType: "info" | "warning" | "error" = "error";

        switch (authState.accountStatus) {
          case "PENDING":
            reason = "Your account is pending admin approval";
            messageType = "info";
            break;
          case "REJECTED":
            reason = "Your account has been rejected. Please contact support";
            messageType = "error";
            break;
          case "SUSPENDED":
            reason = "Your account has been suspended. Please contact support";
            messageType = "error";
            break;
        }

        return {
          allowed: false,
          redirectTo: "/auth/login",
          reason,
          showMessage: true,
          messageType,
        };
      }

      // Profile completion check
      if (authState.needsProfileCompletion()) {
        // Allow access to profile completion routes
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
        const currentAccessLevel = authState.accessLevel;
        const accessLevels = ["NO_ACCESS", "PROFILE_ONLY", "LIMITED", "FULL"];
        const requiredIndex = accessLevels.indexOf(requiredAccessLevel);
        const currentIndex = accessLevels.indexOf(
          currentAccessLevel || "NO_ACCESS"
        );

        if (currentIndex < requiredIndex) {
          let reason = "Insufficient access level";
          let redirectTo = "/dashboard";

          if (requiredAccessLevel === "FULL" && authState.needsValidation()) {
            reason = "This feature requires profile validation";
            redirectTo = "/dashboard";
          }

          return {
            allowed: false,
            redirectTo,
            reason,
            showMessage: true,
            messageType: "warning",
          };
        }
      }

      // Account status check
      if (allowedAccountStatuses.length > 0 && authState.accountStatus) {
        if (!allowedAccountStatuses.includes(authState.accountStatus)) {
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
      if (requireValidation && authState.validationStatus !== "VALIDATED") {
        return {
          allowed: false,
          redirectTo: "/dashboard",
          reason: "This feature requires a validated account",
          showMessage: true,
          messageType: "warning",
        };
      }

      // Role check
      if (requiredRoles.length > 0) {
        const hasRequiredRole = requiredRoles.some((role) =>
          authState.hasRole(role)
        );
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
        const hasRequiredPermissions =
          authState.hasAnyPermission(requiredPermissions);
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

      // All checks passed
      return { allowed: true };
    }
  );

  // Initialize authentication
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const initialize = async () => {
      try {
        if (!isCheckingAuth) {
          await checkAuth();
        }

        const authState = useAuthStore.getState();
        if (authState.isAuthenticated && authState.user && !currentTenant) {
          try {
            await fetchCurrentTenant();
          } catch (error) {
            console.error("Failed to fetch current tenant data:", error);
          }
        }

        // Check access after initialization
        const result = checkAccess.current(authState);
        setAccessResult(result);
      } catch (error) {
        console.error("Auth initialization failed:", error);
        setAccessResult({
          allowed: false,
          reason: "Authentication failed",
          redirectTo: "/auth/login",
        });
      } finally {
        setIsInitialized(true);
      }
    };

    initialize();
  }, []);

  // Re-check access when auth state changes
  useEffect(() => {
    if (!isInitialized || isLoading || isCheckingAuth) return;

    const result = checkAccess.current();
    setAccessResult(result);
  }, [
    isInitialized,
    isLoading,
    isCheckingAuth,
    isAuthenticated,
    accountStatus,
    validationStatus,
    accessLevel,
    pathname,
  ]);

  // Handle redirects and messages
  useEffect(() => {
    if (!isInitialized || isLoading || isCheckingAuth) return;
    if (accessResult.allowed) return;

    if (accessResult.showMessage && accessResult.reason) {
      const toastFn =
        accessResult.messageType === "error"
          ? toast.error
          : accessResult.messageType === "warning"
          ? toast.warning
          : toast.info;

      toastFn(accessResult.reason);
    }

    if (accessResult.redirectTo) {
      router.replace(accessResult.redirectTo);
    }
  }, [accessResult, isInitialized, isLoading, isCheckingAuth, router]);

  // Show loading during initialization
  if (!isInitialized || isLoading || isCheckingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Initializing...</p>
        </div>
      </div>
    );
  }

  // Show error state
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

  // Show access denied state with account status information
  if (!accessResult.allowed) {
    const getStatusIcon = () => {
      switch (accountStatus) {
        case "PENDING":
          return <Clock className="h-12 w-12 text-blue-600" />;
        case "INACTIVE":
          return <Info className="h-12 w-12 text-orange-600" />;
        case "PENDING_VALIDATION":
          return <Shield className="h-12 w-12 text-yellow-600" />;
        case "ACTIVE":
          return <CheckCircle className="h-12 w-12 text-green-600" />;
        case "REJECTED":
        case "SUSPENDED":
          return <UserX className="h-12 w-12 text-red-600" />;
        default:
          return <AlertCircle className="h-12 w-12 text-gray-600" />;
      }
    };

    const getStatusMessage = () => {
      switch (accountStatus) {
        case "PENDING":
          return "Your account is pending admin approval. You'll receive an email notification once approved.";
        case "INACTIVE":
          return "Please complete your profile information to activate your account.";
        case "PENDING_VALIDATION":
          return "Your profile is under review. You have limited access until validation is complete.";
        case "ACTIVE":
          return validationStatus === "VALIDATED"
            ? "Your account is fully active and validated."
            : "Your account is active but not yet validated.";
        case "REJECTED":
          return "Your account has been rejected. Please contact support for assistance.";
        case "SUSPENDED":
          return "Your account has been suspended. Please contact support.";
        default:
          return accessResult.reason || "Access denied";
      }
    };

    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full space-y-6 text-center">
          <div className="flex justify-center">
            <div className="rounded-full bg-default-100 p-3">
              {getStatusIcon()}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-semibold text-default-900">
              Access Status
            </h3>
            <p className="text-sm text-default-600 leading-relaxed">
              {getStatusMessage()}
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
            {accountStatus === "INACTIVE" && (
              <Button
                onClick={() => router.push("/profile/complete")}
                className="w-full"
              >
                Complete Profile
              </Button>
            )}

            {(accountStatus === "REJECTED" ||
              accountStatus === "SUSPENDED") && (
              <Button
                onClick={() => router.push("/contact")}
                className="w-full"
              >
                Contact Support
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
              <strong>Reason:</strong> {accessResult.reason}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Render children if access is allowed
  return <>{children}</>;
}
