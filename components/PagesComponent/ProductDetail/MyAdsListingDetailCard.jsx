"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Edit,
  Trash2,
  Copy,
  Share2,
  Eye,
  Heart,
  MessageCircle,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Star,
  Shield,
  TrendingUp,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { useSelector } from "react-redux";
import Link from "next/link";

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
  const months = ["januar", "februar", "mart", "april", "maj", "juni", "juli", "august", "septembar", "oktobar", "novembar", "decembar"];
  return `${day}. ${months[date.getMonth()]} ${date.getFullYear()}.`;
};

const formatNumber = (num) => {
  if (!num) return "0";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
};

// ============================================
// STATUS KOMPONENTE
// ============================================
const StatusIndicator = ({ status }) => {
  const config = {
    approved: { color: "bg-emerald-500", text: "Aktivan", icon: CheckCircle },
    pending: { color: "bg-amber-500", text: "Na čekanju", icon: Clock },
    rejected: { color: "bg-red-500", text: "Odbijen", icon: AlertCircle },
    scheduled: { color: "bg-blue-500", text: "Zakazano", icon: Calendar },
    reserved: { color: "bg-purple-500", text: "Rezervisano", icon: Shield },
    "sold out": { color: "bg-slate-500", text: "Prodano", icon: CheckCircle },
    expired: { color: "bg-slate-400", text: "Istekao", icon: Clock },
  };

  const { color, text, icon: Icon } = config[status] || { color: "bg-slate-400", text: status, icon: AlertCircle };

  return (
    <div className="flex items-center gap-2">
      <span className={cn("w-2 h-2 rounded-full", color)} />
      <span className="text-sm font-medium text-slate-700">{text}</span>
    </div>
  );
};

const StatItem = ({ icon: Icon, label, value, color = "text-slate-400" }) => (
  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
    <Icon className={cn("w-5 h-5", color)} />
    <div>
      <p className="text-lg font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  </div>
);

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
        toast.success("Oglas je uspješno obrisan");
        navigate("/my-ads");
      } else {
        toast.error(res?.data?.message || "Greška pri brisanju");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Greška pri brisanju oglasa");
    } finally {
      setIsDeleting(false);
      setIsDeleteOpen(false);
    }
  };

  const handleDuplicate = () => {
    // Navigacija na kreiranje novog oglasa sa podacima postojećeg
    navigate(`/ad-listing?duplicate=${productDetails?.id}`);
    toast.success("Kreiraj kopiju oglasa");
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-slate-200 overflow-hidden"
      >
        {/* Header sa nazivom i statusom */}
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {isFeatured && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
                    <Star className="w-3 h-3" />
                    Istaknuto
                  </span>
                )}
              </div>
              
              {/* Naziv */}
              <h2 className="text-lg font-bold text-slate-900 line-clamp-2">{productName}</h2>
              
              {/* Meta info */}
              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm">
                <StatusIndicator status={productDetails?.status} />
                <span className="text-slate-400">ID: #{productDetails?.id}</span>
                <span className="text-slate-400">{formatDate(productDetails?.created_at)}</span>
              </div>
            </div>

            {/* Share button */}
            {productDetails?.status === "approved" && (
              <ShareDropdown
                url={currentUrl}
                title={shareTitle}
                headline={shareHeadline}
                companyName={CompanyName}
              >
                <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                  <Share2 className="w-5 h-5" />
                </button>
              </ShareDropdown>
            )}
          </div>
        </div>

        {/* Cijena */}
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-100">
          <p className="text-xs text-slate-500 mb-1">Cijena</p>
          <p className="text-2xl font-bold text-primary">{formatPrice(productDetails?.price)}</p>
        </div>

        {/* Statistika */}
        <div className="p-5 border-b border-slate-100">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Statistika</p>
          <div className="grid grid-cols-3 gap-3">
            <StatItem
              icon={Eye}
              label="Pregledi"
              value={formatNumber(productDetails?.clicks || productDetails?.total_clicks || 0)}
              color="text-blue-500"
            />
            <StatItem
              icon={Heart}
              label="Sačuvano"
              value={formatNumber(productDetails?.favourites_count || 0)}
              color="text-red-500"
            />
            <StatItem
              icon={MessageCircle}
              label="Poruke"
              value={formatNumber(productDetails?.total_messages || 0)}
              color="text-emerald-500"
            />
          </div>
        </div>

        {/* Akcije */}
        <div className="p-5 space-y-3">
          {/* Primarne akcije */}
          <div className="grid grid-cols-2 gap-3">
            {isEditable && (
              <Link
                href={`/edit-listing/${productDetails?.id}`}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-colors"
              >
                <Edit className="w-4 h-4" />
                Uredi
              </Link>
            )}
            <button
              onClick={() => setIsDeleteOpen(true)}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 font-medium rounded-xl hover:bg-red-100 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Obriši
            </button>
          </div>

          {/* Sekundarne akcije */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleDuplicate}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors"
            >
              <Copy className="w-4 h-4" />
              Dupliciraj
            </button>
            <Link
              href={`/ad-details/${productDetails?.slug}`}
              target="_blank"
              className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Pogledaj
            </Link>
          </div>

          {/* Promocija - ako nije istaknuto i status je approved */}
          {!isFeatured && productDetails?.status === "approved" && (
            <Link
              href={`/featured-ads?item=${productDetails?.id}`}
              className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all"
            >
              <TrendingUp className="w-4 h-4" />
              Promoviši oglas
            </Link>
          )}
        </div>
      </motion.div>

      {/* Delete confirmation */}
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
