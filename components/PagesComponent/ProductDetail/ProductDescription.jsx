import { useEffect, useRef, useState } from "react";
import parse from "html-react-parser";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import { MdDescription } from "react-icons/md";
import { cn } from "@/lib/utils";
 
const ProductDescription = ({ productDetails }) => {
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const descriptionRef = useRef(null);
 
  const translated_item = productDetails?.translated_item;
  const fullDescription =
    translated_item?.description?.replace(/\n/g, "<br />") ||
    productDetails?.description?.replace(/\n/g, "<br />");
 
  useEffect(() => {
    const descriptionBody = descriptionRef.current;
    if (descriptionBody) {
      // Provjeri da li je sadržaj veći od max visine (250px)
      setIsOverflowing(descriptionBody.scrollHeight > 250);
    }
  }, [fullDescription]);
 
  return (
    <div className="flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="bg-slate-50/50 dark:bg-slate-800/50 px-5 lg:px-6 py-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm">
            <MdDescription className="text-slate-600 dark:text-slate-300 text-xl" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              Opis oglasa
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Detaljne informacije o artiklu</p>
          </div>
        </div>
      </div>
 
      {/* Sadržaj */}
      <div className="p-5 lg:p-6 relative">
        <div
          className={cn(
            "prose prose-sm lg:prose-base max-w-none text-slate-700 dark:text-slate-300 leading-relaxed overflow-hidden transition-[max-height] duration-500 ease-in-out",
            showFullDescription ? "max-h-[5000px]" : "max-h-[250px]"
          )}
          ref={descriptionRef}
        >
          {parse(fullDescription || "<p class='text-slate-400 italic'>Opis nije dostupan za ovaj oglas.</p>")}
        </div>
 
        {/* Fade Overlay kada je skupljeno */}
        {!showFullDescription && isOverflowing && (
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white dark:from-slate-900 to-transparent pointer-events-none" />
        )}
      </div>
 
      {/* Dugme Prikaži više/manje */}
      {isOverflowing && (
        <div className="px-5 lg:px-6 pb-5 pt-0">
          <button
            onClick={() => setShowFullDescription(!showFullDescription)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-primary dark:text-primary-400 font-bold text-sm rounded-xl border border-slate-100 dark:border-slate-700 transition-all duration-300 group"
          >
            <span>{showFullDescription ? "Prikaži manje" : "Pročitaj detaljan opis"}</span>
            {showFullDescription ? (
              <FaChevronUp className="group-hover:-translate-y-0.5 transition-transform" />
            ) : (
              <FaChevronDown className="group-hover:translate-y-0.5 transition-transform" />
            )}
          </button>
        </div>
      )}
    </div>
  );
};
 
export default ProductDescription;