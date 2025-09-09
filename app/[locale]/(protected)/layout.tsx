"use client";

import { ProtectedRoute } from "@/components/auth/protected-route";
import LayoutProvider from "@/providers/layout.provider";
import LayoutContentProvider from "@/providers/content.provider";
import NetworkSidebar from "@/components/partials/sidebar";
import NetworkFooter from "@/components/partials/footer";
import ThemeCustomize from "@/components/partials/customizer";
import NetworkHeader from "@/components/partials/header";

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  return (
    <ProtectedRoute
      requireAuth
      requireTenant
      // Allow all authenticated user types by default
      // Individual pages can override with more specific requirements
      loadingComponent={<LayoutLoadingComponent />}
    >
      <LayoutProvider>
        <ThemeCustomize />
        <NetworkHeader />
        <NetworkSidebar />
        <LayoutContentProvider>{children}</LayoutContentProvider>
        <NetworkFooter />
      </LayoutProvider>
    </ProtectedRoute>
  );
}

// Loading component that matches your layout structure
function LayoutLoadingComponent() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="text-sm text-muted-foreground">
          Loading your workspace...
        </p>
      </div>
    </div>
  );
}
