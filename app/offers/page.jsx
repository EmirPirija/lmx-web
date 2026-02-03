"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector } from "react-redux";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  Banknote,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle2,
  XCircle,
  MessageCircle,
  ChevronRight,
  Loader2,
  RefreshCw,
  Package,
  User,
  Calendar,
  TrendingUp,
  TrendingDown,
  Filter,
  Search,
  MoreHorizontal,
  Check,
  X,
  Send
} from "lucide-react";

import Layout from "@/components/Layout/Layout";
import { cn } from "@/lib/utils";
import { userSignUpData, getIsLoggedIn } from "@/redux/reducer/authSlice";
import { itemOfferApi } from "@/utils/api";
import CustomImage from "@/components/Common/CustomImage";
import { Dialog, DialogContent } from "@/components/ui/dialog";

// ============================================
// ANIMACIJE
// ============================================

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

const staggerContainer = {
  animate: {
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
};

// ============================================
// HELPER KOMPONENTE
// ============================================

const TabButton = ({ active, onClick, children, count, icon: Icon }) => (
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={cn(
      "flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all duration-200",
      active
        ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg"
        : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
    )}
  >
    {Icon && <Icon size={18} />}
    {children}
    {count > 0 && (
      <span className={cn(
        "px-2 py-0.5 rounded-full text-xs font-bold",
        active
          ? "bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900"
          : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
      )}>
        {count}
      </span>
    )}
  </motion.button>
);

const StatusBadge = ({ status }) => {
  const config = {
    pending: {
      icon: Clock,
      text: "Na čekanju",
      className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    },
    accepted: {
      icon: CheckCircle2,
      text: "Prihvaćeno",
      className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    },
    rejected: {
      icon: XCircle,
      text: "Odbijeno",
      className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800",
    },
    countered: {
      icon: RefreshCw,
      text: "Kontra-ponuda",
      className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    },
  };

  const { icon: Icon, text, className } = config[status] || config.pending;

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border",
      className
    )}>
      <Icon size={12} />
      {text}
    </span>
  );
};

const OfferCard = ({ offer, type, onAccept, onReject, onCounter, onChat, isLoading }) => {
  const router = useRouter();
  const isSelling = type === "received";
  const isPending = offer.status === "pending";

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("bs-BA", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const priceDiff = offer.item_price - offer.amount;
  const priceDiffPercent = ((priceDiff / offer.item_price) * 100).toFixed(0);

  return (
    <motion.div
      variants={fadeInUp}
      className={cn(
        "relative overflow-hidden rounded-2xl",
        "bg-white dark:bg-slate-900",
        "border border-slate-200 dark:border-slate-800",
        "shadow-sm hover:shadow-lg transition-all duration-300",
        "group"
      )}
    >
      {/* Header with item image */}
      <div className="flex gap-4 p-4">
        {/* Item image */}
        <div
          onClick={() => router.push(`/ad-details/${offer.item_slug}`)}
          className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 cursor-pointer group/image"
        >
          <CustomImage
            src={offer.item_image}
            alt={offer.item_name}
            width={96}
            height={96}
            className="w-full h-full object-cover group-hover/image:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/10 transition-colors" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3
                onClick={() => router.push(`/ad-details/${offer.item_slug}`)}
                className="font-bold text-slate-900 dark:text-white text-sm line-clamp-1 cursor-pointer hover:text-primary transition-colors"
              >
                {offer.item_name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <User size={12} />
                  <span>{isSelling ? offer.buyer_name : offer.seller_name}</span>
                </div>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <Calendar size={12} />
                  <span>{formatDate(offer.created_at)}</span>
                </div>
              </div>
            </div>
            <StatusBadge status={offer.status} />
          </div>

          {/* Price comparison */}
          <div className="mt-3 flex items-end gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400 font-medium">
                Ponuda
              </p>
              <p className="text-xl font-black text-primary">
                {offer.amount?.toLocaleString("bs-BA")} KM
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400 font-medium">
                Tražena cijena
              </p>
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                {offer.item_price?.toLocaleString("bs-BA")} KM
              </p>
            </div>
            <div className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold",
              priceDiff > 0
                ? "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                : "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
            )}>
              {priceDiff > 0 ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
              {priceDiff > 0 ? "-" : "+"}{Math.abs(priceDiffPercent)}%
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 px-4 pb-4">
        {isSelling && isPending ? (
          <>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onAccept(offer.id)}
              disabled={isLoading}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl",
                "bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm",
                "shadow-lg shadow-emerald-500/20",
                "transition-colors duration-200",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              Prihvati
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onReject(offer.id)}
              disabled={isLoading}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl",
                "bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50",
                "text-red-700 dark:text-red-300 font-semibold text-sm",
                "transition-colors duration-200",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />}
              Odbij
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onCounter(offer)}
              disabled={isLoading}
              className={cn(
                "px-4 py-2.5 rounded-xl",
                "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700",
                "text-slate-700 dark:text-slate-300 font-semibold text-sm",
                "transition-colors duration-200",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              <RefreshCw size={16} />
            </motion.button>
          </>
        ) : (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onChat(offer)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl",
              "bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100",
              "text-white dark:text-slate-900 font-semibold text-sm",
              "shadow-lg",
              "transition-colors duration-200"
            )}
          >
            <MessageCircle size={16} />
            Otvori chat
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

const EmptyState = ({ type }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="flex flex-col items-center justify-center py-16 px-4 text-center"
  >
    <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
      <Banknote size={40} className="text-slate-400 dark:text-slate-500" />
    </div>
    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
      Nema {type === "received" ? "primljenih" : "poslatih"} ponuda
    </h3>
    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
      {type === "received"
        ? "Kada neko pošalje ponudu za vaš oglas, pojavit će se ovdje."
        : "Kada pošaljete ponudu za neki oglas, pojavit će se ovdje."}
    </p>
  </motion.div>
);

const OffersSkeleton = () => (
  <div className="grid gap-4">
    {[1, 2, 3].map((i) => (
      <div
        key={i}
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 animate-pulse"
      >
        <div className="flex gap-4">
          <div className="w-24 h-24 rounded-xl bg-slate-200 dark:bg-slate-700" />
          <div className="flex-1 space-y-3">
            <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-3 w-1/2 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="flex gap-4">
              <div className="h-8 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="h-8 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
            </div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

// ============================================
// COUNTER OFFER MODAL
// ============================================

const CounterOfferModal = ({ open, setOpen, offer, onSubmit, isLoading }) => {
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open && offer) {
      setAmount("");
      setError("");
    }
  }, [open, offer]);

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
      <DialogContent className="max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-0 overflow-hidden">
        <div className="p-6">
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

          {/* Current prices info */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Trenutna ponuda</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                {offer?.amount?.toLocaleString("bs-BA")} KM
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Vaša cijena</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                {offer?.item_price?.toLocaleString("bs-BA")} KM
              </p>
            </div>
          </div>

          {/* Amount input */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Vaša kontra-ponuda (KM)
            </label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError("");
                }}
                placeholder="0.00"
                step="0.01"
                min="0"
                className={cn(
                  "w-full rounded-xl border bg-white dark:bg-slate-800",
                  "px-4 py-3 pr-14 text-lg font-bold text-slate-900 dark:text-white",
                  "placeholder:text-slate-400",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500",
                  "transition-all duration-200",
                  error ? "border-red-300 dark:border-red-700" : "border-slate-200 dark:border-slate-700"
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
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl",
                "bg-blue-600 hover:bg-blue-700 text-white font-semibold",
                "transition-colors duration-200",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
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

// ============================================
// MAIN PAGE COMPONENT
// ============================================

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

  // Counter offer modal
  const [counterModalOpen, setCounterModalOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);

  // Stats
  const [stats, setStats] = useState({
    receivedCount: 0,
    sentCount: 0,
    pendingCount: 0,
  });

  // Provjeri prijavu
  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/login");
    }
  }, [isLoggedIn, router]);

  // Dohvati ponude
  const fetchOffers = useCallback(async (pageNum = 1, type = activeTab) => {
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

        // Update stats if available
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
  }, [activeTab]);

  useEffect(() => {
    if (isLoggedIn) {
      fetchOffers(1, activeTab);
    }
  }, [activeTab, isLoggedIn]);

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
        // Update local state
        setOffers((prev) =>
          prev.map((o) => (o.id === offerId ? { ...o, status: "accepted" } : o))
        );
        // Navigate to chat
        const conversationId = res.data.data?.conversation_id || res.data.data?.id;
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
        // Update local state
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
        // Update local state
        setOffers((prev) =>
          prev.map((o) =>
            o.id === offerId ? { ...o, status: "countered", counter_amount: amount } : o
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
    const conversationId = offer.conversation_id || offer.item_offer_id || offer.id;
    if (conversationId) {
      router.push(`/chat?chatid=${conversationId}`);
    }
  };

  if (!isLoggedIn) {
    return null;
  }

  return (
    <Layout>
      <div className="container py-6 lg:py-10">
        {/* Header */}
        <div className="mb-8">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white"
          >
            Moje ponude
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-slate-500 dark:text-slate-400 mt-2"
          >
            Upravljajte ponudama koje ste primili i poslali
          </motion.p>
        </div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex gap-3 mb-6 overflow-x-auto pb-2"
        >
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
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {isLoading ? (
            <OffersSkeleton />
          ) : offers.length === 0 ? (
            <EmptyState type={activeTab} />
          ) : (
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="grid gap-4"
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
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => fetchOffers(page + 1)}
                className="px-6 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Učitaj više
              </motion.button>
            </div>
          )}
        </motion.div>

        {/* Counter Offer Modal */}
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
