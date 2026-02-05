"use client";

import { useState } from "react";
import { useSelector } from "react-redux";
import Link from "next/link";
import { toast } from "sonner";

import {
  IoCreateOutline,
  IoTrashOutline,
  IoCopyOutline,
  IoShareSocialOutline,
  IoEyeOutline,
  IoHeartOutline,
  IoChatbubbleOutline,
  IoCalendarOutline,
  IoCheckmarkCircleOutline,
  IoTimeOutline,
  IoAlertCircleOutline,
  IoStarOutline,
  IoShieldCheckmarkOutline,
  IoTrendingUpOutline,
  IoOpenOutline,
  IoChevronForward,
} from "react-icons/io5";

import { deleteItemApi } from "@/utils/api";
import { getCompanyName } from "@/redux/reducer/settingSlice";
import ShareDropdown from "@/components/Common/ShareDropdown";
import ReusableAlertDialog from "@/components/Common/ReusableAlertDialog";
import { useNavigate } from "@/components/Common/useNavigate";
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

const formatNumber = (num) => {
  if (!num) return "0";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
};

// ============================================
// UI KOMPONENTE - ProfileDropdown stil
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
  badge,
  disabled,
}) => {
  const content = (
    <div
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer group",
        danger
          ? "text-red-600 hover:bg-red-50"
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
          danger ? "bg-red-50 group-hover:bg-red-100" : "bg-slate-100 group-hover:bg-slate-200/70"
        )}
      >
        <Icon
          size={18}
          className={danger ? "text-red-500" : "text-slate-500 group-hover:text-slate-700"}
        />
      </div>

      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium block">{label}</span>
        {description && <span className="text-[11px] text-slate-400 block truncate">{description}</span>}
      </div>

      {badge && (
        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full">
          {badge}
        </span>
      )}

      {external && <IoChevronForward size={14} className="text-slate-300" />}
    </div>
  );

  if (href && !onClick) {
    return (
      <Link href={href} className="block" target={external ? "_blank" : undefined}>
        {content}
      </Link>
    );
  }

  return content;
};

const QuickStat = ({ icon: Icon, value, label, color = "blue" }) => {
  const colors = {
    blue: "text-blue-500 bg-blue-50",
    green: "text-green-500 bg-green-50",
    amber: "text-amber-500 bg-amber-50",
    purple: "text-purple-500 bg-purple-50",
    red: "text-red-500 bg-red-50",
  };

  return (
    <div className="flex flex-col items-center gap-1 p-2">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colors[color]}`}>
        <Icon size={16} />
      </div>
      <span className="text-sm font-bold text-slate-800">{value}</span>
      <span className="text-[10px] text-slate-400 font-medium">{label}</span>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const config = {
    approved: { color: "bg-green-50 text-green-700 border-green-200", icon: IoCheckmarkCircleOutline, text: "Aktivan" },
    pending: { color: "bg-amber-50 text-amber-700 border-amber-200", icon: IoTimeOutline, text: "Na čekanju" },
    rejected: { color: "bg-red-50 text-red-700 border-red-200", icon: IoAlertCircleOutline, text: "Odbijen" },
    scheduled: { color: "bg-blue-50 text-blue-700 border-blue-200", icon: IoCalendarOutline, text: "Zakazano" },
    reserved: { color: "bg-purple-50 text-purple-700 border-purple-200", icon: IoShieldCheckmarkOutline, text: "Rezervisano" },
    "sold out": { color: "bg-slate-100 text-slate-600 border-slate-200", icon: IoCheckmarkCircleOutline, text: "Prodano" },
    expired: { color: "bg-slate-100 text-slate-500 border-slate-200", icon: IoTimeOutline, text: "Istekao" },
  };

  const { color, icon: Icon, text } = config[status] || config.pending;

  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border", color)}>
      <Icon size={12} />
      {text}
    </span>
  );
};

// ============================================
// GLAVNA KOMPONENTA
// ============================================
const MyAdsListingDetailCard = ({ productDetails }) => {
  const { navigate } = useNavigate();
  const CompanyName = useSelector(getCompanyName);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!productDetails) return null;

  const productName = productDetails?.translated_item?.name || productDetails?.name || "Oglas";
  const currentUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/ad-details/${productDetails?.slug}`;
  const shareTitle = `${productName} | ${CompanyName}`;
  const shareHeadline = `Pogledaj "${productName}" na ${CompanyName}`;

  const isFeatured = productDetails?.is_feature === 1;
  const isEditable = productDetails?.status && !["permanent rejected", "inactive", "sold out", "expired"].includes(productDetails.status);

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

  const handleDuplicate = () => {
    navigate(`/ad-listing?duplicate=${productDetails?.id}`);
    toast.success("Kreiraj kopiju oglasa");
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {/* HEADER */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <StatusBadge status={productDetails?.status} />
              {isFeatured && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-semibold border border-amber-200">
                  <IoStarOutline size={10} />
                  Istaknuto
                </span>
              )}
            </div>
            <h2 className="text-sm font-semibold text-slate-900 truncate">{productName}</h2>
            <p className="text-[11px] text-slate-400">ID: #{productDetails?.id} · {formatDate(productDetails?.created_at)}</p>
          </div>

          {productDetails?.status === "approved" && (
            <ShareDropdown url={currentUrl} title={shareTitle} headline={shareHeadline} companyName={CompanyName}>
              <button className="w-9 h-9 rounded-lg flex items-center justify-center bg-slate-100 hover:bg-slate-200 transition-colors">
                <IoShareSocialOutline size={16} className="text-slate-500" />
              </button>
            </ShareDropdown>
          )}
        </div>

        {/* PRICE */}
        <div className="px-4 py-3 border-b border-slate-100 bg-gradient-to-br from-slate-50/50 to-white">
          <p className="text-[11px] text-slate-400 mb-1">Cijena</p>
          <p className="text-xl font-bold text-primary">{formatPrice(productDetails?.price)}</p>
        </div>

        {/* QUICK STATS */}
        <div className="px-4 py-3 border-b border-slate-100">
          <div className="grid grid-cols-3 gap-1 bg-slate-50 rounded-xl p-2 border border-slate-100">
            <QuickStat
              icon={IoEyeOutline}
              value={formatNumber(productDetails?.clicks || productDetails?.total_clicks || 0)}
              label="Pregledi"
              color="blue"
            />
            <QuickStat
              icon={IoHeartOutline}
              value={formatNumber(productDetails?.favourites_count || 0)}
              label="Sačuvano"
              color="red"
            />
            <QuickStat
              icon={IoChatbubbleOutline}
              value={formatNumber(productDetails?.total_messages || 0)}
              label="Poruke"
              color="green"
            />
          </div>
        </div>

        {/* CONTENT */}
        <div className="px-2 pb-2">
          {/* PRIMARY ACTIONS */}
          <MenuSection title="Akcije">
            {isEditable && (
              <MenuItem
                icon={IoCreateOutline}
                label="Uredi oglas"
                description="Izmijeni podatke oglasa"
                href={`/edit-listing/${productDetails?.id}`}
                external
              />
            )}
            <MenuItem
              icon={IoCopyOutline}
              label="Dupliciraj"
              description="Napravi kopiju ovog oglasa"
              onClick={handleDuplicate}
            />
            <MenuItem
              icon={IoOpenOutline}
              label="Pogledaj oglas"
              description="Otvori javni prikaz"
              href={`/ad-details/${productDetails?.slug}`}
              external
            />
          </MenuSection>

          <MenuDivider />

          {/* PROMOTE */}
          {!isFeatured && productDetails?.status === "approved" && (
            <>
              <MenuSection title="Promocija">
                <Link
                  href={`/featured-ads?item=${productDetails?.id}`}
                  className="flex items-center gap-4 mx-3 p-3 bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 rounded-xl border border-amber-200/50 hover:border-amber-300 transition-all group"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <IoTrendingUpOutline size={20} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <h5 className="text-sm font-semibold text-slate-800">Promoviši oglas</h5>
                    <p className="text-[11px] text-slate-500">Povećaj vidljivost do 10x</p>
                  </div>
                  <IoChevronForward className="text-amber-400 group-hover:translate-x-1 transition-transform" size={18} />
                </Link>
              </MenuSection>
              <MenuDivider />
            </>
          )}

          {/* DANGER ZONE */}
          <MenuSection title="Zona opasnosti">
            <MenuItem
              icon={IoTrashOutline}
              label="Obriši oglas"
              description="Trajno ukloni ovaj oglas"
              onClick={() => setIsDeleteOpen(true)}
              danger
            />
          </MenuSection>
        </div>
      </div>

      {/* DELETE CONFIRMATION */}
      <ReusableAlertDialog
        open={isDeleteOpen}
        onCancel={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Obriši oglas?"
        description="Ova akcija je nepovratna. Oglas će biti trajno obrisan."
        cancelText="Odustani"
        confirmText={isDeleting ? "Brisanje..." : "Da, obriši"}
        confirmDisabled={isDeleting}
        confirmClassName="bg-red-600 hover:bg-red-700"
      />
    </>
  );
};

export default MyAdsListingDetailCard;
