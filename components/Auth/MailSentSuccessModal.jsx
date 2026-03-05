import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import mainSentImg from "../../public/assets/Mail Verification.svg";
import { t } from "@/utils";
import CustomImage from "../Common/CustomImage";

const MailSentSuccessModal = ({ IsMailSentSuccess, setIsMailSentSuccess }) => {
  return (
    <Dialog open={IsMailSentSuccess} onOpenChange={setIsMailSentSuccess}>
      <DialogContent onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="sr-only"></DialogTitle>
          <DialogDescription className="sr-only"></DialogDescription>
          <div className="flex flex-col items-center justify-center gap-3">
            <CustomImage
              src={mainSentImg}
              alt="Verification Mail sent"
              width={300}
              height={195}
              className="aspect-[300/195] object-contain"
            />
            <h1 className="text-2xl font-medium text-slate-900 dark:text-slate-100">
              {"Stigao ti je e-mail!"}
            </h1>
            <p className="text-slate-600 dark:text-slate-300">
              {"Klikni link u e-mailu da potvrdiš račun."}
            </p>
          </div>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};

export default MailSentSuccessModal;
