"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SmsTemplatePreviewProps {
  content: string;
  name?: string;
  placeholders?: string[];
}

export const SmsTemplatePreview: React.FC<SmsTemplatePreviewProps> = ({
  content,
  name,
  placeholders = [],
}) => {
  const [previewText, setPreviewText] = useState("");
  const [showPreview, setShowPreview] = useState(true);

  useEffect(() => {
    if (content) {
      let preview = content;
      const sampleData: Record<string, string> = {
        "{CLIENT_NAME}": "John Doe",
        "{TRACKING_NUMBER}": "PKG123456789",
        "{COMPANY_NAME}": "Your Company",
        "{DELIVERY_DATE}": "Today",
        "{PICKUP_DATE}": "Tomorrow",
        "{DRIVER_NAME}": "Alex Driver",
        "{DRIVER_PHONE}": "+1234567890",
        "{STATUS}": "In Transit",
        "{ADDRESS}": "123 Main St, City",
        "{AMOUNT}": "$25.50",
        "{REFERENCE}": "REF001",
      };

      Object.entries(sampleData).forEach(([placeholder, value]) => {
        preview = preview.replace(
          new RegExp(placeholder.replace(/[{}]/g, "\\$&"), "g"),
          value
        );
      });
      setPreviewText(preview);
    }
  }, [content]);

  const getCharacterInfo = (text: string) => {
    const length = text.length;
    const smsCount = Math.ceil(length / 160);
    return { length, smsCount };
  };

  const { length, smsCount } = getCharacterInfo(content);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon icon="heroicons:eye" className="w-5 h-5" />
            {name ? `Preview: ${name}` : "Template Preview"}
          </div>
          <Button
            variant="ghost"
            size="md"
            onClick={() => setShowPreview(!showPreview)}
          >
            <Icon
              icon={showPreview ? "heroicons:eye-slash" : "heroicons:eye"}
              className="w-4 h-4"
            />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Character Count */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {length}/1000 characters
          </span>
          <Badge color={smsCount > 1 ? "warning" : "success"}>
            {smsCount} SMS {smsCount > 1 ? "credits" : "credit"}
          </Badge>
        </div>

        {/* SMS Count Warning */}
        {smsCount > 1 && (
          <Alert color="warning" variant="soft">
            <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
            <AlertDescription>
              This message will use {smsCount} SMS credits due to length (
              {length} characters)
            </AlertDescription>
          </Alert>
        )}

        {/* Preview Text */}
        {showPreview && (
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">
              Preview with sample data:
            </div>
            <div className="p-3 bg-muted/30 rounded-lg border">
              <div className="text-sm whitespace-pre-wrap">
                {previewText || "Enter message content to see preview..."}
              </div>
            </div>
          </div>
        )}

        {/* Placeholders */}
        {placeholders.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">
              Detected placeholders:
            </div>
            <div className="flex flex-wrap gap-1">
              {placeholders.map((placeholder) => (
                <Badge key={placeholder} color="primary" className="text-xs">
                  {placeholder}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
