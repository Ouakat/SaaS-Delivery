"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@iconify/react";
import { format } from "date-fns";
import {
  Expedition,
  ExpeditionStatus,
  STATUS_COLORS,
  TRANSPORT_MODE_LABELS,
} from "@/lib/types/expedition.types";

interface ExpeditionTableProps {
  expeditions: Expedition[];
  selectedExpeditions: string[];
  onSelectionChange: (selected: string[]) => void;
  onExpeditionSelect?: (expedition: Expedition) => void;
  onExpeditionEdit?: (expedition: Expedition) => void;
  onExpeditionReceive?: (expedition: Expedition) => void;
  sort: { field: string; direction: "asc" | "desc" };
  onSortChange: (sort: { field: string; direction: "asc" | "desc" }) => void;
}

export function ExpeditionTable({
  expeditions,
  selectedExpeditions,
  onSelectionChange,
  onExpeditionSelect,
  onExpeditionEdit,
  onExpeditionReceive,
  sort,
  onSortChange,
}: ExpeditionTableProps) {
  const t = useTranslations("Expeditions");
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(expeditions.map(e => e.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectExpedition = (expeditionId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedExpeditions, expeditionId]);
    } else {
      onSelectionChange(selectedExpeditions.filter(id => id !== expeditionId));
    }
  };

  const handleSort = (field: string) => {
    if (sort.field === field) {
      onSortChange({
        field,
        direction: sort.direction === "asc" ? "desc" : "asc",
      });
    } else {
      onSortChange({ field, direction: "asc" });
    }
  };

  const getSortIcon = (field: string) => {
    if (sort.field !== field) {
      return <Icon icon="heroicons:arrows-up-down" className="h-4 w-4 text-muted-foreground" />;
    }
    return sort.direction === "asc" ? (
      <Icon icon="heroicons:arrow-up" className="h-4 w-4" />
    ) : (
      <Icon icon="heroicons:arrow-down" className="h-4 w-4" />
    );
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

  return (
    <div className="w-full overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={selectedExpeditions.length === expeditions.length && expeditions.length > 0}
                onCheckedChange={handleSelectAll}
              />
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSort("id")}
                className="h-8 px-2 hover:bg-transparent"
              >
                {t("table.id")}
                {getSortIcon("id")}
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSort("trackingNumber")}
                className="h-8 px-2 hover:bg-transparent"
              >
                {t("table.tracking_number")}
                {getSortIcon("trackingNumber")}
              </Button>
            </TableHead>
            <TableHead>{t("table.seller")}</TableHead>
            <TableHead>{t("table.warehouse")}</TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSort("status")}
                className="h-8 px-2 hover:bg-transparent"
              >
                {t("table.status")}
                {getSortIcon("status")}
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSort("arrivalDate")}
                className="h-8 px-2 hover:bg-transparent"
              >
                {t("table.arrival_date")}
                {getSortIcon("arrivalDate")}
              </Button>
            </TableHead>
            <TableHead>{t("table.transport")}</TableHead>
            <TableHead className="text-right">{t("table.packages")}</TableHead>
            <TableHead className="text-right">{t("table.weight")}</TableHead>
            <TableHead className="text-right">{t("table.items")}</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expeditions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={12} className="text-center py-8">
                <div className="text-muted-foreground">
                  <Icon icon="heroicons:inbox" className="h-12 w-12 mx-auto mb-4" />
                  <p>{t("no_expeditions_found")}</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            expeditions.map((expedition) => (
              <TableRow
                key={expedition.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onExpeditionSelect?.(expedition)}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedExpeditions.includes(expedition.id)}
                    onCheckedChange={(checked) => handleSelectExpedition(expedition.id, checked as boolean)}
                  />
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {expedition.id.slice(0, 8)}...
                </TableCell>
                <TableCell className="font-medium">
                  {expedition.trackingNumber || "-"}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-sm">{expedition.sellerSnapshot?.name || t("table.unknown")}</span>
                    {expedition.sellerSnapshot?.email && (
                      <span className="text-xs text-muted-foreground">{expedition.sellerSnapshot.email}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-sm">{expedition.warehouse?.name || t("table.unknown")}</span>
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(expedition.status)}</TableCell>
                <TableCell>
                  {format(new Date(expedition.arrivalDate), "MMM dd, yyyy")}
                </TableCell>
                <TableCell>
                  <Badge>
                    {TRANSPORT_MODE_LABELS[expedition.transportMode]}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {expedition.numberOfPackages}
                </TableCell>
                <TableCell className="text-right">
                  {expedition.weight || "-"}
                </TableCell>
                <TableCell className="text-right">
                  {expedition.items?.length || 0}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Icon icon="heroicons:ellipsis-horizontal" className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onExpeditionSelect?.(expedition)}>
                        <Icon icon="heroicons:eye" className="h-4 w-4 mr-2" />
                        {t("view_details")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onExpeditionEdit?.(expedition)}
                        disabled={expedition.status === "received" || expedition.status === "cancelled"}
                      >
                        <Icon icon="heroicons:pencil" className="h-4 w-4 mr-2" />
                        {t("edit")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onExpeditionReceive?.(expedition)}
                        disabled={expedition.status === "received" || expedition.status === "cancelled"}
                      >
                        <Icon icon="heroicons:clipboard-document-check" className="h-4 w-4 mr-2" />
                        {t("receive")}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">
                        <Icon icon="heroicons:trash" className="h-4 w-4 mr-2" />
                        {t("delete")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}