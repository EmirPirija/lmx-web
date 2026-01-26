"use client";

import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

import { useNavigate } from "@/components/Common/useNavigate";
import { useSavedSearches } from "@/hooks/useSavedSearches";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  IconBookmark,
  IconBookmarkFilled,
  IconChevronDown,
  IconStar,
  IconStarFilled,
  IconSettings,
  IconExternalLink,
  IconX,
  IconCheck,
  IconTrash,
  IconEdit,
  IconSearch,
  IconSparkles,
} from "@tabler/icons-react";

// ═══════════════════════════════════════════════════════════════════
// HOOK: Click outside detection
// ═══════════════════════════════════════════════════════════════════

const useClickOutside = (ref, handler) => {
  useEffect(() => {
    const listener = (event) => {
      if (!ref.current || ref.current.contains(event.target)) return;
      handler(event);
    };
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler]);
};

// ═══════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

const normalizeQueryString = (sp) => {
  const params = new URLSearchParams(sp);
  params.delete("lang");
  params.delete("page");

  const entries = Array.from(params.entries()).sort(([a], [b]) =>
    a.localeCompare(b)
  );

  const normalized = new URLSearchParams();
  for (const [k, v] of entries) normalized.append(k, v);

  return normalized.toString();
};

const HIDE_KEYS = new Set(["lang", "page"]);

const prettifyKey = (k) => {
  const key = String(k).toLowerCase();
  if (key === "query" || key === "q" || key === "search") return "Pretraga";
  return String(k)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

const formatSavedSearchQuery = (queryString) => {
  if (!queryString) return [];

  const params = new URLSearchParams(queryString);
  HIDE_KEYS.forEach((k) => params.delete(k));

  const entries = Array.from(params.entries())
    .filter(([k, v]) => k && v != null && String(v).trim() !== "")
    .sort(([a], [b]) => a.localeCompare(b));

  return entries.map(([k, v]) => ({
    key: prettifyKey(decodeURIComponent(k)),
    value: decodeURIComponent(String(v)).replace(/\+/g, " "),
  }));
};

// ═══════════════════════════════════════════════════════════════════
// DESKTOP DROPDOWN COMPONENT
// ═══════════════════════════════════════════════════════════════════

const DesktopDropdown = ({
  isOpen,
  onClose,
  savedSearches,
  isLoading,
  currentSaved,
  hasAnyRealParams,
  alreadySaved,
  onApply,
  onSaveClick,
  onManageClick,
}) => {
  const dropdownRef = useRef(null);
  useClickOutside(dropdownRef, onClose);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={dropdownRef}
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="absolute top-full left-0 mt-2 w-[340px] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50"
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <IconBookmark size={18} className="text-[#1A4B8C]" />
              Sačuvane pretrage
            </h3>
          </div>

          {/* Content */}
          <div className="max-h-[320px] overflow-y-auto">
            {isLoading ? (
              <div className="p-4 space-y-2">
                <div className="h-12 bg-gray-100 rounded-xl animate-pulse" />
                <div className="h-12 bg-gray-100 rounded-xl animate-pulse" />
              </div>
            ) : savedSearches.length === 0 ? (
              <div className="p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-[#1A4B8C]/10 to-[#00A19B]/10 flex items-center justify-center">
                  <IconSparkles size={24} className="text-[#1A4B8C]" />
                </div>
                <p className="text-sm text-gray-500">Nemaš sačuvanih pretraga</p>
              </div>
            ) : (
              <div className="p-2">
                {savedSearches.map((s) => {
                  const isActive = currentSaved?.id === s.id;
                  const pairs = formatSavedSearchQuery(s.query_string);

                  return (
                    <button
                      key={s.id}
                      onClick={() => {
                        onApply(s.id);
                        onClose();
                      }}
                      className={`
                        w-full text-left p-3 rounded-xl transition-all duration-150 group
                        ${isActive
                          ? "bg-gradient-to-r from-[#1A4B8C]/10 to-[#00A19B]/10 border-2 border-[#1A4B8C]/30"
                          : "hover:bg-gray-50 border-2 border-transparent"
                        }
                      `}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="font-medium text-gray-900 truncate flex items-center gap-2">
                          {isActive && (
                            <span className="w-5 h-5 rounded-full bg-[#1A4B8C] flex items-center justify-center">
                              <IconCheck size={12} className="text-white" strokeWidth={3} />
                            </span>
                          )}
                          {s.name}
                        </span>
                        <IconExternalLink
                          size={16}
                          className="text-gray-400 group-hover:text-[#1A4B8C] transition-colors shrink-0"
                        />
                      </div>

                      {pairs.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {pairs.slice(0, 3).map((p, idx) => (
                            <span
                              key={`${p.key}-${idx}`}
                              className="inline-flex text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full"
                            >
                              {p.key}: {p.value.slice(0, 15)}{p.value.length > 15 ? "..." : ""}
                            </span>
                          ))}
                          {pairs.length > 3 && (
                            <span className="text-[10px] text-[#F7941D] font-medium">
                              +{pairs.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div className="p-2 border-t border-gray-100 bg-gray-50 space-y-1">
            {hasAnyRealParams && !alreadySaved && (
              <button
                onClick={() => {
                  onSaveClick();
                  onClose();
                }}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-[#F7941D] hover:bg-[#F7941D]/10 transition-colors"
              >
                <IconStarFilled size={16} />
                Sačuvaj trenutnu pretragu
              </button>
            )}
            <button
              onClick={() => {
                onManageClick();
                onClose();
              }}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-200 transition-colors"
            >
              <IconSettings size={16} />
              Upravljaj pretragama
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ═══════════════════════════════════════════════════════════════════
// MOBILE BOTTOM SHEET COMPONENT
// ═══════════════════════════════════════════════════════════════════

const BottomSheet = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 md:hidden"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
          >
            <div className="bg-white rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col">
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 bg-gray-300 rounded-full" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 pb-3 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
                <button
                  onClick={onClose}
                  className="p-2 -mr-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
                >
                  <IconX size={20} className="text-gray-500" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4">
                {children}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// ═══════════════════════════════════════════════════════════════════
// SEARCH CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════

const SearchCard = ({
  search,
  isActive,
  onApply,
  onRename,
  onDelete,
  isManageMode = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(search.name || "");
  const [isDeleting, setIsDeleting] = useState(false);
  const pairs = formatSavedSearchQuery(search.query_string);

  const handleSaveRename = () => {
    if (editValue.trim()) {
      onRename(search.id, editValue.trim());
      setIsEditing(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    await onDelete(search.id);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: isDeleting ? 0 : 1, y: 0, scale: isDeleting ? 0.95 : 1 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      transition={{ duration: 0.2 }}
      className={`
        relative rounded-2xl border-2 p-4 transition-all duration-200
        ${isActive 
          ? "border-[#1A4B8C] bg-gradient-to-br from-[#1A4B8C]/5 to-[#00A19B]/5 shadow-lg shadow-[#1A4B8C]/10" 
          : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-md"
        }
      `}
    >
      {/* Active indicator */}
      {isActive && (
        <div className="absolute -top-1 -right-1">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1A4B8C] text-white shadow-lg">
            <IconCheck size={12} strokeWidth={3} />
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        {isEditing ? (
          <div className="flex-1 flex items-center gap-2">
            <Input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="h-9 text-sm font-medium"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleSaveRename()}
            />
            <button
              onClick={handleSaveRename}
              className="p-2 rounded-xl bg-[#00A19B] text-white hover:bg-[#00A19B]/90 transition-colors"
            >
              <IconCheck size={16} />
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setEditValue(search.name || "");
              }}
              className="p-2 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            >
              <IconX size={16} />
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 min-w-0">
              <div className={`p-1.5 rounded-lg ${isActive ? "bg-[#1A4B8C]/10" : "bg-gray-100"}`}>
                {isActive ? (
                  <IconBookmarkFilled size={16} className="text-[#1A4B8C]" />
                ) : (
                  <IconBookmark size={16} className="text-gray-500" />
                )}
              </div>
              <h3 className="font-semibold text-gray-900 truncate">{search.name}</h3>
            </div>

            {isManageMode && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 rounded-xl text-gray-400 hover:text-[#1A4B8C] hover:bg-[#1A4B8C]/10 transition-all"
                >
                  <IconEdit size={16} />
                </button>
                <button
                  onClick={handleDelete}
                  className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                >
                  <IconTrash size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Tags */}
      {pairs.length === 0 ? (
        <div className="text-xs text-gray-500 bg-gray-50 rounded-xl px-3 py-2">
          /ads (bez filtera)
        </div>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {pairs.slice(0, 4).map((p, idx) => (
            <span
              key={`${p.key}-${p.value}-${idx}`}
              title={`${p.key}: ${p.value}`}
              className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-[11px]"
            >
              <span className="font-semibold text-gray-700">{p.key}:</span>
              <span className="truncate max-w-[100px] text-gray-500">{p.value}</span>
            </span>
          ))}
          {pairs.length > 4 && (
            <span className="inline-flex items-center rounded-full bg-[#F7941D]/10 text-[#F7941D] px-2.5 py-1 text-[11px] font-medium">
              +{pairs.length - 4}
            </span>
          )}
        </div>
      )}

      {/* Apply button (non-manage mode) */}
      {!isManageMode && !isEditing && (
        <button
          onClick={() => onApply(search.id)}
          className={`
            mt-3 w-full py-2.5 rounded-xl text-sm font-medium transition-all duration-200
            ${isActive 
              ? "bg-[#1A4B8C] text-white shadow-lg shadow-[#1A4B8C]/20 hover:shadow-xl hover:shadow-[#1A4B8C]/30" 
              : "bg-gray-100 text-gray-700 hover:bg-[#1A4B8C] hover:text-white"
            }
          `}
        >
          {isActive ? "Trenutno aktivna" : "Primijeni"}
        </button>
      )}

      {/* Apply button (manage mode) */}
      {isManageMode && !isEditing && (
        <button
          onClick={() => onApply(search.id)}
          className="mt-3 w-full py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-[#1A4B8C] to-[#00A19B] text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
        >
          <IconExternalLink size={16} />
          Otvori pretragu
        </button>
      )}
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// SKELETON LOADER
// ═══════════════════════════════════════════════════════════════════

const SkeletonCard = () => (
  <div className="rounded-2xl border-2 border-gray-100 p-4 animate-pulse">
    <div className="flex items-center gap-2 mb-3">
      <div className="w-8 h-8 bg-gray-200 rounded-lg" />
      <div className="h-5 w-32 bg-gray-200 rounded-lg" />
    </div>
    <div className="flex gap-1.5">
      <div className="h-6 w-20 bg-gray-100 rounded-full" />
      <div className="h-6 w-24 bg-gray-100 rounded-full" />
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════
// EMPTY STATE
// ═══════════════════════════════════════════════════════════════════

const EmptyState = ({ onSave, canSave }) => (
  <div className="text-center py-8">
    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#1A4B8C]/10 to-[#00A19B]/10 flex items-center justify-center">
      <IconSparkles size={28} className="text-[#1A4B8C]" />
    </div>
    <h3 className="text-base font-semibold text-gray-900 mb-1">
      Nemaš sačuvanih pretraga
    </h3>
    <p className="text-sm text-gray-500 mb-4 max-w-[250px] mx-auto">
      Sačuvaj filtere koje koristiš često da brže pronađeš oglase
    </p>
    {canSave && (
      <button
        onClick={onSave}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#1A4B8C] to-[#00A19B] text-white text-sm font-medium shadow-lg hover:shadow-xl transition-all"
      >
        <IconStarFilled size={16} />
        Sačuvaj trenutnu
      </button>
    )}
  </div>
);

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

export default function SavedSearchControls() {
  const searchParams = useSearchParams();
  const { navigate } = useNavigate();

  const {
    savedSearches,
    isLoading,
    createSavedSearch,
    renameSavedSearch,
    deleteSavedSearch,
  } = useSavedSearches({ context: "ads" });

  // UI States
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSaveOpen, setIsSaveOpen] = useState(false);
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [naziv, setNaziv] = useState("");
  const triggerRef = useRef(null);

  const currentQueryString = useMemo(
    () => normalizeQueryString(searchParams),
    [searchParams]
  );

  const hasAnyRealParams = useMemo(
    () => currentQueryString.trim().length > 0,
    [currentQueryString]
  );

  const currentSaved = useMemo(() => {
    if (!currentQueryString) return null;
    return (
      savedSearches.find((s) => (s?.query_string || "") === currentQueryString) ||
      null
    );
  }, [savedSearches, currentQueryString]);

  const alreadySaved = !!currentSaved;

  const handleApply = useCallback(
    (id) => {
      const s = savedSearches.find((x) => String(x.id) === String(id));
      if (!s) return;

      const qs = s.query_string ? `?${s.query_string}` : "";
      navigate(`/ads${qs}`);
      setIsSheetOpen(false);
      setIsDropdownOpen(false);
      setIsManageOpen(false);
    },
    [savedSearches, navigate]
  );

  const handleSave = async () => {
    if (!hasAnyRealParams) {
      toast.error("Nemaš šta sačuvati — prvo promijeni filtere.");
      return;
    }
    const cleanName = naziv.trim();
    if (!cleanName) {
      toast.error("Upiši naziv pretrage.");
      return;
    }

    try {
      await createSavedSearch({
        name: cleanName,
        query_string: currentQueryString,
      });
      toast.success("Pretraga je sačuvana!");
      setNaziv("");
      setIsSaveOpen(false);
    } catch {
      toast.error("Nisam uspio sačuvati pretragu.");
    }
  };

  const handleRename = async (id, name) => {
    try {
      await renameSavedSearch({ id, name });
      toast.success("Pretraga je preimenovana.");
    } catch {
      toast.error("Nisam uspio preimenovati pretragu.");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteSavedSearch({ id });
      toast.success("Pretraga je obrisana.");
    } catch {
      toast.error("Nisam uspio obrisati pretragu.");
    }
  };

  // ═══════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════

  // Detect if mobile
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleTriggerClick = () => {
    if (isMobile) {
      setIsSheetOpen(true);
    } else {
      setIsDropdownOpen((prev) => !prev);
    }
  };

  return (
    <>
      {/* ═══════════════════════════════════════════════════════════════
          TRIGGER BUTTON
          ═══════════════════════════════════════════════════════════════ */}
      <div className="relative" ref={triggerRef}>
        <button
          onClick={handleTriggerClick}
          className={`
            group relative h-11 w-full sm:w-auto sm:min-w-[220px] px-4
            flex items-center justify-between gap-3
            rounded-xl border-2 transition-all duration-200
            ${currentSaved
              ? "border-[#1A4B8C] bg-gradient-to-r from-[#1A4B8C]/5 to-[#00A19B]/5"
              : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-md"
            }
          `}
        >
          <span className="flex items-center gap-2.5 min-w-0">
            <span
              className={`
                p-1.5 rounded-lg transition-colors
                ${currentSaved ? "bg-[#1A4B8C]/10" : "bg-gray-100 group-hover:bg-gray-200"}
              `}
            >
              {currentSaved ? (
                <IconBookmarkFilled size={16} className="text-[#1A4B8C]" />
              ) : (
                <IconBookmark size={16} className="text-gray-500" />
              )}
            </span>
            <span className="truncate text-sm font-medium text-gray-900">
              {isLoading
                ? "Učitavam..."
                : currentSaved?.name || "Sačuvane pretrage"}
            </span>
          </span>

          <IconChevronDown
            size={18}
            className={`
              text-gray-400 transition-transform duration-200
              ${isSheetOpen || isDropdownOpen ? "rotate-180" : ""}
            `}
          />

          {/* Badge for saved count */}
          {!isLoading && savedSearches.length > 0 && !currentSaved && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full bg-[#F7941D] text-white text-[10px] font-bold shadow-lg">
              {savedSearches.length}
            </span>
          )}
        </button>

        {/* Desktop Dropdown */}
        <DesktopDropdown
          isOpen={isDropdownOpen && !isMobile}
          onClose={() => setIsDropdownOpen(false)}
          savedSearches={savedSearches}
          isLoading={isLoading}
          currentSaved={currentSaved}
          hasAnyRealParams={hasAnyRealParams}
          alreadySaved={alreadySaved}
          onApply={handleApply}
          onSaveClick={() => setIsSaveOpen(true)}
          onManageClick={() => setIsManageOpen(true)}
        />
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          MOBILE BOTTOM SHEET
          ═══════════════════════════════════════════════════════════════ */}
      <BottomSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        title="Sačuvane pretrage"
      >
        <div className="space-y-3">
          {isLoading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : savedSearches.length === 0 ? (
            <EmptyState
              canSave={hasAnyRealParams && !alreadySaved}
              onSave={() => {
                setIsSheetOpen(false);
                setIsSaveOpen(true);
              }}
            />
          ) : (
            <>
              <AnimatePresence mode="popLayout">
                {savedSearches.map((s) => (
                  <SearchCard
                    key={s.id}
                    search={s}
                    isActive={currentSaved?.id === s.id}
                    onApply={handleApply}
                    onRename={handleRename}
                    onDelete={handleDelete}
                  />
                ))}
              </AnimatePresence>
            </>
          )}
        </div>

        {/* Bottom actions */}
        <div className="mt-6 pt-4 border-t border-gray-100 space-y-2">
          {hasAnyRealParams && !alreadySaved && (
            <button
              onClick={() => {
                setIsSheetOpen(false);
                setIsSaveOpen(true);
              }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#F7941D] to-[#F7941D]/80 text-white font-medium flex items-center justify-center gap-2 shadow-lg shadow-[#F7941D]/20"
            >
              <IconStarFilled size={18} />
              Sačuvaj trenutnu pretragu
            </button>
          )}

          <button
            onClick={() => {
              setIsSheetOpen(false);
              setIsManageOpen(true);
            }}
            className="w-full py-3 rounded-xl bg-gray-100 text-gray-700 font-medium flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
          >
            <IconSettings size={18} />
            Upravljaj pretragama
          </button>
        </div>
      </BottomSheet>

      {/* ═══════════════════════════════════════════════════════════════
          SAVE DIALOG
          ═══════════════════════════════════════════════════════════════ */}
      <Dialog open={isSaveOpen} onOpenChange={setIsSaveOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-2xl p-0 overflow-hidden">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-[#1A4B8C] to-[#00A19B] px-6 py-5">
            <DialogTitle className="text-white text-lg font-semibold flex items-center gap-2">
              <IconStarFilled size={20} />
              Sačuvaj pretragu
            </DialogTitle>
            <p className="text-white/80 text-sm mt-1">
              Brzo pristupi omiljenim filterima
            </p>
          </div>

          <div className="p-6 space-y-4">
            {/* Name input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Naziv pretrage
              </label>
              <Input
                value={naziv}
                onChange={(e) => setNaziv(e.target.value)}
                placeholder="npr. Stanovi do 250000 KM u Sarajevu"
                className="h-12 rounded-xl border-2 border-gray-200 focus:border-[#1A4B8C] focus:ring-[#1A4B8C]/20"
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
              />
            </div>

            {/* Current filters preview */}
            <div className="rounded-xl bg-gray-50 border border-gray-200 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-2">
                <IconSearch size={16} />
                Aktivni filteri
              </div>
              <div className="flex flex-wrap gap-1.5">
                {formatSavedSearchQuery(currentQueryString).length === 0 ? (
                  <span className="text-sm text-gray-500">(bez filtera)</span>
                ) : (
                  formatSavedSearchQuery(currentQueryString).map((p, idx) => (
                    <span
                      key={`${p.key}-${idx}`}
                      className="inline-flex items-center gap-1 rounded-full bg-white border border-gray-200 px-2.5 py-1 text-xs"
                    >
                      <span className="font-semibold text-gray-700">{p.key}:</span>
                      <span className="text-gray-500 truncate max-w-[120px]">
                        {p.value}
                      </span>
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="px-6 pb-6 pt-0 gap-2">
            <Button
              variant="outline"
              onClick={() => setIsSaveOpen(false)}
              className="h-11 rounded-xl border-2"
            >
              Odustani
            </Button>
            <Button
              onClick={handleSave}
              className="h-11 rounded-xl bg-gradient-to-r from-[#1A4B8C] to-[#00A19B] hover:opacity-90 transition-opacity"
            >
              <IconCheck size={18} className="mr-2" />
              Sačuvaj
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════
          MANAGE DIALOG
          ═══════════════════════════════════════════════════════════════ */}
      <Dialog open={isManageOpen} onOpenChange={setIsManageOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] rounded-2xl p-0 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#1A4B8C] to-[#00A19B] px-6 py-5 shrink-0">
            <DialogTitle className="text-white text-lg font-semibold flex items-center gap-2">
              <IconSettings size={20} />
              Upravljaj pretragama
            </DialogTitle>
            <p className="text-white/80 text-sm mt-1">
              {savedSearches.length} sačuvan{savedSearches.length === 1 ? "a" : "e"} pretrag
              {savedSearches.length === 1 ? "a" : "e"}
            </p>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-3">
              {isLoading ? (
                <>
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                </>
              ) : savedSearches.length === 0 ? (
                <EmptyState
                  canSave={hasAnyRealParams && !alreadySaved}
                  onSave={() => {
                    setIsManageOpen(false);
                    setIsSaveOpen(true);
                  }}
                />
              ) : (
                <AnimatePresence mode="popLayout">
                  {savedSearches.map((s) => (
                    <SearchCard
                      key={s.id}
                      search={s}
                      isActive={currentSaved?.id === s.id}
                      onApply={handleApply}
                      onRename={handleRename}
                      onDelete={handleDelete}
                      isManageMode
                    />
                  ))}
                </AnimatePresence>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 shrink-0">
            <div className="flex items-center justify-between gap-3">
              {hasAnyRealParams && !alreadySaved && (
                <Button
                  onClick={() => {
                    setIsManageOpen(false);
                    setIsSaveOpen(true);
                  }}
                  className="h-11 rounded-xl bg-[#F7941D] hover:bg-[#F7941D]/90"
                >
                  <IconStarFilled size={16} className="mr-2" />
                  Sačuvaj trenutnu
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => setIsManageOpen(false)}
                className="h-11 rounded-xl border-2 ml-auto"
              >
                Zatvori
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}