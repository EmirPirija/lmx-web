import { useState } from "react";
import { SlidersHorizontal, MapPin, DollarSign, Calendar, Tag, X, Waypoints } from "lucide-react";
import { cn } from "@/lib/utils";
import CategoryPopup from "./CategoryPopup";
import LocationPopup from "./LocationPopup";
import BudgetPopup from "./BudgetPopup";
import DatePopup from "./DatePopup";
import RangePopup from "./RangePopup";
import ExtraDetailsPopup from "./ExtraDetailsPopup";
import { useSearchParams } from "next/navigation";


const Filter = ({
  customFields,
  extraDetails,
  setExtraDetails,
  newSearchParams,
  country,
  state,
  city,
  area,
}) => {
  const searchParams = useSearchParams();
  const [activePopup, setActivePopup] = useState(null);

  const urlParams = new URLSearchParams(window.location.search);
  const selectedCategory = urlParams.get("category") || "";
  const minPrice = searchParams.get("min_price");
  const maxPrice = searchParams.get("max_price");
  const datePosted = searchParams.get("date_posted");
  const kmRange = searchParams.get("km_range");

  // Brojanje aktivnih filtera
  const getFilterCount = () => {
    let counts = {
      category: selectedCategory ? 1 : 0,
      location: (country || state || city || area) ? 1 : 0,
      budget: (minPrice || maxPrice) ? 1 : 0,
      date: datePosted ? 1 : 0,
      range: kmRange ? 1 : 0,
      details: Object.keys(extraDetails || {}).length,
    };
    return counts;
  };

  const counts = getFilterCount();
  const totalActive = Object.values(counts).reduce((a, b) => a + b, 0);

  const clearAllFilters = () => {
    const newSearchParams = new URLSearchParams();
    const lang = searchParams.get("lang");
    if (lang) newSearchParams.set("lang", lang);
    window.history.pushState(null, "", `/ads?${newSearchParams.toString()}`);
  };

  // Komponenta za dugme sa modernim dizajnom i animacijama
  const FilterButton = ({ icon: Icon, label, count, onClick, active }) => (
    <button
      onClick={onClick}
      className={cn(
        "group flex items-center gap-2 px-3 py-2 rounded-full border transition-all duration-200 whitespace-nowrap outline-none select-none",
        "active:scale-95", // Klik animacija (smanjivanje)
        active 
          ? "border-blue-500 bg-blue-50/80 text-blue-700 shadow-sm ring-2 ring-blue-100 ring-offset-0" 
          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm"
      )}
    >
      <Icon className={cn("w-4 h-4 flex-shrink-0 transition-colors", active ? "text-blue-600" : "text-gray-500 group-hover:text-gray-700")} />
      <span className="hidden sm:inline font-medium text-sm">{label}</span>
      
      {/* Animirani badge sa brojem */}
      {count > 0 && (
        <span className="animate-in zoom-in duration-300 px-1.5 py-0.5 bg-blue-600 text-white text-[10px] rounded-full min-w-[18px] text-center font-bold shadow-sm">
          {count}
        </span>
      )}
    </button>
  );

  return (
    <>
      {/* GLAVNI KONTEJNER: Sticky + Glassmorphism */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200/80 py-3 shadow-sm transition-all">
        <div className="container relative">
          
          {/* Lijevi fade gradient (estetika) */}
          <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-white/90 to-transparent z-10 pointer-events-none md:hidden" />
          
          {/* Desni fade gradient (sugeriše skrolanje) */}
          <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white/90 to-transparent z-10 pointer-events-none" />

          {/* Lista dugmadi sa skrivenim scrollbarom */}
          <div className="flex items-center gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] px-1 py-1">
            
            {/* Labela "Filteri" sa ikonom */}
            <div className="flex items-center gap-2 mr-2 flex-shrink-0 pl-1">
              <div className="p-1.5 bg-gray-100 rounded-md">
                <SlidersHorizontal className="w-4 h-4 text-gray-700" />
              </div>
              <span className="text-sm font-bold text-gray-900 hidden lg:inline">Filteri</span>
            </div>

            {/* Vertikalni separator */}
            <div className="h-6 w-px bg-gray-200 mx-1 flex-shrink-0 hidden sm:block"></div>

            {/* Dugmad */}
            <FilterButton
              icon={Tag}
              label="Kategorija"
              count={counts.category}
              active={counts.category > 0}
              onClick={() => setActivePopup(activePopup === "category" ? null : "category")}
            />

            <FilterButton
              icon={MapPin}
              label="Lokacija"
              count={counts.location}
              active={counts.location > 0}
              onClick={() => setActivePopup(activePopup === "location" ? null : "location")}
            />

            <FilterButton
              icon={DollarSign}
              label="Cijena"
              count={counts.budget}
              active={counts.budget > 0}
              onClick={() => setActivePopup(activePopup === "budget" ? null : "budget")}
            />

            <FilterButton
              icon={Calendar}
              label="Datum"
              count={counts.date}
              active={counts.date > 0}
              onClick={() => setActivePopup(activePopup === "date" ? null : "date")}
            />

            <FilterButton
              icon={Waypoints}
              label="Blizina"
              count={counts.range}
              active={counts.range > 0}
              onClick={() => setActivePopup(activePopup === "range" ? null : "range")}
            />

            {customFields && customFields.length > 0 && (
              <FilterButton
                icon={SlidersHorizontal}
                label="Detalji"
                count={counts.details}
                active={counts.details > 0}
                onClick={() => setActivePopup(activePopup === "details" ? null : "details")}
              />
            )}

            {/* Dugme "Poništi" - pojavljuje se samo ako ima aktivnih filtera */}
            {totalActive > 0 && (
              <button
                onClick={clearAllFilters}
                className="group flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-all whitespace-nowrap ml-auto flex-shrink-0 active:scale-95"
              >
                <X className="w-4 h-4 transition-transform group-hover:rotate-90" />
                <span className="hidden sm:inline">Poništi</span>
              </button>
            )}
            
            {/* Prazan prostor na kraju da zadnje dugme ne bude odsječeno fade efektom */}
            <div className="w-4 flex-shrink-0"></div>
          </div>
        </div>
      </div>

      {/* Popups Sekcija */}
      {activePopup === "category" && (
        <CategoryPopup
          onClose={() => setActivePopup(null)}
          extraDetails={extraDetails}
        />
      )}

      {activePopup === "location" && (
        <LocationPopup
          onClose={() => setActivePopup(null)}
          country={country}
          state={state}
          city={city}
          area={area}
        />
      )}

      {activePopup === "budget" && (
        <BudgetPopup onClose={() => setActivePopup(null)} />
      )}

      {activePopup === "date" && (
        <DatePopup onClose={() => setActivePopup(null)} />
      )}

      {activePopup === "range" && (
        <RangePopup onClose={() => setActivePopup(null)} />
      )}

      {activePopup === "details" && (
        <ExtraDetailsPopup
          onClose={() => setActivePopup(null)}
          customFields={customFields}
          extraDetails={extraDetails}
          setExtraDetails={setExtraDetails}
          newSearchParams={newSearchParams}
        />
      )}
    </>
  );
};

export default Filter;