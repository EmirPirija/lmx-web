import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
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
} from "@/components/Common/UnifiedIconPack";
import { toast } from "@/utils/toastBs";
import { HiOutlineUpload } from "@/components/Common/UnifiedIconPack";
import { MdOutlineAttachFile } from "@/components/Common/UnifiedIconPack";
import { 
  IoInformationCircleOutline, 
  IoShieldCheckmarkOutline, 
  IoAlertCircleOutline 
} from "@/components/Common/UnifiedIconPack";
import CustomLink from "@/components/Common/CustomLink";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { handleKeyDown, inpNum, t } from "@/utils";
import CustomImage from "@/components/Common/CustomImage";
import StickyActionButtons from "@/components/Common/StickyActionButtons";

// Emoji lista
const EMOJI_LIST = [
  "😀", "😃", "😄", "😁", "😅", "😂", "🤣", "😊", "😇", "🙂",
  "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋",
  "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🥸", "🤩",
  "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣",
  "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬",
  "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🤗",
  "🤔", "🤭", "🤫", "🤥", "😶", "😐", "😑", "😬", "🙄", "😯",
  "👍", "👎", "👌", "🤝", "🙏", "💪", "🎉", "🎊", "🎈", "🎁",
  "⭐", "✨", "💫", "🔥", "💯", "✅", "❌", "❗", "❓", "💡",
];

// ========================================
// RichTextarea Component
// ========================================
const RichTextarea = ({
  value = "",
  onChange,
  label,
  placeholder = "Unesite tekst...",
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

  // Calculate stats
  const charCount = value.length;
  const wordCount = value.trim() === "" ? 0 : value.trim().split(/\s+/).length;
  const isOverLimit = charCount > maxLength;
  const percentUsed = (charCount / maxLength) * 100;

  // Get color based on usage
  const getCounterColor = () => {
    if (isOverLimit) return "text-red-600";
    if (percentUsed > 90) return "text-orange-500";
    if (percentUsed > 75) return "text-yellow-600";
    return "text-gray-500";
  };

  // Insert markdown formatting
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

    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + selectedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // Insert emoji
  const insertEmoji = (emoji) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const newText =
      value.substring(0, start) + emoji + value.substring(start);

    onChange({ target: { value: newText, name } });
    setShowEmojiPicker(false);

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + emoji.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // Render markdown preview
  const renderMarkdown = (text) => {
    let html = text
      // Bold
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/__(.+?)__/g, "<strong>$1</strong>")
      // Italic
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/_(.+?)_/g, "<em>$1</em>")
      // Links
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-blue-600 hover:underline" target="_blank">$1</a>')
      // Line breaks
      .replace(/\n/g, "<br />");

    // Unordered lists
    html = html.replace(/^- (.+)$/gm, "<li>$1</li>");
    html = html.replace(/(<li>.*<\/li>)/s, "<ul class='list-disc ml-6 my-2'>$1</ul>");

    // Ordered lists
    html = html.replace(/^\d+\. (.+)$/gm, "<li>$1</li>");
    html = html.replace(/(<li>.*<\/li>)/s, "<ol class='list-decimal ml-6 my-2'>$1</ol>");

    return html;
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      {/* Label */}
      {label && (
        <Label
          htmlFor={id}
          className={required ? "requiredInputLabel" : ""}
        >
          {label}
        </Label>
      )}

      {/* Tabs for Write/Preview */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between border-b-2 border-gray-200">
          <TabsList className="bg-transparent border-0">
            <TabsTrigger
              value="write"
              className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none px-4 py-2"
            >
              <Type className="w-4 h-4 mr-2" />
              Tekst
            </TabsTrigger>
            <TabsTrigger
              value="preview"
              className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none px-4 py-2"
            >
              <Eye className="w-4 h-4 mr-2" />
              Pregled
            </TabsTrigger>
          </TabsList>

          {/* Toolbar - only show in write mode */}
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
                  const start = textarea.selectionStart;
                  const lineStart = value.lastIndexOf("\n", start - 1) + 1;
                  const newText =
                    value.substring(0, lineStart) +
                    "- " +
                    value.substring(lineStart);
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
                  const start = textarea.selectionStart;
                  const lineStart = value.lastIndexOf("\n", start - 1) + 1;
                  const newText =
                    value.substring(0, lineStart) +
                    "1. " +
                    value.substring(lineStart);
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

              {/* Emoji Picker */}
              <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Insert Emoji"
                  >
                    <Smile className="w-4 h-4 text-gray-600" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-2">
                  <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto">
                    {EMOJI_LIST.map((emoji, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => insertEmoji(emoji)}
                        className="text-2xl hover:bg-blue-50 rounded p-1 transition-colors"
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

        {/* Write Tab */}
        <TabsContent value="write" className="mt-0">
          <textarea
            ref={textareaRef}
            id={id}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="w-full resize-none rounded-xl border border-slate-300 p-4 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            style={{ minHeight: `${minHeight}px` }}
          />
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview" className="mt-0">
          <div
            className="prose max-w-none w-full rounded-xl border border-slate-300 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-100"
            style={{ minHeight: `${minHeight}px` }}
            dangerouslySetInnerHTML={{
              __html: value ? renderMarkdown(value) : "<p class='text-gray-400'>Nema sadržaja za pregled</p>",
            }}
          />
        </TabsContent>
      </Tabs>

      {/* Character Count */}
      <div className="flex justify-between items-center text-sm">
        <span className={getCounterColor()}>
          {charCount.toLocaleString()} / {maxLength.toLocaleString()} karaktera
        </span>
        <span className="text-gray-500">
          {wordCount.toLocaleString()} {wordCount === 1 ? "riječ" : "riječi"}
        </span>
      </div>

      {/* Warning when over limit */}
      {isOverLimit && (
        <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          <span className="font-bold">⚠️</span>
          <span>Prekoračili ste maksimalan broj karaktera</span>
        </div>
      )}

      {/* Usage bar */}
      <div className="relative h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${
            isOverLimit
              ? "bg-red-500"
              : percentUsed > 90
              ? "bg-orange-500"
              : percentUsed > 75
              ? "bg-yellow-500"
              : "bg-blue-500"
          }`}
          style={{
            width: `${Math.min(percentUsed, 100)}%`,
          }}
        />
      </div>

      {/* Markdown hint */}
      <p className="text-xs text-gray-500 mt-1">
        💡 Formatirajte tekst za profesionalniji izgled
      </p>
    </div>
  );
};

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
      <button
        type="button"
        onClick={handleOpen}
        className={`w-full touch-manipulation rounded-lg border px-4 py-3 bg-white cursor-pointer flex justify-between items-center transition-all duration-200 ${
          isDisabled
            ? "bg-gray-100 cursor-not-allowed opacity-60"
            : "hover:border-blue-400 hover:shadow-md focus:ring-2 focus:ring-blue-400"
        }`}
      >
        <div className="flex items-center gap-3">
          <span className={`${currentValue ? "font-medium" : "text-gray-500"}`}>
            {currentValue || getSelectPromptText(translated_name || name)}
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
      </button>

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
                    placeholder={`${"Pretraži"}...`}
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
                      <button
                        type="button"
                        key={`${option}-${idx}`}
                        onClick={() => handleSelect(option)}
                        className={`w-full px-4 py-3 cursor-pointer transition-all duration-200 flex items-center gap-3 text-left touch-manipulation ${
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
                      </button>
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
          <button
            type="button"
            key={uniqueId}
            onClick={() => onChange(option)}
            className={`relative w-full touch-manipulation cursor-pointer rounded-xl border p-3 text-left transition-colors duration-200 ${
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
          </button>
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
          <button
            type="button"
            key={uniqueId}
            onClick={() => handleToggle(value)}
            className={`relative w-full touch-manipulation cursor-pointer rounded-xl border p-3 text-left transition-colors duration-200 ${
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
          </button>
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
            Ažuriraj stanje oglasa tačno kako bi kupac odmah znao šta može očekivati.
          </p>
        </div>
      </div>

      <div className="mb-4 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-800 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200">
        <span className="font-semibold">LMX savjet:</span>{" "}
        {isAvailable
          ? "Aktivna dostupnost povećava šansu za brzi upit i dogovor."
          : "Ako artikl nije spreman, ostavi ga nedostupnim da smanjiš neuspješne kontakte."}
      </div>

      <div className="space-y-3">
        <ToggleRow
          enabled={isAvailable}
          onToggle={() => setIsAvailable(!isAvailable)}
          activeLabel="Artikal je odmah dostupan"
          inactiveLabel="Artikal trenutno nije odmah dostupan"
          helper="Kupac vidi može li odmah organizovati preuzimanje."
        />
        <ToggleRow
          enabled={isExchange}
          onToggle={() => setIsExchange(!isExchange)}
          activeLabel="Prihvatam zamjenu"
          inactiveLabel="Ne želim zamjenu"
          helper="Uključi samo ako stvarno želiš razmatrati razmjenu."
        />
      </div>
    </div>
  );
};

const getSelectPromptText = (label) => {
  const cleanLabel = String(label || "").trim();
  if (!cleanLabel) return "Odaberi vrijednost";
  return `Odaberi vrijednost (${cleanLabel})`;
};

const isFieldValueFilled = (field, value) => {
  const fieldType = String(field?.type || "").toLowerCase();

  if (fieldType === "checkbox") {
    return Array.isArray(value) ? value.length > 0 : Boolean(value);
  }

  if (fieldType === "fileinput") {
    if (value instanceof File || value instanceof Blob) return true;
    return Boolean(String(value || "").trim());
  }

  return Boolean(String(value ?? "").trim());
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
            LMX povezuje kupca i prodavača, ali nije ugovorna strana u kupoprodaji. Dogovor o plaćanju, isporuci i
            eventualnim reklamacijama je između korisnika.
          </p>
        </div>
      </div>

      <div className="mb-4 rounded-xl border border-amber-200 bg-white/90 px-3 py-3 text-xs text-slate-600 dark:border-amber-500/25 dark:bg-slate-900/70 dark:text-slate-300">
        <p className="mb-2 font-semibold text-amber-800 dark:text-amber-300">Praktični sigurnosni savjeti:</p>
        <ul className="space-y-1">
          <li>• Primopredaju dogovaraj na javnoj lokaciji.</li>
          <li>• Provjeri artikal prije finalne isplate.</li>
          <li>• Ne šalji novac unaprijed bez validne provjere.</li>
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
          Potvrđujem da razumijem da je LMX posredni oglasni servis te da odgovornost za kupoprodaju ostaje između
          prodavača i kupca.
        </span>
      </button>
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
  isCompleted,
  sectionRef,
}) => {
  return (
    <div ref={sectionRef} className="lmx-guided-accordion overflow-visible rounded-2xl border border-slate-200 bg-white/95 shadow-sm dark:border-slate-700 dark:bg-slate-900/90">
      {/* Header */}
      <button
        type="button"
        onClick={onToggle}
        className={`flex w-full touch-manipulation cursor-pointer items-center justify-between p-4 text-left transition-colors duration-200 sm:p-5 ${
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
      </button>

      {/* Content */}
      {isOpen && (
        <div className="lmx-guided-accordion-content bg-white p-4 dark:bg-slate-900/90 sm:p-5">
          {children}
        </div>
      )}
    </div>
  );
};

// ============================================
// MAIN COMPONENT TWO (EDIT)
// ============================================

const EditComponentTwo = ({
  customFields,
  setExtraDetails,
  handleGoBack,
  filePreviews,
  setFilePreviews,
  submitExtraDetails,
  currentExtraDetails,
  langId,
  defaultLangId,
  isAvailable: isAvailableProp,        // Renamed prop
  setIsAvailable: setIsAvailableProp,  // Renamed prop
  isExchange: isExchangeProp,
  setIsExchange: setIsExchangeProp,
}) => {
  // Accordion states
  const [requiredOpen, setRequiredOpen] = useState(true);
  const [optionalOpen, setOptionalOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [attemptedNext, setAttemptedNext] = useState(false);
  const [highlightedFieldId, setHighlightedFieldId] = useState("");
  const requiredSectionRef = useRef(null);
  const optionalSectionRef = useRef(null);
  const termsSectionRef = useRef(null);
  const fieldRefs = useRef({});
  
  // Local state for edit flow
  const [agreedToTerms, setAgreedToTerms] = useState(true);
  const [isAvailable, setIsAvailable] = useState(isAvailableProp || false);
  const [isExchange, setIsExchange] = useState(isExchangeProp || false);

  // Sync local state with prop when it changes
  useEffect(() => {
    if (isAvailableProp !== undefined) {
      setIsAvailable(isAvailableProp);
    }
  }, [isAvailableProp]);

  useEffect(() => {
    if (isExchangeProp !== undefined) {
      setIsExchange(isExchangeProp);
    }
  }, [isExchangeProp]);

  // Sync prop with local state when local state changes
  useEffect(() => {
    if (setIsAvailableProp) {
      setIsAvailableProp(isAvailable);
    }
  }, [isAvailable, setIsAvailableProp]);

  useEffect(() => {
    if (setIsExchangeProp) {
      setIsExchangeProp(isExchange);
    }
  }, [isExchange, setIsExchangeProp]);

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
        toast.error("Podržano: JPG, JPEG, SVG, PNG i PDF");
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
              step="any"    
              inputMode="decimal"
              placeholder={`Unesite ${translated_name || name}`}
              {...inputProps}
              onKeyDown={(e) => handleKeyDown(e, max_length)}
              onKeyPress={(e) => inpNum(e)}
              className="rounded-xl border border-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
            {max_length && (
              <span className="self-end text-sm text-muted-foreground mt-1">
                {`${currentExtraDetails[id]?.length ?? 0}/${max_length}`}
              </span>
            )}
          </div>
        );
      }

      case "textbox": {
        return (
          <RichTextarea
            id={id}
            name={id}
            value={currentExtraDetails[id] || ""}
            onChange={(e) => handleChange(id, e.target.value)}
            placeholder={`Unesite ${translated_name || name}`}
            maxLength={max_length || 7000}
            minHeight={120}
            required={!!is_required}
          />
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
            <label htmlFor={id} className="flex gap-2 items-center cursor-pointer">
              <div className="rounded-xl border border-slate-300 px-3 py-2 transition-all hover:border-primary/50 hover:shadow-sm dark:border-slate-700 dark:hover:border-primary/60">
                <HiOutlineUpload size={24} fontWeight="400" className="text-gray-600" />
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
                        className="text-blue-600 hover:underline"
                      >
                        Pogledaj PDF
                      </CustomLink>
                    </>
                  ) : (
                    <CustomImage
                      src={fileUrl}
                      alt="Preview"
                      className="h-12 w-12 rounded-lg border border-slate-300 object-cover dark:border-slate-700"
                      height={48}
                      width={48}
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
  const missingRequiredFields = useMemo(
    () =>
      sortedRequiredFields.filter(
        (field) => !isFieldValueFilled(field, currentExtraDetails?.[field?.id]),
      ),
    [sortedRequiredFields, currentExtraDetails],
  );
  const requiredFieldsCompleted = useMemo(
    () =>
      sortedRequiredFields.every((field) =>
        isFieldValueFilled(field, currentExtraDetails?.[field?.id]),
      ),
    [sortedRequiredFields, currentExtraDetails],
  );
  const missingRequiredCount = missingRequiredFields.length;

  const scrollToSection = (targetRef) => {
    if (typeof window === "undefined" || !targetRef?.current) return;
    const prefersReducedMotion =
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
    targetRef.current.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start",
      inline: "nearest",
    });
  };

  const focusFieldById = useCallback((fieldId) => {
    if (!fieldId || typeof window === "undefined") return;
    const target = fieldRefs.current?.[fieldId];
    if (!target) return;

    const prefersReducedMotion =
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
    setHighlightedFieldId(fieldId);

    target.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "center",
      inline: "nearest",
    });

    window.setTimeout(() => {
      const focusable = target.querySelector(
        "input, textarea, select, button, [role='combobox'], [tabindex]:not([tabindex='-1'])",
      );
      focusable?.focus?.({ preventScroll: true });
    }, prefersReducedMotion ? 0 : 180);

    window.setTimeout(() => {
      setHighlightedFieldId((current) => (current === fieldId ? "" : current));
    }, 1700);
  }, []);

  useEffect(() => {
    if (!requiredFieldsCompleted || !requiredOpen) return;

    if (sortedOptionalFields.length > 0) {
      setRequiredOpen(false);
      setOptionalOpen(true);
      requestAnimationFrame(() => scrollToSection(optionalSectionRef));
      return;
    }

    setRequiredOpen(false);
    setTermsOpen(true);
    requestAnimationFrame(() => scrollToSection(termsSectionRef));
  }, [requiredFieldsCompleted, requiredOpen, sortedOptionalFields.length]);

  useEffect(() => {
    if (attemptedNext && missingRequiredCount === 0) {
      setAttemptedNext(false);
    }
  }, [attemptedNext, missingRequiredCount]);

  const handleNext = () => {
    setAttemptedNext(true);
    if (!requiredFieldsCompleted) {
      const firstMissingField = missingRequiredFields[0];
      toast.error(
        firstMissingField
          ? `Popuni obavezno polje: ${firstMissingField?.translated_name || firstMissingField?.name}`
          : "Popuni sva obavezna polja prije nastavka.",
      );
      setRequiredOpen(true);
      setOptionalOpen(false);
      setTermsOpen(false);
      requestAnimationFrame(() => {
        scrollToSection(requiredSectionRef);
        if (firstMissingField?.id) {
          window.setTimeout(() => focusFieldById(firstMissingField.id), 160);
        }
      });
      return;
    }

    if (!agreedToTerms) {
      toast.error("Molimo prihvatite uslove korištenja");
      setTermsOpen(true);
      requestAnimationFrame(() => scrollToSection(termsSectionRef));
      return;
    }
    setAttemptedNext(false);
    submitExtraDetails();
  };

  const renderFieldGroup = (fields) => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map((field) => {
          const isFullWidth = field.type === "checkbox" || field.type === "radio";

          return (
            <div
              ref={(node) => {
                if (node) fieldRefs.current[field?.id] = node;
                else delete fieldRefs.current[field?.id];
              }}
              data-field-id={field?.id}
              className={`flex flex-col w-full gap-2 transition-all duration-300 ${
                isFullWidth ? "md:col-span-2" : ""
              } ${
                highlightedFieldId === field?.id
                  ? "-m-2 rounded-xl border border-[#0ab6af]/60 bg-[#0ab6af]/5 p-2"
                  : ""
              }`}
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
    <div className="flex flex-col gap-4 pb-24 dark:[&_.bg-white]:bg-slate-900 dark:[&_.bg-gray-50]:bg-slate-800/70 dark:[&_.bg-gray-100]:bg-slate-800 dark:[&_.bg-gray-200]:bg-slate-700 dark:[&_.bg-gray-300]:bg-slate-600 dark:[&_.text-gray-900]:text-slate-100 dark:[&_.text-gray-800]:text-slate-100 dark:[&_.text-gray-700]:text-slate-200 dark:[&_.text-gray-600]:text-slate-300 dark:[&_.text-gray-500]:text-slate-400 dark:[&_.text-gray-400]:text-slate-500 dark:[&_.border-gray-100]:border-slate-700 dark:[&_.border-gray-200]:border-slate-700 dark:[&_.border-gray-300]:border-slate-600 dark:[&_.bg-blue-50]:bg-blue-500/15 dark:[&_.bg-blue-100]:bg-blue-500/20 dark:[&_.border-blue-100]:border-blue-500/30 dark:[&_.bg-amber-50]:bg-amber-500/10">
      {/* Required Fields Section */}
      {sortedRequiredFields.length > 0 && (
        <AccordionSection
          sectionRef={requiredSectionRef}
          title="Obavezna polja"
          subtitle={`${sortedRequiredFields.length} ${sortedRequiredFields.length === 1 ? 'polje' : 'polja'} za popunjavanje`}
          icon={<span className="text-xl font-bold">1</span>}
          isOpen={requiredOpen}
          onToggle={() => {
            const next = !requiredOpen;
            setRequiredOpen(next);
            if (next) requestAnimationFrame(() => scrollToSection(requiredSectionRef));
          }}
          badge="required"
        >
          {attemptedNext && missingRequiredCount > 0 ? (
            <div className="mb-4 rounded-xl border border-[#0ab6af]/30 bg-[#0ab6af]/10 p-3">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-100">
                Nedostaje još {missingRequiredCount} obaveznih polja. Dodirni polje da te odvede direktno.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {missingRequiredFields.slice(0, 8).map((field) => (
                  <button
                    key={`missing-${field?.id}`}
                    type="button"
                    onClick={() => focusFieldById(field?.id)}
                    className="rounded-full border border-[#0ab6af]/40 bg-white/85 px-2.5 py-1 text-[11px] font-semibold text-[#0ab6af] transition-colors hover:bg-[#0ab6af]/10 dark:bg-slate-900/70"
                  >
                    {field?.translated_name || field?.name}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          {renderFieldGroup(sortedRequiredFields)}
        </AccordionSection>
      )}

      {/* Optional Fields Section */}
      {sortedOptionalFields.length > 0 && (
        <AccordionSection
          sectionRef={optionalSectionRef}
          title="Opcionalna polja"
          subtitle={`${sortedOptionalFields.length} dodatnih informacija`}
          icon={<span className="text-xl font-bold">2</span>}
          isOpen={optionalOpen}
          onToggle={() => {
            const next = !optionalOpen;
            setOptionalOpen(next);
            if (next) requestAnimationFrame(() => scrollToSection(optionalSectionRef));
          }}
          badge="optional"
        >
          {renderFieldGroup(sortedOptionalFields)}
        </AccordionSection>
      )}
      
      {/* Availability & Terms Section */}
      <AccordionSection
        sectionRef={termsSectionRef}
        title="Dostupnost i uvjeti"
        subtitle="Jasno označi stanje oglasa i potvrdi sigurnosnu napomenu"
        icon={<span className="text-xl font-bold">3</span>}
        isOpen={termsOpen}
        onToggle={() => {
          const next = !termsOpen;
          setTermsOpen(next);
          if (next) requestAnimationFrame(() => scrollToSection(termsSectionRef));
        }}
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
      />
    </div>
  );
};

export default EditComponentTwo;
