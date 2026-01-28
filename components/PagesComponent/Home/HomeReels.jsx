"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { allItemApi } from "@/utils/api";
import { MdClose, MdVolumeOff, MdVolumeUp, MdPlayArrow } from "react-icons/md";

function useAutoplayVisibleVideos(containerRef, enabled, options = {}) {
  useEffect(() => {
    const root = containerRef.current;
    if (!root || !enabled) return;

    const videos = Array.from(root.querySelectorAll("video[data-reel-video]"));
    if (!videos.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const el = entry.target;
          if (!(el instanceof HTMLVideoElement)) return;

          // Autoplay only when mostly visible
          if (entry.isIntersecting && entry.intersectionRatio >= 0.7) {
            el.play().catch(() => {});
          } else {
            el.pause();
          }
        });
      },
      { root, threshold: [0, 0.7, 1], ...options }
    );

    videos.forEach((v) => io.observe(v));
    return () => io.disconnect();
  }, [containerRef, enabled, options]);
}

const formatPrice = (price) => {
  if (!price || Number(price) === 0) return "Na upit";
  return `${new Intl.NumberFormat("bs-BA").format(Number(price))} KM`;
};

function ReelsModal({ open, items, startIndex, onClose }) {
  const [index, setIndex] = useState(startIndex || 0);
  const [muted, setMuted] = useState(true);
  const containerRef = useRef(null);

  // lock scroll
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // keep index in sync when open changes
  useEffect(() => {
    if (open) setIndex(startIndex || 0);
  }, [open, startIndex]);

  // autoplay visible video in modal vertical feed
  useAutoplayVisibleVideos(containerRef, open, { root: null });

  // scroll to active when opened / index changes
  useEffect(() => {
    if (!open) return;
    const el = document.getElementById(`reel-modal-item-${index}`);
    el?.scrollIntoView({ behavior: "instant", block: "start" });
  }, [open, index]);

  // keyboard controls
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowDown") setIndex((i) => Math.min(i + 1, items.length - 1));
      if (e.key === "ArrowUp") setIndex((i) => Math.max(i - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, items.length, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-[210] p-3 flex items-center justify-between">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
          type="button"
          aria-label="Zatvori"
        >
          <MdClose size={22} />
        </button>

        <button
          onClick={() => setMuted((m) => !m)}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
          type="button"
          aria-label="Mute"
        >
          {muted ? <MdVolumeOff size={22} /> : <MdVolumeUp size={22} />}
        </button>
      </div>

      {/* Vertical snap feed */}
      <div
        ref={containerRef}
        className="h-full w-full overflow-y-auto snap-y snap-mandatory"
      >
        {items.map((item, i) => {
          const title = item?.translated_item?.name || item?.name;
          const poster = item?.video_thumbnail || item?.image || undefined;
          const href = `/${item?.slug || ""}`;

          return (
            <div
              key={item.id}
              id={`reel-modal-item-${i}`}
              className="snap-start h-[100vh] w-full relative flex items-center justify-center bg-black"
              onMouseEnter={() => setIndex(i)}
            >
              <video
                data-reel-video
                className="h-full w-full object-contain bg-black"
                src={item.video}
                poster={poster}
                muted={muted}
                playsInline
                loop
                controls
                preload="metadata"
              />

              {/* IG-like bottom overlay */}
              <div className="absolute left-0 right-0 bottom-0 p-5 bg-gradient-to-t from-black/85 to-transparent">
                <Link href={href} className="text-white font-extrabold text-lg leading-tight">
                  {title}
                </Link>
                <div className="text-white/90 font-bold mt-1">{formatPrice(item?.price)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function HomeReels() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalStart, setModalStart] = useState(0);
  const [mutedRow, setMutedRow] = useState(true);

  const rowRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await allItemApi.getItems({
          has_video: 1,
          status: "approved",
          limit: 24,
          page: 1,
          sort_by: "new-to-old",
        });

        const data = res?.data?.data?.data || res?.data?.data || [];
        setItems(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("HomeReels load error:", e);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const visible = useMemo(() => items.filter((x) => x?.video), [items]);

  // autoplay in horizontal row
  useAutoplayVisibleVideos(rowRef, true);

  const openModal = useCallback((idx) => {
    setModalStart(idx);
    setModalOpen(true);
  }, []);

  if (loading) {
    return (
      <div className="container mt-6">
        <div className="h-6 w-40 bg-slate-200 rounded-md animate-pulse mb-3" />
        <div className="h-[280px] bg-slate-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!visible.length) return null;

  return (
    <div className="container mt-6">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-lg font-black text-slate-900">Video oglasi</h2>
          <p className="text-xs text-slate-500 font-semibold">Swipe → • Klik otvara full screen</p>
        </div>

        <button
          onClick={() => setMutedRow((m) => !m)}
          className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center hover:bg-slate-800"
          type="button"
          aria-label="Mute"
        >
          {mutedRow ? <MdVolumeOff size={20} /> : <MdVolumeUp size={20} />}
        </button>
      </div>

      {/* IG-like row */}
      <div
        ref={rowRef}
        className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth no-scrollbar"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {visible.map((item, idx) => {
          const title = item?.translated_item?.name || item?.name;
          const href = `/${item?.slug || ""}`;
          const poster = item?.video_thumbnail || item?.image || undefined;

          return (
            <div
              key={item.id}
              className="snap-start flex-shrink-0 w-[190px] sm:w-[220px] h-[280px] sm:h-[320px]

                rounded-[26px] overflow-hidden bg-black relative border border-slate-200
                shadow-[0_12px_30px_rgba(0,0,0,0.12)]"
            >
              {/* Video */}
              <video
                data-reel-video
                className="w-full h-full object-cover bg-black"
                src={item.video}
                poster={poster}
                muted={mutedRow}
                playsInline
                loop
                controls
                preload="metadata"
              />

              {/* IG overlay */}
              <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/85 to-transparent pointer-events-none">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-1 rounded-full bg-white/15 text-white text-[11px] font-bold tracking-wide">
                    REELS
                  </span>
                </div>
                <div className="text-white font-extrabold text-sm leading-tight line-clamp-2">
                  {title}
                </div>
                <div className="text-white/90 text-xs font-bold mt-1">
                  {formatPrice(item?.price)}
                </div>
              </div>

              {/* Tap-to-open full screen (kept above controls area) */}
              <button
                type="button"
                onClick={() => openModal(idx)}
                className="absolute inset-0"
                aria-label="Otvori video"
              >
                {/* small play hint */}
                <span className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/35 backdrop-blur-sm text-white flex items-center justify-center">
                  <MdPlayArrow size={22} />
                </span>
              </button>

              {/* Link to item (optional: keep, but it would conflict with modal click)
                  If you want click to open listing instead of modal, remove modal button and uncomment below:
              */}
              {/* <Link href={href} className="absolute inset-0" aria-label={title} /> */}
            </div>
          );
        })}
      </div>

      <ReelsModal
        open={modalOpen}
        items={visible}
        startIndex={modalStart}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
