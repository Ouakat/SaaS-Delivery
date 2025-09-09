"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/lib/stores/auth.store";
import { useRouter } from "next/navigation";

interface RootPageProps {
  params: { locale: string };
}

const RootPage = ({ params: { locale } }: RootPageProps) => {
  const { isAuthenticated, isLoading, isInitialized, checkAuth } =
    useAuthStore();
  const router = useRouter();

  // Initialize auth check
  useEffect(() => {
    if (!isInitialized) {
      checkAuth();
    }
  }, [checkAuth, isInitialized]);

  // Redirect to dashboard if authenticated
  useEffect(() => {
    console.log("🚀 ~ RootPage ~ isAuthenticated:", isAuthenticated);
    console.log("🚀 ~ RootPage ~ isLoading:", isLoading);
    console.log("🚀 ~ RootPage ~ isInitialized:", isInitialized);

    // Only redirect if we're authenticated AND auth check is complete
    if (isAuthenticated && isInitialized && !isLoading) {
      const urlParams = new URLSearchParams(window.location.search);
      const redirectTo = urlParams.get("redirect") || "/dashboard";
      router.push(redirectTo);
    }
  }, [isAuthenticated, isLoading, isInitialized, router]);

  // Show loading during auth check or before initialization
  if (isLoading || !isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render login form if already authenticated
  if (isAuthenticated) {
    return null; // Or a redirect loading state
  }

  // Render your login form here
  return (
    <div>
      {/* Your login form component */}
      <h1>Login Form</h1>
    </div>
  );
};

export default RootPage;
