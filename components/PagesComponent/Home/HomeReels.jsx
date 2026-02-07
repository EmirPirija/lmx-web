"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

import { allItemApi, manageFavouriteApi, itemConversationApi } from "@/utils/api";
import { setIsLoginOpen } from "@/redux/reducer/globalStateSlice";
import { getIsLoggedIn, userSignUpData } from "@/redux/reducer/authSlice";

import {
  MdFavorite,
  MdFavoriteBorder,
  MdVolumeOff,
  MdVolumeUp,
  MdPlayArrow,
  MdPause,
  MdClose,
  MdSend,
  MdShare,
  MdMoreVert,
  MdVerified,
  MdStorefront,
  MdChevronLeft,
  MdChevronRight,
  MdLocationOn,
  MdAccessTime,
  MdKeyboardArrowUp,
  MdLocalOffer,
} from "react-icons/md";

const formatPrice = (price) => {
  if (price === null || price === undefined) return "Na upit";
  if (Number(price) === 0) return "Na upit";
  return `${new Intl.NumberFormat("bs-BA", {
    maximumFractionDigits: 0,
  }).format(Number(price))} KM`;
};

const isNegotiable = (price) => {
  return price === null || price === undefined || Number(price) === 0;
};

const timeAgo = (dateString) => {
  if (!dateString) return null;
  
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now - date) / 1000);
  
  if (seconds < 60) return "upravo";
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `prije ${minutes}min`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `prije ${hours}h`;
  
  const days = Math.floor(hours / 24);
  if (days < 7) return `prije ${days}d`;
  
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `prije ${weeks}sed`;
  
  const months = Math.floor(days / 30);
  if (months < 12) return `prije ${months}mj`;
  
  return `prije ${Math.floor(months / 12)}g`;
};

const pickItemsArray = (apiResponse) => {
  const d = apiResponse?.data;
  return d?.data?.data || d?.data || d?.items || d?.result || [];
};

const pickVideoUrl = (item) => {
  const url = item?.video || null;
  if (!url) return null;
  if (typeof url === "string" && url.startsWith("/")) {
    const base = process.env.NEXT_PUBLIC_ADMIN_URL || "";
    return base ? `${base}${url}` : url;
  }
  return url;
};

const numberOrZero = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const formatCount = (num) => {
  const n = numberOrZero(num);
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
};

const HomeReels = () => {
  const dispatch = useDispatch();
  const isLoggedIn = useSelector(getIsLoggedIn);
  const currentUser = useSelector(userSignUpData);

  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const scrollerRef = useRef(null);

  const fetchReels = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await allItemApi.getItems({
        status: "approved",
        limit: 50,
        page: 1,
        sort_by: "new-to-old",
      });

      if (res?.data?.error === true) {
        throw new Error(res?.data?.message || "API error");
      }

      const arr = pickItemsArray(res) || [];
      const withVideo = arr.filter((x) => !!pickVideoUrl(x));
      setItems(withVideo);
    } catch (e) {
      console.error("HomeReels fetch error:", e);
      toast.error(e?.message || "Ne mogu učitati videe");
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReels();
  }, [fetchReels]);

  const checkScrollPosition = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScrollPosition, { passive: true });
    checkScrollPosition();
    return () => el.removeEventListener("scroll", checkScrollPosition);
  }, [items, checkScrollPosition]);

  const onToggleLike = async (itemId) => {
    if (!isLoggedIn) {
      dispatch(setIsLoginOpen(true));
      return;
    }

    setItems((prev) =>
      prev.map((it) =>
        it.id === itemId
          ? {
              ...it,
              is_liked: !it.is_liked,
              total_likes: numberOrZero(it.total_likes) + (it.is_liked ? -1 : 1),
            }
          : it
      )
    );

    try {
      const response = await manageFavouriteApi.manageFavouriteApi({
        item_id: itemId,
      });

      if (response?.data?.error !== false) {
        throw new Error("Like failed");
      }
    } catch (e) {
      setItems((prev) =>
        prev.map((it) =>
          it.id === itemId
            ? {
                ...it,
                is_liked: !it.is_liked,
                total_likes: numberOrZero(it.total_likes) + (it.is_liked ? -1 : 1),
              }
            : it
        )
      );
      toast.error("Greška pri ažuriranju omiljenih");
    }
  };

  const scrollByCards = (dir = 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const cardWidth = window.innerWidth < 640 ? 200 : 240;
    el.scrollBy({ left: dir * (cardWidth + 12) * 2, behavior: "smooth" });
  };

  const hasAny = items?.length > 0;

  return (
    <section className="relative py-6 lg:py-8">
      {/* Header */}
      <div className="container">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F7941D] via-[#E1306C] to-[#833AB4] p-[2px]">
              <div className="w-full h-full rounded-[10px] bg-white flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
                  <path
                    d="M4 8V6a2 2 0 012-2h2M4 16v2a2 2 0 002 2h2M16 4h2a2 2 0 012 2v2M16 20h2a2 2 0 002-2v-2"
                    stroke="url(#reelsGrad)"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M9.5 9l5 3-5 3V9z"
                    fill="url(#reelsGrad)"
                  />
                  <defs>
                    <linearGradient id="reelsGrad" x1="4" y1="4" x2="20" y2="20">
                      <stop stopColor="#F7941D" />
                      <stop offset="0.5" stopColor="#E1306C" />
                      <stop offset="1" stopColor="#833AB4" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Reels</h2>
              <p className="text-xs text-slate-500">Video oglasi</p>
            </div>
          </div>

          {hasAny && (
            <div className="hidden sm:flex items-center gap-1.5">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => scrollByCards(-1)}
                disabled={!canScrollLeft}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200
                  ${canScrollLeft 
                    ? "bg-slate-100 hover:bg-slate-200 text-slate-700" 
                    : "bg-slate-50 text-slate-300 cursor-not-allowed"}`}
              >
                <MdChevronLeft size={22} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => scrollByCards(1)}
                disabled={!canScrollRight}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200
                  ${canScrollRight 
                    ? "bg-slate-100 hover:bg-slate-200 text-slate-700" 
                    : "bg-slate-50 text-slate-300 cursor-not-allowed"}`}
              >
                <MdChevronRight size={22} />
              </motion.button>
            </div>
          )}
        </div>
      </div>

      {/* Scrollable area - full bleed on mobile */}
      {isLoading ? (
        <div className="container">
          <div className="flex gap-3 overflow-hidden">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="shrink-0 w-[180px] sm:w-[220px] aspect-[9/16] rounded-2xl bg-slate-200 relative overflow-hidden"
              >
                {/* Shimmer effect */}
                <div 
                  className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite]"
                  style={{
                    background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
                  }}
                />
                {/* Fake content placeholders */}
                <div className="absolute top-3 left-3 right-3 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-slate-300" />
                  <div className="h-3 w-16 rounded bg-slate-300" />
                </div>
                <div className="absolute bottom-3 left-3 right-3">
                  <div className="h-4 w-3/4 rounded bg-slate-300 mb-2" />
                  <div className="h-3 w-1/2 rounded bg-slate-300" />
                </div>
              </div>
            ))}
          </div>
          <style jsx>{`
            @keyframes shimmer {
              100% {
                transform: translateX(100%);
              }
            }
          `}</style>
        </div>
      ) : !hasAny ? (
        <div className="container">
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center">
              <MdPlayArrow className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-600 font-medium">Trenutno nema video oglasa</p>
            <p className="text-slate-400 text-sm mt-1">Budi prvi koji će objaviti video</p>
          </div>
        </div>
      ) : (
        <div className="relative">
          {/* Gradient fade edges */}
          <div className="hidden sm:block absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
          <div className="hidden sm:block absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
          
          <div
            ref={scrollerRef}
            className="flex gap-3 overflow-x-auto pb-2 pl-4 pr-4 sm:pl-[max(1rem,calc((100vw-1280px)/2+1rem))] sm:pr-[max(1rem,calc((100vw-1280px)/2+1rem))] snap-x snap-mandatory scrollbar-hide scroll-smooth"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {items.map((item, index) => (
              <ReelCard
                key={item.id}
                item={item}
                index={index}
                isLoggedIn={isLoggedIn}
                onLike={() => onToggleLike(item.id)}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default HomeReels;

// ==========================================
// Reel Card - Instagram style
// ==========================================
const ReelCard = ({ item, index, isLoggedIn, onLike }) => {
  const router = useRouter();
  const dispatch = useDispatch();

  const videoRef = useRef(null);
  const wrapperRef = useRef(null);
  const progressRef = useRef(null);

  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [showLikeAnimation, setShowLikeAnimation] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  
  const holdTimerRef = useRef(null);

  const videoUrl = useMemo(() => pickVideoUrl(item), [item]);
  const poster = item?.image || "";

  const views = numberOrZero(item?.total_video_plays) || numberOrZero(item?.clicks);
  const likes = numberOrZero(item?.total_likes);

  const seller = item?.user || item?.seller || {};
  const sellerId = seller?.id || null;
  const sellerName = seller?.name || seller?.shop_name || "Prodavač";
  const sellerImage = seller?.profile || seller?.image || null;
  const isVerified = seller?.is_verified || seller?.verified || false;
  const isShop = !!(seller?.shop_name || seller?.is_shop);
  
  const city = item?.translated_city || item?.city || null;
  const createdAt = item?.created_at || null;
  const negotiable = isNegotiable(item?.price);

  // Intersection Observer for autoplay
  useEffect(() => {
    if (!videoUrl) return;

    const el = videoRef.current;
    const wr = wrapperRef.current;
    if (!el || !wr) return;

    el.muted = isMuted;

    const io = new IntersectionObserver(
      async (entries) => {
        const entry = entries[0];
        if (!entry) return;

        if (entry.isIntersecting && entry.intersectionRatio >= 0.7) {
          try {
            await el.play();
            setIsPlaying(true);
          } catch {
            setIsPlaying(false);
          }
        } else {
          el.pause();
          setIsPlaying(false);
        }
      },
      { threshold: [0, 0.5, 0.7, 1] }
    );

    io.observe(wr);
    return () => io.disconnect();
  }, [videoUrl, isMuted]);

  // Progress bar
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    const updateProgress = () => {
      if (el.duration) {
        setProgress((el.currentTime / el.duration) * 100);
      }
    };

    el.addEventListener("timeupdate", updateProgress);
    return () => el.removeEventListener("timeupdate", updateProgress);
  }, []);

  const togglePlay = async (e) => {
    e?.stopPropagation();
    const el = videoRef.current;
    if (!el) return;

    if (el.paused) {
      try {
        await el.play();
        setIsPlaying(true);
      } catch {
        setIsPlaying(false);
      }
    } else {
      el.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = (e) => {
    e?.stopPropagation();
    const el = videoRef.current;
    if (!el) return;
    const next = !isMuted;
    el.muted = next;
    setIsMuted(next);
  };

  const handleDoubleTap = (e) => {
    e.stopPropagation();
    if (!item?.is_liked) {
      onLike?.();
    }
    setShowLikeAnimation(true);
    setTimeout(() => setShowLikeAnimation(false), 1000);
  };

  const handleHoldStart = (e) => {
    // Don't trigger hold on buttons
    if (e.target.closest('button')) return;
    
    holdTimerRef.current = setTimeout(() => {
      const el = videoRef.current;
      if (el && !el.paused) {
        el.pause();
        setIsHolding(true);
      }
    }, 150);
  };

  const handleHoldEnd = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (isHolding) {
      const el = videoRef.current;
      if (el) {
        el.play().catch(() => {});
      }
      setIsHolding(false);
    }
  };

  const openZoom = () => setIsZoomOpen(true);
  const closeZoom = () => setIsZoomOpen(false);

  const goToDetails = (e) => {
    e?.stopPropagation();
    router.push(`/ad-details/${item?.slug}`);
  };

  const handleMessageSeller = async (e) => {
    e?.stopPropagation();

    if (!isLoggedIn) {
      dispatch(setIsLoginOpen(true));
      return;
    }

    if (!item?.id) {
      toast.error("Oglas nije dostupan.");
      return;
    }

    if (currentUser?.id && String(currentUser.id) === String(item?.user_id)) {
      toast.error("Ne možete poslati poruku na svoj oglas.");
      return;
    }

    try {
      const checkRes = await itemConversationApi.checkConversation({ item_id: item?.id });
      const existingId =
        checkRes?.data?.data?.conversation_id ||
        checkRes?.data?.data?.item_offer_id ||
        checkRes?.data?.data?.id ||
        null;

      if (checkRes?.data?.error === false && existingId) {
        router.push(`/chat?activeTab=buying&chatid=${existingId}`);
        return;
      }

      const startRes = await itemConversationApi.startItemConversation({ item_id: item?.id });
      const convoId =
        startRes?.data?.data?.conversation_id ||
        startRes?.data?.data?.item_offer_id ||
        startRes?.data?.data?.id ||
        null;

      if (startRes?.data?.error === false && convoId) {
        router.push(`/chat?activeTab=buying&chatid=${convoId}`);
        return;
      }

      toast.error(startRes?.data?.message || "Ne mogu otvoriti chat");
    } catch (err) {
      console.error(err);
      toast.error("Ne mogu otvoriti chat");
    }
  };

  if (!videoUrl) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: index * 0.05 }}
        ref={wrapperRef}
        className="snap-start shrink-0 w-[180px] sm:w-[220px] aspect-[9/16] rounded-2xl overflow-hidden bg-slate-900 relative cursor-pointer group"
        onClick={openZoom}
        onDoubleClick={handleDoubleTap}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => { setIsHovered(false); handleHoldEnd(); }}
        onMouseDown={handleHoldStart}
        onMouseUp={handleHoldEnd}
        onTouchStart={handleHoldStart}
        onTouchEnd={handleHoldEnd}
        role="button"
        tabIndex={0}
        style={{
          boxShadow: isHovered 
            ? "0 20px 50px -10px rgba(0,0,0,0.3)" 
            : "0 10px 30px -10px rgba(0,0,0,0.2)",
          transition: "box-shadow 0.3s ease",
        }}
      >
        {/* Video */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          src={videoUrl}
          poster={poster}
          playsInline
          muted
          loop
          preload="metadata"
        />

        {/* Progress bar at top */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/20 z-10">
          <motion.div
            className="h-full bg-white"
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none" />

        {/* Hold to pause indicator */}
        <AnimatePresence>
          {isHolding && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
            >
              <div className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                <MdPause className="w-7 h-7 text-white" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Double tap like animation */}
        <AnimatePresence>
          {showLikeAnimation && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
            >
              <MdFavorite className="w-20 h-20 text-white drop-shadow-lg" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top section - Seller info */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between z-10">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (seller?.id) {
                router.push(`/seller/${seller.id}`);
              }
            }}
            className="flex items-center gap-1.5 min-w-0 hover:opacity-80 transition-opacity"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#F7941D] via-[#E1306C] to-[#833AB4] p-[1.5px] shrink-0">
              {sellerImage ? (
                <img
                  src={sellerImage}
                  alt=""
                  className="w-full h-full rounded-full object-cover bg-white"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                  <MdStorefront className="w-3.5 h-3.5 text-slate-400" />
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 min-w-0">
              <span className="text-white text-[11px] font-semibold truncate max-w-[60px]">
                {sellerName}
              </span>
              {isVerified && (
                <MdVerified className="w-3 h-3 text-[#3897F0] shrink-0" />
              )}
              {isShop && (
                <span className="px-1.5 py-0.5 rounded bg-[#F7941D]/90 text-[8px] font-bold text-white uppercase tracking-wide">
                  Shop
                </span>
              )}
            </div>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleMute(e);
            }}
            className="w-7 h-7 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center transition-transform hover:scale-110"
          >
            {isMuted ? <MdVolumeOff size={14} /> : <MdVolumeUp size={14} />}
          </button>
        </div>

        {/* Play/Pause indicator (shows briefly) */}
        <AnimatePresence>
          {!isPlaying && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <div className="w-14 h-14 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                <MdPlayArrow className="w-8 h-8 text-white ml-0.5" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Right side actions */}
        <div className="absolute right-2 bottom-24 flex flex-col items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.85 }}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onLike?.();
            }}
            className="flex flex-col items-center"
          >
            <div className="w-9 h-9 flex items-center justify-center">
              {item?.is_liked ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 15 }}
                >
                  <MdFavorite className="w-7 h-7 text-red-500 drop-shadow-lg" />
                </motion.div>
              ) : (
                <MdFavoriteBorder className="w-7 h-7 text-white drop-shadow-lg" />
              )}
            </div>
            <span className="text-white text-[10px] font-semibold drop-shadow">
              {formatCount(likes)}
            </span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.85 }}
            type="button"
            onClick={handleMessageSeller}
            className="flex flex-col items-center"
          >
            <div className="w-9 h-9 flex items-center justify-center">
              <MdSend className="w-6 h-6 text-white drop-shadow-lg -rotate-12" />
            </div>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.85 }}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (navigator.share) {
                navigator.share({
                  title: item?.name,
                  url: `${window.location.origin}/ad-details/${item?.slug}`,
                });
              }
            }}
            className="flex flex-col items-center"
          >
            <div className="w-9 h-9 flex items-center justify-center">
              <MdShare className="w-6 h-6 text-white drop-shadow-lg" />
            </div>
          </motion.button>
        </div>

        {/* Bottom section - Product info */}
        <div className="absolute bottom-2 left-2 right-12">
          {/* Time ago badge */}
          {createdAt && (
            <div className="flex items-center gap-1 mb-1.5">
              <MdAccessTime className="w-3 h-3 text-white/60" />
              <span className="text-white/60 text-[10px]">{timeAgo(createdAt)}</span>
            </div>
          )}
          
          <button
            type="button"
            onClick={goToDetails}
            className="text-left w-full"
          >
            <p className="text-white text-sm font-bold leading-snug line-clamp-2 drop-shadow-lg">
              {item?.translated_item?.name || item?.name || "Oglas"}
            </p>
            
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {negotiable ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/80 text-white text-[10px] font-semibold">
                  <MdLocalOffer className="w-3 h-3" />
                  Po dogovoru
                </span>
              ) : (
                <span className="text-white font-bold text-sm drop-shadow-lg">
                  {formatPrice(item?.price)}
                </span>
              )}
            </div>
            
            {/* Location */}
            {city && (
              <div className="flex items-center gap-1 mt-1">
                <MdLocationOn className="w-3 h-3 text-white/70" />
                <span className="text-white/70 text-[11px]">{city}</span>
              </div>
            )}
          </button>

          {/* Views */}
          <div className="flex items-center gap-1 mt-1.5">
            <MdPlayArrow className="w-3 h-3 text-white/60" />
            <span className="text-white/60 text-[10px]">
              {formatCount(views)} pregleda
            </span>
          </div>
        </div>
      </motion.div>

      {/* Fullscreen Modal */}
      <ReelZoomModal
        open={isZoomOpen}
        onClose={closeZoom}
        item={item}
        videoUrl={videoUrl}
        poster={poster}
        onLike={onLike}
        onMessage={handleMessageSeller}
        isMuted={isMuted}
        setIsMuted={setIsMuted}
        seller={{ id: sellerId, name: sellerName, image: sellerImage, isVerified }}
      />
    </>
  );
};

// ==========================================
// Fullscreen Modal - Instagram style
// ==========================================
const ReelZoomModal = ({
  open,
  onClose,
  item,
  videoUrl,
  poster,
  onLike,
  onMessage,
  isMuted,
  setIsMuted,
  seller,
}) => {
  const router = useRouter();
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [showLikeAnimation, setShowLikeAnimation] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const [showSwipeHint, setShowSwipeHint] = useState(true);
  
  const holdTimerRef = useRef(null);
  const startYRef = useRef(null);
  
  const city = item?.translated_city || item?.city || null;
  const createdAt = item?.created_at || null;
  const negotiable = isNegotiable(item?.price);
  const isShop = !!(seller?.shop_name || seller?.is_shop);

  useEffect(() => {
    if (!open) return;

    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
      if (e.key === " ") {
        e.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener("keydown", onKey);

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Hide swipe hint after 3 seconds
    const hintTimer = setTimeout(() => setShowSwipeHint(false), 3000);

    setTimeout(async () => {
      try {
        if (videoRef.current) {
          videoRef.current.muted = isMuted;
          await videoRef.current.play();
          setIsPlaying(true);
        }
      } catch {}
    }, 100);

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev || "unset";
      clearTimeout(hintTimer);
    };
  }, [open, onClose, isMuted]);

  // Progress tracking
  useEffect(() => {
    if (!open) return;
    const el = videoRef.current;
    if (!el) return;

    const updateProgress = () => {
      if (el.duration) {
        setProgress((el.currentTime / el.duration) * 100);
      }
    };

    el.addEventListener("timeupdate", updateProgress);
    return () => el.removeEventListener("timeupdate", updateProgress);
  }, [open]);

  const togglePlay = async () => {
    const el = videoRef.current;
    if (!el) return;

    if (el.paused) {
      try {
        await el.play();
        setIsPlaying(true);
      } catch {}
    } else {
      el.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const el = videoRef.current;
    if (!el) return;
    const next = !isMuted;
    el.muted = next;
    setIsMuted(next);
  };

  const handleDoubleTap = () => {
    if (!item?.is_liked) {
      onLike?.();
    }
    setShowLikeAnimation(true);
    setTimeout(() => setShowLikeAnimation(false), 1000);
  };

  const handleHoldStart = (e) => {
    if (e.target.closest('button')) return;
    
    // Track start position for swipe
    startYRef.current = e.touches?.[0]?.clientY || e.clientY;
    
    holdTimerRef.current = setTimeout(() => {
      const el = videoRef.current;
      if (el && !el.paused) {
        el.pause();
        setIsHolding(true);
      }
    }, 150);
  };

  const handleHoldEnd = (e) => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    
    // Check for swipe up
    const endY = e.changedTouches?.[0]?.clientY || e.clientY;
    if (startYRef.current && startYRef.current - endY > 100) {
      // Swiped up - go to details
      goToDetails();
      return;
    }
    
    if (isHolding) {
      const el = videoRef.current;
      if (el) {
        el.play().catch(() => {});
      }
      setIsHolding(false);
    }
  };

  const goToDetails = () => {
    onClose?.();
    router.push(`/ad-details/${item?.slug}`);
  };

  const views = numberOrZero(item?.total_video_plays) || numberOrZero(item?.clicks);
  const likes = numberOrZero(item?.total_likes);

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[200] flex items-center justify-center bg-black"
      >
        {/* Close button */}
        <motion.button
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          type="button"
          onClick={onClose}
          className="absolute top-4 left-4 z-30 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/60 transition"
        >
          <MdClose size={24} />
        </motion.button>

        {/* More options */}
        <motion.button
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          type="button"
          className="absolute top-4 right-4 z-30 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/60 transition"
        >
          <MdMoreVert size={24} />
        </motion.button>

        {/* Video container */}
        <div
          className="relative w-full h-full max-w-[500px] max-h-[90vh] mx-auto"
          onClick={togglePlay}
          onDoubleClick={handleDoubleTap}
          onMouseDown={handleHoldStart}
          onMouseUp={handleHoldEnd}
          onMouseLeave={handleHoldEnd}
          onTouchStart={handleHoldStart}
          onTouchEnd={handleHoldEnd}
        >
          {/* Progress bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-white/20 z-20">
            <motion.div
              className="h-full bg-white"
              style={{ width: `${progress}%` }}
            />
          </div>

          <video
            ref={videoRef}
            src={videoUrl}
            poster={poster}
            className="w-full h-full object-contain"
            playsInline
            loop
          />

          {/* Hold to pause indicator */}
          <AnimatePresence>
            {isHolding && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
              >
                <div className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                  <MdPause className="w-10 h-10 text-white" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Double tap animation */}
          <AnimatePresence>
            {showLikeAnimation && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
              >
                <MdFavorite className="w-32 h-32 text-white drop-shadow-2xl" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Play/Pause indicator */}
          <AnimatePresence>
            {!isPlaying && !isHolding && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <div className="w-20 h-20 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center">
                  <MdPlayArrow className="w-12 h-12 text-white ml-1" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50 pointer-events-none" />

          {/* Swipe up hint */}
          <AnimatePresence>
            {showSwipeHint && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute left-1/2 -translate-x-1/2 bottom-36 flex flex-col items-center pointer-events-none z-20"
              >
                <motion.div
                  animate={{ y: [-4, 4, -4] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <MdKeyboardArrowUp className="w-6 h-6 text-white/80" />
                </motion.div>
                <span className="text-white/80 text-xs font-medium">Povuci za detalje</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Seller info - top */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="absolute top-6 left-4 right-4 flex items-center gap-3"
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (seller?.id) {
                  onClose?.();
                  router.push(`/seller/${seller.id}`);
                }
              }}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#F7941D] via-[#E1306C] to-[#833AB4] p-[2px]">
                {seller.image ? (
                  <img
                    src={seller.image}
                    alt=""
                    className="w-full h-full rounded-full object-cover bg-white"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                    <MdStorefront className="w-5 h-5 text-slate-400" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-white text-sm font-semibold truncate">
                    {seller.name}
                  </span>
                  {seller.isVerified && (
                    <MdVerified className="w-4 h-4 text-[#3897F0] shrink-0" />
                  )}
                  {isShop && (
                    <span className="px-1.5 py-0.5 rounded bg-[#F7941D]/90 text-[9px] font-bold text-white uppercase tracking-wide">
                      Shop
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-white/60 text-xs">
                  <span>{formatCount(views)} pregleda</span>
                  {createdAt && (
                    <>
                      <span>•</span>
                      <span>{timeAgo(createdAt)}</span>
                    </>
                  )}
                </div>
              </div>
            </button>
          </motion.div>

          {/* Actions - right side */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="absolute right-4 bottom-32 flex flex-col items-center gap-5"
          >
            <motion.button
              whileTap={{ scale: 0.85 }}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onLike?.();
              }}
              className="flex flex-col items-center"
            >
              <div className="w-12 h-12 flex items-center justify-center">
                {item?.is_liked ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 15 }}
                  >
                    <MdFavorite className="w-8 h-8 text-red-500 drop-shadow-lg" />
                  </motion.div>
                ) : (
                  <MdFavoriteBorder className="w-8 h-8 text-white drop-shadow-lg" />
                )}
              </div>
              <span className="text-white text-xs font-semibold mt-0.5">
                {formatCount(likes)}
              </span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.85 }}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMessage?.(e);
              }}
              className="flex flex-col items-center"
            >
              <div className="w-12 h-12 flex items-center justify-center">
                <MdSend className="w-7 h-7 text-white drop-shadow-lg -rotate-12" />
              </div>
              <span className="text-white text-xs font-semibold mt-0.5">Poruka</span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.85 }}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (navigator.share) {
                  navigator.share({
                    title: item?.name,
                    url: `${window.location.origin}/ad-details/${item?.slug}`,
                  });
                }
              }}
              className="flex flex-col items-center"
            >
              <div className="w-12 h-12 flex items-center justify-center">
                <MdShare className="w-7 h-7 text-white drop-shadow-lg" />
              </div>
              <span className="text-white text-xs font-semibold mt-0.5">Podijeli</span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.85 }}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleMute();
              }}
              className="flex flex-col items-center"
            >
              <div className="w-12 h-12 flex items-center justify-center">
                {isMuted ? (
                  <MdVolumeOff className="w-7 h-7 text-white drop-shadow-lg" />
                ) : (
                  <MdVolumeUp className="w-7 h-7 text-white drop-shadow-lg" />
                )}
              </div>
            </motion.button>
          </motion.div>

          {/* Product info - bottom */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="absolute bottom-4 left-4 right-20"
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goToDetails();
              }}
              className="text-left w-full group"
            >
              <p className="text-white text-lg font-bold leading-snug line-clamp-2 drop-shadow-lg group-hover:underline">
                {item?.translated_item?.name || item?.name || "Oglas"}
              </p>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                {negotiable ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/80 backdrop-blur-sm text-white text-xs font-semibold">
                    <MdLocalOffer className="w-3.5 h-3.5" />
                    Cijena po dogovoru
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white font-bold text-sm">
                    {formatPrice(item?.price)}
                  </span>
                )}
                {city && (
                  <span className="inline-flex items-center gap-1 text-white/70 text-sm">
                    <MdLocationOn className="w-4 h-4" />
                    {city}
                  </span>
                )}
              </div>
            </button>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
