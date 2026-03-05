"use client";

import { X, Radar, Trash2, MapPin, Navigation } from "@/components/Common/UnifiedIconPack";
import { useState, useEffect } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import { useSelector } from "react-redux";
import { getMaxRange, getMinRange } from "@/redux/reducer/settingSlice";
import { useNavigate } from "../Common/useNavigate"; 

// Česte udaljenosti za brzi odabir
const PRESETS = [5, 10, 20, 50, 100];

const RangePopup = ({ onClose }) => {
  const { navigate } = useNavigate();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Redux podaci (uz fallback vrijednosti ako nisu učitani)
  const minLimit = useSelector(getMinRange) || 0;
  const maxLimit = useSelector(getMaxRange) || 500;

  // State
  const [value, setValue] = useState(minLimit);

  // Sinhronizacija sa URL-om pri otvaranju
  useEffect(() => {
    const current = searchParams.get("km_range");
    if (current) {
      setValue(Number(current));
    } else {
      // Ako nema filtera, postavi na default (ili min)
      setValue(minLimit);
    }
  }, [searchParams, minLimit]);

  const handleApply = () => {
    const newSearchParams = new URLSearchParams(searchParams);
    
    // Ako je vrijednost veća od 0, postavi filter
    if (value > 0) {
      newSearchParams.set("km_range", value);
    } else {
      newSearchParams.delete("km_range");
    }

    if (newSearchParams.has("page")) newSearchParams.set("page", "1");

    const url = `/ads?${newSearchParams.toString()}`;
    if (pathname.startsWith("/ads")) {
      window.history.pushState(null, "", url);
    } else {
      navigate(url);
    }
    onClose();
  };

  const handleReset = () => {
    setValue(0); // Reset na 0 ili min
    // Opcionalno: odmah primijeni ili čekaj potvrdu
  };

  // Kalkulacija procenta za background slidera (da se plava boja popunjava)
  const getBackgroundSize = () => {
    return { backgroundSize: `${((value - minLimit) * 100) / (maxLimit - minLimit)}% 100%` };
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
               <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                 <Radar className="w-5 h-5" />
               </div>
               <div>
                 <h2 className="text-xl font-bold text-gray-900">Blizina</h2>
                 <p className="text-xs text-gray-500 mt-0.5">Radijus pretrage</p>
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
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-200">
          
          {/* VELIKI PRIKAZ VRIJEDNOSTI */}
          <div className="text-center mb-8 mt-2">
            <div className="inline-flex items-baseline gap-1">
               <span className="text-5xl font-extrabold text-blue-600 tracking-tight">
                 {value === 0 ? "0" : value}
               </span>
               <span className="text-xl font-semibold text-gray-400">km</span>
            </div>
            <p className="text-sm text-gray-500 mt-2 font-medium">
               {value === 0 
                 ? "Prikazuju se oglasi sa svih lokacija" 
                 : `Prikazuju se oglasi u krugu od ${value} km`
               }
            </p>
          </div>

          {/* SLIDER */}
          <div className="relative w-full h-6 mb-10 px-2">
            <input 
              type="range" 
              value={value} 
              onChange={(e) => setValue(Number(e.target.value))} 
              min={minLimit} 
              max={maxLimit} 
              // Tailwind nema default stilove za range track fill, pa koristimo accent-color
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
            <div className="flex justify-between mt-2 text-xs font-semibold text-gray-400">
              <span>{minLimit} km</span>
              <span>{maxLimit} km</span>
            </div>
          </div>

          {/* PRESETS (BRZI ODABIR) */}
          <div className="space-y-3">
             <div className="text-xs font-bold text-gray-400 uppercase tracking-wide ml-1">
               Brzi odabir
             </div>
             <div className="flex flex-wrap gap-2">
                {PRESETS.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setValue(preset)}
                    className={`
                      px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border
                      ${value === preset 
                        ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200" 
                        : "bg-gray-50 border-gray-100 text-gray-600 hover:bg-white hover:border-gray-200"
                      }
                    `}
                  >
                    {preset} km
                  </button>
                ))}
             </div>
          </div>

        </div>

        {/*  */}
        <div className="p-5 border-t bg-gray-50 flex gap-3">
           <button 
             onClick={handleReset}
             className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-white hover:border-gray-300 transition-colors"
           >
             <Trash2 className="w-4 h-4" />
             <span className="hidden sm:inline">Poništi</span>
           </button>
           <button 
             onClick={handleApply} 
             className="flex-1 py-3 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 active:scale-[0.98] transition-all shadow-lg shadow-gray-200 flex items-center justify-center gap-2"
           >
             <MapPin className="w-4 h-4" />
             Primijeni
           </button>
        </div>

      </div>
    </div>
  );
};

export default RangePopup;