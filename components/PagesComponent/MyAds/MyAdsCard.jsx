"use client";

import React, { useMemo, useRef, useState } from "react";

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
import GetMyAdStatus from "./GetMyAdStatus";

import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Button } from "@/components/ui/button";

import { cn } from "@/lib/utils";
import { formatPriceAbbreviated, formatSalaryRange, t } from "@/utils";

// ============================================
// HELPERS
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
    return diffInMinutes === 1 ? "Prije 1 min" : `Prije ${diffInMinutes} min`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24)
    return diffInHours === 1 ? "Prije 1 sat" : `Prije ${diffInHours} sati`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30)
    return diffInDays === 1 ? "Prije 1 dan" : `Prije ${diffInDays} dana`;

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12)
    return diffInMonths === 1 ? "Prije 1 mj" : `Prije ${diffInMonths} mj`;

  const diffInYears = Math.floor(diffInMonths / 12);
  return diffInYears === 1 ? "Prije 1 god" : `Prije ${diffInYears} god`;
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

// ============================================
// UI
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

const StatChip = ({ icon: Icon, value, className, title }) => (
  <div
    className={cn(
      "inline-flex items-center gap-1.5",
      "px-2 py-1 rounded-lg border",
      "bg-slate-50 text-slate-700 border-slate-100",
      "text-[11px] font-semibold",
      className
    )}
    title={title}
  >
    <Icon className="w-3.5 h-3.5" />
    <span>{value}</span>
  </div>
);

// ============================================
// CARD
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

  // SOLD OUT MODAL
  const [isSoldOutDialogOpen, setIsSoldOutDialogOpen] = useState(false);
  const [selectedBuyerId, setSelectedBuyerId] = useState(null);

  // Touch/Swipe refs
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

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

  // Sale logic
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

  // Build slider slides (images + "view more")
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

  // Slider controls
  const handlePrevSlide = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentSlide((prev) => (prev === 0 ? totalSlides - 1 : prev - 1));
  };

  const handleNextSlide = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentSlide((prev) => (prev === totalSlides - 1 ? 0 : prev + 1));
  };

  const goToSlide = (e, index) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentSlide(index);
  };

  // Touch logic
  const handleTouchStart = (e) => (touchStartX.current = e.touches?.[0]?.clientX || 0);
  const handleTouchMove = (e) => (touchEndX.current = e.touches?.[0]?.clientX || 0);
  const handleTouchEnd = () => {
    if (isSelectable) return;

    const swipeDistance = touchStartX.current - touchEndX.current;
    if (Math.abs(swipeDistance) <= 50) return;

    if (swipeDistance > 0) setCurrentSlide((prev) => (prev === totalSlides - 1 ? 0 : prev + 1));
    else setCurrentSlide((prev) => (prev === 0 ? totalSlides - 1 : prev - 1));
  };

  const handleSoldOutClick = () => setIsSoldOutDialogOpen(true);

  const handleSoldOutAction = (shouldProcess) => {
    if (!shouldProcess) return;
    onContextMenuAction?.("markAsSoldOut", data?.id, selectedBuyerId);
    setIsSoldOutDialogOpen(false);
  };

  const title = translatedItem?.name || data?.name;

  const cardContent = (
    <CustomLink
      href={`/my-listing/${data?.slug}`}
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
        if (!isSelectable) return;
        e.preventDefault();
        onSelectionToggle?.();
      }}
    >
      {/* MEDIA */}
      <div
        className={cn("relative overflow-hidden", "rounded-t-xl", "touch-pan-y")}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="relative aspect-square bg-slate-50">
          {slides.map((slide, index) => (
            <div
              key={`${slide.type}-${index}`}
              className={cn(
                "absolute inset-0 transition-all duration-500 ease-out",
                index === currentSlide ? "opacity-100 z-[1] scale-100" : "opacity-0 z-0 scale-105"
              )}
            >
              {slide.type === "image" ? (
                <CustomImage
                  src={slide.src}
                  width={420}
                  height={420}
                  className="w-full h-full object-cover"
                  alt={title || "listing"}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-slate-50">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3 border border-primary/15">
                    <ArrowRight className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-slate-900 text-center">Detalji</p>
                  <p className="text-xs text-slate-500 text-center mt-1">Otvori oglas</p>
                </div>
              )}
            </div>
          ))}

          {/* Selection */}
          {isSelectable && (
            <div
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
            </div>
          )}

          {/* Top-left badges (premium / sale) */}
          {!isViewMoreSlide && (
            <div className={cn("absolute top-2 z-20 flex items-center gap-2", isSelectable ? "left-9" : "left-2")}>
              {data?.is_feature ? (
                <OverlayPill icon={Rocket} className="text-amber-700 bg-amber-100/90 border-amber-200">
                  
                </OverlayPill>
              ) : null}

              {isOnSale && discountPercentage > 0 ? (
                <OverlayPill icon={BadgePercent} className="text-rose-700 bg-rose-100/90 border-rose-200">
                  
                </OverlayPill>
              ) : null}
            </div>
          )}

          {/* Top-right menu */}
          <div
            className="absolute top-2 right-2 z-30"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className={cn(
                    "h-8 w-8 rounded-full",
                    "bg-white/90 backdrop-blur-sm",
                    "border-slate-200 shadow-sm",
                    "hover:bg-white"
                  )}
                >
                  <MoreVertical className="w-4 h-4 text-slate-700" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-52">
                {isEditable ? (
                  <DropdownMenuItem
                    onClick={() => onContextMenuAction?.("edit", data?.id)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Uredi oglas</span>
                  </DropdownMenuItem>
                ) : null}

                {isApproved ? (
                  <DropdownMenuItem
                    onClick={() => onContextMenuAction?.("deactivate", data?.id)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <EyeOff className="w-4 h-4" />
                    <span>Sakrij oglas</span>
                  </DropdownMenuItem>
                ) : null}

                {isInactive ? (
                  <DropdownMenuItem
                    onClick={() => onContextMenuAction?.("activate", data?.id)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-green-600">Otkrij</span>
                  </DropdownMenuItem>
                ) : null}

                {isApproved && !isSoldOut ? (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSoldOutClick();
                    }}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <CheckCircle className="w-4 h-4 text-blue-600" />
                    <span className="text-blue-600">Označi kao prodano</span>
                  </DropdownMenuItem>
                ) : null}

                {isExpired || isEditable ? <DropdownMenuSeparator /> : null}

                {isExpired ? (
                  <DropdownMenuItem
                    onClick={() => onContextMenuAction?.("renew", data?.id)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4 text-primary" />
                    <span className="text-primary">{t("renew")}</span>
                  </DropdownMenuItem>
                ) : null}

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={() => onContextMenuAction?.("delete", data?.id)}
                  className="flex items-center gap-2 text-destructive focus:text-destructive cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Izbriši</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Bottom-left meta pills */}
          {!isViewMoreSlide && (
            <div className="absolute bottom-2 left-2 z-20 flex items-center gap-2">
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
            </div>
          )}

          {/* Dots */}
          {totalSlides > 1 ? (
            <div className="absolute bottom-2 right-2 z-20 hidden sm:flex items-center gap-1.5">
              {slides.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={(e) => goToSlide(e, index)}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    index === currentSlide ? "w-6 bg-white shadow-sm" : "w-1.5 bg-white/70"
                  )}
                  aria-label={`Slide ${index + 1}`}
                />
              ))}
            </div>
          ) : null}

          {/* Prev/Next */}
          {totalSlides > 1 ? (
            <>
              <button
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
                    : "opacity-0 ltr:-translate-x-3 rtl:translate-x-3 pointer-events-none",
                  isSelectable ? "pointer-events-none opacity-0" : ""
                )}
                aria-label="Prethodna slika"
              >
                <ChevronLeft className="w-4 h-4 text-slate-700 rtl:rotate-180" />
              </button>

              <button
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
                    : "opacity-0 ltr:translate-x-3 rtl:-translate-x-3 pointer-events-none",
                  isSelectable ? "pointer-events-none opacity-0" : ""
                )}
                aria-label="Sljedeća slika"
              >
                <ChevronRight className="w-4 h-4 text-slate-700 rtl:rotate-180" />
              </button>
            </>
          ) : null}
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex flex-col gap-2 p-3 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-slate-900 line-clamp-2 leading-snug group-hover:text-primary transition-colors">
            {title}
          </h3>

          {status ? (
            <div className="shrink-0">
              <GetMyAdStatus
                status={status}
                isApprovedSort={isApprovedSort}
                isFeature={data?.is_feature}
                isJobCategory={isJobCategory}
              />
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-1 min-w-0">
            <MapPin className="w-3.5 h-3.5" />
            <span className="truncate max-w-[160px]">{displayCity}</span>
          </div>
          <span className="text-slate-300">•</span>
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{formatRelativeTime(data?.created_at)}</span>
          </div>
        </div>

        {Array.isArray(keyAttributes) && keyAttributes.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {keyAttributes.map((attr, index) => (
              <span
                key={`${attr}-${index}`}
                className={cn(
                  "inline-flex items-center",
                  "px-2 py-0.5 rounded-md border",
                  "bg-slate-50 text-slate-700 border-slate-100",
                  "text-[10px] font-semibold"
                )}
              >
                {attr}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-auto pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <StatChip icon={Eye} value={data?.clicks || 0} title="Ukupan broj pregleda" />
            <StatChip
              icon={Heart}
              value={data?.total_likes || 0}
              title="Ukupan broj sviđanja"
              className="bg-rose-50 text-rose-700 border-rose-100"
            />
          </div>

          {!isHidePrice ? (
            <span className="text-sm font-bold text-slate-900">
              {isJobCategory
                ? formatSalaryRange(data?.min_salary, data?.max_salary)
                : formatPriceAbbreviated(data?.price)}
            </span>
          ) : null}
        </div>
      </div>

      {/* SOLD OUT MODAL */}
      <SoldOutModal
        productDetails={data}
        showSoldOut={isSoldOutDialogOpen}
        setShowSoldOut={setIsSoldOutDialogOpen}
        selectedRadioValue={selectedBuyerId}
        setSelectedRadioValue={setSelectedBuyerId}
        setShowConfirmModal={handleSoldOutAction}
      />
    </CustomLink>
  );

  return (
    <ContextMenu modal={false}>
      <ContextMenuTrigger asChild disabled={!isExpired}>
        {cardContent}
      </ContextMenuTrigger>

      <ContextMenuContent>
        <ContextMenuItem
          onClick={() => onContextMenuAction?.("select", data?.id)}
          className="flex items-center gap-2 cursor-pointer"
        >
          <CheckSquare className="w-4 h-4" />
          <span>{isSelected ? "Poništi odabir" : "Odaberi"}</span>
        </ContextMenuItem>

        <ContextMenuItem
          onClick={() => onContextMenuAction?.("renew", data?.id)}
          className="flex items-center gap-2 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4 text-primary" />
          <span className="text-primary">{t("renew")}</span>
        </ContextMenuItem>

        <ContextMenuItem
          onClick={() => onContextMenuAction?.("delete", data?.id)}
          className="flex items-center gap-2 text-destructive focus:text-destructive cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
          <span>{t("remove") || "Izbriši"}</span>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default MyAdsCard;
