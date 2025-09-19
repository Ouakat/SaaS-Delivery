"use client";
import React, { useEffect, useState, useCallback } from "react";
import NetworkLogo from "./dascode-logo";
import { Link } from "@/i18n/routing";
import { useConfig } from "@/hooks/use-config";
import { useMenuHoverConfig } from "@/hooks/use-menu-hover";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useTenantStore } from "@/lib/stores/auth/tenant.store";
import Image from "next/image";

const Logo = () => {
  const [config] = useConfig();
  const [hoverConfig] = useMenuHoverConfig();
  const { hovered } = hoverConfig;
  const isDesktop = useMediaQuery("(min-width: 1280px)");

  // Get tenant information
  const { currentTenant, fetchCurrentTenant, isLoading } = useTenantStore();
  const [imageError, setImageError] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  // Memoized fetch function to prevent unnecessary re-renders
  const initializeTenant = useCallback(async () => {
    if (!currentTenant && !isLoading && !hasFetched) {
      setHasFetched(true);
      try {
        await fetchCurrentTenant();
      } catch (error) {
        console.warn("Failed to fetch tenant data:", error);
        // Reset flag on error to allow retry
        setHasFetched(false);
      }
    }
  }, [currentTenant, isLoading, hasFetched, fetchCurrentTenant]);

  // Use a separate effect for initialization to avoid render-time updates
  useEffect(() => {
    // Defer the API call to avoid state updates during render
    const initTimer = setTimeout(initializeTenant, 0);
    return () => clearTimeout(initTimer);
  }, []); // Empty dependency array - only run once on mount

  // Handle tenant changes separately
  useEffect(() => {
    if (currentTenant) {
      setImageError(false);
    }
  }, [currentTenant?.logo]);

  // Determine what to display
  const tenantLogo = currentTenant?.logo;
  const tenantName = currentTenant?.name || "Network";
  const showTenantLogo = tenantLogo && !imageError && !isLoading;

  // Get primary color from tenant settings for branding
  const primaryColor = currentTenant?.settings?.theme?.primaryColor;

  // Handle image loading error
  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  // Memoized logo component to prevent unnecessary re-renders
  const LogoImage = React.memo(({ className }: { className?: string }) => {
    if (showTenantLogo) {
      return (
        <div
          className={`relative rounded-md overflow-hidden flex-shrink-0 ${
            className || "h-8 w-8"
          }`}
        >
          <Image
            src={tenantLogo}
            alt={`${tenantName} logo`}
            fill
            className="object-contain"
            onError={handleImageError}
            priority
            unoptimized // Add this if you're having issues with external images
          />
        </div>
      );
    }

    return (
      <NetworkLogo
        className={`text-default-900 ${
          className || "h-8 w-8"
        } [&>path:nth-child(3)]:text-background [&>path:nth-child(2)]:text-background`}
        style={primaryColor ? { color: primaryColor } : undefined}
      />
    );
  });
  LogoImage.displayName = "LogoImage";

  // Memoized title component
  const TenantTitle = React.memo(({ className }: { className?: string }) => (
    <h1
      className={`text-xl font-semibold text-default-900 truncate ${
        className || ""
      }`}
      style={primaryColor ? { color: primaryColor } : undefined}
    >
      {tenantName}
    </h1>
  ));
  TenantTitle.displayName = "TenantTitle";

  // Compact sidebar view
  if (config.sidebar === "compact") {
    return (
      <Link
        href="/dashboard"
        className="flex gap-2 items-center justify-center group"
        title={tenantName}
      >
        <LogoImage className="h-8 w-8 transition-transform group-hover:scale-105" />
      </Link>
    );
  }

  // Two-column sidebar or mobile - don't show logo
  if (config.sidebar === "two-column" || !isDesktop) return null;

  // Default sidebar view
  return (
    <Link
      href="/dashboard"
      className="flex gap-2 items-center group transition-all duration-200 hover:opacity-80"
    >
      <LogoImage className="h-8 w-8 transition-transform group-hover:scale-105" />

      {(!config?.collapsed || hovered) && (
        <div className="min-w-0 flex-1">
          <TenantTitle />
          {/* Optional: Show tenant status or additional info */}
          {currentTenant?.isActive === false && (
            <div className="text-xs text-orange-500 font-medium">Inactive</div>
          )}
        </div>
      )}
    </Link>
  );
};

export default React.memo(Logo);
