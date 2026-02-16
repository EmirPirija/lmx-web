"use client";

import React, { useMemo, useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Link as LinkIcon,
  Type,
  Percent,
  Tag,
} from "@/components/Common/UnifiedIconPack";
import {
  getCurrencyPosition,
  getCurrencySymbol,
} from "@/redux/reducer/settingSlice";
import { generateSlug } from "@/utils";
import {
  REAL_ESTATE_PRICE_MODE_MANUAL,
  resolveRealEstatePerSquareValue,
} from "@/utils/realEstatePricing";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { useDispatch, useSelector } from "react-redux";
import { userSignUpData } from "@/redux/reducer/authSlice";
import { setUserMembership } from "@/redux/reducer/membershipSlice";
import { membershipApi } from "@/utils/api";
import { extractApiData, resolveMembership } from "@/lib/membership";
import { isPromoFreeAccessEnabled } from "@/lib/promoMode";
import StickyActionButtons from "@/components/Common/StickyActionButtons";
import PlanGateLabel from "@/components/Common/PlanGateLabel";
import { LMX_PHONE_INPUT_PROPS } from "@/components/Common/phoneInputTheme";

// ============================================
// ACCORDION SECTION
// ============================================
const AccordionSection = ({
  title,
  subtitle,
  isOpen,
  onToggle,
  badge, 
  planGate,
  children,
}) => {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-sm dark:border-slate-700 dark:bg-slate-900/90">
      <div
        onClick={onToggle}
        className={`flex cursor-pointer items-center justify-between p-4 transition-colors duration-200 sm:p-5 ${
          isOpen ? "border-b border-slate-200 bg-slate-50/80 dark:border-slate-700 dark:bg-slate-800/70" : "hover:bg-slate-50/70 dark:hover:bg-slate-800/60"
        }`}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3
              className={`text-base sm:text-lg font-semibold ${
                isOpen ? "text-primary" : "text-slate-900 dark:text-slate-100"
              }`}
            >
              {title}
            </h3>

            {planGate ? planGate : null}

            {badge && (
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  badge === "required"
                    ? "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200"
                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                {badge === "required" ? "Obavezno" : "Opcionalno"}
              </span>
            )}
          </div>

          {subtitle ? (
            <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400 sm:text-sm">
              {subtitle}
            </p>
          ) : null}
        </div>

        <svg
          className={`ml-2 h-6 w-6 flex-shrink-0 text-slate-400 transition-transform duration-300 dark:text-slate-500 ${
            isOpen ? "rotate-180" : "rotate-0"
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {isOpen && <div className="bg-white p-4 dark:bg-slate-900/90 sm:p-5">{children}</div>}
    </div>
  );
};

// ========================================
// RichTextarea Component (WYSIWYG)
// ========================================
const RichTextarea = ({
  value = "",
  onChange,
  label,
  placeholder = "Unesite opis...",
  maxLength = 7000,
  minHeight = 140,
  required = false,
  id = "rich-textarea",
  name = "description",
}) => {
  const editorRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (editorRef.current && !editorRef.current.innerHTML && value) {
      editorRef.current.innerHTML = value;
    }
  }, []);

  const handleInput = (e) => {
    const html = e.currentTarget.innerHTML;
    onChange({ target: { value: html, name } });
  };

  const execCmd = (command, value = null) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  const preventFocusLoss = (e) => e.preventDefault();

  const handleLink = () => {
    const url = prompt("Unesite URL link:", "https://");
    if (url) {
      execCmd("createLink", url);
    }
  };

  const plainText = editorRef.current?.innerText || value.replace(/<[^>]*>/g, '') || "";
  const charCount = plainText.length;
  const wordCount = plainText.trim() === "" ? 0 : plainText.trim().split(/\s+/).length;
  const isOverLimit = charCount > maxLength;
  const percentUsed = (charCount / maxLength) * 100;

  return (
    <div className="flex flex-col gap-2 w-full">
      {label && (
        <Label htmlFor={id} className={required ? "requiredInputLabel" : ""}>
          {label}
        </Label>
      )}

      <div 
        className={`w-full border rounded-xl overflow-hidden bg-white transition-all ${
          isFocused ? "border-blue-500 ring-2 ring-blue-100" : "border-gray-200"
        }`}
      >
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-gray-50/50 select-none">
          <div className="flex items-center gap-1 text-gray-400 px-2 text-xs font-semibold uppercase tracking-wider border-r mr-1">
             <Type className="w-4 h-4 mr-1" />
             Uređivač
          </div>

          <button
            type="button"
            onMouseDown={preventFocusLoss}
            onClick={() => execCmd("bold")}
            className="p-2 text-gray-600 hover:bg-white hover:text-blue-600 hover:shadow-sm rounded-lg transition-all"
            title="Podebljano (Bold)"
          >
            <Bold className="w-4 h-4" />
          </button>

          <button
            type="button"
            onMouseDown={preventFocusLoss}
            onClick={() => execCmd("italic")}
            className="p-2 text-gray-600 hover:bg-white hover:text-blue-600 hover:shadow-sm rounded-lg transition-all"
            title="Ukošeno (Italic)"
          >
            <Italic className="w-4 h-4" />
          </button>

          <div className="w-px h-5 bg-gray-300 mx-1" />

          <button
            type="button"
            onMouseDown={preventFocusLoss}
            onClick={() => execCmd("insertUnorderedList")}
            className="p-2 text-gray-600 hover:bg-white hover:text-blue-600 hover:shadow-sm rounded-lg transition-all"
            title="Lista"
          >
            <List className="w-4 h-4" />
          </button>

          <button
            type="button"
            onMouseDown={preventFocusLoss}
            onClick={() => execCmd("insertOrderedList")}
            className="p-2 text-gray-600 hover:bg-white hover:text-blue-600 hover:shadow-sm rounded-lg transition-all"
            title="Numerirana lista"
          >
            <ListOrdered className="w-4 h-4" />
          </button>

          <div className="w-px h-5 bg-gray-300 mx-1" />

          <button
            type="button"
            onMouseDown={preventFocusLoss}
            onClick={handleLink}
            className="p-2 text-gray-600 hover:bg-white hover:text-blue-600 hover:shadow-sm rounded-lg transition-all"
            title="Dodaj link"
          >
            <LinkIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Editor Area */}
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="w-full px-4 py-3 outline-none min-h-[140px] prose prose-sm max-w-none text-gray-700"
          style={{ minHeight: `${minHeight}px` }}
          data-placeholder={placeholder}
        />
        
        {!value && (
          <div 
            className="absolute px-4 py-3 text-gray-400 pointer-events-none top-[108px]"
            aria-hidden="true"
          >
          </div>
        )}
      </div>

      {/* Counters */}
      <div className="flex items-center justify-between text-xs mt-1 px-1">
        <div className="text-gray-500">
          <span className="font-medium text-gray-700">{wordCount}</span> riječi
        </div>
        <div className={`${isOverLimit ? "text-red-600 font-bold" : "text-gray-500"}`}>
          {charCount} / {maxLength}
        </div>
      </div>

      <div className="w-full bg-gray-100 rounded-full h-1 overflow-hidden mt-1">
        <div
          className={`h-full transition-all duration-500 ${
            isOverLimit ? "bg-red-500" : percentUsed > 90 ? "bg-orange-500" : "bg-blue-500"
          }`}
          style={{ width: `${Math.min(percentUsed, 100)}%` }}
        />
      </div>
    </div>
  );
};

// ========================================
// Main ComponentTwo
// ========================================
const ComponentTwo = ({
  setTranslations,
  current,
  langId,
  handleDetailsSubmit,
  handleDeatilsBack,
  is_job_category,
  is_real_estate = false,
  real_estate_area_m2 = null,
  isPriceOptional,
  defaultLangId,
  isNextLoading = false,
}) => {
  const dispatch = useDispatch();
  const currencyPosition = useSelector(getCurrencyPosition);
  const currencySymbol = useSelector(getCurrencySymbol);
  const currentUser = useSelector(userSignUpData);
  const cachedMembership = useSelector((state) => state?.Membership?.userMembership?.data);
  const [liveMembership, setLiveMembership] = useState(null);
  const membership = useMemo(
    () =>
      resolveMembership(
        currentUser,
        currentUser?.membership,
        cachedMembership,
        cachedMembership?.membership,
        liveMembership,
        liveMembership?.membership
      ),
    [cachedMembership, currentUser, liveMembership]
  );
  const isShopMember = Boolean(membership?.isShop);
  const hasShopAccess = isShopMember || isPromoFreeAccessEnabled();

  const placeholderLabel =
    currencyPosition === "right" ? `${currencySymbol}` : `${currencySymbol}`;

  // Accordion states
  const [basicOpen, setBasicOpen] = useState(true);
  const [priceOpen, setPriceOpen] = useState(false);
  const [stockOpen, setStockOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);

  const isDefaultLang = langId === defaultLangId;
  const parsedInventoryCount = Number(current?.inventory_count || 0);
  const parsedLowThreshold = Math.max(1, Number(current?.stock_alert_threshold || 3));
  const parsedLastUnitsThreshold = Math.max(1, Math.min(2, parsedLowThreshold));
  const scarcityEnabled = Boolean(current?.scarcity_enabled);
  const scarcityHasInventory = Number.isFinite(parsedInventoryCount) && parsedInventoryCount > 0;
  const scarcityIsLow = scarcityHasInventory && parsedInventoryCount <= parsedLowThreshold;
  const scarcityIsLastUnits = scarcityHasInventory && parsedInventoryCount <= parsedLastUnitsThreshold;
  const scarcityLockedUntilRaw = current?.scarcity_toggle_locked_until;
  const scarcityLockedUntil = scarcityLockedUntilRaw ? new Date(scarcityLockedUntilRaw) : null;
  const scarcityLastToggledRaw = current?.scarcity_last_toggled_at;
  const scarcityLastToggled = scarcityLastToggledRaw ? new Date(scarcityLastToggledRaw) : null;
  const SERVER_SCARCITY_COOLDOWN_MS = 15 * 60 * 1000;
  const CLIENT_SCARCITY_COOLDOWN_MS = 10 * 1000;
  const [scarcityClientLockUntilTs, setScarcityClientLockUntilTs] = useState(0);
  const scarcityServerLockUntilTs = useMemo(() => {
    if (scarcityLockedUntil && !Number.isNaN(scarcityLockedUntil.getTime())) {
      return scarcityLockedUntil.getTime();
    }
    if (scarcityLastToggled && !Number.isNaN(scarcityLastToggled.getTime())) {
      return scarcityLastToggled.getTime() + SERVER_SCARCITY_COOLDOWN_MS;
    }
    return 0;
  }, [scarcityLastToggled, scarcityLockedUntil]);
  const scarcityEffectiveLockUntilTs = Math.max(scarcityServerLockUntilTs, scarcityClientLockUntilTs);
  const scarcityToggleLocked = scarcityEffectiveLockUntilTs > Date.now();
  const scarcityLockRemainingSeconds = scarcityToggleLocked
    ? Math.max(1, Math.ceil((scarcityEffectiveLockUntilTs - Date.now()) / 1000))
    : 0;
  const realEstatePricing = useMemo(
    () =>
      resolveRealEstatePerSquareValue({
        details: current,
        areaM2: real_estate_area_m2,
        totalPrice: current?.price,
      }),
    [current, real_estate_area_m2]
  );
  const isManualPerSquareMode =
    is_real_estate &&
    Boolean(current?.show_price_per_m2) &&
    (current?.price_per_m2_mode || "auto") === REAL_ESTATE_PRICE_MODE_MANUAL;
  const manualDerivedTotalPrice = useMemo(() => {
    if (!isManualPerSquareMode) return null;
    return realEstatePricing?.derivedTotalPrice || null;
  }, [isManualPerSquareMode, realEstatePricing]);
  const shouldDisableMainPriceInput = Boolean(current?.price_on_request) || isManualPerSquareMode;

  const formatCurrencyInline = (value) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric <= 0) return "";
    const formatted = numeric.toLocaleString("bs-BA", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
    return currencyPosition === "left"
      ? `${currencySymbol} ${formatted}`
      : `${formatted} ${currencySymbol}`;
  };

  const formatAreaInline = (value) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric <= 0) return null;
    return numeric.toLocaleString("bs-BA", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  useEffect(() => {
    if (!isDefaultLang || !isManualPerSquareMode) return;

    const nextPrice = manualDerivedTotalPrice ? String(manualDerivedTotalPrice) : "";
    setTranslations((prev) => {
      const prevLang = prev?.[langId] || {};
      const prevPrice = String(prevLang?.price ?? "");
      if (prevPrice === nextPrice && prevLang?.price_on_request === false) {
        return prev;
      }

      return {
        ...prev,
        [langId]: {
          ...prevLang,
          price: nextPrice,
          price_on_request: false,
        },
      };
    });
  }, [isDefaultLang, isManualPerSquareMode, langId, manualDerivedTotalPrice, setTranslations]);

  useEffect(() => {
    if (hasShopAccess) return;

    let isCancelled = false;

    const refreshMembership = async () => {
      try {
        const response = await membershipApi.getUserMembership({});
        const payload = extractApiData(response);
        const normalizedMembership =
          payload && typeof payload === "object" ? payload : null;

        if (isCancelled || !normalizedMembership) return;

        setLiveMembership(normalizedMembership);
        dispatch(setUserMembership(normalizedMembership));
      } catch (error) {
        console.error("Greška pri osvježavanju članstva (AdsListing):", error);
      }
    };

    refreshMembership();

    return () => {
      isCancelled = true;
    };
  }, [dispatch, hasShopAccess]);

  const handleField = (field) => (e) => {
    const value = e.target.value;

    setTranslations((prev) => {
      const updatedLangData = {
        ...prev[langId],
        [field]: value,
      };

      if (field === "name" && langId === defaultLangId) {
        updatedLangData.slug = generateSlug(value);
      }

      return {
        ...prev,
        [langId]: updatedLangData,
      };
    });
  };

  const handlePriceOnRequest = (checked) => {
    if (checked && isManualPerSquareMode) return;

    setTranslations((prev) => ({
      ...prev,
      [langId]: {
        ...prev[langId],
        price_on_request: checked,
        price: checked ? "" : prev[langId].price,
        // Ako je na upit, gasi se i akcija
        ...(checked === true && { is_on_sale: false, old_price: "" }),
      },
    }));
  };

  const handlePhoneChange = (value, data) => {
    const dial = data?.dialCode || "";
    const iso2 = data?.countryCode || "";

    setTranslations((prev) => {
      const pureMobile = value.startsWith(dial) ? value.slice(dial.length) : value;
      return {
        ...prev,
        [langId]: {
          ...prev[langId],
          contact: pureMobile,
          country_code: dial,
          region_code: iso2,
        },
      };
    });
  };

  // Helper za izračun popusta
  const priceNum = Number(
    isManualPerSquareMode && manualDerivedTotalPrice
      ? manualDerivedTotalPrice
      : current.price || 0
  );
  const oldPriceNum = Number(current.old_price || 0);
  const showDiscount =
    current.is_on_sale &&
    oldPriceNum > 0 &&
    priceNum > 0 &&
    oldPriceNum > priceNum;

  const discountPct = showDiscount
    ? Math.round(((oldPriceNum - priceNum) / oldPriceNum) * 100)
    : 0;

  return (
    <div className="flex w-full flex-col gap-4 pb-24 dark:[&_.bg-white]:bg-slate-900 dark:[&_.bg-gray-50]:bg-slate-800/70 dark:[&_.bg-gray-50\\/50]:bg-slate-800/70 dark:[&_.bg-gray-100]:bg-slate-800 dark:[&_.bg-gray-200]:bg-slate-700 dark:[&_.bg-gray-300]:bg-slate-600 dark:[&_.text-gray-900]:text-slate-100 dark:[&_.text-gray-800]:text-slate-100 dark:[&_.text-gray-700]:text-slate-200 dark:[&_.text-gray-600]:text-slate-300 dark:[&_.text-gray-500]:text-slate-400 dark:[&_.text-gray-400]:text-slate-500 dark:[&_.border-gray-100]:border-slate-700 dark:[&_.border-gray-200]:border-slate-700 dark:[&_.border-gray-300]:border-slate-600 dark:[&_.bg-blue-50]:bg-blue-500/15 dark:[&_.bg-blue-100]:bg-blue-500/20 dark:[&_.border-blue-100]:border-blue-500/30 dark:[&_.bg-red-50]:bg-red-500/10 dark:[&_.bg-amber-50]:bg-amber-500/10">
      {/* BASIC */}
      <AccordionSection
        title="Osnovno"
        subtitle="Naslov i opis oglasa"
        isOpen={basicOpen}
        onToggle={() => setBasicOpen((v) => !v)}
        badge="required"
      >
        <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
  <Label
    htmlFor="title"
    className={isDefaultLang ? "requiredInputLabel" : ""}
  >
    Naslov
  </Label>
  <Input
    type="text"
    name="title"
    id="title"
    placeholder="Unesite naslov oglasa"
    value={current.name || ""}
    onChange={handleField("name")}
    maxLength={86} // 👈 OGRANIČENJE
    className="border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
  />
  {/* 👇 Opcionalno: Brojač karaktera */}
  <div className="flex justify-end">
    <span className="text-xs text-gray-400">
      {(current.name || "").length} / 86
    </span>
  </div>
</div>

          <RichTextarea
            id="description"
            name="description"
            value={current.description || ""}
            onChange={handleField("description")}
            label="Detaljan opis"
            placeholder="Navedite sve bitne informacije o artiklu..."
            maxLength={7000}
            minHeight={160}
            required={isDefaultLang}
          />
        </div>
      </AccordionSection>

      {/* PRICE / SALARY + SALE (MERGED) */}
      {isDefaultLang && (
        <AccordionSection
          title={is_job_category ? "Plata" : "Cijena"}
          subtitle={
            is_job_category
              ? "Minimalna i maksimalna plata"
              : current.price_on_request
              ? "Cijena na upit"
              : "Postavite cijenu i opcionalno popust"
          }
          isOpen={priceOpen}
          onToggle={() => setPriceOpen((v) => !v)}
          badge={!is_job_category && current.price_on_request ? "optional" : "required"}
        >
          {is_job_category ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="salaryMin">Minimalna plata</Label>
                <Input
                  type="number"
                  name="salaryMin"
                  id="salaryMin"
                  min={0}
                  placeholder={placeholderLabel}
                  value={current.min_salary || ""}
                  onChange={handleField("min_salary")}
                  className="border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="salaryMax">Maksimalna plata</Label>
                <Input
                  type="number"
                  min={0}
                  name="salaryMax"
                  id="salaryMax"
                  placeholder={placeholderLabel}
                  value={current.max_salary || ""}
                  onChange={handleField("max_salary")}
                  className="border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {/* 1. INPUT ZA CIJENU */}
              <div className="flex flex-col gap-2">
                <Label
                  htmlFor="price"
                  className={
                    !current.price_on_request && !isManualPerSquareMode
                      ? "requiredInputLabel"
                      : ""
                  }
                >
                  Cijena
                </Label>
                <Input
                  type="number"
                  name="price"
                  id="price"
                  min={0}
                  placeholder={
                    current.price_on_request
                      ? "Cijena na upit"
                      : isManualPerSquareMode
                      ? "Automatski izračun iz m²"
                      : placeholderLabel
                  }
                  value={
                    isManualPerSquareMode
                      ? manualDerivedTotalPrice || ""
                      : current.price || ""
                  }
                  onChange={handleField("price")}
                  disabled={shouldDisableMainPriceInput}
                  className={`border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 transition-colors ${
                    shouldDisableMainPriceInput ? "bg-gray-100 text-gray-400 cursor-not-allowed" : ""
                  }`}
                />
                {isManualPerSquareMode ? (
                  <p className="text-xs text-cyan-700 dark:text-cyan-300">
                    Ukupna cijena se računa automatski iz ručne cijene po m² i površine.
                  </p>
                ) : null}
              </div>

              {/* 2. SWITCH: CIJENA NA UPIT */}
              <div className="flex items-center space-x-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                <Switch
                  id="price-on-request"
                  checked={current.price_on_request || false}
                  onCheckedChange={handlePriceOnRequest}
                  disabled={isManualPerSquareMode}
                />
                <div className="flex flex-col">
                  <Label 
                    htmlFor="price-on-request" 
                    className="font-medium text-gray-700 cursor-pointer"
                  >
                    Cijena na upit
                  </Label>
                  <span className="text-xs text-gray-500">
                    {isManualPerSquareMode
                      ? "Isključeno dok je aktivan ručni unos po m²."
                      : "Kupci će vas morati kontaktirati za cijenu."}
                  </span>
                </div>
              </div>

              {is_real_estate ? (
                <div className="rounded-xl border border-cyan-200 bg-cyan-50/70 p-3 dark:border-cyan-500/30 dark:bg-cyan-500/10">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-cyan-900 dark:text-cyan-100">
                        Cijena po m²
                      </p>
                      <p className="mt-0.5 text-xs text-cyan-700 dark:text-cyan-200">
                        Uključite prikaz cijene po m² za nekretnine.
                      </p>
                    </div>
                    <Switch
                      id="show_price_per_m2"
                      checked={Boolean(current?.show_price_per_m2)}
                      onCheckedChange={(checked) => {
                        setTranslations((prev) => ({
                          ...prev,
                          [langId]: {
                            ...prev[langId],
                            show_price_per_m2: checked,
                            price_per_m2_mode: prev?.[langId]?.price_per_m2_mode || "auto",
                          },
                        }));
                      }}
                    />
                  </div>

                  {current?.show_price_per_m2 ? (
                    <div className="mt-3 space-y-3">
                      <div className="flex items-center justify-between rounded-xl border border-cyan-200 bg-white px-3 py-2.5 dark:border-cyan-500/40 dark:bg-slate-900/70">
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            Ručni unos po m²
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-300">
                            {isManualPerSquareMode
                              ? "Aktivno: ručno unosite cijenu po m²."
                              : "Isključeno: cijena po m² se računa automatski."}
                          </p>
                        </div>
                        <Switch
                          id="price_per_m2_mode_manual"
                          checked={isManualPerSquareMode}
                          onCheckedChange={(checked) =>
                            setTranslations((prev) => ({
                              ...prev,
                              [langId]: {
                                ...prev[langId],
                                price_per_m2_mode: checked ? REAL_ESTATE_PRICE_MODE_MANUAL : "auto",
                                ...(checked ? { price_on_request: false } : {}),
                              },
                            }))
                          }
                        />
                      </div>

                      <p className="text-xs text-slate-700 dark:text-slate-300">
                        Površina iz detalja oglasa:{" "}
                        <span className="font-semibold">
                          {formatAreaInline(real_estate_area_m2)
                            ? `${formatAreaInline(real_estate_area_m2)} m²`
                            : "nije unesena"}
                        </span>
                      </p>

                      {isManualPerSquareMode ? (
                        <div className="space-y-1">
                          <Label htmlFor="price_per_unit" className="text-sm font-semibold text-gray-800">
                            Ručna cijena po m² (KM)
                          </Label>
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            name="price_per_unit"
                            id="price_per_unit"
                            placeholder="npr. 1.950"
                            value={current.price_per_unit || ""}
                            onChange={handleField("price_per_unit")}
                            className="border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                          />
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <Label htmlFor="price_per_m2_auto" className="text-sm font-semibold text-gray-800">
                            Automatska cijena po m²
                          </Label>
                          <Input
                            type="text"
                            id="price_per_m2_auto"
                            readOnly
                            value={realEstatePricing?.autoValue ? formatCurrencyInline(realEstatePricing.autoValue) : ""}
                            placeholder="Unesite cijenu i površinu"
                            className="border border-slate-300 rounded-xl bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                          />
                        </div>
                      )}

                      {!real_estate_area_m2 ? (
                        <p className="text-xs text-amber-700 dark:text-amber-300">
                          Cijena po m² će biti dostupna nakon unosa površine (m²) u detaljima oglasa.
                        </p>
                      ) : null}

                      {realEstatePricing?.canDisplay ? (
                        <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                          Prikaz na oglasu: {formatCurrencyInline(realEstatePricing.resolvedValue)} / m²
                        </p>
                      ) : null}
                      {isManualPerSquareMode && manualDerivedTotalPrice ? (
                        <p className="text-xs font-semibold text-cyan-700 dark:text-cyan-300">
                          Izračunata ukupna cijena: {formatCurrencyInline(manualDerivedTotalPrice)}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : null}

              {/* 3. SEKCIJA: AKCIJA / POPUST (Samo ako nije cijena na upit) */}
              {!current.price_on_request && (
                <div className="border-t-2 border-dashed border-gray-100 pt-4">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-50 rounded-lg border border-blue-100">
                        <Percent className="text-blue-600" size={18} />
                      </div>
                      <div>
                        <Label htmlFor="is_on_sale" className="text-base font-semibold text-gray-900 cursor-pointer">
                          Akcija / Popust
                        </Label>
                        <p className="text-xs text-gray-500">
                          Uključite da prikažete staru cijenu i popust.
                        </p>
                      </div>
                    </div>

                    <Switch
                      id="is_on_sale"
                      checked={!!current.is_on_sale}
                      onCheckedChange={(checked) => {
                        setTranslations((prev) => ({
                          ...prev,
                          [langId]: {
                            ...prev[langId],
                            is_on_sale: checked,
                            ...(checked === false && { old_price: "" }),
                          },
                        }));
                      }}
                      className="data-[state=checked]:bg-blue-600"
                    />
                  </div>

                  {/* UNOS STARE CIJENE */}
                  {current.is_on_sale && (
                    <div className="pl-2 border-l-4 border-blue-100 ml-2">
                      <div className="flex flex-col gap-2">
                        <Label
                          htmlFor="old_price"
                          className="flex items-center gap-2 text-sm font-medium text-gray-700"
                        >
                          <Tag className="text-gray-400" size={14} />
                          Stara cijena (prije akcije)
                        </Label>

                        <div className="relative">
                          <Input
                            type="number"
                            name="old_price"
                            id="old_price"
                            placeholder={placeholderLabel}
                            value={current.old_price || ""}
                            onChange={handleField("old_price")}
                            min={0}
                            className="border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                          />

                          {showDiscount && discountPct > 0 && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 bg-red-100 text-red-600 border border-red-200 text-xs font-bold px-2 py-1 rounded-full animate-in fade-in zoom-in">
                              -{discountPct}%
                            </div>
                          )}
                        </div>

                        {current.old_price &&
                          current.price &&
                          Number(current.old_price) <= Number(current.price) && (
                            <p className="text-xs text-amber-600 flex items-center gap-1">
                              ⚠️ Stara cijena treba biti veća od trenutne.
                            </p>
                          )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </AccordionSection>
      )}

      {/* STOCK */}
      {isDefaultLang && !is_real_estate && (
        <AccordionSection
          title="Zalihe"
          subtitle="Shop može voditi zalihe i internu šifru artikla"
          isOpen={stockOpen}
          onToggle={() => setStockOpen((v) => !v)}
          badge="optional"
          planGate={<PlanGateLabel scope="shop" unlocked={hasShopAccess} showStatus={false} />}
        >
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="inventory_count" className="text-base font-semibold text-gray-800">
                Količina na zalihi
              </Label>
              <PlanGateLabel scope="shop" unlocked={hasShopAccess} showStatus={false} />
            </div>
            <p className="text-sm text-gray-600">
              Ostavite prazno ako prodajete samo jedan artikal. Zalihe su dostupne isključivo za LMX Shop članove.
            </p>

            <div className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-800 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200">
              <span className="font-semibold">LMX savjet:</span> Ako prodajete više komada, precizna zaliha i cijena po komadu podižu povjerenje kupca.
            </div>

            <Input
              type="number"
              name="inventory_count"
              id="inventory_count"
              min={1}
              placeholder="npr. 10"
              value={current.inventory_count || ""}
              onChange={handleField("inventory_count")}
              disabled={!hasShopAccess}
              className="border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />

            {!hasShopAccess && (
              <p className="text-xs text-amber-600 mt-1">
                Ova opcija je dostupna samo za LMX Shop korisnike.
              </p>
            )}

            {hasShopAccess && current.inventory_count && parseInt(current.inventory_count, 10) > 1 && (
              <p className="text-xs text-blue-600 mt-1">
                ✨ Moći ćete pratiti prodaju i zalihe za ovaj oglas!
              </p>
            )}

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="space-y-1">
                <Label htmlFor="price_per_unit" className="text-sm font-semibold text-gray-800">
                  Cijena po komadu (KM)
                </Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  name="price_per_unit"
                  id="price_per_unit"
                  placeholder="npr. 12.50"
                  value={current.price_per_unit || ""}
                  onChange={handleField("price_per_unit")}
                  disabled={!hasShopAccess}
                  className="border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="minimum_order_quantity" className="text-sm font-semibold text-gray-800">
                  Minimalna količina
                </Label>
                <Input
                  type="number"
                  min={1}
                  name="minimum_order_quantity"
                  id="minimum_order_quantity"
                  placeholder="1"
                  value={current.minimum_order_quantity || ""}
                  onChange={handleField("minimum_order_quantity")}
                  disabled={!hasShopAccess}
                  className="border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="stock_alert_threshold" className="text-sm font-semibold text-gray-800">
                  Prag niske zalihe
                </Label>
                <Input
                  type="number"
                  min={1}
                  name="stock_alert_threshold"
                  id="stock_alert_threshold"
                  placeholder="3"
                  value={current.stock_alert_threshold || ""}
                  onChange={handleField("stock_alert_threshold")}
                  disabled={!hasShopAccess}
                  className="border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="mt-3 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="seller_product_code" className="text-base font-semibold text-gray-800">
                  Interna šifra proizvoda
                </Label>
                <PlanGateLabel scope="shop" unlocked={hasShopAccess} showStatus={false} />
              </div>
              <Input
                type="text"
                name="seller_product_code"
                id="seller_product_code"
                maxLength={100}
                placeholder="npr. SKU-BT-ZV-001"
                value={current.seller_product_code || ""}
                onChange={handleField("seller_product_code")}
                disabled={!hasShopAccess}
                className="border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
              <p className="text-xs text-gray-500">
                Šifra je za internu evidenciju prodavača i neće biti javno istaknuta kupcima.
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                LMX je posredni oglasni servis: plaćanje, dostava i reklamacije su dogovor između prodavača i kupca.
              </p>
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/60">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    Oznaka \"Do isteka zaliha\"
                  </p>
                  <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
                    Oglas će dobiti scarcity prikaz samo kada je zaliha stvarno niska.
                  </p>
                </div>
                <Switch
                  id="scarcity_enabled"
                  checked={scarcityEnabled}
                  onCheckedChange={(checked) => {
                    if (scarcityToggleLocked) return;
                    setTranslations((prev) => ({
                      ...prev,
                      [langId]: {
                        ...prev[langId],
                        scarcity_enabled: checked,
                      },
                    }));
                    setScarcityClientLockUntilTs(Date.now() + CLIENT_SCARCITY_COOLDOWN_MS);
                  }}
                  disabled={!hasShopAccess || scarcityToggleLocked}
                  className="data-[state=checked]:bg-amber-500"
                />
              </div>

              {!hasShopAccess ? (
                <p className="mt-2 text-xs text-amber-700">
                  Ova opcija je dostupna samo za LMX Shop korisnike.
                </p>
              ) : null}

              {hasShopAccess && scarcityToggleLocked ? (
                <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
                  Privremeno zaključano zbog čestih promjena. Pokušajte ponovo za{" "}
                  {scarcityLockRemainingSeconds >= 60
                    ? `oko ${Math.ceil(scarcityLockRemainingSeconds / 60)} min`
                    : `${scarcityLockRemainingSeconds} s`}
                  .
                </p>
              ) : null}

              {hasShopAccess && scarcityEnabled && !scarcityHasInventory ? (
                <p className="mt-2 text-xs text-rose-700 dark:text-rose-300">
                  Unesite količinu na zalihi veću od 0 da bi oznaka postala aktivna.
                </p>
              ) : null}

              {hasShopAccess && scarcityEnabled && scarcityHasInventory && !scarcityIsLow ? (
                <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
                  Oznaka će se automatski aktivirati kad zaliha padne na {parsedLowThreshold} ili manje.
                </p>
              ) : null}

              {hasShopAccess && scarcityEnabled && scarcityIsLow ? (
                <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-300">
                  Aktivno: {scarcityIsLastUnits ? "Posljednji komadi." : `Još ${parsedInventoryCount} komada dostupno.`}
                </p>
              ) : null}
            </div>
          </div>
        </AccordionSection>
      )}

      {/* CONTACT */}
      {isDefaultLang && (
        <AccordionSection
          title="Kontakt"
          subtitle="Broj telefona koji kupci vide"
          isOpen={contactOpen}
          onToggle={() => setContactOpen((v) => !v)}
          badge="required"
        >
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="phonenumber"
              className={isDefaultLang ? "requiredInputLabel" : ""}
            >
              Broj telefona
            </Label>

            <PhoneInput
              country={process.env.NEXT_PUBLIC_DEFAULT_COUNTRY}
              value={`${current.country_code || ""}${current.contact || ""}`}
              onChange={(phone, data) => handlePhoneChange(phone, data)}
              inputProps={{
                name: "phonenumber",
                id: "phonenumber",
              }}
              {...LMX_PHONE_INPUT_PROPS}
            />
          </div>
        </AccordionSection>
      )}

      {/* Sticky Action Buttons */}
      <StickyActionButtons
        secondaryLabel="Nazad"
        onSecondaryClick={handleDeatilsBack}
        primaryLabel={isNextLoading ? "Pripremamo..." : "Naprijed"}
        onPrimaryClick={handleDetailsSubmit}
        primaryDisabled={isNextLoading}
      />
    </div>
  );
};

export default ComponentTwo;
