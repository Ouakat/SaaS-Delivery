import { useEffect } from "react";
import { useNetworkStore } from "../stores/network-store";
import { useRouter } from "next/navigation";

export function useNetworkAuth(requireAuth = true) {
  const { user, isAuthenticated, checkAuth, logout } = useNetworkStore();
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (requireAuth && !isAuthenticated && user === null) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, user, requireAuth, router]);

  return {
    user,
    isAuthenticated,
    logout,
  };
}

// Hook for getting tenant from URL
export function useTenant() {
  const { currentTenant, setTenant } = useNetworkStore();

  useEffect(() => {
    // Extract tenant from URL
    const urlParams = new URLSearchParams(window.location.search);
    const tenantFromQuery = urlParams.get("tenant");

    if (
      tenantFromQuery &&
      (!currentTenant || currentTenant.slug !== tenantFromQuery)
    ) {
      // Set tenant (you might want to fetch tenant details from API)
      const mockTenant = {
        id: tenantFromQuery,
        name:
          tenantFromQuery.charAt(0).toUpperCase() + tenantFromQuery.slice(1),
        slug: tenantFromQuery,
        settings: {},
      };
      setTenant(mockTenant);
    }
  }, [currentTenant, setTenant]);

  return currentTenant;
}
