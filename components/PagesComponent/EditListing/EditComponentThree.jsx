import React, { useState, useRef, useEffect } from 'react';
import { IoInformationCircleOutline } from "react-icons/io5";
import { HiOutlineUpload } from "react-icons/hi";
import { MdClose } from "react-icons/md";
import { FaPlay, FaPause } from "react-icons/fa";
import { toast } from "sonner";
import { t } from "@/utils";
import CustomImage from "@/components/Common/CustomImage";
 
const EditComponentThree = ({
  uploadedImages,
  setUploadedImages,
  OtherImages,
  setOtherImages,
  handleImageSubmit,
  handleGoBack,
  setDeleteImagesId,
  video,
  setVideo,
}) => {
  const [isDraggingMain, setIsDraggingMain] = useState(false);
  const [isDraggingOther, setIsDraggingOther] = useState(false);
  const [isDraggingVideo, setIsDraggingVideo] = useState(false);
  const [playingVideo, setPlayingVideo] = useState(false);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState(null);
  const videoRef = useRef(null);

  // Preview URL cache (prevents generating new object URLs on every render)
  const urlMapRef = useRef(new Map());

  const getPreviewUrl = (img) => {
    if (!img) return "";
    if (typeof img === "string") return img;
    if (typeof img === "object" && img.image) return img.image;
    if (img instanceof Blob) {
      const m = urlMapRef.current;
      if (!m.has(img)) m.set(img, URL.createObjectURL(img));
      return m.get(img);
    }
    return "";
  };

  const getItemKey = (img) => {
    if (!img) return "empty";
    if (typeof img === "object" && img.id) return `id-${img.id}`;
    if (typeof img === "string") return img;
    if (typeof img === "object" && img.image) return img.image;
    if (img instanceof File) return `${img.name}-${img.size}-${img.lastModified}`;
    if (img instanceof Blob) return `blob-${img.size}`;
    return "img";
  };

 
  // Cleanup image preview URLs on unmount
  useEffect(() => {
    return () => {
      const m = urlMapRef.current;
      for (const url of m.values()) {
        try { URL.revokeObjectURL(url); } catch {}
      }
      m.clear();
    };
  }, []);

  // Cleanup video URL on unmount
  useEffect(() => {
    return () => {
      if (videoPreviewUrl && video instanceof File) {
        URL.revokeObjectURL(videoPreviewUrl);
      }
    };
  }, [videoPreviewUrl]);
 
  // Kreiraj preview URL za video
  useEffect(() => {
    if (video instanceof File) {
      const previewUrl = URL.createObjectURL(video);
      setVideoPreviewUrl(previewUrl);
    } else if (typeof video === 'string' && video) {
      // Postojeći video sa servera
      setVideoPreviewUrl(video);
    } else {
      setVideoPreviewUrl(null);
    }
  }, [video]);
 
  // ✅ HELPER: Sigurno dobijanje URL-a slike (sa cache-om)
  const getImageUrl = (image) => getPreviewUrl(image);

 
  // Format file size helper
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
 
  // Handle video drop
  const handleVideoDrop = async (e) => {
    e.preventDefault();
    setIsDraggingVideo(false);
 
    const file = e.dataTransfer?.files[0] || e.target?.files[0];
    if (!file) return;
 
    if (!file.type.startsWith('video/')) {
      toast.error('Pogrešan tip fajla. Molimo uploadujte video.');
      return;
    }
 
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Video je prevelik (maksimum 10MB)');
      return;
    }
 
    // Provjeri trajanje videa
    const tempVideo = document.createElement('video');
    tempVideo.preload = 'metadata';
    tempVideo.onloadedmetadata = () => {
      URL.revokeObjectURL(tempVideo.src);
      if (tempVideo.duration > 30) {
        toast.error('Video je predug. Maksimalno trajanje je 30 sekundi.');
        return;
      }
      setVideo(file);
      toast.success('Video uspješno dodan!');
    };
    tempVideo.src = URL.createObjectURL(file);
  };
 
  const handleRemoveVideo = () => {
    if (videoPreviewUrl && video instanceof File) {
      URL.revokeObjectURL(videoPreviewUrl);
    }
    setVideoPreviewUrl(null);
    setVideo(null);
    setPlayingVideo(false);
  };
 
  const toggleVideoPlay = () => {
    if (videoRef.current) {
      if (playingVideo) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setPlayingVideo(!playingVideo);
    }
  };
 
  // Handle main image drop
  const handleMainImageDrop = (e) => {
    e.preventDefault();
    setIsDraggingMain(false);
    const file = e.dataTransfer?.files[0] || e.target?.files[0];
    if (!file) return;
 
    if (!file.type.startsWith('image/')) {
      toast.error('Pogrešan tip fajla. Molimo uploadujte sliku.');
      return;
    }
    setUploadedImages([file]);
  };
 
  // Handle other images drop
  const handleOtherImagesDrop = (e) => {
    e.preventDefault();
    setIsDraggingOther(false);
    const files = Array.from(e.dataTransfer?.files || e.target?.files || []);
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
 
    if (imageFiles.length === 0) return;
 
    const remainingSlots = 5 - OtherImages.length;
    if (remainingSlots === 0) {
      toast.error("Dostigli ste maksimalan broj slika");
      return;
    }
 
    if (imageFiles.length > remainingSlots) {
      toast.error(`Možete dodati još samo ${remainingSlots} slika`);
      return;
    }
 
    setOtherImages(prev => [...prev, ...imageFiles]);
  };
 
  // Logika za brisanje slika
  const handleRemoveGalleryImage = (index) => {
    const imageToRemove = OtherImages[index];
 
    if (imageToRemove?.id) {
      setDeleteImagesId((prev) => {
        const currentIds = prev ? prev.split(',') : [];
        currentIds.push(imageToRemove.id);
        return currentIds.join(',');
      });
    }
 
    setOtherImages((prev) => prev.filter((_, i) => i !== index));
  };
 
  return (
    <div className="flex flex-col gap-8 pb-24">
      {/* GLAVNA SLIKA */}
      <div className="flex flex-col gap-3">
        <label className="text-sm font-semibold flex items-center gap-2">
          Glavna slika <span className="text-red-500">*</span>
        </label>
        
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDraggingMain(true); }}
          onDragLeave={() => setIsDraggingMain(false)}
          onDrop={handleMainImageDrop}
          className="relative"
        >
          <input
            type="file"
            accept="image/jpeg,image/png,image/jpg"
            onChange={(e) => { handleMainImageDrop(e); e.target.value = ""; }}
            className="hidden"
            id="main-image-input"
          />
          
          {uploadedImages.length === 0 ? (
            <label
              htmlFor="main-image-input"
              className={`block border-2 border-dashed rounded-xl p-8 min-h-[280px] cursor-pointer transition-all duration-300 ${
                isDraggingMain
                  ? 'border-blue-500 bg-blue-50 scale-105'
                  : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
              }`}
            >
              <div className="flex flex-col items-center justify-center h-full text-center gap-4">
                <HiOutlineUpload size={56} className="text-blue-500" />
                <div>
                  <p className="text-gray-700 mb-2 font-semibold text-lg">
                    {isDraggingMain ? "Spustite fajl ovdje" : "Prevucite sliku ovdje"}
                  </p>
                  <span className="text-blue-600 font-semibold text-base">Kliknite za upload</span>
                </div>
              </div>
            </label>
          ) : (
            <div className="relative rounded-xl overflow-hidden shadow-lg group">
              <CustomImage
                width={591}
                height={280}
                className="rounded-xl object-cover aspect-[591/280] w-full"
                src={getImageUrl(uploadedImages[0])}
                alt="Main image"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button
                  onClick={() => setUploadedImages([])}
                  className="absolute top-3 right-3 bg-red-500 text-white p-2.5 rounded-full shadow-lg hover:bg-red-600 hover:scale-110 transition-all"
                >
                  <MdClose size={20} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
 
      {/* 🎬 VIDEO UPLOAD SECTION */}
      <div className="flex flex-col gap-3">
        <label className="flex items-center gap-2 font-semibold text-sm">
          <svg className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="m22 8-6 4 6 4V8Z"/>
            <rect width="14" height="12" x="2" y="6" rx="2"/>
          </svg>
          Video
          <span className="text-gray-400 font-normal text-xs">(opciono, max 30s)</span>
        </label>
 
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDraggingVideo(true); }}
          onDragLeave={() => setIsDraggingVideo(false)}
          onDrop={handleVideoDrop}
        >
          <input
            type="file"
            accept="video/mp4,video/quicktime,video/webm"
            onChange={(e) => { handleVideoDrop(e); e.target.value = ""; }}
            className="hidden"
            id="video-input-edit"
          />
 
          {!videoPreviewUrl ? (
            <label
              htmlFor="video-input-edit"
              className={`block border-2 border-dashed rounded-xl p-6 cursor-pointer transition-all duration-300 ${
                isDraggingVideo
                  ? 'border-red-500 bg-red-50 scale-105'
                  : 'border-gray-300 hover:border-red-400 hover:bg-gray-50'
              }`}
            >
              <div className="flex flex-col items-center justify-center text-center gap-3">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                  isDraggingVideo ? 'bg-red-100' : 'bg-gray-100'
                }`}>
                  <svg className={`w-7 h-7 ${isDraggingVideo ? 'text-red-500' : 'text-gray-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" x2="12" y1="3" y2="15"/>
                  </svg>
                </div>
                <div>
                  <p className="text-gray-700 font-semibold">
                    {isDraggingVideo ? "Spustite video ovdje" : "Dodajte video"}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Prevucite ili kliknite za odabir</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-gray-100 text-gray-500 text-[10px] font-medium rounded">MP4</span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-500 text-[10px] font-medium rounded">MOV</span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-500 text-[10px] font-medium rounded">WebM</span>
                </div>
                <p className="text-xs text-gray-400">Max 30 sekundi, 100MB</p>
              </div>
            </label>
          ) : (
            <div className="relative rounded-xl overflow-hidden bg-black aspect-video group shadow-lg">
              <video
                ref={videoRef}
                src={videoPreviewUrl}
                className="w-full h-full object-contain"
                onEnded={() => setPlayingVideo(false)}
                playsInline
                muted
              />
              
              {/* Play/Pause Overlay */}
              <div
                onClick={toggleVideoPlay}
                className={`absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer transition-opacity ${
                  playingVideo ? 'opacity-0 hover:opacity-100' : 'opacity-100'
                }`}
              >
                <div className={`w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg transition-transform ${
                  playingVideo ? 'scale-75' : 'scale-100 hover:scale-110'
                }`}>
                  {playingVideo ? (
                    <FaPause className="w-6 h-6 text-gray-800" />
                  ) : (
                    <FaPlay className="w-6 h-6 text-gray-800 ml-1" />
                  )}
                </div>
              </div>
 
              {/* Video Info */}
              {video instanceof File && (
                <div className="absolute bottom-3 left-3 flex items-center gap-2">
                  <span className="px-2 py-1 bg-black/70 text-white text-xs font-medium rounded-lg">
                    {formatFileSize(video.size)}
                  </span>
                </div>
              )}
 
              {/* Existing video badge */}
              {typeof video === 'string' && (
                <div className="absolute bottom-3 left-3">
                  <span className="px-2 py-1 bg-green-600 text-white text-xs font-medium rounded-lg">
                    Postojeći video
                  </span>
                </div>
              )}
 
              {/* Remove Button */}
              <button
                onClick={handleRemoveVideo}
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 hover:scale-110 transition-all"
              >
                <MdClose size={20} />
              </button>
            </div>
          )}
        </div>
 
        {/* Tip */}
        {!videoPreviewUrl && (
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
            <p className="text-xs text-blue-700">
              💡 <strong>Savjet:</strong> Kratki video (15-30s) povećava šanse za prodaju do 50%!
            </p>
          </div>
        )}
      </div>
 
      {/* DODATNE SLIKE (GALERIJA) */}
      <div className="flex flex-col gap-3">
        <label className="flex items-center gap-2 font-semibold text-sm">
          Dodatne slike
          <div className="relative group">
            <IoInformationCircleOutline size={20} className="text-gray-400 cursor-help" />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10 shadow-xl">
              Maksimum 5 dodatnih slika
            </div>
          </div>
        </label>
 
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDraggingOther(true); }}
          onDragLeave={() => setIsDraggingOther(false)}
          onDrop={handleOtherImagesDrop}
        >
          <input
            type="file"
            accept="image/jpeg,image/png,image/jpg"
            multiple
            onChange={(e) => { handleOtherImagesDrop(e); e.target.value = ""; }}
            className="hidden"
            id="other-images-input"
          />
 
          {OtherImages.length < 5 && (
            <label
              htmlFor="other-images-input"
              className={`block border-2 border-dashed rounded-xl p-6 cursor-pointer mb-6 transition-all duration-300 ${
                isDraggingOther
                  ? 'border-blue-500 bg-blue-50 scale-105'
                  : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-3 text-center">
                <HiOutlineUpload size={28} className="text-blue-500" />
                <span className="text-gray-700 font-semibold text-base">
                  {isDraggingOther ? "Spustite slike ovdje" : "Dodajte još slika"} ({OtherImages.length}/5)
                </span>
              </div>
            </label>
          )}
 
          {/* Grid Prikaz Slika */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {OtherImages.map((file, index) => (
              <div
                key={`${getItemKey(file)}-${index}`}
                className="relative rounded-xl overflow-hidden shadow-lg group aspect-square hover:scale-105 transition-transform duration-200"
              >
                <CustomImage
                  width={200}
                  height={200}
                  className="w-full h-full object-cover"
                  src={getImageUrl(file)}
                  alt={`gallery-${index}`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <button
                    onClick={() => handleRemoveGalleryImage(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full shadow-lg hover:bg-red-600 hover:scale-110 transition-all duration-200"
                  >
                    <MdClose size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
 
      {/* Sticky Action Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-2xl z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4 flex justify-between sm:justify-end gap-3">
          <button
            className="bg-black text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg text-base sm:text-lg font-medium hover:bg-gray-800 transition-colors shadow-md flex-1 sm:flex-none"
            onClick={handleGoBack}
          >
            Nazad
          </button>
          <button
            className="bg-primary text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg text-base sm:text-lg font-medium hover:bg-primary/90 transition-colors shadow-md flex-1 sm:flex-none"
            onClick={handleImageSubmit}
          >
            Naprijed
          </button>
        </div>
      </div>
    </div>
  );
};
 
export default EditComponentThree;