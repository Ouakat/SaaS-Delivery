"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils/ui.utils";
import { Loader2, CheckCircle, Mail, AlertCircle, Info } from "lucide-react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth/auth.store";
import { authApiClient } from "@/lib/api/clients/auth/auth.client";
import { getTenantFromUrl } from "@/lib/utils/tenant.utils";
import { Alert, AlertDescription } from "@/components/ui/alert";

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

const ForgotPass = () => {
  const [isPending, startTransition] = React.useTransition();
  const [isSuccess, setIsSuccess] = useState(false);
  const [sentEmail, setSentEmail] = useState("");
  const [resendCount, setResendCount] = useState(0);
  const [resendCooldown, setResendCooldown] = useState(0);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { clearError } = useAuthStore();

  const tenantId = getTenantFromUrl();
  const errorType = searchParams.get("error");

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    reset,
    setValue,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
    },
  });

  // Handle URL parameters
  useEffect(() => {
    clearError();

    // Pre-fill email if provided in URL
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setValue("email", emailParam);
    }

    // Handle error messages
    if (errorType === "invalid-token") {
      toast.error(
        "Invalid or missing reset token. Please request a new password reset."
      );
    } else if (errorType === "token-expired") {
      toast.error("Reset link has expired. Please request a new one.");
    }
  }, [clearError, setValue, searchParams, errorType]);

  // Cooldown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const onSubmit = useCallback(
    (data: ForgotPasswordFormData) => {
      startTransition(async () => {
        try {
          if (!tenantId) {
            toast.error("Tenant not found. Please check your URL.");
            return;
          }

          const response = await authApiClient.forgotPassword({
            email: data.email.trim().toLowerCase(),
          });

          if (response.success) {
            setIsSuccess(true);
            setSentEmail(data.email.trim().toLowerCase());
            setResendCount((prev) => prev + 1);
            toast.success("Password reset instructions sent to your email!");
          } else {
            const errorMessage =
              response.error?.message || "Failed to send reset email";

            // Handle specific error cases
            if (errorMessage.toLowerCase().includes("user not found")) {
              toast.error("No account found with this email address.");
            } else if (errorMessage.toLowerCase().includes("tenant")) {
              toast.error("Invalid tenant. Please check your URL.");
            } else {
              toast.error(errorMessage);
            }
          }
        } catch (err: any) {
          console.error("Forgot password error:", err);

          if (err.message?.toLowerCase().includes("tenant")) {
            toast.error("Invalid tenant. Please check your URL.");
          } else if (err.message?.toLowerCase().includes("rate limit")) {
            toast.error("Too many requests. Please try again later.");
            setResendCooldown(60); // 1 minute cooldown
          } else {
            toast.error(err.message || "Network error. Please try again.");
          }
        }
      });
    },
    [tenantId]
  );

  const handleSendAnother = useCallback(() => {
    if (resendCooldown > 0) return;

    setIsSuccess(false);
    setSentEmail("");
    reset();
  }, [resendCooldown, reset]);

  const handleResend = useCallback(() => {
    if (resendCooldown > 0 || !sentEmail) return;

    startTransition(async () => {
      try {
        const response = await authApiClient.forgotPassword({
          email: sentEmail,
        });

        if (response.success) {
          setResendCount((prev) => prev + 1);
          setResendCooldown(30); // 30 second cooldown for resends
          toast.success("Reset instructions sent again!");
        } else {
          toast.error("Failed to resend email. Please try again.");
        }
      } catch (err: any) {
        console.error("Resend error:", err);
        toast.error("Failed to resend email. Please try again.");
      }
    });
  }, [sentEmail, resendCooldown]);

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
            Check Your Email
          </h3>
          <p className="text-sm text-default-600 leading-relaxed">
            We've sent password reset instructions to:
          </p>
          <div className="flex items-center justify-center gap-2 text-sm font-medium text-default-900 bg-default-50 dark:bg-default-800 rounded-lg py-3 px-4">
            <Mail className="h-4 w-4" />
            {sentEmail}
          </div>
          <div className="text-xs text-default-500 space-y-2">
            <p>Please check your inbox and click the reset link.</p>
            <p>The link will expire in 1 hour for security.</p>
          </div>
        </div>

        <div className="space-y-3 pt-4">
          <div className="flex flex-col gap-3">
            <Button
              variant="outline"
              onClick={handleResend}
              disabled={resendCooldown > 0 || isPending}
              className="w-full"
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {resendCooldown > 0
                ? `Resend in ${resendCooldown}s`
                : "Resend Email"}
            </Button>

            <Button
              variant="ghost"
              onClick={handleSendAnother}
              disabled={resendCooldown > 0}
              className="w-full"
            >
              Send to Different Email
            </Button>
          </div>

          <div className="text-xs text-default-500 space-y-1">
            <p>Didn't receive the email?</p>
            <ul className="text-left space-y-0.5">
              <li>• Check your spam/junk folder</li>
              <li>• Make sure the email address is correct</li>
              <li>• Wait a few minutes for delivery</li>
            </ul>
            {resendCount > 1 && (
              <p className="text-amber-600 dark:text-amber-500 font-medium">
                Email sent {resendCount} times
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Alerts */}
      {errorType && (
        <Alert variant="soft">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {errorType === "invalid-token" &&
              "Invalid or missing reset token. Please request a new password reset."}
            {errorType === "token-expired" &&
              "Your reset link has expired. Please request a new one."}
          </AlertDescription>
        </Alert>
      )}

      {/* Info Alert */}
      <Alert color="default">
        <Info className="h-4 w-4" />
        <AlertDescription className="flex flex-col">
          <div className="font-medium">Password Reset Process</div>
          <div className="text-sm mt-1">
            Enter your email address and we'll send you a secure link to reset
            your password. The link expires in 1 hour.
          </div>
        </AlertDescription>
      </Alert>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
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

        {/* Submit Button */}
        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={isPending || !isValid || resendCooldown > 0}
        >
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {resendCooldown > 0
            ? `Wait ${resendCooldown}s`
            : isPending
            ? "Sending Email..."
            : "Send Reset Instructions"}
        </Button>

        {/* Security Notice */}
        <div className="text-xs text-default-500 bg-default-50 dark:bg-default-800 rounded-lg p-3">
          <p className="font-medium mb-1">Security Notice:</p>
          <p>
            For security reasons, we'll send reset instructions to any valid
            email address in our system, but the reset link will only work for
            existing accounts.
          </p>
        </div>

        {/* Development Helper */}
        {process.env.NODE_ENV === "development" && (
          <div className="mt-4 p-3 bg-muted rounded-lg text-xs text-muted-foreground">
            <strong>Dev Info:</strong>
            <br />
            <strong>Tenant:</strong> {tenantId || "Not detected"}
            <br />
            <strong>Email:</strong> {watch("email") || "Not entered"}
            <br />
            <strong>Error Type:</strong> {errorType || "None"}
            <br />
            <strong>Resend Count:</strong> {resendCount}
          </div>
        )}
      </form>
    </div>
  );
};

export default ForgotPass;
