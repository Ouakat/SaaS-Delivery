"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useShippingSlipsStore } from "@/lib/stores/parcels/shipping-slips.store";
import { toast } from "sonner";

interface BulkActionsBarProps {
  selectedCount: number;
  onClearSelection: () => void;
}

export const BulkActionsBar: React.FC<BulkActionsBarProps> = ({
  selectedCount,
  onClearSelection,
}) => {
  const { selectedSlipIds, shippingSlips } = useShippingSlipsStore();
  const [showShipDialog, setShowShipDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleBulkShip = async () => {
    setIsProcessing(true);
    let successCount = 0;
    let failCount = 0;

    for (const slipId of selectedSlipIds) {
      const slip = shippingSlips.find((s) => s.id === slipId);
      if (slip && slip.status === "PENDING") {
        try {
          await useShippingSlipsStore.getState().markAsShipped(slipId);
          successCount++;
        } catch (error) {
          failCount++;
        }
      } else {
        failCount++;
      }
    }

    setIsProcessing(false);
    setShowShipDialog(false);
    onClearSelection();

    if (successCount > 0) {
      toast.success(`Successfully shipped ${successCount} slips`);
    }
    if (failCount > 0) {
      toast.warning(`Failed to ship ${failCount} slips`);
    }
  };

  const handleBulkCancel = async () => {
    setIsProcessing(true);
    let successCount = 0;
    let failCount = 0;

    for (const slipId of selectedSlipIds) {
      try {
        await useShippingSlipsStore.getState().cancelShippingSlip(slipId);
        successCount++;
      } catch (error) {
        failCount++;
      }
    }

    setIsProcessing(false);
    setShowCancelDialog(false);
    onClearSelection();

    if (successCount > 0) {
      toast.success(`Successfully cancelled ${successCount} slips`);
    }
    if (failCount > 0) {
      toast.warning(`Failed to cancel ${failCount} slips`);
    }
  };

  const handleBulkDelete = async () => {
    setIsProcessing(true);
    let successCount = 0;
    let failCount = 0;

    for (const slipId of selectedSlipIds) {
      try {
        await useShippingSlipsStore.getState().deleteShippingSlip(slipId);
        successCount++;
      } catch (error) {
        failCount++;
      }
    }

    setIsProcessing(false);
    setShowDeleteDialog(false);
    onClearSelection();

    if (successCount > 0) {
      toast.success(`Successfully deleted ${successCount} slips`);
    }
    if (failCount > 0) {
      toast.warning(`Failed to delete ${failCount} slips`);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-lg">
        <div className="flex items-center gap-3">
          <Badge color="secondary" className="flex items-center gap-1">
            <Icon icon="heroicons:check-circle" className="w-3 h-3" />
            {selectedCount} selected
          </Badge>
          <span className="text-sm text-muted-foreground">
            Bulk actions available for selected shipping slips
          </span>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" disabled={isProcessing}>
                <Icon
                  icon="heroicons:ellipsis-horizontal"
                  className="w-4 h-4 mr-2"
                />
                Bulk Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowShipDialog(true)}>
                <Icon
                  icon="heroicons:truck"
                  className="mr-2 h-4 w-4 text-blue-600"
                />
                Mark as Shipped
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={() => setShowCancelDialog(true)}>
                <Icon
                  icon="heroicons:x-circle"
                  className="mr-2 h-4 w-4 text-yellow-600"
                />
                Cancel Slips
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => setShowDeleteDialog(true)}>
                <Icon
                  icon="heroicons:trash"
                  className="mr-2 h-4 w-4 text-red-600"
                />
                Delete Slips
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            size="sm"
            onClick={onClearSelection}
            disabled={isProcessing}
          >
            Clear Selection
          </Button>
        </div>
      </div>

      {/* Bulk Ship Dialog */}
      <AlertDialog open={showShipDialog} onOpenChange={setShowShipDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bulk Mark as Shipped</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark {selectedCount} shipping slip
              {selectedCount !== 1 ? "s" : ""} as shipped? Only pending slips
              will be processed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkShip} disabled={isProcessing}>
              {isProcessing && (
                <Icon
                  icon="heroicons:arrow-path"
                  className="mr-2 h-4 w-4 animate-spin"
                />
              )}
              Mark as Shipped
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Cancel Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bulk Cancel Slips</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel {selectedCount} shipping slip
              {selectedCount !== 1 ? "s" : ""}? This will revert parcel
              statuses.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkCancel}
              disabled={isProcessing}
              className="bg-yellow-600 text-white hover:bg-yellow-700"
            >
              {isProcessing && (
                <Icon
                  icon="heroicons:arrow-path"
                  className="mr-2 h-4 w-4 animate-spin"
                />
              )}
              Cancel Slips
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bulk Delete Slips</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedCount} shipping slip
              {selectedCount !== 1 ? "s" : ""}? Only pending slips can be
              deleted. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={isProcessing}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {isProcessing && (
                <Icon
                  icon="heroicons:arrow-path"
                  className="mr-2 h-4 w-4 animate-spin"
                />
              )}
              Delete Slips
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
