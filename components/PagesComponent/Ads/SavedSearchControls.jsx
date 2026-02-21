"use client";

import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "@/utils/toastBs";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { useSelector } from "react-redux";

import { useNavigate } from "@/components/Common/useNavigate";
import { useSavedSearches } from "@/hooks/useSavedSearches";
import { getIsLoggedIn } from "@/redux/reducer/authSlice";
import { setIsLoginOpen } from "@/redux/reducer/globalStateSlice";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  IconBookmark,
  IconBookmarkFilled,
  IconChevronDown,
  IconStarFilled,
  IconSettings,
  IconExternalLink,
  IconX,
  IconCheck,
  IconTrash,
  IconEdit,
  IconSearch,
  IconSparkles,
} from "@/components/Common/UnifiedIconPack";

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
          className="absolute top-full left-0 z-[82] mt-2 w-[360px] overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-2xl shadow-slate-900/15 backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/95 dark:shadow-black/40"
        >
          {/* Header */}
          <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-4 py-3 dark:border-slate-800 dark:from-slate-900 dark:to-slate-900/90">
            <h3 className="flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-100">
              <IconBookmark size={18} className="text-primary" />
              Sačuvane pretrage
            </h3>
          </div>

          {/* Content */}
          <div className="max-h-[320px] overflow-y-auto">
            {isLoading ? (
              <div className="p-4 space-y-2">
                <Skeleton className="h-12 rounded-xl" />
                <Skeleton className="h-12 rounded-xl" />
              </div>
            ) : savedSearches.length === 0 ? (
              <div className="p-6 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900">
                  <IconSparkles size={24} className="text-primary" />
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Nemaš sačuvanih pretraga</p>
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
                          ? "border-2 border-primary/30 bg-primary/10 dark:border-primary/40 dark:bg-primary/20"
                          : "border-2 border-transparent hover:border-slate-200 hover:bg-slate-100/80 dark:hover:border-slate-700 dark:hover:bg-slate-800/80"
                        }
                      `}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="flex items-center gap-2 truncate font-medium text-slate-900 dark:text-slate-100">
                          {isActive && (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                              <IconCheck size={12} className="text-white" strokeWidth={3} />
                            </span>
                          )}
                          {s.name}
                        </span>
                        <IconExternalLink
                          size={16}
                          className="shrink-0 text-slate-400 transition-colors group-hover:text-primary dark:text-slate-500 dark:group-hover:text-primary"
                        />
                      </div>

                      {pairs.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {pairs.slice(0, 3).map((p, idx) => (
                            <span
                              key={`${p.key}-${idx}`}
                              className="inline-flex rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                            >
                              {p.key}: {p.value.slice(0, 15)}{p.value.length > 15 ? "..." : ""}
                            </span>
                          ))}
                          {pairs.length > 3 && (
                            <span className="text-[10px] font-medium text-primary">
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
          <div className="space-y-1 border-t border-slate-100 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-900/90">
            {hasAnyRealParams && !alreadySaved && (
              <button
                onClick={() => {
                  onSaveClick();
                  onClose();
                }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
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
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800"
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
  const [isClient, setIsClient] = useState(false);
  const openedAtRef = useRef(0);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    openedAtRef.current =
      typeof performance !== "undefined" ? performance.now() : Date.now();
  }, [isOpen]);

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

  if (!isClient) return null;

  const handleBackdropClick = () => {
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    if (now - openedAtRef.current < 220) return;
    onClose();
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-[94] bg-slate-950/45 backdrop-blur-[3px] md:hidden"
            onClick={handleBackdropClick}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 31, stiffness: 320, mass: 0.92 }}
            className="fixed bottom-0 left-0 right-0 z-[95] md:hidden"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex max-h-[88vh] flex-col rounded-t-[1.75rem] border border-slate-200 bg-white/95 shadow-2xl shadow-slate-900/20 backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/95 dark:shadow-black/45">
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="h-1 w-10 rounded-full bg-slate-300 dark:bg-slate-600" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-5 pb-3 dark:border-slate-800 dark:from-slate-900 dark:to-slate-900/90">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
                <button
                  onClick={onClose}
                  className="-mr-2 rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 active:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800"
                  aria-label="Zatvori modal"
                >
                  <IconX size={20} />
                </button>
              </div>

              {/* Content */}
              <div
                className="flex-1 overflow-y-auto overscroll-contain px-5 py-4"
                style={{ paddingBottom: "max(env(safe-area-inset-bottom), 1rem)" }}
              >
                {children}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
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
          ? "border-primary/35 bg-primary/10 shadow-lg shadow-slate-900/10 dark:border-primary/40 dark:bg-primary/20 dark:shadow-black/25" 
          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600"
        }
      `}
    >
      {/* Active indicator */}
      {isActive && (
        <div className="absolute -top-1 -right-1">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white shadow-lg">
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
              className="rounded-xl bg-primary p-2 text-white transition-colors hover:bg-primary/90"
            >
              <IconCheck size={16} />
            </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditValue(search.name || "");
                }}
              className="rounded-xl bg-slate-100 p-2 text-slate-600 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                <IconX size={16} />
              </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 min-w-0">
              <div className={`rounded-lg p-1.5 ${isActive ? "bg-primary/15 dark:bg-primary/25" : "bg-slate-100 dark:bg-slate-800"}`}>
                {isActive ? (
                  <IconBookmarkFilled size={16} className="text-primary" />
                ) : (
                  <IconBookmark size={16} className="text-slate-500 dark:text-slate-400" />
                )}
              </div>
              <h3 className="truncate font-semibold text-slate-900 dark:text-slate-100">{search.name}</h3>
            </div>

            {isManageMode && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsEditing(true)}
                  className="rounded-xl p-2 text-slate-400 transition-all hover:bg-primary/10 hover:text-primary dark:text-slate-500"
                >
                  <IconEdit size={16} />
                </button>
                <button
                  onClick={handleDelete}
                  className="rounded-xl p-2 text-slate-400 transition-all hover:bg-red-50 hover:text-red-500 dark:text-slate-500 dark:hover:bg-red-950/30 dark:hover:text-red-300"
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
        <div className="rounded-xl bg-slate-100 px-3 py-2 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          /ads (bez filtera)
        </div>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {pairs.slice(0, 4).map((p, idx) => (
            <span
              key={`${p.key}-${p.value}-${idx}`}
              title={`${p.key}: ${p.value}`}
              className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] dark:bg-slate-800"
            >
              <span className="font-semibold text-slate-700 dark:text-slate-200">{p.key}:</span>
              <span className="truncate max-w-[100px] text-slate-500 dark:text-slate-400">{p.value}</span>
            </span>
          ))}
          {pairs.length > 4 && (
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
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
              ? "bg-primary text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/35" 
              : "bg-slate-100 text-slate-700 hover:bg-primary hover:text-white dark:bg-slate-800 dark:text-slate-300"
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
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-medium text-white shadow-lg shadow-primary/20 transition-all duration-200 hover:bg-primary/90 hover:shadow-xl"
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
  <div className="rounded-2xl border-2 border-slate-200 p-4 dark:border-slate-700">
    <div className="flex items-center gap-2 mb-3">
      <Skeleton className="h-8 w-8 rounded-lg" />
      <Skeleton className="h-5 w-32 rounded-lg" />
    </div>
    <div className="flex gap-1.5">
      <Skeleton className="h-6 w-20 rounded-full" />
      <Skeleton className="h-6 w-24 rounded-full" />
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════
// EMPTY STATE
// ═══════════════════════════════════════════════════════════════════

const EmptyState = ({ onSave, canSave }) => (
  <div className="text-center py-8">
    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900">
      <IconSparkles size={28} className="text-primary" />
    </div>
    <h3 className="mb-1 text-base font-semibold text-slate-900 dark:text-slate-100">
      Nemaš sačuvanih pretraga
    </h3>
    <p className="mx-auto mb-4 max-w-[250px] text-sm text-slate-500 dark:text-slate-400">
      Sačuvaj filtere koje koristiš često da brže pronađeš oglase
    </p>
    {canSave && (
      <button
        onClick={onSave}
        className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-xl"
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

export default function SavedSearchControls({
  iconOnly = false,
  openSignal = 0,
  onMobileSheetOpenChange,
}) {
  const searchParams = useSearchParams();
  const { navigate } = useNavigate();
  const isLoggedIn = useSelector(getIsLoggedIn);

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
  const lastOpenSignalRef = useRef(openSignal);

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
    if (!isLoggedIn) {
      toast.error("Prvo se prijavi");
      setIsLoginOpen(true);
      return;
    }

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
    } catch (error) {
      if (error?.code === "AUTH_REQUIRED" || error?.response?.status === 401) {
        toast.error("Sesija je istekla. Prijavi se ponovo.");
        setIsLoginOpen(true);
        return;
      }
      toast.error("Nisam uspio sačuvati pretragu.");
    }
  };

  const handleRename = async (id, name) => {
    if (!isLoggedIn) {
      toast.error("Prvo se prijavi");
      setIsLoginOpen(true);
      return;
    }

    try {
      await renameSavedSearch({ id, name });
      toast.success("Pretraga je preimenovana.");
    } catch (error) {
      if (error?.code === "AUTH_REQUIRED" || error?.response?.status === 401) {
        toast.error("Sesija je istekla. Prijavi se ponovo.");
        setIsLoginOpen(true);
        return;
      }
      toast.error("Nisam uspio preimenovati pretragu.");
    }
  };

  const handleDelete = async (id) => {
    if (!isLoggedIn) {
      toast.error("Prvo se prijavi");
      setIsLoginOpen(true);
      return;
    }

    try {
      await deleteSavedSearch({ id });
      toast.success("Pretraga je obrisana.");
    } catch (error) {
      if (error?.code === "AUTH_REQUIRED" || error?.response?.status === 401) {
        toast.error("Sesija je istekla. Prijavi se ponovo.");
        setIsLoginOpen(true);
        return;
      }
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

  useEffect(() => {
    if (!onMobileSheetOpenChange) return;
    onMobileSheetOpenChange(isMobile ? isSheetOpen : false);
  }, [isMobile, isSheetOpen, onMobileSheetOpenChange]);

  useEffect(
    () => () => {
      onMobileSheetOpenChange?.(false);
    },
    [onMobileSheetOpenChange]
  );

  const handleTriggerClick = () => {
    if (isMobile) {
      setIsSheetOpen(true);
    } else {
      setIsDropdownOpen((prev) => !prev);
    }
  };

  useEffect(() => {
    if (!openSignal || openSignal === lastOpenSignalRef.current) return;

    if (isMobile) setIsSheetOpen(true);
    else setIsDropdownOpen(true);

    lastOpenSignalRef.current = openSignal;
  }, [openSignal, isMobile]);

  return (
    <>
      {/* ═══════════════════════════════════════════════════════════════
          TRIGGER BUTTON
          ═══════════════════════════════════════════════════════════════ */}
      <div className="relative" ref={triggerRef}>
        <button
          onClick={handleTriggerClick}
          className={`
            group relative transition-all duration-200
            ${
              iconOnly
                ? `grid h-11 w-11 place-items-center rounded-full border border-slate-200/80 bg-white/80 p-1 transition-all duration-200 hover:scale-105 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900/75 dark:hover:bg-slate-800
                   ${currentSaved
                     ? "border-primary/45 bg-primary/10 text-primary dark:border-primary/50 dark:bg-primary/20 dark:text-primary"
                     : "text-slate-600 dark:text-slate-300"}`
                : `h-11 w-full sm:w-auto sm:min-w-[220px] px-4 flex items-center justify-between gap-3 rounded-xl border-2
                   ${currentSaved
                     ? "border-primary/40 bg-primary/10"
                     : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600"}`
            }
          `}
          aria-label="Sačuvane pretrage"
          title="Sačuvane pretrage"
        >
          {iconOnly ? (
            currentSaved ? (
              <IconBookmarkFilled size={18} className="text-primary" />
            ) : (
              <IconBookmark size={18} className="text-slate-600" />
            )
          ) : (
            <>
              <span className="flex items-center gap-2.5 min-w-0">
                <span
                  className={`
                    p-1.5 rounded-lg transition-colors
                    ${currentSaved ? "bg-primary/10 dark:bg-primary/20" : "bg-slate-100 group-hover:bg-slate-200 dark:bg-slate-800 dark:group-hover:bg-slate-700"}
                  `}
                >
                  {currentSaved ? (
                    <IconBookmarkFilled size={16} className="text-primary" />
                  ) : (
                    <IconBookmark size={16} className="text-slate-500 dark:text-slate-400" />
                  )}
                </span>
                <span className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                  {isLoading
                    ? "Učitavam..."
                    : currentSaved?.name || "Sačuvane pretrage"}
                </span>
              </span>

              <IconChevronDown
                size={18}
                className={`
                  text-slate-400 transition-transform duration-200 dark:text-slate-500
                  ${isSheetOpen || isDropdownOpen ? "rotate-180" : ""}
                `}
              />
            </>
          )}

          {/* Badge for saved count */}
          {!isLoading && savedSearches.length > 0 && !currentSaved && (
            <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-white shadow-lg">
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
        <div className="mt-6 space-y-2 border-t border-slate-100 pt-4 dark:border-slate-800">
          {hasAnyRealParams && !alreadySaved && (
            <button
              onClick={() => {
                setIsSheetOpen(false);
                setIsSaveOpen(true);
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-medium text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-primary/30"
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
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-100 py-3 font-medium text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
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
        <DialogContent className="sm:max-w-[480px] overflow-hidden rounded-2xl border border-slate-200 bg-white/95 p-0 backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/95">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-slate-50 to-white px-6 py-5 dark:from-slate-900 dark:to-slate-900/90">
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
              <IconStarFilled size={20} className="text-primary" />
              Sačuvaj pretragu
            </DialogTitle>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Brzo pristupi omiljenim filterima
            </p>
          </div>

          <div className="p-6 space-y-4">
            {/* Name input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Naziv pretrage
              </label>
              <Input
                value={naziv}
                onChange={(e) => setNaziv(e.target.value)}
                placeholder="npr. Stanovi do 250000 KM u Sarajevu"
                className="h-12 rounded-xl border-2 border-slate-200 focus:border-primary focus:ring-primary/20 dark:border-slate-700"
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
              />
            </div>

            {/* Current filters preview */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/70">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                <IconSearch size={16} />
                Aktivni filteri
              </div>
              <div className="flex flex-wrap gap-1.5">
                {formatSavedSearchQuery(currentQueryString).length === 0 ? (
                  <span className="text-sm text-slate-500 dark:text-slate-400">(bez filtera)</span>
                ) : (
                  formatSavedSearchQuery(currentQueryString).map((p, idx) => (
                    <span
                      key={`${p.key}-${idx}`}
                      className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs dark:border-slate-700 dark:bg-slate-900"
                    >
                      <span className="font-semibold text-slate-700 dark:text-slate-200">{p.key}:</span>
                      <span className="max-w-[120px] truncate text-slate-500 dark:text-slate-400">
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
              className="h-11 rounded-xl bg-primary transition-colors hover:bg-primary/90"
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
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white/95 p-0 backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/95">
          {/* Header */}
          <div className="shrink-0 bg-gradient-to-r from-slate-50 to-white px-6 py-5 dark:from-slate-900 dark:to-slate-900/90">
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
              <IconSettings size={20} className="text-primary" />
              Upravljaj pretragama
            </DialogTitle>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
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
          <div className="shrink-0 border-t border-slate-100 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/80">
            <div className="flex items-center justify-between gap-3">
              {hasAnyRealParams && !alreadySaved && (
                <Button
                  onClick={() => {
                    setIsManageOpen(false);
                    setIsSaveOpen(true);
                  }}
                  className="h-11 rounded-xl bg-primary hover:bg-primary/90"
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
