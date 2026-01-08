import { memo, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  getCurrencyPosition,
  getCurrencySymbol,
} from "@/redux/reducer/settingSlice";
import { generateSlug, t } from "@/utils";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css"; 
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation"; // Dodano za Nazad dugme

// Ikone
import { MdOutlineTitle, MdAttachMoney, MdLink, MdPhoneIphone, MdChevronRight } from "react-icons/md";
import { BsTextParagraph } from "react-icons/bs";
import { FiLink } from "react-icons/fi";

const EditComponentOne = ({
  setTranslations,
  current,
  langId,
  defaultLangId,
  handleDetailsSubmit,
  is_job_category,
  isPriceOptional,
}) => {
  const router = useRouter(); // Za navigaciju nazad
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
      
      {/* TITLE INPUT */}
      <div className="flex flex-col gap-2">
        <Label
          htmlFor="title"
          className={`flex items-center gap-2 ${langId === defaultLangId ? "requiredInputLabel" : ""}`}
        >
          <MdOutlineTitle className="text-gray-500" size={16} />
          {t("title")}
        </Label>
        <Input
          type="text"
          name="title"
          id="title"
          placeholder={t("enterTitle")}
          value={current.name || ""}
          onChange={handleField("name")}
          className="bg-white"
        />
      </div>

      {/* DESCRIPTION TEXTAREA */}
      <div className="flex flex-col gap-2">
        <Label
          htmlFor="description"
          className={`flex items-center gap-2 ${langId === defaultLangId ? "requiredInputLabel" : ""}`}
        >
          <BsTextParagraph className="text-gray-500" size={16} />
          {t("description")}
        </Label>
        <Textarea
          name="description"
          id="description"
          placeholder={t("enterDescription")}
          value={current.description || ""}
          onChange={handleField("description")}
          className="min-h-[120px] bg-white resize-y"
        />
      </div>

      {/* PRICE / SALARY & PHONE SECTION */}
      {langId === defaultLangId && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* PRICE OR SALARY */}
            {is_job_category ? (
              <>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="min_salary" className="flex items-center gap-2">
                    <MdAttachMoney className="text-gray-500" size={16} />
                    {t("salaryMin")}
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
                    {t("salaryMax")}
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
              <div className="flex flex-col gap-2">
                <Label
                  htmlFor="price"
                  className={`flex items-center gap-2 ${!isPriceOptional && langId === defaultLangId ? "requiredInputLabel" : ""}`}
                >
                  <MdAttachMoney className="text-gray-500" size={16} />
                  {t("price")}
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
            )}

            {/* PHONE INPUT */}
            <div className="flex flex-col gap-2">
              <Label
                htmlFor="phonenumber"
                className={`flex items-center gap-2 ${langId === defaultLangId ? "requiredInputLabel" : ""}`}
              >
                <MdPhoneIphone className="text-gray-500" size={16} />
                {t("phoneNumber")}
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
              {t("videoLink")}
            </Label>
            <Input
              type="text"
              name="videoLink"
              id="videoLink"
              placeholder={t("enterAdditionalLinks")}
              value={current.video_link || ""}
              onChange={handleField("video_link")}
              className="bg-white"
            />
          </div>

          {/* SLUG INPUT */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="slug" className="flex items-center gap-2">
              <FiLink className="text-gray-500" size={16} />
              {t("slug")}{" "}
              <span className="text-sm font-normal text-muted-foreground ml-1">
                ({t("allowedSlug")})
              </span>
            </Label>
            <Input
              type="text"
              name="slug"
              id="slug"
              placeholder={t("enterSlug")}
              onChange={handleField("slug")}
              value={current.slug || ""}
              className="bg-gray-50 text-gray-600"
            />
          </div>
        </div>
      )}

      {/* 🚀 STICKY FOOTER ACTION BUTTONS */}
      <div className="sticky bottom-0 z-20 bg-white/95 backdrop-blur-md border-t -mx-6 -mb-6 p-6 mt-4 flex items-center justify-between shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] rounded-b-lg">
        <button
          className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 hover:border-gray-300 transition-all"
          onClick={() => router.back()} // Vraća nazad (npr. na listu oglasa)
        >
          {t("cancel")}
        </button>

        <button
          className="bg-primary hover:bg-primary/90 text-white px-8 py-2.5 rounded-xl text-lg font-medium shadow-sm flex items-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          onClick={handleDetailsSubmit}
        >
          {t("next")}
          <MdChevronRight size={22} />
        </button>
      </div>

    </div>
  );
};

export default memo(EditComponentOne);