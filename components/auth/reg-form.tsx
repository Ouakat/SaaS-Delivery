"use client";

import React, { useCallback, useEffect, useState } from "react";
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
import { Loader2, AlertCircle, Info } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth.store";
import { getTenantFromUrl } from "@/lib/utils/tenant.utils";
import { Alert, AlertDescription } from "@/components/ui/alert";

const registerSchema = z
  .object({
    name: z.string().min(2, { message: "Name must be at least 2 characters." }),
    email: z.string().email({ message: "Please enter a valid email address." }),
    password: z
      .string()
      .min(6, { message: "Password must be at least 6 characters." })
      .max(100, { message: "Password must not exceed 100 characters." }),
    confirmPassword: z.string(),
    terms: z.boolean().refine((val) => val === true, {
      message: "You must accept the terms and conditions.",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

const RegForm = () => {
  const [isPending, startTransition] = React.useTransition();
  const router = useRouter();
  const [passwordType, setPasswordType] = useState("password");
  const [confirmPasswordType, setConfirmPasswordType] = useState("password");
  const [showPasswordRequirements, setShowPasswordRequirements] =
    useState(false);

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
    control,
    formState: { errors, isValid },
    setError,
    watch,
    reset,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      terms: false,
    },
  });

  const password = watch("password");

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

      // Set specific field errors based on error message
      if (
        authError.toLowerCase().includes("email") ||
        authError.toLowerCase().includes("already exists")
      ) {
        setError("email", { message: "Email already exists in this tenant" });
      } else if (authError.toLowerCase().includes("password")) {
        setError("password", { message: "Password requirements not met" });
      } else if (authError.toLowerCase().includes("tenant")) {
        toast.error("Invalid tenant. Please check your URL.");
      }
    }
  }, [authError, setError]);

  const togglePasswordType = useCallback(() => {
    setPasswordType((prev) => (prev === "password" ? "text" : "password"));
  }, []);

  const toggleConfirmPasswordType = useCallback(() => {
    setConfirmPasswordType((prev) =>
      prev === "password" ? "text" : "password"
    );
  }, []);

  // Password strength indicator
  const getPasswordStrength = (password: string) => {
    if (!password) return { score: 0, feedback: "" };

    let score = 0;
    const feedback = [];

    if (password.length >= 6) score++;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (password.length < 6) feedback.push("At least 6 characters");
    if (!/[A-Z]/.test(password)) feedback.push("One uppercase letter");
    if (!/[a-z]/.test(password)) feedback.push("One lowercase letter");
    if (!/[0-9]/.test(password)) feedback.push("One number");

    return { score, feedback };
  };

  const passwordStrength = getPasswordStrength(password);

  const onSubmit = useCallback(
    (data: RegisterFormData) => {
      startTransition(async () => {
        try {
          clearError();

          if (!tenantId) {
            toast.error("Tenant not found. Please check your URL.");
            return;
          }

          const result = await registerUser({
            name: data.name,
            email: data.email.trim().toLowerCase(),
            password: data.password,
          });

          if (result.success) {
            // Clear form
            reset();

            // Show success message based on account status
            if (result.accountStatus === "PENDING") {
              toast.success(
                "Registration successful! Waiting for admin approval."
              );

              // Redirect to success page with message
              const searchParams = new URLSearchParams({
                success: "true",
                message:
                  result.message ||
                  "Your account is pending admin approval. You will receive an email once approved.",
              });

              router.push(`/auth/register?${searchParams.toString()}`);
            } else {
              toast.success(result.message || "Registration successful!");
              router.push("/auth/login?message=registration-success");
            }
          }
        } catch (err: any) {
          console.error("Registration error:", err);
          toast.error(err.message || "An unexpected error occurred");
        }
      });
    },
    [registerUser, tenantId, router, clearError, reset]
  );

  return (
    <div className="space-y-6">
      {/* Registration Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <div className="font-medium">Account Registration Process</div>
          <div className="text-sm mt-1">
            After registration, your account will be reviewed by an admin.
            You'll receive an email notification once approved.
          </div>
        </AlertDescription>
      </Alert>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
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
            autoComplete="name"
            className={cn("", {
              "border-destructive focus:border-destructive": errors.name,
            })}
          />
          {errors.name && (
            <p className="text-destructive text-sm" role="alert">
              {errors.name.message}
            </p>
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
              placeholder="Create a password"
              autoComplete="new-password"
              onFocus={() => setShowPasswordRequirements(true)}
              onBlur={() => setShowPasswordRequirements(false)}
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

          {/* Password Strength Indicator */}
          {password && (
            <div className="space-y-2">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className={cn("h-1 flex-1 rounded-full", {
                      "bg-red-500":
                        passwordStrength.score >= level &&
                        passwordStrength.score <= 2,
                      "bg-yellow-500":
                        passwordStrength.score >= level &&
                        passwordStrength.score === 3,
                      "bg-green-500":
                        passwordStrength.score >= level &&
                        passwordStrength.score >= 4,
                      "bg-gray-200": passwordStrength.score < level,
                    })}
                  />
                ))}
              </div>
              {passwordStrength.feedback.length > 0 &&
                (showPasswordRequirements || errors.password) && (
                  <div className="text-xs text-muted-foreground">
                    <div>Password should include:</div>
                    <ul className="list-disc list-inside mt-1 space-y-0.5">
                      {passwordStrength.feedback.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
            </div>
          )}

          {errors.password && (
            <p className="text-destructive text-sm" role="alert">
              {errors.password.message}
            </p>
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
              placeholder="Confirm your password"
              autoComplete="new-password"
              className={cn("pr-10", {
                "border-destructive focus:border-destructive":
                  errors.confirmPassword,
              })}
            />
            <button
              type="button"
              className="absolute top-1/2 -translate-y-1/2 right-3 p-1 text-default-400 hover:text-default-600 focus:outline-none focus:text-default-600"
              onClick={toggleConfirmPasswordType}
              aria-label={
                confirmPasswordType === "password"
                  ? "Show password"
                  : "Hide password"
              }
            >
              <Icon
                icon={
                  confirmPasswordType === "password"
                    ? "heroicons:eye"
                    : "heroicons:eye-slash"
                }
                className="w-5 h-5"
              />
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-destructive text-sm" role="alert">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {/* Terms and Conditions */}
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
              <Link
                href="/terms"
                className="text-primary hover:underline"
                target="_blank"
              >
                Terms and Conditions
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                className="text-primary hover:underline"
                target="_blank"
              >
                Privacy Policy
              </Link>
            </Label>
          </div>
          {errors.terms && (
            <p className="text-destructive text-sm" role="alert">
              {errors.terms.message}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={isPending || !isValid}
        >
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isPending ? "Creating Account..." : "Create Account"}
        </Button>

        {/* Development Helper */}
        {process.env.NODE_ENV === "development" && (
          <div className="mt-4 p-3 bg-muted rounded-lg text-xs text-muted-foreground">
            <strong>Dev Info:</strong> Tenant: {tenantId || "Not detected"}
            <br />
            <strong>Terms accepted:</strong> {watch("terms") ? "Yes" : "No"}
            <br />
            <strong>Password strength:</strong> {passwordStrength.score}/6
            <br />
            <strong>Form valid:</strong> {isValid ? "Yes" : "No"}
          </div>
        )}
      </form>
    </div>
  );
};

export default RegForm;
