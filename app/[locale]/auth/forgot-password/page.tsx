"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/lib/stores/auth/auth.store";
import { useRouter, useSearchParams } from "next/navigation";
import { Link } from "@/i18n/routing";
import ForgotPass from "@/components/auth/forgot-pass";
import Image from "next/image";
import Copyright from "@/components/auth/copyright";
import Logo from "@/components/auth/logo";

interface ForgotPasswordPageProps {
  params: { locale: string };
}

const ForgotPasswordPage = ({
  params: { locale },
}: ForgotPasswordPageProps) => {
  const { isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get URL parameters
  const redirectTo = searchParams.get("redirect") || "/dashboard";

  // Redirect to dashboard if authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.replace(redirectTo);
    }
  }, [isAuthenticated, isLoading, router, redirectTo]);

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

  // Don't render if already authenticated
  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="flex w-full items-center overflow-hidden min-h-dvh h-dvh basis-full">
      <div className="overflow-y-auto flex flex-wrap w-full h-dvh">
        {/* Left Side - Branding */}
        <div className="lg:block hidden flex-1 overflow-hidden text-[40px] leading-[48px] text-default-600 relative z-1 bg-default-50">
          <div className="max-w-[520px] pt-20 ps-20">
            <Link href="/" className="mb-6 inline-block">
              <Logo />
            </Link>
            <h4>
              Unlock your Project{" "}
              <span className="text-default-800 font-bold ms-2">
                performance
              </span>
            </h4>
          </div>
          <div className="absolute left-0 bottom-[-130px] h-full w-full z-[-1]">
            <Image
              width={300}
              height={300}
              src="/images/auth/ils1.svg"
              priority
              alt="Network Illustration"
              className="h-full w-full object-contain"
            />
          </div>
        </div>

        {/* Right Side - Forgot Password Form */}
        <div className="flex-1 relative dark:bg-default-100 bg-white">
          <div className="h-full flex flex-col">
            <div className="max-w-[524px] mx-auto w-full md:px-[42px] md:py-[44px] p-7 text-2xl text-default-900 mb-3 flex flex-col justify-center h-full">
              {/* Mobile Logo */}
              <div className="flex justify-center items-center text-center mb-6 lg:hidden">
                <Link href="/">
                  <Logo />
                </Link>
              </div>

              {/* Header */}
              <div className="text-center 2xl:mb-10 mb-5">
                <h4 className="font-medium mb-4">Forgot Your Password?</h4>
                <div className="text-default-500 text-base">
                  Reset your password with Network.
                </div>
              </div>

              {/* Forgot Password Form */}
              <ForgotPass />

              {/* Back to Login Link */}
              <div className="md:max-w-[345px] mx-auto font-normal text-default-500 2xl:mt-12 mt-8 text-sm text-center">
                Remember your password?{" "}
                <Link
                  href="/auth/login"
                  className="text-primary font-medium hover:underline"
                >
                  Back to Sign In
                </Link>
              </div>
            </div>

            {/* Footer */}
            <div className="text-xs font-normal text-default-500 z-[999] pb-10 text-center">
              <Copyright />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
