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
import { apiClient } from "@/lib/api/client";

const registerSchema = z
  .object({
    name: z
      .string()
      .min(1, "Name is required")
      .min(2, "Name must be at least 2 characters")
      .max(50, "Name must be less than 50 characters"),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Please enter a valid email address"),
    password: z
      .string()
      .min(1, "Password is required")
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: "You must accept the terms and conditions",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

const RegForm = () => {
  const [isPending, startTransition] = React.useTransition();
  const [passwordVisible, setPasswordVisible] = React.useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] =
    React.useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setError,
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  });

  const password = watch("password");

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const toggleConfirmPasswordVisibility = () => {
    setConfirmPasswordVisible(!confirmPasswordVisible);
  };

  // Password strength indicator
  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, text: "" };

    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    const strengthLevels = [
      { strength: 0, text: "Very Weak", color: "bg-red-500" },
      { strength: 1, text: "Weak", color: "bg-red-400" },
      { strength: 2, text: "Fair", color: "bg-yellow-500" },
      { strength: 3, text: "Good", color: "bg-blue-500" },
      { strength: 4, text: "Strong", color: "bg-green-500" },
      { strength: 5, text: "Very Strong", color: "bg-green-600" },
    ];

    return strengthLevels[score];
  };

  const passwordStrength = getPasswordStrength(password);

  const onSubmit = async (data: RegisterFormData) => {
    startTransition(async () => {
      try {
        const response = await apiClient.register({
          name: data.name,
          email: data.email,
          password: data.password,
          role: "merchant", // Default role for registration
        });

        if (response.success) {
          toast.success(
            "Account created successfully! Please check your email to verify your account."
          );

          // Redirect to login page after a short delay
          setTimeout(() => {
            router.push("/auth/login");
          }, 2000);
        } else {
          throw new Error(response.error || "Registration failed");
        }
      } catch (error: any) {
        console.error("Registration error:", error);

        // Handle specific error types
        if (error?.response?.status === 409) {
          setError("email", {
            type: "manual",
            message:
              "This email is already registered. Please use a different email or try logging in.",
          });
          toast.error("Email already exists");
        } else if (error?.response?.status === 422) {
          setError("root", {
            type: "manual",
            message: "Please check your information and try again.",
          });
          toast.error("Invalid information provided");
        } else if (error?.response?.status >= 500) {
          setError("root", {
            type: "manual",
            message: "Server error. Please try again later.",
          });
          toast.error("Server error. Please try again later.");
        } else {
          setError("root", {
            type: "manual",
            message: error?.message || "Registration failed. Please try again.",
          });
          toast.error("Registration failed. Please try again.");
        }
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {errors.root && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
          {errors.root.message}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name" className="font-medium text-default-600">
          Full Name
        </Label>
        <Input
          id="name"
          placeholder="Enter your full name"
          {...register("name")}
          size="lg"
          disabled={isPending}
          autoComplete="name"
          className={cn("", {
            "border-destructive focus:border-destructive": errors.name,
          })}
        />
        {errors.name && (
          <p className="text-destructive text-sm mt-1">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="font-medium text-default-600">
          Email Address
        </Label>
        <Input
          id="email"
          placeholder="Enter your email"
          {...register("email")}
          type="email"
          size="lg"
          disabled={isPending}
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
            id="password"
            type={passwordVisible ? "text" : "password"}
            placeholder="Create a strong password"
            {...register("password")}
            size="lg"
            disabled={isPending}
            autoComplete="new-password"
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

        {password && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                  style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                />
              </div>
              <span className="text-xs text-default-600">
                {passwordStrength.text}
              </span>
            </div>
          </div>
        )}

        {errors.password && (
          <p className="text-destructive text-sm mt-1">
            {errors.password.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="confirmPassword"
          className="font-medium text-default-600"
        >
          Confirm Password
        </Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={confirmPasswordVisible ? "text" : "password"}
            placeholder="Confirm your password"
            {...register("confirmPassword")}
            size="lg"
            disabled={isPending}
            autoComplete="new-password"
            className={cn("pr-12", {
              "border-destructive focus:border-destructive":
                errors.confirmPassword,
            })}
          />
          <button
            type="button"
            className="absolute top-1/2 -translate-y-1/2 ltr:right-4 rtl:left-4 cursor-pointer hover:text-primary transition-colors"
            onClick={toggleConfirmPasswordVisibility}
            disabled={isPending}
          >
            {confirmPasswordVisible ? (
              <Icon
                icon="heroicons:eye-slash"
                className="w-5 h-5 text-default-400"
              />
            ) : (
              <Icon icon="heroicons:eye" className="w-5 h-5 text-default-400" />
            )}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-destructive text-sm mt-1">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      <div className="flex items-start space-x-2">
        <Checkbox
          id="acceptTerms"
          {...register("acceptTerms")}
          disabled={isPending}
          className={cn("mt-1", {
            "border-destructive": errors.acceptTerms,
          })}
        />
        <div className="flex-1">
          <Label
            htmlFor="acceptTerms"
            className="text-sm leading-relaxed cursor-pointer"
          >
            I accept the{" "}
            <Link
              href="/terms"
              className="text-primary hover:text-primary/80 underline"
            >
              Terms and Conditions
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              className="text-primary hover:text-primary/80 underline"
            >
              Privacy Policy
            </Link>
          </Label>
          {errors.acceptTerms && (
            <p className="text-destructive text-sm mt-1">
              {errors.acceptTerms.message}
            </p>
          )}
        </div>
      </div>

      <Button
        type="submit"
        fullWidth
        disabled={isPending || !isValid}
        className="h-12"
      >
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isPending ? "Creating account..." : "Create Account"}
      </Button>
    </form>
  );
};

export default RegForm;
