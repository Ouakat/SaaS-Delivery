"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth.store";
import { useTenantStore } from "@/lib/stores/tenant.store";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const [isInitialized, setIsInitialized] = useState(false);

  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();

  const { fetchTenants } = useTenantStore();

  // Initialize authentication
  useEffect(() => {
    const initialize = async () => {
      try {
        await checkAuth();

        // Fetch tenant data if authenticated
        const authState = useAuthStore.getState();
        if (authState.isAuthenticated) {
          try {
            // await fetchTenants();
          } catch (error) {
            console.error("Failed to fetch tenant data:", error);
            // Don't block if tenant fetch fails
          }
        }
      } catch (error) {
        console.error("Auth initialization failed:", error);
      } finally {
        setIsInitialized(true);
      }
    };

    initialize();
  }, [checkAuth, fetchTenants]);

  // Handle redirects after initialization
  useEffect(() => {
    if (!isInitialized || isLoading) return;

    if (!isAuthenticated) {
      // Redirect to root
      const loginUrl = `/`;
      router.push(loginUrl);
    }
  }, [isInitialized, isLoading, isAuthenticated, router]);

  // Show loading during initialization
  if (!isInitialized || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render content if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  // Render protected content
  return <>{children}</>;
}
