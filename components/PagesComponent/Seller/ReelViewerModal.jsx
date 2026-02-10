"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

import {
  MdClose,
  MdFavorite,
  MdFavoriteBorder,
  MdVolumeOff,
  MdVolumeUp,
  MdSend,
  MdShare,
  MdMoreVert,
  MdVerified,
  MdStorefront,
  MdPlayArrow,
  MdPause,
  MdLocationOn,
  MdLocalOffer,
  MdChevronLeft,
  MdChevronRight,
  MdFlag,
  MdOpenInNew,
  MdKeyboardArrowUp,
} from "react-icons/md";

import {
  allItemApi,
  manageFavouriteApi,
  itemStatisticsApi,
  itemConversationApi,
  sendMessageApi,
} from "@/utils/api";
import { setIsLoginOpen } from "@/redux/reducer/globalStateSlice";
import { getIsLoggedIn, userSignUpData } from "@/redux/reducer/authSlice";
import { getYouTubeVideoId } from "@/utils";

/* ── helpers ────────────────────────────────────── */

const pickItemsArray = (r) => {
  const d = r?.data;
  return d?.data?.data || d?.data || d?.items || d?.result || [];
};

const pickVideoMeta = (item) => {
  const raw = item?.video || item?.video_link || null;
  if (!raw) return null;
  if (typeof raw === "string" && raw.startsWith("/")) {
    const base = process.env.NEXT_PUBLIC_ADMIN_URL || "";
    return { type: "direct", src: base ? `${base}${raw}` : raw, raw };
  }
  if (typeof raw === "string" && raw.includes("youtu")) {
    const id = getYouTubeVideoId(raw);
    if (id) {
      return {
        type: "youtube",
        src: `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&controls=0&playsinline=1&rel=0&modestbranding=1`,
        thumb: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
        raw,
      };
    }
  }
  return { type: "direct", src: raw, raw };
};

const fmtPrice = (p) => {
  if (p == null || Number(p) === 0) return "Na upit";
  return `${new Intl.NumberFormat("bs-BA", { maximumFractionDigits: 0 }).format(Number(p))} KM`;
};

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

const num = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const fmtCount = (v) => {
  const n = num(v);
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return String(n);
};

const YT_STORY_SECONDS = 12;

/* ── component ──────────────────────────────────── */

const ReelViewerModal = ({
  open,
  onOpenChange,
  userId,
  sellers: sellersProp,
  initialSellerIndex = 0,
  initialItemIndex = 0,
  autoAdvance = true,
}) => {
  const router = useRouter();
  const dispatch = useDispatch();
  const isLoggedIn = useSelector(getIsLoggedIn);
  const currentUser = useSelector(userSignUpData);

  /* state */
  const [allSellers, setAllSellers] = useState([]);
  const [sIdx, setSIdx] = useState(0);
  const [iIdx, setIIdx] = useState(0);
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(false);
  const [holding, setHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [likeAnim, setLikeAnim] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msgText, setMsgText] = useState("");
  const [sending, setSending] = useState(false);
  const [moreMenu, setMoreMenu] = useState(false);
  const [msgInput, setMsgInput] = useState(false);
  const [dir, setDir] = useState(0);

  const vidRef = useRef(null);
  const holdRef = useRef(null);
  const sxRef = useRef(null);
  const syRef = useRef(null);
  const ytTimerRef = useRef(null);
  const ytProgressRef = useRef(null);

  /* derived */
  const cur = allSellers[sIdx];
  const items = cur?.items || [];
  const item = items[iIdx];
  const vMeta = item ? pickVideoMeta(item) : null;
  const vUrl = vMeta?.src || null;
  const isYouTube = vMeta?.type === "youtube";

  const seller = cur?.seller || {};
  const sName = seller?.name || seller?.shop_name || "Prodavač";
  const sImg = seller?.profile || seller?.image || seller?.profile_image || null;
  const verified = seller?.is_verified || seller?.verified || false;
  const shop = !!(seller?.shop_name || seller?.is_shop);
  const nSellers = allSellers.length;
  const nItems = items.length;

  /* fetch for single-seller mode */
  const fetchUser = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await allItemApi.getItems({
        user_id: userId, has_video: 1, status: "approved", limit: 30, sort_by: "new-to-old",
      });
      const list = pickItemsArray(res).filter((x) => !!pickVideoMeta(x));
      if (list.length) {
        const s = list[0]?.user || list[0]?.seller || {};
        setAllSellers([{ seller: s, items: list }]);
        setSIdx(0);
        setIIdx(0);
      } else {
        setAllSellers([]);
      }
    } catch (e) {
      console.error(e);
      toast.error("Ne mogu učitati video objave.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  /* open/close */
  useEffect(() => {
    if (!open) {
      setMoreMenu(false);
      setMsgInput(false);
      setMsgText("");
      setPaused(false);
      return;
    }
    if (sellersProp?.length) {
      setAllSellers(sellersProp);
      setSIdx(Math.min(initialSellerIndex, sellersProp.length - 1));
      setIIdx(Math.min(initialItemIndex, (sellersProp[initialSellerIndex]?.items?.length || 1) - 1));
    } else if (userId) {
      fetchUser();
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev || ""; };
  }, [open, sellersProp, userId, initialSellerIndex, initialItemIndex, fetchUser]);

  /* play video when item changes */
  useEffect(() => {
    if (!open || !vUrl || isYouTube) return;
    const el = vidRef.current;
    if (!el) return;
    el.muted = muted;
    el.currentTime = 0;
    setProgress(0);
    setPaused(false);
    const t = setTimeout(() => { el.play().catch(() => {}); }, 80);
    return () => clearTimeout(t);
  }, [open, vUrl, sIdx, iIdx, isYouTube, muted]);

  useEffect(() => {
    if (!isYouTube && vidRef.current) vidRef.current.muted = muted;
  }, [muted, isYouTube]);

  /* navigation helpers */
  const goNext = useCallback(() => {
    if (iIdx < nItems - 1) {
      setDir(1); setIIdx((p) => p + 1); setProgress(0);
    } else if (sIdx < nSellers - 1) {
      setDir(1); setSIdx((p) => p + 1); setIIdx(0); setProgress(0);
    } else {
      onOpenChange?.(false);
    }
  }, [iIdx, nItems, sIdx, nSellers, onOpenChange]);

  const goPrev = useCallback(() => {
    const el = vidRef.current;
    if (el && el.currentTime > 3) { el.currentTime = 0; setProgress(0); return; }
    if (iIdx > 0) {
      setDir(-1); setIIdx((p) => p - 1); setProgress(0);
    } else if (sIdx > 0) {
      setDir(-1);
      const prev = allSellers[sIdx - 1];
      setSIdx((p) => p - 1);
      setIIdx((prev?.items?.length || 1) - 1);
      setProgress(0);
    }
  }, [iIdx, sIdx, allSellers]);

  /* progress */
  useEffect(() => {
    if (!open || isYouTube) return;
    const el = vidRef.current;
    if (!el) return;
    const up = () => { if (el.duration) setProgress((el.currentTime / el.duration) * 100); };
    el.addEventListener("timeupdate", up);
    return () => el.removeEventListener("timeupdate", up);
  }, [open, sIdx, iIdx, isYouTube]);

  useEffect(() => {
    if (!open || !isYouTube) return;
    if (ytTimerRef.current) clearTimeout(ytTimerRef.current);
    if (ytProgressRef.current) clearInterval(ytProgressRef.current);
    setProgress(0);

    const start = Date.now();
    ytProgressRef.current = setInterval(() => {
      const elapsed = (Date.now() - start) / 1000;
      const next = Math.min((elapsed / YT_STORY_SECONDS) * 100, 100);
      setProgress(next);
    }, 120);

    if (autoAdvance) {
      ytTimerRef.current = setTimeout(() => {
        goNext();
      }, YT_STORY_SECONDS * 1000);
    }

    return () => {
      if (ytTimerRef.current) clearTimeout(ytTimerRef.current);
      if (ytProgressRef.current) clearInterval(ytProgressRef.current);
    };
  }, [open, isYouTube, sIdx, iIdx, autoAdvance, goNext]);

  /* auto-advance */
  useEffect(() => {
    if (!open || !autoAdvance || isYouTube) return;
    const el = vidRef.current;
    if (!el) return;
    const end = () => goNext();
    el.addEventListener("ended", end);
    return () => el.removeEventListener("ended", end);
  }, [open, goNext, autoAdvance, isYouTube]);

  /* keyboard */
  useEffect(() => {
    if (!open) return;
    const fn = (e) => {
      if (e.key === "Escape") onOpenChange?.(false);
      else if (e.key === "ArrowRight" || e.key === "d") goNext();
      else if (e.key === "ArrowLeft" || e.key === "a") goPrev();
      else if (e.key === " ") { e.preventDefault(); togglePause(); }
      else if (e.key === "m") setMuted((p) => !p);
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [open, goNext, goPrev]);

  const togglePause = () => {
    if (isYouTube) return;
    const el = vidRef.current;
    if (!el) return;
    if (el.paused) { el.play().catch(() => {}); setPaused(false); }
    else { el.pause(); setPaused(true); }
  };

  /* pointer handlers */
  const pDown = (e) => {
    if (e.target.closest("button,input,textarea,a")) return;
    sxRef.current = e.clientX ?? e.touches?.[0]?.clientX;
    syRef.current = e.clientY ?? e.touches?.[0]?.clientY;
    if (!isYouTube) {
      holdRef.current = setTimeout(() => {
        const el = vidRef.current;
        if (el && !el.paused) { el.pause(); setHolding(true); }
      }, 200);
    }
  };

  const pUp = (e) => {
    if (holdRef.current) { clearTimeout(holdRef.current); holdRef.current = null; }
    const ex = e.clientX ?? e.changedTouches?.[0]?.clientX;
    const ey = e.clientY ?? e.changedTouches?.[0]?.clientY;
    if (syRef.current != null && syRef.current - ey > 100) { goToDetails(); return; }
    if (holding) { vidRef.current?.play().catch(() => {}); setHolding(false); return; }
    if (e.target.closest("button,input,textarea,a")) return;
    const w = e.currentTarget?.clientWidth || window.innerWidth;
    const tx = ex - (e.currentTarget?.getBoundingClientRect()?.left || 0);
    if (tx < w * 0.3) goPrev();
    else if (tx > w * 0.7) goNext();
    else togglePause();
  };

  const pLeave = () => {
    if (holdRef.current) clearTimeout(holdRef.current);
    if (holding) { vidRef.current?.play().catch(() => {}); setHolding(false); }
  };

  const dblClick = (e) => {
    if (e.target.closest("button,input")) return;
    handleLike();
    setLikeAnim(true);
    setTimeout(() => setLikeAnim(false), 900);
  };

  /* actions */
  const handleLike = async () => {
    if (!isLoggedIn) { dispatch(setIsLoginOpen(true)); return; }
    if (!item) return;
    const was = item.is_liked;
    item.is_liked = !was;
    item.total_likes = num(item.total_likes) + (was ? -1 : 1);
    setAllSellers([...allSellers]);
    try {
      await manageFavouriteApi.manageFavouriteApi({ item_id: item.id });
      if (!was) itemStatisticsApi.trackFavorite({ item_id: item.id, added: true }).catch(() => {});
    } catch {
      item.is_liked = was;
      item.total_likes = num(item.total_likes) + (was ? 1 : -1);
      setAllSellers([...allSellers]);
      toast.error("Greška pri ažuriranju.");
    }
  };

  const handleMsg = async () => {
    if (!isLoggedIn) { dispatch(setIsLoginOpen(true)); return; }
    if (!msgText.trim()) return;
    const sid = seller?.id || seller?.user_id;
    if (!sid) { toast.error("Prodavač nije pronađen."); return; }
    if (currentUser?.id && String(currentUser.id) === String(sid)) { toast.error("Ne možete slati poruku sebi."); return; }

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
        setMsgInput(false);
      } else throw new Error(r?.data?.message || "Greška.");
    } catch (err) {
      toast.error(err?.message || "Ne mogu poslati poruku.");
    } finally {
      setSending(false);
    }
  };

  const handleShare = async () => {
    if (!item) return;
    const url = `${window.location.origin}/ad-details/${item.slug}`;
    if (navigator.share) {
      try { await navigator.share({ title: item.name, url }); } catch {}
    } else {
      try { await navigator.clipboard.writeText(url); toast.success("Link kopiran!"); } catch {}
    }
  };

  const goToDetails = () => {
    if (!item?.slug) return;
    onOpenChange?.(false);
    router.push(`/ad-details/${item.slug}`);
  };

  const goToSeller = () => {
    const sid = seller?.id || seller?.user_id;
    if (!sid) return;
    onOpenChange?.(false);
    router.push(`/seller/${sid}`);
  };

  if (!open) return null;

  const city = item?.translated_city || item?.city || null;
  const created = item?.created_at || null;
  const neg = item ? (item.price == null || Number(item.price) === 0) : false;
  const views = num(item?.total_video_plays) || num(item?.clicks);
  const likes = num(item?.total_likes);

  return (
    <AnimatePresence mode="wait">
      {open && (
        <motion.div
          key="reel-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[200] bg-black flex items-center justify-center"
        >
          {/* ── story container ── */}
          <motion.div
            key={`seller-${sIdx}`}
            initial={{ opacity: 0, scale: 0.92, x: dir * 50 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
            className="relative w-full h-full max-w-[430px] sm:max-h-[92vh] sm:rounded-[32px] overflow-hidden mx-auto bg-[#0b0b0f] sm:border sm:border-white/10 sm:shadow-2xl"
            onMouseDown={pDown}
            onMouseUp={pUp}
            onMouseLeave={pLeave}
            onTouchStart={pDown}
            onTouchEnd={pUp}
            onDoubleClick={dblClick}
          >
            {/* video */}
            {vUrl ? (
              isYouTube ? (
                <div className="absolute inset-0">
                  <iframe
                    key={`yt-${sIdx}-${iIdx}`}
                    src={vUrl}
                    title={item?.name || "YouTube video"}
                    className="absolute inset-0 w-full h-full"
                    allow="autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/40 pointer-events-none" />
                </div>
              ) : (
                <video
                  ref={vidRef}
                  key={`v-${sIdx}-${iIdx}`}
                  src={vUrl}
                  poster={item?.image}
                  className="absolute inset-0 w-full h-full object-cover"
                  playsInline
                  muted={muted}
                />
              )
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-white/40 text-sm">
                {loading ? "Učitavam..." : "Nema videa"}
              </div>
            )}

            {/* gradient overlays */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent via-40% to-black/70 pointer-events-none" />

            {/* ── progress bars ── */}
            <div className="absolute top-0 left-0 right-0 z-30 px-2.5 pt-[env(safe-area-inset-top,8px)] flex gap-[3px]">
              {items.map((_, idx) => (
                <div key={idx} className="flex-1 h-[3px] rounded-full bg-white/25 overflow-hidden">
                  <motion.div
                    className="h-full bg-white rounded-full"
                    initial={false}
                    animate={{
                      width: idx < iIdx ? "100%" : idx === iIdx ? `${progress}%` : "0%",
                    }}
                    transition={{ duration: 0.1, ease: "linear" }}
                  />
                </div>
              ))}
            </div>

            {/* ── story dots ── */}
            {nItems > 1 && (
              <div className="absolute top-[calc(env(safe-area-inset-top,8px)+24px)] left-0 right-0 z-30 flex items-center justify-center gap-1.5 pointer-events-none">
                {items.map((_, idx) => (
                  <span
                    key={`story-dot-${idx}`}
                    className={`h-1.5 rounded-full transition-all ${idx === iIdx ? "w-4 bg-white" : "w-1.5 bg-white/45"}`}
                  />
                ))}
              </div>
            )}

            {/* ── top bar ── */}
            <div className="absolute top-[calc(env(safe-area-inset-top,8px)+10px)] left-0 right-0 z-30 px-3 flex items-center justify-between">
              {/* seller info */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); goToSeller(); }}
                className="flex items-center gap-2.5 hover:opacity-80 transition-opacity min-w-0"
              >
                <div className="w-9 h-9 rounded-full p-[2px] bg-gradient-to-br from-[#F7941D] via-[#E1306C] to-[#833AB4] shrink-0">
                  {sImg ? (
                    <img src={sImg} alt="" className="w-full h-full rounded-full object-cover bg-white" />
                  ) : (
                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                      <MdStorefront className="w-4 h-4 text-slate-400" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-white text-[13px] font-semibold truncate max-w-[110px]">{sName}</span>
                    {verified && <MdVerified className="w-3.5 h-3.5 text-[#3897F0] shrink-0" />}
                    {shop && <span className="px-1.5 py-0.5 rounded bg-[#F7941D]/90 text-[7px] font-bold text-white uppercase">Shop</span>}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-white/45">
                    {created && <span>{timeAgo(created)}</span>}
                    {isYouTube && <span className="px-1.5 py-0.5 rounded-full bg-white/15 text-white/70 text-[10px]">YouTube</span>}
                  </div>
                </div>
              </button>

              {/* controls */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isYouTube) setMuted((p) => !p);
                  }}
                  disabled={isYouTube}
                  className={`w-8 h-8 rounded-full bg-black/35 backdrop-blur-md text-white flex items-center justify-center transition ${
                    isYouTube ? "opacity-50 cursor-not-allowed" : "hover:bg-black/50"
                  }`}
                >
                  {muted ? <MdVolumeOff size={16} /> : <MdVolumeUp size={16} />}
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setMoreMenu((p) => !p); }}
                  className="w-8 h-8 rounded-full bg-black/35 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/50 transition"
                >
                  <MdMoreVert size={16} />
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onOpenChange?.(false); }}
                  className="w-8 h-8 rounded-full bg-black/35 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/50 transition"
                >
                  <MdClose size={16} />
                </button>
              </div>
            </div>

            {/* ── more menu ── */}
            <AnimatePresence>
              {moreMenu && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-[35]"
                    onClick={(e) => { e.stopPropagation(); setMoreMenu(false); }}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-[calc(env(safe-area-inset-top,8px)+50px)] right-3 z-40 bg-white backdrop-blur-2xl rounded-2xl shadow-2xl overflow-hidden min-w-[210px] border border-slate-200"
                  >
                    {[
                      { icon: MdOpenInNew, label: "Pogledaj oglas", fn: goToDetails },
                      { icon: MdShare, label: "Podijeli", fn: handleShare },
                      { icon: MdStorefront, label: "Profil prodavača", fn: goToSeller },
                      { icon: MdFlag, label: "Prijavi sadržaj", fn: () => toast.info("Prijava zabilježena. Hvala!") },
                    ].map((o, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={(e) => { e.stopPropagation(); o.fn(); setMoreMenu(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <o.icon size={18} className="text-slate-400" />
                        {o.label}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            {/* ── hold indicator ── */}
            <AnimatePresence>
              {holding && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
                >
                  <div className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                    <MdPause className="w-10 h-10 text-white" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── paused indicator ── */}
            <AnimatePresence>
              {paused && !holding && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}
                  className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
                >
                  <div className="w-20 h-20 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center">
                    <MdPlayArrow className="w-12 h-12 text-white ml-1" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── double-tap like ── */}
            <AnimatePresence>
              {likeAnim && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 1.4, opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
                >
                  <MdFavorite className="w-28 h-28 text-white drop-shadow-2xl" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── seller nav arrows (desktop) ── */}
            {nSellers > 1 && (
              <>
                {sIdx > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDir(-1);
                      setSIdx((p) => p - 1);
                      setIIdx(0);
                      setProgress(0);
                    }}
                    className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-white/15 backdrop-blur-md items-center justify-center text-white hover:bg-white/25 transition"
                  >
                    <MdChevronLeft size={24} />
                  </button>
                )}
                {sIdx < nSellers - 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDir(1);
                      setSIdx((p) => p + 1);
                      setIIdx(0);
                      setProgress(0);
                    }}
                    className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-white/15 backdrop-blur-md items-center justify-center text-white hover:bg-white/25 transition"
                  >
                    <MdChevronRight size={24} />
                  </button>
                )}
              </>
            )}

            {/* ── right-side actions ── */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className="absolute right-3 bottom-36 flex flex-col items-center gap-4 z-20"
            >
              <motion.button whileTap={{ scale: 0.85 }} type="button"
                onClick={(e) => { e.stopPropagation(); handleLike(); }}
                className="flex flex-col items-center"
              >
                <div className="w-11 h-11 flex items-center justify-center">
                  {item?.is_liked ? (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 15 }}>
                      <MdFavorite className="w-7 h-7 text-red-500 drop-shadow-lg" />
                    </motion.div>
                  ) : (
                    <MdFavoriteBorder className="w-7 h-7 text-white drop-shadow-lg" />
                  )}
                </div>
                <span className="text-white text-[10px] font-semibold">{fmtCount(likes)}</span>
              </motion.button>

              <motion.button whileTap={{ scale: 0.85 }} type="button"
                onClick={(e) => { e.stopPropagation(); setMsgInput((p) => !p); }}
                className="flex flex-col items-center"
              >
                <div className="w-11 h-11 flex items-center justify-center">
                  <MdSend className="w-6 h-6 text-white drop-shadow-lg -rotate-12" />
                </div>
                <span className="text-white text-[10px] font-semibold">Poruka</span>
              </motion.button>

              <motion.button whileTap={{ scale: 0.85 }} type="button"
                onClick={(e) => { e.stopPropagation(); handleShare(); }}
                className="flex flex-col items-center"
              >
                <div className="w-11 h-11 flex items-center justify-center">
                  <MdShare className="w-6 h-6 text-white drop-shadow-lg" />
                </div>
                <span className="text-white text-[10px] font-semibold">Podijeli</span>
              </motion.button>
            </motion.div>

            {/* ── bottom area ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              className="absolute bottom-0 left-0 right-0 z-20 pb-[env(safe-area-inset-bottom,8px)]"
            >
              {/* inline message input */}
              <AnimatePresence>
                {msgInput && (
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 16 }}
                    className="px-3 mb-3"
                  >
                    <div className="flex items-center gap-2 bg-white/12 backdrop-blur-xl rounded-full px-4 py-2.5 border border-white/15">
                      <input
                        type="text"
                        value={msgText}
                        onChange={(e) => setMsgText(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleMsg(); }}
                        placeholder="Pošalji poruku..."
                        className="flex-1 bg-transparent text-white placeholder-white/40 text-sm outline-none"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleMsg(); }}
                        disabled={!msgText.trim() || sending}
                        className="w-8 h-8 rounded-full bg-gradient-to-br from-[#F7941D] to-[#E1306C] flex items-center justify-center text-white disabled:opacity-40 transition-opacity"
                      >
                        {sending ? (
                          <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                        ) : (
                          <MdSend size={14} />
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* product info */}
              <div className="px-3 pb-3">
                <button type="button" onClick={(e) => { e.stopPropagation(); goToDetails(); }} className="text-left w-full group">
                  <p className="text-white text-[15px] font-bold leading-snug line-clamp-2 drop-shadow-lg group-hover:underline decoration-white/40">
                    {item?.translated_item?.name || item?.name || "Oglas"}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {neg ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/80 backdrop-blur-sm text-white text-xs font-semibold">
                        <MdLocalOffer className="w-3 h-3" /> Po dogovoru
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-white/18 backdrop-blur-sm text-white font-bold text-sm">
                        {fmtPrice(item?.price)}
                      </span>
                    )}
                    {city && (
                      <span className="inline-flex items-center gap-1 text-white/65 text-xs">
                        <MdLocationOn className="w-3.5 h-3.5" /> {city}
                      </span>
                    )}
                  </div>
                </button>

                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-3 text-white/40 text-[11px]">
                    <span className="flex items-center gap-1"><MdPlayArrow className="w-3.5 h-3.5" />{fmtCount(views)} pregleda</span>
                    {nItems > 1 && <span>{iIdx + 1}/{nItems}</span>}
                  </div>
                  {nSellers > 1 && (
                    <span className="text-white/25 text-[11px]">{sIdx + 1} od {nSellers}</span>
                  )}
                </div>
              </div>
            </motion.div>

            {/* swipe hint (auto-hides) */}
            <SwipeHint />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const SwipeHint = () => {
  const [show, setShow] = useState(true);
  useEffect(() => { const t = setTimeout(() => setShow(false), 2500); return () => clearTimeout(t); }, []);
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          className="absolute left-1/2 -translate-x-1/2 bottom-[120px] flex flex-col items-center pointer-events-none z-20"
        >
          <motion.div animate={{ y: [-3, 3, -3] }} transition={{ duration: 1.2, repeat: Infinity }}>
            <MdKeyboardArrowUp className="w-5 h-5 text-white/60" />
          </motion.div>
          <span className="text-white/60 text-[11px]">Povuci za detalje</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ReelViewerModal;