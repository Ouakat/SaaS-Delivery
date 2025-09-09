"use client";
import React from "react";
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
import { useRouter } from "@/components/navigation";
import { useAuthStore } from "@/lib/stores/auth.store";
import { getTenantFromUrl } from "@/lib/utils/tenant.utils";
import { useEffect } from "react";

const schema = z.object({
  email: z.string().email({ message: "Your email is invalid." }),
  password: z
    .string()
    .min(4, { message: "Password must be at least 4 characters." }),
});

type LoginFormData = z.infer<typeof schema>;

const LoginForm = () => {
  const [isPending, startTransition] = React.useTransition();
  const router = useRouter();
  const [passwordType, setPasswordType] = React.useState("password");
  const [rememberMe, setRememberMe] = React.useState(false);

  // Auth store
  const {
    login,
    isAuthenticated,
    error: authError,
    clearError,
  } = useAuthStore();

  // Get current tenant
  const tenantId = getTenantFromUrl();

  const togglePasswordType = () => {
    setPasswordType((prev) => (prev === "password" ? "text" : "password"));
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(schema),
    mode: "all",
    defaultValues: {
      email: "network@codeshaper.net",
      password: "password",
    },
  });

  // Clear errors when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      // Get redirect URL from query params or default to dashboard
      const urlParams = new URLSearchParams(window.location.search);
      const redirectTo = urlParams.get("redirect") || "/dashboard";
      router.push(redirectTo);
    }
  }, [isAuthenticated, router]);

  // Handle auth errors
  useEffect(() => {
    if (authError) {
      toast.error(authError);

      // Set form-level errors based on auth error type
      if (authError.includes("email") || authError.includes("user not found")) {
        setError("email", { message: "Invalid email address" });
      } else if (
        authError.includes("password") ||
        authError.includes("credentials")
      ) {
        setError("password", { message: "Invalid password" });
      }
    }
  }, [authError, setError]);

  const onSubmit = (data: LoginFormData) => {
    startTransition(async () => {
      try {
        clearError();

        // Validate tenant for multi-tenant setup
        if (!tenantId) {
          toast.error("Tenant not found. Please check your URL.");
          return;
        }

        const result = await login({
          email: data.email,
          password: data.password,
        });
        
        console.log("🚀 ~ onSubmit ~ result:", result)

        if (result.success) {
          toast.success("Successfully logged in");

          // Handle remember me functionality
          if (rememberMe) {
            localStorage.setItem("remember_email", data.email);
          } else {
            localStorage.removeItem("remember_email");
          }

          // Get redirect URL from query params or default to dashboard
          const urlParams = new URLSearchParams(window.location.search);
          const redirectTo = urlParams.get("redirect") || "/dashboard";

          // Add a small delay to ensure state is updated
          setTimeout(() => {
            router.push(redirectTo);
          }, 100);
        } else {
          // Error handling is done in useEffect above
          console.error("Login failed:", result.error);
        }
      } catch (err: any) {
        console.error("Login error:", err);
        toast.error(err.message || "An unexpected error occurred");
      }
    });
  };

  // Load remembered email on component mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem("remember_email");
    if (rememberedEmail) {
      setRememberMe(true);
      // You could also set the email field here if needed
    }
  }, []);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-5 2xl:mt-7 space-y-4">
      {/* Email Field */}
      <div className="space-y-2">
        <Label htmlFor="email" className="font-medium text-default-600">
          Email
        </Label>
        <Input
          size="lg"
          disabled={isPending}
          {...register("email")}
          type="email"
          id="email"
          placeholder="Enter your email"
          className={cn("", {
            "border-destructive": errors.email,
          })}
        />
        {errors.email && (
          <div className="text-destructive mt-2 text-sm">
            {errors.email.message}
          </div>
        )}
      </div>

      {/* Password Field */}
      <div className="mt-3.5 space-y-2">
        <Label htmlFor="password" className="mb-2 font-medium text-default-600">
          Password
        </Label>
        <div className="relative">
          <Input
            size="lg"
            disabled={isPending}
            {...register("password")}
            type={passwordType}
            id="password"
            className={cn("peer", {
              "border-destructive": errors.password,
            })}
            placeholder="Enter your password"
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 ltr:right-4 rtl:left-4 cursor-pointer"
            onClick={togglePasswordType}
          >
            {passwordType === "password" ? (
              <Icon icon="heroicons:eye" className="w-5 h-5 text-default-400" />
            ) : (
              <Icon
                icon="heroicons:eye-slash"
                className="w-5 h-5 text-default-400"
              />
            )}
          </div>
        </div>
        {errors.password && (
          <div className="text-destructive mt-2 text-sm">
            {errors.password.message}
          </div>
        )}
      </div>

      {/* Remember Me & Forgot Password */}
      <div className="flex justify-between">
        <div className="flex gap-2 items-center">
          <Checkbox
            id="remember"
            checked={rememberMe}
            onCheckedChange={(checked) => setRememberMe(checked as boolean)}
          />
          <Label htmlFor="remember">Keep Me Signed In</Label>
        </div>
        <Link
          href="/auth/forgot-password"
          className="text-sm text-default-800 dark:text-default-400 leading-6 font-medium hover:underline"
        >
          Forgot Password?
        </Link>
      </div>

      {/* Submit Button */}
      <Button fullWidth disabled={isPending} type="submit">
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isPending ? "Signing In..." : "Sign In"}
      </Button>

      {/* Development Helper */}
      {process.env.NODE_ENV === "development" && (
        <div className="mt-4 p-3 bg-muted rounded-lg text-xs text-muted-foreground">
          <strong>Dev Info:</strong> Tenant: {tenantId || "Not detected"}
        </div>
      )}
    </form>
  );
};

export default LoginForm;
