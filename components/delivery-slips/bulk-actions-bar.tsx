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
import { useDeliverySlipsStore } from "@/lib/stores/parcels/delivery-slips.store";
import { toast } from "sonner";

interface BulkActionsBarProps {
  selectedCount: number;
  onClearSelection: () => void;
}

export const BulkActionsBar: React.FC<BulkActionsBarProps> = ({
  selectedCount,
  onClearSelection,
}) => {
  const { selectedSlipIds, bulkAction } = useDeliverySlipsStore();
  const [showReceiveDialog, setShowReceiveDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleBulkReceive = async () => {
    setIsProcessing(true);
    try {
      const success = await bulkAction({
        slipIds: selectedSlipIds,
        action: "RECEIVE",
        comment: "Bulk received from table actions",
      });

      if (success) {
        setShowReceiveDialog(false);
        onClearSelection();
        toast.success(
          `Successfully received ${selectedSlipIds.length} delivery slips`
        );
      }
    } catch (error) {
      toast.error("Failed to receive delivery slips");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkCancel = async () => {
    setIsProcessing(true);
    try {
      const success = await bulkAction({
        slipIds: selectedSlipIds,
        action: "CANCEL",
        comment: "Bulk cancelled from table actions",
      });

      if (success) {
        setShowCancelDialog(false);
        onClearSelection();
        toast.success(
          `Successfully cancelled ${selectedSlipIds.length} delivery slips`
        );
      }
    } catch (error) {
      toast.error("Failed to cancel delivery slips");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    setIsProcessing(true);
    try {
      const success = await bulkAction({
        slipIds: selectedSlipIds,
        action: "DELETE",
        comment: "Bulk deleted from table actions",
      });

      if (success) {
        setShowDeleteDialog(false);
        onClearSelection();
        toast.success(
          `Successfully deleted ${selectedSlipIds.length} delivery slips`
        );
      }
    } catch (error) {
      toast.error("Failed to delete delivery slips");
    } finally {
      setIsProcessing(false);
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
            Bulk actions available for selected delivery slips
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
              <DropdownMenuItem onClick={() => setShowReceiveDialog(true)}>
                <Icon
                  icon="heroicons:check"
                  className="mr-2 h-4 w-4 text-green-600"
                />
                Mark as Received
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

      {/* Bulk Receive Dialog */}
      <AlertDialog open={showReceiveDialog} onOpenChange={setShowReceiveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bulk Mark as Received</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark {selectedCount} delivery slip
              {selectedCount !== 1 ? "s" : ""} as received? This will update the
              status of all parcels in these slips.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkReceive}
              disabled={isProcessing}
            >
              {isProcessing && (
                <Icon
                  icon="heroicons:arrow-path"
                  className="mr-2 h-4 w-4 animate-spin"
                />
              )}
              Mark as Received
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
              Are you sure you want to cancel {selectedCount} delivery slip
              {selectedCount !== 1 ? "s" : ""}? This action will change their
              status to cancelled.
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
              Are you sure you want to delete {selectedCount} delivery slip
              {selectedCount !== 1 ? "s" : ""}? This action cannot be undone and
              will reset all parcels back to "NEW_PACKAGE" status.
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
