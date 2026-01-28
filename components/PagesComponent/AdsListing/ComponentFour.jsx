import React, { useState, useRef, useEffect } from 'react';
import { IoInformationCircleOutline } from "react-icons/io5";
import { HiOutlineUpload } from "react-icons/hi";
import { MdClose } from "react-icons/md";
import { FaPlay, FaPause } from "react-icons/fa";
import { toast } from "sonner";
import { t } from "@/utils";
import CustomImage from "@/components/Common/CustomImage";
import { Upload } from "lucide-react";

 
const ComponentFour = ({
  uploadedImages,
  setUploadedImages,
  otherImages,
  setOtherImages,
  uploadedVideo,
  setUploadedVideo,
  setStep,
  handleGoBack,
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

 
  // Cleanup URLs on unmount
  useEffect(() => {
    return () => {
      // revoke video preview
      if (videoPreviewUrl) {
        URL.revokeObjectURL(videoPreviewUrl);
      }
      // revoke image previews
      const m = urlMapRef.current;
      for (const url of m.values()) {
        try { URL.revokeObjectURL(url); } catch {}
      }
      m.clear();
    };
  }, [videoPreviewUrl]);
 
  // Kreiraj preview URL ako uploadedVideo već postoji
  useEffect(() => {
    if (uploadedVideo && !videoPreviewUrl) {
      const previewUrl = URL.createObjectURL(uploadedVideo);
      setVideoPreviewUrl(previewUrl);
    }
  }, [uploadedVideo]);
 
  // Handle video drop (bez kompresije)
  const handleVideoDrop = async (e) => {
    e.preventDefault();
    setIsDraggingVideo(false);
 
    const file = e.dataTransfer?.files[0] || e.target?.files[0];
    if (!file) return;
 
    if (!file.type.startsWith('video/')) {
      toast.error('Pogrešan tip fajla. Molimo uploadujte video.');
      return;
    }
 
    if (file.size > 100 * 1024 * 1024) {
      toast.error('Video je prevelik (maksimum 100MB)');
      return;
    }
 
    // Provjeri trajanje videa
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      if (video.duration > 30) {
        toast.error('Video je predug. Maksimalno trajanje je 30 sekundi.');
        return;
      }
      // Ako je sve OK, postavi video
      const previewUrl = URL.createObjectURL(file);
      setVideoPreviewUrl(previewUrl);
      setUploadedVideo(file);
      toast.success('Video uspješno dodan!');
    };
    video.src = URL.createObjectURL(file);
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
 
    if (imageFiles.length === 0) {
      toast.error('Pogrešan tip fajla. Molimo uploadujte slike.');
      return;
    }
 
    const remainingSlots = 5 - otherImages.length;
    
    if (remainingSlots === 0) {
      toast.error("Dostigli ste maksimalan broj slika");
      return;
    }
 
    if (imageFiles.length > remainingSlots) {
      toast.error(`Možete dodati još samo ${remainingSlots} ${remainingSlots === 1 ? 'sliku' : 'slika'}`);
      return;
    }
 
    setOtherImages(prev => [...prev, ...imageFiles]);
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
 
  const handleRemoveVideo = () => {
    if (videoPreviewUrl) {
      URL.revokeObjectURL(videoPreviewUrl);
    }
    setVideoPreviewUrl(null);
    setUploadedVideo(null);
    setPlayingVideo(false);
  };
 
  // Format file size helper
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
 
  return (
    <div className="flex flex-col gap-8 pb-24">
      {/* Main Image Upload */}
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
                <div className={`transition-transform duration-300 ${isDraggingMain ? 'scale-110' : ''}`}>
                  <HiOutlineUpload size={56} className="text-blue-500" />
                </div>
                <div>
                  <p className="text-gray-700 mb-2 font-semibold text-lg">
                    {isDraggingMain ? "Spustite fajl ovdje" : "Prevucite sliku ovdje"}
                  </p>
                  <p className="text-sm text-gray-500 mb-2">ili</p>
                  <span className="text-blue-600 font-semibold text-base">Kliknite za upload</span>
                </div>
                <p className="text-xs text-gray-400">JPG, PNG do 10MB</p>
              </div>
            </label>
          ) : (
            <div className="relative rounded-xl overflow-hidden shadow-lg group">
              <CustomImage
                width={591}
                height={280}
                className="rounded-xl object-cover aspect-[591/280] w-full"
                src={getPreviewUrl(uploadedImages[0])}
                alt={uploadedImages[0].name}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-3 left-3 text-white text-sm">
                  <p className="font-semibold">{uploadedImages[0].name}</p>
                  <p className="text-xs mt-1">{Math.round(uploadedImages[0].size / 1024)} KB</p>
                </div>
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
      <path d="m22 8-6 4 6 4V8Z" />
      <rect width="14" height="12" x="2" y="6" rx="2" />
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
      id="video-input"
    />

    {!videoPreviewUrl ? (
      <label
        htmlFor="video-input"
        className={`block border-2 border-dashed rounded-xl p-6 cursor-pointer transition-all duration-300 ${
          isDraggingVideo
            ? "border-red-500 bg-red-50 scale-105"
            : "border-gray-300 hover:border-red-400 hover:bg-gray-50"
        }`}
      >
        <div className="flex flex-col items-center justify-center text-center gap-3">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
            isDraggingVideo ? "bg-red-100" : "bg-gray-100"
          }`}>
            <Upload className={`w-7 h-7 ${isDraggingVideo ? "text-red-500" : "text-gray-400"}`} />
          </div>
          <div>
            <p className="text-gray-700 font-semibold">
              {isDraggingVideo ? "Spustite video ovdje" : "Dodajte video"}
            </p>
            <p className="text-xs text-gray-400 mt-1">Prevucite ili kliknite za odabir</p>
          </div>
          <p className="text-xs text-gray-400">Max 30 sekundi</p>
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
        <div
          onClick={toggleVideoPlay}
          className={`absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer transition-opacity ${
            playingVideo ? "opacity-0 hover:opacity-100" : "opacity-100"
          }`}
        >
          <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
            {playingVideo ? <FaPause className="text-black" /> : <FaPlay className="text-black ml-1" />}
          </div>
        </div>

        <button
          type="button"
          onClick={handleRemoveVideo}
          className="absolute top-3 right-3 bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600 hover:scale-110 transition-all"
        >
          <MdClose size={18} />
        </button>
      </div>
    )}
  </div>
</div>

 
      {/* Other Images Section */}
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
 
          {otherImages.length < 5 && (
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
                  {isDraggingOther ? "Spustite slike ovdje" : "Dodajte još slika"} ({otherImages.length}/5)
                </span>
              </div>
            </label>
          )}
 
          {/* Image Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {otherImages.map((file, index) => (
              <div
                key={`${getItemKey(file)}-${index}`}
                className="relative rounded-xl overflow-hidden shadow-lg group aspect-square hover:scale-105 transition-transform duration-200"
              >
                <CustomImage
                  width={200}
                  height={200}
                  className="w-full h-full object-cover"
                  src={getPreviewUrl(file)}
                  alt={file.name}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-2 left-2 text-white text-xs">
                    <p className="font-semibold truncate max-w-[140px]">{file.name}</p>
                    <p className="mt-0.5">{Math.round(file.size / 1024)} KB</p>
                  </div>
                  <button
                    onClick={() => setOtherImages(prev => prev.filter((_, i) => i !== index))}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full shadow-lg hover:bg-red-600 hover:scale-110 hover:rotate-90 transition-all duration-200"
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
            onClick={() => setStep(5)}
          >
            Naprijed
          </button>
        </div>
      </div>
    </div>
  );
};
 
export default ComponentFour;