"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils/ui.utils";
import { Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { authApiClient } from "@/lib/api/clients/auth.client";
import { getTenantFromUrl } from "@/lib/utils/tenant.utils";

const schema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
});

type ForgotPasswordFormData = z.infer<typeof schema>;

const ForgotPass = () => {
  const [isPending, startTransition] = React.useTransition();
  const [isSuccess, setIsSuccess] = React.useState(false);

  const tenantId = getTenantFromUrl();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
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
        if (!tenantId) {
          toast.error("Tenant not found. Please check your URL.");
          return;
        }

        // Call your forgot password API
        const response = await authApiClient.forgotPassword({
          email: data.email,
        });

        if (response.success) {
          setIsSuccess(true);
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

  if (isSuccess) {
    return (
      <div className="space-y-4 text-center">
        <div className="flex justify-center">
          <CheckCircle className="h-16 w-16 text-green-500" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-medium text-default-900">
            Email Sent Successfully!
          </h3>
          <p className="text-sm text-default-500">
            We've sent password reset instructions to your email address. Please
            check your inbox and follow the link to reset your password.
          </p>
        </div>
        <div className="pt-4">
          <Button
            variant="outline"
            onClick={() => setIsSuccess(false)}
            className="w-full"
          >
            Send Another Email
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
        {isPending ? "Sending Email..." : "Send Recovery Email"}
      </Button>

      {/* Development Helper */}
      {process.env.NODE_ENV === "development" && (
        <div className="mt-4 p-3 bg-muted rounded-lg text-xs text-muted-foreground">
          <strong>Dev Info:</strong> Tenant: {tenantId || "Not detected"}
          <br />
          <strong>Email:</strong> {watch("email") || "Not entered"}
        </div>
      )}
    </form>
  );
};

export default ForgotPass;
