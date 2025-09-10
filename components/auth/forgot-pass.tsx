"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils/ui.utils";
import { Loader2, CheckCircle, Mail } from "lucide-react";
import { toast } from "sonner";
import { authApiClient } from "@/lib/api/clients/auth.client";

const schema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
});

type ForgotPasswordFormData = z.infer<typeof schema>;

const ForgotPass = () => {
  const [isPending, startTransition] = React.useTransition();
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [sentEmail, setSentEmail] = React.useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = (data: ForgotPasswordFormData) => {
    startTransition(async () => {
      try {
        // Call your forgot password API
        const response = await authApiClient.forgotPassword({
          email: data.email,
        });

        if (response.success) {
          setIsSuccess(true);
          setSentEmail(data.email);
          toast.success("Password reset instructions sent to your email!");
        } else {
          toast.error(response.error?.message || "Failed to send reset email");
        }
      } catch (err: any) {
        console.error("Forgot password error:", err);
        toast.error(err.message || "An unexpected error occurred");
      }
    });
  };

  const handleSendAnother = () => {
    setIsSuccess(false);
    setSentEmail("");
    reset();
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
            Check Your Email
          </h3>
          <p className="text-sm text-default-600 leading-relaxed">
            We've sent password reset instructions to
          </p>
          <div className="flex items-center justify-center gap-2 text-sm font-medium text-default-900 bg-default-50 rounded-lg py-2 px-4">
            <Mail className="h-4 w-4" />
            {sentEmail}
          </div>
          <p className="text-xs text-default-500 leading-relaxed">
            Please check your inbox and click the reset link. The link will
            expire in 1 hour.
          </p>
        </div>
        <div className="space-y-3 pt-4">
          <Button
            variant="outline"
            onClick={handleSendAnother}
            className="w-full"
          >
            Send to Different Email
          </Button>
          <p className="text-xs text-default-500">
            Didn't receive the email? Check your spam folder or try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

      <Button fullWidth disabled={isPending} type="submit">
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isPending ? "Sending Email..." : "Send Reset Instructions"}
      </Button>

      {/* Development Helper */}
      {process.env.NODE_ENV === "development" && (
        <div className="mt-4 p-3 bg-muted rounded-lg text-xs text-muted-foreground">
          <strong>Dev Info:</strong>
          <br />
          <strong>Email:</strong> {watch("email") || "Not entered"}
        </div>
      )}
    </form>
  );
};

export default ForgotPass;
