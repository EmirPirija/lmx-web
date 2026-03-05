"use client";

import { X, Wallet, ArrowRight, Trash2, Banknote } from "@/components/Common/UnifiedIconPack";
import { useState, useEffect } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import { useNavigate } from "../Common/useNavigate"; 

const PREDEFINED_RANGES = [
  { label: "Do 50 KM", min: "", max: "50" },
  { label: "50 - 100 KM", min: "50", max: "100" },
  { label: "100 - 500 KM", min: "100", max: "500" },
  { label: "500 - 1000 KM", min: "500", max: "1000" },
  { label: "Preko 1000 KM", min: "1000", max: "" },
];

const BudgetPopup = ({ onClose }) => {
  const { navigate } = useNavigate();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // State
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  // Učitaj početne vrijednosti iz URL-a
  useEffect(() => {
    setMinPrice(searchParams.get("min_price") || "");
    setMaxPrice(searchParams.get("max_price") || "");
  }, [searchParams]);

  // Apply logika
  const handleApply = () => {
    const newSearchParams = new URLSearchParams(searchParams);
    
    if (minPrice) newSearchParams.set("min_price", minPrice);
    else newSearchParams.delete("min_price");
    
    if (maxPrice) newSearchParams.set("max_price", maxPrice);
    else newSearchParams.delete("max_price");

    // Reset page on filter change
    if (newSearchParams.has("page")) newSearchParams.set("page", "1");

    const url = `/ads?${newSearchParams.toString()}`;
    if (pathname.startsWith("/ads")) {
      window.history.pushState(null, "", url);
    } else {
      navigate(url);
    }
    onClose();
  };

  // Reset logika
  const handleReset = () => {
    setMinPrice("");
    setMaxPrice("");
    // Opcionalno: Odmah primijeni reset ili čekaj klik na "Primijeni"
    // Ovdje samo čistimo inpute da korisnik vidi promjenu prije potvrde
  };

  // Helper za postavljanje brzih opcija
  const setRange = (min, max) => {
    setMinPrice(min);
    setMaxPrice(max);
  };

  // Provjera da li je brza opcija aktivna
  const isRangeActive = (min, max) => {
    return minPrice === min && maxPrice === max;
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
               <div className="p-2 bg-green-50 text-green-600 rounded-xl">
                 <Wallet className="w-5 h-5" />
               </div>
               <div>
                 <h2 className="text-xl font-bold text-gray-900">Budžet</h2>
                 <p className="text-xs text-gray-500 mt-0.5">Odredi raspon cijene</p>
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
          
          {/* INPUTI */}
          <div className="flex items-center gap-4 mb-8">
            {/* OD */}
            <div className="flex-1 relative group">
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block ml-1">Od</label>
              <div className="relative">
                <input 
                  type="number" 
                  value={minPrice} 
                  onChange={(e) => setMinPrice(e.target.value)} 
                  placeholder="0"
                  className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl text-lg font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all placeholder:text-gray-300"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400 pointer-events-none">KM</span>
              </div>
            </div>

            <ArrowRight className="w-5 h-5 text-gray-300 mt-6" />

            {/* DO */}
            <div className="flex-1 relative group">
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block ml-1">Do</label>
              <div className="relative">
                <input 
                  type="number" 
                  value={maxPrice} 
                  onChange={(e) => setMaxPrice(e.target.value)} 
                  placeholder="∞"
                  className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl text-lg font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all placeholder:text-gray-300"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400 pointer-events-none">KM</span>
              </div>
            </div>
          </div>

          {/* BRZE OPCIJE */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Banknote className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-semibold text-gray-600">Brzi odabir</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {PREDEFINED_RANGES.map((range) => {
                const isActive = isRangeActive(range.min, range.max);
                return (
                  <button
                    key={range.label}
                    onClick={() => setRange(range.min, range.max)}
                    className={`
                      px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border
                      ${isActive 
                        ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200" 
                        : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                      }
                    `}
                  >
                    {range.label}
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* FOOTER */}
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
             className="flex-1 py-3 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 active:scale-[0.98] transition-all shadow-lg shadow-gray-200"
           >
             Primijeni cijenu
           </button>
        </div>

      </div>
    </div>
  );
};

export default BudgetPopup;