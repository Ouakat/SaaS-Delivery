"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Icon } from "@/components/ui/icon";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useOptionsStore } from "@/lib/stores/settings/options.store";
import type { Bank } from "@/lib/types/settings/options.types";

const bankSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters"),
  code: z
    .string()
    .min(2, "Code must be at least 2 characters")
    .max(10, "Code must be less than 10 characters")
    .regex(
      /^[A-Z0-9]+$/,
      "Code must contain only uppercase letters and numbers"
    ),
  status: z.boolean().default(true),
});

type FormData = z.infer<typeof bankSchema>;

interface BankFormProps {
  open: boolean;
  onClose: () => void;
  bank?: Bank | null;
  onSuccess: () => void;
}

// Common bank presets for quick setup
const bankPresets = [
  { name: "Attijariwafa Bank", code: "AWB" },
  { name: "Banque Populaire", code: "BP" },
  { name: "BMCE Bank", code: "BMCE" },
  { name: "Crédit Agricole du Maroc", code: "CAM" },
  { name: "Banque Centrale Populaire", code: "BCP" },
  { name: "CIH Bank", code: "CIH" },
  { name: "Société Générale Maroc", code: "SGMA" },
  { name: "BMCI", code: "BMCI" },
];

const BankForm: React.FC<BankFormProps> = ({
  open,
  onClose,
  bank,
  onSuccess,
}) => {
  const { createBank, updateBank, banks } = useOptionsStore();

  const isEdit = !!bank;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(bankSchema),
    defaultValues: {
      name: "",
      code: "",
      status: true,
    },
  });

  const watchedName = watch("name");
  const watchedCode = watch("code");

  useEffect(() => {
    if (bank) {
      reset({
        name: bank.name,
        code: bank.code,
        status: bank.status,
      });
    } else {
      reset({
        name: "",
        code: "",
        status: true,
      });
    }
  }, [bank, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      let success = false;

      if (isEdit && bank) {
        success = await updateBank(bank.id, data);
      } else {
        success = await createBank(data);
      }

      if (success) {
        onSuccess();
        reset();
      }
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  // Check if name or code already exists
  const nameExists =
    watchedName &&
    banks.some(
      (b) =>
        b.name.toLowerCase() === watchedName.toLowerCase() &&
        (!isEdit || b.id !== bank?.id)
    );

  const codeExists =
    watchedCode &&
    banks.some(
      (b) =>
        b.code.toLowerCase() === watchedCode.toLowerCase() &&
        (!isEdit || b.id !== bank?.id)
    );

  const handlePresetClick = (preset: { name: string; code: string }) => {
    setValue("name", preset.name);
    setValue("code", preset.code);
  };

  const generateCodeFromName = (name: string) => {
    // Simple code generation logic
    const words = name.toUpperCase().split(/\s+/);
    if (words.length === 1) {
      return words[0].substring(0, 4);
    } else if (words.length === 2) {
      return words[0].substring(0, 2) + words[1].substring(0, 2);
    } else {
      return words
        .slice(0, 3)
        .map((w) => w[0])
        .join("");
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    if (!isEdit && name && !watchedCode) {
      const generatedCode = generateCodeFromName(name);
      setValue("code", generatedCode);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Bank" : "Add Bank"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the bank information"
              : "Add a new banking institution for payment processing"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Bank Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Bank Name *</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="e.g., Attijariwafa Bank"
              onChange={handleNameChange}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
            {nameExists && (
              <p className="text-sm text-destructive">
                A bank with this name already exists
              </p>
            )}
          </div>

          {/* Bank Code */}
          <div className="space-y-2">
            <Label htmlFor="code">Bank Code *</Label>
            <Input
              id="code"
              {...register("code")}
              placeholder="e.g., AWB, BP, BMCE"
              className="font-mono"
            />
            {errors.code && (
              <p className="text-sm text-destructive">{errors.code.message}</p>
            )}
            {codeExists && (
              <p className="text-sm text-destructive">
                A bank with this code already exists
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Use a short, unique identifier (uppercase letters and numbers
              only)
            </p>
          </div>

          {/* Presets */}
          {!isEdit && (
            <div className="space-y-2">
              <Label className="text-sm">Quick Setup</Label>
              <div className="grid grid-cols-2 gap-1 max-h-32 overflow-y-auto">
                {bankPresets
                  .filter(
                    (preset) =>
                      !banks.some(
                        (b) =>
                          b.name.toLowerCase() === preset.name.toLowerCase() ||
                          b.code.toLowerCase() === preset.code.toLowerCase()
                      )
                  )
                  .map((preset) => (
                    <Button
                      key={preset.code}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs h-8 justify-start"
                      onClick={() => handlePresetClick(preset)}
                    >
                      <span className="font-mono mr-2">{preset.code}</span>
                      <span className="truncate">{preset.name}</span>
                    </Button>
                  ))}
              </div>
              {banks.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Existing banks are hidden from presets
                </p>
              )}
            </div>
          )}

          {/* Status Toggle */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="space-y-1">
              <Label>Active Status</Label>
              <p className="text-sm text-muted-foreground">
                Enable this bank for payment processing
              </p>
            </div>
            <Switch {...register("status")} defaultChecked={true} />
          </div>

          {/* Info Alert */}
          <Alert>
            <Icon icon="heroicons:information-circle" className="h-4 w-4" />
            <AlertDescription>
              Banks are used for payment processing and financial transactions.
              Make sure the code is unique and recognizable.
            </AlertDescription>
          </Alert>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || nameExists || codeExists}
            >
              {isSubmitting && (
                <Icon
                  icon="heroicons:arrow-path"
                  className="w-4 h-4 mr-2 animate-spin"
                />
              )}
              {isEdit ? "Update Bank" : "Add Bank"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BankForm;
