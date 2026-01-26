import { formatPriceAbbreviated, formatSalaryRange, t } from "@/utils";
import { useState, useMemo, useRef } from "react";
import { IoEye } from "react-icons/io5";
import { FaHeart, FaYoutube } from "react-icons/fa";
import { IoLocationOutline, IoTimeOutline } from "react-icons/io5";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { HiOutlineArrowRight } from "react-icons/hi";
import CustomImage from "@/components/Common/CustomImage";
import CustomLink from "@/components/Common/CustomLink";
import GetMyAdStatus from "./GetMyAdStatus";
import SoldOutModal from "../../PagesComponent/ProductDetail/SoldOutModal";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Checkbox } from "@/components/ui/checkbox";
import {
  RotateCcw,
  Trash2,
  CheckSquare,
  MoreVertical,
  EyeOff,
  CheckCircle,
  Edit,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IconRocket, IconRosetteDiscount } from "@tabler/icons-react";

// Helper function to format relative time
const formatRelativeTime = (dateString) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return "Upravo sada";

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    if (diffInMinutes === 1) return "Prije 1 min";
    return `Prije ${diffInMinutes} min`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    if (diffInHours === 1) return "Prije 1 sat";
    return `Prije ${diffInHours} sati`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    if (diffInDays === 1) return "Prije 1 dan";
    return `Prije ${diffInDays} dana`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    if (diffInMonths === 1) return "Prije 1 mj";
    return `Prije ${diffInMonths} mj`;
  }

  const diffInYears = Math.floor(diffInMonths / 12);
  if (diffInYears === 1) return "Prije 1 god";
  return `Prije ${diffInYears} god`;
};

// Funkcija za atribute (Godište, Gorivo...)
const getKeyAttributes = (item) => {
  const attributes = [];
  const customFields = item?.translated_custom_fields || [];

  const findValue = (keys) => {
    const field = customFields.find((f) => {
      const name = (f.translated_name || f.name || "").toLowerCase();
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

  if (attributes.length === 0) {
    return getSmartTagsFallback(item);
  }

  return attributes;
};

// Fallback funkcija
const getSmartTagsFallback = (item) => {
  const tags = [];
  const skipFields = ["stanje", "condition", "opis", "description", "naslov", "title"];
  const customFields = item?.translated_custom_fields || [];

  for (const field of customFields) {
    if (tags.length >= 3) break;
    const fieldName = (field.name || field.translated_name || "").toLowerCase();
    if (skipFields.some((skip) => fieldName.includes(skip))) continue;
    const value = field.translated_selected_values?.[0] || field?.value?.[0];
    if (value && typeof value === "string" && value.length < 25 && value.length > 0) {
      tags.push(value);
    }
  }
  return tags;
};

const MyAdsCard = ({
  data,
  isApprovedSort,
  isSelected = false,
  isSelectable = false,
  onSelectionToggle,
  onContextMenuAction,
}) => {
  const isJobCategory = Number(data?.category?.is_job_category) === 1;
  const translated_item = data?.translated_item;

  const keyAttributes = getKeyAttributes(data);
  const displayCity = data?.translated_city || data?.city || "";

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // STATE ZA SOLD OUT MODAL
  const [isSoldOutDialogOpen, setIsSoldOutDialogOpen] = useState(false);
  const [selectedBuyerId, setSelectedBuyerId] = useState(null);

  // Touch/Swipe ref
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

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

  const status = data?.status;
  const isExpired = status === "expired";
  const isInactive = status === "inactive";
  const isSoldOut = status === "sold out";
  const isApproved = status === "approved" || status === "featured";
  const hasVideo = data?.video_link && data?.video_link !== "";

  // 🔥 AKCIJA / SALE logika (isto kao u ProductCard)
  const isOnSale = data?.is_on_sale === true || data?.is_on_sale === 1;
  const oldPrice = data?.old_price;
  const currentPrice = data?.price;
  const discountPercentage =
    data?.discount_percentage ||
    (isOnSale &&
      oldPrice &&
      currentPrice &&
      Number(oldPrice) > Number(currentPrice)
      ? Math.round(
          ((Number(oldPrice) - Number(currentPrice)) / Number(oldPrice)) * 100
        )
      : 0);

  // Provjera da li je oglas editabilan
  const isEditable = isApproved;

  // Build slider images
  const allSlides = useMemo(() => {
    const slides = [];
    if (data?.image) {
      slides.push({ type: "image", src: data.image });
    }
    if (data?.gallery_images?.length) {
      data.gallery_images.forEach((img) => {
        const src = img?.image || img;
        if (src) slides.push({ type: "image", src });
      });
    }
    slides.push({ type: "viewMore" });
    return slides;
  }, [data?.image, data?.gallery_images]);

  const totalSlides = allSlides.length;
  const totalImages = totalSlides - 1;

  // Handlers for Slider
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
  const handleTouchStart = (e) => (touchStartX.current = e.touches[0].clientX);
  const handleTouchMove = (e) => (touchEndX.current = e.touches[0].clientX);
  const handleTouchEnd = (e) => {
    if (isSelectable) return;
    const swipeDistance = touchStartX.current - touchEndX.current;
    if (Math.abs(swipeDistance) > 50) {
      if (swipeDistance > 0)
        setCurrentSlide((prev) => (prev === totalSlides - 1 ? 0 : prev + 1));
      else setCurrentSlide((prev) => (prev === 0 ? totalSlides - 1 : prev - 1));
    }
  };

  const isViewMoreSlide = allSlides[currentSlide]?.type === "viewMore";

  // Handle sold out triggering modal
  const handleSoldOutClick = () => {
    setIsSoldOutDialogOpen(true);
  };

  // callback iz SoldOutModal-a
  const handleSoldOutAction = (shouldProcess) => {
    if (shouldProcess) {
      onContextMenuAction("markAsSoldOut", data?.id, selectedBuyerId);
      setIsSoldOutDialogOpen(false);
    }
  };

  // Card Content JSX
  const cardContent = (
    <CustomLink
      href={`/my-listing/${data?.slug}`}
      className={`bg-white border border-gray-100 rounded-2xl flex flex-col h-full group overflow-hidden transition-all duration-200 ${
        isSelected ? "ring-2 ring-primary bg-primary/5 shadow-md" : "hover:shadow-lg"
      } cursor-pointer`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={(e) => {
        if (isSelectable) {
          e.preventDefault();
          onSelectionToggle?.();
        }
      }}
    >
      {/* --- SLIDER SECTION --- */}
      <div
        className="relative overflow-hidden rounded-t-2xl touch-pan-y"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="relative aspect-square">
          {/* Images */}
          {allSlides.map((slide, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-all duration-500 ease-out ${
                index === currentSlide
                  ? "opacity-100 z-[1] scale-100"
                  : "opacity-0 z-0 scale-105"
              }`}
            >
              {slide.type === "image" ? (
                <CustomImage
                  src={slide.src}
                  width={288}
                  height={288}
                  className="w-full h-full object-cover"
                  alt={translated_item?.name || data?.name}
                />
              ) : (
                <div className="w-full h-full bg-[#76b6b0] flex flex-col items-center justify-center text-white p-6">
                  <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3">
                    <HiOutlineArrowRight size={30} />
                  </div>
                  <p className="text-lg font-semibold text-center mb-1">
                    Detalji
                  </p>
                </div>
              )}
            </div>
          ))}

          {!isViewMoreSlide && (
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/40 to-transparent pointer-events-none z-[2]" />
          )}
        </div>

        {/* Checkbox (MyAds specific) */}
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
              className="bg-white shadow-sm border-2 border-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary h-5 w-5"
            />
          </div>
        )}

        {/* 🚀 PREMIUM + 🏷️ AKCIJA IKONE (gornji lijevi ćošak) */}
        {!isViewMoreSlide && (
          <div
            className={`absolute top-2 ${
              isSelectable ? "left-9" : "left-2"
            } z-20 flex items-center gap-1.5`}
          >
            {/* PREMIUM / FEATURED */}
            {data?.is_feature && (
              <div className="flex items-center justify-center bg-gradient-to-r from-amber-300 via-yellow-500 to-amber-400 rounded-md w-[28px] h-[28px] shadow-sm backdrop-blur-sm">
                <IconRocket size={18} stroke={2} className="text-white" />
              </div>
            )}

            {/* AKCIJA / SALE */}
            {isOnSale && discountPercentage > 0 && (
              <div className="flex items-center justify-center bg-red-600 rounded-md w-[28px] h-[28px] shadow-sm backdrop-blur-sm">
                <IconRosetteDiscount size={18} stroke={2} className="text-white" />
              </div>
            )}
          </div>
        )}

        {/* Status badge sada u contentu (ako si već prebacio), pa ovdje nema GetMyAdStatus */}

        {/* DROPDOWN MENI - Gornji desni ugao */}
        <div
          className="absolute top-2 right-2 z-30 overflow-visible"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-8 h-8 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white hover:scale-110 transition-all duration-200">
                <MoreVertical size={16} className="text-gray-700" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {isEditable && (
                <DropdownMenuItem
                  onClick={() => onContextMenuAction("edit", data?.id)}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Edit className="size-4" />
                  <span>{"Uredi oglas"}</span>
                </DropdownMenuItem>
              )}

              {isApproved && (
                <DropdownMenuItem
                  onClick={() => onContextMenuAction("deactivate", data?.id)}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <EyeOff className="size-4" />
                  <span>{"Sakrij oglas"}</span>
                </DropdownMenuItem>
              )}

              {isInactive && (
                <DropdownMenuItem
                  onClick={() => onContextMenuAction("activate", data?.id)}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle className="size-4 text-green-600" />
                  <span className="text-green-600">{"Otkrij"}</span>
                </DropdownMenuItem>
              )}

              {isApproved && !isSoldOut && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSoldOutClick();
                  }}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle className="size-4 text-blue-600" />
                  <span className="text-blue-600">
                    {"Označi kao prodano"}
                  </span>
                </DropdownMenuItem>
              )}

              {(isExpired || isEditable) && <DropdownMenuSeparator />}

              {isExpired && (
                <DropdownMenuItem
                  onClick={() => onContextMenuAction("renew", data?.id)}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="size-4 text-primary" />
                  <span className="text-primary">{"Obnovi"}</span>
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() => onContextMenuAction("delete", data?.id)}
                className="flex items-center gap-2 text-destructive focus:text-destructive cursor-pointer"
              >
                <Trash2 className="size-4" />
                <span>{"Izbriši"}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Navigation Arrows */}
        {totalSlides > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrevSlide(e);
              }}
              className={`absolute ltr:left-2 rtl:right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/95 rounded-full items-center justify-center shadow-lg z-20 hidden sm:flex transition-all duration-300 ease-out hover:bg-white hover:scale-110 active:scale-95
                ${
                  isHovered
                    ? "opacity-100 translate-x-0"
                    : "opacity-0 ltr:-translate-x-4 rtl:translate-x-4 pointer-events-none"
                }`}
            >
              <FiChevronLeft size={16} className="text-gray-700 rtl:rotate-180" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNextSlide(e);
              }}
              className={`absolute ltr:right-2 rtl:left-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/95 rounded-full items-center justify-center shadow-lg z-20 hidden sm:flex transition-all duration-300 ease-out hover:bg-white hover:scale-110 active:scale-95
                ${
                  isHovered
                    ? "opacity-100 translate-x-0"
                    : "opacity-0 ltr:translate-x-4 rtl:-translate-x-4 pointer-events-none"
                }`}
            >
              <FiChevronRight size={16} className="text-gray-700 rtl:rotate-180" />
            </button>
          </>
        )}

        {/* Dots */}
        {totalSlides > 1 && (
          <div
            className={`absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20 transition-opacity duration-300 ${
              isHovered ? "opacity-100" : "opacity-0"
            }`}
          >
            {allSlides.map((_, index) => {
              const diff = Math.abs(index - currentSlide);
              if (
                diff > 1 &&
                !(currentSlide === 0 && index === totalSlides - 1) &&
                !(currentSlide === totalSlides - 1 && index === 0)
              )
                return null;

              return (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    goToSlide(e, index);
                  }}
                  className={`rounded-full transition-all duration-300 ease-out ${
                    index === currentSlide
                      ? "w-5 h-1.5 bg-white shadow-sm"
                      : "w-1.5 h-1.5 bg-white/60 hover:bg-white hover:scale-125"
                  }`}
                />
              );
            })}
          </div>
        )}

        {/* Media Counters */}
        {!isViewMoreSlide && (
          <div className="absolute bottom-2 ltr:right-2 rtl:left-2 z-10 flex items-center gap-1.5">
            {hasVideo && (
              <div className="bg-red-600/90 backdrop-blur-md text-white px-1.5 py-0.5 rounded flex items-center gap-1 shadow-sm">
                <FaYoutube size={12} />
              </div>
            )}
            {totalImages > 1 && (
              <div className="bg-black/50 backdrop-blur-md text-white text-[10px] font-medium px-1.5 py-0.5 rounded flex items-center gap-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3 w-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                {totalImages}
              </div>
            )}
          </div>
        )}
      </div>

      {/* --- CONTENT SECTION --- */}
      <div className="flex flex-col gap-1.5 p-2 flex-grow">
        {/* Naslov + status ikonice (GetMyAdStatus) */}
        <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors duration-200">

            {translated_item?.name || data?.name}
          </h3>
          {status && (
            <div className="shrink-0">
              <GetMyAdStatus
                status={status}
                isApprovedSort={isApprovedSort}
                isFeature={data?.is_feature}
                isJobCategory={isJobCategory}
              />
            </div>
          )}
        </div>

        {/* Location + Date */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <IoLocationOutline size={12} />
            <span className="truncate max-w-[100px]">{displayCity}</span>
          </div>
          <span className="text-gray-300">|</span>
          <div className="flex items-center gap-1">
            <IoTimeOutline size={12} />
            <span>{formatRelativeTime(data?.created_at)}</span>
          </div>
        </div>

        {/* Attributes */}
        {keyAttributes.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-0.5">
            {keyAttributes.map((attr, index) => (
              <span
                key={index}
                className="inline-flex px-1.5 py-0.5 bg-gray-50 text-gray-600 rounded text-[10px] font-medium border border-gray-100"
              >
                {attr}
              </span>
            ))}
          </div>
        )}

        <div className="flex-grow" />
        <div className="border-t border-gray-100 mt-1.5" />

        {/* Bottom Row: Stats & Price */}
        <div className="flex items-center justify-between gap-2 mt-1">
          {/* Stats */}
          <div className="flex items-center gap-2">
            <div
              className="flex items-center gap-1 bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-md transition-colors hover:bg-gray-200"
              title="Ukupan broj pregleda"
            >
              <IoEye size={12} />
              <span className="text-[10px] font-semibold">
                {data?.clicks || 0}
              </span>
            </div>

            <div
              className="flex items-center gap-1 bg-red-50 text-red-500 px-1.5 py-0.5 rounded-md transition-colors hover:bg-red-100"
              title="Ukupan broj sviđanja"
            >
              <FaHeart size={10} />
              <span className="text-[10px] font-semibold">
                {data?.total_likes || 0}
              </span>
            </div>
          </div>

          {!isHidePrice && (
            <span className="text-sm font-bold text-gray-900">
              {isJobCategory
                ? formatSalaryRange(data?.min_salary, data?.max_salary)
                : formatPriceAbbreviated(data?.price)}
            </span>
          )}
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
          onClick={() => onContextMenuAction("select")}
          className="flex items-center gap-2 cursor-pointer"
        >
          <CheckSquare className="size-4" />
          {isSelected ? "Poništi odabir" : "Odaberi"}
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() => onContextMenuAction("renew")}
          className="flex items-center gap-2 cursor-pointer"
        >
          <RotateCcw className="size-4 text-primary" />
          <span className="text-primary">{t("renew")}</span>
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() => onContextMenuAction("delete")}
          className="flex items-center gap-2 text-destructive focus:text-destructive cursor-pointer"
        >
          <Trash2 className="size-4" />
          {"remove"}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default MyAdsCard;
