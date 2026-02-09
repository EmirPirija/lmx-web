"use client";

import React, { useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import {
  ArrowRight,
  BadgePercent,
  CheckCircle,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit,
  Eye,
  EyeOff,
  Heart,
  Images,
  MapPin,
  MoreVertical,
  Rocket,
  RotateCcw,
  Trash2,
  Youtube,
} from "lucide-react";

import CustomLink from "@/components/Common/CustomLink";
import CustomImage from "@/components/Common/CustomImage";

import SoldOutModal from "../../PagesComponent/ProductDetail/SoldOutModal";

import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

import { cn } from "@/lib/utils";
import { formatPriceAbbreviated, formatSalaryRange } from "@/utils";
import { useMediaQuery } from "usehooks-ts";

// ============================================
// POMOĆNE FUNKCIJE
// ============================================

const formatRelativeTime = (dateString) => {
  if (!dateString) return "";

  const now = new Date();
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return "";

  const diffInSeconds = Math.floor((now - date) / 1000);
  if (diffInSeconds < 60) return "Upravo sada";

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60)
    return diffInMinutes === 1 ? "Prije 1 minut" : `Prije ${diffInMinutes} minuta`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24)
    return diffInHours === 1 ? "Prije 1 sat" : `Prije ${diffInHours} sati`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30)
    return diffInDays === 1 ? "Prije 1 dan" : `Prije ${diffInDays} dana`;

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12)
    return diffInMonths === 1 ? "Prije 1 mjesec" : `Prije ${diffInMonths} mjeseci`;

  const diffInYears = Math.floor(diffInMonths / 12);
  return diffInYears === 1 ? "Prije 1 godina" : `Prije ${diffInYears} godina`;
};

const getSmartTagsFallback = (item) => {
  const tags = [];
  const skipFields = [
    "stanje",
    "condition",
    "opis",
    "description",
    "naslov",
    "title",
  ];
  const customFields = item?.translated_custom_fields || [];

  for (const field of customFields) {
    if (tags.length >= 3) break;
    const fieldName = (field?.name || field?.translated_name || "").toLowerCase();
    if (skipFields.some((skip) => fieldName.includes(skip))) continue;

    const value =
      field?.translated_selected_values?.[0] || field?.value?.[0];
    if (value && typeof value === "string" && value.length < 25) tags.push(value);
  }

  return tags;
};

const getKeyAttributes = (item) => {
  const attributes = [];
  const customFields = item?.translated_custom_fields || [];

  const findValue = (keys) => {
    const field = customFields.find((f) => {
      const name = (f?.translated_name || f?.name || "").toLowerCase();
      return keys.includes(name);
    });

    return field?.translated_selected_values?.[0] || field?.value?.[0];
  };

  const condition = findValue(["stanje oglasa", "stanje"]);
  if (condition) attributes.push(condition);

  const year = findValue(["godište", "godiste"]);
  if (year) attributes.push(year);

  const fuel = findValue(["gorivo"]);
  if (fuel) attributes.push(fuel);

  const transmission = findValue(["mjenjač", "mjenjac"]);
  if (transmission) attributes.push(transmission);

  if (attributes.length === 0) return getSmartTagsFallback(item);
  return attributes;
};

// Funkcija koja vraća najviše 3 tačke za indikaciju
const getThreeDots = (total, current) => {
  if (total <= 3) {
    return Array.from({ length: total }, (_, i) => i);
  }

  if (current === 0) {
    return [0, 1, 2];
  }

  if (current === total - 1) {
    return [total - 3, total - 2, total - 1];
  }

  return [current - 1, current, current + 1];
};

// ============================================
// UI KOMPONENTE
// ============================================

const OverlayPill = ({ icon: Icon, children, className }) => (
  <div
    className={cn(
      "inline-flex items-center gap-1.5",
      "px-2 py-1 rounded-lg border text-[11px] font-semibold",
      "bg-white/90 backdrop-blur-sm",
      "shadow-sm",
      className
    )}
  >
    {Icon ? <Icon className="w-3.5 h-3.5" /> : null}
    {children}
  </div>
);

// ============================================
// QUICK ACTIONS OVERLAY KOMPONENTA
// ============================================

const QuickActionsOverlay = ({ 
  isVisible, 
  onClose, 
  onEdit, 
  onDelete, 
  onHide, 
  onSold,
  onActivate,
  onRenew,
  isApproved,
  isEditable,
  isSoldOut,
  isInactive,
  isExpired
}) => {
  if (!isVisible) return null;

  const actions = [
    {
      icon: Edit,
      label: "Uredi",
      onClick: onEdit,
      show: isEditable,
      className: "bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700",
      exitDirection: { x: -100, y: -100 } // Gore lijevo
    },
    {
      icon: Trash2,
      label: "Izbriši",
      onClick: onDelete,
      show: true,
      className: "bg-red-50 hover:bg-red-100 border-red-200 text-red-700",
      exitDirection: { x: 100, y: -100 } // Gore desno
    },
    {
      icon: isInactive ? Eye : EyeOff,
      label: isInactive ? "Otkrij" : "Sakrij",
      onClick: isInactive ? onActivate : onHide,
      show: isApproved || isInactive,
      className: isInactive 
        ? "bg-green-50 hover:bg-green-100 border-green-200 text-green-700"
        : "bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-700",
      exitDirection: { x: -100, y: 100 } // Dolje lijevo
    },
    {
      icon: isExpired ? RotateCcw : CheckCircle,
      label: isExpired ? "Obnovi" : "Prodaj",
      onClick: isExpired ? onRenew : onSold,
      show: isExpired || (isApproved && !isSoldOut),
      className: isExpired
        ? "bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700"
        : "bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700",
      exitDirection: { x: 100, y: 100 } // Dolje desno
    }
  ].filter(action => action.show);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-40 flex items-center justify-center p-6 rounded-xl"
          onClick={onClose}
        >
          {/* Blur backdrop */}
          <motion.div 
            className="absolute inset-0 bg-white/60 backdrop-blur-xl rounded-xl"
            initial={{ backdropFilter: "blur(0px)" }}
            animate={{ backdropFilter: "blur(24px)" }}
            exit={{ backdropFilter: "blur(0px)" }}
          />
          
          {/* Actions grid */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative grid grid-cols-2 gap-3 w-full max-w-[280px]"
            onClick={(e) => e.stopPropagation()}
          >
            {actions.map((action, index) => (
              <motion.button
                key={action.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0, x: 0 }}
                exit={{ 
                  opacity: 0, 
                  x: action.exitDirection.x, 
                  y: action.exitDirection.y,
                  scale: 0.5,
                  rotate: index % 2 === 0 ? -45 : 45
                }}
                transition={{ 
                  delay: index * 0.06,
                  exit: { duration: 0.3, ease: "easeInOut" }
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  action.onClick();
                  onClose();
                }}
                className={cn(
                  "flex flex-col items-center justify-center gap-2",
                  "p-6 rounded-2xl border-2",
                  "transition-all duration-200",
                  "shadow-sm",
                  action.className
                )}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="w-12 h-12 rounded-xl bg-white/60 backdrop-blur-sm flex items-center justify-center shadow-sm">
                  <action.icon className="w-6 h-6" />
                </div>
                <span className="text-sm font-bold">{action.label}</span>
              </motion.button>
            ))}
          </motion.div>

          {/* Close hint */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ delay: 0.3 }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2"
          >
            <div className="px-3 py-1.5 rounded-full bg-black/20 backdrop-blur-sm">
              <p className="text-xs text-white font-medium">Klikni van za zatvaranje</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ============================================
// CUSTOM CONTEXT MENU KOMPONENTA
// ============================================

const CustomContextMenu = ({ children, onSelect, onRenew, onDelete, isSelected, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (disabled) return children;

  return (
    <div
      onContextMenu={(e) => {
        e.preventDefault();
        setIsOpen(true);
      }}
    >
      {children}
      
      {/* Simple context menu overlay for expired items */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-4 shadow-2xl border border-slate-200 min-w-[200px]"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => {
                  onSelect?.();
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 transition-colors"
              >
                <CheckSquare className="w-5 h-5 text-slate-600" />
                <span className="text-sm font-medium">{isSelected ? "Poništi odabir" : "Odaberi"}</span>
              </button>
              
              <button
                onClick={() => {
                  onRenew?.();
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 transition-colors"
              >
                <RotateCcw className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">Obnovi</span>
              </button>
              
              <div className="h-px bg-slate-200 my-2" />
              
              <button
                onClick={() => {
                  onDelete?.();
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 transition-colors text-red-600"
              >
                <Trash2 className="w-5 h-5" />
                <span className="text-sm font-medium">Izbriši</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ============================================
// KARTICA
// ============================================

const MyAdsCard = ({
  data,
  isApprovedSort,
  isSelected = false,
  isSelectable = false,
  onSelectionToggle,
  onContextMenuAction,
}) => {
  const isJobCategory = Number(data?.category?.is_job_category) === 1;
  const translatedItem = data?.translated_item;

  const keyAttributes = getKeyAttributes(data);
  const displayCity = data?.translated_city || data?.city || "";

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  
  // NOVI STATE ZA QUICK ACTIONS
  const [showQuickActions, setShowQuickActions] = useState(false);

  // MODAL ZA PRODANO
  const [isSoldOutDialogOpen, setIsSoldOutDialogOpen] = useState(false);
  const [selectedBuyerId, setSelectedBuyerId] = useState(null);

  // Refovi za dodir/klizanje
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  
  // Long press za mobilne
  const longPressTimer = useRef(null);
  const [isLongPressing, setIsLongPressing] = useState(false);

  const status = data?.status;
  const isExpired = status === "expired";
  const isInactive = status === "inactive";
  const isSoldOut = status === "sold out";
  const isApproved = status === "approved" || status === "featured";
  const isEditable = isApproved;

  const hasVideo = !!(data?.video_link && String(data?.video_link).trim() !== "");

  const isHidePrice = isJobCategory
    ? [data?.min_salary, data?.max_salary].every(
        (val) =>
          val === null ||
          val === undefined ||
          (typeof val === "string" && val.trim() === "")
      )
    : data?.price === null ||
      data?.price === undefined ||
      (typeof data?.price === "string" && data?.price.trim() === "");

  // Logika za sniženje
  const isOnSale = data?.is_on_sale === true || data?.is_on_sale === 1;
  const oldPrice = data?.old_price;
  const currentPrice = data?.price;

  const discountPercentage = useMemo(() => {
    const explicit = Number(data?.discount_percentage || 0);
    if (explicit > 0) return explicit;

    if (!isOnSale) return 0;
    if (!oldPrice || !currentPrice) return 0;

    const oldN = Number(oldPrice);
    const curN = Number(currentPrice);
    if (!Number.isFinite(oldN) || !Number.isFinite(curN) || oldN <= curN) return 0;

    return Math.round(((oldN - curN) / oldN) * 100);
  }, [data?.discount_percentage, isOnSale, oldPrice, currentPrice]);

  // Priprema slajdova (slike + "pogledaj više")
  const slides = useMemo(() => {
    const s = [];
    const seen = new Set();

    const pushImage = (src) => {
      if (!src) return;
      if (seen.has(src)) return;
      seen.add(src);
      s.push({ type: "image", src });
    };

    pushImage(data?.image);

    if (Array.isArray(data?.gallery_images) && data.gallery_images.length) {
      data.gallery_images.forEach((img) => {
        const src = img?.image || img;
        pushImage(src);
      });
    }

    s.push({ type: "viewMore" });
    return s;
  }, [data?.image, data?.gallery_images]);

  const totalSlides = slides.length;
  const totalImages = Math.max(0, totalSlides - 1);

  const isViewMoreSlide = slides[currentSlide]?.type === "viewMore";

  const threeDots = useMemo(
    () => getThreeDots(totalSlides, currentSlide),
    [totalSlides, currentSlide]
  );

  // Kontrole za slajder
  const handlePrevSlide = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (currentSlide > 0) {
      setCurrentSlide((prev) => prev - 1);
    }
  };

  const handleNextSlide = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide((prev) => prev + 1);
    }
  };

  const goToSlide = (e, index) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentSlide(index);
  };

  // Logika za dodir
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches?.[0]?.clientX || 0;
    
    // Long press logic
    if (!isSelectable) {
      setIsLongPressing(true);
      longPressTimer.current = setTimeout(() => {
        setShowQuickActions(true);
        setIsLongPressing(false);
      }, 500); // 500ms za long press
    }
  };
  
  const handleTouchMove = (e) => {
    touchEndX.current = e.touches?.[0]?.clientX || 0;
    
    // Otkaži long press ako korisnik pomjera prst
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      setIsLongPressing(false);
    }
  };
  
  const handleTouchEnd = () => {
    // Otkaži long press
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      setIsLongPressing(false);
    }
    
    if (isSelectable) return;

    const swipeDistance = touchStartX.current - touchEndX.current;
    if (Math.abs(swipeDistance) <= 50) return;

    if (swipeDistance > 0 && currentSlide < totalSlides - 1) {
      setCurrentSlide((prev) => prev + 1);
    } else if (swipeDistance < 0 && currentSlide > 0) {
      setCurrentSlide((prev) => prev - 1);
    }
  };

  const handleSoldOutClick = () => {
    setIsSoldOutDialogOpen(true);
  };

  const handleSoldOutAction = (shouldProcess) => {
    if (!shouldProcess) return;
    onContextMenuAction?.("markAsSoldOut", data?.id, selectedBuyerId);
    setIsSoldOutDialogOpen(false);
  };

  const title = translatedItem?.name || data?.name;

  const cardContent = (
    <div
      className={cn(
        "group relative flex flex-col h-full overflow-hidden",
        "bg-white rounded-xl border border-slate-100",
        "transition-all duration-200",
        isSelected ? "ring-2 ring-primary/70 bg-primary/5 shadow-sm" : "hover:shadow-sm",
        "cursor-pointer"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={(e) => {
        if (isSelectable) {
          e.preventDefault();
          onSelectionToggle?.();
        } else if (showQuickActions) {
          e.preventDefault();
        } else {
          // Normalan klik - idi na link
          window.location.href = `/my-listing/${data?.slug}`;
        }
      }}
      onDoubleClick={(e) => {
        if (!isSelectable) {
          e.preventDefault();
          setShowQuickActions(true);
        }
      }}
      onContextMenu={(e) => {
        if (!isSelectable) {
          e.preventDefault();
          setShowQuickActions(true);
        }
      }}
    >
      {/* Quick Actions Overlay */}
      <QuickActionsOverlay
        isVisible={showQuickActions}
        onClose={() => setShowQuickActions(false)}
        onEdit={() => onContextMenuAction?.("edit", data?.id)}
        onDelete={() => onContextMenuAction?.("delete", data?.id)}
        onHide={() => onContextMenuAction?.("deactivate", data?.id)}
        onActivate={() => onContextMenuAction?.("activate", data?.id)}
        onSold={handleSoldOutClick}
        onRenew={() => onContextMenuAction?.("renew", data?.id)}
        isApproved={isApproved}
        isEditable={isEditable}
        isSoldOut={isSoldOut}
        isInactive={isInactive}
        isExpired={isExpired}
      />

      {/* MEDIJ */}
      <div
        className={cn("relative overflow-hidden", "rounded-t-xl", "touch-pan-y")}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="relative aspect-square bg-slate-50">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="absolute inset-0 w-full h-full"
            >
              {slides[currentSlide].type === "image" ? (
                <CustomImage
                  src={slides[currentSlide].src}
                  width={420}
                  height={420}
                  className="w-full h-full object-cover"
                  alt={title || "listing"}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-slate-50">
                  <motion.div
                    initial={{ scale: 0.8, rotate: -10 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ duration: 0.3, type: "spring" }}
                    className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3 border border-primary/15"
                  >
                    <ArrowRight className="w-6 h-6" />
                  </motion.div>
                  <p className="text-sm font-semibold text-slate-900 text-center">Detalji</p>
                  <p className="text-xs text-slate-500 text-center mt-1">Otvori oglas</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Odabir */}
          {isSelectable && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="absolute top-2 left-2 z-30"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <Checkbox
                checked={isSelected}
                onCheckedChange={onSelectionToggle}
                className={cn(
                  "h-5 w-5",
                  "bg-white shadow-sm border border-slate-200",
                  "data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                )}
              />
            </motion.div>
          )}

          {/* Badževi gore-lijevo (premium / sniženje) */}
          {!isViewMoreSlide && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={cn("absolute top-2 z-20 flex items-center gap-2", isSelectable ? "left-9" : "left-2")}
            >
              {data?.is_feature ? (
                <OverlayPill icon={Rocket} className="text-amber-700 bg-amber-100/90 border-amber-200">
                  {/* Premium */}
                </OverlayPill>
              ) : null}

              {isOnSale && discountPercentage > 0 ? (
                <OverlayPill icon={BadgePercent} className="text-rose-700 bg-rose-100/90 border-rose-200">
                  
                </OverlayPill>
              ) : null}
            </motion.div>
          )}

          {/* Dugme za quick actions gore-desno */}
          <div
            className="absolute top-2 right-2 z-30"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant="outline"
                size="icon"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowQuickActions(true);
                }}
                className={cn(
                  "h-8 w-8 rounded-full",
                  "bg-white/90 backdrop-blur-sm",
                  "border-slate-200 shadow-sm",
                  "hover:bg-white hover:border-primary/30"
                )}
              >
                <MoreVertical className="w-4 h-4 text-slate-700" />
              </Button>
            </motion.div>
          </div>

          {/* Meta informacije dolje-lijevo */}
          {!isViewMoreSlide && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="absolute bottom-2 left-2 z-20 flex items-center gap-2"
            >
              {hasVideo ? (
                <OverlayPill icon={Youtube} className="text-red-700 bg-red-100/90 border-red-200">
                  Video
                </OverlayPill>
              ) : null}

              {totalImages > 1 ? (
                <OverlayPill icon={Images} className="text-slate-700 bg-white/90 border-slate-200">
                  {totalImages}
                </OverlayPill>
              ) : null}
            </motion.div>
          )}

          {/* Tačkice */}
          {totalSlides > 1 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="absolute bottom-2 right-2 z-20 hidden sm:flex items-center gap-1.5"
            >
              <div
                className={cn(
                  "flex items-center gap-1.5",
                  "px-2 py-1 rounded-full",
                  "bg-black/20 backdrop-blur-sm",
                  "border border-white/15"
                )}
              >
                {threeDots.map((index) => {
                  const isActive = index === currentSlide;
                  return (
                    <motion.button
                      key={index}
                      type="button"
                      onClick={(e) => goToSlide(e, index)}
                      className={cn(
                        "h-1.5 rounded-full",
                        isActive ? "bg-white" : "bg-white/70"
                      )}
                      aria-label={`Slide ${index + 1}`}
                      initial={false}
                      animate={{
                        width: isActive ? 24 : 6
                      }}
                      transition={{ duration: 0.2 }}
                    />
                  );
                })}
              </div>
            </motion.div>
          ) : null}

          {/* Strelice za prethodnu/sljedeću sliku */}
          {totalSlides > 1 && (
            <>
              {currentSlide > 0 && (
                <motion.button
                  type="button"
                  onClick={handlePrevSlide}
                  className={cn(
                    "absolute ltr:left-2 rtl:right-2 top-1/2 -translate-y-1/2 z-20",
                    "hidden sm:flex items-center justify-center",
                    "w-8 h-8 rounded-full",
                    "bg-white/90 backdrop-blur-sm border border-slate-200 shadow-sm",
                    "transition-all duration-200",
                    isHovered
                      ? "opacity-100 translate-x-0"
                      : "opacity-0 ltr:-translate-x-3 rtl:translate-x-3",
                    isSelectable ? "pointer-events-none opacity-0" : ""
                  )}
                  aria-label="Prethodna slika"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{
                    opacity: isHovered ? 1 : 0,
                    x: isHovered ? 0 : -20
                  }}
                  transition={{ duration: 0.2 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <ChevronLeft className="w-4 h-4 text-slate-700 rtl:rotate-180" />
                </motion.button>
              )}

              {currentSlide < totalSlides - 1 && (
                <motion.button
                  type="button"
                  onClick={handleNextSlide}
                  className={cn(
                    "absolute ltr:right-2 rtl:left-2 top-1/2 -translate-y-1/2 z-20",
                    "hidden sm:flex items-center justify-center",
                    "w-8 h-8 rounded-full",
                    "bg-white/90 backdrop-blur-sm border border-slate-200 shadow-sm",
                    "transition-all duration-200",
                    isHovered
                      ? "opacity-100 translate-x-0"
                      : "opacity-0 ltr:translate-x-3 rtl:-translate-x-3",
                    isSelectable ? "pointer-events-none opacity-0" : ""
                  )}
                  aria-label="Sljedeća slika"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{
                    opacity: isHovered ? 1 : 0,
                    x: isHovered ? 0 : 20
                  }}
                  transition={{ duration: 0.2 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <ChevronRight className="w-4 h-4 text-slate-700 rtl:rotate-180" />
                </motion.button>
              )}
            </>
          )}
        </div>
      </div>

      {/* SADRŽAJ */}
      <div className="flex flex-col gap-2 p-3 flex-1">
        <div className="flex items-start justify-between gap-2">
          <motion.h3 
            whileHover={{ color: "hsl(var(--primary))" }}
            className="text-sm font-semibold text-slate-900 line-clamp-2 leading-snug group-hover:text-primary transition-colors"
          >
            {title}
          </motion.h3>
        </div>

        {Array.isArray(keyAttributes) && keyAttributes.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {keyAttributes.map((attr, index) => (
              <motion.span
                key={`${attr}-${index}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "inline-flex items-center",
                  "px-2 py-0.5 rounded-md border",
                  "bg-slate-50 text-slate-700 border-slate-100",
                  "text-[10px] font-semibold"
                )}
              >
                {attr}
              </motion.span>
            ))}
          </div>
        ) : null}

        <div className="mt-auto pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatRelativeTime(data?.created_at)}</span>
            </div>
          </div>

          {!isHidePrice ? (
            isJobCategory ? (
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm font-bold text-slate-900"
              >
                {formatSalaryRange(data?.min_salary, data?.max_salary)}
              </motion.span>
            ) : isOnSale && oldPrice && currentPrice && Number(oldPrice) > Number(currentPrice) ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-end leading-none"
              >
                <span className="text-[11px] font-semibold text-slate-400 line-through tabular-nums">
                  {formatPriceAbbreviated(oldPrice)}
                </span>
                <span className="text-sm font-bold text-rose-600 tabular-nums">
                  {formatPriceAbbreviated(currentPrice)}
                </span>
              </motion.div>
            ) : (
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm font-bold text-slate-900 tabular-nums"
              >
                {formatPriceAbbreviated(data?.price)}
              </motion.span>
            )
          ) : null}
        </div>
      </div>

      {/* MODAL ZA PRODANO */}
      <SoldOutModal
        productDetails={data}
        showSoldOut={isSoldOutDialogOpen}
        setShowSoldOut={setIsSoldOutDialogOpen}
        selectedRadioValue={selectedBuyerId}
        setSelectedRadioValue={setSelectedBuyerId}
        setShowConfirmModal={handleSoldOutAction}
      />
    </div>
  );

  return (
    <CustomContextMenu
      onSelect={() => onContextMenuAction?.("select", data?.id)}
      onRenew={() => onContextMenuAction?.("renew", data?.id)}
      onDelete={() => onContextMenuAction?.("delete", data?.id)}
      isSelected={isSelected}
      disabled={!isExpired}
    >
      {cardContent}
    </CustomContextMenu>
  );
};

export default MyAdsCard;