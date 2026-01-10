import { useEffect, useRef, useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
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

const ProductGallery = ({ galleryImages, videoData }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const carouselApi = useRef(null);
  const isRTL = useSelector(getIsRtl);
  const placeHolderImage = useSelector(getPlaceholderImage);

  const hasVideo = videoData?.url;
  const totalItems = galleryImages.length + (hasVideo ? 1 : 0);

  // Video je na zadnjem indexu
  const videoIndex = hasVideo ? galleryImages.length : -1;
  const isVideoSelected = selectedIndex === videoIndex;

  // Extract YouTube thumbnail
  const getYouTubeThumbnail = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    const videoId = match && match[2].length === 11 ? match[2] : null;
    if (videoId) {
      return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    }
    return videoData?.thumbnail || null;
  };

  const videoThumbnail = getYouTubeThumbnail(videoData?.url) || videoData?.thumbnail;

  useEffect(() => {
    if (!carouselApi.current) return;
    const handleSelect = () => {
      setImageLoaded(false);
    };
    carouselApi.current.on("select", handleSelect);

    return () => {
      carouselApi.current?.off("select", handleSelect);
    };
  }, []);

  useEffect(() => {
    setImageLoaded(false);
    const timer = setTimeout(() => setImageLoaded(true), 100);
    return () => clearTimeout(timer);
  }, [selectedIndex]);

  // Reset video state when switching away
  useEffect(() => {
    if (!isVideoSelected) {
      setIsVideoPlaying(false);
      setIsVideoReady(false);
    }
  }, [isVideoSelected]);

  const handlePrevImage = () => {
    if (selectedIndex === 0) {
      setSelectedIndex(totalItems - 1);
    } else {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  const handleNextImage = () => {
    if (selectedIndex === totalItems - 1) {
      setSelectedIndex(0);
    } else {
      setSelectedIndex(selectedIndex + 1);
    }
  };

  const handleImageClick = (index) => {
    setSelectedIndex(index);
  };

  // Scroll thumbnail into view
  useEffect(() => {
    if (carouselApi.current && selectedIndex >= 0 && selectedIndex < galleryImages.length) {
      carouselApi.current.scrollTo(selectedIndex);
    }
  }, [selectedIndex, galleryImages.length]);

  return (
    <PhotoProvider
      maskOpacity={0.95}
      speed={() => 300}
      easing={() => 'cubic-bezier(0.25, 0.1, 0.25, 1)'}
      toolbarRender={({ onScale, scale, index }) => (
        <div className="flex gap-2 items-center">
          {/* Thumbnail Strip in Lightbox */}
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex gap-2 bg-black/60 backdrop-blur-xl p-2 rounded-2xl max-w-[90vw] overflow-x-auto">
            {galleryImages?.map((img, idx) => (
              <button
                key={idx}
                className={`relative w-14 h-14 rounded-lg overflow-hidden transition-all duration-300 flex-shrink-0 ${
                  index === idx 
                    ? 'ring-2 ring-white scale-110' 
                    : 'opacity-60 hover:opacity-100 hover:scale-105'
                }`}
              >
                <img
                  src={img}
                  alt={`Thumb ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>

          {/* Zoom Controls */}
          <div className="flex gap-2 items-center bg-black/50 backdrop-blur-md px-4 py-2 rounded-full">
            <button
              onClick={() => onScale(scale - 0.5)}
              className="p-2 hover:bg-white/20 rounded-full transition-all duration-300"
              disabled={scale <= 1}
            >
              <RiZoomOutLine size={20} className="text-white" />
            </button>
            <span className="text-white text-sm min-w-[3rem] text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={() => onScale(scale + 0.5)}
              className="p-2 hover:bg-white/20 rounded-full transition-all duration-300"
              disabled={scale >= 6}
            >
              <RiZoomInLine size={20} className="text-white" />
            </button>
          </div>
        </div>
      )}
    >
      <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-2xl overflow-hidden shadow-2xl group/main">
        
        {isVideoSelected ? (
          // Video Player
          <div className="aspect-[870/500] rounded-2xl overflow-hidden bg-black relative">
            {/* Custom Play Button Overlay */}
            {!isVideoPlaying && (
              <div 
                className="absolute inset-0 z-10 cursor-pointer"
                onClick={() => setIsVideoPlaying(true)}
              >
                {/* Thumbnail Background */}
                <div 
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${videoThumbnail})` }}
                />
                <div className="absolute inset-0 bg-black/30" />
                
                {/* Play Button */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 bg-primary/90 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 hover:bg-primary transition-all duration-300 group/play">
                    <RiPlayCircleFill size={48} className="text-white ml-1" />
                  </div>
                </div>

                {/* Video Label */}
                <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full">
                  <span className="text-white text-sm font-medium flex items-center gap-2">
                    <RiVideoLine size={16} />
                    Klikni za reprodukciju
                  </span>
                </div>
              </div>
            )}

            {/* Actual Player - loads when playing */}
            {isVideoPlaying && (
              <>
                {!isVideoReady && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black z-20">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                      <span className="text-white/70 text-sm">Učitavanje videa...</span>
                    </div>
                  </div>
                )}
                <ReactPlayer
                  url={videoData.url}
                  controls
                  playing={isVideoPlaying}
                  width="100%"
                  height="100%"
                  onReady={() => setIsVideoReady(true)}
                  onError={() => setIsVideoReady(true)}
                  config={{
                    youtube: {
                      playerVars: {
                        modestbranding: 1,
                        rel: 0,
                        showinfo: 0,
                      }
                    }
                  }}
                />
              </>
            )}
          </div>
        ) : (
          // Image Gallery with PhotoView
          <div className="relative aspect-[870/500] overflow-hidden">
            {galleryImages?.map((image, index) => (
              <PhotoView key={index} src={image || placeHolderImage}>
                <div 
                  className={`absolute inset-0 cursor-zoom-in transition-opacity duration-300 ${
                    selectedIndex === index ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                  }`}
                >
                  <CustomImage
                    src={image}
                    alt={`Product ${index + 1}`}
                    width={870}
                    height={500}
                    className={`h-full w-full object-cover object-center rounded-2xl transition-all duration-500 ${
                      selectedIndex === index && imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
                    }`}
                    onLoad={() => selectedIndex === index && setImageLoaded(true)}
                  />
                </div>
              </PhotoView>
            ))}
            
            {/* Hover Zoom Hint - only for images */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/main:opacity-100 transition-opacity duration-300 pointer-events-none z-20">
              <div className="bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2">
                <RiFullscreenLine className="text-white" size={18} />
                <span className="text-white text-sm font-medium">Klikni za zoom</span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Arrows on Main Image */}
        <button
          onClick={handlePrevImage}
          className="absolute top-1/2 left-4 -translate-y-1/2 bg-white/90 dark:bg-black/50 backdrop-blur-sm p-3 rounded-full shadow-lg opacity-0 group-hover/main:opacity-100 hover:scale-110 active:scale-95 transition-all duration-300 z-30"
        >
          <RiArrowLeftLine size={24} className={`text-gray-800 dark:text-white ${isRTL ? "rotate-180" : ""}`} />
        </button>
        <button
          onClick={handleNextImage}
          className="absolute top-1/2 right-4 -translate-y-1/2 bg-white/90 dark:bg-black/50 backdrop-blur-sm p-3 rounded-full shadow-lg opacity-0 group-hover/main:opacity-100 hover:scale-110 active:scale-95 transition-all duration-300 z-30"
        >
          <RiArrowRightLine size={24} className={`text-gray-800 dark:text-white ${isRTL ? "rotate-180" : ""}`} />
        </button>

        {/* Counter Badge with Video Icon */}
        <div className="absolute top-4 right-4 flex items-center gap-2 z-30">
          {hasVideo && (
            <button
              onClick={() => setSelectedIndex(videoIndex)}
              className={`bg-black/60 backdrop-blur-xl px-3 py-2 rounded-full shadow-lg transition-all duration-300 flex items-center gap-1.5 hover:bg-black/80 ${
                isVideoSelected ? 'ring-2 ring-primary' : ''
              }`}
            >
              <RiVideoLine size={18} className="text-white" />
            </button>
          )}
          <div className="bg-black/60 backdrop-blur-xl px-4 py-2 rounded-full text-white font-medium shadow-lg">
            <span className="text-sm">
              {isVideoSelected 
                ? `Video` 
                : `${selectedIndex + 1} / ${galleryImages.length}`
              }
            </span>
          </div>
        </div>

        {/* Progress Dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-30">
          {galleryImages?.map((_, idx) => (
            <button
              key={idx}
              onClick={() => handleImageClick(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${
                selectedIndex === idx 
                  ? 'bg-white w-6' 
                  : 'bg-white/50 hover:bg-white/80 w-2'
              }`}
            />
          ))}
          {hasVideo && (
            <button
              onClick={() => setSelectedIndex(videoIndex)}
              className={`h-2 rounded-full transition-all duration-300 ${
                isVideoSelected 
                  ? 'bg-primary w-6' 
                  : 'bg-white/50 hover:bg-white/80 w-2'
              }`}
            />
          )}
        </div>
      </div>

      {/* Thumbnail Carousel */}
      <div className="relative mt-4 px-12">
        <Carousel
          key={isRTL ? "rtl" : "ltr"}
          opts={{
            align: "start",
            containScroll: "keepSnaps",
            direction: isRTL ? "rtl" : "ltr",
            dragFree: true,
          }}
          className="w-full"
          setApi={(api) => {
            carouselApi.current = api;
          }}
        >
          <CarouselContent className="-ml-2">
            {galleryImages?.map((image, index) => (
              <CarouselItem key={index} className="basis-auto pl-2">
                <div className="relative pt-1 pb-3">
                  <CustomImage
                    src={image}
                    alt={`Product ${index + 1}`}
                    height={96}
                    width={96}
                    className={`w-20 sm:w-24 aspect-square object-cover rounded-xl cursor-pointer transition-all duration-300 ${
                      selectedIndex === index 
                        ? "ring-2 ring-primary ring-offset-2 scale-105 opacity-100" 
                        : "hover:scale-105 opacity-60 hover:opacity-100"
                    }`}
                    onClick={() => handleImageClick(index)}
                  />
                  {selectedIndex === index && (
                    <div className="absolute -bottom-0 left-1/2 -translate-x-1/2 w-6 h-1 bg-primary rounded-full" />
                  )}
                </div>
              </CarouselItem>
            ))}
            {hasVideo && (
              <CarouselItem className="basis-auto pl-2">
                <div className="relative pt-1 pb-3">
                  <div
                    className={`relative w-20 sm:w-24 aspect-square rounded-xl cursor-pointer overflow-hidden transition-all duration-300 ${
                      isVideoSelected 
                        ? "ring-2 ring-primary ring-offset-2 scale-105 opacity-100" 
                        : "hover:scale-105 opacity-60 hover:opacity-100"
                    }`}
                    onClick={() => setSelectedIndex(videoIndex)}
                  >
                    <CustomImage
                      src={videoThumbnail}
                      alt="Video Thumbnail"
                      height={96}
                      width={96}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <RiPlayCircleFill 
                        size={32} 
                        className="text-white drop-shadow-lg" 
                      />
                    </div>
                  </div>
                  {isVideoSelected && (
                    <div className="absolute -bottom-0 left-1/2 -translate-x-1/2 w-6 h-1 bg-primary rounded-full" />
                  )}
                </div>
              </CarouselItem>
            )}
          </CarouselContent>
        </Carousel>

        {/* Thumbnail Navigation */}
        <button
          onClick={handlePrevImage}
          className="absolute top-1/2 left-0 -translate-y-1/2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-2.5 rounded-full shadow-md hover:shadow-lg hover:scale-110 active:scale-95 transition-all duration-300"
        >
          <RiArrowLeftLine size={18} className={`text-gray-600 dark:text-gray-300 ${isRTL ? "rotate-180" : ""}`} />
        </button>
        <button
          onClick={handleNextImage}
          className="absolute top-1/2 right-0 -translate-y-1/2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-2.5 rounded-full shadow-md hover:shadow-lg hover:scale-110 active:scale-95 transition-all duration-300"
        >
          <RiArrowRightLine size={18} className={`text-gray-600 dark:text-gray-300 ${isRTL ? "rotate-180" : ""}`} />
        </button>
      </div>
    </PhotoProvider>
  );
};

export default ProductGallery;