import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import trueGif from "../../../public/assets/true.gif";
import CustomLink from "@/components/Common/CustomLink";
import CustomImage from "@/components/Common/CustomImage";
import { Calendar, CheckCircle } from "lucide-react";
 
const AdSuccessModal = ({
  openSuccessModal,
  setOpenSuccessModal,
  createdAdSlug,
  isScheduled = false,
  scheduledDate = null,
}) => {
  const closeSuccessModal = () => {
    setOpenSuccessModal(false);
  };
 
  // Format date for display
  const formatScheduledDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const days = ["Nedjelja", "Ponedjeljak", "Utorak", "Srijeda", "Četvrtak", "Petak", "Subota"];
    const months = ["januar", "februar", "mart", "april", "maj", "juni", "juli", "august", "septembar", "oktobar", "novembar", "decembar"];
    
    const dayName = days[date.getDay()];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${dayName}, ${day}. ${month} ${year}. u ${hours}:${minutes}h`;
  };
 
  return (
    <Dialog open={openSuccessModal} onOpenChange={closeSuccessModal}>
      <DialogContent
        className="[&>button]:hidden !max-w-[520px] py-[50px] px-[30px] sm:px-[80px]"
        onInteractOutside={(e) => {
          e.preventDefault();
        }}
      >
        <DialogHeader className="flex flex-col gap-4 items-center">
          {isScheduled ? (
            // Scheduled ad success
            <>
              <div className="w-44 h-44 bg-primary/10 rounded-full flex items-center justify-center">
                <Calendar className="w-24 h-24 text-primary" />
              </div>
              <DialogTitle className="text-3xl font-semibold text-center !p-0 mt-0">
                Oglas je zakazan!
              </DialogTitle>
              <p className="text-gray-600 text-center">
                Vaš oglas će biti automatski objavljen:
              </p>
              <div className="bg-primary/10 text-primary font-semibold px-4 py-2 rounded-lg text-center">
                {formatScheduledDate(scheduledDate)}
              </div>
              <p className="text-sm text-gray-500 text-center">
                Možete pregledati i urediti oglas prije objave.
              </p>
            </>
          ) : (
            // Immediate publish success
            <>
              <CustomImage
                src={trueGif}
                alt="success"
                height={176}
                width={176}
                className="h-44 w-44"
              />
              <DialogTitle className="text-3xl font-semibold text-center !p-0 mt-0">
                Oglas je uspješno objavljen!
              </DialogTitle>
            </>
          )}
          
          <CustomLink
            href={`/my-listing/${createdAdSlug}`}
            className="py-3 px-6 bg-primary text-white rounded-md"
          >
            Pregledaj oglas
          </CustomLink>
          <CustomLink href="/" className="">
            Nazad na početnu
          </CustomLink>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};
 
export default AdSuccessModal;