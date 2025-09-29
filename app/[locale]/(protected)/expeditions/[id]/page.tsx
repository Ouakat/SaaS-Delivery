"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Icon } from "@iconify/react";
import { format } from "date-fns";
import { toast } from "sonner";
import { ExpeditionInfo } from "@/components/expeditions/expedition-info";
import { ExpeditionItems } from "@/components/expeditions/expedition-items";
import { ExpeditionHistory } from "@/components/expeditions/expedition-history";
import { ExpeditionDocuments } from "@/components/expeditions/expedition-documents";
import {
  Expedition,
  ExpeditionStatus,
  STATUS_COLORS,
  TRANSPORT_MODE_LABELS,
} from "@/lib/types/expedition.types";
import { expeditionClient } from "@/lib/api/clients/expedition.client";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ExpeditionDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const expeditionId = params.id as string;
  const t = useTranslations("Expeditions");

  const [expedition, setExpedition] = useState<Expedition | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);

  const loadExpedition = useCallback(async () => {
    try {
      setLoading(true);
      const data = await expeditionClient.getById(expeditionId);
      setExpedition(data);
    } catch (error: any) {
      toast.error(error.message || t("receive.failed_to_load"));
      router.push("/expeditions");
    } finally {
      setLoading(false);
    }
  }, [expeditionId, t, router]);

  useEffect(() => {
    loadExpedition();
  }, [loadExpedition]);

  const handleStatusUpdate = async (newStatus: ExpeditionStatus) => {
    if (!expedition) return;

    try {
      setStatusUpdateLoading(true);
      const response = await expeditionClient.bulkStatusUpdate({
        expeditionIds: [expedition.id],
        status: newStatus,
        comment: `Status updated to ${newStatus}`,
      });

      if (response.success) {
        toast.success(`Expedition status updated to ${newStatus}`);
        loadExpedition();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update status");
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await expeditionClient.delete(expeditionId);
      toast.success("Expedition deleted successfully");
      router.push("/expeditions");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete expedition");
    }
  };

  const handlePrint = async () => {
    try {
      const response = await expeditionClient.generateReceipt(expeditionId, {
        format: "pdf",
        includeItems: true,
        includeSignature: false,
      });
      window.open(response.documentUrl, "_blank");
    } catch (error: any) {
      toast.error(error.message || "Failed to generate receipt");
    }
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

  const getNextStatus = (currentStatus: ExpeditionStatus): ExpeditionStatus | null => {
    const statusFlow: Record<ExpeditionStatus, ExpeditionStatus | null> = {
      expedited: "prepared",
      prepared: "pointed",
      pointed: "received",
      received: null,
      cancelled: null,
    };
    return statusFlow[currentStatus];
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!expedition) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <Icon icon="heroicons:exclamation-triangle" className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">{t("detail.expedition_not_found")}</p>
            <Button variant="outline" onClick={() => router.push("/expeditions")} className="mt-4">
              {t("detail.back_to_expeditions")}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const nextStatus = getNextStatus(expedition.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/expeditions")}
          >
            <Icon icon="heroicons:arrow-left" className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{t("detail.title")}</h1>
            <p className="text-sm text-muted-foreground">
              {t("detail.id")}: {expedition.id}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* {nextStatus && expedition.status !== "cancelled" && (
            <Button
              variant="outline"
              onClick={() => handleStatusUpdate(nextStatus)}
              disabled={statusUpdateLoading}
            >
              <Icon icon="heroicons:arrow-right-circle" className="h-4 w-4 mr-2" />
              Move to {nextStatus.charAt(0).toUpperCase() + nextStatus.slice(1)}
            </Button>
          )} */}
          {expedition.status !== "received" && expedition.status !== "cancelled" && (
            <Button
              variant="outline"
              onClick={() => router.push(`/expeditions/${expedition.id}/receive`)}
            >
              <Icon icon="heroicons:clipboard-document-check" className="h-4 w-4 mr-2" />
              {t("detail.receive_button")}
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => router.push(`/expeditions/${expedition.id}/edit`)}
            disabled={expedition.status === "received" || expedition.status === "cancelled"}
          >
            <Icon icon="heroicons:pencil" className="h-4 w-4 mr-2" />
            {t("detail.edit_button")}
          </Button>
          <Button
            variant="outline"
            className="text-destructive"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Icon icon="heroicons:trash" className="h-4 w-4 mr-2" />
            {t("detail.delete_button")}
          </Button>
        </div>
      </div>

      {/* Status Header */}
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{t("detail.status")}:</span>
                {getStatusBadge(expedition.status)}
              </div>
              {expedition.trackingNumber && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{t("detail.tracking")}:</span>
                  <span className="font-mono text-sm">{expedition.trackingNumber}</span>
                </div>
              )}
            </div>
            <div className="text-right space-y-1">
              <div className="text-sm text-muted-foreground">
                {t("detail.arrival_date")}: {format(new Date(expedition.arrivalDate), "PPP")}
              </div>
              <div className="text-sm text-muted-foreground">
                {t("detail.created")}: {format(new Date(expedition.createdAt), "PPP")}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="info" className="space-y-4">
        <TabsList>
          <TabsTrigger value="info">{t("detail.information_tab")}</TabsTrigger>
          <TabsTrigger value="items">
            {t("detail.items_tab")} ({expedition.items?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <ExpeditionInfo expedition={expedition} />
        </TabsContent>

        <TabsContent value="items">
          <ExpeditionItems
            expedition={expedition}
            onUpdate={loadExpedition}
          />
        </TabsContent>

      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("detail.delete_dialog.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("detail.delete_dialog.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("detail.delete_dialog.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              {t("detail.delete_dialog.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}