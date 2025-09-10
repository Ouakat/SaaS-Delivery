"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/routing";
import { Icon } from "@/components/ui/icon";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils/ui.utils";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth.store";
import { getTenantFromUrl } from "@/lib/utils/tenant.utils";
import { useEffect } from "react";

const schema = z
  .object({
    name: z.string().min(2, { message: "Name must be at least 2 characters." }),
    email: z.string().email({ message: "Please enter a valid email address." }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters." })
      .regex(/[A-Z]/, {
        message: "Password must contain at least one uppercase letter.",
      })
      .regex(/[a-z]/, {
        message: "Password must contain at least one lowercase letter.",
      })
      .regex(/[0-9]/, {
        message: "Password must contain at least one number.",
      }),
    confirmPassword: z.string(),
    terms: z.boolean().refine((val) => val === true, {
      message: "You must accept the terms and conditions.",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof schema>;

const RegForm = () => {
  const [isPending, startTransition] = React.useTransition();
  const router = useRouter();
  const [passwordType, setPasswordType] = React.useState("password");
  const [confirmPasswordType, setConfirmPasswordType] =
    React.useState("password");

  const {
    register: registerUser,
    error: authError,
    clearError,
    isAuthenticated,
  } = useAuthStore();

  const tenantId = getTenantFromUrl();

  const {
    register,
    handleSubmit,
    control, // Add control for Controller
    formState: { errors },
    setError,
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      terms: false,
    },
  });

  // Clear errors when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  // Handle auth errors
  useEffect(() => {
    if (authError) {
      toast.error(authError);

      if (authError.includes("email") || authError.includes("already exists")) {
        setError("email", { message: "Email already exists" });
      } else if (authError.includes("password")) {
        setError("password", { message: "Password requirements not met" });
      }
    }
  }, [authError, setError]);

  const togglePasswordType = () => {
    setPasswordType((prev) => (prev === "password" ? "text" : "password"));
  };

  const toggleConfirmPasswordType = () => {
    setConfirmPasswordType((prev) =>
      prev === "password" ? "text" : "password"
    );
  };

  const onSubmit = (data: RegisterFormData) => {
    console.log("Form data:", data); // Debug log
    startTransition(async () => {
      try {
        clearError();

        if (!tenantId) {
          toast.error("Tenant not found. Please check your URL.");
          return;
        }

        // Fixed: Use the correct API structure
        const result = await registerUser({
          name: data.name, // Single name field as per API
          email: data.email,
          password: data.password,
        });

        if (result.success) {
          toast.success("Account created successfully! Please sign in.");
          router.push("/auth/login?message=registration-success");
        }
      } catch (err: any) {
        console.error("Registration error:", err);
        toast.error(err.message || "An unexpected error occurred");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Name Field */}
      <div className="space-y-2">
        <Label htmlFor="name" className="font-medium text-default-600">
          Full Name
        </Label>
        <Input
          size="lg"
          disabled={isPending}
          {...register("name")}
          type="text"
          id="name"
          placeholder="Enter your full name"
          className={cn("", {
            "border-destructive": errors.name,
          })}
        />
        {errors.name && (
          <div className="text-destructive mt-2 text-sm">
            {errors.name.message}
          </div>
        )}
      </div>

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
          placeholder="Enter your email address"
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
            className={cn("peer", {
              "border-destructive": errors.password,
            })}
            placeholder="Create a strong password"
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

      {/* Confirm Password Field */}
      <div className="space-y-2">
        <Label
          htmlFor="confirmPassword"
          className="font-medium text-default-600"
        >
          Confirm Password
        </Label>
        <div className="relative">
          <Input
            size="lg"
            disabled={isPending}
            {...register("confirmPassword")}
            type={confirmPasswordType}
            id="confirmPassword"
            className={cn("peer", {
              "border-destructive": errors.confirmPassword,
            })}
            placeholder="Confirm your password"
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 ltr:right-4 rtl:left-4 cursor-pointer"
            onClick={toggleConfirmPasswordType}
          >
            {confirmPasswordType === "password" ? (
              <Icon icon="heroicons:eye" className="w-5 h-5 text-default-400" />
            ) : (
              <Icon
                icon="heroicons:eye-slash"
                className="w-5 h-5 text-default-400"
              />
            )}
          </div>
        </div>
        {errors.confirmPassword && (
          <div className="text-destructive mt-2 text-sm">
            {errors.confirmPassword.message}
          </div>
        )}
      </div>

      {/* Terms and Conditions - Using Controller for proper integration */}
      <div className="space-y-2">
        <div className="flex gap-2 items-start">
          <Controller
            name="terms"
            control={control}
            render={({ field }) => (
              <Checkbox
                id="terms"
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={isPending}
                className={cn("mt-0.5", {
                  "border-destructive": errors.terms,
                })}
              />
            )}
          />
          <Label htmlFor="terms" className="text-sm leading-relaxed">
            I accept the{" "}
            <Link href="/terms" className="text-primary hover:underline">
              Terms and Conditions
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
          </Label>
        </div>
        {errors.terms && (
          <div className="text-destructive mt-2 text-sm">
            {errors.terms.message}
          </div>
        )}
      </div>

      {/* Submit Button */}
      <Button fullWidth disabled={isPending} type="submit">
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isPending ? "Creating Account..." : "Create Account"}
      </Button>

      {/* Development Helper */}
      {process.env.NODE_ENV === "development" && (
        <div className="mt-4 p-3 bg-muted rounded-lg text-xs text-muted-foreground">
          <strong>Dev Info:</strong> Tenant: {tenantId || "Not detected"}
          <br />
          <strong>Terms accepted:</strong> {watch("terms") ? "Yes" : "No"}
        </div>
      )}
    </form>
  );
};

export default RegForm;
