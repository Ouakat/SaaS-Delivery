"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SmsBalanceWidgetProps {
  balance: number;
  threshold: number;
  lastUpdated?: string;
  onRecharge?: () => void;
  canManage?: boolean;
}

export const SmsBalanceWidget: React.FC<SmsBalanceWidgetProps> = ({
  balance,
  threshold,
  lastUpdated,
  onRecharge,
  canManage = false,
}) => {
  const isLowBalance = balance < threshold;
  const formatBalance = (num: number) => new Intl.NumberFormat().format(num);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon icon="heroicons:wallet" className="w-5 h-5" />
          SMS Balance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-2">
          <div className="text-2xl font-bold text-primary">
            {formatBalance(balance)}
          </div>
          <p className="text-sm text-muted-foreground">Credits Available</p>
          {lastUpdated && (
            <p className="text-xs text-muted-foreground mt-1">
              Updated: {new Date(lastUpdated).toLocaleDateString()}
            </p>
          )}
        </div>

        <div className="flex items-center justify-center mt-2">
          <Badge color={isLowBalance ? "warning" : "success"}>
            {isLowBalance ? "Low Balance" : "Sufficient"}
          </Badge>
        </div>

        {isLowBalance && (
          <Alert color="warning" className="mt-3">
            <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
            <AlertDescription>
              Balance is below {formatBalance(threshold)} credits. Consider
              recharging.
            </AlertDescription>
          </Alert>
        )}

        {canManage && onRecharge && (
          <Button className="w-full mt-3" onClick={onRecharge}>
            <Icon icon="heroicons:plus" className="w-4 h-4 mr-2" />
            Recharge Balance
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
