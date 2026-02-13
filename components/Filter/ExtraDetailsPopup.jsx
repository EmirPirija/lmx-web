"use client";

import { X, ChevronDown, Check, Trash2, Settings, Layers } from "@/components/Common/UnifiedIconPack";
import { useSearchParams } from "next/navigation";
import { useState, useEffect, useMemo } from "react";

// --- INTERNA KOMPONENTA: SKELETON LOADER ---
const FilterSkeleton = () => (
  <div className="space-y-8 animate-pulse">
    {[1, 2].map((section) => (
      <div key={section} className="space-y-4">
        {/* Naslov sekcije */}
        <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
           <div className="h-5 w-5 bg-gray-200 rounded"></div>
           <div className="h-5 w-32 bg-gray-200 rounded"></div>
        </div>
        {/* Polja */}
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="flex gap-2 flex-wrap">
              <div className="h-10 bg-gray-100 rounded-full w-24"></div>
              <div className="h-10 bg-gray-100 rounded-full w-32"></div>
              <div className="h-10 bg-gray-100 rounded-full w-20"></div>
            </div>
          </div>
        ))}
      </div>
    ))}
  </div>
);

// --- GLAVNA KOMPONENTA ---
const ExtraDetailsPopup = ({ onClose, customFields, isLoading = false }) => {
  const searchParams = useSearchParams();
  const [localParams, setLocalParams] = useState(new URLSearchParams(searchParams));

  // Sinhronizacija sa URL-om
  useEffect(() => {
    setLocalParams(new URLSearchParams(searchParams));
  }, [searchParams]);

  // --- OVDJE JE PROMJENA ---
  // Filtriramo i grupišemo polja. Ako su prazna, ne ulaze u nizove.
  const { specs, equipment } = useMemo(() => {
    const specs = [];
    const equipment = [];

    if (!customFields) return { specs, equipment };

    customFields.forEach(field => {
      // 1. Validacija: Ako polje nema opcija (values), preskoči ga
      // Ovo rješava problem prazne "Kilometraže" ako je to input polje bez predefinisanih vrijednosti
      if (!field.values || field.values.length === 0) return;

      // 2. Validacija: Ako želimo prikazati samo specifične tipove
      // Ako tvoj backend šalje 'number' ili 'text', a ovdje nemamo input za njih, sakrij ih:
      const supportedTypes = ['dropdown', 'radio', 'checkbox'];
      if (!supportedTypes.includes(field.type)) return;

      // Razvrstavanje
      if (field.type === 'checkbox') {
        equipment.push(field);
      } else {
        specs.push(field);
      }
    });

    return { specs, equipment };
  }, [customFields]);

  // LOGIKA MIJENJANJA FILTERA
  const handleChange = (fieldId, value, isCheckbox = false) => {
    const newSearchParams = new URLSearchParams(searchParams);
    
    if (isCheckbox) {
      const existing = (searchParams.get(fieldId) || "").split(",").filter(Boolean);
      const isSelected = existing.includes(value);
      const updated = isSelected 
        ? existing.filter((v) => v !== value) 
        : [...existing, value];

      if (updated.length > 0) newSearchParams.set(fieldId, updated.join(","));
      else newSearchParams.delete(fieldId);
      
    } else {
      const currentVal = newSearchParams.get(fieldId);
      if (currentVal === value) {
        newSearchParams.delete(fieldId);
      } else {
        if (value) newSearchParams.set(fieldId, value);
        else newSearchParams.delete(fieldId);
      }
    }

    window.history.pushState(null, "", `/ads?${newSearchParams.toString()}`);
    setLocalParams(newSearchParams);
  };

  const clearAll = () => {
    const newSearchParams = new URLSearchParams(searchParams);
    customFields.forEach(field => newSearchParams.delete(field.id));
    window.history.pushState(null, "", `/ads?${newSearchParams.toString()}`);
    setLocalParams(newSearchParams);
  };

  const isActive = (fieldId, value) => {
    const current = localParams.get(fieldId);
    if (!current) return false;
    return current.split(",").includes(String(value));
  };

  // HELPER ZA RENDER
  const renderField = (field) => (
    <div key={field.id} className="group">
      <label className="block text-sm font-semibold text-gray-700 mb-3 ml-1">
        {field.translated_name || field.name}
      </label>

      {field.type === "dropdown" && (
        <div className="relative group/select">
          <select 
            onChange={(e) => handleChange(field.id, e.target.value)} 
            value={localParams.get(field.id) || ""}
            className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-3 px-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer hover:bg-white hover:border-gray-300"
          >
            <option value="">Sve opcije</option>
            {field.values.map((v, i) => (
              <option key={v} value={v}>
                {field.translated_value?.[i] || v}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-hover/select:text-gray-600 transition-colors pointer-events-none" />
        </div>
      )}

      {(field.type === "radio" || field.type === "checkbox") && (
        <div className="flex flex-wrap gap-2">
          {field.values.map((v, i) => {
            const active = isActive(field.id, v);
            return (
              <button
                key={v}
                onClick={() => handleChange(field.id, v, field.type === 'checkbox')}
                className={`
                  px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 border flex items-center gap-2 select-none
                  ${active 
                    ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200 hover:bg-blue-700" 
                    : "bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                  }
                `}
              >
                {active && <Check className="w-3.5 h-3.5 animate-in zoom-in duration-200" />}
                {field.translated_value?.[i] || v}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm transition-all duration-300" 
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b flex items-center justify-between bg-white/95 backdrop-blur sticky top-0 z-20">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Filteri i detalji</h2>
            <p className="text-xs text-gray-500 mt-0.5">Prilagodi pretragu svojim potrebama</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
          {isLoading ? (
            <FilterSkeleton />
          ) : (
            <div className="space-y-10 pb-6">
              
              {specs.length > 0 && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-2 mb-6 pb-2 border-b border-gray-100">
                    <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                      <Settings className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Osnovne informacije</h3>
                  </div>
                  <div className="space-y-6">
                    {specs.map(renderField)}
                  </div>
                </div>
              )}

              {equipment.length > 0 && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
                   <div className="flex items-center gap-2 mb-6 pb-2 border-b border-gray-100 mt-2">
                    <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
                      <Layers className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Dodatna oprema</h3>
                  </div>
                  <div className="space-y-6">
                    {equipment.map(renderField)}
                  </div>
                </div>
              )}

              {/* EMPTY STATE - Ako su sva polja sakrivena */}
              {!isLoading && specs.length === 0 && equipment.length === 0 && (
                <div className="text-center py-10 flex flex-col items-center">
                  <div className="bg-gray-100 p-4 rounded-full mb-3">
                    <Settings className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-gray-500">Nema dostupnih filtera za ovu kategoriju.</p>
                </div>
              )}

            </div>
          )}
        </div>

        <div className="p-5 border-t bg-gray-50 flex gap-3 z-20">
          <button 
            onClick={clearAll} 
            className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-white hover:border-gray-300 transition-all hover:shadow-sm"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Poništi sve</span>
          </button>
          <button 
            onClick={onClose} 
            className="flex-1 py-3 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 active:scale-[0.98] transition-all shadow-lg shadow-gray-200 flex items-center justify-center gap-2"
          >
            Prikaži rezultate
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExtraDetailsPopup;