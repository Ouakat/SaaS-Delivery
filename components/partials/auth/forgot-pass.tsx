"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Loader2, CheckCircle, Mail } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api/client";

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

const ForgotPass = () => {
  const [isPending, startTransition] = React.useTransition();
  const [isEmailSent, setIsEmailSent] = React.useState(false);
  const [emailSentTo, setEmailSentTo] = React.useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setError,
    getValues,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    startTransition(async () => {
      try {
        const response = await apiClient.post("/auth/forgot-password", {
          email: data.email,
        });

        if (response.success) {
          setEmailSentTo(data.email);
          setIsEmailSent(true);
          toast.success("Password reset email sent successfully!");
        } else {
          throw new Error(response.error || "Failed to send reset email");
        }
      } catch (error: any) {
        console.error("Forgot password error:", error);

        // Handle specific error types
        if (error?.response?.status === 404) {
          setError("email", {
            type: "manual",
            message: "No account found with this email address.",
          });
          toast.error("Email not found");
        } else if (error?.response?.status === 429) {
          setError("email", {
            type: "manual",
            message: "Too many requests. Please wait before trying again.",
          });
          toast.error("Too many attempts. Please wait a moment.");
        } else if (error?.response?.status >= 500) {
          setError("root", {
            type: "manual",
            message: "Server error. Please try again later.",
          });
          toast.error("Server error. Please try again later.");
        } else {
          setError("root", {
            type: "manual",
            message:
              error?.message || "Failed to send reset email. Please try again.",
          });
          toast.error("Failed to send reset email");
        }
      }
    });
  };

  const handleResendEmail = () => {
    const email = getValues("email");
    if (email) {
      onSubmit({ email });
    }
  };

  const handleBackToForm = () => {
    setIsEmailSent(false);
    setEmailSentTo("");
  };

  if (isEmailSent) {
    return (
      <div className="space-y-6 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-default-900">
            Check your email
          </h3>
          <p className="text-default-600 text-sm">
            We've sent a password reset link to:
          </p>
          <p className="font-medium text-default-900">{emailSentTo}</p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
          <div className="flex items-start space-x-3">
            <Mail className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Didn't receive the email?</p>
              <ul className="space-y-1 text-xs">
                <li>• Check your spam or junk folder</li>
                <li>• Make sure the email address is correct</li>
                <li>• Wait a few minutes for the email to arrive</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            onClick={handleResendEmail}
            variant="outline"
            disabled={isPending}
            className="w-full"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Resend Email
          </Button>

          <Button
            onClick={handleBackToForm}
            variant="ghost"
            className="w-full text-sm"
          >
            Try a different email address
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
          id="email"
          type="email"
          placeholder="Enter your email address"
          {...register("email")}
          disabled={isPending}
          autoComplete="email"
          autoFocus
          className={cn("h-12 text-sm", {
            "border-destructive focus:border-destructive": errors.email,
          })}
        />
        {errors.email && (
          <p className="text-destructive text-sm mt-1">
            {errors.email.message}
          </p>
        )}
        <p className="text-xs text-default-500">
          We'll send you a link to reset your password
        </p>
      </div>

      <Button
        type="submit"
        fullWidth
        disabled={isPending || !isValid}
        className="h-12"
      >
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isPending ? "Sending..." : "Send Reset Email"}
      </Button>
    </form>
  );
};

export default ForgotPass;
