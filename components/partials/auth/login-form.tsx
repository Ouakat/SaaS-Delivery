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
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "@/components/navigation";
import { useAuthStore } from "@/lib/stores/auth";
import { useTenantStore } from "@/lib/stores/tenant";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean().default(false),
});

type LoginFormData = z.infer<typeof loginSchema>;

const LoginForm = () => {
  const [isPending, startTransition] = React.useTransition();
  const [passwordVisible, setPasswordVisible] = React.useState(false);
  const router = useRouter();
  const { login } = useAuthStore();
  const { setTenant, fetchTenants } = useTenantStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const onSubmit = async (data: LoginFormData) => {
    startTransition(async () => {
      try {
        const success = await login(data.email, data.password);

        if (success) {
          // Fetch user's tenants after successful login
          await fetchTenants();

          toast.success("Welcome back! Redirecting to dashboard...");

          // Small delay to show the success message
          setTimeout(() => {
            router.push("/dashboard/analytics");
          }, 1000);
        } else {
          setError("root", {
            type: "manual",
            message:
              "Invalid credentials. Please check your email and password.",
          });
          toast.error("Login failed. Please check your credentials.");
        }
      } catch (error: any) {
        console.error("Login error:", error);

        // Handle specific error types
        if (error?.response?.status === 401) {
          setError("root", {
            type: "manual",
            message:
              "Invalid credentials. Please check your email and password.",
          });
          toast.error("Invalid credentials");
        } else if (error?.response?.status === 429) {
          setError("root", {
            type: "manual",
            message: "Too many login attempts. Please try again later.",
          });
          toast.error("Too many attempts. Please try again later.");
        } else if (error?.response?.status >= 500) {
          setError("root", {
            type: "manual",
            message: "Server error. Please try again later.",
          });
          toast.error("Server error. Please try again later.");
        } else {
          setError("root", {
            type: "manual",
            message: error?.message || "An unexpected error occurred.",
          });
          toast.error("Login failed. Please try again.");
        }
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-5 2xl:mt-7 space-y-4">
      {errors.root && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
          {errors.root.message}
        </div>
      )}

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
          <p className="text-destructive text-sm mt-1">
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="font-medium text-default-600">
          Password
        </Label>
        <div className="relative">
          <Input
            size="lg"
            disabled={isPending}
            {...register("password")}
            type={passwordVisible ? "text" : "password"}
            id="password"
            placeholder="Enter your password"
            autoComplete="current-password"
            className={cn("pr-12", {
              "border-destructive focus:border-destructive": errors.password,
            })}
          />
          <button
            type="button"
            className="absolute top-1/2 -translate-y-1/2 ltr:right-4 rtl:left-4 cursor-pointer hover:text-primary transition-colors"
            onClick={togglePasswordVisibility}
            disabled={isPending}
          >
            {passwordVisible ? (
              <Icon
                icon="heroicons:eye-slash"
                className="w-5 h-5 text-default-400"
              />
            ) : (
              <Icon icon="heroicons:eye" className="w-5 h-5 text-default-400" />
            )}
          </button>
        </div>
        {errors.password && (
          <p className="text-destructive text-sm mt-1">
            {errors.password.message}
          </p>
        )}
      </div>

      <div className="flex justify-between items-center">
        <div className="flex gap-2 items-center">
          <Checkbox
            id="rememberMe"
            {...register("rememberMe")}
            disabled={isPending}
          />
          <Label htmlFor="rememberMe" className="text-sm cursor-pointer">
            Keep me signed in
          </Label>
        </div>
        <Link
          href="/auth/forgot-password"
          className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
        >
          Forgot Password?
        </Link>
      </div>

      <Button
        type="submit"
        fullWidth
        disabled={isPending || !isValid}
        className="h-12"
      >
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isPending ? "Signing in..." : "Sign In"}
      </Button>
    </form>
  );
};

export default LoginForm;
