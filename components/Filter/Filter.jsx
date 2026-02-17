"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SlidersHorizontal, MapPin, DollarSign, Calendar, Tag, X, Waypoints, Store } from "@/components/Common/UnifiedIconPack";
import { cn } from "@/lib/utils";
import CategoryPopup from "./CategoryPopup";
import BudgetPopup from "./BudgetPopup";
import DatePopup from "./DatePopup";
import RangePopup from "./RangePopup";
import ExtraDetailsPopup from "./ExtraDetailsPopup";
import SellerTypePopup from "./SellerTypePopup";
import { useSearchParams } from "next/navigation";
import useGetCategories from "../Layout/useGetCategories";

const LocationModal = dynamic(
  () => import("@/components/Location/LocationModal.jsx"),
  { ssr: false }
);


const Filter = ({
  railRef = null,
  customFields,
  extraDetails,
  setExtraDetails,
  newSearchParams,
  country,
  state,
  city,
  area,
  mobileCompact = false,
  mobileStickyActive = true,
  mobileUtilityRenderer = null,
  mobileUtilityHidden = false,
}) => {
  const searchParams = useSearchParams();
  const [activePopup, setActivePopup] = useState(null);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const { cateData, getCategories } = useGetCategories();

  const selectedCategory = searchParams.get("category") || "";
  const minPrice = searchParams.get("min_price");
  const maxPrice = searchParams.get("max_price");
  const datePosted = searchParams.get("date_posted");
  const kmRange = searchParams.get("km_range");
  const sellerType = searchParams.get("seller_type");
  const sellerVerified = searchParams.get("seller_verified") === "1";
  const isCompactMobile = Boolean(mobileCompact);
  const isMobileStickyActive = Boolean(mobileStickyActive);
  const showMobileUtility = Boolean(mobileUtilityRenderer) && !mobileUtilityHidden;
  const categoriesCount = Array.isArray(cateData) ? cateData.length : 0;

  useEffect(() => {
    if (categoriesCount > 0) return;
    getCategories(1);
  }, [categoriesCount, getCategories]);

  const prefetchCategories = useCallback(() => {
    if (categoriesCount > 0) return;
    getCategories(1);
  }, [categoriesCount, getCategories]);

  // Brojanje aktivnih filtera
  const getFilterCount = () => {
    let counts = {
      category: selectedCategory ? 1 : 0,
      location: (country || state || city || area) ? 1 : 0,
      budget: (minPrice || maxPrice) ? 1 : 0,
      date: datePosted ? 1 : 0,
      range: kmRange ? 1 : 0,
      seller: (sellerType && sellerType !== "all" ? 1 : 0) + (sellerVerified ? 1 : 0),
      details: Object.keys(extraDetails || {}).length,
    };
    return counts;
  };

  const counts = getFilterCount();
  const totalActive = Object.values(counts).reduce((a, b) => a + b, 0);
  const railTransition = { type: "spring", stiffness: 320, damping: 34, mass: 0.86 };

  const clearAllFilters = () => {
    const newSearchParams = new URLSearchParams();
    const lang = searchParams.get("lang");
    if (lang) newSearchParams.set("lang", lang);
    window.history.pushState(null, "", `/ads?${newSearchParams.toString()}`);
  };

  const handleLocationSaved = (locationData) => {
    const params = new URLSearchParams(window.location.search);
    const locationKeys = ["country", "state", "city", "area", "areaId", "lat", "lng"];

    locationKeys.forEach((key) => params.delete(key));

    if (!locationData) {
      params.delete("km_range");
      window.history.pushState(null, "", `/ads?${params.toString()}`);
      setIsLocationModalOpen(false);
      return;
    }

    const nextLocation = {
      country: locationData?.country,
      state: locationData?.state,
      city: locationData?.city,
      area: locationData?.area,
      areaId: locationData?.areaId,
      lat: locationData?.lat,
      lng: locationData?.long ?? locationData?.lng,
    };

    Object.entries(nextLocation).forEach(([key, value]) => {
      const hasValue = value === 0 || value === "0" || Boolean(value);
      if (hasValue) {
        params.set(key, String(value));
      } else {
        params.delete(key);
      }
    });

    params.delete("km_range");

    window.history.pushState(null, "", `/ads?${params.toString()}`);
    setIsLocationModalOpen(false);
  };

  // Komponenta za dugme sa modernim dizajnom i animacijama
  const FilterButton = ({ icon: Icon, label, count, onClick, active, onPointerEnter }) => (
    <motion.button
      type="button"
      whileTap={{ scale: 0.94 }}
      transition={{ type: "spring", stiffness: 420, damping: 30 }}
      onClick={onClick}
      onMouseEnter={onPointerEnter}
      onFocus={onPointerEnter}
      className={cn(
        "group relative flex items-center gap-2 rounded-full border transition-all duration-200 whitespace-nowrap outline-none select-none",
        isCompactMobile ? "h-10 w-10 justify-center p-0" : "px-3 py-2",
        active 
          ? "border-primary/35 bg-primary/10 text-primary shadow-[0_10px_24px_-16px_rgba(15,23,42,0.45)] dark:border-primary/45 dark:bg-primary/20"
          : "border-slate-200/90 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-100/80 hover:text-slate-800 hover:shadow-sm dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800"
      )}
      aria-label={label}
      title={label}
    >
      <Icon
        className={cn(
          "w-4 h-4 flex-shrink-0 transition-colors",
          active ? "text-primary" : "text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-200"
        )}
      />
      <span className={cn("font-medium text-sm", isCompactMobile ? "hidden" : "hidden md:inline")}>
        {label}
      </span>
      
      {/* Animirani badge sa brojem */}
      {count > 0 && (
        <span
          className={cn(
            "animate-in zoom-in duration-300 bg-primary text-white text-[10px] rounded-full min-w-[18px] h-[18px] px-1.5 text-center font-bold shadow-sm flex items-center justify-center",
              isCompactMobile ? "absolute -right-1 -top-1 ring-2 ring-white dark:ring-slate-900" : ""
            )}
          >
            {count}
          </span>
      )}
    </motion.button>
  );

  return (
    <>
      {/* GLAVNI KONTEJNER */}
      <div
        ref={railRef}
        className={cn(
          "sticky z-[31] border-b border-slate-200/80 bg-gradient-to-r from-slate-50/95 to-white/95 backdrop-blur-xl transition-[top,background-color,border-color] duration-300 ease-out dark:border-slate-800/80 dark:from-slate-900/95 dark:to-slate-900/90",
          isCompactMobile
            ? "py-2"
            : "py-3"
        )}
        style={{ top: "var(--lmx-mobile-header-offset, 0px)" }}
      >
        <div className="container">
          <motion.div
            layout
            initial={false}
            transition={railTransition}
            className="transition-[transform,opacity] duration-300 ease-out"
          >
            <motion.div
              layout
              initial={false}
              animate={{ opacity: 1 }}
              transition={railTransition}
              className={cn(
                "rounded-2xl border-transparent transition-all duration-300",
                isMobileStickyActive
                  ? "border-slate-200/90 bg-white/92 shadow-[0_14px_30px_-24px_rgba(15,23,42,0.42)] backdrop-blur-sm dark:border-slate-700/85 dark:bg-slate-900/95 dark:shadow-[0_16px_34px_-24px_rgba(2,6,23,0.85)]"
                  : "border-slate-200/70 bg-white/70 dark:border-slate-800/80 dark:bg-slate-900/75 shadow-none"
              )}
            >
              {/* Lista dugmadi sa skrivenim scrollbarom */}
              <motion.div
                layout
                initial={false}
                transition={railTransition}
                className={cn(
                  "flex items-center gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]",
                  isCompactMobile ? "px-0.5 py-0.5" : "px-1 py-1"
                )}
              >
                {/* Labela "Filteri" sa ikonom */}
                <div
                  className={cn(
                    "flex items-center gap-2 flex-shrink-0 rounded-full border border-slate-200/90 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200",
                    isCompactMobile ? "h-10 w-10 justify-center p-0" : "mr-1 px-3 py-2"
                  )}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span className={cn("text-sm font-semibold", isCompactMobile ? "hidden" : "hidden lg:inline")}>
                    Filteri
                  </span>
                </div>

                {/* Dugmad */}
                <FilterButton
                  icon={Tag}
                  label="Kategorija"
                  count={counts.category}
                  active={counts.category > 0}
                  onPointerEnter={prefetchCategories}
                  onClick={() => setActivePopup(activePopup === "category" ? null : "category")}
                />

                <FilterButton
                  icon={MapPin}
                  label="Lokacija"
                  count={counts.location}
                  active={counts.location > 0}
                  onClick={() => {
                    setActivePopup(null);
                    setIsLocationModalOpen(true);
                  }}
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

                <FilterButton
                  icon={Store}
                  label="Prodavač"
                  count={counts.seller}
                  active={counts.seller > 0}
                  onClick={() => setActivePopup(activePopup === "seller" ? null : "seller")}
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
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.94 }}
                    transition={{ type: "spring", stiffness: 420, damping: 30 }}
                    onClick={clearAllFilters}
                    className={cn(
                      "group ml-auto flex-shrink-0 rounded-full border transition-all whitespace-nowrap",
                      isCompactMobile
                        ? "grid h-10 w-10 place-items-center border-red-200/80 bg-red-50 text-red-500 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
                        : "flex items-center gap-1.5 border-slate-200 px-3 py-2 text-sm font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-red-300 dark:hover:bg-red-950/30"
                    )}
                    aria-label="Poništi filtere"
                    title="Poništi filtere"
                  >
                    <X className="w-4 h-4 transition-transform group-hover:rotate-90" />
                    <span className={cn("hidden sm:inline", isCompactMobile ? "hidden" : "")}>Poništi</span>
                  </motion.button>
                )}

                <div className="w-1 flex-shrink-0" />
              </motion.div>
            </motion.div>
          </motion.div>

        </div>
      </div>

      <div className="md:hidden">
        <AnimatePresence initial={false} mode="wait">
          {showMobileUtility ? (
            <motion.div
              key={isCompactMobile ? "mobile-utility-floating-compact" : "mobile-utility-floating-expanded"}
              initial={{ opacity: 0, y: 16, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.985 }}
              transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
              className="fixed left-0 right-0 z-[66] flex justify-center px-3 sm:px-4 pointer-events-none"
              style={{
                bottom: "calc(var(--lmx-mobile-viewport-bottom-offset, 0px) + 12px)",
              }}
            >
              <div className="w-fit max-w-[calc(100vw-1.5rem)] sm:max-w-[calc(100vw-2rem)] pointer-events-auto">
                {mobileUtilityRenderer?.(isCompactMobile)}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Popups Sekcija */}
      {activePopup === "category" && (
        <CategoryPopup
          onClose={() => setActivePopup(null)}
          extraDetails={extraDetails}
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

      {activePopup === "seller" && (
        <SellerTypePopup onClose={() => setActivePopup(null)} />
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

      <LocationModal
        IsLocationModalOpen={isLocationModalOpen}
        setIsLocationModalOpen={setIsLocationModalOpen}
        navigateOnSave={false}
        onLocationSaved={handleLocationSaved}
      />
    </>
  );
};

export default Filter;
