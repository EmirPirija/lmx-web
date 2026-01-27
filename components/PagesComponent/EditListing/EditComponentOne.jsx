import React, { memo, useCallback, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  getCurrencyPosition,
  getCurrencySymbol,
} from "@/redux/reducer/settingSlice";
import { generateSlug } from "@/utils";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";

// Ikone
import {
  MdOutlineTitle,
  MdAttachMoney,
  MdLink,
  MdPhoneIphone,
  MdChevronRight,
  MdInventory,
} from "react-icons/md";
import { BsTextParagraph, BsTag } from "react-icons/bs";
import { FiPercent } from "react-icons/fi";

// ============================================
// ACCORDION SECTION (same style as ComponentTwo/Three)
// ============================================
const AccordionSection = ({
  title,
  subtitle,
  badge, // "required" | "optional"
  isOpen,
  onToggle,
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

const baseInput =
  "border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white";
const baseTextarea =
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

  const placeholderLabel =
    currencyPosition === "right" ? `00 ${currencySymbol}` : `${currencySymbol} 00`;

  const isDefaultLang = langId === defaultLangId;

  // Accordion state
  const [basicOpen, setBasicOpen] = useState(true);
  const [priceOpen, setPriceOpen] = useState(false);
  const [saleOpen, setSaleOpen] = useState(false);
  const [stockOpen, setStockOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [mediaOpen, setMediaOpen] = useState(false);

  const handleField = useCallback(
    (field) => (e) => {
      const value = e.target.value;
      setTranslations((prev) => {
        const updatedLangData = {
          ...prev[langId],
          [field]: value,
        };

        // ✅ i dalje generišemo slug u pozadini (bez slug inputa)
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
              className={baseInput}
            />
          </div>

          {/* OPIS */}
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="description"
              className={`flex items-center gap-2 ${
                isDefaultLang ? "requiredInputLabel" : ""
              }`}
            >
              <BsTextParagraph className="text-gray-500" size={16} />
              Opis
            </Label>
            <Textarea
              name="description"
              id="description"
              placeholder="Unesite detaljan opis artikla..."
              value={current?.description || ""}
              onChange={handleField("description")}
              className={`min-h-[140px] resize-y ${baseTextarea}`}
            />
            <p className="text-xs text-gray-500">
              Savjet: kratki paragrafi i liste čine oglas čitljivijim.
            </p>
          </div>
        </div>
      </AccordionSection>

      {/* CIJENA / PLATA (default lang) */}
      {isDefaultLang && (
        <AccordionSection
          title={is_job_category ? "Plata" : "Cijena"}
          subtitle={
            is_job_category
              ? "Minimalna i maksimalna plata"
              : "Unesite cijenu (ili ostavite prazno ako je dozvoljeno)"
          }
          badge={!is_job_category && isPriceOptional ? "optional" : "required"}
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
              <div className="flex flex-col gap-2 md:col-span-2">
                <Label
                  htmlFor="price"
                  className={`flex items-center gap-2 ${
                    !isPriceOptional ? "requiredInputLabel" : ""
                  }`}
                >
                  <MdAttachMoney className="text-gray-500" size={16} />
                  Cijena
                </Label>
                <Input
                  type="number"
                  name="price"
                  id="price"
                  placeholder={placeholderLabel}
                  value={current?.price || ""}
                  onChange={handleField("price")}
                  min={0}
                  className={baseInput}
                />
                {isPriceOptional && (
                  <p className="text-xs text-gray-500">
                    Može ostati prazno ako je dozvoljeno “Na upit”.
                  </p>
                )}
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
          subtitle="Opcionalno: unesite ako imate više komada"
          badge="optional"
          isOpen={stockOpen}
          onToggle={() => setStockOpen((v) => !v)}
        >
          <div className="border-2 border-gray-200 rounded-xl p-4 bg-gray-50">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-white rounded-lg border border-gray-200">
                <MdInventory className="text-gray-700" size={18} />
              </div>
              <div className="flex-1">
                <Label htmlFor="inventory_count" className="text-base font-semibold text-gray-900">
                  Količina na zalihi
                </Label>
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
                className={baseInput}
              />
              {current?.inventory_count && parseInt(current.inventory_count, 10) > 1 && (
                <p className="text-xs text-gray-600 mt-2">
                  ✅ Unijeli ste više komada — zalihe možete pratiti kroz oglas.
                </p>
              )}
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
                enableLongNumbers
                containerClass="!w-full"
                inputClass="!w-full !h-10 !text-sm !border-2 !border-gray-200 !bg-white !rounded-xl focus:!ring-2 focus:!ring-blue-500 focus:!border-transparent"
                buttonClass="!border-2 !border-gray-200 !bg-white !rounded-l-xl hover:!bg-gray-50"
                dropdownClass="!bg-white !text-gray-900 !border-gray-200 !shadow-md"
              />
            </div>
          </div>
        </AccordionSection>
      )}

      {/* VIDEO (default lang) */}
      {isDefaultLang && (
        <AccordionSection
          title="Multimedija"
          subtitle="Opcionalno: dodajte video link"
          badge="optional"
          isOpen={mediaOpen}
          onToggle={() => setMediaOpen((v) => !v)}
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="videoLink" className="flex items-center gap-2">
              <MdLink className="text-gray-500" size={18} />
              Video link
            </Label>
            <Input
              type="text"
              name="videoLink"
              id="videoLink"
              placeholder="Unesite YouTube ili drugi video link"
              value={current?.video_link || ""}
              onChange={handleField("video_link")}
              className={baseInput}
            />
          </div>
        </AccordionSection>
      )}

      {/* FOOTER DUGMAD (same style as other steps) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-2xl z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4 flex justify-between sm:justify-end gap-3">
          <button
            type="button"
            className="bg-black text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg text-base sm:text-lg font-medium hover:bg-gray-800 transition-colors shadow-md flex-1 sm:flex-none"
            onClick={() => router.back()}
          >
            Odustani
          </button>

          <button
            type="button"
            className="bg-primary hover:bg-primary/90 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg text-base sm:text-lg font-medium shadow-md flex-1 sm:flex-none inline-flex items-center justify-center gap-2 transition-all"
            onClick={handleDetailsSubmit}
          >
            Nastavi
            <MdChevronRight size={22} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default memo(EditComponentOne);
