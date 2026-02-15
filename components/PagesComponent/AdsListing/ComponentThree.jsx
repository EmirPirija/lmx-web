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
import { toast } from "@/utils/toastBs";
import { HiOutlineUpload } from "@/components/Common/UnifiedIconPack";
import { MdOutlineAttachFile } from "@/components/Common/UnifiedIconPack";
import { IoInformationCircleOutline, IoShieldCheckmarkOutline, IoAlertCircleOutline } from "@/components/Common/UnifiedIconPack";
import CustomLink from "@/components/Common/CustomLink";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { handleKeyDown, inpNum, t } from "@/utils";
import CustomImage from "@/components/Common/CustomImage";
import StickyActionButtons from "@/components/Common/StickyActionButtons";

// ============================================
// LOADING SKELETON COMPONENT
// ============================================
const SkeletonLoader = () => {
  return (
    <div className="p-3 space-y-3">
      {/* Search Skeleton */}
      <Skeleton className="h-10 rounded-lg" />

      {/* Options Skeleton */}
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-3 p-3">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4 rounded" />
            <Skeleton className="h-3 w-1/2 rounded" />
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
                    <p className="text-sm">Pokušajte s drugim pojmom</p>
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
            className={`relative cursor-pointer rounded-xl border p-3 transition-colors duration-200 ${
              isSelected
                ? "border-primary bg-primary/10"
                : "border-slate-200 bg-white hover:border-primary/50 dark:border-slate-700 dark:bg-slate-900/70 dark:hover:border-primary/60"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-5 w-5 items-center justify-center rounded-full border transition-colors ${
                  isSelected
                    ? "border-primary bg-primary"
                    : "border-slate-300 dark:border-slate-600"
                }`}
              >
                {isSelected && (
                  <div className="w-2 h-2 rounded-full bg-white"></div>
                )}
              </div>
              <span
                className={`text-sm font-medium ${
                  isSelected ? "text-primary" : "text-slate-700 dark:text-slate-200"
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
            className={`relative cursor-pointer rounded-xl border p-3 transition-colors duration-200 ${
              isChecked
                ? "border-primary bg-primary/10"
                : "border-slate-200 bg-white hover:border-primary/50 dark:border-slate-700 dark:bg-slate-900/70 dark:hover:border-primary/60"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border transition-colors ${
                  isChecked
                    ? "border-primary bg-primary"
                    : "border-slate-300 dark:border-slate-600"
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
                  isChecked ? "text-primary" : "text-slate-700 dark:text-slate-200"
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
const AvailabilitySection = ({ isAvailable, setIsAvailable, isExchange, setIsExchange }) => {
  const ToggleRow = ({ enabled, onToggle, activeLabel, inactiveLabel, helper }) => (
    <div className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-3 dark:border-slate-700 dark:bg-slate-800/70">
      <div className="min-w-0">
        <p className={`text-sm font-semibold ${enabled ? "text-emerald-700 dark:text-emerald-300" : "text-slate-700 dark:text-slate-200"}`}>
          {enabled ? activeLabel : inactiveLabel}
        </p>
        {helper ? (
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{helper}</p>
        ) : null}
      </div>

      <button
        type="button"
        onClick={onToggle}
        aria-pressed={enabled}
        className={`relative mt-0.5 inline-flex h-7 w-12 flex-shrink-0 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${
          enabled ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${
            enabled ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );

  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/90 sm:p-5">
      <div className="mb-4 flex items-start gap-3">
        <IoShieldCheckmarkOutline className="mt-0.5 h-6 w-6 flex-shrink-0 text-primary" />
        <div className="min-w-0">
          <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100 sm:text-lg">
            Dostupnost i uvjeti oglasa
          </h4>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Ove informacije direktno utiču na očekivanja kupaca i broj upita koje dobijaš.
          </p>
        </div>
      </div>

      <div className="mb-4 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-800 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200">
        <span className="font-semibold">LMX savjet:</span>{" "}
        {isAvailable
          ? "Kad je oglas označen kao dostupan, kupci češće šalju direktne ponude."
          : "Ako artikal trenutno nije spreman, ostavi ga nedostupnim da izbjegneš pogrešna očekivanja."}
      </div>

      <div className="space-y-3">
        <ToggleRow
          enabled={isAvailable}
          onToggle={() => setIsAvailable(!isAvailable)}
          activeLabel="Artikal je odmah dostupan"
          inactiveLabel="Artikal trenutno nije odmah dostupan"
          helper="Kupac će vidjeti može li brzo dogovoriti preuzimanje."
        />
        <ToggleRow
          enabled={isExchange}
          onToggle={() => setIsExchange(!isExchange)}
          activeLabel="Prihvatam zamjenu"
          inactiveLabel="Ne nudim zamjenu"
          helper="Uključi samo ako stvarno želiš razmatrati razmjenu."
        />
      </div>
    </div>
  );
};

// ============================================
// DISCLAIMER SECTION COMPONENT
// ============================================
const DisclaimerSection = ({ agreedToTerms, setAgreedToTerms }) => {
  return (
    <div className="w-full rounded-2xl border border-amber-300 bg-amber-50/80 p-4 shadow-sm dark:border-amber-500/30 dark:bg-amber-500/10 sm:p-5">
      <div className="mb-4 flex items-start gap-3">
        <IoAlertCircleOutline className="mt-0.5 h-6 w-6 flex-shrink-0 text-amber-700 dark:text-amber-300" />
        <div className="min-w-0">
          <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100 sm:text-lg">
            Sigurnost i odgovornost <span className="text-red-500">*</span>
          </h4>
          <p className="mt-1 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            LMX je oglasna platforma koja povezuje prodavača i kupca. LMX nije ugovorna strana kupoprodaje i ne
            garantuje ispunjenje privatnog dogovora između korisnika.
          </p>
        </div>
      </div>

      <div className="mb-4 rounded-xl border border-amber-200 bg-white/90 px-3 py-3 text-xs text-slate-600 dark:border-amber-500/25 dark:bg-slate-900/70 dark:text-slate-300">
        <p className="mb-2 font-semibold text-amber-800 dark:text-amber-300">Praktični savjeti za sigurniji dogovor:</p>
        <ul className="space-y-1">
          <li>• Sastanak i primopredaju dogovori na javnom mjestu.</li>
          <li>• Provjeri stanje artikla prije potvrde kupovine.</li>
          <li>• Ne šalji avans nepoznatom korisniku bez provjere.</li>
        </ul>
      </div>

      <button
        type="button"
        onClick={() => setAgreedToTerms(!agreedToTerms)}
        className={`flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left transition-colors ${
          agreedToTerms
            ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-200"
            : "border-slate-300 bg-white text-slate-700 hover:border-amber-400 dark:border-slate-600 dark:bg-slate-900/70 dark:text-slate-200"
        }`}
      >
        <span
          className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border ${
            agreedToTerms
              ? "border-emerald-500 bg-emerald-500 text-white"
              : "border-slate-400 dark:border-slate-500"
          }`}
        >
          {agreedToTerms ? (
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          ) : null}
        </span>
        <span className="text-sm leading-relaxed">
          Potvrđujem da razumijem da su dogovor, plaćanje, dostava i reklamacije odgovornost između prodavača i
          kupca, a da je LMX posredni oglasni servis.
        </span>
      </button>

      {!agreedToTerms ? (
        <p className="mt-2 flex items-center gap-1 text-xs text-rose-600 dark:text-rose-300">
          <IoAlertCircleOutline className="h-4 w-4" />
          Potvrdite napomenu kako biste nastavili na sljedeći korak.
        </p>
      ) : null}
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
    <div className="overflow-visible rounded-2xl border border-slate-200 bg-white/95 shadow-sm dark:border-slate-700 dark:bg-slate-900/90">
      {/* Header */}
      <div 
        onClick={onToggle}
        className={`flex cursor-pointer items-center justify-between p-4 transition-colors duration-200 sm:p-5 ${
          isOpen ? "border-b border-slate-200 bg-slate-50/90 dark:border-slate-700 dark:bg-slate-800/70" : "hover:bg-slate-50/70 dark:hover:bg-slate-800/60"
        }`}
      >
        <div className="flex flex-1 items-center gap-3 sm:gap-4">
          <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl transition-colors sm:h-11 sm:w-11 ${
            isOpen ? "bg-primary text-white" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
          }`}>
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={`text-base font-semibold sm:text-lg ${isOpen ? "text-primary" : "text-slate-900 dark:text-slate-100"}`}>
                {title}
              </h3>
              {badge && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  badge === 'required' 
                    ? "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200"
                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
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
              <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400 sm:text-sm">{subtitle}</p>
            )}
          </div>
        </div>
        
        {/* Arrow */}
        <svg 
          className={`ml-2 h-6 w-6 flex-shrink-0 text-slate-400 transition-transform duration-300 dark:text-slate-500 ${
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
        <div className="animate-fadeIn bg-white p-4 dark:bg-slate-900/90 sm:p-5">
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
  isAvailable: isAvailableProp,
  setIsAvailable: setIsAvailableProp,
  isExchange: isExchangeProp,
  setIsExchange: setIsExchangeProp,
}) => {
  const [isAvailableLocal, setIsAvailableLocal] = useState(false);
  const [isExchangeLocal, setIsExchangeLocal] = useState(false);
  const isAvailable =
    isAvailableProp !== undefined ? isAvailableProp : isAvailableLocal;
  const isExchange =
    isExchangeProp !== undefined ? isExchangeProp : isExchangeLocal;
  const setIsAvailable = setIsAvailableProp || setIsAvailableLocal;
  const setIsExchange = setIsExchangeProp || setIsExchangeLocal;
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  // Accordion states
  const [requiredOpen, setRequiredOpen] = useState(true);
  const [optionalOpen, setOptionalOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);

  const write = (fieldId, value) => {
    setExtraDetails((prev) => {
      const updated = {
        ...prev,
        [langId]: {
          ...(prev[langId] || {}),
          [fieldId]: value,
        },
      };
  
      console.log("[EXTRA_DETAILS_WRITE]", {
        fieldId,
        value,
        langId,
        updatedForLang: updated[langId],
      });
  
      return updated;
    });
  };

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
      toast.error("Molimo, prihvatite uvjete korištenja.");
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
                step="any"              // BITNO: Dozvoljava bilo koji decimalni broj
                inputMode="decimal"     // BITNO: Prikazuje tastaturu sa tačkom na mobitelu
                placeholder={`Unesite ${translated_name || name}`}
                {...inputProps}
                onKeyDown={(e) => handleKeyDown(e, max_length)}
                onKeyPress={(e) => {
                    // Dozvoljava samo brojeve (0-9) i tačku (.)
                    if (!/[0-9.]/.test(e.key)) {
                        e.preventDefault();
                    }
                }}
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
    <div className="flex flex-col gap-4 pb-24 dark:[&_.bg-white]:bg-slate-900 dark:[&_.bg-gray-50]:bg-slate-800/70 dark:[&_.bg-gray-100]:bg-slate-800 dark:[&_.bg-gray-200]:bg-slate-700 dark:[&_.bg-gray-300]:bg-slate-600 dark:[&_.text-gray-900]:text-slate-100 dark:[&_.text-gray-800]:text-slate-100 dark:[&_.text-gray-700]:text-slate-200 dark:[&_.text-gray-600]:text-slate-300 dark:[&_.text-gray-500]:text-slate-400 dark:[&_.text-gray-400]:text-slate-500 dark:[&_.border-gray-100]:border-slate-700 dark:[&_.border-gray-200]:border-slate-700 dark:[&_.border-gray-300]:border-slate-600 dark:[&_.bg-blue-50]:bg-blue-500/15 dark:[&_.bg-blue-100]:bg-blue-500/20 dark:[&_.border-blue-100]:border-blue-500/30 dark:[&_.bg-green-50]:bg-green-500/15 dark:[&_.bg-amber-50]:bg-amber-500/10">
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
        title="Dostupnost i uvjeti"
        subtitle="Jasno označi stanje oglasa i potvrdi sigurnosnu napomenu"
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
            isExchange={isExchange}
            setIsExchange={setIsExchange}
          />

          {/* Disclaimer Section */}
          <DisclaimerSection 
            agreedToTerms={agreedToTerms}
            setAgreedToTerms={setAgreedToTerms}
          />
        </div>
      </AccordionSection>

      {/* Sticky Action Buttons */}
      <StickyActionButtons
        secondaryLabel="Nazad"
        onSecondaryClick={handleGoBack}
        primaryLabel="Naprijed"
        onPrimaryClick={handleNext}
        primaryDisabled={!agreedToTerms}
      />
    </div>
  );
};

export default ComponentThree;
