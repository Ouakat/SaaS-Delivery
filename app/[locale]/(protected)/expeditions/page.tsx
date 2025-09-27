"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ExpeditionList } from "@/components/expeditions/expedition-list";
import { Expedition } from "@/lib/types/expedition.types";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ExpeditionsPage() {
  const router = useRouter();
  const t = useTranslations("Expeditions");

  const handleExpeditionSelect = (expedition: Expedition) => {
    router.push(`/expeditions/${expedition.id}`);
  };

  const handleExpeditionEdit = (expedition: Expedition) => {
    router.push(`/expeditions/${expedition.id}/edit`);
  };

  const handleExpeditionReceive = (expedition: Expedition) => {
    router.push(`/expeditions/${expedition.id}/receive`);
  };

  const handleCreateExpedition = () => {
    router.push("/expeditions/new");
  };

  const handleAnalytics = () => {
    router.push("/expeditions/analytics");
  };

  const handleExport = (format: "excel" | "csv" | "pdf") => {
    console.log("Export expeditions in format:", format);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">
            {t("description")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleCreateExpedition}>
            <Icon icon="heroicons:plus" className="h-4 w-4 mr-2" />
            {t("new_expedition")}
          </Button>
        </div>
      </div>

      <ExpeditionList
        onExpeditionSelect={handleExpeditionSelect}
        onExpeditionEdit={handleExpeditionEdit}
        onExpeditionReceive={handleExpeditionReceive}
        showFilters={true}
        showPagination={true}
      />
    </div>
  );
}