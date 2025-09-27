"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import { Expedition } from "@/lib/types/expedition.types";
import { expeditionClient } from "@/lib/api/clients/expedition.client";

interface ExpeditionDocumentsProps {
  expedition: Expedition;
}

export function ExpeditionDocuments({ expedition }: ExpeditionDocumentsProps) {
  const [loading, setLoading] = useState(false);

  const handleGenerateDocument = async (format: "pdf" | "html", includeSignature: boolean = false) => {
    try {
      setLoading(true);
      const response = await expeditionClient.generateReceipt(expedition.id, {
        format,
        includeItems: true,
        includeSignature,
      });

      // Open document in new tab
      window.open(response.documentUrl, "_blank");
      toast.success(`${format.toUpperCase()} generated successfully`);
    } catch (error: any) {
      toast.error(error.message || "Failed to generate document");
    } finally {
      setLoading(false);
    }
  };

  const documents = [
    {
      id: "receipt-pdf",
      name: "Expedition Receipt (PDF)",
      description: "Download expedition receipt with all items",
      icon: "vscode-icons:file-type-pdf2",
      action: () => handleGenerateDocument("pdf", false),
    },
    {
      id: "receipt-pdf-signed",
      name: "Signed Receipt (PDF)",
      description: "Download expedition receipt with signature",
      icon: "vscode-icons:file-type-pdf2",
      action: () => handleGenerateDocument("pdf", true),
    },
    {
      id: "receipt-html",
      name: "Expedition Receipt (HTML)",
      description: "View expedition receipt in browser",
      icon: "heroicons:document-text",
      action: () => handleGenerateDocument("html", false),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Documents</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Icon icon={doc.icon} className="h-8 w-8" />
                <div>
                  <p className="text-sm font-medium">{doc.name}</p>
                  <p className="text-xs text-muted-foreground">{doc.description}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={doc.action}
                disabled={loading}
              >
                {loading ? (
                  <Icon icon="eos-icons:loading" className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Icon icon="heroicons:arrow-down-tray" className="h-4 w-4 mr-2" />
                    Generate
                  </>
                )}
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}