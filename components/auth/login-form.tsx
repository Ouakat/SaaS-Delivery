"use client";

import React, { useCallback, useMemo } from "react";
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
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth.store";
import { getTenantFromUrl } from "@/lib/utils/tenant.utils";
import { useEffect } from "react";

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
      password: "newpassword123",
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

            toast.success("Welcome back!");
            router.replace(redirectUrl);
          }
        } catch (err: any) {
          console.error("Login error:", err);
          toast.error(err.message || "An unexpected error occurred");
        }
      });
    },
    [login, tenantId, rememberMe, redirectUrl, router, clearError]
  );

  return (
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
        </div>
      )}
    </form>
  );
};

export default LoginForm;
