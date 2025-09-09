"use client";

import { useAuth, UseAuthOptions } from "@/lib/hooks/auth/use-auth";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ErrorBoundary } from "@/components/common/error-boundary";
import { SessionTimeoutWarning } from "@/components/auth/session-timeout-warning";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ShieldAlert, RefreshCw, Home } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth.store";

interface ProtectedRouteProps extends UseAuthOptions {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ComponentType<{ error: any; retry: () => void }>;
  showSessionWarning?: boolean;
}

export function ProtectedRoute({
  children,
  fallback,
  loadingComponent,
  errorComponent: ErrorComponent,
  showSessionWarning = true,
  ...authOptions
}: ProtectedRouteProps) {
  const {
    isLoading,
    isAuthenticated,
    isAuthorized,
    error,
    hasBlockingError,
    canAccess,
    refreshAuth,
    clearError,
    user,
    currentTenant,
  } = useAuth(authOptions);

  // Get auth store methods for session timeout warning
  const {
    refreshSession,
    logout,
    sessionTimeoutWarning,
    setSessionTimeoutWarning,
  } = useAuthStore();

  // Show loading state
  if (isLoading) {
    return loadingComponent || <DefaultLoadingComponent />;
  }

  // Show error state with retry option
  if (error && hasBlockingError) {
    if (ErrorComponent) {
      return <ErrorComponent error={error} retry={refreshAuth} />;
    }
    return (
      <DefaultErrorComponent
        error={error}
        onRetry={refreshAuth}
        onClear={clearError}
      />
    );
  }

  // Show fallback if user can't access
  if (!canAccess) {
    return (
      fallback || (
        <DefaultFallbackComponent user={user} currentTenant={currentTenant} />
      )
    );
  }

  // Render protected content
  return (
    <ErrorBoundary>
      {showSessionWarning && (
        <SessionTimeoutWarning
          isOpen={sessionTimeoutWarning}
          onExtendSession={async () => {
            await refreshSession();
            setSessionTimeoutWarning(false);
          }}
          onLogout={async () => {
            await logout();
          }}
          timeoutDuration={300} // 5 minutes
          warningDuration={60} // 1 minute warning
        />
      )}
      {children}
    </ErrorBoundary>
  );
}

// Default loading component
function DefaultLoadingComponent() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-muted-foreground">Authenticating...</p>
      </div>
    </div>
  );
}

// Default error component
function DefaultErrorComponent({
  error,
  onRetry,
  onClear,
}: {
  error: any;
  onRetry: () => void;
  onClear: () => void;
}) {
  const router = useRouter();

  const getErrorMessage = () => {
    switch (error.type) {
      case "auth":
        return "Authentication required. Please sign in to continue.";
      case "tenant":
        return "Tenant selection required. Please select your workspace.";
      case "userType":
        return "Access denied. Your account type does not have permission to access this resource.";
      case "role":
        return "Access denied. Your role does not have permission to access this resource.";
      case "permission":
        return "Access denied. You do not have the required permissions.";
      case "network":
        return "Network error. Please check your connection and try again.";
      default:
        return error.message || "An authentication error occurred";
    }
  };

  const getErrorActions = () => {
    switch (error.type) {
      case "auth":
        return (
          <div className="flex gap-2">
            <Button onClick={() => router.push("/")}>Sign In</Button>
            <Button variant="outline" onClick={onClear}>
              Dismiss
            </Button>
          </div>
        );
      case "tenant":
        return (
          <div className="flex gap-2">
            <Button onClick={() => router.push("/tenant-select")}>
              Select Workspace
            </Button>
            <Button variant="outline" onClick={onClear}>
              Dismiss
            </Button>
          </div>
        );
      case "network":
        return (
          <div className="flex gap-2">
            <Button onClick={onRetry}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
            <Button variant="outline" onClick={onClear}>
              Dismiss
            </Button>
          </div>
        );
      default:
        return (
          <div className="flex gap-2">
            <Button onClick={() => router.push("/dashboard")}>
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Button>
            <Button variant="outline" onClick={onClear}>
              Dismiss
            </Button>
          </div>
        );
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="max-w-md w-full space-y-4">
        <Alert variant="outline">
          <ShieldAlert className="h-4 w-4" />
          <AlertDescription className="space-y-3">
            <div>
              <strong>Access Error</strong>
            </div>
            <div className="text-sm">{getErrorMessage()}</div>
            {error.details && process.env.NODE_ENV === "development" && (
              <details className="text-xs opacity-75">
                <summary>Error details (development only)</summary>
                <pre className="mt-1 whitespace-pre-wrap text-xs">
                  {JSON.stringify(error.details, null, 2)}
                </pre>
              </details>
            )}
          </AlertDescription>
        </Alert>

        {getErrorActions()}
      </div>
    </div>
  );
}

// Default fallback component
function DefaultFallbackComponent({
  user,
  currentTenant,
}: {
  user: any;
  currentTenant: any;
}) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="text-center space-y-4 max-w-md">
        <ShieldAlert className="h-12 w-12 text-muted-foreground mx-auto" />
        <div>
          <h2 className="text-lg font-semibold">Access Denied</h2>
          <p className="text-muted-foreground">
            You don't have permission to access this resource.
          </p>
        </div>

        {user && (
          <div className="text-sm text-muted-foreground space-y-1">
            <p>
              Signed in as: <span className="font-medium">{user.email}</span>
            </p>
            <p>
              Role: <span className="font-medium">{user.role?.name}</span>
            </p>
            <p>
              Type: <span className="font-medium">{user.userType}</span>
            </p>
            {currentTenant && (
              <p>
                Workspace:{" "}
                <span className="font-medium">{currentTenant.name}</span>
              </p>
            )}
          </div>
        )}

        <div className="flex gap-2 justify-center">
          <Button onClick={() => router.push("/dashboard")}>
            <Home className="h-4 w-4 mr-2" />
            Go to Dashboard
          </Button>
          <Button variant="outline" onClick={() => router.back()}>
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
}

// Higher-order component version for class components or simpler usage
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  authOptions?: UseAuthOptions
) {
  return function ProtectedComponent(props: P) {
    return (
      <ProtectedRoute {...authOptions}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}

// Utility components for specific use cases
export function AdminRoute({
  children,
  ...props
}: Omit<ProtectedRouteProps, "allowedRoles">) {
  return (
    <ProtectedRoute {...props} allowedRoles={["admin"]}>
      {children}
    </ProtectedRoute>
  );
}

export function ManagerRoute({
  children,
  ...props
}: Omit<ProtectedRouteProps, "allowedRoles">) {
  return (
    <ProtectedRoute {...props} allowedRoles={["admin", "manager"]}>
      {children}
    </ProtectedRoute>
  );
}

// Note: You'll need to update these with your actual UserType values
export function AgentRoute({
  children,
  ...props
}: Omit<ProtectedRouteProps, "allowedUserTypes">) {
  return (
    <ProtectedRoute
      {...props}
      allowedUserTypes={["AGENT", "DISPATCHER"] as any}
    >
      {children}
    </ProtectedRoute>
  );
}

export function SellerRoute({
  children,
  ...props
}: Omit<ProtectedRouteProps, "allowedUserTypes">) {
  return (
    <ProtectedRoute {...props} allowedUserTypes={["SELLER"] as any}>
      {children}
    </ProtectedRoute>
  );
}
