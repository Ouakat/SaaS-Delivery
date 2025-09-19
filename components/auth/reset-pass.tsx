"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icon } from "@/components/ui/icon";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils/ui.utils";
import {
  Loader2,
  CheckCircle,
  Shield,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth/auth.store";
import { authApiClient } from "@/lib/api/clients/auth/auth.client";
import { Alert, AlertDescription } from "@/components/ui/alert";

const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .max(100, "Password must not exceed 100 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

interface ResetPasswordProps {
  token: string;
}

const ResetPass = ({ token }: ResetPasswordProps) => {
  const [isPending, startTransition] = React.useTransition();
  const [isSuccess, setIsSuccess] = useState(false);
  const [passwordType, setPasswordType] = useState("password");
  const [confirmPasswordType, setConfirmPasswordType] = useState("password");
  const [tokenValidated, setTokenValidated] = useState(false);
  const [tokenError, setTokenError] = useState("");
  const [showPasswordRequirements, setShowPasswordRequirements] =
    useState(false);

  const router = useRouter();
  const { clearError } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    reset,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onChange",
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const password = watch("newPassword");

  // Validate token on mount
  useEffect(() => {
    clearError();

    if (!token) {
      setTokenError("No reset token provided");
      return;
    }

    // Basic token validation (you might want to call an endpoint to validate)
    try {
      // Simple validation - check if token looks valid
      if (token.length < 16) {
        setTokenError("Invalid reset token format");
        return;
      }

      setTokenValidated(true);
    } catch (error) {
      setTokenError("Invalid reset token");
    }
  }, [token, clearError]);

  const togglePasswordType = useCallback(() => {
    setPasswordType((prev) => (prev === "password" ? "text" : "password"));
  }, []);

  const toggleConfirmPasswordType = useCallback(() => {
    setConfirmPasswordType((prev) =>
      prev === "password" ? "text" : "password"
    );
  }, []);

  // Password strength indicator
  const getPasswordStrength = useCallback((password: string) => {
    if (!password) return { score: 0, feedback: [] };

    let score = 0;
    const feedback = [];

    if (password.length >= 6) score++;
    else feedback.push("At least 6 characters");

    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    else feedback.push("One uppercase letter");

    if (/[a-z]/.test(password)) score++;
    else feedback.push("One lowercase letter");

    if (/[0-9]/.test(password)) score++;
    else feedback.push("One number");

    if (/[^A-Za-z0-9]/.test(password)) score++;

    return { score, feedback };
  }, []);

  const passwordStrength = getPasswordStrength(password);

  const onSubmit = useCallback(
    (data: ResetPasswordFormData) => {
      startTransition(async () => {
        try {
          const response = await authApiClient.resetPassword({
            token,
            newPassword: data.newPassword,
          });

          if (response.success) {
            setIsSuccess(true);
            reset();
            toast.success("Password reset successfully!");

            // Redirect to login after a short delay
            setTimeout(() => {
              router.push("/auth/login?message=password-reset-success");
            }, 3000);
          } else {
            const errorMessage =
              response.error?.message || "Failed to reset password";

            // Handle specific error cases
            if (
              errorMessage.toLowerCase().includes("token") ||
              errorMessage.toLowerCase().includes("expired") ||
              errorMessage.toLowerCase().includes("invalid")
            ) {
              toast.error(
                "Reset link has expired or is invalid. Please request a new one."
              );
              setTimeout(() => {
                router.push("/auth/forgot-password?error=token-expired");
              }, 2000);
            } else if (errorMessage.toLowerCase().includes("password")) {
              toast.error(
                "Password does not meet requirements. Please try again."
              );
            } else {
              toast.error(errorMessage);
            }
          }
        } catch (err: any) {
          console.error("Reset password error:", err);

          if (
            err.message?.includes("token") ||
            err.message?.includes("expired") ||
            err.message?.includes("invalid")
          ) {
            toast.error(
              "Reset link has expired or is invalid. Please request a new one."
            );
            setTimeout(() => {
              router.push("/auth/forgot-password?error=token-expired");
            }, 2000);
          } else if (
            err.message?.includes("network") ||
            err.message?.includes("fetch")
          ) {
            toast.error(
              "Network error. Please check your connection and try again."
            );
          } else {
            toast.error(err.message || "An unexpected error occurred");
          }
        }
      });
    },
    [token, router, reset]
  );

  // Show token error
  if (tokenError) {
    return (
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-3">
            <AlertCircle className="h-12 w-12 text-red-600" />
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-xl font-semibold text-default-900">
            Invalid Reset Link
          </h3>
          <p className="text-sm text-default-600 leading-relaxed">
            {tokenError}. The link may have expired or been used already.
          </p>
        </div>

        <div className="space-y-3 pt-4">
          <Button
            onClick={() => router.push("/auth/forgot-password")}
            className="w-full"
          >
            Request New Reset Link
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/auth/login")}
            className="w-full"
          >
            Back to Login
          </Button>
        </div>
      </div>
    );
  }

  // Show loading while validating token
  if (!tokenValidated) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Validating reset link...</p>
        </div>
      </div>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-3">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-xl font-semibold text-default-900">
            Password Reset Successful!
          </h3>
          <p className="text-sm text-default-600 leading-relaxed">
            Your password has been successfully updated. You can now sign in
            with your new password.
          </p>
        </div>

        <div className="space-y-3 pt-4">
          <div className="flex items-center justify-center gap-2 text-sm text-default-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Redirecting to sign in in 3 seconds...
          </div>
          <Button onClick={() => router.push("/auth/login")} className="w-full">
            Sign In Now
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Security Notice */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <div className="font-medium">Security Notice</div>
          <div className="text-sm mt-1">
            Choose a strong password that you haven't used before. This reset
            link will expire after use or in 1 hour.
          </div>
        </AlertDescription>
      </Alert>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        {/* New Password Field */}
        <div className="space-y-2">
          <Label htmlFor="newPassword" className="font-medium text-default-600">
            New Password
          </Label>
          <div className="relative">
            <Input
              size="lg"
              disabled={isPending}
              {...register("newPassword")}
              type={passwordType}
              id="newPassword"
              placeholder="Enter your new password"
              autoComplete="new-password"
              onFocus={() => setShowPasswordRequirements(true)}
              onBlur={() => setShowPasswordRequirements(false)}
              className={cn("pr-10", {
                "border-destructive focus:border-destructive":
                  errors.newPassword,
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
              {passwordType === "password" ? (
                <Eye className="w-5 h-5" />
              ) : (
                <EyeOff className="w-5 h-5" />
              )}
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
                      "bg-gray-200 dark:bg-gray-700":
                        passwordStrength.score < level,
                    })}
                  />
                ))}
              </div>

              {passwordStrength.feedback.length > 0 &&
                (showPasswordRequirements || errors.newPassword) && (
                  <div className="text-xs text-muted-foreground">
                    <div className="font-medium mb-1">
                      Password requirements:
                    </div>
                    <ul className="space-y-0.5">
                      {passwordStrength.feedback.map((item, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
            </div>
          )}

          {errors.newPassword && (
            <p className="text-destructive text-sm" role="alert">
              {errors.newPassword.message}
            </p>
          )}
        </div>

        {/* Confirm Password Field */}
        <div className="space-y-2">
          <Label
            htmlFor="confirmPassword"
            className="font-medium text-default-600"
          >
            Confirm New Password
          </Label>
          <div className="relative">
            <Input
              size="lg"
              disabled={isPending}
              {...register("confirmPassword")}
              type={confirmPasswordType}
              id="confirmPassword"
              placeholder="Confirm your new password"
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
              {confirmPasswordType === "password" ? (
                <Eye className="w-5 h-5" />
              ) : (
                <EyeOff className="w-5 h-5" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-destructive text-sm" role="alert">
              {errors.confirmPassword.message}
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
          {isPending ? "Updating Password..." : "Update Password"}
        </Button>

        {/* Security Info */}
        <div className="text-xs text-default-500 bg-default-50 dark:bg-default-800 rounded-lg p-3 space-y-1">
          <p className="font-medium">Security Tips:</p>
          <ul className="space-y-0.5">
            <li>• Use a unique password you haven't used elsewhere</li>
            <li>• Include a mix of letters, numbers, and symbols</li>
            <li>• Avoid personal information like names or dates</li>
            <li>• Consider using a password manager</li>
          </ul>
        </div>

        {/* Development Helper */}
        {process.env.NODE_ENV === "development" && (
          <div className="mt-4 p-3 bg-muted rounded-lg text-xs text-muted-foreground">
            <strong>Dev Info:</strong>
            <br />
            <strong>Token:</strong>{" "}
            {token ? `${token.substring(0, 20)}...` : "No token"}
            <br />
            <strong>Password Length:</strong> {password?.length || 0}
            <br />
            <strong>Password Strength:</strong> {passwordStrength.score}/6
            <br />
            <strong>Form Valid:</strong> {isValid ? "Yes" : "No"}
          </div>
        )}
      </form>
    </div>
  );
};

export default ResetPass;
