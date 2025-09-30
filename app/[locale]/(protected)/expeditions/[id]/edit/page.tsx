"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@iconify/react";
import { format } from "date-fns";
import { toast } from "sonner";
import { ExpeditionEditForm } from "@/components/expeditions/forms/expedition-edit-form";
import {
  Expedition,
  UpdateExpeditionDto,
  ExpeditionStatus,
} from "@/lib/types/expedition.types";
import { expeditionClient } from "@/lib/api/clients/expedition.client";
import { Skeleton } from "@/components/ui/skeleton";

export default function ExpeditionEditPage() {
  const router = useRouter();
  const params = useParams();
  const expeditionId = params.id as string;
  const t = useTranslations("Expeditions");

  const [expedition, setExpedition] = useState<Expedition | null>(null);
  const [loading, setLoading] = useState(true);
  const [updateLoading, setUpdateLoading] = useState(false);

  const loadExpedition = useCallback(async () => {
    try {
      setLoading(true);
      const data = await expeditionClient.getById(expeditionId);
      setExpedition(data);
    } catch (error: any) {
      toast.error(error.message || t("edit.failed_to_load"));
      router.push("/expeditions");
    } finally {
      setLoading(false);
    }
  }, [expeditionId, t, router]);

  useEffect(() => {
    loadExpedition();
  }, [loadExpedition]);

  const handleUpdate = async (updateData: UpdateExpeditionDto) => {
    if (!expedition) return;

    try {
      setUpdateLoading(true);
      const updatedExpedition = await expeditionClient.update(expedition.id, updateData);
      toast.success(t("edit.success"));
      router.push(`/expeditions/${expedition.id}`);
    } catch (error: any) {
      toast.error(error.message || t("edit.failed_to_update"));
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleCancel = () => {
    router.push(`/expeditions/${expeditionId}`);
  };

  const getStatusBadge = (status: ExpeditionStatus) => {
    const colors = {
      expedited: "bg-blue-100 text-blue-800 border-blue-200",
      prepared: "bg-yellow-100 text-yellow-800 border-yellow-200",
      pointed: "bg-orange-100 text-orange-800 border-orange-200",
      received: "bg-green-100 text-green-800 border-green-200",
      cancelled: "bg-red-100 text-red-800 border-red-200",
    };

    return (
      <Badge className={colors[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!expedition) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <Icon icon="heroicons:exclamation-triangle" className="h-12 w-12 text-destructive mx-auto mb-4" />
              <p className="text-sm text-muted-foreground mb-4">{t("edit.expedition_not_found")}</p>
              <Button variant="outline" onClick={() => router.push("/expeditions")}>
                {t("edit.back_to_expeditions")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/expeditions/${expeditionId}`)}
          >
            <Icon icon="heroicons:arrow-left" className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{t("edit.title")}</h1>
            <p className="text-sm text-muted-foreground">
              {t("detail.id")}: {expedition.id}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(expedition.status)}
        </div>
      </div>

      {/* Status Info */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              {expedition.trackingNumber && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{t("edit.tracking")}:</span>
                  <span className="font-mono text-sm">{expedition.trackingNumber}</span>
                </div>
              )}
            </div>
            <div className="text-right space-y-1">
              <div className="text-sm text-muted-foreground">
                {t("edit.arrival_date")}: {format(new Date(expedition.arrivalDate), "PPP")}
              </div>
              <div className="text-sm text-muted-foreground">
                {t("edit.created")}: {format(new Date(expedition.createdAt), "PPP")}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle>{t("edit.card_title")}</CardTitle>
          <CardDescription>
            {t("edit.card_description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ExpeditionEditForm
            expedition={expedition}
            onSubmit={handleUpdate}
            onCancel={handleCancel}
            loading={updateLoading}
          />
        </CardContent>
      </Card>
    </div>
  );
}