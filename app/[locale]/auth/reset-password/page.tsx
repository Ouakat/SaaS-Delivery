"use client";

import { useEffect, Suspense } from "react";
import { useAuthStore } from "@/lib/stores/auth.store";
import { useRouter, useSearchParams } from "next/navigation";
import { Link } from "@/i18n/routing";
import ResetPass from "@/components/auth/reset-pass";
import Image from "next/image";
import Copyright from "@/components/auth/copyright";
import Logo from "@/components/auth/logo";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface ResetPasswordPageProps {
  params: { locale: string };
}

// Component that uses useSearchParams (needs to be wrapped in Suspense)
function ResetPasswordContent({ locale }: { locale: string }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get("token");
  const email = searchParams.get("email");
  const error = searchParams.get("error");

  // Redirect to dashboard if authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  // Redirect if no token provided
  useEffect(() => {
    if (!token && !isLoading && !error) {
      router.replace("/auth/forgot-password?error=invalid-token");
    }
  }, [token, isLoading, error, router]);

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

  // Show error state if no token and no specific error
  if (!token && !error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full space-y-6 text-center">
          <Logo />
          <Alert variant="soft">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium">Invalid Reset Link</div>
              <div className="text-sm mt-1">
                This password reset link is invalid or has expired. Please
                request a new one.
              </div>
            </AlertDescription>
          </Alert>
          <div className="space-y-3">
            <Link
              href="/auth/forgot-password"
              className="inline-flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Request New Reset Link
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-default-700 bg-default-100 rounded-md hover:bg-default-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-default-500"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
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

        {/* Right Side - Reset Password Form */}
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
                <h4 className="font-medium mb-4">Reset Your Password</h4>
                <div className="text-default-500 text-base">
                  Enter your new password below.
                </div>
                {email && (
                  <div className="text-sm text-default-400 mt-2">
                    For: {email}
                  </div>
                )}
              </div>

              {/* Reset Password Form */}
              {token && <ResetPass token={token} />}

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
}

const ResetPasswordPage = ({ params: { locale } }: ResetPasswordPageProps) => {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      }
    >
      <ResetPasswordContent locale={locale} />
    </Suspense>
  );
};

export default ResetPasswordPage;
