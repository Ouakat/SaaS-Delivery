"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icon } from "@/components/ui/icon";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils/ui.utils";
import { Loader2, CheckCircle, Shield } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { authApiClient } from "@/lib/api/clients/auth.client";

const schema = z
  .object({
    newPassword: z
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
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type ResetPasswordFormData = z.infer<typeof schema>;

interface ResetPasswordProps {
  token: string;
}

const ResetPass = ({ token }: ResetPasswordProps) => {
  const [isPending, startTransition] = React.useTransition();
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [passwordType, setPasswordType] = React.useState("password");
  const [confirmPasswordType, setConfirmPasswordType] =
    React.useState("password");
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const togglePasswordType = () => {
    setPasswordType((prev) => (prev === "password" ? "text" : "password"));
  };

  const toggleConfirmPasswordType = () => {
    setConfirmPasswordType((prev) =>
      prev === "password" ? "text" : "password"
    );
  };

  const onSubmit = (data: ResetPasswordFormData) => {
    startTransition(async () => {
      try {
        // Call your reset password API
        const response = await authApiClient.resetPassword({
          token,
          newPassword: data.newPassword,
        });

        if (response.success) {
          setIsSuccess(true);
          toast.success("Password reset successfully!");

          // Redirect to login after a short delay
          setTimeout(() => {
            router.push("/auth/login?message=password-reset-success");
          }, 2000);
        } else {
          toast.error(response.error?.message || "Failed to reset password");
        }
      } catch (err: any) {
        console.error("Reset password error:", err);
        if (
          err.message?.includes("token") ||
          err.message?.includes("expired")
        ) {
          toast.error("Reset link has expired. Please request a new one.");
          router.push("/auth/forgot-password?error=token-expired");
        } else {
          toast.error(err.message || "An unexpected error occurred");
        }
      }
    });
  };

  if (isSuccess) {
    return (
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <div className="rounded-full bg-green-100 p-3">
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
            Redirecting to sign in...
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Security Notice */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-800">
          <p className="font-medium mb-1">Security Notice</p>
          <p>
            Choose a strong password that you haven't used before. This link
            will expire after use.
          </p>
        </div>
      </div>

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
            className={cn("peer", {
              "border-destructive": errors.newPassword,
            })}
            placeholder="Enter your new password"
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
        {errors.newPassword && (
          <div className="text-destructive mt-2 text-sm">
            {errors.newPassword.message}
          </div>
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
            className={cn("peer", {
              "border-destructive": errors.confirmPassword,
            })}
            placeholder="Confirm your new password"
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

      {/* Password Strength Indicator */}
      {watch("newPassword") && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-default-600">
            Password Requirements:
          </div>
          <div className="space-y-1 text-xs">
            <div
              className={cn("flex items-center gap-2", {
                "text-green-600": watch("newPassword").length >= 8,
                "text-default-500": watch("newPassword").length < 8,
              })}
            >
              <div
                className={cn("w-2 h-2 rounded-full", {
                  "bg-green-600": watch("newPassword").length >= 8,
                  "bg-default-300": watch("newPassword").length < 8,
                })}
              />
              At least 8 characters
            </div>
            <div
              className={cn("flex items-center gap-2", {
                "text-green-600": /[A-Z]/.test(watch("newPassword")),
                "text-default-500": !/[A-Z]/.test(watch("newPassword")),
              })}
            >
              <div
                className={cn("w-2 h-2 rounded-full", {
                  "bg-green-600": /[A-Z]/.test(watch("newPassword")),
                  "bg-default-300": !/[A-Z]/.test(watch("newPassword")),
                })}
              />
              One uppercase letter
            </div>
            <div
              className={cn("flex items-center gap-2", {
                "text-green-600": /[a-z]/.test(watch("newPassword")),
                "text-default-500": !/[a-z]/.test(watch("newPassword")),
              })}
            >
              <div
                className={cn("w-2 h-2 rounded-full", {
                  "bg-green-600": /[a-z]/.test(watch("newPassword")),
                  "bg-default-300": !/[a-z]/.test(watch("newPassword")),
                })}
              />
              One lowercase letter
            </div>
            <div
              className={cn("flex items-center gap-2", {
                "text-green-600": /[0-9]/.test(watch("newPassword")),
                "text-default-500": !/[0-9]/.test(watch("newPassword")),
              })}
            >
              <div
                className={cn("w-2 h-2 rounded-full", {
                  "bg-green-600": /[0-9]/.test(watch("newPassword")),
                  "bg-default-300": !/[0-9]/.test(watch("newPassword")),
                })}
              />
              One number
            </div>
          </div>
        </div>
      )}

      <Button fullWidth disabled={isPending} type="submit">
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isPending ? "Updating Password..." : "Update Password"}
      </Button>

      {/* Development Helper */}
      {process.env.NODE_ENV === "development" && (
        <div className="mt-4 p-3 bg-muted rounded-lg text-xs text-muted-foreground">
          <strong>Dev Info:</strong>
          <br />
          <strong>Token:</strong>{" "}
          {token ? `${token.substring(0, 20)}...` : "No token"}
          <br />
          <strong>Password Length:</strong> {watch("newPassword")?.length || 0}
        </div>
      )}
    </form>
  );
};

export default ResetPass;
