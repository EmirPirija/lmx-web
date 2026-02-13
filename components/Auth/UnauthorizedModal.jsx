import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getIsUnauthorized, setIsUnauthorized } from "@/redux/reducer/globalStateSlice";
import { useDispatch, useSelector } from "react-redux";

const UnauthorizedModal = () => {
  const dispatch = useDispatch();
  const open = useSelector(getIsUnauthorized);

  const handleOk = () => {
    dispatch(setIsUnauthorized(false));
  };

  const handleOpenChange = (nextOpen) => {
    if (!nextOpen) {
      dispatch(setIsUnauthorized(false));
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent onInteractOutside={(e) => e.preventDefault()}>
        <AlertDialogHeader>
          <AlertDialogTitle>Niste autorizovani</AlertDialogTitle>
          <AlertDialogDescription>
            Nemate dozvolu za pristup ovom sadržaju. Prijavite se ponovo ili
            kontaktirajte podršku.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={handleOk}>U redu</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default UnauthorizedModal;
