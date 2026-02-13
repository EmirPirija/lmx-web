import { Fragment, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, ChevronDown, ChevronUp } from "@/components/Common/UnifiedIconPack";
import { cn } from "@/lib/utils";

const ExtraDetailsFilter = ({ customFields }) => {
  const searchParams = useSearchParams();
  const [showAll, setShowAll] = useState(false);

  const getCurrentExtraDetails = () => {
    const details = {};
    customFields.forEach((field) => {
      const value = searchParams.get(field.id.toString());
      if (value) {
        details[field.id] = field.type === "checkbox" ? value.split(",") : value;
      }
    });
    return details;
  };

  const extraDetails = getCurrentExtraDetails();

  const handleCheckboxChange = (fieldId, value, checked) => {
    const newSearchParams = new URLSearchParams(searchParams);
    const existing = extraDetails[fieldId] || [];
    const updated = checked
      ? [...existing, value]
      : existing.filter((v) => v !== value);

    if (updated.length > 0) {
      newSearchParams.set(fieldId.toString(), updated.join(","));
    } else {
      newSearchParams.delete(fieldId.toString());
    }

    window.history.pushState(null, "", `/ads?${newSearchParams.toString()}`);
  };

  const handleRadioChange = (fieldId, value) => {
    const newSearchParams = new URLSearchParams(searchParams);
    const currentValue = extraDetails[fieldId];

    if (currentValue === value) {
      newSearchParams.delete(fieldId.toString());
    } else {
      newSearchParams.set(fieldId.toString(), value);
    }

    window.history.pushState(null, "", `/ads?${newSearchParams.toString()}`);
  };

  const handleDropdownChange = (fieldId, value) => {
    const newSearchParams = new URLSearchParams(searchParams);
    if (value) {
      newSearchParams.set(fieldId.toString(), value);
    } else {
      newSearchParams.delete(fieldId.toString());
    }
    window.history.pushState(null, "", `/ads?${newSearchParams.toString()}`);
  };

  if (!customFields || customFields.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-xs text-gray-500">
          Odaberite kategoriju da vidite filtere
        </p>
      </div>
    );
  }

  // Show only first 5 fields by default
  const INITIAL_VISIBLE_COUNT = 5;
  const visibleFields = showAll ? customFields : customFields.slice(0, INITIAL_VISIBLE_COUNT);
  const hasMore = customFields.length > INITIAL_VISIBLE_COUNT;

  return (
    <div className="flex flex-col gap-3">
      {visibleFields.map((field) => (
        <Fragment key={field.id}>
          {/* Dropdown Type - Compact */}
          {field.type === "dropdown" && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                {field.translated_name || field.name}
              </label>
              <select
                value={extraDetails[field.id] || ""}
                onChange={(e) => handleDropdownChange(field.id, e.target.value)}
                className={cn(
                  "w-full px-3 py-2 text-sm rounded-lg border-2 bg-white text-gray-900 font-medium transition-all",
                  extraDetails[field.id]
                    ? "border-blue-500 ring-1 ring-blue-100"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <option value="">Odaberi {field.translated_name || field.name}</option>
                {field.values.map((option, index) => (
                  <option key={option} value={option}>
                    {field?.translated_value?.[index] || option}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Radio Type - Horizontal Pills */}
          {field.type === "radio" && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                {field.translated_name || field.name}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {field.values.map((option, index) => {
                  const isSelected = extraDetails[field.id] === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => handleRadioChange(field.id, option)}
                      className={cn(
                        "px-3 py-1.5 text-xs rounded-full font-medium transition-all",
                        isSelected
                          ? "bg-blue-500 text-white shadow-sm"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      )}
                    >
                      {field?.translated_value?.[index] || option}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Checkbox Type - Compact List */}
          {field.type === "checkbox" && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                {field.translated_name || field.name}
              </label>
              <div className="space-y-1">
                {field.values.map((option, index) => {
                  const isChecked = (extraDetails[field.id] || []).includes(option);
                  return (
                    <label
                      key={option}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all group",
                        isChecked
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      )}
                    >
                      <div
                        className={cn(
                          "w-3.5 h-3.5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0",
                          isChecked
                            ? "bg-blue-500 border-blue-500"
                            : "border-gray-300 bg-white group-hover:border-gray-400"
                        )}
                      >
                        {isChecked && <Check className="w-2 h-2 text-white" />}
                      </div>
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={isChecked}
                        onChange={(e) =>
                          handleCheckboxChange(field.id, option, e.target.checked)
                        }
                      />
                      <span
                        className={cn(
                          "text-xs font-medium transition-colors",
                          isChecked ? "text-blue-700" : "text-gray-700"
                        )}
                      >
                        {field?.translated_value?.[index] || option}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </Fragment>
      ))}

      {/* Show More/Less Button */}
      {hasMore && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
        >
          {showAll ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
              Prikaži manje
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              Prikaži sve ({customFields.length - INITIAL_VISIBLE_COUNT} više)
            </>
          )}
        </button>
      )}
    </div>
  );
};

export default ExtraDetailsFilter;