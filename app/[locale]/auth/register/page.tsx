"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/lib/stores/auth/auth.store";
import { useRouter, useSearchParams } from "next/navigation";
import { Link } from "@/i18n/routing";
import RegForm from "@/components/auth/reg-form";
import Image from "next/image";
import Copyright from "@/components/auth/copyright";
import Logo from "@/components/auth/logo";
import Social from "@/components/auth/social";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Info } from "lucide-react";

interface RegisterPageProps {
  params: { locale: string };
}

const RegisterPage = ({ params: { locale } }: RegisterPageProps) => {
  const { isAuthenticated, isLoading, accountStatus } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get registration success status from URL params
  const registrationSuccess = searchParams.get("success") === "true";
  const registrationMessage = searchParams.get("message");

  // Redirect to dashboard if authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push("/dashboard");
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

  // Don't render if already authenticated
  if (isAuthenticated) {
    return null;
  }

  // Show registration success page
  if (registrationSuccess) {
    return (
      <div className="flex w-full items-center justify-center min-h-dvh h-dvh">
        <div className="max-w-md w-full mx-auto p-6">
          <div className="text-center space-y-6">
            <div className="mb-6">
              <Logo />
            </div>

            <Alert color="default">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium">Registration Successful!</div>
                <div className="text-sm mt-2">
                  {registrationMessage ||
                    "Your account has been created and is pending admin approval. You will receive an email notification once your account is approved."}
                </div>
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <p>What happens next:</p>
                <ul className="mt-2 space-y-1 text-left">
                  <li>• Admin will review your registration</li>
                  <li>• You'll receive an email notification once approved</li>
                  <li>• After approval, you can complete your profile</li>
                  <li>• Full access granted after profile validation</li>
                </ul>
              </div>

              <div className="pt-4">
                <Link
                  href="/auth/login"
                  className="inline-flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  Continue to Login
                </Link>
              </div>

              <div className="text-xs text-muted-foreground">
                Need help?{" "}
                <Link href="/contact" className="text-primary hover:underline">
                  Contact Support
                </Link>
              </div>
            </div>
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
              Unlock your Project
              <span className="text-default-800 font-bold ms-2">
                performance
              </span>
            </h4>
          </div>
          <div className="absolute left-0 bottom-[-130px] h-full w-full z-[-1]">
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

        {/* Right Side - Registration Form */}
        <div className="flex-1 relative dark:bg-default-100 bg-white">
          <div className="h-full flex flex-col">
            <div className="max-w-[524px] md:px-[42px] md:py-[44px] p-7 mx-auto w-full text-2xl text-default-900 mb-3 h-full flex flex-col justify-center">
              {/* Mobile Logo */}
              <div className="flex justify-center items-center text-center mb-6 lg:hidden">
                <Link href="/">
                  <Logo />
                </Link>
              </div>

              {/* Header */}
              <div className="text-center 2xl:mb-10 mb-5">
                <h4 className="font-medium">Create Account</h4>
                <div className="text-default-500 text-base">
                  Create an account to start using Network
                </div>
              </div>

              {/* Registration Form */}
              <RegForm />

              {/* Social Login Divider */}
              <div className="relative border-b-[#9AA2AF] border-opacity-[16%] border-b pt-6">
                <div className="absolute inline-block bg-default-50 dark:bg-default-100 left-1/2 top-1/2 transform -translate-x-1/2 px-4 min-w-max text-sm text-default-500 font-normal">
                  Or continue with
                </div>
              </div>

              {/* Social Login */}
              <div className="max-w-[242px] mx-auto mt-8 w-full">
                <Social locale={locale} />
              </div>

              {/* Login Link */}
              <div className="max-w-[225px] mx-auto font-normal text-default-500 2xl:mt-12 mt-6 uppercase text-sm">
                Already registered?{" "}
                <Link
                  href="/auth/login"
                  className="text-default-900 font-medium hover:underline"
                >
                  Sign In
                </Link>
              </div>
            </div>

            {/* Footer */}
            <div className="text-xs font-normal text-default-500 z-999 pb-10 text-center">
              <Copyright />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
