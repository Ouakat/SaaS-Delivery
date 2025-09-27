"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Expedition,
  ReceiveExpeditionDto,
} from "@/lib/types/expedition.types";
import { expeditionClient } from "@/lib/api/clients/expedition.client";
import { ExpeditionReceiveForm } from "@/components/expeditions/forms/expedition-receive-form";

export default function ReceiveExpeditionPage() {
  const router = useRouter();
  const params = useParams();
  const expeditionId = params.id as string;
  const t = useTranslations("Expeditions");

  const [expedition, setExpedition] = useState<Expedition | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadExpedition();
  }, [expeditionId]);

  const loadExpedition = async () => {
    try {
      setLoading(true);
      const data = await expeditionClient.getById(expeditionId);

      if (data.status === "received" || data.status === "cancelled") {
        toast.error(t("receive.cannot_receive", { status: data.status }));
        router.push(`/expeditions/${expeditionId}`);
        return;
      }

      setExpedition(data);
    } catch (error: any) {
      toast.error(error.message || t("receive.failed_to_load"));
      router.push("/expeditions");
    } finally {
      setLoading(false);
    }
  };

  const handleReceiveSubmit = async (data: ReceiveExpeditionDto) => {
    try {
      setSubmitting(true);
      const response = await expeditionClient.receive(expeditionId, data);

      if (response.success) {
        toast.success(t("receive.success"));

        // Show discrepancies if any
        if (response.discrepancies && response.discrepancies.length > 0) {
          response.discrepancies.forEach(disc => {
            toast.warning(
              t("receive.discrepancy_warning", { expected: disc.expectedQuantity, actual: disc.actualQuantity })
            );
          });
        }

        // Show stock updates
        if (response.stockUpdates && response.stockUpdates.length > 0) {
          toast.success(t("receive.stock_updates_success", { count: response.stockUpdates.length }));
        }

        router.push(`/expeditions/${expeditionId}`);
      }
    } catch (error: any) {
      toast.error(error.message || t("receive.failed_to_receive"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push(`/expeditions/${expeditionId}`);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!expedition) {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCancel}
          >
            <Icon icon="heroicons:arrow-left" className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{t("receive.title")}</h1>
            <p className="text-sm text-muted-foreground">
              {t("receive.description")}
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={handleCancel}>
          <Icon icon="heroicons:x-mark" className="h-4 w-4 mr-2" />
          {t("receive.cancel")}
        </Button>
      </div>

      <ExpeditionReceiveForm
        expedition={expedition}
        onSubmit={handleReceiveSubmit}
        onCancel={handleCancel}
        loading={submitting}
      />
    </div>
  );
}