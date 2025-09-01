"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { Loader2, Lock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";

interface RouteGuardProps {
  children: React.ReactNode;
  requiredPermissions?: string[];
  requiredRoles?: string[];
  requireAuth?: boolean;
  requireTenant?: boolean;
  fallback?: React.ReactNode;
  redirectTo?: string;
  allowedRoles?: string[];
}

const RouteGuard: React.FC<RouteGuardProps> = ({
  children,
  requiredPermissions = [],
  requiredRoles = [],
  requireAuth = true,
  requireTenant = false,
  fallback,
  redirectTo,
  allowedRoles = [],
}) => {
  const router = useRouter();
  const {
    isAuthenticated,
    user,
    currentTenant,
    isLoading,
    hasAnyPermission,
    hasAnyRole,
    isFullyAuthenticated,
    authError,
  } = useAuth({
    requireAuth,
    requireTenant,
    allowedRoles,
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated && requireAuth) {
      const currentPath = window.location.pathname + window.location.search;
      router.push(`/auth/login?redirect=${encodeURIComponent(currentPath)}`);
    }
  }, [isAuthenticated, requireAuth, isLoading, router]);

  // Show loading state
  if (isLoading) {
    return fallback || <LoadingFallback />;
  }

  // Check authentication
  if (requireAuth && !isAuthenticated) {
    return fallback || <AuthRequiredFallback />;
  }

  // Check tenant requirement
  if (requireTenant && !currentTenant) {
    return fallback || <TenantRequiredFallback />;
  }

  // Check role requirements
  if (
    requiredRoles.length > 0 &&
    (!user || !requiredRoles.includes(user.role))
  ) {
    return (
      fallback || (
        <RoleRequiredFallback
          requiredRoles={requiredRoles}
          userRole={user?.role}
        />
      )
    );
  }

  // Check permission requirements
  if (
    requiredPermissions.length > 0 &&
    !hasAnyPermission(requiredPermissions)
  ) {
    return (
      fallback || (
        <PermissionRequiredFallback requiredPermissions={requiredPermissions} />
      )
    );
  }

  // Check allowed roles (if specified)
  if (allowedRoles.length > 0 && (!user || !allowedRoles.includes(user.role))) {
    return (
      fallback || (
        <RoleRequiredFallback
          requiredRoles={allowedRoles}
          userRole={user?.role}
        />
      )
    );
  }

  // Show auth error if any
  if (authError?.type === "role" || authError?.type === "auth") {
    return fallback || <AuthErrorFallback error={authError.message} />;
  }

  // All checks passed, render children
  return <>{children}</>;
};

// Fallback components
const LoadingFallback: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="text-center">
      <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-4" />
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        Loading...
      </h2>
      <p className="text-gray-600 dark:text-gray-400">
        Please wait while we verify your access
      </p>
    </div>
  </div>
);

const AuthRequiredFallback: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
      <Lock className="w-12 h-12 text-red-500 mx-auto mb-4" />
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
        Authentication Required
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        You need to be signed in to access this page
      </p>
      <div className="space-y-3">
        <Button asChild className="w-full">
          <Link href="/auth/login">Sign In</Link>
        </Button>
        <Button asChild variant="outline" className="w-full">
          <Link href="/">Go Home</Link>
        </Button>
      </div>
    </div>
  </div>
);

const TenantRequiredFallback: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
      <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
        Tenant Selection Required
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Please select a tenant to continue
      </p>
      <Button asChild className="w-full">
        <Link href="/tenant-select">Select Tenant</Link>
      </Button>
    </div>
  </div>
);

interface RoleRequiredFallbackProps {
  requiredRoles: string[];
  userRole?: string;
}

const RoleRequiredFallback: React.FC<RoleRequiredFallbackProps> = ({
  requiredRoles,
  userRole,
}) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
      <Lock className="w-12 h-12 text-red-500 mx-auto mb-4" />
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
        Access Denied
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        Your role ({userRole || "none"}) doesn't have access to this page.
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Required roles: {requiredRoles.join(", ")}
      </p>
      <div className="space-y-3">
        <Button asChild variant="outline" className="w-full">
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
        <Button asChild variant="ghost" className="w-full">
          <Link href="/">Go Home</Link>
        </Button>
      </div>
    </div>
  </div>
);

interface PermissionRequiredFallbackProps {
  requiredPermissions: string[];
}

const PermissionRequiredFallback: React.FC<PermissionRequiredFallbackProps> = ({
  requiredPermissions,
}) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
      <Lock className="w-12 h-12 text-red-500 mx-auto mb-4" />
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
        Insufficient Permissions
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        You don't have the required permissions to access this page.
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Required permissions: {requiredPermissions.join(", ")}
      </p>
      <div className="space-y-3">
        <Button asChild variant="outline" className="w-full">
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
        <Button asChild variant="ghost" className="w-full">
          <Link href="/">Go Home</Link>
        </Button>
      </div>
    </div>
  </div>
);

interface AuthErrorFallbackProps {
  error: string;
}

const AuthErrorFallback: React.FC<AuthErrorFallbackProps> = ({ error }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
      <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
        Access Error
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
      <div className="space-y-3">
        <Button asChild className="w-full">
          <Link href="/auth/login">Sign In Again</Link>
        </Button>
        <Button asChild variant="outline" className="w-full">
          <Link href="/">Go Home</Link>
        </Button>
      </div>
    </div>
  </div>
);

export default RouteGuard;
