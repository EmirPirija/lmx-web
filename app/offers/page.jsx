"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

import Layout from "@/components/Layout/Layout";
import BreadCrumb from "@/components/BreadCrumb/BreadCrumb";
import CustomImage from "@/components/Common/CustomImage";
import CustomLink from "@/components/Common/CustomLink";
import NoData from "@/components/EmptyStates/NoData";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { formatDate, formatPriceAbbreviated, t, truncate, extractYear } from "@/utils";
import { itemOfferApi } from "@/utils/api";
import { userSignUpData } from "@/redux/reducer/authSlice";
import { CurrentLanguageData } from "@/redux/reducer/languageSlice";

import {
  Inbox,
  Send,
  Package,
  User,
  BadgeCheck,
  Calendar,
  Clock,
  MessageCircle,
  Check,
  X,
  ArrowLeftRight,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Loader2,
  AlertCircle,
  ExternalLink,
  DollarSign,
  Tag,
  Hash,
  RefreshCw,
  Eye,
  Store,
  MapPin,
} from "lucide-react";

/* =====================================================
   ANIMATION VARIANTS
===================================================== */

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

const staggerContainer = {
  animate: {
    transition: { staggerChildren: 0.08 },
  },
};

/* =====================================================
   SKELETON KOMPONENTE
===================================================== */

const OfferCardSkeleton = () => (
  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-pulse">
    <div className="p-4 sm:p-5">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* User skeleton */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="flex items-center gap-3 lg:flex-col lg:items-start">
            <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-xl bg-slate-200 dark:bg-slate-700" />
            <div className="flex-1 lg:w-full space-y-2">
              <div className="h-5 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
            </div>
          </div>
        </div>
        
        {/* Content skeleton */}
        <div className="flex-1 space-y-4">
          <div className="flex gap-4">
            <div className="w-20 h-20 rounded-xl bg-slate-200 dark:bg-slate-700" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-48 bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="h-6 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-24 bg-slate-200 dark:bg-slate-700 rounded-xl" />
            <div className="h-10 w-24 bg-slate-200 dark:bg-slate-700 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

/* =====================================================
   STATUS BADGE
===================================================== */

const StatusBadge = ({ status }) => {
  const statusConfig = {
    pending: {
      label: "Na čekanju",
      className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800",
      icon: Clock,
    },
    accepted: {
      label: "Prihvaćeno",
      className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
      icon: Check,
    },
    rejected: {
      label: "Odbijeno",
      className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800",
      icon: X,
    },
    countered: {
      label: "Kontra-ponuda",
      className: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
      icon: ArrowLeftRight,
    },
  };

  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border",
      config.className
    )}>
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  );
};

/* =====================================================
   TAB BUTTON
===================================================== */

const TabButton = ({ active, onClick, icon: Icon, label, count }) => (
  <button
    onClick={onClick}
    className={cn(
      "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all",
      active
        ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg"
        : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
    )}
  >
    <Icon className="w-4 h-4" />
    <span>{label}</span>
    {count > 0 && (
      <span className={cn(
        "px-1.5 py-0.5 rounded-full text-[10px] font-bold",
        active
          ? "bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900"
          : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
      )}>
        {count}
      </span>
    )}
  </button>
);

/* =====================================================
   USER AVATAR KOMPONENTA
===================================================== */

const UserAvatar = ({ user, size = "md" }) => {
  const sizes = {
    sm: "w-10 h-10",
    md: "w-14 h-14",
    lg: "w-16 h-16",
  };

  const profileImage = user?.profile || user?.profile_image || user?.avatar;
  const isVerified = user?.is_verified || user?.verified;
  const isOnline = user?.is_online || user?.online;

  return (
    <div className="relative">
      <div className={cn(
        sizes[size],
        "rounded-xl overflow-hidden border-2 border-slate-200 dark:border-slate-700"
      )}>
        {profileImage ? (
          <CustomImage
            src={profileImage}
            alt={user?.name || "Korisnik"}
            width={64}
            height={64}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <span className="text-lg font-bold text-primary">
              {user?.name?.charAt(0)?.toUpperCase() || "?"}
            </span>
          </div>
        )}
      </div>
      {isVerified && (
        <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-white dark:bg-slate-900 rounded-lg flex items-center justify-center shadow-sm">
          <BadgeCheck className="w-4 h-4 text-sky-500" />
        </span>
      )}
      {isOnline && !isVerified && (
        <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
      )}
    </div>
  );
};

/* =====================================================
   OFFER USER CARD
===================================================== */

const OfferUserCard = ({ user, role, onClick }) => {
  const memberSince = user?.created_at ? extractYear(user.created_at) : null;
  const isVerified = user?.is_verified || user?.verified;
  
  return (
    <div 
      onClick={onClick}
      className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer group"
    >
      <UserAvatar user={user} size="md" />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-900 dark:text-white truncate group-hover:text-primary transition-colors">
            {user?.name || "Nepoznat korisnik"}
          </span>
          {isVerified && <BadgeCheck className="w-4 h-4 text-sky-500 flex-shrink-0" />}
        </div>
        <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-slate-700/80">
            {role === "buyer" ? "Kupac" : "Prodavač"}
          </span>
          {memberSince && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {memberSince}
            </span>
          )}
        </div>
      </div>
      
      <ChevronRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
};

/* =====================================================
   OFFER ITEM CARD
===================================================== */

const OfferItemCard = ({ item, offer, onViewItem }) => {
  const itemImage = item?.image || item?.gallery_images?.[0]?.image;
  const itemName = item?.translated_item?.name || item?.name || "Nepoznat artikal";
  const itemPrice = item?.price;
  const offerAmount = offer?.amount || offer?.offer_amount;
  const itemCity = item?.translated_city || item?.city;
  
  // Calculate price difference
  const priceDiff = itemPrice && offerAmount 
    ? ((Number(offerAmount) - Number(itemPrice)) / Number(itemPrice) * 100).toFixed(0)
    : null;

  return (
    <div className="flex gap-4">
      {/* Item image */}
      <div 
        onClick={onViewItem}
        className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 cursor-pointer group flex-shrink-0"
      >
        {itemImage ? (
          <CustomImage
            src={itemImage}
            alt={itemName}
            width={96}
            height={96}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        ) : (
          <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <Package className="w-8 h-8 text-slate-400" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <Eye className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
      
      {/* Item details */}
      <div className="flex-1 min-w-0">
        <h4 
          onClick={onViewItem}
          className="font-semibold text-slate-900 dark:text-white line-clamp-2 hover:text-primary cursor-pointer transition-colors"
        >
          {itemName}
        </h4>
        
        {itemCity && (
          <div className="flex items-center gap-1 mt-1 text-xs text-slate-500 dark:text-slate-400">
            <MapPin className="w-3 h-3" />
            {itemCity}
          </div>
        )}
        
        {/* Prices */}
        <div className="flex flex-wrap items-center gap-3 mt-2">
          {/* Original price */}
          {itemPrice && Number(itemPrice) > 0 && (
            <div className="flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-sm text-slate-500 dark:text-slate-400">
                Cijena: <span className="font-medium text-slate-700 dark:text-slate-300">{formatPriceAbbreviated(itemPrice)}</span>
              </span>
            </div>
          )}
          
          {/* Offer amount */}
          {offerAmount && (
            <div className="flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-primary" />
              <span className="text-sm font-bold text-primary">
                Ponuda: {formatPriceAbbreviated(offerAmount)}
              </span>
            </div>
          )}
        </div>
        
        {/* Price difference indicator */}
        {priceDiff && (
          <div className={cn(
            "inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-xs font-medium",
            Number(priceDiff) < 0
              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
              : Number(priceDiff) > 0
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
          )}>
            {Number(priceDiff) < 0 ? (
              <TrendingDown className="w-3 h-3" />
            ) : Number(priceDiff) > 0 ? (
              <TrendingUp className="w-3 h-3" />
            ) : null}
            {Number(priceDiff) > 0 ? "+" : ""}{priceDiff}% od cijene
          </div>
        )}
      </div>
    </div>
  );
};

/* =====================================================
   COUNTER OFFER MODAL
===================================================== */

const CounterOfferModal = ({ open, onClose, offer, onSubmit, isLoading }) => {
  const [amount, setAmount] = useState("");
  
  const itemPrice = offer?.item?.price || 0;
  const currentOffer = offer?.amount || offer?.offer_amount || 0;

  useEffect(() => {
    if (open) {
      setAmount("");
    }
  }, [open]);

  const handleSubmit = () => {
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      toast.error("Unesite validan iznos");
      return;
    }
    onSubmit(numAmount);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md bg-white dark:bg-slate-900 rounded-2xl p-0 overflow-hidden">
        <div className="p-6">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            Kontra-ponuda
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            Predloži novu cijenu kupcu
          </p>
          
          {/* Price reference */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Cijena oglasa</p>
              <p className="font-bold text-slate-900 dark:text-white">
                {formatPriceAbbreviated(itemPrice)}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <p className="text-xs text-amber-600 dark:text-amber-400 mb-1">Trenutna ponuda</p>
              <p className="font-bold text-amber-700 dark:text-amber-300">
                {formatPriceAbbreviated(currentOffer)}
              </p>
            </div>
          </div>
          
          {/* Amount input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Vaša kontra-ponuda
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Unesite iznos"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isLoading}
            >
              Odustani
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1"
              disabled={isLoading || !amount}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <ArrowLeftRight className="w-4 h-4 mr-2" />
              )}
              Pošalji
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/* =====================================================
   OFFER CARD KOMPONENTA
===================================================== */

const OfferCard = ({ offer, type, onAction, isActionLoading }) => {
  const router = useRouter();
  
  const item = offer?.item;
  const status = offer?.status || "pending";
  const createdAt = offer?.created_at;
  const offerId = offer?.id;
  
  // Determine user based on type
  const otherUser = type === "received" 
    ? (offer?.buyer || offer?.user)  // If received, show buyer
    : (offer?.seller || offer?.item?.user);  // If sent, show seller
    
  const userRole = type === "received" ? "buyer" : "seller";

  const goToUserProfile = () => {
    if (otherUser?.id) {
      router.push(`/seller/${otherUser.id}`);
    }
  };

  const goToItem = () => {
    const slug = item?.slug || item?.id;
    if (slug) {
      router.push(`/ad-details/${slug}`);
    }
  };

  const goToChat = () => {
    if (offer?.item_offer_id || offerId) {
      router.push(`/chat?id=${offer?.item_offer_id || offerId}`);
    }
  };

  const isPending = status === "pending";
  const isReceived = type === "received";

  return (
    <motion.div
      variants={fadeInUp}
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
    >
      <div className="p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* User section */}
          <div className="lg:w-64 flex-shrink-0">
            <OfferUserCard 
              user={otherUser} 
              role={userRole}
              onClick={goToUserProfile}
            />
          </div>
          
          {/* Divider for mobile */}
          <div className="lg:hidden h-px bg-slate-200 dark:bg-slate-700" />
          
          {/* Content section */}
          <div className="flex-1 min-w-0">
            {/* Item info */}
            <OfferItemCard 
              item={item} 
              offer={offer}
              onViewItem={goToItem}
            />
            
            {/* Counter offer info */}
            {offer?.counter_amount && (
              <div className="mt-3 p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800">
                <div className="flex items-center gap-2 text-sm">
                  <ArrowLeftRight className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-indigo-700 dark:text-indigo-300">
                    Kontra-ponuda: <strong>{formatPriceAbbreviated(offer.counter_amount)}</strong>
                  </span>
                </div>
              </div>
            )}
            
            {/* Footer with status and actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <StatusBadge status={status} />
                {createdAt && (
                  <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(createdAt)}
                  </span>
                )}
                {offerId && (
                  <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
                    <Hash className="w-3 h-3" />
                    {offerId}
                  </span>
                )}
              </div>
              
              {/* Actions */}
              <div className="flex items-center gap-2">
                {/* Chat button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToChat}
                  className="text-xs"
                >
                  <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
                  Chat
                </Button>
                
                {/* Action buttons for received pending offers */}
                {isReceived && isPending && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onAction("counter", offer)}
                      disabled={isActionLoading}
                      className="text-xs text-indigo-600 border-indigo-200 hover:bg-indigo-50 dark:text-indigo-400 dark:border-indigo-800 dark:hover:bg-indigo-900/20"
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5 mr-1.5" />
                      Kontra
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onAction("reject", offer)}
                      disabled={isActionLoading}
                      className="text-xs text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20"
                    >
                      <X className="w-3.5 h-3.5 mr-1.5" />
                      Odbij
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => onAction("accept", offer)}
                      disabled={isActionLoading}
                      className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      {isActionLoading ? (
                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5 mr-1.5" />
                      )}
                      Prihvati
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

/* =====================================================
   EMPTY STATE
===================================================== */

const EmptyState = ({ type }) => (
  <motion.div
    variants={fadeInUp}
    className="text-center py-16"
  >
    <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
      {type === "received" ? (
        <Inbox className="w-10 h-10 text-slate-400" />
      ) : (
        <Send className="w-10 h-10 text-slate-400" />
      )}
    </div>
    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
      {type === "received" ? "Nema primljenih ponuda" : "Nema poslanih ponuda"}
    </h3>
    <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
      {type === "received"
        ? "Kada kupci pošalju ponude za vaše oglase, pojavit će se ovdje"
        : "Vaše ponude za oglase drugih prodavača će se prikazati ovdje"
      }
    </p>
  </motion.div>
);

/* =====================================================
   MAIN PAGE
===================================================== */

const OffersPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userData = useSelector(userSignUpData);
  const CurrentLanguage = useSelector(CurrentLanguageData);

  // State
  const [offers, setOffers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [activeTab, setActiveTab] = useState(searchParams.get("type") || "received");
  const [actionLoading, setActionLoading] = useState(null);
  
  // Counter modal state
  const [counterModalOpen, setCounterModalOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [isCounterLoading, setIsCounterLoading] = useState(false);

  // Counts
  const [receivedCount, setReceivedCount] = useState(0);
  const [sentCount, setSentCount] = useState(0);

  // Fetch offers
  const fetchOffers = useCallback(async (page = 1, type = activeTab, append = false) => {
    try {
      if (page === 1) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      const response = await itemOfferApi.getMyOffers({
        type,
        page,
      });

      if (response?.data?.error === false) {
        const data = response.data.data;
        const offersList = data?.data || [];
        
        if (append) {
          setOffers(prev => [...prev, ...offersList]);
        } else {
          setOffers(offersList);
        }
        
        setCurrentPage(data?.current_page || 1);
        setHasMore((data?.current_page || 1) < (data?.last_page || 1));
        
        // Update counts
        if (type === "received") {
          setReceivedCount(data?.total || 0);
        } else {
          setSentCount(data?.total || 0);
        }
      }
    } catch (error) {
      console.error("Error fetching offers:", error);
      toast.error("Greška pri učitavanju ponuda");
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [activeTab]);

  useEffect(() => {
    if (userData?.token) {
      fetchOffers(1, activeTab);
    }
  }, [activeTab, CurrentLanguage?.id, userData?.token]);

  // Update URL when tab changes
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
    const params = new URLSearchParams(searchParams);
    params.set("type", tab);
    window.history.replaceState(null, "", `?${params.toString()}`);
  };

  // Handle load more
  const handleLoadMore = () => {
    fetchOffers(currentPage + 1, activeTab, true);
  };

  // Handle offer actions
  const handleAction = async (action, offer) => {
    if (action === "counter") {
      setSelectedOffer(offer);
      setCounterModalOpen(true);
      return;
    }

    setActionLoading(offer.id);

    try {
      let response;
      if (action === "accept") {
        response = await itemOfferApi.acceptOffer(offer.id);
      } else if (action === "reject") {
        response = await itemOfferApi.rejectOffer(offer.id);
      }

      if (response?.data?.error === false) {
        toast.success(
          action === "accept" ? "Ponuda je prihvaćena" : "Ponuda je odbijena"
        );
        fetchOffers(1, activeTab);
      } else {
        toast.error(response?.data?.message || "Greška pri obradi ponude");
      }
    } catch (error) {
      console.error("Error handling offer action:", error);
      toast.error("Greška pri obradi ponude");
    } finally {
      setActionLoading(null);
    }
  };

  // Handle counter offer submission
  const handleCounterSubmit = async (amount) => {
    if (!selectedOffer) return;

    setIsCounterLoading(true);

    try {
      const response = await itemOfferApi.counterOffer({
        offer_id: selectedOffer.id,
        amount,
      });

      if (response?.data?.error === false) {
        toast.success("Kontra-ponuda je poslana");
        setCounterModalOpen(false);
        setSelectedOffer(null);
        fetchOffers(1, activeTab);
      } else {
        toast.error(response?.data?.message || "Greška pri slanju kontra-ponude");
      }
    } catch (error) {
      console.error("Error sending counter offer:", error);
      toast.error("Greška pri slanju kontra-ponude");
    } finally {
      setIsCounterLoading(false);
    }
  };

  // Redirect if not logged in
  if (!userData?.token) {
    return (
      <Layout>
        <BreadCrumb title2="Ponude" />
        <div className="container py-16">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              Prijava obavezna
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6">
              Morate biti prijavljeni da biste vidjeli vaše ponude
            </p>
            <Button onClick={() => router.push("/login")}>
              Prijavi se
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <BreadCrumb title2="Ponude" />

      <div className="container py-6 lg:py-8">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">
            Moje ponude
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Upravljaj primljenim i poslanim ponudama
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-3 mb-6">
          <TabButton
            active={activeTab === "received"}
            onClick={() => handleTabChange("received")}
            icon={Inbox}
            label="Primljene"
            count={receivedCount}
          />
          <TabButton
            active={activeTab === "sent"}
            onClick={() => handleTabChange("sent")}
            icon={Send}
            label="Poslane"
            count={sentCount}
          />
        </div>

        {/* Content */}
        {isLoading ? (
          <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <OfferCardSkeleton key={i} />
            ))}
          </motion.div>
        ) : offers.length === 0 ? (
          <EmptyState type={activeTab} />
        ) : (
          <>
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="space-y-4"
            >
              <AnimatePresence mode="popLayout">
                {offers.map((offer) => (
                  <OfferCard
                    key={offer.id}
                    offer={offer}
                    type={activeTab}
                    onAction={handleAction}
                    isActionLoading={actionLoading === offer.id}
                  />
                ))}
              </AnimatePresence>
            </motion.div>

            {/* Load more */}
            {hasMore && (
              <div className="text-center mt-8">
                <Button
                  variant="outline"
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="min-w-[200px]"
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Učitavanje...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Učitaj više
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Counter offer modal */}
      <CounterOfferModal
        open={counterModalOpen}
        onClose={() => {
          setCounterModalOpen(false);
          setSelectedOffer(null);
        }}
        offer={selectedOffer}
        onSubmit={handleCounterSubmit}
        isLoading={isCounterLoading}
      />
    </Layout>
  );
};

export default OffersPage;
