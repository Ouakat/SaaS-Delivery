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
import type { ClientType } from "@/lib/types/settings/options.types";

const clientTypeSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(50, "Name must be less than 50 characters")
    .regex(
      /^[a-zA-Z0-9\s\-\.]+$/,
      "Name can only contain letters, numbers, spaces, hyphens, and periods"
    ),
  status: z.boolean().default(true),
});

type FormData = z.infer<typeof clientTypeSchema>;

interface ClientTypeFormProps {
  open: boolean;
  onClose: () => void;
  clientType?: ClientType | null;
  onSuccess: () => void;
}

// Common client type suggestions
const clientTypeSuggestions = [
  "Individual",
  "SARL",
  "SA",
  "Auto-entrepreneur",
  "SNC",
  "SASU",
  "EURL",
  "SCI",
  "Association",
  "GIE",
];

const ClientTypeForm: React.FC<ClientTypeFormProps> = ({
  open,
  onClose,
  clientType,
  onSuccess,
}) => {
  const { createClientType, updateClientType, clientTypes } = useOptionsStore();

  const isEdit = !!clientType;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(clientTypeSchema),
    defaultValues: {
      name: "",
      status: true,
    },
  });

  const watchedName = watch("name");

  useEffect(() => {
    if (clientType) {
      reset({
        name: clientType.name,
        status: clientType.status,
      });
    } else {
      reset({
        name: "",
        status: true,
      });
    }
  }, [clientType, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      let success = false;

      if (isEdit && clientType) {
        success = await updateClientType(clientType.id, data);
      } else {
        success = await createClientType(data);
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

  // Check if name already exists (for create mode or different name in edit mode)
  const nameExists =
    watchedName &&
    clientTypes.some(
      (ct) =>
        ct.name.toLowerCase() === watchedName.toLowerCase() &&
        (!isEdit || ct.id !== clientType?.id)
    );

  const handleSuggestionClick = (suggestion: string) => {
    setValue("name", suggestion);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Client Type" : "Create Client Type"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the client type configuration"
              : "Create a new client type for customer categorization"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Client Type Name *</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="e.g., Individual, SARL, Auto-entrepreneur"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
            {nameExists && (
              <p className="text-sm text-destructive">
                A client type with this name already exists
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Use clear, descriptive names for easy identification
            </p>
          </div>

          {/* Suggestions */}
          {!isEdit && (
            <div className="space-y-2">
              <Label className="text-sm">Common Types</Label>
              <div className="flex flex-wrap gap-1">
                {clientTypeSuggestions
                  .filter(
                    (suggestion) =>
                      !clientTypes.some(
                        (ct) =>
                          ct.name.toLowerCase() === suggestion.toLowerCase()
                      )
                  )
                  .slice(0, 6)
                  .map((suggestion) => (
                    <Button
                      key={suggestion}
                      type="button"
                      variant="outline"
                      size="md"
                      className="text-xs h-7"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      {suggestion}
                    </Button>
                  ))}
              </div>
              {clientTypes.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Existing types are hidden from suggestions
                </p>
              )}
            </div>
          )}

          {/* Status Toggle */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="space-y-1">
              <Label>Active Status</Label>
              <p className="text-sm text-muted-foreground">
                Enable this client type for use in the system
              </p>
            </div>
            <Switch {...register("status")} defaultChecked={true} />
          </div>

          {/* Info Alert */}
          <Alert color="default">
            <Icon icon="heroicons:information-circle" className="h-4 w-4" />
            <AlertDescription>
              Client types help categorize customers and can be used for
              reporting, filtering, and business analytics.
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
            <Button type="submit" disabled={isSubmitting || nameExists}>
              {isSubmitting && (
                <Icon
                  icon="heroicons:arrow-path"
                  className="w-4 h-4 mr-2 animate-spin"
                />
              )}
              {isEdit ? "Update Type" : "Create Type"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ClientTypeForm;
