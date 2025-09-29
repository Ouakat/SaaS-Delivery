"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Icon } from "@iconify/react";
import { format } from "date-fns";
import { toast } from "sonner";
import { expeditionClient } from "@/lib/api/clients/expedition.client";
import { ExpeditionHistory as ExpeditionHistoryType } from "@/lib/types/expedition.types";

interface ExpeditionHistoryProps {
  expeditionId: string;
}

export function ExpeditionHistory({ expeditionId }: ExpeditionHistoryProps) {
  const [history, setHistory] = useState<ExpeditionHistoryType[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);
      const data = await expeditionClient.getHistory(expeditionId);
      setHistory(data);
    } catch (error: any) {
      toast.error(error.message || "Failed to load history");
    } finally {
      setLoading(false);
    }
  }, [expeditionId]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const getActionIcon = (action: string) => {
    const icons: Record<string, string> = {
      created: "heroicons:plus-circle",
      updated: "heroicons:pencil",
      status_changed: "heroicons:arrow-path",
      received: "heroicons:clipboard-document-check",
      cancelled: "heroicons:x-circle",
    };
    return icons[action.toLowerCase()] || "heroicons:document-text";
  };

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      created: "text-blue-500",
      updated: "text-yellow-500",
      status_changed: "text-orange-500",
      received: "text-green-500",
      cancelled: "text-red-500",
    };
    return colors[action.toLowerCase()] || "text-gray-500";
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity History</CardTitle>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <div className="text-center py-12">
            <Icon icon="heroicons:clock" className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No activity history</p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((entry, index) => (
              <div
                key={entry.id}
                className="flex gap-4 pb-4 border-b last:border-0 last:pb-0"
              >
                <div className={`mt-1 ${getActionColor(entry.action)}`}>
                  <Icon icon={getActionIcon(entry.action)} className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        {entry.action.charAt(0).toUpperCase() + entry.action.slice(1).replace("_", " ")}
                      </p>
                      {entry.fromStatus && entry.toStatus && (
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className="text-xs">
                            {entry.fromStatus}
                          </Badge>
                          <Icon icon="heroicons:arrow-right" className="h-3 w-3" />
                          <Badge className="text-xs">
                            {entry.toStatus}
                          </Badge>
                        </div>
                      )}
                      {entry.comment && (
                        <p className="text-xs text-muted-foreground mt-1">{entry.comment}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <Icon icon="heroicons:user" className="h-3 w-3" />
                        <span>{entry.changedByName}</span>
                        <span>•</span>
                        <Icon icon="heroicons:clock" className="h-3 w-3" />
                        <span>{format(new Date(entry.changedAt), "PPp")}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}