"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import {
  Expedition,
  TRANSPORT_MODE_LABELS,
} from "@/lib/types/expedition.types";

interface ExpeditionInfoProps {
  expedition: Expedition;
}

export function ExpeditionInfo({ expedition }: ExpeditionInfoProps) {
  const t = useTranslations("Expeditions");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("info.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <dt className="text-sm font-medium text-muted-foreground">{t("info.seller")}</dt>
            <dd className="text-sm mt-1">
              <div className="flex flex-col">
                <span className="font-medium">{expedition.sellerSnapshot?.name || t("info.unknown")}</span>
                {expedition.sellerSnapshot?.email && (
                  <span className="text-xs text-muted-foreground">{expedition.sellerSnapshot?.email}</span>
                )}
              </div>
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-muted-foreground">{t("info.warehouse")}</dt>
            <dd className="text-sm mt-1">
              <div className="flex flex-col">
                <span className="font-medium">{expedition.warehouse?.name || t("info.unknown")}</span>
                {expedition.warehouse?.location && (
                  <span className="text-xs text-muted-foreground">{expedition.warehouse.location}</span>
                )}
              </div>
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-muted-foreground">{t("info.arrival_date")}</dt>
            <dd className="text-sm mt-1 font-medium">
              {format(new Date(expedition.arrivalDate), "PPP")}
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-muted-foreground">{t("info.transport_mode")}</dt>
            <dd className="text-sm mt-1">
              <Badge>
                {TRANSPORT_MODE_LABELS[expedition.transportMode]}
              </Badge>
            </dd>
          </div>

          {expedition.trackingNumber && (
            <div>
              <dt className="text-sm font-medium text-muted-foreground">{t("info.tracking_number")}</dt>
              <dd className="text-sm mt-1 font-mono">{expedition.trackingNumber}</dd>
            </div>
          )}

          <div>
            <dt className="text-sm font-medium text-muted-foreground">{t("info.packages")}</dt>
            <dd className="text-sm mt-1 font-medium">{expedition.numberOfPackages}</dd>
          </div>

          {expedition.weight && (
            <div>
              <dt className="text-sm font-medium text-muted-foreground">{t("info.weight")}</dt>
              <dd className="text-sm mt-1 font-medium">{expedition.weight} kg</dd>
            </div>
          )}

          <div>
            <dt className="text-sm font-medium text-muted-foreground">Created At</dt>
            <dd className="text-sm mt-1">
              {format(new Date(expedition.createdAt), "PPP")}
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-muted-foreground">Last Updated</dt>
            <dd className="text-sm mt-1">
              {format(new Date(expedition.updatedAt), "PPP")}
            </dd>
          </div>
        </dl>

        {expedition.generalNotes && (
          <>
            <Separator className="my-6" />
            <div>
              <dt className="text-sm font-medium text-muted-foreground mb-2">{t("info.notes")}</dt>
              <dd className="text-sm text-muted-foreground whitespace-pre-wrap">
                {expedition.generalNotes}
              </dd>
            </div>
          </>
        )}

        {expedition.receivedBy && (
          <>
            <Separator className="my-6" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Received By</dt>
                <dd className="text-sm mt-1 font-medium">{expedition.receivedBy}</dd>
              </div>
              {expedition.receivedAt && (
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Received At</dt>
                  <dd className="text-sm mt-1">
                    {format(new Date(expedition.receivedAt), "PPP")}
                  </dd>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}