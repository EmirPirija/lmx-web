"use client";

import { memo, useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "@/utils/toastBs";
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
import MembershipBadge from "@/components/Common/MembershipBadge";
import { getYouTubeVideoId } from "@/utils";
import { cn } from "@/lib/utils";

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
} from "@/components/Common/UnifiedIconPack";

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

const getSellerIdFromItem = (item) => {
  const raw = item?.user?.id
    ?? item?.seller?.id
    ?? item?.user_id
    ?? item?.seller_id
    ?? item?.user?.user_id
    ?? item?.seller?.user_id;

  if (raw == null || raw === "") return null;
  return String(raw);
};

const num = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const fmtCount = (v) => {
  const n = num(v);
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return String(n);
};

const hashString = (value) => {
  let hash = 2166136261;
  const input = String(value ?? "");
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const shuffleWithSeed = (source, seed) => {
  if (!Array.isArray(source) || source.length < 2) return source;
  return [...source].sort((a, b) => {
    const aKey = `${seed}:${a?.id ?? ""}:${a?.user_id ?? ""}`;
    const bKey = `${seed}:${b?.id ?? ""}:${b?.user_id ?? ""}`;
    return hashString(aKey) - hashString(bKey);
  });
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
  const [shuffleSeed, setShuffleSeed] = useState(() => Date.now());

  const scrollerRef = useRef(null);
  const storyScrollRef = useRef(null);
  const scrollRafRef = useRef(0);

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
    const src = shuffled ? shuffleWithSeed(items, shuffleSeed) : items;
    src.forEach((item) => {
      const sellerId = getSellerIdFromItem(item);
      if (!sellerId) return;
      if (!map[sellerId]) {
        map[sellerId] = {
          sellerId,
          seller: item?.user || item?.seller || {},
          items: [],
        };
      }
      map[sellerId].items.push(item);
    });
    return Object.values(map);
  }, [items, shuffled, shuffleSeed]);

  /* scroll */
  const checkScroll = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const nextLeft = el.scrollLeft > 10;
    const nextRight = el.scrollLeft < el.scrollWidth - el.clientWidth - 10;
    setCanScrollLeft((prev) => (prev === nextLeft ? prev : nextLeft));
    setCanScrollRight((prev) => (prev === nextRight ? prev : nextRight));
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onScroll = () => {
      if (scrollRafRef.current) return;
      scrollRafRef.current = requestAnimationFrame(() => {
        scrollRafRef.current = 0;
        checkScroll();
      });
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    checkScroll();
    return () => {
      el.removeEventListener("scroll", onScroll);
      if (scrollRafRef.current) {
        cancelAnimationFrame(scrollRafRef.current);
        scrollRafRef.current = 0;
      }
    };
  }, [sellerGroups, checkScroll]);

  const scrollBy = useCallback((dir = 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const w = window.innerWidth < 640 ? 200 : 240;
    el.scrollBy({ left: dir * (w + 12) * 2, behavior: "smooth" });
  }, []);

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
  const openStory = useCallback((sellerIndex) => {
    setViewerSellerIdx(sellerIndex);
    setViewerItemIdx(0);
    setViewerOpen(true);
  }, []);

  /* shuffle */
  const toggleShuffle = useCallback(() => {
    setShuffled((prev) => {
      const next = !prev;
      if (next) setShuffleSeed(Date.now());
      toast.success(next ? "Pomiješano!" : "Originalni redoslijed");
      return next;
    });
  }, []);

  const toggleAutoPlay = useCallback(() => {
    setAutoPlay((prev) => {
      const next = !prev;
      toast.success(next ? "Auto-play uključen" : "Auto-play isključen");
      return next;
    });
  }, []);

  const toggleAutoStory = useCallback(() => {
    setAutoStory((prev) => {
      const next = !prev;
      toast.success(next ? "Auto priče uključene" : "Auto priče isključene");
      return next;
    });
  }, []);

  /* speed cycle */
  const cycleSpeed = useCallback(() => {
    const speeds = [1, 1.25, 1.5, 2];
    const cur = speeds.indexOf(playSpeed);
    const next = speeds[(cur + 1) % speeds.length];
    setPlaySpeed(next);
    toast.success(`Brzina: ${next}x`);
  }, [playSpeed]);

  const hasAny = sellerGroups.length > 0;

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
        advanceAcrossSellers={false}
      />

      {/* ── header ── */}
      <div className="container">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" id="Ins-Fill--Streamline-Mingcute-Fill" height="36" width="36">
 
  <g fill="none" fill-rule="nonzero">
    <path d="M16 0v16H0V0h16ZM8.395333333333333 15.505333333333333l-0.007333333333333332 0.0013333333333333333 -0.047333333333333324 0.023333333333333334 -0.013333333333333332 0.0026666666666666666 -0.009333333333333332 -0.0026666666666666666 -0.047333333333333324 -0.023333333333333334c-0.006666666666666666 -0.0026666666666666666 -0.012666666666666666 -0.0006666666666666666 -0.016 0.003333333333333333l-0.0026666666666666666 0.006666666666666666 -0.011333333333333334 0.2853333333333333 0.003333333333333333 0.013333333333333332 0.006666666666666666 0.008666666666666666 0.06933333333333333 0.049333333333333326 0.009999999999999998 0.0026666666666666666 0.008 -0.0026666666666666666 0.06933333333333333 -0.049333333333333326 0.008 -0.010666666666666666 0.0026666666666666666 -0.011333333333333334 -0.011333333333333334 -0.2846666666666666c-0.0013333333333333333 -0.006666666666666666 -0.005999999999999999 -0.011333333333333334 -0.011333333333333334 -0.011999999999999999Zm0.17666666666666667 -0.07533333333333334 -0.008666666666666666 0.0013333333333333333 -0.12333333333333332 0.062 -0.006666666666666666 0.006666666666666666 -0.002 0.007333333333333332 0.011999999999999999 0.2866666666666666 0.003333333333333333 0.008 0.005333333333333333 0.004666666666666666 0.134 0.062c0.008 0.0026666666666666666 0.015333333333333332 0 0.019333333333333334 -0.005333333333333333l0.0026666666666666666 -0.009333333333333332 -0.02266666666666667 -0.4093333333333333c-0.002 -0.008 -0.006666666666666666 -0.013333333333333332 -0.013333333333333332 -0.014666666666666665Zm-0.4766666666666666 0.0013333333333333333a0.015333333333333332 0.015333333333333332 0 0 0 -0.018 0.004l-0.004 0.009333333333333332 -0.02266666666666667 0.4093333333333333c0 0.008 0.004666666666666666 0.013333333333333332 0.011333333333333334 0.016l0.009999999999999998 -0.0013333333333333333 0.134 -0.062 0.006666666666666666 -0.005333333333333333 0.0026666666666666666 -0.007333333333333332 0.011333333333333334 -0.2866666666666666 -0.002 -0.008 -0.006666666666666666 -0.006666666666666666 -0.12266666666666666 -0.06133333333333333Z" stroke-width="0.6667"></path>
    <path fill="#0ab6af" d="M10.666666666666666 2a3.333333333333333 3.333333333333333 0 0 1 3.333333333333333 3.333333333333333v5.333333333333333a3.333333333333333 3.333333333333333 0 0 1 -3.333333333333333 3.333333333333333H5.333333333333333a3.333333333333333 3.333333333333333 0 0 1 -3.333333333333333 -3.333333333333333V5.333333333333333a3.333333333333333 3.333333333333333 0 0 1 3.333333333333333 -3.333333333333333h5.333333333333333Zm-2.6666666666666665 3.333333333333333a2.6666666666666665 2.6666666666666665 0 1 0 0 5.333333333333333 2.6666666666666665 2.6666666666666665 0 0 0 0 -5.333333333333333Zm0 1.3333333333333333a1.3333333333333333 1.3333333333333333 0 1 1 0 2.6666666666666665 1.3333333333333333 1.3333333333333333 0 0 1 0 -2.6666666666666665Zm3 -2.333333333333333a0.6666666666666666 0.6666666666666666 0 1 0 0 1.3333333333333333 0.6666666666666666 0.6666666666666666 0 0 0 0 -1.3333333333333333Z" stroke-width="0.6667"></path>
  </g>
</svg>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Video objave</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Pogledaj šta prodavači nude</p>
            </div>
          </div>

          {hasAny && (
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
          )}
        </div>
      </div>

      {/* ── story circles ── */}
      {!isLoading && sellerGroups.length > 0 && (
        <div className="container mb-4">
          <div
            ref={storyScrollRef}
            className="flex gap-4 overflow-x-auto overflow-x-visible pb-2 scrollbar-hide"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {sellerGroups.map((group, idx) => {
              const s = group.seller;
              const sImg = s?.profile || s?.image || s?.profile_image || null;
              const sName = s?.name || s?.shop_name || "Prodavač";
              const vCount = group.items.length;

              return (
                <motion.button
                  key={group.sellerId || s?.id || idx}
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
                      <div className="w-full h-full rounded-full p-[2px]">
                        {sImg ? (
                          <img src={sImg} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <div className="w-full h-full rounded-full bg-black/25 dark:bg-black/30 backdrop-blur-[1px] flex items-center justify-center">
                            <MdStorefront className="w-6 h-6 text-white/90" />
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
                    <span className="absolute bottom-0 right-0 w-5 h-5 rounded-full border border-white/70 bg-black/20 backdrop-blur-[2px] flex items-center justify-center">
                      <MdPlayArrow className="w-3.5 h-3.5 text-white" />
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
            className="flex gap-3 overflow-x-visible pb-2 pl-4 pr-4 sm:pl-[max(1rem,calc((100vw-1280px)/2+1rem))] sm:pr-[max(1rem,calc((100vw-1280px)/2+1rem))] snap-x snap-mandatory scrollbar-hide scroll-smooth"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {sellerGroups.map((group, index) => {
              const previewItem = group?.items?.[0];
              if (!previewItem) return null;

              return (
                <ReelCard
                  key={`${group.sellerId || "seller"}-${previewItem.id || index}`}
                  item={previewItem}
                  sellerGroup={group}
                  index={index}
                  isLoggedIn={isLoggedIn}
                  currentUser={currentUser}
                  onLike={onToggleLike}
                  onOpenStory={openStory}
                  autoPlay={autoPlay}
                  autoStory={autoStory}
                  playSpeed={playSpeed}
                  shuffled={shuffled}
                  onToggleAutoPlay={toggleAutoPlay}
                  onToggleAutoStory={toggleAutoStory}
                  onCycleSpeed={cycleSpeed}
                  onToggleShuffle={toggleShuffle}
                />
              );
            })}
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

const ReelCard = memo(({
  item,
  sellerGroup,
  index,
  isLoggedIn,
  currentUser,
  onLike,
  onOpenStory,
  autoPlay,
  autoStory,
  playSpeed,
  shuffled,
  onToggleAutoPlay,
  onToggleAutoStory,
  onCycleSpeed,
  onToggleShuffle,
}) => {
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
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);

  const holdTimerRef = useRef(null);
  const likeTimerRef = useRef(null);
  const progressRafRef = useRef(0);
  const progressValueRef = useRef(0);

  const videoMeta = useMemo(() => buildVideoMeta(item), [item]);
  const videoUrl = videoMeta?.src;
  const poster = videoMeta?.poster || "";
  const isYouTube = videoMeta?.type === "youtube";
  const views = num(item?.total_video_plays) || num(item?.clicks);
  const likes = num(item?.total_likes);

  const seller = sellerGroup?.seller || item?.user || item?.seller || {};
  const sellerName = seller?.name || seller?.shop_name || "Prodavač";
  const sellerImage = seller?.profile || seller?.image || null;
  const isVerified = seller?.is_verified || seller?.verified || false;
  const isShop = !!(seller?.shop_name || seller?.is_shop);
  const city = item?.translated_city || item?.city || null;
  const createdAt = item?.created_at || null;
  const negotiable = isNeg(item?.price);

  const sellerStoryCount = Math.max(1, sellerGroup?.items?.length || 0);

  const sellerStoryIndex = useMemo(() => {
    if (!sellerGroup?.items?.length) return 0;
    const idx = sellerGroup.items.findIndex((groupItem) => String(groupItem?.id) === String(item?.id));
    return idx >= 0 ? idx : 0;
  }, [sellerGroup, item?.id]);

  const handleOpenStory = useCallback(() => {
    onOpenStory?.(index);
  }, [onOpenStory, index]);

  const commitProgress = useCallback((nextValue) => {
    const clamped = Math.max(0, Math.min(100, nextValue || 0));
    if (Math.abs(clamped - progressValueRef.current) < 0.8) return;
    progressValueRef.current = clamped;
    if (progressRafRef.current) return;
    progressRafRef.current = requestAnimationFrame(() => {
      progressRafRef.current = 0;
      setProgress(progressValueRef.current);
    });
  }, []);

  useEffect(() => {
    setShouldLoadVideo(isYouTube);
    setProgress(0);
    progressValueRef.current = 0;
  }, [item?.id, isYouTube]);

  useEffect(() => {
    if (isYouTube || shouldLoadVideo) return;
    const wr = wrapperRef.current;
    if (!wr || typeof IntersectionObserver === "undefined") {
      setShouldLoadVideo(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        if (entry.isIntersecting || entry.intersectionRatio > 0) {
          setShouldLoadVideo(true);
          io.disconnect();
        }
      },
      { root: null, rootMargin: "240px 0px", threshold: [0, 0.01] }
    );
    io.observe(wr);

    return () => io.disconnect();
  }, [isYouTube, shouldLoadVideo]);

  /* autoplay via intersection observer */
  useEffect(() => {
    if (!videoUrl || !autoPlay || isYouTube || !shouldLoadVideo) return;
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
  }, [videoUrl, isMuted, autoPlay, playSpeed, isYouTube, shouldLoadVideo]);

  /* progress */
  useEffect(() => {
    if (isYouTube || !shouldLoadVideo) return;
    const el = videoRef.current;
    if (!el) return;
    const up = () => {
      if (!el.duration) return;
      commitProgress((el.currentTime / el.duration) * 100);
    };
    el.addEventListener("timeupdate", up);
    el.addEventListener("loadedmetadata", up);
    el.addEventListener("seeking", up);
    return () => {
      el.removeEventListener("timeupdate", up);
      el.removeEventListener("loadedmetadata", up);
      el.removeEventListener("seeking", up);
      if (progressRafRef.current) {
        cancelAnimationFrame(progressRafRef.current);
        progressRafRef.current = 0;
      }
    };
  }, [isYouTube, shouldLoadVideo, commitProgress]);

  /* speed update */
  useEffect(() => {
    if (!isYouTube && shouldLoadVideo && videoRef.current) videoRef.current.playbackRate = playSpeed;
  }, [playSpeed, isYouTube, shouldLoadVideo]);

  useEffect(() => () => {
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    if (likeTimerRef.current) clearTimeout(likeTimerRef.current);
    if (progressRafRef.current) cancelAnimationFrame(progressRafRef.current);
  }, []);

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
    if (!item?.is_liked && item?.id) onLike?.(item.id);
    setShowLikeAnim(true);
    if (likeTimerRef.current) clearTimeout(likeTimerRef.current);
    likeTimerRef.current = setTimeout(() => setShowLikeAnim(false), 1000);
  };

  const handleHoldStart = (e) => {
    if (e.target.closest("button,input,a")) return;
    if (isYouTube || !shouldLoadVideo) return;
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
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
      className="snap-start shrink-0 w-[180px] sm:w-[220px] aspect-[9/16] rounded-2xl overflow-hidden bg-black/20 relative cursor-pointer group touch-manipulation"
      onClick={handleOpenStory}
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
          <div className="absolute inset-0 bg-black/10" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full border border-white/50 bg-black/20 backdrop-blur-[2px] flex items-center justify-center">
              <MdPlayArrow className="w-7 h-7 text-white ml-0.5" />
            </div>
          </div>
        </div>
      ) : !shouldLoadVideo ? (
        <div className="absolute inset-0">
          <img
            src={poster || item?.image}
            alt={item?.name || "Video"}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/15" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full border border-white/45 bg-black/25 backdrop-blur-[2px] flex items-center justify-center">
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
          preload={autoPlay ? "metadata" : "none"}
        />
      )}

      {/* progress bar */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/20 z-10">
        <motion.div className="h-full bg-white" style={{ width: `${progress}%` }} transition={{ duration: 0.1 }} />
      </div>

      {sellerStoryCount > 1 && (
        <div className="absolute top-2 left-2 right-2 z-10 flex items-center justify-center gap-1.5">
          {Array.from({ length: sellerStoryCount }).map((_, idx) => (
            <span
              key={`dot-${idx}`}
              className={cn(
                "h-1.5 rounded-full transition-all",
                idx === sellerStoryIndex ? "w-4 bg-white" : "w-1.5 bg-white/50"
              )}
            />
          ))}
        </div>
      )}

      {/* gradients */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none" />

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
          onClick={(e) => {
            e.stopPropagation();
            const sid = seller?.id || seller?.user_id;
            if (sid) router.push(`/seller/${sid}`);
          }}
          className="flex items-center gap-1.5 min-w-0 hover:opacity-80 transition-opacity"
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#F7941D] via-[#E1306C] to-[#833AB4] p-[1.5px] shrink-0">
            {sellerImage ? (
              <img src={sellerImage} alt="" className="w-full h-full rounded-full object-cover ring-1 ring-white/60" />
            ) : (
              <div className="w-full h-full rounded-full bg-black/25 backdrop-blur-[2px] border border-white/45 flex items-center justify-center">
                <MdStorefront className="w-3.5 h-3.5 text-white/90" />
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 min-w-0">
            <span className="text-white text-[11px] font-semibold truncate max-w-[60px]">{sellerName}</span>
            {isVerified && <MdVerified className="w-3 h-3 text-[#3897F0] shrink-0" />}
            {isShop && (
              <MembershipBadge
                tier="shop"
                size="xs"
                uppercase
                className="!text-[8px] !px-1.5 !py-0.5"
              />
            )}
            {isYouTube && <span className="px-1.5 py-0.5 rounded bg-white/20 text-[8px] font-bold text-white uppercase tracking-wide">YT</span>}
          </div>
        </button>

        <button
          type="button"
          onClick={toggleMute}
          disabled={isYouTube}
          className={`w-7 h-7 rounded-full border border-white/30 bg-black/20 backdrop-blur-[2px] text-white flex items-center justify-center transition-transform ${
            isYouTube ? "opacity-50 cursor-not-allowed" : "hover:scale-110"
          }`}
        >
          {isMuted ? <MdVolumeOff size={14} /> : <MdVolumeUp size={14} />}
        </button>
      </div>

      {/* in-video controls */}
      {/* <div className="absolute top-11 left-2 right-10 z-10">
        <div className="flex flex-wrap items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleAutoPlay?.();
            }}
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold backdrop-blur-[2px] transition ${
              autoPlay
                ? "border-emerald-300/70 bg-emerald-500/25 text-emerald-100"
                : "border-white/35 bg-black/20 text-white/85"
            }`}
          >
            <MdAutorenew size={11} />
            Auto
          </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleAutoStory?.();
              }}
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold backdrop-blur-[2px] transition ${
                autoStory
                  ? "border-pink-300/70 bg-pink-500/25 text-pink-100"
                  : "border-white/35 bg-black/20 text-white/85"
              }`}
            >
              <MdPlayArrow size={11} />
              Auto priče
            </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onCycleSpeed?.();
            }}
            className="inline-flex items-center gap-1 rounded-full border border-white/35 bg-black/20 px-2 py-1 text-[10px] font-semibold text-white/90 backdrop-blur-[2px] transition hover:bg-black/30"
          >
            <MdSpeed size={11} />
            {playSpeed}x
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleShuffle?.();
            }}
            className={`inline-flex items-center justify-center rounded-full border p-1.5 backdrop-blur-[2px] transition ${
              shuffled
                ? "border-[#E1306C]/70 bg-[#E1306C]/25 text-pink-100"
                : "border-white/35 bg-black/20 text-white/85"
            }`}
            aria-label="Promijeni redoslijed videa"
          >
            <MdShuffle size={11} />
          </button>
        </div>
      </div> */}

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
      <div className="absolute right-2 bottom-8 flex flex-col items-center gap-3">
        <motion.button whileTap={{ scale: 0.85 }} type="button"
          onClick={(e) => { e.stopPropagation(); if (item?.id) onLike?.(item.id); }}
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
                className="absolute bottom-10 right-0 z-30 bg-white dark:bg-slate-800 rounded-xl shadow-2xl overflow-hidden min-w-[170px] border border-slate-100 dark:border-slate-700"
              >
                {[
                  { icon: MdAutorenew, label: autoPlay ? "Auto: uključeno" : "Auto: isključeno", fn: () => onToggleAutoPlay?.() },
                  { icon: MdPlayArrow, label: autoStory ? "Auto priče: uključeno" : "Auto priče: isključeno", fn: () => onToggleAutoStory?.() },
                  { icon: MdSpeed, label: `Brzina: ${playSpeed}x`, fn: () => onCycleSpeed?.() },
                  { icon: MdShuffle, label: shuffled ? "Mix: uključen" : "Mix: isključen", fn: () => onToggleShuffle?.() },
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
});

ReelCard.displayName = "ReelCard";
