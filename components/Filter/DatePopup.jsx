"use client";

import { X, Calendar, Check, Clock, RotateCcw } from "@/components/Common/UnifiedIconPack";
import { useSearchParams, usePathname } from "next/navigation";
import { useNavigate } from "../Common/useNavigate"; 

const DatePopup = ({ onClose }) => {
  const { navigate } = useNavigate();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Trenutna vrijednost iz URL-a (ako nema, default je prazno/all-time)
  const currentValue = searchParams.get("date_posted") || "all-time";

  const options = [
    { label: "Bilo kada", value: "all-time", desc: "Prikaži sve oglase" },
    { label: "Danas", value: "today", desc: "Objavljeno u zadnja 24h" },
    { label: "Zadnjih 7 dana", value: "within-1-week", desc: "Oglasi iz protekle sedmice" },
    { label: "Zadnje 2 sedmice", value: "within-2-week", desc: "Noviji oglasi" },
    { label: "Zadnjih 30 dana", value: "within-1-month", desc: "Objavljeno u ovom mjesecu" },
    { label: "Zadnja 3 mjeseca", value: "within-3-month", desc: "Stariji oglasi" },
  ];

  const handleSelect = (value) => {
    const newSearchParams = new URLSearchParams(searchParams);
    
    // Ako je "all-time" ili ista vrijednost, brišemo filter
    if (value === "all-time") {
      newSearchParams.delete("date_posted");
    } else {
      newSearchParams.set("date_posted", value);
    }

    // Reset page na 1
    if (newSearchParams.has("page")) newSearchParams.set("page", "1");

    const url = `/ads?${newSearchParams.toString()}`;
    if (pathname.startsWith("/ads")) {
      window.history.pushState(null, "", url);
    } else {
      navigate(url);
    }
    
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm transition-all duration-300" 
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300" 
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* HEADER */}
        <div className="px-6 py-5 border-b border-gray-100 bg-white/95 backdrop-blur sticky top-0 z-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className="p-2 bg-orange-50 text-orange-600 rounded-xl">
                 <Calendar className="w-5 h-5" />
               </div>
               <div>
                 <h2 className="text-xl font-bold text-gray-900">Datum objave</h2>
                 <p className="text-xs text-gray-500 mt-0.5">Kada je oglas objavljen?</p>
               </div>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-gray-200">
          <div className="space-y-2">
            {options.map((opt) => {
              // Provjera aktivnog stanja
              // Ako je URL prazan, 'all-time' je aktivan.
              const isActive = currentValue === opt.value || (opt.value === 'all-time' && !searchParams.get("date_posted"));

              return (
                <button 
                  key={opt.value} 
                  onClick={() => handleSelect(opt.value)} 
                  className={`
                    w-full flex items-center justify-between p-4 rounded-xl text-left transition-all border
                    ${isActive 
                      ? "bg-blue-50 border-blue-200 shadow-sm" 
                      : "bg-white border-transparent hover:bg-gray-50 hover:border-gray-100"
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${isActive ? "bg-blue-200/50 text-blue-600" : "bg-gray-100 text-gray-400"}`}>
                       {opt.value === 'all-time' ? <RotateCcw className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                    </div>
                    <div>
                      <span className={`block text-sm ${isActive ? "font-bold text-blue-900" : "font-semibold text-gray-700"}`}>
                        {opt.label}
                      </span>
                      <span className={`text-xs ${isActive ? "text-blue-600" : "text-gray-400"}`}>
                        {opt.desc}
                      </span>
                    </div>
                  </div>

                  {isActive && (
                    <div className="bg-blue-600 rounded-full p-1">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* FOOTER (Optional description or extra space) */}
        <div className="p-4 border-t bg-gray-50 text-center text-xs text-gray-400">
          Odabirom datuma prikazuju se samo oglasi unutar tog perioda.
        </div>

      </div>
    </div>
  );
};

export default DatePopup;