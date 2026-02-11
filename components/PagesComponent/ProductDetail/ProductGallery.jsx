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
} from "react-icons/ri";
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

  const carouselApi = useRef(null);
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
      <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 overflow-hidden group/main">
        {isVideoSelected && hasVideo ? (
          <div className="aspect-[870/500] rounded-2xl overflow-hidden bg-black relative">
            {!isVideoPlaying && (
              <div
                className="absolute inset-0 z-10 cursor-pointer"
                onClick={handleVideoPlay}
              >
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${videoThumbnail})` }}
                />
                <div className="absolute inset-0 bg-black/30" />

                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 bg-primary/90 rounded-full flex items-center justify-center hover:scale-110 hover:bg-primary transition-all duration-300 group/play">
                    <RiPlayCircleFill size={48} className="text-white ml-1" />
                  </div>
                </div>

                <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full">
                  <span className="text-white text-sm font-medium flex items-center gap-2">
                    <RiVideoLine size={16} />
                    Klikni za reprodukciju
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
                        controlsList: 'nodownload',
                      }
                    }
                  }}
                />
              </>
            )}
          </div>
        ) : (
          <div className="relative aspect-[870/500] overflow-hidden">
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

            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/main:opacity-100 transition-opacity duration-300 pointer-events-none z-20">
              <div className="bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2">
                <RiFullscreenLine className="text-white" size={18} />
                <span className="text-white text-sm font-medium">
                  Klikni za zoom
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Navigacija */}
        <button
          onClick={handlePrevImage}
          className="absolute top-1/2 left-4 -translate-y-1/2 bg-white/90 dark:bg-black/50 backdrop-blur-sm p-3 rounded-full shadow-lg opacity-0 group-hover/main:opacity-100 hover:scale-110 active:scale-95 transition-all duration-300 z-30"
        >
          <RiArrowLeftLine
            size={24}
            className={`text-gray-800 dark:text-white ${
              isRTL ? "rotate-180" : ""
            }`}
          />
        </button>

        <button
          onClick={handleNextImage}
          className="absolute top-1/2 right-4 -translate-y-1/2 bg-white/90 dark:bg-black/50 backdrop-blur-sm p-3 rounded-full shadow-lg opacity-0 group-hover/main:opacity-100 hover:scale-110 active:scale-95 transition-all duration-300 z-30"
        >
          <RiArrowRightLine
            size={24}
            className={`text-gray-800 dark:text-white ${
              isRTL ? "rotate-180" : ""
            }`}
          />
        </button>

        <div className="absolute top-4 right-4 flex items-center gap-2 z-30">
          {hasVideo && (
            <button
              onClick={() => setSelectedIndex(videoIndex)}
              className={`bg-black/60 backdrop-blur-xl px-3 py-2 rounded-full shadow-lg transition-all duration-300 flex items-center gap-1.5 hover:bg-black/80 ${
                isVideoSelected ? "ring-2 ring-primary" : ""
              }`}
            >
              <RiVideoLine size={18} className="text-white" />
            </button>
          )}
          <div className="bg-black/60 backdrop-blur-xl px-4 py-2 rounded-full text-white font-medium shadow-lg">
            <span className="text-sm">
              {isVideoSelected ? `Video` : `${selectedIndex + 1} / ${safeGalleryImages.length}`}
            </span>
          </div>
        </div>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-30">
          {safeGalleryImages?.map((_, idx) => (
            <button
              key={idx}
              onClick={() => handleImageClick(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${
                selectedIndex === idx
                  ? "bg-white w-6"
                  : "bg-white/50 hover:bg-white/80 w-2"
              }`}
            />
          ))}
          {hasVideo && (
            <button
              onClick={() => setSelectedIndex(videoIndex)}
              className={`h-2 rounded-full transition-all duration-300 ${
                isVideoSelected
                  ? "bg-primary w-6"
                  : "bg-white/50 hover:bg-white/80 w-2"
              }`}
            />
          )}
        </div>
      </div>
    </PhotoProvider>
  );
};

export default ProductGallery;