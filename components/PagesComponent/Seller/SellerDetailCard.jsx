import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { 
  MdVerified, 
  MdOutlineMail, 
  MdPhone, 
  MdCalendarMonth, 
  MdStar,
  MdContentCopy,
  MdCheck,
  MdClose
} from "react-icons/md";
import { extractYear } from "@/utils";
import { usePathname } from "next/navigation";
import { useSelector } from "react-redux";
import { getCompanyName } from "@/redux/reducer/settingSlice";
import ShareDropdown from "@/components/Common/ShareDropdown";
import CustomLink from "@/components/Common/CustomLink";
import CustomImage from "@/components/Common/CustomImage";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// 🔥 Importujemo Dialog komponente (Shadcn UI)
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";

// Helper za formatiranje vremena - SVE NA BOSANSKOM
const formatLastSeen = (timestamp) => {
  if (!timestamp) return "";
  const now = new Date();
  const lastSeen = new Date(timestamp);
  if (isNaN(lastSeen.getTime())) return "";

  const diffInSeconds = Math.floor((now - lastSeen) / 1000);

  if (diffInSeconds < 60) return "Upravo sada";
  if (diffInSeconds < 3600) return `Prije ${Math.floor(diffInSeconds / 60)} min`;
  if (diffInSeconds < 86400) return `Prije ${Math.floor(diffInSeconds / 3600)} h`;
  if (diffInSeconds < 172800) return "Jučer";
  
  return lastSeen.toLocaleDateString("bs-BA", {
    day: 'numeric', month: 'numeric', year: 'numeric'
  });
};

const SellerDetailCard = ({ seller, ratings }) => {
  const pathname = usePathname();
  const memberSinceYear = seller?.created_at ? extractYear(seller.created_at) : "";
  const currentUrl = `${process.env.NEXT_PUBLIC_WEB_URL}${pathname}`;
  const CompanyName = useSelector(getCompanyName);
  const FbTitle = seller?.name + " | " + CompanyName;

  // State za kopiranje broja
  const [isCopied, setIsCopied] = useState(false);
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);

  const isOnline = seller?.is_online || false;
  const lastSeenText = !isOnline && seller?.last_seen ? formatLastSeen(seller.last_seen) : null;

  // Funkcija za kopiranje
  const handleCopyPhone = () => {
    if (seller?.mobile) {
      navigator.clipboard.writeText(seller.mobile);
      setIsCopied(true);
      toast.success("Broj telefona kopiran!");
      
      // Resetuj ikonicu nakon 2 sekunde
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden relative group hover:shadow-md transition-all duration-300">
        
        {/* --- HEADER BACKGROUND --- */}
        <div className="h-24 bg-gradient-to-r from-primary/10 to-primary/5 w-full absolute top-0 left-0 z-0"></div>

        {/* --- SHARE BUTTON --- */}
        <div className="absolute top-3 right-3 z-10">
          <ShareDropdown
            url={currentUrl}
            title={FbTitle}
            headline={FbTitle}
            companyName={CompanyName}
            className="bg-white/80 backdrop-blur-sm hover:bg-white border-none shadow-sm rounded-full p-2 text-slate-600 transition-all"
          />
        </div>

        <div className="relative z-10 px-6 pt-8 pb-6 flex flex-col items-center">
          
          {/* --- AVATAR --- */}
          <div className="relative mb-3">
            <div className="p-1 bg-white rounded-full shadow-sm">
              <CustomImage
                src={seller?.profile}
                alt="Seller Image"
                width={100}
                height={100}
                className="w-[100px] h-[100px] aspect-square rounded-full object-cover border border-slate-100"
              />
            </div>
            {isOnline ? (
              <div className="absolute bottom-2 right-2" title="Online">
                <span className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-75"></span>
                <span className="relative block w-4 h-4 rounded-full bg-green-500 border-2 border-white"></span>
              </div>
            ) : (
              <div className="absolute bottom-2 right-2" title="Offline">
                 <span className="block w-4 h-4 rounded-full bg-slate-300 border-2 border-white"></span>
              </div>
            )}
          </div>

          {/* --- NAME --- */}
          <div className="text-center mb-1">
            <h3 className="text-xl font-bold text-slate-900 flex items-center justify-center gap-1.5">
              {seller?.name}
              {seller?.is_verified === 1 && (
                <MdVerified className="text-blue-500 text-lg" title="Verifikovan korisnik" />
              )}
            </h3>
          </div>

          {/* --- STATUS --- */}
          <div className="mb-4 text-center h-5">
             {isOnline ? (
               <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                 Na mreži
               </span>
             ) : (
               <span className="text-xs text-slate-500">
                 {lastSeenText ? `Na mreži: ${lastSeenText}` : "Van mreže"}
               </span>
             )}
          </div>

          {/* --- STATS --- */}
          <div className="flex items-center justify-center gap-4 w-full mb-6 text-sm">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-50 text-yellow-700 border border-yellow-100">
              <MdStar className="text-yellow-500 text-lg" />
              <span className="font-bold">{Number(seller?.average_rating || 0).toFixed(1)}</span>
              <span className="text-yellow-600/70 text-xs">({ratings?.data?.length || 0})</span>
            </div>

            {memberSinceYear && (
               <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 text-slate-600 border border-slate-100">
                 <MdCalendarMonth className="text-slate-400 text-lg" />
                 <span className="font-medium">{memberSinceYear}</span>
               </div>
            )}
          </div>

          {/* --- CONTACT BUTTONS --- */}
          {seller?.show_personal_details === 1 && (seller?.email || seller?.mobile) && (
            <div className="grid grid-cols-2 gap-3 w-full">
              
              {/* TELEFON DUGME (Otvara Modal) */}
              {seller?.mobile ? (
                <button
                  onClick={() => setIsPhoneModalOpen(true)}
                  className={cn(
                    "flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-medium transition-all duration-200",
                    "bg-primary text-white hover:bg-primary/90 shadow-sm hover:shadow-md active:scale-95 cursor-pointer"
                  )}
                >
                  <MdPhone className="text-lg" />
                  <span>Pozovi</span>
                </button>
              ) : (
                 <button disabled className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-medium bg-slate-100 text-slate-400 cursor-not-allowed">
                    <MdPhone className="text-lg" />
                    <span>Nema broj</span>
                 </button>
              )}

              {/* EMAIL DUGME */}
              {seller?.email ? (
                <a 
                  href={`mailto:${seller?.email}`}
                  className={cn(
                    "flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-medium transition-all duration-200",
                    "bg-white border border-slate-200 text-slate-700 hover:border-primary hover:text-primary hover:bg-primary/5 active:scale-95"
                  )}
                >
                  <MdOutlineMail className="text-lg" />
                  <span>Email</span>
                </a>
              ) : (
                  <button disabled className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-medium bg-slate-100 text-slate-400 cursor-not-allowed">
                    <MdOutlineMail className="text-lg" />
                    <span>Nema email</span>
                 </button>
              )}
            </div>
          )}
        </div>

        <div className="bg-slate-50 border-t border-slate-100 p-3 text-center">
            <CustomLink href={`/seller/${seller?.id}`} className="text-xs font-medium text-slate-500 hover:text-primary transition-colors">
                Pogledaj sve oglase ovog korisnika &rarr;
            </CustomLink>
        </div>
      </div>

      {/* 🔥 MODAL ZA TELEFON */}
      <Dialog open={isPhoneModalOpen} onOpenChange={setIsPhoneModalOpen}>
        <DialogContent className="sm:max-w-sm w-[90%] rounded-2xl p-0 overflow-hidden bg-white">
          
          <div className="bg-primary/10 p-6 flex flex-col items-center justify-center border-b border-primary/10">
             <CustomImage
                src={seller?.profile}
                alt="Seller"
                width={70}
                height={70}
                className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm mb-3"
             />
             <h3 className="font-bold text-lg text-slate-800">{seller?.name}</h3>
             <p className="text-slate-500 text-sm">Kontakt telefon</p>
          </div>

          <div className="p-6 space-y-4">
             {/* Prikaz broja */}
             <div 
               onClick={handleCopyPhone}
               className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center cursor-pointer hover:bg-slate-100 transition-colors active:scale-[0.98]"
             >
                <p className="text-2xl font-bold text-slate-800 tracking-wide">
                  {seller?.mobile}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Klikni da kopiraš broj
                </p>
             </div>

             {/* Dugmad */}
             <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={handleCopyPhone}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 active:scale-95 transition-all"
                >
                  {isCopied ? <MdCheck className="text-green-500 text-xl" /> : <MdContentCopy className="text-xl" />}
                  <span>{isCopied ? "Kopirano" : "Kopiraj"}</span>
                </button>

                <a 
                  href={`tel:${seller?.mobile}`}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium bg-primary text-white hover:bg-primary/90 active:scale-95 transition-all"
                >
                  <MdPhone className="text-xl" />
                  <span>Pozovi</span>
                </a>
             </div>
          </div>

          <div className="bg-slate-50 p-3 text-center border-t border-slate-100">
             <button onClick={() => setIsPhoneModalOpen(false)} className="text-sm text-slate-500 hover:text-slate-800">
               Zatvori
             </button>
          </div>

        </DialogContent>
      </Dialog>
    </>
  );
};

export default SellerDetailCard;