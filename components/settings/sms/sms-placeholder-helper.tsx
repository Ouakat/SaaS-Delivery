"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SMS_PLACEHOLDERS } from "@/lib/types/settings/sms.types";

interface SmsPlaceholderHelperProps {
  onInsertPlaceholder: (placeholder: string) => void;
}

export const SmsPlaceholderHelper: React.FC<SmsPlaceholderHelperProps> = ({
  onInsertPlaceholder,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const placeholderCategories = {
    Customer: ["{CLIENT_NAME}", "{ADDRESS}"],
    Parcel: ["{TRACKING_NUMBER}", "{REFERENCE}", "{AMOUNT}"],
    Delivery: ["{DELIVERY_DATE}", "{PICKUP_DATE}", "{STATUS}"],
    Driver: ["{DRIVER_NAME}", "{DRIVER_PHONE}"],
    Company: ["{COMPANY_NAME}"],
  };

  const handleInsert = (placeholder: string) => {
    onInsertPlaceholder(placeholder);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="md" type="button">
          <Icon icon="heroicons:variable" className="w-4 h-4 mr-2" />
          Insert Placeholder
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Available Placeholders</h4>
          {Object.entries(placeholderCategories).map(
            ([category, placeholders]) => (
              <div key={category} className="space-y-2">
                <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {category}
                </h5>
                <div className="flex flex-wrap gap-1">
                  {placeholders.map((placeholder) => (
                    <Button
                      key={placeholder}
                      variant="ghost"
                      size="md"
                      className="h-auto p-1 text-xs"
                      onClick={() => handleInsert(placeholder)}
                    >
                      {placeholder}
                    </Button>
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
