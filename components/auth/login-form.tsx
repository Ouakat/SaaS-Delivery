"use client";

import React, { useCallback, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/routing";
import { Icon } from "@/components/ui/icon";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils/ui.utils";
import { Loader2, AlertCircle, Info, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth/auth.store";
import { getTenantFromUrl } from "@/lib/utils/tenant.utils";
import { Alert, AlertDescription } from "@/components/ui/alert";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(4, "Password must be at least 4 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

const LoginForm = () => {
  const [isPending, startTransition] = React.useTransition();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [passwordType, setPasswordType] = React.useState("password");
  const [rememberMe, setRememberMe] = React.useState(false);

  const {
    login,
    isAuthenticated,
    error: authError,
    clearError,
    accountStatus,
    accessLevel,
    requirements,
  } = useAuthStore();

  const tenantId = useMemo(() => getTenantFromUrl(), []);
  const redirectUrl = useMemo(
    () => searchParams.get("redirect") || "/dashboard",
    [searchParams]
  );

  const togglePasswordType = useCallback(() => {
    setPasswordType((prev) => (prev === "password" ? "text" : "password"));
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setError,
    setValue,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    defaultValues: {
      email: "admin@acme.com",
      password: "password123",
    },
  });

  // Load remembered email and clear errors on mount
  useEffect(() => {
    clearError();

    const rememberedEmail = localStorage.getItem("remember_email");
    if (rememberedEmail) {
      setValue("email", rememberedEmail);
      setRememberMe(true);
    }
  }, [clearError, setValue]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.replace(redirectUrl);
    }
  }, [isAuthenticated, router, redirectUrl]);

  // Handle auth errors
  useEffect(() => {
    if (authError) {
      toast.error(authError);

      // Set specific field errors based on error message
      if (
        authError.toLowerCase().includes("email") ||
        authError.toLowerCase().includes("user not found")
      ) {
        setError("email", { message: "Invalid email address" });
      } else if (
        authError.toLowerCase().includes("password") ||
        authError.toLowerCase().includes("credentials")
      ) {
        setError("password", { message: "Invalid password" });
      }
    }
  }, [authError, setError]);

  const onSubmit = useCallback(
    (data: LoginFormData) => {
      startTransition(async () => {
        try {
          clearError();

          if (!tenantId) {
            toast.error("Tenant not found. Please check your URL.");
            return;
          }

          const result = await login({
            email: data.email.trim().toLowerCase(),
            password: data.password,
          });

          if (result.success) {
            // Handle remember me
            if (rememberMe) {
              localStorage.setItem(
                "remember_email",
                data.email.trim().toLowerCase()
              );
            } else {
              localStorage.removeItem("remember_email");
            }

            // Show success message
            if (result.message) {
              toast.success(result.message);
            } else {
              toast.success("Welcome back!");
            }

            // Redirect directly - middleware will read token from cookies
            const redirectTo = result.redirectTo || "/dashboard";
            window.location.href = redirectTo;
          } else {
            // Login failed - error already set in store
            console.log("Login failed:", result.error);
          }
        } catch (err: any) {
          console.error("Login error:", err);
          toast.error(err.message || "An unexpected error occurred");
        }
      });
    },
    [login, tenantId, rememberMe, router, clearError]
  );

  // Helper function to get status alert info
  const getStatusAlert = () => {
    if (!accountStatus) return null;

    switch (accountStatus) {
      case "PENDING":
        return {
          variant: "default" as const,
          icon: Info,
          title: "Account Pending Approval",
          message:
            "Your account is waiting for admin approval. You will receive an email once approved.",
        };
      case "REJECTED":
        return {
          variant: "destructive" as const,
          icon: AlertCircle,
          title: "Account Rejected",
          message:
            "Your account has been rejected. Please contact support for assistance.",
        };
      case "SUSPENDED":
        return {
          variant: "destructive" as const,
          icon: AlertCircle,
          title: "Account Suspended",
          message: "Your account has been suspended. Please contact support.",
        };
      case "INACTIVE":
        return {
          variant: "default" as const,
          icon: Info,
          title: "Complete Your Profile",
          message:
            "Please complete your profile information to activate your account.",
        };
      case "PENDING_VALIDATION":
        return {
          variant: "default" as const,
          icon: Info,
          title: "Profile Under Review",
          message:
            "Your profile is being validated. You have limited access until validation is complete.",
        };
      case "ACTIVE":
        return {
          variant: "default" as const,
          icon: CheckCircle,
          title: "Account Active",
          message: "Your account is fully activated and validated.",
        };
      default:
        return null;
    }
  };

  const statusAlert = getStatusAlert();

  return (
    <div className="space-y-6">
      {/* Account Status Alert */}
      {statusAlert && !isPending && (
        <Alert color={statusAlert.variant}>
          <statusAlert.icon className="h-4 w-4" />
          <AlertDescription className="flex flex-col">
            <div className="font-medium">{statusAlert.title}</div>
            <div className="text-sm mt-1">{statusAlert.message}</div>
            {requirements.length > 0 && (
              <ul className="text-xs mt-2 space-y-1">
                {requirements.map((req, index) => (
                  <li key={index}>• {req}</li>
                ))}
              </ul>
            )}
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* Email Field */}
        <div className="space-y-2">
          <Label htmlFor="email" className="font-medium text-default-600">
            Email Address
          </Label>
          <Input
            size="lg"
            disabled={isPending}
            {...register("email")}
            type="email"
            id="email"
            placeholder="Enter your email"
            autoComplete="email"
            className={cn("", {
              "border-destructive focus:border-destructive": errors.email,
            })}
          />
          {errors.email && (
            <p className="text-destructive text-sm" role="alert">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <Label htmlFor="password" className="font-medium text-default-600">
            Password
          </Label>
          <div className="relative">
            <Input
              size="lg"
              disabled={isPending}
              {...register("password")}
              type={passwordType}
              id="password"
              placeholder="Enter your password"
              autoComplete="current-password"
              className={cn("pr-10", {
                "border-destructive focus:border-destructive": errors.password,
              })}
            />
            <button
              type="button"
              className="absolute top-1/2 -translate-y-1/2 right-3 p-1 text-default-400 hover:text-default-600 focus:outline-none focus:text-default-600"
              onClick={togglePasswordType}
              aria-label={
                passwordType === "password" ? "Show password" : "Hide password"
              }
            >
              <Icon
                icon={
                  passwordType === "password"
                    ? "heroicons:eye"
                    : "heroicons:eye-slash"
                }
                className="w-5 h-5"
              />
            </button>
          </div>
          {errors.password && (
            <p className="text-destructive text-sm" role="alert">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Remember Me and Forgot Password */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="remember"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              disabled={isPending}
            />
            <Label htmlFor="remember" className="text-sm font-normal">
              Remember me
            </Label>
          </div>
          <Link
            href="/auth/forgot-password"
            className="text-sm text-primary hover:underline focus:outline-none focus:underline"
          >
            Forgot password?
          </Link>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={isPending || !isValid}
        >
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isPending ? "Signing in..." : "Sign In"}
        </Button>

        {/* Development Info */}
        {process.env.NODE_ENV === "development" && (
          <div className="mt-4 p-3 bg-muted rounded-lg text-xs text-muted-foreground">
            <strong>Dev Info:</strong> Tenant: {tenantId || "Not detected"}
            <br />
            <strong>Redirect:</strong> {redirectUrl}
            <br />
            <strong>Access Level:</strong> {accessLevel || "None"}
            <br />
            <strong>Account Status:</strong> {accountStatus || "Unknown"}
          </div>
        )}
      </form>
    </div>
  );
};

export default LoginForm;
