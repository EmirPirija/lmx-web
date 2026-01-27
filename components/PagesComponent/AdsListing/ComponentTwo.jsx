"use client";

import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Link,
  Smile,
  Eye,
  Type,
} from "lucide-react";
import {
  getCurrencyPosition,
  getCurrencySymbol,
} from "@/redux/reducer/settingSlice";
import { generateSlug } from "@/utils";
import PhoneInput from "react-phone-input-2";
import { useSelector } from "react-redux";

// Emoji lista
const EMOJI_LIST = [
  "😀","😃","😄","😁","😅","😂","🤣","😊","😇","🙂",
  "🙃","😉","😌","😍","🥰","😘","😗","😙","😚","😋",
  "😛","😝","😜","🤪","🤨","🧐","🤓","😎","🥸","🤩",
  "🥳","😏","😒","😞","😔","😟","😕","🙁","☹️","😣",
  "😖","😫","😩","🥺","😢","😭","😤","😠","😡","🤬",
  "🤯","😳","🥵","🥶","😱","😨","😰","😥","😓","🤗",
  "🤔","🤭","🤫","🤥","😶","😐","😑","😬","🙄","😯",
  "👍","👎","👌","🤝","🙏","💪","🎉","🎊","🎈","🎁",
  "⭐","✨","💫","🔥","💯","✅","❌","❗","❓","💡",
];

// ============================================
// ACCORDION SECTION (same vibe as ComponentThree)
// ============================================
const AccordionSection = ({
  title,
  subtitle,
  isOpen,
  onToggle,
  badge, // "required" | "optional"
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
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {isOpen && <div className="p-4 sm:p-6 bg-white">{children}</div>}
    </div>
  );
};

// ========================================
// RichTextarea Component (Inline)
// ========================================
const RichTextarea = ({
  value = "",
  onChange,
  label,
  placeholder = "Unesite opis...",
  maxLength = 7000,
  minHeight = 120,
  required = false,
  id = "rich-textarea",
  name = "description",
}) => {
  const [activeTab, setActiveTab] = useState("write");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.max(
        textareaRef.current.scrollHeight,
        minHeight
      )}px`;
    }
  }, [value, minHeight]);

  const charCount = value.length;
  const wordCount = value.trim() === "" ? 0 : value.trim().split(/\s+/).length;
  const isOverLimit = charCount > maxLength;
  const percentUsed = (charCount / maxLength) * 100;

  const getCounterColor = () => {
    if (isOverLimit) return "text-red-600";
    if (percentUsed > 90) return "text-orange-500";
    if (percentUsed > 75) return "text-yellow-600";
    return "text-gray-500";
  };

  const insertMarkdown = (before, after = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const newText =
      value.substring(0, start) +
      before +
      selectedText +
      after +
      value.substring(end);

    onChange({ target: { value: newText, name } });

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + selectedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const insertEmoji = (emoji) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const newText = value.substring(0, start) + emoji + value.substring(start);

    onChange({ target: { value: newText, name } });
    setShowEmojiPicker(false);

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + emoji.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // lightweight preview
  const renderMarkdown = (text) => {
    let html = text
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/__(.+?)__/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/_(.+?)_/g, "<em>$1</em>")
      .replace(
        /\[(.+?)\]\((.+?)\)/g,
        '<a href="$2" class="text-blue-600 hover:underline" target="_blank" rel="noreferrer">$1</a>'
      )
      .replace(/\n/g, "<br />");

    // unordered list
    html = html.replace(/^- (.+)$/gm, "<li>$1</li>");
    html = html.replace(
      /(<li>.*<\/li>)/s,
      "<ul class='list-disc ml-6 my-2'>$1</ul>"
    );

    // ordered list
    html = html.replace(/^\d+\. (.+)$/gm, "<li>$1</li>");
    html = html.replace(
      /(<li>.*<\/li>)/s,
      "<ol class='list-decimal ml-6 my-2'>$1</ol>"
    );

    return html;
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      {label && (
        <Label htmlFor={id} className={required ? "requiredInputLabel" : ""}>
          {label}
        </Label>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between border-b-2 border-gray-200">
          <TabsList className="bg-transparent border-0">
            <TabsTrigger
              value="write"
              className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none px-4 py-2"
            >
              <Type className="w-4 h-4 mr-2" />
              Opis
            </TabsTrigger>
            <TabsTrigger
              value="preview"
              className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none px-4 py-2"
            >
              <Eye className="w-4 h-4 mr-2" />
              Pregled
            </TabsTrigger>
          </TabsList>

          {activeTab === "write" && (
            <div className="flex items-center gap-1 p-2">
              <button
                type="button"
                onClick={() => insertMarkdown("**", "**")}
                className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                title="Bold"
              >
                <Bold className="w-4 h-4 text-gray-600" />
              </button>

              <button
                type="button"
                onClick={() => insertMarkdown("*", "*")}
                className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                title="Italic"
              >
                <Italic className="w-4 h-4 text-gray-600" />
              </button>

              <button
                type="button"
                onClick={() => {
                  const textarea = textareaRef.current;
                  if (!textarea) return;
                  const start = textarea.selectionStart;
                  const lineStart = value.lastIndexOf("\n", start - 1) + 1;
                  const newText =
                    value.substring(0, lineStart) + "- " + value.substring(lineStart);
                  onChange({ target: { value: newText, name } });
                }}
                className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                title="Bullet List"
              >
                <List className="w-4 h-4 text-gray-600" />
              </button>

              <button
                type="button"
                onClick={() => {
                  const textarea = textareaRef.current;
                  if (!textarea) return;
                  const start = textarea.selectionStart;
                  const lineStart = value.lastIndexOf("\n", start - 1) + 1;
                  const newText =
                    value.substring(0, lineStart) + "1. " + value.substring(lineStart);
                  onChange({ target: { value: newText, name } });
                }}
                className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                title="Numbered List"
              >
                <ListOrdered className="w-4 h-4 text-gray-600" />
              </button>

              <button
                type="button"
                onClick={() => insertMarkdown("[", "](url)")}
                className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                title="Insert Link"
              >
                <Link className="w-4 h-4 text-gray-600" />
              </button>

              <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Emoji"
                  >
                    <Smile className="w-4 h-4 text-gray-600" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-2">
                  <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto">
                    {EMOJI_LIST.map((emoji, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => insertEmoji(emoji)}
                        className="text-2xl hover:bg-gray-100 rounded p-1 transition-colors"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>

        <TabsContent value="write" className="mt-0">
          <textarea
            ref={textareaRef}
            id={id}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className={`w-full border-2 rounded-xl px-4 py-3 outline-none resize-none transition-colors focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              isOverLimit ? "border-red-500" : "border-gray-200"
            }`}
            style={{ minHeight: `${minHeight}px` }}
          />
        </TabsContent>

        <TabsContent value="preview" className="mt-0">
          <div
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 min-h-[120px] bg-gray-50 prose prose-sm max-w-none"
            style={{ minHeight: `${minHeight}px` }}
          >
            {value ? (
              <div dangerouslySetInnerHTML={{ __html: renderMarkdown(value) }} />
            ) : (
              <p className="text-gray-400 italic">Ništa za pregled...</p>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex items-center justify-between text-sm">
        <div className="text-gray-600">
          <span className="font-medium">{wordCount}</span>{" "}
          {wordCount === 1 ? "riječ" : "riječi"}
        </div>
        <div className={`font-medium ${getCounterColor()}`}>
          {charCount} / {maxLength} karaktera
          {isOverLimit && (
            <span className="ml-2 text-xs">
              ({charCount - maxLength} preko dozvoljenog)
            </span>
          )}
        </div>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${
            isOverLimit
              ? "bg-red-500"
              : percentUsed > 90
              ? "bg-orange-500"
              : percentUsed > 75
              ? "bg-yellow-500"
              : "bg-green-500"
          }`}
          style={{ width: `${Math.min(percentUsed, 100)}%` }}
        />
      </div>

      <p className="text-xs text-gray-500 mt-1">
        💡 Kratki paragrafi i liste čine opis čitljivijim.
      </p>
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
  isPriceOptional,
  defaultLangId,
}) => {
  const currencyPosition = useSelector(getCurrencyPosition);
  const currencySymbol = useSelector(getCurrencySymbol);

  const placeholderLabel =
    currencyPosition === "right" ? `${currencySymbol}` : `${currencySymbol}`;

  // Accordion states
  const [basicOpen, setBasicOpen] = useState(true);
  const [priceOpen, setPriceOpen] = useState(false);
  const [stockOpen, setStockOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [mediaOpen, setMediaOpen] = useState(false);

  const isDefaultLang = langId === defaultLangId;

  const handleField = (field) => (e) => {
    const value = e.target.value;

    setTranslations((prev) => {
      const updatedLangData = {
        ...prev[langId],
        [field]: value,
      };

      // ✅ still generate slug behind the scenes (no slug input in UI)
      if (field === "name" && langId === defaultLangId) {
        updatedLangData.slug = generateSlug(value);
      }

      return {
        ...prev,
        [langId]: updatedLangData,
      };
    });
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

  return (
    <div className="flex flex-col w-full gap-4 pb-24">
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
              className="border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <RichTextarea
            id="description"
            name="description"
            value={current.description || ""}
            onChange={handleField("description")}
            label="Opis"
            placeholder="Opišite vaš artikal detaljno..."
            maxLength={7000}
            minHeight={140}
            required={isDefaultLang}
          />
        </div>
      </AccordionSection>

      {/* PRICE / SALARY (default lang only) */}
      {isDefaultLang && (
        <AccordionSection
          title={is_job_category ? "Plata" : "Cijena"}
          subtitle={is_job_category ? "Minimalna i maksimalna plata" : "Unesite cijenu (ili ostavite prazno ako je dozvoljeno)"}
          isOpen={priceOpen}
          onToggle={() => setPriceOpen((v) => !v)}
          badge={!is_job_category && isPriceOptional ? "optional" : "required"}
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
                  className="border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Label
                htmlFor="price"
                className={!isPriceOptional ? "requiredInputLabel" : ""}
              >
                Cijena
              </Label>
              <Input
                type="number"
                name="price"
                id="price"
                min={0}
                placeholder={placeholderLabel}
                value={current.price || ""}
                onChange={handleField("price")}
                className="border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {isPriceOptional && (
                <p className="text-xs text-gray-500">
                  Može ostati prazno ako je dozvoljeno “Na upit”.
                </p>
              )}
            </div>
          )}
        </AccordionSection>
      )}

      {/* STOCK (default lang only) */}
      {isDefaultLang && (
        <AccordionSection
          title="Zalihe"
          subtitle="Unesite samo ako imate više komada"
          isOpen={stockOpen}
          onToggle={() => setStockOpen((v) => !v)}
          badge="optional"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="inventory_count" className="text-base font-semibold text-gray-800">
              Količina na zalihi
            </Label>
            <p className="text-sm text-gray-600">
              Ostavite prazno ako prodajete samo jedan artikal.
            </p>

            <Input
              type="number"
              name="inventory_count"
              id="inventory_count"
              min={1}
              placeholder="npr. 10"
              value={current.inventory_count || ""}
              onChange={handleField("inventory_count")}
              className="border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            {current.inventory_count && parseInt(current.inventory_count, 10) > 1 && (
              <p className="text-xs text-blue-600 mt-1">
                ✨ Moći ćete pratiti prodaju i zalihe za ovaj oglas!
              </p>
            )}
          </div>
        </AccordionSection>
      )}

      {/* CONTACT (default lang only) */}
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
              enableLongNumbers
              inputClass="!border-2 !border-gray-200 !rounded-xl focus:!ring-2 focus:!ring-blue-500"
            />
          </div>
        </AccordionSection>
      )}

      {/* MEDIA (default lang only) */}
      {isDefaultLang && (
        <AccordionSection
          title="Multimedija"
          subtitle="Opcionalno: video link"
          isOpen={mediaOpen}
          onToggle={() => setMediaOpen((v) => !v)}
          badge="optional"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="videoLink">Video link</Label>
            <Input
              type="text"
              name="videoLink"
              id="videoLink"
              placeholder="Dodajte YouTube ili drugi video link"
              value={current.video_link || ""}
              onChange={handleField("video_link")}
              className="border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </AccordionSection>
      )}

      {/* Sticky Action Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-2xl z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4 flex justify-between sm:justify-end gap-3">
          <button
            type="button"
            className="bg-black text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg text-base sm:text-lg font-medium hover:bg-gray-800 transition-colors shadow-md flex-1 sm:flex-none"
            onClick={handleDeatilsBack}
          >
            Nazad
          </button>
          <button
            type="button"
            className="bg-primary text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg text-base sm:text-lg font-medium hover:bg-primary/90 transition-colors shadow-md flex-1 sm:flex-none"
            onClick={handleDetailsSubmit}
          >
            Naprijed
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComponentTwo;
