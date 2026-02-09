"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

import {
  allItemApi,
  itemStatisticsApi,
  manageFavouriteApi,
  itemConversationApi,
  sendMessageApi,
} from "@/utils/api";
import { setIsLoginOpen } from "@/redux/reducer/globalStateSlice";
import { getIsLoggedIn, userSignUpData } from "@/redux/reducer/authSlice";
import ReelViewerModal from "@/components/PagesComponent/Seller/ReelViewerModal";
import { getYouTubeVideoId } from "@/utils";

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
  MdLocalOffer,
  MdSpeed,
  MdShuffle,
  MdOpenInNew,
  MdFlag,
  MdAutorenew,
} from "react-icons/md";

/* ── helpers ────────────────────────── */

const fmtPrice = (p) => {
  if (p == null || Number(p) === 0) return "Na upit";
  return `${new Intl.NumberFormat("bs-BA", { maximumFractionDigits: 0 }).format(Number(p))} KM`;
};

const isNeg = (p) => p == null || Number(p) === 0;

const timeAgo = (s) => {
  if (!s) return null;
  const sec = Math.floor((Date.now() - new Date(s).getTime()) / 1000);
  if (sec < 60) return "upravo";
  const m = Math.floor(sec / 60);
  if (m < 60) return `prije ${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `prije ${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `prije ${d}d`;
  const w = Math.floor(d / 7);
  if (w < 4) return `prije ${w}sed`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `prije ${mo}mj`;
  return `prije ${Math.floor(mo / 12)}g`;
};

const pickArr = (r) => {
  const d = r?.data;
  return d?.data?.data || d?.data || d?.items || d?.result || [];
};

const buildVideoMeta = (item) => {
  const raw = item?.video || item?.video_link || null;
  if (!raw) return null;

  if (typeof raw === "string" && raw.startsWith("/")) {
    const base = process.env.NEXT_PUBLIC_ADMIN_URL || "";
    return {
      type: "direct",
      src: base ? `${base}${raw}` : raw,
      poster: item?.image || "",
      raw,
    };
  }

  if (typeof raw === "string" && raw.includes("youtu")) {
    const id = getYouTubeVideoId(raw);
    if (id) {
      return {
        type: "youtube",
        src: `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&controls=0&playsinline=1&rel=0&modestbranding=1`,
        poster: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
        raw,
      };
    }
  }

  return { type: "direct", src: raw, poster: item?.image || "", raw };
};

const num = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const fmtCount = (v) => {
  const n = num(v);
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return String(n);
};

/* ── main component ─────────────────── */

const HomeReels = () => {
  const dispatch = useDispatch();
  const isLoggedIn = useSelector(getIsLoggedIn);
  const currentUser = useSelector(userSignUpData);

  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  /* story viewer state */
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerSellerIdx, setViewerSellerIdx] = useState(0);
  const [viewerItemIdx, setViewerItemIdx] = useState(0);

  /* fun options */
  const [autoPlay, setAutoPlay] = useState(true);
  const [autoStory, setAutoStory] = useState(true);
  const [playSpeed, setPlaySpeed] = useState(1);
  const [shuffled, setShuffled] = useState(false);

  const scrollerRef = useRef(null);
  const storyScrollRef = useRef(null);

  /* fetch */
  const fetchReels = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await allItemApi.getItems({
        status: "approved", limit: 50, page: 1, sort_by: "new-to-old",
      });
      if (res?.data?.error === true) throw new Error(res?.data?.message || "API error");
      const arr = pickArr(res) || [];
      setItems(arr.filter((x) => !!buildVideoMeta(x)));
    } catch (e) {
      console.error("HomeReels fetch:", e);
      toast.error(e?.message || "Ne mogu učitati videe");
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchReels(); }, [fetchReels]);

  /* group by seller */
  const sellerGroups = useMemo(() => {
    const map = {};
    const src = shuffled ? [...items].sort(() => Math.random() - 0.5) : items;
    src.forEach((item) => {
      const sid = item?.user?.id || item?.seller?.id;
      if (!sid) return;
      if (!map[sid]) {
        map[sid] = {
          seller: item?.user || item?.seller || {},
          items: [],
        };
      }
      map[sid].items.push(item);
    });
    return Object.values(map);
  }, [items, shuffled]);

  /* all items flat (for card list) */
  const flatItems = useMemo(() => {
    return shuffled ? [...items].sort(() => Math.random() - 0.5) : items;
  }, [items, shuffled]);

  /* scroll */
  const checkScroll = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScroll, { passive: true });
    checkScroll();
    return () => el.removeEventListener("scroll", checkScroll);
  }, [flatItems, checkScroll]);

  const scrollBy = (dir = 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const w = window.innerWidth < 640 ? 200 : 240;
    el.scrollBy({ left: dir * (w + 12) * 2, behavior: "smooth" });
  };

  /* like */
  const onToggleLike = async (itemId) => {
    if (!isLoggedIn) { dispatch(setIsLoginOpen(true)); return; }
    const cur = items.find((it) => it.id === itemId);
    const next = !cur?.is_liked;
    setItems((p) =>
      p.map((it) =>
        it.id === itemId
          ? { ...it, is_liked: !it.is_liked, total_likes: num(it.total_likes) + (it.is_liked ? -1 : 1) }
          : it
      )
    );
    try {
      const r = await manageFavouriteApi.manageFavouriteApi({ item_id: itemId });
      if (r?.data?.error !== false) throw new Error();
      itemStatisticsApi.trackFavorite({ item_id: itemId, added: next }).catch(() => {});
    } catch {
      setItems((p) =>
        p.map((it) =>
          it.id === itemId
            ? { ...it, is_liked: !it.is_liked, total_likes: num(it.total_likes) + (it.is_liked ? -1 : 1) }
            : it
        )
      );
      toast.error("Greška pri ažuriranju omiljenih");
    }
  };

  /* open story viewer */
  const openStory = (sellerIndex) => {
    setViewerSellerIdx(sellerIndex);
    setViewerItemIdx(0);
    setViewerOpen(true);
  };

  /* open story viewer from reel card */
  const openStoryForItem = (item) => {
    const sid = item?.user?.id || item?.seller?.id;
    const sIdx = sellerGroups.findIndex((g) => {
      const gid = g.seller?.id || g.seller?.user_id;
      return String(gid) === String(sid);
    });
    if (sIdx >= 0) {
      const iIdx = sellerGroups[sIdx].items.findIndex((i) => i.id === item.id);
      setViewerSellerIdx(sIdx);
      setViewerItemIdx(Math.max(0, iIdx));
    } else {
      setViewerSellerIdx(0);
      setViewerItemIdx(0);
    }
    setViewerOpen(true);
  };

  /* shuffle */
  const toggleShuffle = () => {
    setShuffled((p) => !p);
    toast.success(shuffled ? "Originalni redoslijed" : "Pomiješano!");
  };

  /* speed cycle */
  const cycleSpeed = () => {
    const speeds = [1, 1.25, 1.5, 2];
    const cur = speeds.indexOf(playSpeed);
    const next = speeds[(cur + 1) % speeds.length];
    setPlaySpeed(next);
    toast.success(`Brzina: ${next}x`);
  };

  const hasAny = flatItems.length > 0;

  return (
    <section className="relative py-6 lg:py-8">
      {/* Story viewer modal */}
      <ReelViewerModal
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        sellers={sellerGroups}
        initialSellerIndex={viewerSellerIdx}
        initialItemIndex={viewerItemIdx}
        autoAdvance={autoStory}
      />

      {/* ── header ── */}
      <div className="container">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F7941D] via-[#E1306C] to-[#833AB4] p-[2px]">
              <div className="w-full h-full rounded-[10px] bg-white dark:bg-slate-900 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
                  <path d="M4 8V6a2 2 0 012-2h2M4 16v2a2 2 0 002 2h2M16 4h2a2 2 0 012 2v2M16 20h2a2 2 0 002-2v-2" stroke="url(#rg)" strokeWidth="2" strokeLinecap="round" />
                  <path d="M9.5 9l5 3-5 3V9z" fill="url(#rg)" />
                  <defs>
                    <linearGradient id="rg" x1="4" y1="4" x2="20" y2="20">
                      <stop stopColor="#F7941D" /><stop offset="0.5" stopColor="#E1306C" /><stop offset="1" stopColor="#833AB4" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Video priče</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Pogledaj šta prodavači nude</p>
            </div>
          </div>

          {/* controls */}
          {hasAny && (
            <div className="flex items-center gap-2">
              {/* auto-play switch */}
              <div className="hidden sm:flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-full px-3 py-1.5 border border-slate-200/60 dark:border-slate-700/60">
                <MdAutorenew size={14} className={autoPlay ? "text-emerald-500" : "text-slate-400"} />
                <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">Auto</span>
                <button
                  type="button"
                  onClick={() => {
                    setAutoPlay((p) => !p);
                    toast.success(autoPlay ? "Auto-play isključen" : "Auto-play uključen");
                  }}
                  className={`relative w-9 h-5 rounded-full transition-colors duration-300 ${
                    autoPlay ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"
                  }`}
                >
                  <motion.div
                    className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-md"
                    animate={{ left: autoPlay ? 18 : 2 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>

              {/* story auto switch */}
              <div className="hidden sm:flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-full px-3 py-1.5 border border-slate-200/60 dark:border-slate-700/60">
                <MdPlayArrow size={14} className={autoStory ? "text-pink-500" : "text-slate-400"} />
                <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">Auto priče</span>
                <button
                  type="button"
                  onClick={() => {
                    setAutoStory((p) => !p);
                    toast.success(autoStory ? "Auto priče isključene" : "Auto priče uključene");
                  }}
                  className={`relative w-9 h-5 rounded-full transition-colors duration-300 ${
                    autoStory ? "bg-pink-500" : "bg-slate-300 dark:bg-slate-600"
                  }`}
                >
                  <motion.div
                    className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-md"
                    animate={{ left: autoStory ? 18 : 2 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>

              {/* speed */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={cycleSpeed}
                className="hidden sm:flex items-center gap-1 bg-slate-50 dark:bg-slate-800 rounded-full px-2.5 py-1.5 border border-slate-200/60 dark:border-slate-700/60 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              >
                <MdSpeed size={14} />
                {playSpeed}x
              </motion.button>

              {/* shuffle */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={toggleShuffle}
                className={`hidden sm:flex items-center justify-center w-8 h-8 rounded-full border transition ${
                  shuffled
                    ? "bg-[#E1306C]/10 border-[#E1306C]/30 text-[#E1306C]"
                    : "bg-slate-50 dark:bg-slate-800 border-slate-200/60 dark:border-slate-700/60 text-slate-400 hover:text-slate-600"
                }`}
              >
                <MdShuffle size={16} />
              </motion.button>

              {/* nav arrows */}
              <div className="hidden sm:flex items-center gap-1.5">
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  type="button" onClick={() => scrollBy(-1)} disabled={!canScrollLeft}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 ${
                    canScrollLeft ? "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200" : "bg-slate-50 dark:bg-slate-800/50 text-slate-300 dark:text-slate-600 cursor-not-allowed"
                  }`}
                >
                  <MdChevronLeft size={22} />
                </motion.button>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  type="button" onClick={() => scrollBy(1)} disabled={!canScrollRight}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 ${
                    canScrollRight ? "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200" : "bg-slate-50 dark:bg-slate-800/50 text-slate-300 dark:text-slate-600 cursor-not-allowed"
                  }`}
                >
                  <MdChevronRight size={22} />
                </motion.button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── story circles ── */}
      {!isLoading && sellerGroups.length > 0 && (
        <div className="container mb-4">
          <div
            ref={storyScrollRef}
            className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {sellerGroups.map((group, idx) => {
              const s = group.seller;
              const sImg = s?.profile || s?.image || s?.profile_image || null;
              const sName = s?.name || s?.shop_name || "Prodavač";
              const vCount = group.items.length;

              return (
                <motion.button
                  key={s?.id || idx}
                  type="button"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.04, duration: 0.3 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => openStory(idx)}
                  className="flex flex-col items-center gap-1.5 shrink-0 group"
                >
                  <div className="relative">
                    {vCount > 1 && (
                      <>
                        <span className="absolute inset-0 rounded-full bg-gradient-to-br from-[#F7941D]/40 via-[#E1306C]/40 to-[#833AB4]/40 blur-[6px] scale-[1.05] -z-10" />
                        <span className="absolute inset-0 rounded-full border-2 border-white/40 dark:border-slate-800/60 scale-[1.08] -z-10" />
                      </>
                    )}
                    {/* gradient ring */}
                    <div className="w-[68px] h-[68px] rounded-full p-[3px] bg-gradient-to-br from-[#F7941D] via-[#E1306C] to-[#833AB4] group-hover:shadow-lg group-hover:shadow-pink-500/20 transition-shadow duration-300">
                      <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 p-[2px]">
                        {sImg ? (
                          <img src={sImg} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <div className="w-full h-full rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                            <MdStorefront className="w-6 h-6 text-slate-400" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* video count badge */}
                    {vCount > 1 && (
                      <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-gradient-to-br from-[#F7941D] to-[#E1306C] text-white text-[9px] font-bold flex items-center justify-center shadow-md border-2 border-white dark:border-slate-900">
                        {vCount}
                      </span>
                    )}

                    {/* play icon */}
                    <span className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-white dark:bg-slate-900 shadow-md flex items-center justify-center">
                      <MdPlayArrow className="w-3.5 h-3.5 text-[#E1306C]" />
                    </span>
                  </div>

                  <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 truncate max-w-[72px] text-center leading-tight">
                    {sName}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── mobile controls row ── */}
      {!isLoading && hasAny && (
        <div className="sm:hidden container mb-3">
            <div className="flex items-center gap-2">
            {/* auto-play */}
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 rounded-full px-2.5 py-1.5 border border-slate-200/60 dark:border-slate-700/60">
                <MdAutorenew size={13} className={autoPlay ? "text-emerald-500" : "text-slate-400"} />
                <span className="text-[10px] font-medium text-slate-600 dark:text-slate-300">Auto</span>
              <button
                type="button"
                onClick={() => {
                  setAutoPlay((p) => !p);
                  toast.success(autoPlay ? "Auto-play isključen" : "Auto-play uključen");
                }}
                className={`relative w-8 h-[18px] rounded-full transition-colors duration-300 ${
                  autoPlay ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"
                }`}
              >
                <motion.div
                  className="absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white shadow-md"
                  animate={{ left: autoPlay ? 15 : 2 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
                </button>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 rounded-full px-2.5 py-1.5 border border-slate-200/60 dark:border-slate-700/60">
                <MdPlayArrow size={12} className={autoStory ? "text-pink-500" : "text-slate-400"} />
                <span className="text-[10px] font-medium text-slate-600 dark:text-slate-300">Auto priče</span>
                <button
                  type="button"
                  onClick={() => {
                    setAutoStory((p) => !p);
                    toast.success(autoStory ? "Auto priče isključene" : "Auto priče uključene");
                  }}
                  className={`relative w-8 h-[18px] rounded-full transition-colors duration-300 ${
                    autoStory ? "bg-pink-500" : "bg-slate-300 dark:bg-slate-600"
                  }`}
                >
                  <motion.div
                    className="absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white shadow-md"
                    animate={{ left: autoStory ? 15 : 2 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>

            {/* speed */}
            <button
              type="button"
              onClick={cycleSpeed}
              className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 rounded-full px-2 py-1.5 border border-slate-200/60 dark:border-slate-700/60 text-[10px] font-medium text-slate-600 dark:text-slate-300"
            >
              <MdSpeed size={12} /> {playSpeed}x
            </button>

            {/* shuffle */}
            <button
              type="button"
              onClick={toggleShuffle}
              className={`flex items-center justify-center w-7 h-7 rounded-full border transition ${
                shuffled
                  ? "bg-[#E1306C]/10 border-[#E1306C]/30 text-[#E1306C]"
                  : "bg-slate-50 dark:bg-slate-800 border-slate-200/60 dark:border-slate-700/60 text-slate-400"
              }`}
            >
              <MdShuffle size={13} />
            </button>
          </div>
        </div>
      )}

      {/* ── reel cards ── */}
      {isLoading ? (
        <div className="container">
          <div className="flex gap-3 overflow-hidden">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="shrink-0 w-[180px] sm:w-[220px] aspect-[9/16] rounded-2xl bg-slate-200 dark:bg-slate-800 relative overflow-hidden">
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite]"
                  style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)" }} />
                <div className="absolute top-3 left-3 right-3 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-slate-300 dark:bg-slate-700" />
                  <div className="h-3 w-16 rounded bg-slate-300 dark:bg-slate-700" />
                </div>
                <div className="absolute bottom-3 left-3 right-3">
                  <div className="h-4 w-3/4 rounded bg-slate-300 dark:bg-slate-700 mb-2" />
                  <div className="h-3 w-1/2 rounded bg-slate-300 dark:bg-slate-700" />
                </div>
              </div>
            ))}
          </div>
          <style jsx>{`@keyframes shimmer { 100% { transform: translateX(100%); } }`}</style>
        </div>
      ) : !hasAny ? (
        <div className="container">
          <div className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
              <MdPlayArrow className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-600 dark:text-slate-300 font-medium">Trenutno nema video oglasa</p>
            <p className="text-slate-400 text-sm mt-1">Budi prvi koji će objaviti video</p>
          </div>
        </div>
      ) : (
        <div className="relative">
          <div className="hidden sm:block absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white dark:from-slate-900 to-transparent z-10 pointer-events-none" />
          <div className="hidden sm:block absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-slate-900 to-transparent z-10 pointer-events-none" />

          <div
            ref={scrollerRef}
            className="flex gap-3 overflow-x-auto pb-2 pl-4 pr-4 sm:pl-[max(1rem,calc((100vw-1280px)/2+1rem))] sm:pr-[max(1rem,calc((100vw-1280px)/2+1rem))] snap-x snap-mandatory scrollbar-hide scroll-smooth"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {flatItems.map((item, index) => (
              <ReelCard
                key={item.id}
                item={item}
                index={index}
                isLoggedIn={isLoggedIn}
                currentUser={currentUser}
                onLike={() => onToggleLike(item.id)}
                onOpenStory={() => openStoryForItem(item)}
                autoPlay={autoPlay}
                playSpeed={playSpeed}
                sellerGroups={sellerGroups}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default HomeReels;

/* ══════════════════════════════════════
   REEL CARD
══════════════════════════════════════ */

const ReelCard = ({ item, index, isLoggedIn, currentUser, onLike, onOpenStory, autoPlay, playSpeed, sellerGroups }) => {
  const router = useRouter();
  const dispatch = useDispatch();

  const videoRef = useRef(null);
  const wrapperRef = useRef(null);

  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showLikeAnim, setShowLikeAnim] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showMsgInput, setShowMsgInput] = useState(false);
  const [msgText, setMsgText] = useState("");
  const [sending, setSending] = useState(false);

  const holdTimerRef = useRef(null);

  const videoMeta = useMemo(() => buildVideoMeta(item), [item]);
  const videoUrl = videoMeta?.src;
  const poster = videoMeta?.poster || "";
  const isYouTube = videoMeta?.type === "youtube";
  const views = num(item?.total_video_plays) || num(item?.clicks);
  const likes = num(item?.total_likes);

  const seller = item?.user || item?.seller || {};
  const sellerName = seller?.name || seller?.shop_name || "Prodavač";
  const sellerImage = seller?.profile || seller?.image || null;
  const isVerified = seller?.is_verified || seller?.verified || false;
  const isShop = !!(seller?.shop_name || seller?.is_shop);
  const city = item?.translated_city || item?.city || null;
  const createdAt = item?.created_at || null;
  const negotiable = isNeg(item?.price);

  /* how many stories this seller has */
  const sellerStoryCount = useMemo(() => {
    const sid = seller?.id;
    if (!sid) return 1;
    const group = sellerGroups?.find((g) => {
      const gid = g.seller?.id || g.seller?.user_id;
      return String(gid) === String(sid);
    });
    return group?.items?.length || 1;
  }, [seller?.id, sellerGroups]);

  /* autoplay via intersection observer */
  useEffect(() => {
    if (!videoUrl || !autoPlay || isYouTube) return;
    const el = videoRef.current;
    const wr = wrapperRef.current;
    if (!el || !wr) return;
    el.muted = isMuted;
    el.playbackRate = playSpeed;

    const io = new IntersectionObserver(
      async (entries) => {
        const entry = entries[0];
        if (!entry) return;
        if (entry.isIntersecting && entry.intersectionRatio >= 0.7) {
          try { await el.play(); setIsPlaying(true); } catch { setIsPlaying(false); }
        } else {
          el.pause();
          setIsPlaying(false);
        }
      },
      { threshold: [0, 0.5, 0.7, 1] }
    );
    io.observe(wr);
    return () => io.disconnect();
  }, [videoUrl, isMuted, autoPlay, playSpeed, isYouTube]);

  /* progress */
  useEffect(() => {
    if (isYouTube) return;
    const el = videoRef.current;
    if (!el) return;
    const up = () => { if (el.duration) setProgress((el.currentTime / el.duration) * 100); };
    el.addEventListener("timeupdate", up);
    return () => el.removeEventListener("timeupdate", up);
  }, [isYouTube]);

  /* speed update */
  useEffect(() => {
    if (!isYouTube && videoRef.current) videoRef.current.playbackRate = playSpeed;
  }, [playSpeed, isYouTube]);

  const toggleMute = (e) => {
    e?.stopPropagation();
    if (isYouTube) return;
    const el = videoRef.current;
    if (!el) return;
    const next = !isMuted;
    el.muted = next;
    setIsMuted(next);
  };

  const handleDoubleTap = (e) => {
    e.stopPropagation();
    if (!item?.is_liked) onLike?.();
    setShowLikeAnim(true);
    setTimeout(() => setShowLikeAnim(false), 1000);
  };

  const handleHoldStart = (e) => {
    if (e.target.closest("button,input,a")) return;
    if (isYouTube) return;
    holdTimerRef.current = setTimeout(() => {
      const el = videoRef.current;
      if (el && !el.paused) { el.pause(); setIsHolding(true); }
    }, 150);
  };

  const handleHoldEnd = () => {
    if (holdTimerRef.current) { clearTimeout(holdTimerRef.current); holdTimerRef.current = null; }
    if (isHolding) {
      videoRef.current?.play().catch(() => {});
      setIsHolding(false);
    }
  };

  /* message seller (FIXED - uses conversation API) */
  const handleMessageSeller = async (e) => {
    e?.stopPropagation();
    if (!isLoggedIn) { dispatch(setIsLoginOpen(true)); return; }

    const sid = seller?.id || seller?.user_id;
    if (!sid) { toast.error("Prodavač nije pronađen."); return; }
    if (currentUser?.id && String(currentUser.id) === String(sid)) {
      toast.error("Ne možete slati poruku sebi.");
      return;
    }

    setShowMsgInput(true);
  };

  const sendMessage = async () => {
    if (!msgText.trim()) return;
    const sid = seller?.id || seller?.user_id;
    if (!sid) return;

    setSending(true);
    try {
      let cid = null;
      if (item?.id) {
        try {
          const c = await itemConversationApi.checkConversation({ item_id: item.id });
          cid = c?.data?.data?.conversation_id || c?.data?.data?.item_offer_id;
        } catch {}
        if (!cid) {
          const s = await itemConversationApi.startItemConversation({ item_id: item.id });
          cid = s?.data?.data?.conversation_id || s?.data?.data?.item_offer_id || s?.data?.data?.id;
        }
      }
      if (!cid) {
        try {
          const c = await itemConversationApi.checkDirectConversation({ user_id: sid });
          cid = c?.data?.data?.conversation_id || c?.data?.data?.item_offer_id;
        } catch {}
        if (!cid) {
          const s = await itemConversationApi.startDirectConversation({ user_id: sid });
          cid = s?.data?.data?.conversation_id || s?.data?.data?.item_offer_id || s?.data?.data?.id;
        }
      }
      if (!cid) throw new Error("Ne mogu pokrenuti razgovor.");
      const r = await sendMessageApi.sendMessage({ item_offer_id: cid, message: msgText.trim() });
      if (r?.data?.error === false) {
        toast.success("Poruka poslana!");
        setMsgText("");
        setShowMsgInput(false);
      } else throw new Error(r?.data?.message || "Greška.");
    } catch (err) {
      toast.error(err?.message || "Ne mogu poslati poruku.");
    } finally {
      setSending(false);
    }
  };

  const handleShare = (e) => {
    e?.stopPropagation();
    const url = `${window.location.origin}/ad-details/${item?.slug}`;
    if (navigator.share) {
      navigator.share({ title: item?.name, url });
    } else {
      navigator.clipboard?.writeText(url).then(() => toast.success("Link kopiran!")).catch(() => {});
    }
  };

  if (!videoUrl) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: index * 0.04 }}
      ref={wrapperRef}
      className="snap-start shrink-0 w-[180px] sm:w-[220px] aspect-[9/16] rounded-2xl overflow-hidden bg-slate-900 relative cursor-pointer group"
      onClick={onOpenStory}
      onDoubleClick={handleDoubleTap}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); handleHoldEnd(); setShowMenu(false); }}
      onMouseDown={handleHoldStart}
      onMouseUp={handleHoldEnd}
      onTouchStart={handleHoldStart}
      onTouchEnd={handleHoldEnd}
      role="button"
      tabIndex={0}
      style={{
        boxShadow: isHovered ? "0 20px 50px -10px rgba(0,0,0,0.3)" : "0 10px 30px -10px rgba(0,0,0,0.2)",
        transition: "box-shadow 0.3s ease",
      }}
    >
      {isYouTube ? (
        <div className="absolute inset-0">
          <img
            src={poster}
            alt={item?.name || "Video"}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/25" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
              <MdPlayArrow className="w-7 h-7 text-white ml-0.5" />
            </div>
          </div>
        </div>
      ) : (
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
      )}

      {/* progress bar */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/20 z-10">
        <motion.div className="h-full bg-white" style={{ width: `${progress}%` }} transition={{ duration: 0.1 }} />
      </div>

      {/* gradients */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none" />

      {/* story count badge */}
      {sellerStoryCount > 1 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-2 right-10 z-10 px-1.5 py-0.5 rounded-full bg-gradient-to-r from-[#F7941D] to-[#E1306C] text-white text-[9px] font-bold shadow-md"
        >
          {sellerStoryCount} videa
        </motion.div>
      )}

      {/* hold indicator */}
      <AnimatePresence>
        {isHolding && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
          >
            <div className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
              <MdPause className="w-7 h-7 text-white" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* double tap like */}
      <AnimatePresence>
        {showLikeAnim && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
          >
            <MdFavorite className="w-20 h-20 text-white drop-shadow-lg" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* top: seller info */}
      <div className="absolute top-2 left-2 right-2 flex items-center justify-between z-10">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); if (seller?.id) router.push(`/seller/${seller.id}`); }}
          className="flex items-center gap-1.5 min-w-0 hover:opacity-80 transition-opacity"
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#F7941D] via-[#E1306C] to-[#833AB4] p-[1.5px] shrink-0">
            {sellerImage ? (
              <img src={sellerImage} alt="" className="w-full h-full rounded-full object-cover bg-white" />
            ) : (
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                <MdStorefront className="w-3.5 h-3.5 text-slate-400" />
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 min-w-0">
            <span className="text-white text-[11px] font-semibold truncate max-w-[60px]">{sellerName}</span>
            {isVerified && <MdVerified className="w-3 h-3 text-[#3897F0] shrink-0" />}
            {isShop && <span className="px-1.5 py-0.5 rounded bg-[#F7941D]/90 text-[8px] font-bold text-white uppercase tracking-wide">Shop</span>}
            {isYouTube && <span className="px-1.5 py-0.5 rounded bg-white/20 text-[8px] font-bold text-white uppercase tracking-wide">YT</span>}
          </div>
        </button>

        <button
          type="button"
          onClick={toggleMute}
          disabled={isYouTube}
          className={`w-7 h-7 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center transition-transform ${
            isYouTube ? "opacity-50 cursor-not-allowed" : "hover:scale-110"
          }`}
        >
          {isMuted ? <MdVolumeOff size={14} /> : <MdVolumeUp size={14} />}
        </button>
      </div>

      {/* play/pause */}
      <AnimatePresence>
        {!isPlaying && !autoPlay && (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <div className="w-14 h-14 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
              <MdPlayArrow className="w-8 h-8 text-white ml-0.5" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* right actions */}
      <div className="absolute right-2 bottom-24 flex flex-col items-center gap-3">
        <motion.button whileTap={{ scale: 0.85 }} type="button"
          onClick={(e) => { e.stopPropagation(); onLike?.(); }}
          className="flex flex-col items-center"
        >
          <div className="w-9 h-9 flex items-center justify-center">
            {item?.is_liked ? (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 15 }}>
                <MdFavorite className="w-7 h-7 text-red-500 drop-shadow-lg" />
              </motion.div>
            ) : (
              <MdFavoriteBorder className="w-7 h-7 text-white drop-shadow-lg" />
            )}
          </div>
          <span className="text-white text-[10px] font-semibold drop-shadow">{fmtCount(likes)}</span>
        </motion.button>

        <motion.button whileTap={{ scale: 0.85 }} type="button"
          onClick={handleMessageSeller}
          className="flex flex-col items-center"
        >
          <div className="w-9 h-9 flex items-center justify-center">
            <MdSend className="w-6 h-6 text-white drop-shadow-lg -rotate-12" />
          </div>
        </motion.button>

        <motion.button whileTap={{ scale: 0.85 }} type="button"
          onClick={handleShare}
          className="flex flex-col items-center"
        >
          <div className="w-9 h-9 flex items-center justify-center">
            <MdShare className="w-6 h-6 text-white drop-shadow-lg" />
          </div>
        </motion.button>

        {/* three dots menu */}
        <div className="relative">
          <motion.button whileTap={{ scale: 0.85 }} type="button"
            onClick={(e) => { e.stopPropagation(); setShowMenu((p) => !p); }}
            className="flex flex-col items-center"
          >
            <div className="w-9 h-9 flex items-center justify-center">
              <MdMoreVert className="w-6 h-6 text-white drop-shadow-lg" />
            </div>
          </motion.button>

          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -5 }}
                className="absolute bottom-10 right-0 z-30 bg-white dark:bg-slate-800 rounded-xl shadow-2xl overflow-hidden min-w-[160px] border border-slate-100 dark:border-slate-700"
              >
                {[
                  { icon: MdOpenInNew, label: "Pogledaj oglas", fn: () => router.push(`/ad-details/${item?.slug}`) },
                  { icon: MdStorefront, label: "Profil prodavača", fn: () => seller?.id && router.push(`/seller/${seller.id}`) },
                  { icon: MdShare, label: "Podijeli", fn: () => handleShare() },
                  { icon: MdFlag, label: "Prijavi", fn: () => toast.info("Prijava zabilježena. Hvala!") },
                ].map((o, i) => (
                  <button
                    key={i} type="button"
                    onClick={(e) => { e.stopPropagation(); o.fn(); setShowMenu(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <o.icon size={14} className="text-slate-400" />
                    {o.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* inline message input (on card) */}
      <AnimatePresence>
        {showMsgInput && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute left-2 right-2 bottom-24 z-20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-1 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-full px-2.5 py-1.5 shadow-lg border border-white/30">
              <input
                type="text"
                value={msgText}
                onChange={(e) => setMsgText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") sendMessage(); if (e.key === "Escape") setShowMsgInput(false); }}
                placeholder="Poruka..."
                className="flex-1 bg-transparent text-slate-900 dark:text-white placeholder-slate-400 text-[11px] outline-none min-w-0"
                autoFocus
              />
              <button
                type="button"
                onClick={sendMessage}
                disabled={!msgText.trim() || sending}
                className="w-6 h-6 rounded-full bg-gradient-to-br from-[#F7941D] to-[#E1306C] flex items-center justify-center text-white disabled:opacity-40 shrink-0"
              >
                {sending ? (
                  <div className="w-3 h-3 border-[1.5px] border-white/50 border-t-white rounded-full animate-spin" />
                ) : (
                  <MdSend size={11} />
                )}
              </button>
              <button type="button" onClick={() => setShowMsgInput(false)}
                className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0"
              >
                <MdClose size={10} className="text-slate-500" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* bottom: product info */}
      <div className="absolute bottom-2 left-2 right-12">
        {createdAt && (
          <div className="flex items-center gap-1 mb-1.5">
            <MdAccessTime className="w-3 h-3 text-white/60" />
            <span className="text-white/60 text-[10px]">{timeAgo(createdAt)}</span>
          </div>
        )}

        <button type="button" onClick={(e) => { e.stopPropagation(); router.push(`/ad-details/${item?.slug}`); }} className="text-left w-full">
          <p className="text-white text-sm font-bold leading-snug line-clamp-2 drop-shadow-lg">
            {item?.translated_item?.name || item?.name || "Oglas"}
          </p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {negotiable ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/80 text-white text-[10px] font-semibold">
                <MdLocalOffer className="w-3 h-3" /> Po dogovoru
              </span>
            ) : (
              <span className="text-white font-bold text-sm drop-shadow-lg">{fmtPrice(item?.price)}</span>
            )}
          </div>
          {city && (
            <div className="flex items-center gap-1 mt-1">
              <MdLocationOn className="w-3 h-3 text-white/70" />
              <span className="text-white/70 text-[11px]">{city}</span>
            </div>
          )}
        </button>

        <div className="flex items-center gap-1 mt-1.5">
          <MdPlayArrow className="w-3 h-3 text-white/60" />
          <span className="text-white/60 text-[10px]">{fmtCount(views)} pregleda</span>
        </div>
      </div>
    </motion.div>
  );
};
