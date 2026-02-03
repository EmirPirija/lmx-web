"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

import Layout from "@/components/Layout/Layout";
import BreadCrumb from "@/components/BreadCrumb/BreadCrumb";
import CustomImage from "@/components/Common/CustomImage";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { formatDate, formatPriceAbbreviated, t, truncate } from "@/utils";
import { userSignUpData, getIsLoggedIn } from "@/redux/reducer/authSlice";
import { itemOfferApi } from "@/utils/api";

import {
  Banknote,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle2,
  XCircle,
  MessageCircle,
  Loader2,
  RefreshCw,
  Package,
  User,
  Calendar,
  TrendingUp,
  TrendingDown,
  Check,
  X,
  Send,
  ChevronRight,
  Phone,
  Mail,
  BadgeCheck,
  Star,
  Eye,
  ExternalLink,
} from "lucide-react";

/* =====================================================
   ANIMACIJE
===================================================== */

const fadeInUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

const staggerContainer = {
  animate: {
    transition: { staggerChildren: 0.08 },
  },
};

/* =====================================================
   AVATAR KOMPONENTA
===================================================== */

const UserAvatar = ({ src, name, size = "md", className }) => {
  const sizeClasses = {
    sm: "w-10 h-10",
    md: "w-14 h-14",
    lg: "w-20 h-20",
    xl: "w-24 h-24",
  };

  return (
    <div
      className={cn(
        sizeClasses[size],
        "rounded-xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex-shrink-0",
        className
      )}
    >
      {src ? (
        <CustomImage
          src={src}
          alt={name || "Korisnik"}
          width={96}
          height={96}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800">
          <User className="w-1/2 h-1/2 text-slate-400" />
        </div>
      )}
    </div>
  );
};

/* =====================================================
   STATUS BADGE
===================================================== */

const StatusBadge = ({ status }) => {
  const config = {
    pending: {
      icon: Clock,
      text: "Na čekanju",
      className:
        "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-700/50",
    },
    accepted: {
      icon: CheckCircle2,
      text: "Prihvaćeno",
      className:
        "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700/50",
    },
    rejected: {
      icon: XCircle,
      text: "Odbijeno",
      className:
        "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-700/50",
    },
    countered: {
      icon: RefreshCw,
      text: "Kontra-ponuda",
      className:
        "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-700/50",
    },
  };

  const { icon: Icon, text, className } = config[status] || config.pending;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border",
        className
      )}
    >
      <Icon size={12} />
      {text}
    </span>
  );
};

/* =====================================================
   TAB BUTTON
===================================================== */

const TabButton = ({ active, onClick, children, count, icon: Icon }) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all duration-200",
      active
        ? "bg-primary text-white shadow-lg"
        : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
    )}
  >
    {Icon && <Icon size={18} />}
    {children}
    {typeof count === "number" && count > 0 && (
      <span
        className={cn(
          "px-2 py-0.5 rounded-full text-xs font-bold",
          active
            ? "bg-white/20 text-white"
            : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
        )}
      >
        {count}
      </span>
    )}
  </button>
);

/* =====================================================
   USER CARD (Lijeva strana)
===================================================== */

const OfferUserCard = ({ offer, type }) => {
  const router = useRouter();
  const isSelling = type === "received";

  // Dobij podatke o drugoj osobi
  const personName = isSelling
    ? offer.buyer_name || offer.buyer?.name
    : offer.seller_name || offer.seller?.name;
  const personId = isSelling
    ? offer.buyer_id || offer.buyer?.id
    : offer.seller_id || offer.seller?.id;
  const personAvatar = isSelling
    ? offer.buyer_avatar || offer.buyer?.profile || offer.buyer?.profile_image
    : offer.seller_avatar || offer.seller?.profile || offer.seller?.profile_image;
  const personEmail = isSelling
    ? offer.buyer_email || offer.buyer?.email
    : offer.seller_email || offer.seller?.email;
  const personPhone = isSelling
    ? offer.buyer_phone || offer.buyer?.mobile
    : offer.seller_phone || offer.seller?.mobile;
  const personVerified = isSelling
    ? offer.buyer?.is_verified
    : offer.seller?.is_verified;
  const personMemberSince = isSelling
    ? offer.buyer?.created_at
    : offer.seller?.created_at;

  const roleLabel = isSelling ? "Kupac" : "Prodavač";
  const roleDescription = isSelling
    ? "Poslao vam je ponudu"
    : "Prima vašu ponudu";

  const handleViewProfile = () => {
    if (personId) {
      router.push(`/seller/${personId}`);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 h-full">
      {/* Label */}
      <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-4">
        {roleLabel}
      </div>

      {/* Avatar & Name */}
      <div className="flex flex-col items-center text-center">
        <div className="relative mb-3">
          <UserAvatar src={personAvatar} name={personName} size="xl" />
          {personVerified && (
            <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-900 rounded-lg p-0.5 shadow-sm border border-slate-200 dark:border-slate-700">
              <BadgeCheck className="w-5 h-5 text-sky-500" />
            </div>
          )}
        </div>

        <h4 className="text-base font-bold text-slate-900 dark:text-white truncate max-w-full">
          {personName || "Nepoznat korisnik"}
        </h4>

        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {roleDescription}
        </p>

        {/* Member since */}
        {personMemberSince && (
          <div className="flex items-center gap-1.5 mt-3 text-xs text-slate-500 dark:text-slate-400">
            <Calendar className="w-3 h-3" />
            <span>Član od {formatDate(personMemberSince)}</span>
          </div>
        )}
      </div>

      {/* Contact info */}
      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
        {personEmail && (
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <Mail className="w-3.5 h-3.5 text-slate-400" />
            <span className="truncate">{truncate(personEmail, 25)}</span>
          </div>
        )}
        {personPhone && (
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <Phone className="w-3.5 h-3.5 text-slate-400" />
            <span>{personPhone}</span>
          </div>
        )}
      </div>

      {/* View profile button */}
      {personId && (
        <button
          onClick={handleViewProfile}
          className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors"
        >
          <Eye className="w-4 h-4" />
          Pogledaj profil
        </button>
      )}
    </div>
  );
};

/* =====================================================
   OFFER DETAILS (Desna strana)
===================================================== */

const OfferDetailsCard = ({
  offer,
  type,
  onAccept,
  onReject,
  onCounter,
  onChat,
  isLoading,
}) => {
  const router = useRouter();
  const isSelling = type === "received";
  const isPending = offer.status === "pending";

  const counteredAmount = offer.counter_amount || offer.counterAmount;

  // Cijene
  const offerAmount = Number(offer.amount) || 0;
  const itemPrice = Number(offer.item_price) || 0;
  const priceDiff = itemPrice - offerAmount;
  const priceDiffPercent = itemPrice
    ? Math.abs((priceDiff / itemPrice) * 100).toFixed(0)
    : 0;

  const handleViewItem = () => {
    if (offer.item_slug) {
      router.push(`/ad-details/${offer.item_slug}`);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <StatusBadge status={offer.status} />
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <Calendar size={12} />
          <span>{formatDate(offer.created_at)}</span>
        </div>
      </div>

      {/* Item info */}
      <div className="flex gap-4 mb-5">
        <div
          onClick={handleViewItem}
          className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 cursor-pointer group border border-slate-200 dark:border-slate-700"
        >
          <CustomImage
            src={offer.item_image}
            alt={offer.item_name}
            width={80}
            height={80}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
              <Package size={10} />
              Oglas #{offer.item_id}
            </span>
            {counteredAmount && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/30 text-[10px] font-semibold text-blue-700 dark:text-blue-300">
                <RefreshCw size={10} />
                Kontra {formatPriceAbbreviated(counteredAmount)}
              </span>
            )}
          </div>

          <h3
            onClick={handleViewItem}
            className="font-bold text-slate-900 dark:text-white text-sm line-clamp-2 cursor-pointer hover:text-primary transition-colors"
          >
            {offer.item_name || "Nepoznat artikal"}
          </h3>

          <button
            onClick={handleViewItem}
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            Pogledaj oglas
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Price comparison */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 rounded-xl bg-primary/5 dark:bg-primary/10 border border-primary/20">
          <p className="text-[10px] uppercase tracking-wider text-primary/70 font-medium mb-1">
            Ponuđena cijena
          </p>
          <p className="text-xl font-black text-primary">
            {formatPriceAbbreviated(offerAmount)}
          </p>
        </div>
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium mb-1">
            Tražena cijena
          </p>
          <p className="text-xl font-black text-slate-900 dark:text-white">
            {formatPriceAbbreviated(itemPrice)}
          </p>
        </div>
      </div>

      {/* Price difference indicator */}
      <div
        className={cn(
          "flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold mb-4",
          priceDiff > 0
            ? "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
            : "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
        )}
      >
        {priceDiff > 0 ? (
          <TrendingDown size={14} />
        ) : (
          <TrendingUp size={14} />
        )}
        <span>
          Ponuda je {priceDiff > 0 ? "niža" : "viša"} za {priceDiffPercent}% (
          {formatPriceAbbreviated(Math.abs(priceDiff))})
        </span>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
        {isSelling && isPending ? (
          <>
            <button
              onClick={() => onAccept(offer.id)}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Check size={16} />
              )}
              Prihvati
            </button>
            <button
              onClick={() => onReject(offer.id)}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <X size={16} />
              )}
              Odbij
            </button>
            <button
              onClick={() => onCounter(offer)}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Kontra-ponuda"
            >
              <RefreshCw size={16} />
              <span className="sm:hidden">Kontra</span>
            </button>
          </>
        ) : (
          <button
            onClick={() => onChat(offer)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-sm transition-colors"
          >
            <MessageCircle size={16} />
            Otvori chat
          </button>
        )}
      </div>
    </div>
  );
};

/* =====================================================
   OFFER CARD (Kombinacija user + details)
===================================================== */

const OfferCard = ({ offer, type, onAccept, onReject, onCounter, onChat, isLoading }) => {
  return (
    <motion.div
      variants={fadeInUp}
      className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4"
    >
      {/* Left: User Card */}
      <OfferUserCard offer={offer} type={type} />

      {/* Right: Offer Details */}
      <OfferDetailsCard
        offer={offer}
        type={type}
        onAccept={onAccept}
        onReject={onReject}
        onCounter={onCounter}
        onChat={onChat}
        isLoading={isLoading}
      />
    </motion.div>
  );
};

/* =====================================================
   EMPTY STATE
===================================================== */

const EmptyState = ({ type }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
      <Banknote size={40} className="text-slate-400" />
    </div>
    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
      Nema {type === "received" ? "primljenih" : "poslatih"} ponuda
    </h3>
    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
      {type === "received"
        ? "Kada neko pošalje ponudu za vaš oglas, pojavit će se ovdje."
        : "Kada pošaljete ponudu za neki oglas, pojavit će se ovdje."}
    </p>
  </div>
);

/* =====================================================
   SKELETON
===================================================== */

const OffersSkeleton = () => (
  <div className="space-y-6">
    {[1, 2, 3].map((i) => (
      <div key={i} className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
        <div className="h-72 rounded-2xl bg-slate-200/60 dark:bg-slate-800/60 animate-pulse" />
        <div className="h-72 rounded-2xl bg-slate-200/60 dark:bg-slate-800/60 animate-pulse" />
      </div>
    ))}
  </div>
);

/* =====================================================
   COUNTER OFFER MODAL
===================================================== */

const CounterOfferModal = ({ open, setOpen, offer, onSubmit, isLoading }) => {
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setAmount("");
      setError("");
    }
  }, [open]);

  const handleSubmit = () => {
    const numAmount = parseFloat(amount);

    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      setError("Molimo unesite validan iznos.");
      return;
    }

    if (numAmount <= offer?.amount) {
      setError("Kontra-ponuda mora biti veća od trenutne ponude.");
      return;
    }

    if (numAmount >= offer?.item_price) {
      setError("Kontra-ponuda mora biti manja od tražene cijene.");
      return;
    }

    onSubmit(offer.id, numAmount);
  };

  if (!offer) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-0 overflow-hidden">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <RefreshCw size={24} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Kontra-ponuda
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Predložite drugačiju cijenu
              </p>
            </div>
          </div>

          {/* Current prices */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
              <p className="text-xs text-slate-500 mb-1">Trenutna ponuda</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                {formatPriceAbbreviated(offer?.amount)}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
              <p className="text-xs text-slate-500 mb-1">Vaša cijena</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                {formatPriceAbbreviated(offer?.item_price)}
              </p>
            </div>
          </div>

          {/* Input */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Vaša kontra-ponuda
            </label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError("");
                }}
                placeholder="0"
                className={cn(
                  "w-full rounded-xl border bg-white dark:bg-slate-800",
                  "px-4 py-3 pr-14 text-lg font-bold text-slate-900 dark:text-white",
                  "placeholder:text-slate-400",
                  "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary",
                  "transition-all",
                  error
                    ? "border-red-300 dark:border-red-700"
                    : "border-slate-200 dark:border-slate-700"
                )}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                KM
              </span>
            </div>
            {error && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => setOpen(false)}
              className="flex-1 px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Odustani
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading || !amount}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  <Send size={18} />
                  Pošalji
                </>
              )}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/* =====================================================
   MAIN PAGE COMPONENT
===================================================== */

const OffersPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentUser = useSelector(userSignUpData);
  const isLoggedIn = useSelector(getIsLoggedIn);

  const initialTab = searchParams.get("tab") || "received";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [offers, setOffers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Counter modal
  const [counterModalOpen, setCounterModalOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);

  // Stats
  const [stats, setStats] = useState({
    receivedCount: 0,
    sentCount: 0,
  });

  // Check login
  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/");
    }
  }, [isLoggedIn, router]);

  // Fetch offers
  const fetchOffers = useCallback(
    async (pageNum = 1, type = activeTab) => {
      try {
        setIsLoading(pageNum === 1);

        const res = await itemOfferApi.getMyOffers({ type, page: pageNum });

        if (res?.data?.error === false) {
          const data = res.data.data;
          const offersData = data?.data || data || [];
          const currentPage = data?.current_page || 1;
          const lastPage = data?.last_page || 1;

          if (pageNum === 1) {
            setOffers(offersData);
          } else {
            setOffers((prev) => [...prev, ...offersData]);
          }

          setPage(currentPage);
          setHasMore(currentPage < lastPage);

          if (res.data.stats) {
            setStats(res.data.stats);
          }
        }
      } catch (err) {
        console.error("Error fetching offers:", err);
        toast.error("Greška pri učitavanju ponuda");
      } finally {
        setIsLoading(false);
      }
    },
    [activeTab]
  );

  useEffect(() => {
    if (isLoggedIn) {
      fetchOffers(1, activeTab);
    }
  }, [activeTab, isLoggedIn, fetchOffers]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    router.push(`/offers?tab=${tab}`, { scroll: false });
  };

  const handleAccept = async (offerId) => {
    setIsActionLoading(true);
    try {
      const res = await itemOfferApi.acceptOffer(offerId);

      if (res?.data?.error === false) {
        toast.success("Ponuda je prihvaćena!");
        setOffers((prev) =>
          prev.map((o) => (o.id === offerId ? { ...o, status: "accepted" } : o))
        );
        const conversationId =
          res.data.data?.conversation_id || res.data.data?.id;
        if (conversationId) {
          router.push(`/chat?chatid=${conversationId}`);
        }
      } else {
        toast.error(res?.data?.message || "Greška pri prihvaćanju ponude");
      }
    } catch (err) {
      console.error("Error accepting offer:", err);
      toast.error("Greška pri prihvaćanju ponude");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleReject = async (offerId) => {
    setIsActionLoading(true);
    try {
      const res = await itemOfferApi.rejectOffer(offerId);

      if (res?.data?.error === false) {
        toast.success("Ponuda je odbijena");
        setOffers((prev) =>
          prev.map((o) => (o.id === offerId ? { ...o, status: "rejected" } : o))
        );
      } else {
        toast.error(res?.data?.message || "Greška pri odbijanju ponude");
      }
    } catch (err) {
      console.error("Error rejecting offer:", err);
      toast.error("Greška pri odbijanju ponude");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleOpenCounter = (offer) => {
    setSelectedOffer(offer);
    setCounterModalOpen(true);
  };

  const handleCounterSubmit = async (offerId, amount) => {
    setIsActionLoading(true);
    try {
      const res = await itemOfferApi.counterOffer({ offer_id: offerId, amount });

      if (res?.data?.error === false) {
        toast.success("Kontra-ponuda je poslana!");
        setCounterModalOpen(false);
        setOffers((prev) =>
          prev.map((o) =>
            o.id === offerId
              ? { ...o, status: "countered", counter_amount: amount }
              : o
          )
        );
      } else {
        toast.error(res?.data?.message || "Greška pri slanju kontra-ponude");
      }
    } catch (err) {
      console.error("Error sending counter offer:", err);
      toast.error("Greška pri slanju kontra-ponude");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleChat = (offer) => {
    const conversationId =
      offer.conversation_id || offer.item_offer_id || offer.id;
    if (conversationId) {
      router.push(`/chat?chatid=${conversationId}`);
    }
  };

  if (!isLoggedIn) {
    return null;
  }

  return (
    <Layout>
      <BreadCrumb title2="Moje ponude" />

      <div className="container py-6 lg:py-10">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">
            Moje ponude
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Upravljajte ponudama koje ste primili i poslali
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-3 mb-6">
          <TabButton
            active={activeTab === "received"}
            onClick={() => handleTabChange("received")}
            icon={ArrowDownLeft}
            count={stats.receivedCount}
          >
            Primljene
          </TabButton>
          <TabButton
            active={activeTab === "sent"}
            onClick={() => handleTabChange("sent")}
            icon={ArrowUpRight}
            count={stats.sentCount}
          >
            Poslate
          </TabButton>
        </div>

        {/* Content */}
        {isLoading ? (
          <OffersSkeleton />
        ) : offers.length === 0 ? (
          <EmptyState type={activeTab} />
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="space-y-6"
          >
            <AnimatePresence mode="popLayout">
              {offers.map((offer) => (
                <OfferCard
                  key={offer.id}
                  offer={offer}
                  type={activeTab}
                  onAccept={handleAccept}
                  onReject={handleReject}
                  onCounter={handleOpenCounter}
                  onChat={handleChat}
                  isLoading={isActionLoading}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Load more */}
        {hasMore && !isLoading && (
          <div className="flex justify-center mt-8">
            <button
              onClick={() => fetchOffers(page + 1)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <RefreshCw size={16} />
              Učitaj više
            </button>
          </div>
        )}

        {/* Counter Modal */}
        <CounterOfferModal
          open={counterModalOpen}
          setOpen={setCounterModalOpen}
          offer={selectedOffer}
          onSubmit={handleCounterSubmit}
          isLoading={isActionLoading}
        />
      </div>
    </Layout>
  );
};

export default OffersPage;
