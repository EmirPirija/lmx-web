import { useEffect, useRef, useState, useCallback } from "react";
import { PhotoProvider, PhotoView } from "react-photo-view";
import "react-photo-view/dist/react-photo-view.css";
import {
  RiArrowLeftLine,
  RiArrowRightLine,
  RiPlayCircleFill,
  RiZoomInLine,
  RiZoomOutLine,
  RiVideoLine,
  RiFullscreenLine,
} from "@/components/Common/UnifiedIconPack";
import { useSelector } from "react-redux";
import { getIsRtl } from "@/redux/reducer/languageSlice";
import ReactPlayer from "react-player";
import { getPlaceholderImage } from "@/redux/reducer/settingSlice";
import CustomImage from "@/components/Common/CustomImage";

// ✅ 1. ROBUSNA FUNKCIJA ZA IZVLAČENJE URL-A
const getValidUrl = (item) => {
  if (!item) return "";
  // Ako je već string (URL), vrati ga
  if (typeof item === "string") return item;
  // Ako je objekt, probaj sve moguće ključeve
  if (typeof item === "object") {
    return item.image || item.url || item.original_url || item.path || "";
  }
  return "";
};

const ProductGallery = ({
  galleryImages,
  videoData,
  directVideo,
  productDetails,
  onGalleryOpen,
  onImageView,
  onImageZoom,
  onVideoPlay,
}) => {
  const isReserved =
    productDetails?.status === "reserved" ||
    productDetails?.reservation_status === "reserved";

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [hasTrackedGalleryOpen, setHasTrackedGalleryOpen] = useState(false);
  const touchStartXRef = useRef(null);
  const touchStartYRef = useRef(null);

  const isRTL = useSelector(getIsRtl);
  const placeHolderImage = useSelector(getPlaceholderImage);

  // ✅ 2. SIGURNA VIDEO LOGIKA
  // Provjerava directVideo (tvoj file) pa onda videoData (youtube)
  const rawVideoUrl = directVideo || videoData?.url || videoData;
  const videoUrl = getValidUrl(rawVideoUrl);
  // Video postoji samo ako URL nije prazan, null ili string "null"
  const hasVideo = !!videoUrl && videoUrl !== "null" && videoUrl.trim() !== "";

  // Osiguraj da je galleryImages niz
  // Osiguraj da su galleryImages validni URL-ovi (prvo glavna slika pa ostale)
  const rawGalleryImages = Array.isArray(galleryImages) ? galleryImages : [];
  const safeGalleryImages = rawGalleryImages
    .map((img) => getValidUrl(img))
    .filter((u) => !!u && u !== "null" && u.trim() !== "");
  const totalItems = safeGalleryImages.length + (hasVideo ? 1 : 0);

  const videoIndex = safeGalleryImages.length;
  const isVideoSelected = hasVideo && selectedIndex === videoIndex;
  const normalizedTotalItems = Math.max(totalItems, 1);
  const currentMediaNumber = totalItems > 0 ? selectedIndex + 1 : 1;
  const mediaProgress = (currentMediaNumber / normalizedTotalItems) * 100;
  const showMediaNavigation = totalItems > 1;

  // Ako se promijeni broj itema (npr. nema glavne slike), resetuj index da ne ostane na praznom itemu
  useEffect(() => {
    const maxIndex = totalItems - 1;
    if (maxIndex < 0) return;
    if (selectedIndex > maxIndex) setSelectedIndex(0);
  }, [totalItems, selectedIndex]);


  const getYouTubeThumbnail = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    const videoId = match && match[2].length === 11 ? match[2] : null;
    if (videoId) {
      return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    }
    return null;
  };

  const firstImage = safeGalleryImages?.[0];
  const videoThumbnail =
    getYouTubeThumbnail(videoUrl) ||
    videoData?.thumbnail ||
    firstImage ||
    placeHolderImage;

  useEffect(() => {
    setImageLoaded(false);
    const timer = setTimeout(() => setImageLoaded(true), 100);
    return () => clearTimeout(timer);
  }, [selectedIndex]);

  useEffect(() => {
    if (!isVideoSelected) {
      setIsVideoPlaying(false);
      setIsVideoReady(false);
    }
  }, [isVideoSelected]);

  useEffect(() => {
    if (selectedIndex >= 0 && selectedIndex < safeGalleryImages.length && onImageView) {
      onImageView(selectedIndex);
    }
  }, [selectedIndex, safeGalleryImages.length, onImageView]);

  const handlePrevImage = () => {
    if (totalItems <= 0) return;
    setSelectedIndex((prev) => (prev === 0 ? totalItems - 1 : prev - 1));
  };

  const handleNextImage = () => {
    if (totalItems <= 0) return;
    setSelectedIndex((prev) => (prev === totalItems - 1 ? 0 : prev + 1));
  };

  const handleImageClick = (index) => {
    setSelectedIndex(index);
  };

  const handleGalleryOpen = useCallback(() => {
    if (!hasTrackedGalleryOpen && onGalleryOpen) {
      onGalleryOpen();
      setHasTrackedGalleryOpen(true);
    }
  }, [hasTrackedGalleryOpen, onGalleryOpen]);

  const handleImageZoom = useCallback(() => {
    if (onImageZoom) onImageZoom();
  }, [onImageZoom]);

  const handleVideoPlay = useCallback(() => {
    setIsVideoPlaying(true);
    if (onVideoPlay) onVideoPlay();
  }, [onVideoPlay]);

  const handleMediaTouchStart = (event) => {
    if (!showMediaNavigation) return;
    const touch = event.touches?.[0];
    if (!touch) return;
    touchStartXRef.current = touch.clientX;
    touchStartYRef.current = touch.clientY;
  };

  const handleMediaTouchEnd = (event) => {
    if (!showMediaNavigation) return;
    const touch = event.changedTouches?.[0];
    const startX = touchStartXRef.current;
    const startY = touchStartYRef.current;

    touchStartXRef.current = null;
    touchStartYRef.current = null;

    if (!touch || startX == null || startY == null) return;

    const deltaX = touch.clientX - startX;
    const deltaY = touch.clientY - startY;
    const swipeThreshold = 44;

    if (Math.abs(deltaX) < swipeThreshold || Math.abs(deltaX) < Math.abs(deltaY)) return;

    if (deltaX < 0) handleNextImage();
    else handlePrevImage();
  };

  return (
    <PhotoProvider
      maskOpacity={0.95}
      speed={() => 300}
      easing={() => "cubic-bezier(0.25, 0.1, 0.25, 1)"}
      onVisibleChange={(visible) => {
        if (visible) handleGalleryOpen();
      }}
      toolbarRender={({ onScale, scale, index, onIndexChange }) => (
        <div className="flex gap-2 items-center">
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex gap-2 bg-black/60 backdrop-blur-xl p-2 rounded-2xl max-w-[90vw] overflow-x-auto no-scrollbar z-[9999]">
            {safeGalleryImages?.map((img, idx) => {
              const isActive = index === idx;
              // ✅ 3. URL FIX ZA THUMBNAILS
              const imgSrc = img || placeHolderImage;

              return (
                <button
                  key={idx}
                  onClick={() => onIndexChange && onIndexChange(idx)}
                  className={`relative w-14 h-14 rounded-lg overflow-hidden transition-all duration-300 flex-shrink-0 cursor-pointer ${
                    isActive
                      ? "ring-2 ring-white scale-110"
                      : "opacity-50 hover:opacity-100 hover:scale-105"
                  }`}
                >
                  <img
                    src={imgSrc}
                    alt={`Thumb ${idx + 1}`}
                    className="w-full h-full object-cover pointer-events-none"
                  />
                  {isActive && (
                    <div className="absolute inset-0 border-2 border-white rounded-lg shadow-[inset_0_0_8px_rgba(0,0,0,0.5)]" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex gap-2 items-center bg-black/50 backdrop-blur-md px-4 py-2 rounded-full shadow-lg">
            <button
              onClick={() => onScale(scale - 0.5)}
              className="p-2 hover:bg-white/20 rounded-full transition-all duration-300 disabled:opacity-30"
              disabled={scale <= 1}
              title="Umanji"
            >
              <RiZoomOutLine size={20} className="text-white" />
            </button>

            <span className="text-white text-sm font-medium min-w-[3.5rem] text-center">
              {Math.round(scale * 100)}%
            </span>

            <button
              onClick={() => {
                onScale(scale + 0.5);
                handleImageZoom();
              }}
              className="p-2 hover:bg-white/20 rounded-full transition-all duration-300 disabled:opacity-30"
              disabled={scale >= 6}
              title="Uvećaj"
            >
              <RiZoomInLine size={20} className="text-white" />
            </button>
          </div>
        </div>
      )}
    >
      <div className="overflow-hidden rounded-none border-y border-slate-200/80 bg-gradient-to-br from-gray-50 via-white to-gray-100 p-0 shadow-[0_22px_55px_-36px_rgba(15,23,42,0.55)] dark:border-slate-700/70 dark:from-slate-900 dark:via-slate-900/85 dark:to-slate-800 sm:rounded-3xl sm:border sm:p-3">
        <div
          className="relative overflow-hidden bg-black group/main z-0 sm:rounded-2xl"
          onTouchStart={handleMediaTouchStart}
          onTouchEnd={handleMediaTouchEnd}
        >
          {isVideoSelected && hasVideo ? (
            <div className="aspect-[4/3] sm:aspect-[16/10] xl:aspect-[21/10]">
              {!isVideoPlaying && (
                <div
                  className="absolute inset-0 z-10 cursor-pointer"
                  onClick={handleVideoPlay}
                >
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${videoThumbnail})` }}
                  />
                  <div className="absolute inset-0 bg-black/35" />

                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-16 w-16 rounded-full bg-primary/90 flex items-center justify-center transition-all duration-300 group/play hover:scale-110 hover:bg-primary sm:h-20 sm:w-20">
                      <RiPlayCircleFill size={40} className="ml-1 text-white sm:text-[48px]" />
                    </div>
                  </div>

                  <div className="absolute bottom-3 left-3 rounded-full bg-black/65 px-2.5 py-1 backdrop-blur-sm sm:bottom-4 sm:left-4 sm:px-3 sm:py-1.5">
                    <span className="flex items-center gap-1.5 text-xs font-medium text-white sm:gap-2 sm:text-sm">
                      <RiVideoLine size={16} />
                      <span className="hidden sm:inline">Pokreni video prikaz</span>
                      <span className="sm:hidden">Video</span>
                    </span>
                  </div>
                </div>
              )}

              {isVideoPlaying && (
                <>
                  {!isVideoReady && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black z-20">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                        <span className="text-white/70 text-sm">
                          Učitavanje videa...
                        </span>
                      </div>
                    </div>
                  )}

                  <ReactPlayer
                    url={videoUrl}
                    controls
                    playing={isVideoPlaying}
                    width="100%"
                    height="100%"
                    onReady={() => setIsVideoReady(true)}
                    onError={(e) => {
                      console.error("Video error", e);
                      setIsVideoReady(true);
                    }}
                    config={{
                      youtube: {
                        playerVars: { modestbranding: 1, rel: 0, showinfo: 0 },
                      },
                      file: {
                        attributes: {
                          controlsList: "nodownload",
                        },
                      },
                    }}
                  />
                </>
              )}
            </div>
          ) : (
            <div className="relative aspect-[4/3] sm:aspect-[16/10] xl:aspect-[21/10]">
              {safeGalleryImages.length === 0 ? (
                <div className="absolute inset-0">
                  <CustomImage
                    src={placeHolderImage}
                    alt="Product placeholder"
                    width={870}
                    height={500}
                    priority
                    loading="eager"
                    className="h-full w-full object-cover object-center"
                  />
                </div>
              ) : (
                safeGalleryImages.map((imageUrl, index) => {
                  const isPriority = index === 0;

                  return (
                    <PhotoView key={index} src={imageUrl}>
                      <div
                        className={`absolute inset-0 cursor-zoom-in transition-opacity duration-300 ${
                          selectedIndex === index
                            ? "opacity-100 z-10"
                            : "opacity-0 z-0 pointer-events-none"
                        }`}
                      >
                        <CustomImage
                          src={imageUrl}
                          alt={`Product ${index + 1}`}
                          width={870}
                          height={500}
                          priority={isPriority}
                          loading={isPriority ? "eager" : "lazy"}
                          className={`h-full w-full object-cover object-center transition-all duration-500 ${
                            selectedIndex === index && imageLoaded
                              ? "opacity-100 scale-100"
                              : "opacity-0 scale-105"
                          }`}
                          onLoad={() => selectedIndex === index && setImageLoaded(true)}
                        />
                      </div>
                    </PhotoView>
                  );
                })
              )}

              <div className="absolute inset-0 hidden sm:flex items-center justify-center opacity-0 group-hover/main:opacity-100 transition-opacity duration-300 pointer-events-none">
                <div className="bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2">
                  <RiFullscreenLine className="text-white" size={18} />
                  <span className="text-white text-sm font-medium">
                    Klikni za zoom
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-20 bg-gradient-to-b from-black/45 via-black/20 to-transparent" />

          <div className="absolute top-2.5 left-2.5 z-30 flex items-center gap-1.5 sm:top-3 sm:left-3 sm:gap-2">
            <div className="rounded-full bg-black/65 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-white backdrop-blur-sm sm:px-3 sm:py-1.5 sm:text-[11px]">
              {isVideoSelected ? "Video" : "Galerija"}
            </div>
            {isReserved && (
              <div className="rounded-full bg-amber-500/85 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-white backdrop-blur-sm sm:px-3 sm:py-1.5 sm:text-[11px]">
                Rezervisano
              </div>
            )}
          </div>

          <div className="absolute top-2.5 right-2.5 z-30 flex items-center gap-1.5 sm:top-3 sm:right-3 sm:gap-2">
            {hasVideo && (
              <button
                type="button"
                onClick={() => setSelectedIndex(videoIndex)}
                className={`rounded-full bg-black/60 px-2.5 py-1.5 backdrop-blur-xl shadow-lg transition-all duration-300 hover:bg-black/80 sm:px-3 sm:py-2 ${
                  isVideoSelected ? "ring-2 ring-primary" : ""
                }`}
                title="Prikaži video"
              >
                <RiVideoLine size={18} className="text-white" />
              </button>
            )}
            <div className="rounded-full bg-black/60 px-3 py-1.5 text-white shadow-lg backdrop-blur-xl sm:px-3.5">
              <p className="text-xs font-bold leading-tight sm:text-sm">{currentMediaNumber}/{normalizedTotalItems}</p>
            </div>
          </div>

          {showMediaNavigation && (
            <>
              <button
                onClick={handlePrevImage}
                type="button"
                className="absolute left-2 top-1/2 z-30 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-lg opacity-100 transition-all duration-300 hover:scale-110 active:scale-95 dark:bg-black/50 sm:left-3 sm:p-2.5 sm:opacity-0 sm:group-hover/main:opacity-100"
                title="Prethodna slika"
              >
                <RiArrowLeftLine
                  size={20}
                  className={`text-gray-800 dark:text-white ${isRTL ? "rotate-180" : ""}`}
                />
              </button>

              <button
                onClick={handleNextImage}
                type="button"
                className="absolute right-2 top-1/2 z-30 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-lg opacity-100 transition-all duration-300 hover:scale-110 active:scale-95 dark:bg-black/50 sm:right-3 sm:p-2.5 sm:opacity-0 sm:group-hover/main:opacity-100"
                title="Sljedeća slika"
              >
                <RiArrowRightLine
                  size={20}
                  className={`text-gray-800 dark:text-white ${isRTL ? "rotate-180" : ""}`}
                />
              </button>
            </>
          )}

          <div className="absolute inset-x-0 bottom-0 z-30 h-1 bg-black/25 sm:h-1.5">
            <div
              className="h-full bg-primary/90 transition-all duration-300"
              style={{ width: `${mediaProgress}%` }}
            />
          </div>
        </div>

        {totalItems > 1 && (
          <div className="mt-2 rounded-none border-y border-slate-200/80 bg-white/80 p-2 dark:border-slate-700/80 dark:bg-slate-900/65 sm:mt-3 sm:rounded-2xl sm:border">
            <div className="no-scrollbar flex snap-x snap-mandatory items-center gap-2 overflow-x-auto pb-1">
              {safeGalleryImages.map((imageUrl, index) => (
                <button
                  key={`gallery-thumb-${index}`}
                  type="button"
                  onClick={() => handleImageClick(index)}
                  className={`relative h-14 w-24 shrink-0 snap-start overflow-hidden rounded-xl border transition-all duration-200 sm:w-20 ${
                    selectedIndex === index
                      ? "border-primary ring-2 ring-primary/35"
                      : "border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600"
                  }`}
                  title="Prikaži fotografiju"
                >
                  <img
                    src={imageUrl || placeHolderImage}
                    alt={`Thumb ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
              {hasVideo && (
                <button
                  type="button"
                  onClick={() => setSelectedIndex(videoIndex)}
                  className={`relative h-14 w-24 shrink-0 snap-start overflow-hidden rounded-xl border transition-all duration-200 ${
                    isVideoSelected
                      ? "border-primary ring-2 ring-primary/35"
                      : "border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600"
                  }`}
                  title="Video prikaz"
                >
                  <img
                    src={videoThumbnail || placeHolderImage}
                    alt="Video thumbnail"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/30" />
                  <div className="absolute inset-0 flex items-center justify-center gap-1 text-white">
                    <RiPlayCircleFill size={18} />
                    <span className="text-[11px] font-bold uppercase tracking-[0.06em]">Video</span>
                  </div>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </PhotoProvider>
  );
};

export default ProductGallery;
