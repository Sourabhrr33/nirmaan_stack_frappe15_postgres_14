import React, { useState } from "react";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { toast } from "@/components/ui/use-toast";
import { useUserData } from "@/hooks/useUserData";
import { ITM_DELETE_ROLES } from "@/constants/itm";
import { useITMMutations } from "../hooks/useITMMutations";

interface ITMRowDeleteActionProps {
  itmName: string;
  itmStatus: string;
  /** Called after a successful delete so the parent can refresh its list. */
  onDeleted?: () => void;
}

/**
 * Trash-icon button rendered in Approved-tab rows. Visible only when:
 *   - row.status === "Approved" (pre-dispatch is the only deletable state)
 *   - current user's role is in ``ITM_DELETE_ROLES``
 *
 * Clicking opens a confirm dialog, then calls ``delete_itm`` and triggers
 * the parent-supplied refresh callback.
 */
export const ITMRowDeleteAction: React.FC<ITMRowDeleteActionProps> = ({
  itmName,
  itmStatus,
  onDeleted,
}) => {
  const { role, user_id } = useUserData();
  const { deleteItm, isDeleting } = useITMMutations();
  const [open, setOpen] = useState(false);

  const canDelete =
    itmStatus === "Approved" &&
    (ITM_DELETE_ROLES.includes(role) || user_id === "Administrator");

  if (!canDelete) return null;

  const handleConfirm = async (e?: React.MouseEvent) => {
    // Prevent the row link from firing when the dialog action button is inside a row.
    e?.stopPropagation();
    try {
      await deleteItm(itmName);
      toast({
        title: `${itmName} deleted`,
        description: "Reserved inventory has been released.",
        variant: "success",
      });
      setOpen(false);
      onDeleted?.();
    } catch (err: any) {
      toast({
        title: "Failed to delete",
        description: err?.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-destructive hover:bg-destructive/10"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        title="Delete this transfer memo"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {itmName}?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently remove the transfer memo and release the
            reserved inventory back to the source. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Deleting…" : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ITMRowDeleteAction;
