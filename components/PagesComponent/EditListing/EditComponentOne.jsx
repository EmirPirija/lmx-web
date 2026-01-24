import { memo, useCallback } from "react";
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
import { MdOutlineTitle, MdAttachMoney, MdLink, MdPhoneIphone, MdChevronRight, MdInventory } from "react-icons/md";
import { BsTextParagraph, BsTag } from "react-icons/bs";
import { FiLink, FiPercent } from "react-icons/fi";

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
    currencyPosition === "right"
      ? `00 ${currencySymbol}`
      : `${currencySymbol} 00`;

  const handleField = useCallback((field) => (e) => {
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
  }, [langId, defaultLangId, setTranslations]);

  const handlePhoneChange = useCallback((value, data) => {
    const dial = data?.dialCode || ""; 
    const iso2 = data?.countryCode || ""; 
    setTranslations((prev) => {
      const pureMobile = value.startsWith(dial)
        ? value.slice(dial.length)
        : value;
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
  }, [langId, setTranslations]);

  return (
    <div className="flex flex-col gap-6 relative">
      
      {/* NASLOV */}
      <div className="flex flex-col gap-2">
        <Label
          htmlFor="title"
          className={`flex items-center gap-2 ${langId === defaultLangId ? "requiredInputLabel" : ""}`}
        >
          <MdOutlineTitle className="text-gray-500" size={16} />
          Naslov
        </Label>
        <Input
          type="text"
          name="title"
          id="title"
          placeholder="Unesite naslov oglasa"
          value={current.name || ""}
          onChange={handleField("name")}
          className="bg-white"
        />
      </div>

      {/* OPIS */}
      <div className="flex flex-col gap-2">
        <Label
          htmlFor="description"
          className={`flex items-center gap-2 ${langId === defaultLangId ? "requiredInputLabel" : ""}`}
        >
          <BsTextParagraph className="text-gray-500" size={16} />
          Opis
        </Label>
        <Textarea
          name="description"
          id="description"
          placeholder="Unesite detaljan opis artikla..."
          value={current.description || ""}
          onChange={handleField("description")}
          className="min-h-[120px] bg-white resize-y"
        />
      </div>

      {/* CIJENA / PLATA & TELEFON */}
      {langId === defaultLangId && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* CIJENA ILI PLATA */}
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
                    value={current.min_salary || ""}
                    onChange={handleField("min_salary")}
                    min={0}
                    className="bg-white"
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
                    value={current.max_salary || ""}
                    onChange={handleField("max_salary")}
                    min={0}
                    className="bg-white"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-col gap-2">
                  <Label
                    htmlFor="price"
                    className={`flex items-center gap-2 ${!isPriceOptional && langId === defaultLangId ? "requiredInputLabel" : ""}`}
                  >
                    <MdAttachMoney className="text-gray-500" size={16} />
                    Cijena
                  </Label>
                  <Input
                    type="number"
                    name="price"
                    id="price"
                    placeholder={placeholderLabel}
                    value={current.price || ""}
                    onChange={handleField("price")}
                    min={0}
                    className="bg-white"
                  />
                </div>

                {/* AKCIJA / POPUST */}
                <div className="flex flex-col gap-4 col-span-1 md:col-span-2 p-4 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <FiPercent className="text-orange-600" size={20} />
                      </div>
                      <div>
                        <Label htmlFor="is_on_sale" className="flex items-center gap-2 text-base font-semibold text-gray-800">
                          Akcija / Popust
                        </Label>
                        <p className="text-sm text-gray-500">
                          Prikaži staru cijenu prekriženo i istakni novu cijenu
                        </p>
                      </div>
                    </div>
                    <Switch
                      id="is_on_sale"
                      checked={current.is_on_sale || false}
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
                      className="data-[state=checked]:bg-orange-500"
                    />
                  </div>

                  {/* STARA CIJENA */}
                  {current.is_on_sale && (
                    <div className="flex flex-col gap-2 animate-in slide-in-from-top-2 duration-300">
                      <Label htmlFor="old_price" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <BsTag className="text-gray-500" size={14} />
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
                          className="bg-white border-orange-200 focus:border-orange-400 focus:ring-orange-400"
                        />
                        {current.old_price && current.price && Number(current.old_price) > Number(current.price) && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full">
                            -{Math.round(((Number(current.old_price) - Number(current.price)) / Number(current.old_price)) * 100)}%
                          </div>
                        )}
                      </div>
                      {current.old_price && current.price && Number(current.old_price) <= Number(current.price) && (
                        <p className="text-xs text-orange-600">
                          ⚠️ Stara cijena mora biti veća od nove cijene
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* KOLIČINA NA ZALIHI */}
                <div className="flex flex-col gap-4 col-span-1 md:col-span-2 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <MdInventory className="text-blue-600" size={20} />
                    </div>
                    <div className="flex-1">
                      <Label htmlFor="inventory_count" className="flex items-center gap-2 text-base font-semibold text-gray-800">
                        Količina na zalihi
                      </Label>
                      <p className="text-sm text-gray-500">
                        Ostavite prazno ako prodajete samo jedan artikal
                      </p>
                    </div>
                  </div>
                  <Input
                    type="number"
                    name="inventory_count"
                    id="inventory_count"
                    min={1}
                    placeholder="npr. 10"
                    value={current.inventory_count || ""}
                    onChange={handleField("inventory_count")}
                    className="bg-white border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                  />
                  {current.inventory_count && parseInt(current.inventory_count) > 1 && (
                    <p className="text-xs text-blue-600">
                      ✨ Odlično! Moći ćete pratiti prodaju i količinu na zalihi za ovaj oglas.
                    </p>
                  )}
                </div>
              </>
            )}

            {/* TELEFON */}
            <div className="flex flex-col gap-2">
              <Label
                htmlFor="phonenumber"
                className={`flex items-center gap-2 ${langId === defaultLangId ? "requiredInputLabel" : ""}`}
              >
                <MdPhoneIphone className="text-gray-500" size={16} />
                Broj telefona
              </Label>
              <div className="phone-input-container">
                <PhoneInput
                  country={process.env.NEXT_PUBLIC_DEFAULT_COUNTRY}
                  value={`${current.country_code}${current.contact}`}
                  onChange={(phone, data) => handlePhoneChange(phone, data)}
                  inputProps={{
                    name: "phonenumber",
                    id: "phonenumber",
                  }}
                  enableLongNumbers
                  containerClass="!w-full"
                  inputClass="!w-full !h-10 !text-sm !border-input !bg-background !ring-offset-background placeholder:!text-muted-foreground focus-visible:!outline-none focus-visible:!ring-2 focus-visible:!ring-ring focus-visible:!ring-offset-2 !rounded-md"
                  buttonClass="!border-input !rounded-l-md !bg-muted/50 hover:!bg-muted"
                  dropdownClass="!bg-background !text-foreground !border-input !shadow-md"
                />
              </div>
            </div>
          </div>

          {/* VIDEO LINK */}
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
              value={current.video_link || ""}
              onChange={handleField("video_link")}
              className="bg-white"
            />
          </div>

          {/* SLUG */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="slug" className="flex items-center gap-2">
              <FiLink className="text-gray-500" size={16} />
              Slug{" "}
              <span className="text-sm font-normal text-muted-foreground ml-1">
                (samo slova, brojevi i crtice)
              </span>
            </Label>
            <Input
              type="text"
              name="slug"
              id="slug"
              placeholder="npr. moj-oglas-123"
              onChange={handleField("slug")}
              value={current.slug || ""}
              className="bg-gray-50 text-gray-600"
            />
          </div>
        </div>
      )}

      {/* FOOTER DUGMAD */}
      <div className="sticky bottom-0 z-20 bg-white/95 backdrop-blur-md border-t -mx-6 -mb-6 p-6 mt-4 flex items-center justify-between shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] rounded-b-lg">
        <button
          className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 hover:border-gray-300 transition-all"
          onClick={() => router.back()}
        >
          Odustani
        </button>

        <button
          className="bg-primary hover:bg-primary/90 text-white px-8 py-2.5 rounded-xl text-lg font-medium shadow-sm flex items-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          onClick={handleDetailsSubmit}
        >
          Nastavi
          <MdChevronRight size={22} />
        </button>
      </div>

    </div>
  );
};

export default memo(EditComponentOne);
