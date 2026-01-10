import { useSearchParams } from "next/navigation";
import { X } from "lucide-react";

const ActiveFilters = ({ country, state, city, area, extraDetails, customFields }) => {
  const searchParams = useSearchParams();
  
  const minPrice = searchParams.get("min_price");
  const maxPrice = searchParams.get("max_price");
  const datePosted = searchParams.get("date_posted");
  const kmRange = searchParams.get("km_range");
  const category = searchParams.get("category");

  const activeFilters = [];

  if (category) {
    activeFilters.push({
      key: "category",
      label: "Kategorija",
      value: category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      params: ["category"],
    });
  }

  if (area) {
    activeFilters.push({
      key: "area",
      label: "Područje",
      value: area,
      params: ["area", "areaId"],
    });
  } else if (city) {
    activeFilters.push({
      key: "city",
      label: "Grad",
      value: city,
      params: ["city"],
    });
  } else if (state) {
    activeFilters.push({
      key: "state",
      label: "Regija",
      value: state,
      params: ["state"],
    });
  } else if (country) {
    activeFilters.push({
      key: "country",
      label: "Država",
      value: country,
      params: ["country"],
    });
  }

  if (minPrice || maxPrice) {
    activeFilters.push({
      key: "budget",
      label: "Cijena",
      value: `${minPrice || "0"} - ${maxPrice || "∞"}`,
      params: ["min_price", "max_price"],
    });
  }

  if (datePosted) {
    const dateLabels = {
      "all-time": "Sve",
      "today": "Danas",
      "within-1-week": "1 sedmica",
      "within-2-week": "2 sedmice",
      "within-1-month": "1 mjesec",
      "within-3-month": "3 mjeseca",
    };
    activeFilters.push({
      key: "date_posted",
      label: "Datum",
      value: dateLabels[datePosted] || datePosted,
      params: ["date_posted"],
    });
  }

  if (kmRange) {
    activeFilters.push({
      key: "km_range",
      label: "Blizina",
      value: `${kmRange} km`,
      params: ["km_range"],
    });
  }

  if (extraDetails && customFields) {
    Object.entries(extraDetails).forEach(([fieldId, value]) => {
      if (value && (Array.isArray(value) ? value.length > 0 : true)) {
        const field = customFields.find((f) => f.id.toString() === fieldId);
        if (field) {
          const displayValue = Array.isArray(value) ? value.join(", ") : value;
          activeFilters.push({
            key: `extra_${fieldId}`,
            label: field.translated_name || field.name,
            value: displayValue,
            params: [fieldId],
          });
        }
      }
    });
  }

  const removeFilter = (params) => {
    const newSearchParams = new URLSearchParams(searchParams);
    params.forEach((param) => {
      newSearchParams.delete(param);
    });
    if (params.includes("area") || params.includes("city") || params.includes("state") || params.includes("country")) {
      newSearchParams.delete("lat");
      newSearchParams.delete("lng");
    }
    window.history.pushState(null, "", `/ads?${newSearchParams.toString()}`);
  };

  const clearAllFilters = () => {
    window.history.pushState(null, "", `/ads`);
  };

  if (activeFilters.length === 0) return null;

  return (
    <div className="px-4 py-2.5 bg-blue-50/30 border-b border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-gray-600">
          Aktivni ({activeFilters.length})
        </span>
        <button
          onClick={clearAllFilters}
          className="text-xs font-medium text-red-600 hover:text-red-700 transition-colors"
        >
          Obriši sve
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {activeFilters.map((filter) => (
          <div
            key={filter.key}
            className="group flex items-center gap-1 px-2 py-0.5 bg-white border border-blue-200 rounded-full text-xs transition-all hover:border-blue-300"
          >
            <span className="text-gray-600 font-medium">{filter.label}:</span>
            <span className="text-gray-900 font-medium max-w-[80px] truncate">{filter.value}</span>
            <button
              onClick={() => removeFilter(filter.params)}
              className="p-0.5 rounded-full hover:bg-red-100 text-gray-400 hover:text-red-600 transition-all"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActiveFilters;