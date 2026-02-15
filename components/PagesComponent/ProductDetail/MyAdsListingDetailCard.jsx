"use client";

import { useState } from "react";
import { useSelector } from "react-redux";
import Link from "next/link";
import { toast } from "@/utils/toastBs";

import {
  IoCreateOutline,
  IoTrashOutline,
  IoStatsChartOutline,
  IoRocketOutline,
  IoCalendarOutline,
  IoChevronForward,
  IoTimeOutline,
  IoCheckmarkCircleOutline,
  IoAlertCircleOutline,
  IoCloseCircleOutline,
  IoClose,
} from "@/components/Common/UnifiedIconPack";

import { deleteItemApi } from "@/utils/api";
import { getCompanyName } from "@/redux/reducer/settingSlice";
import ReusableAlertDialog from "@/components/Common/ReusableAlertDialog";
import { useNavigate } from "@/components/Common/useNavigate";
import AdStatisticsSection from "@/components/PagesComponent/MyAds/AdStatisticsSection";
import { cn } from "@/lib/utils";

// ============================================
// HELPERI
// ============================================
const formatPrice = (price) => {
  if (price === null || price === undefined || Number(price) === 0) return "Na upit";
  return new Intl.NumberFormat("bs-BA", { minimumFractionDigits: 0 }).format(Number(price)) + " KM";
};

const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  const day = date.getDate();
  const months = ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "avg", "sep", "okt", "nov", "dec"];
  return `${day}. ${months[date.getMonth()]} ${date.getFullYear()}`;
};

const getStatusInfo = (status) => {
  const statusMap = {
    approved: {
      label: "Aktivan",
      icon: IoCheckmarkCircleOutline,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-100",
    },
    pending: {
      label: "Na čekanju",
      icon: IoTimeOutline,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-100",
    },
    rejected: {
      label: "Odbijen",
      icon: IoCloseCircleOutline,
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-100",
    },
    "permanent rejected": {
      label: "Trajno odbijen",
      icon: IoCloseCircleOutline,
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-100",
    },
    inactive: {
      label: "Neaktivan",
      icon: IoAlertCircleOutline,
      color: "text-slate-600",
      bgColor: "bg-slate-50",
      borderColor: "border-slate-100",
    },
    "sold out": {
      label: "Prodato",
      icon: IoCheckmarkCircleOutline,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-100",
    },
    expired: {
      label: "Isteklo",
      icon: IoAlertCircleOutline,
      color: "text-slate-600",
      bgColor: "bg-slate-50",
      borderColor: "border-slate-100",
    },
  };

  return statusMap[status] || statusMap.inactive;
};

// ============================================
// UI KOMPONENTE
// ============================================
const MenuSection = ({ title, children }) => (
  <div className="py-1.5">
    {title && (
      <p className="px-3 py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
        {title}
      </p>
    )}
    <div className="space-y-0.5">{children}</div>
  </div>
);

const MenuDivider = () => <div className="h-px bg-slate-100 mx-3 my-1" />;

const MenuItem = ({
  icon: Icon,
  label,
  href,
  onClick,
  description,
  danger,
  external,
  disabled,
  highlighted,
}) => {
  const content = (
    <div
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer group",
        danger
          ? "text-red-600 hover:bg-red-50"
          : highlighted
          ? "text-primary hover:bg-primary/5"
          : "text-slate-700 hover:bg-slate-50/80 hover:text-slate-900",
        disabled && "opacity-50 pointer-events-none"
      )}
      onClick={disabled ? undefined : onClick}
      role="button"
      tabIndex={disabled ? -1 : 0}
    >
      <div
        className={cn(
          "w-9 h-9 rounded-lg flex items-center justify-center transition-colors",
          danger 
            ? "bg-red-50 group-hover:bg-red-100" 
            : highlighted
            ? "bg-primary/10 group-hover:bg-primary/20"
            : "bg-slate-100 group-hover:bg-slate-200/70"
        )}
      >
        <Icon
          size={18}
          className={
            danger 
              ? "text-red-500" 
              : highlighted
              ? "text-primary"
              : "text-slate-500 group-hover:text-slate-700"
          }
        />
      </div>

      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium block">{label}</span>
        {description && (
          <span className="text-[11px] text-slate-400 block truncate">
            {description}
          </span>
        )}
      </div>

      {external && <IoChevronForward size={14} className="text-slate-300" />}
    </div>
  );

  if (href && !onClick) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }

  return content;
};

// ============================================
// GLAVNA KOMPONENTA
// ============================================
const MyAdsListingDetailCard = ({ productDetails, onMakeFeatured }) => {
  const { navigate } = useNavigate();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);

  if (!productDetails) return null;

  const productName = productDetails?.translated_item?.name || productDetails?.name || "Oglas";
  const internalCode = String(productDetails?.seller_product_code || "").trim();
  const statusInfo = getStatusInfo(productDetails?.status);
  const StatusIcon = statusInfo.icon;

  // Provjeri da li je moguće uređivati
  const isEditable = productDetails?.status && !["permanent rejected", "inactive", "sold out", "expired"].includes(productDetails.status);
  
  // Provjeri da li može biti izdvojen
  const canBeFeatured = productDetails?.status === "approved" && !productDetails?.is_feature;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await deleteItemApi.deleteItem({ item_id: productDetails?.id });
      if (!res?.data?.error) {
        toast.success("Oglas uspješno obrisan");
        navigate("/my-ads");
      } else {
        toast.error(res?.data?.message || "Greška pri brisanju");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Greška pri brisanju");
    } finally {
      setIsDeleting(false);
      setIsDeleteOpen(false);
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
        <div className="px-3 pt-3">
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 dark:border-slate-700 dark:bg-slate-900/50 p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="line-clamp-2 text-sm font-semibold text-slate-900 dark:text-slate-100">{productName}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                  <span>ID: #{productDetails?.id}</span>
                  {productDetails?.created_at ? <span>Kreiran: {formatDate(productDetails.created_at)}</span> : null}
                </div>
              </div>

              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[11px] font-semibold whitespace-nowrap",
                  statusInfo.borderColor,
                  statusInfo.bgColor,
                  statusInfo.color
                )}
              >
                <StatusIcon size={12} />
                {statusInfo.label}
              </span>
            </div>

            {internalCode ? (
              <div className="mt-2 inline-flex max-w-full items-center gap-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-[11px]">
                <span className="font-medium text-slate-500 dark:text-slate-400">Interna šifra:</span>
                <span className="truncate font-semibold text-slate-800 dark:text-slate-100">{internalCode}</span>
              </div>
            ) : null}
          </div>
        </div>

        {/* HEADER */}
        {/* <div className="px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-slate-900 truncate mb-2">
              {productName}
            </h2>
            <div className="flex items-center gap-3 text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5">
                <IoCalendarOutline size={12} />
                <span>{formatDate(productDetails?.created_at)}</span>
              </div>
              <span className="text-slate-300">·</span>
              <span>ID: #{productDetails?.id}</span>
            </div>
          </div>
        </div> */}

        {/* STATUS */}
        {/* <div className={cn(
          "px-4 py-3 border-b border-slate-100",
          statusInfo.bgColor
        )}>
          <p className="text-[11px] text-slate-400 mb-1.5 uppercase tracking-wide font-semibold">
            Status
          </p>
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              statusInfo.bgColor,
              "border",
              statusInfo.borderColor
            )}>
              <StatusIcon size={18} className={statusInfo.color} />
            </div>
            <span className={cn("text-sm font-bold", statusInfo.color)}>
              {statusInfo.label}
            </span>
          </div>
        </div> */}

        {/* CIJENA */}
        {/* <div className="px-4 py-3 border-b border-slate-100 bg-gradient-to-br from-slate-50/50 to-white">
          <p className="text-[11px] text-slate-400 mb-1 uppercase tracking-wide font-semibold">
            Cijena
          </p>
          <p className="text-xl font-bold text-primary">
            {formatPrice(productDetails?.price)}
          </p>
        </div> */}

        {/* AKCIJE */}
        <div className="px-2 pb-2">
          <MenuSection title="Brze akcije">
            {isEditable && (
              <MenuItem
                icon={IoCreateOutline}
                label="Uredi oglas"
                description="Izmijeni podatke oglasa"
                href={`/edit-listing/${productDetails?.id}`}
                external
              />
            )}
            
            {canBeFeatured && (
              <MenuItem
                icon={IoRocketOutline}
                label="Izdvoji oglas"
                description="Povećaj vidljivost oglasa"
                onClick={onMakeFeatured}
                highlighted
              />
            )}

            <MenuItem
              icon={IoStatsChartOutline}
              label="Statistika oglasa"
              description="Pregledi i interakcije"
              onClick={() => setShowStatsModal(true)}
            />
          </MenuSection>

          {/* <MenuDivider /> */}

          {/* BRISANJE */}
          {/* <MenuSection title="Zona opasnosti">
            <MenuItem
              icon={IoTrashOutline}
              label="Obriši oglas"
              description="Trajno ukloni ovaj oglas"
              onClick={() => setIsDeleteOpen(true)}
              danger
            />
          </MenuSection> */}
        </div>
      </div>

      {/* STATISTIKA MODAL */}
      {showStatsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in" 
            onClick={() => setShowStatsModal(false)} 
          />
          <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <IoStatsChartOutline className="text-blue-500" /> Statistika oglasa
              </h3>
              <button 
                onClick={() => setShowStatsModal(false)} 
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400 transition-colors"
              >
                <IoClose size={24} />
              </button>
            </div>
            <div className="overflow-y-auto p-6 flex-1 bg-white dark:bg-slate-900">
              <AdStatisticsSection itemId={productDetails.id} />
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION */}
      <ReusableAlertDialog
        open={isDeleteOpen}
        onCancel={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Obriši oglas?"
        description="Ova akcija je nepovratna. Oglas će biti trajno obrisan iz sistema."
        cancelText="Odustani"
        confirmText={isDeleting ? "Brisanje..." : "Da, obriši"}
        confirmDisabled={isDeleting}
        confirmClassName="bg-red-600 hover:bg-red-700"
      />
    </>
  );
};

export default MyAdsListingDetailCard;
