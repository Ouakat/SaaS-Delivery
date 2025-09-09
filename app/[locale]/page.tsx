"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/lib/stores/auth.store";
import { useRouter } from "next/navigation";
import { Link } from "@/i18n/routing";
import LoginForm from "@/components/auth/login-form";
import Image from "next/image";
import Social from "@/components/auth/social";
import Copyright from "@/components/auth/copyright";
import Logo from "@/components/auth/logo";

interface RootPageProps {
  params: { locale: string };
}

const RootPage = ({ params: { locale } }: RootPageProps) => {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const router = useRouter();

  // Initialize auth check
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Redirect to dashboard if authenticated
  useEffect(() => {
    console.log("🚀 ~ RootPage ~ isAuthenticated:", isAuthenticated)
    console.log("🚀 ~ RootPage ~ isLoading:", isLoading)

    if (isAuthenticated && !isLoading) {
      const urlParams = new URLSearchParams(window.location.search);
      const redirectTo = urlParams.get("redirect") || "/dashboard";
      router.push(redirectTo);
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading during auth check
  if (isLoading) {
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
  console.log("🚀 ~ isAuthenticated: asssssssssssssssssssssssssss", isAuthenticated)

  // if (isAuthenticated) {
  //   return null;
  // }

};

export default RootPage;
