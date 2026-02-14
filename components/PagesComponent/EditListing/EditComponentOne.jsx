"use client";

import React, { memo, useCallback, useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  getCurrencyPosition,
  getCurrencySymbol,
} from "@/redux/reducer/settingSlice";
import { generateSlug } from "@/utils";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { useSelector } from "react-redux";
import { userSignUpData } from "@/redux/reducer/authSlice";
import { useRouter } from "next/navigation";
import { resolveMembership } from "@/lib/membership";
import StickyActionButtons from "@/components/Common/StickyActionButtons";
import PlanGateLabel from "@/components/Common/PlanGateLabel";
import { LMX_PHONE_INPUT_PROPS } from "@/components/Common/phoneInputTheme";

// Ikone za sekcije (React Icons)
import {
  MdOutlineTitle,
  MdAttachMoney,
  MdPhoneIphone,
  MdInventory,
} from "@/components/Common/UnifiedIconPack";
import { BsTextParagraph, BsTag } from "@/components/Common/UnifiedIconPack";
import { FiPercent } from "@/components/Common/UnifiedIconPack";

// Ikone za Editor (Lucide React)
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Link as LinkIcon,
  Type,
} from "@/components/Common/UnifiedIconPack";

// ============================================
// ACCORDION SECTION
// ============================================
const AccordionSection = ({
  title,
  subtitle,
  badge, // "required" | "optional"
  isOpen,
  onToggle,
  planGate,
  children,
}) => {
  return (
    <div className="border-2 border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
      <div
        onClick={onToggle}
        className={`flex items-center justify-between p-4 sm:p-5 cursor-pointer transition-all duration-200 ${
          isOpen ? "bg-blue-50 border-b-2 border-blue-100" : "hover:bg-gray-50"
        }`}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3
              className={`text-base sm:text-lg font-semibold ${
                isOpen ? "text-blue-700" : "text-gray-900"
              }`}
            >
              {title}
            </h3>

            {planGate ? planGate : null}

            {badge && (
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  badge === "required"
                    ? "bg-red-100 text-red-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {badge === "required" ? "Obavezno" : "Opcionalno"}
              </span>
            )}
          </div>

          {subtitle ? (
            <p className="text-xs sm:text-sm text-gray-600 mt-0.5 truncate">
              {subtitle}
            </p>
          ) : null}
        </div>

        <svg
          className={`w-6 h-6 text-gray-400 transition-transform duration-300 flex-shrink-0 ml-2 ${
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

      {isOpen && <div className="p-4 sm:p-6 bg-white">{children}</div>}
    </div>
  );
};

// ========================================
// RichTextarea Component (WYSIWYG - Real Bold)
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

  // Inicijalno postavljanje vrijednosti
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
    const url = prompt("Unesite URL linka:", "https://");
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
        <Label htmlFor={id} className={`flex items-center gap-2 ${required ? "requiredInputLabel" : ""}`}>
          <BsTextParagraph className="text-gray-500" size={16} />
          {label}
        </Label>
      )}

      <div 
        className={`w-full border-2 rounded-xl overflow-hidden bg-white transition-all ${
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
            title="Numerisana lista"
          >
            <ListOrdered className="w-4 h-4" />
          </button>

          <div className="w-px h-5 bg-gray-300 mx-1" />

          <button
            type="button"
            onMouseDown={preventFocusLoss}
            onClick={handleLink}
            className="p-2 text-gray-600 hover:bg-white hover:text-blue-600 hover:shadow-sm rounded-lg transition-all"
            title="Dodaj Link"
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
          />
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

const baseInput =
  "border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white";

const EditComponentOne = ({
  setTranslations,
  current,
  langId,
  defaultLangId,
  handleDetailsSubmit,
  is_job_category,
  isPriceOptional,
}) => {
  const router = useRouter();
  const currencyPosition = useSelector(getCurrencyPosition);
  const currencySymbol = useSelector(getCurrencySymbol);
  const currentUser = useSelector(userSignUpData);
  const membership = resolveMembership(currentUser, currentUser?.membership);
  const isShopMember = Boolean(membership?.isShop);

  const placeholderLabel =
    currencyPosition === "right" ? `00 ${currencySymbol}` : `${currencySymbol} 00`;

  const isDefaultLang = langId === defaultLangId;

  // Accordion state
  const [basicOpen, setBasicOpen] = useState(true);
  const [priceOpen, setPriceOpen] = useState(false);
  const [saleOpen, setSaleOpen] = useState(false);
  const [stockOpen, setStockOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);

  const handleField = useCallback(
    (field) => (e) => {
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
    },
    [langId, defaultLangId, setTranslations]
  );

  const handlePriceOnRequest = (checked) => {
    setTranslations((prev) => ({
      ...prev,
      [langId]: {
        ...prev[langId],
        price_on_request: checked,
        price: checked ? "" : prev[langId].price, // Resetuje cijenu ako je "na upit"
      },
    }));
  };

  const handlePhoneChange = useCallback(
    (value, data) => {
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
    },
    [langId, setTranslations]
  );

  // Sale helper
  const priceNum = Number(current?.price || 0);
  const oldPriceNum = Number(current?.old_price || 0);
  const showDiscount =
    current?.is_on_sale &&
    oldPriceNum > 0 &&
    priceNum > 0 &&
    oldPriceNum > priceNum;

  const discountPct = showDiscount
    ? Math.round(((oldPriceNum - priceNum) / oldPriceNum) * 100)
    : 0;

  return (
    <div className="flex flex-col gap-4 pb-24">
      {/* OSNOVNO */}
      <AccordionSection
        title="Osnovno"
        subtitle="Naslov i opis"
        badge={isDefaultLang ? "required" : "optional"}
        isOpen={basicOpen}
        onToggle={() => setBasicOpen((v) => !v)}
      >
        <div className="flex flex-col gap-4">
          {/* NASLOV */}
          <div className="flex flex-col gap-2">
  <Label
    htmlFor="title"
    className={`flex items-center gap-2 ${
      isDefaultLang ? "requiredInputLabel" : ""
    }`}
  >
    <MdOutlineTitle className="text-gray-500" size={16} />
    Naslov
  </Label>
  <Input
    type="text"
    name="title"
    id="title"
    placeholder="Unesite naslov oglasa"
    value={current?.name || ""}
    onChange={handleField("name")}
    maxLength={86} // 👈 OGRANIČENJE
    className={baseInput}
  />
  {/* 👇 Opcionalno: Brojač karaktera */}
  <div className="flex justify-end">
    <span className="text-xs text-gray-400">
      {(current?.name || "").length} / 86
    </span>
  </div>
</div>

          {/* OPIS - ZAMIJENJENO SA RICHTEXTAREA */}
          <RichTextarea
            id="description"
            name="description"
            label="Detaljan opis"
            placeholder="Unesite detaljan opis artikla..."
            value={current?.description || ""}
            onChange={handleField("description")}
            maxLength={7000}
            minHeight={160}
            required={isDefaultLang}
          />
        </div>
      </AccordionSection>

      {/* CIJENA / PLATA (default lang) */}
      {isDefaultLang && (
        <AccordionSection
          title={is_job_category ? "Plata" : "Cijena"}
          subtitle={
            is_job_category
              ? "Minimalna i maksimalna plata"
              : current?.price_on_request
              ? "Cijena na upit"
              : "Unesite cijenu"
          }
          // 👇 PROMJENA: Ovdje je uslov za obavezno polje. Ako je "na upit" (true), značka je "optional". Ako nije na upit (false), značka je "required".
          badge={!is_job_category && current?.price_on_request ? "optional" : "required"}
          isOpen={priceOpen}
          onToggle={() => setPriceOpen((v) => !v)}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {is_job_category ? (
              <>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="min_salary" className="flex items-center gap-2">
                    <MdAttachMoney className="text-gray-500" size={16} />
                    Minimalna plata
                  </Label>
                  <Input
                    type="number"
                    name="min_salary"
                    id="min_salary"
                    placeholder={placeholderLabel}
                    value={current?.min_salary || ""}
                    onChange={handleField("min_salary")}
                    min={0}
                    className={baseInput}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="max_salary" className="flex items-center gap-2">
                    <MdAttachMoney className="text-gray-500" size={16} />
                    Maksimalna plata
                  </Label>
                  <Input
                    type="number"
                    name="max_salary"
                    id="max_salary"
                    placeholder={placeholderLabel}
                    value={current?.max_salary || ""}
                    onChange={handleField("max_salary")}
                    min={0}
                    className={baseInput}
                  />
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-4 md:col-span-2">
                <div className="flex flex-col gap-2">
                  <Label
                    htmlFor="price"
                    // 👇 PROMJENA: Ako nije "Na upit", dodaje crvenu zvjezdicu (requiredInputLabel)
                    className={`flex items-center gap-2 ${
                      !current?.price_on_request ? "requiredInputLabel" : ""
                    }`}
                  >
                    <MdAttachMoney className="text-gray-500" size={16} />
                    Cijena
                  </Label>
                  <Input
                    type="number"
                    name="price"
                    id="price"
                    placeholder={current?.price_on_request ? "Cijena na upit" : placeholderLabel}
                    value={current?.price || ""}
                    onChange={handleField("price")}
                    min={0}
                    disabled={current?.price_on_request}
                    className={`${baseInput} transition-colors ${
                      current?.price_on_request ? "bg-gray-100 text-gray-400 cursor-not-allowed" : ""
                    }`}
                  />
                </div>

                {/* SWITCH CIJENA NA UPIT */}
                <div className="flex items-center space-x-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <Switch
                    id="price-on-request"
                    checked={current?.price_on_request || false}
                    onCheckedChange={handlePriceOnRequest}
                  />
                  <div className="flex flex-col">
                    <Label 
                      htmlFor="price-on-request" 
                      className="font-medium text-gray-700 cursor-pointer"
                    >
                      Cijena na upit
                    </Label>
                    <span className="text-xs text-gray-500">
                      Kupci će morati kontaktirati vas za cijenu
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </AccordionSection>
      )}

      {/* AKCIJA / POPUST (default lang, only for non-job) */}
      {isDefaultLang && !is_job_category && (
        <AccordionSection
          title="Akcija / Popust"
          subtitle="Opcionalno: prikaži staru cijenu i izračunaj popust"
          badge="optional"
          isOpen={saleOpen}
          onToggle={() => setSaleOpen((v) => !v)}
        >
          <div className="border-2 border-gray-200 rounded-xl p-4 bg-gray-50">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white rounded-lg border border-gray-200">
                  <FiPercent className="text-gray-700" size={18} />
                </div>
                <div>
                  <Label htmlFor="is_on_sale" className="text-base font-semibold text-gray-900">
                    Akcija / Popust
                  </Label>
                  <p className="text-sm text-gray-600">
                    Ako uključite, kupci vide staru cijenu prekriženo.
                  </p>
                </div>
              </div>

              <Switch
                id="is_on_sale"
                checked={!!current?.is_on_sale}
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
                className="data-[state=checked]:bg-primary"
              />
            </div>

            {current?.is_on_sale && (
              <div className="mt-4 flex flex-col gap-2">
                <Label
                  htmlFor="old_price"
                  className="flex items-center gap-2 text-sm font-medium text-gray-800"
                >
                  <BsTag className="text-gray-500" size={14} />
                  Stara cijena (prije akcije)
                </Label>

                <div className="relative">
                  <Input
                    type="number"
                    name="old_price"
                    id="old_price"
                    placeholder={placeholderLabel}
                    value={current?.old_price || ""}
                    onChange={handleField("old_price")}
                    min={0}
                    className={`${baseInput}`}
                  />

                  {showDiscount && discountPct > 0 && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded-full">
                      -{discountPct}%
                    </div>
                  )}
                </div>

                {current?.old_price &&
                  current?.price &&
                  Number(current.old_price) <= Number(current.price) && (
                    <p className="text-xs text-amber-700">
                      ⚠️ Stara cijena mora biti veća od nove cijene.
                    </p>
                  )}
              </div>
            )}
          </div>
        </AccordionSection>
      )}

      {/* ZALIHE (default lang, non-job) */}
      {isDefaultLang && !is_job_category && (
        <AccordionSection
          title="Zalihe"
          subtitle="Shop može voditi zalihe i internu šifru artikla"
          badge="optional"
          isOpen={stockOpen}
          onToggle={() => setStockOpen((v) => !v)}
          planGate={<PlanGateLabel scope="shop" unlocked={isShopMember} showStatus={false} />}
        >
          <div className="border-2 border-gray-200 rounded-xl p-4 bg-gray-50">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-white rounded-lg border border-gray-200">
                <MdInventory className="text-gray-700" size={18} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Label htmlFor="inventory_count" className="text-base font-semibold text-gray-900">
                    Količina na zalihi
                  </Label>
                  <PlanGateLabel scope="shop" unlocked={isShopMember} showStatus={false} />
                </div>
                <p className="text-sm text-gray-600">
                  Ostavite prazno ako prodajete samo jedan artikal.
                </p>
              </div>
            </div>

            <div className="mt-3">
              <Input
                type="number"
                name="inventory_count"
                id="inventory_count"
                min={1}
                placeholder="npr. 10"
                value={current?.inventory_count || ""}
                onChange={handleField("inventory_count")}
                disabled={!isShopMember}
                className={baseInput}
              />
              {!isShopMember && (
                <p className="text-xs text-amber-700 mt-2">
                  Ova opcija je dostupna samo za LMX Shop korisnike.
                </p>
              )}
              {isShopMember && current?.inventory_count && parseInt(current.inventory_count, 10) > 1 && (
                <p className="text-xs text-gray-600 mt-2">
                  ✅ Unijeli ste više komada — zalihe možete pratiti kroz oglas.
                </p>
              )}
            </div>

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
                  value={current?.price_per_unit || ""}
                  onChange={handleField("price_per_unit")}
                  disabled={!isShopMember}
                  className={baseInput}
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
                  value={current?.minimum_order_quantity || ""}
                  onChange={handleField("minimum_order_quantity")}
                  disabled={!isShopMember}
                  className={baseInput}
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
                  value={current?.stock_alert_threshold || ""}
                  onChange={handleField("stock_alert_threshold")}
                  disabled={!isShopMember}
                  className={baseInput}
                />
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="seller_product_code" className="text-base font-semibold text-gray-900">
                  Interna šifra proizvoda
                </Label>
                <PlanGateLabel scope="shop" unlocked={isShopMember} showStatus={false} />
              </div>
              <Input
                type="text"
                name="seller_product_code"
                id="seller_product_code"
                maxLength={100}
                placeholder="npr. SKU-BT-ZV-001"
                value={current?.seller_product_code || ""}
                onChange={handleField("seller_product_code")}
                disabled={!isShopMember}
                className={`${baseInput} mt-2`}
              />
              <p className="text-xs text-gray-600 mt-2">
                Šifra služi za internu evidenciju prodaje i praćenje artikala.
              </p>
            </div>
          </div>
        </AccordionSection>
      )}

      {/* KONTAKT (default lang) */}
      {isDefaultLang && (
        <AccordionSection
          title="Kontakt"
          subtitle="Broj telefona koji kupci vide"
          badge="required"
          isOpen={contactOpen}
          onToggle={() => setContactOpen((v) => !v)}
        >
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="phonenumber"
              className={`flex items-center gap-2 ${isDefaultLang ? "requiredInputLabel" : ""}`}
            >
              <MdPhoneIphone className="text-gray-500" size={16} />
              Broj telefona
            </Label>

            <div className="phone-input-container">
              <PhoneInput
                country={process.env.NEXT_PUBLIC_DEFAULT_COUNTRY}
                value={`${current?.country_code || ""}${current?.contact || ""}`}
                onChange={(phone, data) => handlePhoneChange(phone, data)}
                inputProps={{
                  name: "phonenumber",
                  id: "phonenumber",
                }}
                {...LMX_PHONE_INPUT_PROPS}
              />
            </div>
          </div>
        </AccordionSection>
      )}

      {/* FOOTER DUGMAD */}
      <StickyActionButtons
        secondaryLabel="Odustani"
        onSecondaryClick={() => router.back()}
        primaryLabel="Nastavi"
        onPrimaryClick={handleDetailsSubmit}
      />
    </div>
  );
};

export default memo(EditComponentOne);
