import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { getCurrentLangCode } from "@/redux/reducer/languageSlice";
import { t } from "@/utils";
import { X, ChevronDown, ChevronUp, SlidersHorizontal } from "@/components/Common/UnifiedIconPack";
import { cn } from "@/lib/utils";
import ModernFilterTree from "./ModernFilterTree";
import ModernLocationTree from "./ModernLocationTree";
import ModernBudgetFilter from "./ModernBudgetFilter";
import ModernDatePostedFilter from "./ModernDatePostedFilter";
import ModernRangeFilter from "./ModernRangeFilter";
import ModernExtraDetailsFilter from "./ModernExtraDetailsFilter";
import ActiveFilters from "./ActiveFilters";

const ModernFilter = ({
  customFields,
  extraDetails,
  setExtraDetails,
  newSearchParams,
  country,
  state,
  city,
  area,
}) => {
  const langId = useSelector(getCurrentLangCode);
  const [expandedSections, setExpandedSections] = useState({
    category: true,
    location: true,
    budget: false,
    datePosted: false,
    range: false,
    extraDetails: false,
  });

  const isShowCustomfieldFilter =
    customFields &&
    customFields.length > 0 &&
    customFields.some(
      (field) =>
        field.type === "checkbox" ||
        field.type === "radio" ||
        field.type === "dropdown"
    );

  // Auto-expand extraDetails if we have custom fields
  useEffect(() => {
    if (isShowCustomfieldFilter) {
      setExpandedSections(prev => ({ ...prev, extraDetails: true }));
    }
  }, [isShowCustomfieldFilter]);

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const FilterSection = ({ title, section, children, badge }) => (
    <div className="border-b border-gray-200 last:border-b-0 transition-colors hover:bg-gray-50/50">
      <button
        onClick={() => toggleSection(section)}
        className="w-full px-6 py-4 flex items-center justify-between text-left group"
      >
        <div className="flex items-center gap-3">
          <span className="font-semibold text-gray-900 group-hover:text-primary transition-colors">
            {title}
          </span>
          {badge && (
            <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full">
              {badge}
            </span>
          )}
        </div>
        {expandedSections[section] ? (
          <ChevronUp className="w-5 h-5 text-gray-400 transition-transform" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400 transition-transform" />
        )}
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          expandedSections[section]
            ? "max-h-[2000px] opacity-100"
            : "max-h-0 opacity-0"
        )}
      >
        <div className="px-6 pb-6">{children}</div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header with Active Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-primary/5 via-primary/3 to-transparent border-b border-gray-200">
          <div className="flex items-center gap-3">
            <SlidersHorizontal className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-gray-900">{"Filteri"}</h2>
          </div>
        </div>

        {/* Active Filters Summary */}
        <ActiveFilters
          country={country}
          state={state}
          city={city}
          area={area}
          extraDetails={extraDetails}
          customFields={customFields}
        />

        {/* Filter Sections */}
        <div className="divide-y divide-gray-200">
          <FilterSection title={"Kategorije"} section="category">
            <ModernFilterTree key={langId} extraDetails={extraDetails} />
          </FilterSection>

          <FilterSection title={"Lokacija"} section="location">
            <ModernLocationTree />
          </FilterSection>

          <FilterSection title={"Budžet"} section="budget">
            <ModernBudgetFilter />
          </FilterSection>

          <FilterSection title={"Datum objave"} section="datePosted">
            <ModernDatePostedFilter />
          </FilterSection>

          <FilterSection title={"U blizini (KM)"} section="range">
            <ModernRangeFilter />
          </FilterSection>

          {isShowCustomfieldFilter && (
            <FilterSection 
              title={"Dodatni detalji"} 
              section="extraDetails"
              badge={Object.keys(extraDetails || {}).length || null}
            >
              <ModernExtraDetailsFilter
                customFields={customFields}
                extraDetails={extraDetails}
                setExtraDetails={setExtraDetails}
                newSearchParams={newSearchParams}
              />
            </FilterSection>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModernFilter;