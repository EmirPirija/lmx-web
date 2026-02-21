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
import { t } from "@/utils";
import { Loader2 } from "@/components/Common/UnifiedIconPack";

const ReusableAlertDialog = ({
  open,
  onCancel,
  onConfirm,
  title,
  description,
  cancelText = "Otkaži",
  confirmText = "Potvrdi",
  confirmDisabled = false,
}) => {
  const isDescriptionString = typeof description === "string";

  return (
    <AlertDialog open={open}>
      <AlertDialogContent onInteractOutside={(e) => e.preventDefault()}>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description &&
            (isDescriptionString ? (
              <AlertDialogDescription>{description}</AlertDialogDescription>
            ) : (
              <div className="text-sm text-muted-foreground">{description}</div>
            ))}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>{cancelText}</AlertDialogCancel>
          <AlertDialogAction disabled={confirmDisabled} onClick={onConfirm}>
            {confirmDisabled ? <Loader2 className="w-4 h-4 animate-spin" /> : confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ReusableAlertDialog;
