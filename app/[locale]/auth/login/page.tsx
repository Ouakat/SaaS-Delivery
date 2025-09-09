"use client";

import { useEffect } from "react";
import { Link } from "@/i18n/routing";
import LoginForm from "@/components/auth/login-form";
import Image from "next/image";
import Social from "@/components/auth/social";
import Copyright from "@/components/auth/copyright";
import Logo from "@/components/auth/logo";
import { useAuthStore } from "@/lib/stores/auth.store";
import { useRouter, useSearchParams } from "next/navigation";

interface LoginPageProps {
  params: { locale: string };
}

const LoginPage = ({ params: { locale } }: LoginPageProps) => {
  const { isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      const redirectTo = searchParams.get("redirect") || "/dashboard";
      router.replace(redirectTo);
    }
  }, [isAuthenticated, isLoading, router, searchParams]);

  // Show loading while checking auth status
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

  // Don't render if authenticated (will redirect)
  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="flex w-full items-center overflow-hidden min-h-dvh h-dvh">
      <div className="overflow-y-auto flex flex-wrap w-full h-dvh">
        {/* Left Side - Branding */}
        <div className="lg:block hidden flex-1 overflow-hidden text-[40px] leading-[48px] text-default-600 relative z-1 bg-default-50">
          <div className="max-w-[520px] pt-20 ps-20">
            <Link href="/" className="mb-6 inline-block">
              <Logo />
            </Link>
            <h4>
              Unlock your Project
              <span className="text-default-800 font-bold ms-2">performance</span>
            </h4>
          </div>
          <div className="absolute left-0 2xl:bottom-[-160px] bottom-[-130px] h-full w-full z-[-1]">
            <Image
              src="/images/auth/ils1.svg"
              alt="Network Illustration"
              priority
              width={300}
              height={300}
              className="mb-10 w-full h-full object-contain"
            />
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex-1 relative">
          <div className="h-full flex flex-col dark:bg-default-100 bg-white">
            <div className="max-w-[524px] md:px-[42px] md:py-[44px] p-7 mx-auto w-full text-2xl text-default-900 mb-3 h-full flex flex-col justify-center">
              {/* Mobile Logo */}
              <div className="flex justify-center items-center text-center mb-6 lg:hidden">
                <Link href="/">
                  <Logo />
                </Link>
              </div>

              {/* Header */}
              <div className="text-center 2xl:mb-10 mb-4">
                <h1 className="font-medium text-2xl">Welcome Back</h1>
                <p className="text-default-500 text-base mt-2">
                  Sign in to your account to continue
                </p>
              </div>

              {/* Login Form */}
              <LoginForm />

              {/* Social Login Divider */}
              <div className="relative border-b border-default-200 pt-6">
                <div className="absolute inline-block bg-white dark:bg-default-100 left-1/2 top-1/2 transform -translate-x-1/2 px-4 text-sm text-default-500">
                  Or continue with
                </div>
              </div>

              {/* Social Login */}
              <div className="max-w-[242px] mx-auto mt-8 w-full">
                <Social locale={locale} />
              </div>

              {/* Sign Up Link */}
              <div className="text-center font-normal text-default-500 mt-8 text-sm">
                Don't have an account?{" "}
                <Link
                  href="/auth/register"
                  className="text-primary font-medium hover:underline"
                >
                  Create account
                </Link>
              </div>
            </div>

            {/* Footer */}
            <div className="text-xs text-default-500 pb-6 text-center">
              <Copyright />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;