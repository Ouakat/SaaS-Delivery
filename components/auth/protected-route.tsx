// components/auth/protected-route.tsx
"use client";

import { useEffect } from "react";
import { useAuth, UseAuthOptions } from "@/lib/hooks/auth/use-auth";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ErrorBoundary } from "@/components/common/error-boundary";
import { SessionTimeoutWarning } from "@/components/auth/session-timeout-warning";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ShieldAlert, RefreshCw } from "lucide-react";

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
  } = useAuth(authOptions);

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
    return fallback || <DefaultFallbackComponent />;
  }

  // Render protected content
  return (
    <ErrorBoundary>
      {showSessionWarning && <SessionTimeoutWarning />}
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
  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="max-w-md w-full space-y-4">
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertDescription className="space-y-2">
            <div>
              <strong>Authentication Error</strong>
            </div>
            <div className="text-sm">
              {error.message || "An authentication error occurred"}
            </div>
            {error.details && (
              <details className="text-xs opacity-75">
                <summary>Error details</summary>
                <pre className="mt-1 whitespace-pre-wrap">
                  {JSON.stringify(error.details, null, 2)}
                </pre>
              </details>
            )}
          </AlertDescription>
        </Alert>

        <div className="flex gap-2">
          <Button onClick={onRetry} className="flex-1">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
          <Button variant="outline" onClick={onClear}>
            Dismiss
          </Button>
        </div>
      </div>
    </div>
  );
}

// Default fallback component
function DefaultFallbackComponent() {
  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="text-center space-y-4">
        <ShieldAlert className="h-12 w-12 text-muted-foreground mx-auto" />
        <div>
          <h2 className="text-lg font-semibold">Access Denied</h2>
          <p className="text-muted-foreground">
            You don't have permission to access this resource.
          </p>
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

export function AgentRoute({
  children,
  ...props
}: Omit<ProtectedRouteProps, "allowedUserTypes">) {
  return (
    <ProtectedRoute {...props} allowedUserTypes={["LIVREUR", "DISPATCHER"]}>
      {children}
    </ProtectedRoute>
  );
}

export function SellerRoute({
  children,
  ...props
}: Omit<ProtectedRouteProps, "allowedUserTypes">) {
  return (
    <ProtectedRoute {...props} allowedUserTypes={["SELLER", "MERCHANT"]}>
      {children}
    </ProtectedRoute>
  );
}
