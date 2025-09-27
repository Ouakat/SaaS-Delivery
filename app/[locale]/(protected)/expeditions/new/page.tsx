"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { ExpeditionBasicInfoForm } from "@/components/expeditions/forms/expedition-basic-info-form";
import { ExpeditionItemsForm } from "@/components/expeditions/forms/expedition-items-form";
import { ExpeditionReviewForm } from "@/components/expeditions/forms/expedition-review-form";
import { CreateExpeditionDto } from "@/lib/types/expedition.types";
import { expeditionClient } from "@/lib/api/clients/expedition.client";

const STEPS = [
  { id: 1, name: "basic_information", icon: "heroicons:information-circle" },
  { id: 2, name: "add_items", icon: "heroicons:cube" },
  { id: 3, name: "review_create", icon: "heroicons:check-circle" },
];

export default function NewExpeditionPage() {
  const router = useRouter();
  const t = useTranslations("Expeditions");
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<CreateExpeditionDto>>({
    transportMode: "road",
    numberOfPackages: 1,
    items: [],
  });
  const [loading, setLoading] = useState(false);

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleBasicInfoSubmit = (data: Partial<CreateExpeditionDto>) => {
    console.log(data);
    
    setFormData({ ...formData, ...data });
    handleNext();
  };

  const handleItemsSubmit = (items: any[]) => {
    setFormData({ ...formData, items });
    handleNext();
  };

  const handleSaveDraft = async () => {
    try {
      setLoading(true);
      // TODO: Implement draft saving logic
      toast.success("Draft saved successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to save draft");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      setLoading(true);

      // // Validate the data
      // const validationResponse = await expeditionClient.validate(formData as CreateExpeditionDto);

      // if (!validationResponse.valid) {
      //   validationResponse.errors.forEach(error => {
      //     toast.error(`${error.field}: ${error.message}`);
      //   });
      //   return;
      // }

      // Create the expedition
      const expedition = await expeditionClient.create(formData as CreateExpeditionDto);

      toast.success("Expedition created successfully");
      router.push(`/expeditions/${expedition.id}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to create expedition");
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {STEPS.map((step, index) => (
            <div
              key={step.id}
              className={`flex items-center ${
                index < STEPS.length - 1 ? "flex-1" : ""
              }`}
            >
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep >= step.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-muted"
                }`}
              >
                {currentStep > step.id ? (
                  <Icon icon="heroicons:check" className="h-5 w-5" />
                ) : (
                  <span className="text-sm font-semibold">{step.id}</span>
                )}
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 ${
                    currentStep > step.id ? "bg-primary" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between">
          {STEPS.map((step) => (
            <div
              key={step.id}
              className={`text-xs text-center ${
                currentStep >= step.id ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {t(`new.steps.${step.name}`)}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <ExpeditionBasicInfoForm
            initialData={formData}
            onSubmit={handleBasicInfoSubmit}
            onCancel={() => router.push("/expeditions")}
          />
        );
      case 2:
        return (
          <ExpeditionItemsForm
            initialItems={formData.items || []}
            warehouseId={formData.warehouseId}
            sellerId={formData.sellerId}
            onSubmit={handleItemsSubmit}
            onBack={handlePrevious}
          />
        );
      case 3:
        return (
          <ExpeditionReviewForm
            data={formData as CreateExpeditionDto}
            onConfirm={handleCreate}
            onBack={handlePrevious}
            onSaveDraft={handleSaveDraft}
            loading={loading}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("new.title")}</h1>
          <p className="text-muted-foreground">
            {t("new.description")}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push("/expeditions")}
        >
          <Icon icon="heroicons:x-mark" className="h-4 w-4 mr-2" />
          {t("cancel")}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("new.card_title")}</CardTitle>
          <CardDescription>
            {t("new.card_description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderStepIndicator()}
          {renderStepContent()}
        </CardContent>
      </Card>
    </div>
  );
}