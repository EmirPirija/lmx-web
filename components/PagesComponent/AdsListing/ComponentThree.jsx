import React, { useState, useEffect } from "react";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { HiOutlineUpload } from "react-icons/hi";
import { MdOutlineAttachFile } from "react-icons/md";
import { IoInformationCircleOutline, IoShieldCheckmarkOutline, IoAlertCircleOutline } from "react-icons/io5";
import CustomLink from "@/components/Common/CustomLink";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { handleKeyDown, inpNum, t } from "@/utils";
import CustomImage from "@/components/Common/CustomImage";

// ============================================
// LOADING SKELETON COMPONENT
// ============================================
const SkeletonLoader = () => {
  return (
    <div className="p-3 space-y-3 animate-pulse">
      {/* Search Skeleton */}
      <div className="h-10 bg-gray-200 rounded-lg"></div>

      {/* Options Skeleton */}
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-3 p-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-100 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

// ============================================
// ENHANCED DROPDOWN COMPONENT
// ============================================

const EnhancedDropdown = ({
  id,
  name,
  translated_name,
  values = [],
  currentValue,
  onChange,
  isDisabled,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Filter based on search
  const filteredOptions = values.filter((option) =>
    option.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Select option handler
  const handleSelect = (option) => {
    onChange(option);
    setIsOpen(false);
    setSearchQuery("");
  };

  // Simulate loading when opening
  const handleOpen = () => {
    if (isDisabled) return;
    setIsOpen(true);
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isOpen && !e.target.closest(`#dropdown-${id}`)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, id]);

  return (
    <div id={`dropdown-${id}`} className="w-full relative">
      {/* Trigger */}
      <div
        onClick={handleOpen}
        className={`w-full rounded-lg border px-4 py-3 bg-white cursor-pointer flex justify-between items-center transition-all duration-200 ${
          isDisabled
            ? "bg-gray-100 cursor-not-allowed opacity-60"
            : "hover:border-blue-400 hover:shadow-md focus:ring-2 focus:ring-blue-400"
        }`}
      >
        <div className="flex items-center gap-3">
          <span className={`${currentValue ? "font-medium" : "text-gray-500"}`}>
            {currentValue || `${t("select")} ${translated_name || name}`}
          </span>
        </div>
        <svg
          className={`w-5 h-5 transition-transform duration-300 ${
            isOpen ? "rotate-180" : "rotate-0"
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>

      {/* Dropdown Content */}
      {isOpen && !isDisabled && (
        <div className="absolute z-50 w-full mt-2 bg-white border rounded-lg shadow-2xl max-h-96 overflow-hidden">
          {isLoading ? (
            <SkeletonLoader />
          ) : (
            <>
              {/* Sticky Search */}
              <div className="sticky top-0 bg-white p-3 border-b z-10">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`${t("search")}...`}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200"
                    autoFocus
                  />
                  <svg
                    className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>

              {/* Options List */}
              <div className="overflow-y-auto max-h-80">
                {filteredOptions.length > 0 ? (
                  filteredOptions.map((option, idx) => {
                    const isSelected = currentValue === option;

                    return (
                      <div
                        key={`${option}-${idx}`}
                        onClick={() => handleSelect(option)}
                        className={`px-4 py-3 cursor-pointer transition-all duration-200 flex items-center gap-3 ${
                          isSelected
                            ? "bg-blue-50 border-l-4 border-blue-500 font-medium"
                            : "hover:bg-gray-50 hover:pl-5"
                        }`}
                      >
                        <span className={isSelected ? "text-blue-700" : ""}>
                          {option}
                        </span>
                        {isSelected && (
                          <svg
                            className="w-5 h-5 ml-auto text-blue-600"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="px-4 py-8 text-center text-gray-400">
                    <svg
                      className="w-12 h-12 mx-auto mb-2 opacity-50"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p className="font-medium">Nema rezultata</p>
                    <p className="text-sm">Pokušajte drugi pojam</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================
// ENHANCED RADIO GROUP COMPONENT
// ============================================
const EnhancedRadioGroup = ({
  id,
  values,
  translated_value,
  currentValue,
  onChange,
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-1 gap-3">
      {(translated_value || values)?.map((option, index) => {
        const uniqueId = `${id}-${option}-${index}`;
        const isSelected = currentValue === option;

        return (
          <div
            key={uniqueId}
            onClick={() => onChange(option)}
            className={`relative cursor-pointer rounded-lg border-1 p-3 transition-all duration-200 ${
              isSelected
                ? "border-blue-500 bg-blue-50 shadow-md"
                : "border-gray-200 hover:border-blue-300 hover:shadow-sm"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  isSelected
                    ? "border-blue-500 bg-blue-500"
                    : "border-gray-300"
                }`}
              >
                {isSelected && (
                  <div className="w-2 h-2 rounded-full bg-white"></div>
                )}
              </div>
              <span
                className={`text-sm font-medium ${
                  isSelected ? "text-blue-700" : "text-gray-700"
                }`}
              >
                {translated_value?.[index] || option}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ============================================
// ENHANCED CHECKBOX GROUP COMPONENT
// ============================================
const EnhancedCheckboxGroup = ({
  id,
  values,
  translated_value,
  currentValues = [],
  onChange,
}) => {
  const handleToggle = (value) => {
    const isChecked = currentValues.includes(value);
    const newValues = isChecked
      ? currentValues.filter((v) => v !== value)
      : [...currentValues, value];
    onChange(newValues);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 gap-3">
      {values?.map((value, index) => {
        const uniqueId = `${id}-${value}-${index}`;
        const isChecked = currentValues.includes(value);

        return (
          <div
            key={uniqueId}
            onClick={() => handleToggle(value)}
            className={`relative cursor-pointer rounded-lg border-2 p-3 transition-all duration-200 ${
              isChecked
                ? "border-blue-500 bg-blue-50 shadow-md"
                : "border-gray-200 hover:border-blue-300 hover:shadow-sm"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-5 h-5 flex-shrink-0 rounded border-2 flex items-center justify-center transition-all ${
                  isChecked
                    ? "border-blue-500 bg-blue-500"
                    : "border-gray-300"
                }`}
              >
                {isChecked && (
                  <svg
                    className="w-3 h-3 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
              <span
                className={`text-sm font-medium break-words ${
                  isChecked ? "text-blue-700" : "text-gray-700"
                }`}
              >
                {translated_value?.[index] || value}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ============================================
// AVAILABILITY SECTION COMPONENT
// ============================================
const AvailabilitySection = ({ isAvailable, setIsAvailable }) => {
  return (
    <div className="w-full bg-white border-2 border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm">
      <div className="flex items-start gap-3 mb-4">
        <IoShieldCheckmarkOutline className="w-6 h-6 text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="text-lg font-semibold text-gray-900 mb-1">
            Dostupnost oglasa
          </h4>
          <p className="text-sm text-gray-600 leading-relaxed">
            Označite da li je artikal trenutno dostupan za prodaju. Ova informacija pomaže kupcima da znaju mogu li odmah preuzeti proizvod.
          </p>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex items-start gap-2">
        <IoInformationCircleOutline className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-800">
          {isAvailable 
            ? "Kupci će vidjeti da je vaš artikal odmah dostupan za preuzimanje"
            : "Označite oglas kao dostupan kada artikal bude spreman za prodaju"
          }
        </p>
      </div>

      {/* Toggle Switch */}
      <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isAvailable ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
          <span className={`font-medium ${isAvailable ? 'text-green-700' : 'text-gray-600'}`}>
            {isAvailable ? "Artikal je odmah dostupan" : "Artikal nije odmah dostupan"}
          </span>
        </div>
        
        <button
          type="button"
          onClick={() => setIsAvailable(!isAvailable)}
          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            isAvailable ? 'bg-green-500' : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
              isAvailable ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </div>
  );
};

// ============================================
// DISCLAIMER SECTION COMPONENT
// ============================================
const DisclaimerSection = ({ agreedToTerms, setAgreedToTerms }) => {
  return (
    <div className="w-full bg-amber-50 border-2 border-amber-200 rounded-xl p-4 sm:p-6 shadow-sm">
      <div className="flex items-start gap-3 mb-4">
        <IoAlertCircleOutline className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="text-lg font-semibold text-gray-900 mb-2">
            Sigurnost i odgovornost <span className="text-red-500">*</span>
          </h4>
          <div className="space-y-2 text-sm text-gray-700">
            <p className="leading-relaxed">
              <strong>Važno:</strong> Platforma ne garantuje sigurnost transakcija između kupaca i prodavaca. 
              Sve transakcije se odvijaju na vlastitu odgovornost korisnika.
            </p>
            
            <div className="bg-white rounded-lg p-3 border border-amber-200 mt-3">
              <p className="font-semibold text-amber-800 mb-2">💡 Preporuke za sigurnu kupoprodaju:</p>
              <ul className="space-y-1 text-xs text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Uvijek se sastajte na javnim mjestima</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Provjerite artikal prije plaćanja</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Ne šaljite novac unaprijed</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Koristite sigurne metode plaćanja</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Terms Agreement Checkbox */}
      <div 
        onClick={() => setAgreedToTerms(!agreedToTerms)}
        className={`flex items-start gap-3 bg-white rounded-lg p-4 border-2 cursor-pointer transition-all duration-200 ${
          agreedToTerms 
            ? 'border-green-500 bg-green-50' 
            : 'border-gray-300 hover:border-amber-400'
        }`}
      >
        <div className={`w-5 h-5 flex-shrink-0 rounded border-2 flex items-center justify-center transition-all mt-0.5 ${
          agreedToTerms ? 'border-green-500 bg-green-500' : 'border-gray-400'
        }`}>
          {agreedToTerms && (
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>
        <div className="flex-1">
          <p className={`text-sm font-medium leading-relaxed ${agreedToTerms ? 'text-green-700' : 'text-gray-700'}`}>
            Razumijem i prihvatam da platforma ne odgovara za transakcije između korisnika. 
            Svjestan/na sam rizika i preuzimam punu odgovornost za svoju kupoprodaju.
          </p>
        </div>
      </div>

      {!agreedToTerms && (
        <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
          <IoAlertCircleOutline className="w-4 h-4" />
          Morate prihvatiti uslove da biste nastavili
        </p>
      )}
    </div>
  );
};

// ============================================
// ACCORDION SECTION COMPONENT
// ============================================
const AccordionSection = ({ 
  title, 
  subtitle, 
  icon, 
  isOpen, 
  onToggle, 
  children,
  badge,
  isCompleted 
}) => {
  return (
    <div className="border-2 border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
      {/* Header */}
      <div 
        onClick={onToggle}
        className={`flex items-center justify-between p-4 sm:p-5 cursor-pointer transition-all duration-200 ${
          isOpen ? 'bg-blue-50 border-b-2 border-blue-100' : 'hover:bg-gray-50'
        }`}
      >
        <div className="flex items-center gap-3 sm:gap-4 flex-1">
          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
            isOpen ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
          }`}>
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={`text-base sm:text-lg font-semibold ${isOpen ? 'text-blue-700' : 'text-gray-900'}`}>
                {title}
              </h3>
              {badge && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  badge === 'required' 
                    ? 'bg-red-100 text-red-700' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {badge === 'required' ? 'Obavezno' : 'Opcionalno'}
                </span>
              )}
              {isCompleted && (
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            {subtitle && (
              <p className="text-xs sm:text-sm text-gray-600 mt-0.5 truncate">{subtitle}</p>
            )}
          </div>
        </div>
        
        {/* Arrow */}
        <svg 
          className={`w-6 h-6 text-gray-400 transition-transform duration-300 flex-shrink-0 ml-2 ${
            isOpen ? 'rotate-180' : 'rotate-0'
          }`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Content */}
      {isOpen && (
        <div className="p-4 sm:p-6 bg-white animate-fadeIn">
          {children}
        </div>
      )}
    </div>
  );
};

// ============================================
// MAIN COMPONENT THREE
// ============================================

const ComponentThree = ({
  customFields,
  setExtraDetails,
  filePreviews,
  setFilePreviews,
  setStep,
  handleGoBack,
  currentExtraDetails,
  langId,
  defaultLangId,
}) => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  // Accordion states
  const [requiredOpen, setRequiredOpen] = useState(true);
  const [optionalOpen, setOptionalOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);

  const write = (fieldId, value) =>
    setExtraDetails((prev) => ({
      ...prev,
      [langId]: {
        ...prev[langId],
        [fieldId]: value,
      },
    }));

  const handleFileChange = (id, file) => {
    if (file) {
      const allowedExtensions = /\.(jpg|jpeg|svg|png|pdf)$/i;
      if (!allowedExtensions.test(file.name)) {
        toast.error(t("notAllowedFile"));
        return;
      }
      const fileUrl = URL.createObjectURL(file);
      setFilePreviews((prev) => ({
        ...prev,
        [langId]: {
          ...(prev[langId] || {}),
          [id]: {
            url: fileUrl,
            isPdf: /\.pdf$/i.test(file.name),
          },
        },
      }));
      write(id, file);
    }
  };

  const handleChange = (id, value) => write(id, value ?? "");

  const handleNext = () => {
    if (!agreedToTerms) {
      toast.error("Molimo prihvatite uslove korištenja");
      setTermsOpen(true);
      return;
    }
    setStep(4);
  };

  const renderCustomFields = (field) => {
    let {
      id,
      name,
      translated_name,
      type,
      translated_value,
      values,
      min_length,
      max_length,
      is_required,
    } = field;

    const inputProps = {
      id,
      name: id,
      required: !!is_required,
      onChange: (e) => handleChange(id, e.target.value),
      value: currentExtraDetails[id] || "",
      ...(type === "number"
        ? { min: min_length, max: max_length }
        : { minLength: min_length, maxLength: max_length }),
    };

    switch (type) {
      case "number": {
        return (
          <div className="flex flex-col">
            <Input
              type={type}
              inputMode="numeric"
              placeholder={`Unesite ${translated_name || name}`}
              {...inputProps}
              onKeyDown={(e) => handleKeyDown(e, max_length)}
              onKeyPress={(e) => inpNum(e)}
            />
            {max_length && (
              <span className="self-end text-sm text-muted-foreground">
                {`${currentExtraDetails[id]?.length ?? 0}/${max_length}`}
              </span>
            )}
          </div>
        );
      }

      case "textbox": {
        return (
          <div className=" flex flex-col">
            <Textarea
              placeholder={`Unesite ${translated_name || name}`}
              {...inputProps}
            />
            {max_length && (
              <span className="self-end text-sm text-muted-foreground">
                {`${currentExtraDetails[id]?.length ?? 0}/${max_length}`}
              </span>
            )}
          </div>
        );
      }

      case "dropdown": {
        const parseMapping = (values) => {
          const mapping = {};
          const allValues = [];

          values?.forEach((item) => {
            if (item.includes(":")) {
              const [parent, children] = item.split(":");
              const childList = children.split(",").map((v) => v.trim());
              mapping[parent.trim()] = childList;
              allValues.push(...childList);
            } else {
              allValues.push(item);
            }
          });

          return { mapping, allValues };
        };

        const { mapping, allValues } = parseMapping(values);
        const hasMapping = Object.keys(mapping).length > 0;

        const findParentField = () => {
          if (!hasMapping) return null;
          const mappingKeys = Object.keys(mapping);

          for (let field of customFields || []) {
            if (field.id === id) break;
            if (field.type !== "dropdown") continue;

            const hasAllKeys = mappingKeys.every((key) =>
              field.values?.includes(key)
            );

            if (hasAllKeys) return field;
          }
          return null;
        };

        const parentField = findParentField();
        const parentValue = parentField
          ? currentExtraDetails[parentField.id]
          : null;

        const filteredValues = (() => {
          if (!hasMapping) return values;
          if (!parentValue) return [];
          return mapping[parentValue] || [];
        })();

        const isDisabled = hasMapping && !parentValue;

        // Reset on parent change
        React.useEffect(() => {
          if (!hasMapping) return;

          const currentValue = currentExtraDetails[id];
          const validOptions = parentValue ? mapping[parentValue] || [] : [];

          if (currentValue && !validOptions.includes(currentValue)) {
            handleChange(id, null);
          }
        }, [parentValue]);

        return (
          <EnhancedDropdown
            id={id}
            name={name}
            translated_name={translated_name}
            values={filteredValues}
            currentValue={currentExtraDetails[id]}
            onChange={(value) => handleChange(id, value)}
            isDisabled={isDisabled}
          />
        );
      }

      case "checkbox":
        return (
          <EnhancedCheckboxGroup
            id={id}
            values={values}
            translated_value={translated_value}
            currentValues={currentExtraDetails[id] || []}
            onChange={(newValues) => handleChange(id, newValues)}
          />
        );

      case "radio":
        return (
          <EnhancedRadioGroup
            id={id}
            values={values}
            translated_value={translated_value}
            currentValue={currentExtraDetails[id] || ""}
            onChange={(value) => handleChange(id, value)}
          />
        );

      case "fileinput":
        const fileUrl = filePreviews?.[langId]?.[id]?.url;
        const isPdf = filePreviews?.[langId]?.[id]?.isPdf;

        return (
          <>
            <label htmlFor={id} className="flex gap-2 items-center">
              <div className="cursor-pointer border px-2.5 py-1 rounded">
                <HiOutlineUpload size={24} fontWeight="400" />
              </div>
              {fileUrl && (
                <div className="flex items-center gap-1 text-sm flex-nowrap break-words">
                  {isPdf ? (
                    <>
                      <MdOutlineAttachFile />
                      <CustomLink
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Pogledaj PDF
                      </CustomLink>
                    </>
                  ) : (
                    <CustomImage
                      src={fileUrl}
                      alt="Preview"
                      className="h-9 w-9"
                      height={36}
                      width={36}
                    />
                  )}
                </div>
              )}
            </label>
            <input
              type="file"
              id={id}
              name={id}
              className="hidden"
              onChange={(e) => handleFileChange(id, e.target.files[0])}
            />
            <span className="text-sm text-muted-foreground">
              Dozvoljeni formati: JPG, PNG, SVG, PDF
            </span>
          </>
        );
      default:
        break;
    }
  };

  // Separate required and optional fields
  const requiredFields = customFields?.filter(field => {
    if (langId !== defaultLangId && field.type !== "textbox") return false;
    return field.required === 1 || field.is_required;
  }) || [];

  const optionalFields = customFields?.filter(field => {
    if (langId !== defaultLangId && field.type !== "textbox") return false;
    return field.required !== 1 && !field.is_required;
  }) || [];

  // Sort fields within each group: checkboxes last
  const sortFields = (fields) => {
    return [...fields].sort((a, b) => {
      if (a.type === "checkbox" && b.type !== "checkbox") return 1;
      if (a.type !== "checkbox" && b.type === "checkbox") return -1;
      return 0;
    });
  };

  const sortedRequiredFields = sortFields(requiredFields);
  const sortedOptionalFields = sortFields(optionalFields);

  const renderFieldGroup = (fields) => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map((field) => {
          const isFullWidth = field.type === "checkbox" || field.type === "radio";

          return (
            <div 
              className={`flex flex-col w-full gap-2 ${isFullWidth ? "md:col-span-2" : ""}`} 
              key={field?.id}
            >
              <div className="flex gap-2 items-center">
                <CustomImage
                  src={field?.image}
                  alt={field?.name}
                  height={28}
                  width={28}
                  className="h-7 w-7 rounded-sm"
                />
                <Label
                  className={`${
                    (field?.required === 1 || field?.is_required) && defaultLangId === langId
                      ? "requiredInputLabel"
                      : ""
                  }`}
                >
                  {field?.translated_name || field?.name}
                </Label>
              </div>
              {renderCustomFields(field)}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4 pb-24">
      {/* Required Fields Section */}
      {sortedRequiredFields.length > 0 && (
        <AccordionSection
          title="Obavezna polja"
          subtitle={`${sortedRequiredFields.length} ${sortedRequiredFields.length === 1 ? 'polje' : 'polja'} za popunjavanje`}
          icon={<span className="text-xl font-bold">1</span>}
          isOpen={requiredOpen}
          onToggle={() => setRequiredOpen(!requiredOpen)}
          badge="required"
        >
          {renderFieldGroup(sortedRequiredFields)}
        </AccordionSection>
      )}

      {/* Optional Fields Section */}
      {sortedOptionalFields.length > 0 && (
        <AccordionSection
          title="Opcionalna polja"
          subtitle={`${sortedOptionalFields.length} dodatnih informacija`}
          icon={<span className="text-xl font-bold">2</span>}
          isOpen={optionalOpen}
          onToggle={() => setOptionalOpen(!optionalOpen)}
          badge="optional"
        >
          {renderFieldGroup(sortedOptionalFields)}
        </AccordionSection>
      )}

      {/* Availability & Terms Section */}
      <AccordionSection
        title="Dostupnost i uslovi"
        subtitle="Informacije o dostupnosti i prihvatanje uslova"
        icon={<span className="text-xl font-bold">3</span>}
        isOpen={termsOpen}
        onToggle={() => setTermsOpen(!termsOpen)}
        badge="required"
        isCompleted={agreedToTerms}
      >
        <div className="space-y-6">
          {/* Availability Section */}
          <AvailabilitySection 
            isAvailable={isAvailable}
            setIsAvailable={setIsAvailable}
          />

          {/* Disclaimer Section */}
          <DisclaimerSection 
            agreedToTerms={agreedToTerms}
            setAgreedToTerms={setAgreedToTerms}
          />
        </div>
      </AccordionSection>

      {/* Sticky Action Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-2xl z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4 flex justify-between sm:justify-end gap-3">
          <button
            className="bg-black text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg text-base sm:text-lg font-medium hover:bg-gray-800 transition-colors shadow-md flex-1 sm:flex-none"
            onClick={handleGoBack}
          >
            Nazad
          </button>
          <button
            className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg text-base sm:text-lg font-medium transition-all shadow-md flex-1 sm:flex-none ${
              agreedToTerms
                ? 'bg-primary text-white hover:bg-primary/90'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            onClick={handleNext}
          >
            Naprijed
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComponentThree;