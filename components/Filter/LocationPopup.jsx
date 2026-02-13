"use client";

import { X, Search, MapPin, ChevronRight, Check, Loader2, Globe, CornerDownRight } from "@/components/Common/UnifiedIconPack";
import { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import { useNavigate } from "../Common/useNavigate"; 

// --- MOCK PODACI: POČETNE ZEMLJE ---
const INITIAL_COUNTRIES = [
  { id: 'ba', name: "Bosna i Hercegovina", slug: "ba", has_children: true },
  { id: 'hr', name: "Hrvatska", slug: "hr", has_children: true },
  { id: 'rs', name: "Srbija", slug: "rs", has_children: true },
  { id: 'si', name: "Slovenija", slug: "si", has_children: true },
  { id: 'me', name: "Crna Gora", slug: "me", has_children: true },
];

// --- MOCK API ZA GRADOVE (Zamijeni sa stvarnim API pozivom) ---
const fetchCitiesForCountry = async (countryId) => {
  // Simulacija API-ja
  await new Promise(r => setTimeout(r, 400)); // Delay
  
  if (countryId === 'ba') {
    return [
      { id: 1, name: "Sarajevo", slug: "sarajevo" },
      { id: 2, name: "Banja Luka", slug: "banja-luka" },
      { id: 3, name: "Tuzla", slug: "tuzla" },
      { id: 4, name: "Zenica", slug: "zenica" },
      { id: 5, name: "Mostar", slug: "mostar" },
    ];
  }
  if (countryId === 'hr') {
    return [
      { id: 10, name: "Zagreb", slug: "zagreb" },
      { id: 11, name: "Split", slug: "split" },
    ];
  }
  return [];
};

const LocationPopup = ({ onClose, extraDetails = {}, country, state, city, area }) => {
  const { navigate } = useNavigate();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  const [selectedCountry, setSelectedCountry] = useState(null);
  const [cities, setCities] = useState([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);

  // --- LOGIKA ODABIRA ---
  const selectLocation = (slug) => {
    const newSearchParams = new URLSearchParams(searchParams);
    
    if (slug) newSearchParams.set("location", slug);
    else newSearchParams.delete("location");

    // Reset page
    if (newSearchParams.has("page")) newSearchParams.set("page", "1");
    // Očisti extra detalje pri promjeni lokacije (opcionalno)
    Object.keys(extraDetails || {}).forEach((key) => newSearchParams.delete(key));

    const url = `/ads?${newSearchParams.toString()}`;
    if (pathname.startsWith("/ads")) window.history.pushState(null, "", url);
    else navigate(url);
    
    onClose();
  };

  // --- LOGIKA OTVARANJA DRŽAVE (ACCORDION) ---
  const handleCountryClick = async (country) => {
    // Ako je već otvorena, zatvori je
    if (selectedCountry?.id === country.id) {
      setSelectedCountry(null);
      return;
    }

    setIsLoadingCities(true);
    setSelectedCountry(country);
    setCities([]); // Resetuj stare gradove dok učitavaš nove

    try {
      // OVDJE POZOVI SVOJ API ZA GRADOVE
      const data = await fetchCitiesForCountry(country.id);
      setCities(data);
    } catch (err) {
      console.error("Greška pri učitavanju gradova", err);
    } finally {
      setIsLoadingCities(false);
    }
  };

  // --- SEARCH LOGIKA (MOCK) ---
  // U stvarnosti ovdje koristiš API endpoint ?search=...
  useEffect(() => {
    if (searchTerm.length < 2) {
      setIsSearching(false);
      return;
    }
    
    setIsSearching(true);
    // Simulacija pretrage (Zamijeni sa API fetchom)
    const timer = setTimeout(() => {
      // Mock result
      setSearchResults([
        { id: 99, name: "Sarajevo (BiH)", slug: "sarajevo" },
        { id: 98, name: "Zagreb (HR)", slug: "zagreb" },
      ].filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase())));
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const currentLocationSlug = searchParams.get("location");
  const locationSummary = useMemo(() => {
    const parts = [area, city, state, country].filter(Boolean);
    if (parts.length > 0) {
      return parts.join(", ");
    }
    return currentLocationSlug || "Sve lokacije";
  }, [area, city, state, country, currentLocationSlug]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm transition-all duration-300" onClick={onClose}>
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300" onClick={(e) => e.stopPropagation()}>
        
        {/* HEADER */}
        <div className="px-6 py-5 border-b border-gray-100 bg-white/95 backdrop-blur sticky top-0 z-20 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Lokacija</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {isSearching ? "Rezultati pretrage" : "Odaberi državu ili grad"}
              </p>
            </div>
            <button onClick={onClose} className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* SEARCH */}
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Traži grad..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-gray-200">
          <div className="mb-4 rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center text-lg">
                📌
              </div>
              <div className="flex-1">
                <p className="text-xs uppercase tracking-wide text-gray-400">Aktivna lokacija</p>
                <p className="text-sm font-semibold text-gray-800">{locationSummary}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Brzo filtriraj oglase po gradu, regiji ili cijeloj državi.
                </p>
              </div>
              {currentLocationSlug && (
                <button
                  onClick={() => selectLocation(null)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  Poništi
                </button>
              )}
            </div>
          </div>
          
          {/* OPCIJA: SVE ZEMLJE (Reset) */}
          {!isSearching && (
            <button 
              onClick={() => selectLocation(null)} 
              className={`w-full p-4 mb-2 rounded-xl flex items-center gap-3 transition-all border border-transparent
                ${!currentLocationSlug 
                  ? "bg-blue-50 border-blue-200 text-blue-700 font-medium" 
                  : "hover:bg-gray-50 text-gray-700"
                }`}
            >
              <div className={`p-2 rounded-lg ${!currentLocationSlug ? "bg-blue-100" : "bg-gray-100"}`}>
                 <Globe className="w-5 h-5" />
              </div>
              <span className="text-sm font-bold">Sve zemlje</span>
              {!currentLocationSlug && <Check className="w-5 h-5 ml-auto text-blue-600" />}
            </button>
          )}

          <div className="space-y-1">
            {isSearching ? (
              // --- SEARCH RESULT MODE ---
              searchResults.length > 0 ? (
                searchResults.map((loc) => (
                  <button 
                    key={loc.id} 
                    onClick={() => selectLocation(loc.slug)} 
                    className="w-full flex items-center gap-3 p-3 rounded-xl text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="p-1.5 rounded-lg bg-gray-100 text-gray-400"><MapPin className="w-4 h-4" /></div>
                    <span className="text-sm font-semibold text-gray-700">{loc.name}</span>
                  </button>
                ))
              ) : (
                 <div className="text-center py-8 text-gray-500 text-sm">Nema rezultata.</div>
              )
            ) : (
              // --- COUNTRY LIST MODE ---
              INITIAL_COUNTRIES.map((country) => {
                const isExpanded = selectedCountry?.id === country.id;
                // Da li je odabrana ova država (ili grad unutar nje - ovo je teže provjeriti bez API-ja, pa ostavljamo simple)
                const isSelected = currentLocationSlug === country.slug;

                return (
                  <div key={country.id} className="group overflow-hidden rounded-xl transition-all select-none">
                    
                    {/* DRŽAVA RED */}
                    <div 
                      onClick={() => handleCountryClick(country)}
                      className={`flex items-center justify-between p-3 cursor-pointer transition-colors
                        ${isSelected ? 'bg-blue-50/50' : 'hover:bg-gray-50'}
                      `}
                    >
                      <div className="flex items-center gap-3">
                        {/* Zastava ili Globe ikona */}
                        <div className={`p-1.5 rounded-lg ${isSelected ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-400"}`}>
                           <Globe className="w-4 h-4" />
                        </div>
                        <span className={`text-sm ${isSelected ? "font-bold text-blue-700" : "font-semibold text-gray-700"}`}>
                          {country.name}
                        </span>
                      </div>
                      
                      {/* Indikator */}
                      <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isExpanded ? "rotate-90 text-blue-600" : ""}`} />
                    </div>

                    {/* LISTA GRADOVA (Harmonika) */}
                    <div className={`grid transition-[grid-template-rows] duration-300 ease-out pl-4 ${isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                      <div className="overflow-hidden">
                        <div className="pl-3 border-l-2 border-gray-100 my-1 py-1 space-y-1">
                           
                           {/* Loading State */}
                           {isLoadingCities ? (
                               <div className="flex items-center gap-2 py-2 px-2 text-xs text-gray-400">
                                 <Loader2 className="w-3 h-3 animate-spin" /> Učitavanje gradova...
                               </div>
                           ) : (
                             <>
                               {/* OPCIJA 1: CIJELA TA DRŽAVA */}
                               <button 
                                  onClick={(e) => { e.stopPropagation(); selectLocation(country.slug); }}
                                  className={`w-full flex items-center justify-between p-2.5 rounded-lg text-sm transition-colors text-left font-bold text-blue-600 hover:bg-blue-50`}
                                >
                                  <span>Cijela {country.name}</span>
                                </button>

                               {/* OPCIJA 2: GRADOVI */}
                               {cities.map((city) => {
                                  const isCitySelected = currentLocationSlug === city.slug;
                                  return (
                                    <button 
                                      key={city.id} 
                                      onClick={(e) => { e.stopPropagation(); selectLocation(city.slug); }}
                                      className={`w-full flex items-center justify-between p-2.5 rounded-lg text-sm transition-colors text-left
                                        ${isCitySelected ? "bg-blue-50 text-blue-700 font-semibold" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}
                                      `}
                                    >
                                      <div className="flex items-center gap-2">
                                        <CornerDownRight className="w-3.5 h-3.5 text-gray-300" />
                                        <span>{city.name}</span>
                                      </div>
                                      {isCitySelected && <Check className="w-3.5 h-3.5" />}
                                    </button>
                                  );
                               })}
                             </>
                           )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationPopup;