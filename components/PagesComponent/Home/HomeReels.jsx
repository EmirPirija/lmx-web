"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";

import { allItemApi, manageFavouriteApi, itemOfferApi } from "@/utils/api";
import { setIsLoginOpen } from "@/redux/reducer/globalStateSlice";
import { getIsLoggedIn } from "@/redux/reducer/authSlice";

import {
  MdFavorite,
  MdFavoriteBorder,
  MdVolumeOff,
  MdVolumeUp,
  MdPlayArrow,
  MdPause,
  MdChat,
  MdClose,
} from "react-icons/md";

const formatPrice = (price) => {
  if (price === null || price === undefined) return "Na upit";
  if (Number(price) === 0) return "Na upit";
  return `${new Intl.NumberFormat("bs-BA", {
    maximumFractionDigits: 0,
  }).format(Number(price))} KM`;
};

const pickItemsArray = (apiResponse) => {
  const d = apiResponse?.data;
  return d?.data?.data || d?.data || d?.items || d?.result || [];
};

const pickVideoUrl = (item) => {
  // Prioritet: direkt upload (item.video). YouTube embed ne radimo u reels feedu.
  const url = item?.video || null;
  if (!url) return null;
  // ako backend ponekad vrati relativni path, pokušaj ga "normalizovati"
  // (ne diramo ako je već full URL)
  if (typeof url === "string" && url.startsWith("/")) {
    // ako imaš NEXT_PUBLIC_ADMIN_URL, koristi ga
    const base = process.env.NEXT_PUBLIC_ADMIN_URL || "";
    return base ? `${base}${url}` : url;
  }
  return url;
};

const numberOrZero = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const HomeReels = () => {
  const dispatch = useDispatch();
  const isLoggedIn = useSelector(getIsLoggedIn);

  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const scrollerRef = useRef(null);

  const fetchReels = useCallback(async () => {
    setIsLoading(true);
    try {
      // ⚠️ BACKEND sort_by valid values: new-to-old, old-to-new, price-high-to-low, price-low-to-high, popular_items
      // "newest" nije validan -> backend vrati validation error i dobijes prazan feed.
      const res = await allItemApi.getItems({
        status: "approved",
        limit: 50,
        page: 1,
        sort_by: "new-to-old",
        // has_video: 1, // ⚠️ backend (get-item) trenutno NE filtrira po has_video (nema ga u validatoru)
      });

      // Ako API vraća error flag, pokaži poruku (da ne izgleda kao da "nema videa")
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

  const onToggleLike = async (itemId) => {
    if (!isLoggedIn) {
      dispatch(setIsLoginOpen(true));
      return;
    }

    // optimistic
    setItems((prev) =>
      prev.map((it) =>
        it.id === itemId
          ? {
              ...it,
              is_liked: !it.is_liked,
              total_likes:
                numberOrZero(it.total_likes) + (it.is_liked ? -1 : 1),
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
      // rollback
      setItems((prev) =>
        prev.map((it) =>
          it.id === itemId
            ? {
                ...it,
                is_liked: !it.is_liked,
                total_likes:
                  numberOrZero(it.total_likes) + (it.is_liked ? -1 : 1),
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
    el.scrollBy({ left: dir * 280, behavior: "smooth" });
  };

  const hasAny = items?.length > 0;

  return (
    <div className="container mt-4 lg:mt-6">
      <div className="flex items-end justify-between mb-3">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900">
            Video oglasi
          </h2>
          <p className="text-sm text-slate-500">Skrolaj horizontalno</p>
        </div>

        {hasAny && (
          <div className="hidden lg:flex items-center gap-2">
            <button
              type="button"
              onClick={() => scrollByCards(-1)}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => scrollByCards(1)}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition"
            >
              →
            </button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex gap-3 overflow-hidden">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="w-[230px] sm:w-[260px] aspect-[9/16] rounded-2xl bg-slate-200 animate-pulse"
            />
          ))}
        </div>
      ) : !hasAny ? (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-600">
          Trenutno nema video oglasa.
        </div>
      ) : (
        <div
          ref={scrollerRef}
          className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide"
        >
          {items.map((item) => (
            <ReelCard
              key={item.id}
              item={item}
              isLoggedIn={isLoggedIn}
              onLike={() => onToggleLike(item.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default HomeReels;

// ==========================================
// Reel Card (small, modern, autoplay, actions)
// ==========================================
const ReelCard = ({ item, isLoggedIn, onLike }) => {
  const router = useRouter();
  const dispatch = useDispatch();

  const videoRef = useRef(null);
  const wrapperRef = useRef(null);

  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  const videoUrl = useMemo(() => pickVideoUrl(item), [item]);
  const poster = item?.image || "";

  const views =
    numberOrZero(item?.total_video_plays) ||
    numberOrZero(item?.total_gallery_views) ||
    numberOrZero(item?.clicks);

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

        if (entry.isIntersecting && entry.intersectionRatio >= 0.75) {
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
      { threshold: [0, 0.25, 0.5, 0.75, 1] }
    );

    io.observe(wr);
    return () => io.disconnect();
  }, [videoUrl, isMuted]);

  const togglePlay = async (e) => {
    e.stopPropagation();
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
    e.stopPropagation();
    const el = videoRef.current;
    if (!el) return;
    const next = !isMuted;
    el.muted = next;
    setIsMuted(next);
  };

  const openZoom = () => setIsZoomOpen(true);
  const closeZoom = () => setIsZoomOpen(false);

  const goToDetails = (e) => {
    e.stopPropagation();
    router.push(`/ad-details/${item?.slug}`);
  };

  const handleMessageSeller = async (e) => {
    e.stopPropagation();

    if (!isLoggedIn) {
      dispatch(setIsLoginOpen(true));
      return;
    }

    try {
      const res = await itemOfferApi.offer({ item_id: item?.id });
      if (res?.data?.error === false) {
        const offerId = res?.data?.data?.id;
        if (offerId) {
          router.push(`/chat?activeTab=buying&chatid=${offerId}`);
        } else {
          router.push(`/chat?activeTab=buying`);
        }
      } else {
        toast.error(res?.data?.message || "Ne mogu otvoriti chat");
      }
    } catch (err) {
      console.error(err);
      toast.error("Ne mogu otvoriti chat");
    }
  };

  if (!videoUrl) return null;

  return (
    <>
      <div
        ref={wrapperRef}
        className="snap-start shrink-0 w-[230px] sm:w-[260px] aspect-[9/16] rounded-2xl overflow-hidden bg-black relative shadow-[0_12px_40px_rgba(0,0,0,0.18)]"
        onClick={openZoom}
        role="button"
        tabIndex={0}
      >
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

        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/55 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />

        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          <div className="px-2.5 py-1.5 rounded-full bg-black/45 text-white text-xs font-bold backdrop-blur-md">
            {views} pregleda
          </div>
          <div className="px-2.5 py-1.5 rounded-full bg-white/90 text-slate-900 text-xs font-black">
            {formatPrice(item?.price)}
          </div>
        </div>

        <div className="absolute bottom-3 left-3 right-3">
          <button type="button" onClick={goToDetails} className="text-left w-full">
            <p className="text-white font-black leading-snug line-clamp-2 drop-shadow">
              {item?.translated_item?.name || item?.name || "Oglas"}
            </p>
            <p className="text-white/80 text-xs mt-1 line-clamp-1">
              {item?.translated_city || item?.city || ""}
            </p>
          </button>

          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={togglePlay}
                className="w-10 h-10 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-md text-white flex items-center justify-center transition"
                aria-label="Play/Pause"
              >
                {isPlaying ? <MdPause size={22} /> : <MdPlayArrow size={22} />}
              </button>

              <button
                type="button"
                onClick={toggleMute}
                className="w-10 h-10 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-md text-white flex items-center justify-center transition"
                aria-label="Mute"
              >
                {isMuted ? <MdVolumeOff size={20} /> : <MdVolumeUp size={20} />}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleMessageSeller}
                className="w-10 h-10 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-md text-white flex items-center justify-center transition"
                aria-label="Pošalji poruku"
              >
                <MdChat size={20} />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onLike?.();
                }}
                className="w-10 h-10 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-md text-white flex items-center justify-center transition"
                aria-label="Like"
              >
                {item?.is_liked ? (
                  <MdFavorite size={22} className="text-red-400" />
                ) : (
                  <MdFavoriteBorder size={22} />
                )}
              </button>
            </div>
          </div>
        </div>

        {numberOrZero(item?.total_likes) > 0 && (
          <div className="absolute right-3 top-14 px-2 py-1 rounded-full bg-black/40 text-white text-xs font-bold backdrop-blur-md">
            {numberOrZero(item?.total_likes)} likes
          </div>
        )}
      </div>

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
      />
    </>
  );
};

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
}) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    setTimeout(async () => {
      try {
        if (videoRef.current) {
          videoRef.current.muted = isMuted;
          await videoRef.current.play();
        }
      } catch {}
    }, 0);

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev || "unset";
    };
  }, [open, onClose, isMuted]);

  if (!open) return null;

  const toggleMute = () => {
    const el = videoRef.current;
    if (!el) return;
    const next = !isMuted;
    el.muted = next;
    setIsMuted(next);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-[min(460px,92vw)] aspect-[9/16] bg-black rounded-3xl overflow-hidden shadow-2xl">
        <video
          ref={videoRef}
          src={videoUrl}
          poster={poster}
          className="absolute inset-0 w-full h-full object-cover"
          playsInline
          loop
          controls
        />

        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          <div className="px-3 py-1.5 rounded-full bg-black/45 text-white text-xs font-bold backdrop-blur-md line-clamp-1">
            {item?.translated_item?.name || item?.name || "Oglas"}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md text-white flex items-center justify-center transition"
            aria-label="Zatvori"
          >
            <MdClose size={22} />
          </button>
        </div>

        <div className="absolute right-3 bottom-20 flex flex-col gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onLike?.();
            }}
            className="w-11 h-11 rounded-2xl bg-white/15 hover:bg-white/25 backdrop-blur-md text-white flex items-center justify-center transition"
            aria-label="Like"
          >
            {item?.is_liked ? (
              <MdFavorite size={24} className="text-red-400" />
            ) : (
              <MdFavoriteBorder size={24} />
            )}
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMessage?.(e);
            }}
            className="w-11 h-11 rounded-2xl bg-white/15 hover:bg-white/25 backdrop-blur-md text-white flex items-center justify-center transition"
            aria-label="Poruka"
          >
            <MdChat size={22} />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleMute();
            }}
            className="w-11 h-11 rounded-2xl bg-white/15 hover:bg-white/25 backdrop-blur-md text-white flex items-center justify-center transition"
            aria-label="Mute"
          >
            {isMuted ? <MdVolumeOff size={22} /> : <MdVolumeUp size={22} />}
          </button>
        </div>

        <div className="absolute left-3 right-3 bottom-3">
          <div className="bg-black/45 backdrop-blur-md rounded-2xl p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-white font-black leading-snug line-clamp-1">
                  {item?.translated_item?.name || item?.name || "Oglas"}
                </p>
                <p className="text-white/80 text-xs mt-0.5 line-clamp-1">
                  {item?.translated_city || item?.city || ""} •{" "}
                  {formatPrice(item?.price)}
                </p>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                <div className="px-2.5 py-1.5 rounded-full bg-white/15 text-white text-xs font-bold">
                  {numberOrZero(item?.total_video_plays) || 0} pregleda
                </div>
                {numberOrZero(item?.total_likes) > 0 && (
                  <div className="px-2.5 py-1.5 rounded-full bg-white/15 text-white text-xs font-bold">
                    {numberOrZero(item?.total_likes)} likes
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
