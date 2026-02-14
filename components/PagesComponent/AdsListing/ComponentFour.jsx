"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "@/utils/toastBs";
import Api from "@/api/AxiosInterceptors";
import { 
  Upload, X, Play, Pause, Image as ImageIcon, 
  Star, Trash2, Loader2, GripVertical, Plus, CheckCircle2, MousePointerClick, Link2, ExternalLink, Instagram
} from "@/components/Common/UnifiedIconPack";
import { cn } from "@/lib/utils";
import StickyActionButtons from "@/components/Common/StickyActionButtons";

// =======================================================
// CONFIG
// =======================================================
// const WATERMARK_URL = "/assets/ad_icon.svg";
const MAX_IMAGES = 10;

// =======================================================
// MEDIA HELPERS
// =======================================================
const isFileLike = (v) => typeof File !== "undefined" && (v instanceof File || v instanceof Blob);

// ✅ FIX: Ažurirana funkcija da podržava sve formate (kao u EditComponentThree)
const safeObjectUrl = (v) => {
  try {
    if (!v) return "";
    // 1. Ako je običan string (URL)
    if (typeof v === "string") return v;
    
    // 2. Ako je objekat (sa servera ili temp upload)
    if (typeof v === "object") {
        // Provjeri redom sva moguća polja gdje API može staviti URL
        if (v.url) return v.url;           // Temp upload response
        if (v.image) return v.image;       // Existing DB item
        if (v.original_url) return v.original_url;
        if (v.path) return v.path;
    }

    // 3. Ako je File/Blob (Local preview prije uploada)
    if (isFileLike(v)) return URL.createObjectURL(v);
  } catch {}
  return "";
};

const loadImageElement = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.crossOrigin = "anonymous";
    img.src = src;
  });

const toCanvasBlob = (canvas, type = "image/jpeg", quality = 0.8) =>
  new Promise((resolve) => canvas.toBlob((b) => resolve(b), type, quality));

const getYouTubeEmbedUrl = (input) => {
  if (!input) return "";

  try {
    const url = new URL(input);
    const host = url.hostname.replace("www.", "");

    if (host === "youtube.com" || host === "m.youtube.com") {
      const id = url.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
    }

    if (host === "youtu.be") {
      const id = url.pathname.replace("/", "").trim();
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
  } catch {}

  return "";
};

const isInstagramUrl = (input) => {
  if (!input) return false;
  try {
    const parsed = new URL(input);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
    return host === "instagram.com" || host === "m.instagram.com";
  } catch {
    return false;
  }
};

const getInstagramEmbedUrl = (input) => {
  if (!isInstagramUrl(input)) return "";

  try {
    const parsed = new URL(input);
    const parts = parsed.pathname.split("/").filter(Boolean);
    if (!parts.length) return "";

    const type = parts[0];
    const id = parts[1];
    const validType = ["p", "reel", "reels", "tv"].includes(type);
    if (!validType || !id) return "";

    const canonicalType = type === "reels" ? "reel" : type;
    return `https://www.instagram.com/${canonicalType}/${id}/embed`;
  } catch {
    return "";
  }
};

const compressAndWatermarkImage = async (file) => {
  if (!isFileLike(file)) return file;

  const originalSizeKB = (file.size / 1024).toFixed(2);
  console.log(`📸 [Image Start] ${file.name} | Size: ${originalSizeKB} KB`);
  
  const opts = {
    maxSize: 1920,
    quality: 0.80,
    // watermarkUrl: WATERMARK_URL,
    watermarkOpacity: 0.9,
    watermarkScale: 0.15,
    watermarkPaddingPct: 0.03,
  };

  const src = safeObjectUrl(file);
  if (!src) return file;

  let img;
  try {
    img = await loadImageElement(src);
  } finally {
    try { URL.revokeObjectURL(src); } catch {}
  }

  const srcW = img.naturalWidth || img.width;
  const srcH = img.naturalHeight || img.height;
  
  const scale = Math.min(1, opts.maxSize / Math.max(srcW, srcH));
  const outW = Math.max(1, Math.round(srcW * scale));
  const outH = Math.max(1, Math.round(srcH * scale));

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;

  ctx.drawImage(img, 0, 0, outW, outH);

  if (opts.watermarkUrl) {
    try {
      const wmImg = await loadImageElement(opts.watermarkUrl);
      ctx.save();
      ctx.globalAlpha = opts.watermarkOpacity;
      const wmWidth = outW * opts.watermarkScale;
      const wmAspect = (wmImg.naturalWidth || wmImg.width) / (wmImg.naturalHeight || wmImg.height);
      const wmHeight = wmWidth / wmAspect;
      const padding = outW * opts.watermarkPaddingPct;
      const x = outW - wmWidth - padding;
      const y = padding;
      ctx.drawImage(wmImg, x, y, wmWidth, wmHeight);
      ctx.restore();
    } catch (e) {
      console.warn("Watermark error:", e);
    }
  }

  const outBlob = await toCanvasBlob(canvas, "image/jpeg", opts.quality);
  if (!outBlob) return file;

  const compressedSizeKB = (outBlob.size / 1024).toFixed(2);
  const reduction = ((1 - (outBlob.size / file.size)) * 100).toFixed(1);
  console.log(`✅ [Image Done] ${file.name} | New Size: ${compressedSizeKB} KB | Saved: ${reduction}%`);

  const newName = (file.name || "image").replace(/\.(png|jpe?g|webp|heic|heif)$/i, "").concat(".jpg");
  return new File([outBlob], newName, { type: "image/jpeg" });
};

// UI Components
const ProgressBar = ({ progress, label }) => (
  <div className="absolute inset-0 z-30 flex flex-col items-center justify-center rounded-xl bg-white/95 p-2 backdrop-blur-sm transition-all animate-in fade-in dark:bg-slate-900/90">
    <div className="w-full max-w-[90%] space-y-1 text-center">
      <div className="flex justify-between text-[10px] font-bold text-slate-500 dark:text-slate-300">
        <span>{label}</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
        <div 
          className="h-full bg-primary transition-all duration-300 ease-out rounded-full" 
          style={{ width: `${progress}%` }} 
        />
      </div>
    </div>
  </div>
);

// =======================================================
// MAIN COMPONENT
// =======================================================
const ComponentFour = ({
  uploadedImages,
  setUploadedImages,
  otherImages,
  setOtherImages,
  uploadedVideo,
  setUploadedVideo,
  addVideoToStory,
  setAddVideoToStory,
  publishToInstagram,
  setPublishToInstagram,
  instagramSourceUrl = "",
  onInstagramSourceUrlChange,
  onUseInstagramAsVideoLink,
  videoLink = "",
  onVideoLinkChange,
  onVideoSelected,
  onVideoDeleted,
  setStep,
  handleGoBack,
}) => {
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [isDraggingVideo, setIsDraggingVideo] = useState(false);
  
  const [imageUploadProgress, setImageUploadProgress] = useState({});
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [isVideoProcessing, setIsVideoProcessing] = useState(false);

  const [focusedImageId, setFocusedImageId] = useState(null);

  const dragItem = useRef(null);
  const dragOverItem = useRef(null);

  const [videoPreviewUrl, setVideoPreviewUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const youtubeEmbedUrl = getYouTubeEmbedUrl(videoLink);
  const instagramEmbedUrl =
    getInstagramEmbedUrl(videoLink) || getInstagramEmbedUrl(instagramSourceUrl);

  useEffect(() => {
    // ✅ FIX: Robusnije rukovanje videom
    const rawVid = uploadedVideo;
    let u = null;
    if (typeof rawVid === 'string') u = rawVid;
    else if (rawVid?.url) u = rawVid.url;
    else if (rawVid instanceof File) u = URL.createObjectURL(rawVid);
    
    setVideoPreviewUrl(u);
    setIsPlaying(false);

    return () => {
        if (rawVid instanceof File && u) URL.revokeObjectURL(u);
    };
  }, [uploadedVideo]);

  useEffect(() => {
    const handleClickOutside = (e) => {
        if (!e.target.closest('.image-card-interactive')) {
            setFocusedImageId(null);
        }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const allImages = React.useMemo(() => {
    return [...(uploadedImages || []), ...(otherImages || [])];
  }, [uploadedImages, otherImages]);

  const currentCount = allImages.length;
  const isCompactMode = currentCount > 0;

  // Helpers
  const uploadFile = async (file, type = "image", onProgress) => {
    const fd = new FormData();
    fd.append(type, file);
    const res = await Api.post(`/upload-temp/${type}`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (progressEvent) => {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        if(onProgress) onProgress(percent);
      },
    });
    if (res?.data?.error !== false) throw new Error(res?.data?.message || `Upload nije uspio`);
    return res.data.data;
  };

  const deleteTemp = async (id) => {
    if (!id) return;
    try { await Api.delete(`/upload-temp/${id}`); } catch (e) { console.error(e); }
  };

  // Handlers
  const handleImagesUpload = async (files) => {
    const rawArr = Array.from(files || []).filter(f => f?.type?.startsWith("image/"));
    if (!rawArr.length) return toast.error("Odaberite validne slike");

    const remainingSlots = MAX_IMAGES - currentCount;
    if (remainingSlots <= 0) return toast.error(`Limit od ${MAX_IMAGES} slika dosegnut.`);

    let arrToProcess = rawArr;
    if (rawArr.length > remainingSlots) {
      toast.warning(`Prihvaćeno prvih ${remainingSlots} slika.`);
      arrToProcess = rawArr.slice(0, remainingSlots);
    }

    const newUploadsBatch = [];

    for (const file of arrToProcess) {
      const tempId = Math.random().toString(36).substring(7);
      setImageUploadProgress(prev => ({ ...prev, [tempId]: 1 }));

      try {
        setImageUploadProgress(prev => ({ ...prev, [tempId]: 10 }));
        const processedFile = await compressAndWatermarkImage(file);
        
        const uploadedData = await uploadFile(processedFile, "image", (percent) => {
          const totalPercent = 20 + (percent * 0.8);
          setImageUploadProgress(prev => ({ ...prev, [tempId]: totalPercent }));
        });

        newUploadsBatch.push(uploadedData);

      } catch (e) {
        console.error(e);
        toast.error(`Greška: ${file.name}`);
      } finally {
        setTimeout(() => {
          setImageUploadProgress(prev => {
            const ns = { ...prev };
            delete ns[tempId];
            return ns;
          });
        }, 500);
      }
    }

    if (newUploadsBatch.length > 0) {
        if (uploadedImages.length === 0) {
            setUploadedImages([newUploadsBatch[0]]);
            setOtherImages(prev => [...(prev || []), ...newUploadsBatch.slice(1)]);
        } else {
            setOtherImages(prev => [...(prev || []), ...newUploadsBatch]);
        }
    }
  };

  const handleSortStart = (e, index) => {
    dragItem.current = index;
    e.dataTransfer.effectAllowed = "move";
    try { e.dataTransfer.setDragImage(e.target, 20, 20); } catch (e) {}
  };

  const handleSortEnter = (e, index) => {
    dragOverItem.current = index;
    e.preventDefault();
  };

  const handleSortEnd = () => {
    const draggedIdx = dragItem.current;
    const overIdx = dragOverItem.current;
    if (draggedIdx === null || overIdx === null || draggedIdx === overIdx) {
        dragItem.current = null;
        dragOverItem.current = null;
        return;
    }
    const _allImages = [...allImages];
    const item = _allImages[draggedIdx];
    _allImages.splice(draggedIdx, 1);
    _allImages.splice(overIdx, 0, item);
    dragItem.current = null;
    dragOverItem.current = null;
    if (_allImages.length > 0) {
        setUploadedImages([_allImages[0]]);
        setOtherImages(_allImages.slice(1));
    }
  };

  const handleDeleteImage = async (targetImg) => {
    try {
      if(targetImg.id) await deleteTemp(targetImg.id);
      
      const newAll = allImages.filter(img => img !== targetImg && img.id !== targetImg.id);
      
      if (newAll.length > 0) {
        setUploadedImages([newAll[0]]);
        setOtherImages(newAll.slice(1));
      } else {
        setUploadedImages([]);
        setOtherImages([]);
      }
    } catch (e) {
      toast.error("Greška pri brisanju");
    }
  };

  const handleSetMain = (targetImg) => {
    const newAll = [targetImg, ...allImages.filter(i => i !== targetImg && i.id !== targetImg.id)];
    setUploadedImages([newAll[0]]);
    setOtherImages(newAll.slice(1));
    setFocusedImageId(null);
    toast.success("Nova glavna slika");
  };

  const handleVideoUpload = async (file) => {
    if (!file) return;
    if (!file.type?.startsWith("video/")) return toast.error("Neispravan format videa.");
    
    console.log(`🎥 [Video Upload Start] ${file.name}`);

    if (file.size > 50 * 1024 * 1024) return toast.error("Video može imati najviše 50 MB.");

    try {
      setIsUploadingVideo(true);
      setIsVideoProcessing(false);
      setVideoUploadProgress(0);
      
      const data = await uploadFile(file, "video", (p) => {
        setVideoUploadProgress(p);
        if(p === 100) setIsVideoProcessing(true);
      });
      
      setUploadedVideo(data);
      onVideoSelected?.();
      toast.success("Video je postavljen.");
    } catch (e) {
      toast.error("Prijenos videa nije uspio.");
    } finally {
      setIsUploadingVideo(false);
      setIsVideoProcessing(false);
    }
  };

  const handleRemoveVideo = async () => {
    if (uploadedVideo?.id) await deleteTemp(uploadedVideo.id);
    setUploadedVideo(null);
    onVideoDeleted?.();
    setVideoPreviewUrl(null);
  };

  const handleDrop = useCallback((e, type) => {
    e.preventDefault();
    if(type === 'image') setIsDraggingFile(false);
    else setIsDraggingVideo(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
        if (type === 'image') handleImagesUpload(files);
        else handleVideoUpload(files[0]);
    }
  }, [allImages]);

  const handleStoryToggle = (checked) => {
    setAddVideoToStory?.(checked);
  };

  const handleInstagramToggle = (checked) => {
    setPublishToInstagram?.(checked);
  };

  const toggleImageFocus = (e, id) => {
    e.stopPropagation();
    setFocusedImageId(focusedImageId === id ? null : id);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24 dark:[&_.bg-white]:bg-slate-900 dark:[&_.bg-gray-50]:bg-slate-800/70 dark:[&_.bg-gray-100]:bg-slate-800 dark:[&_.bg-gray-200]:bg-slate-700 dark:[&_.text-gray-800]:text-slate-100 dark:[&_.text-gray-700]:text-slate-200 dark:[&_.text-gray-600]:text-slate-300 dark:[&_.text-gray-500]:text-slate-400 dark:[&_.text-gray-400]:text-slate-500 dark:[&_.border-gray-100]:border-slate-700 dark:[&_.border-gray-200]:border-slate-700 dark:[&_.border-gray-300]:border-slate-600 dark:[&_.bg-red-50]:bg-red-500/10">
      
      {/* 📸 SEKCIJA SLIKE */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
            <div>
              <h3 className="flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-slate-100">
                  <ImageIcon className="w-5 h-5 text-primary" />
                  Fotografije
              </h3>
              <p className="mt-1 hidden text-xs text-slate-500 dark:text-slate-400 sm:block">
                Prva slika je glavna. Prevucite za promjenu rasporeda.
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-full border bg-white px-3 py-1.5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <span className={cn("text-xs font-bold", currentCount >= MAX_IMAGES ? "text-red-500" : "text-primary")}>
                    {currentCount} / {MAX_IMAGES}
                </span>
                <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                    <div 
                        className={cn("h-full transition-all duration-500", currentCount >= MAX_IMAGES ? "bg-red-500" : "bg-primary")}
                        style={{ width: `${(currentCount / MAX_IMAGES) * 100}%` }}
                    />
                </div>
            </div>
        </div>

        {currentCount < MAX_IMAGES && (
            <label
                onDragOver={(e) => { e.preventDefault(); setIsDraggingFile(true); }}
                onDragLeave={() => setIsDraggingFile(false)}
                onDrop={(e) => handleDrop(e, 'image')}
                className={cn(
                    "relative group flex flex-col items-center justify-center w-full cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed bg-slate-50/30 transition-all duration-300 hover:bg-slate-50 dark:bg-slate-800/30 dark:hover:bg-slate-800",
                    isDraggingFile ? "border-primary bg-primary/5 shadow-md" : "border-slate-300 hover:border-primary/50",
                    isCompactMode ? "h-20 flex-row gap-4" : "h-48"
                )}
            >
                <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleImagesUpload(e.target.files)} />
                <div className={cn(
                    "flex items-center justify-center transition-all duration-300",
                    isCompactMode
                      ? "h-10 w-10 rounded-lg bg-primary/10 text-primary"
                      : "rounded-full bg-white p-4 text-slate-400 shadow-sm group-hover:text-primary dark:bg-slate-900 dark:text-slate-300"
                )}>
                    {isCompactMode ? <Plus className="w-6 h-6" /> : <Upload className="w-8 h-8" />}
                </div>
                <div className={cn("text-center", isCompactMode && "text-left")}>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {isCompactMode ? "Dodaj još fotografija" : "Klikni ili prevuci slike ovdje"}
                    </p>
                    {!isCompactMode && (
                        <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">JPG, PNG, WEBP • Max 10MB</p>
                    )}
                </div>
                {Object.keys(imageUploadProgress).length > 0 && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/90 backdrop-blur-sm dark:bg-slate-900/85">
                        <div className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 text-primary animate-spin" />
                            <span className="text-xs font-bold text-primary">Obrađujem...</span>
                        </div>
                    </div>
                )}
            </label>
        )}

        {/* IMAGE GRID */}
        {allImages.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 select-none animate-in fade-in zoom-in-95 duration-300">
                {allImages.map((img, index) => {
                    const isMain = index === 0;
                    // ✅ Koristimo ispravljenu safeObjectUrl funkciju
                    const imgSrc = safeObjectUrl(img);
                    const imgId = img.id || index; // Fallback key
                    const isFocused = focusedImageId === imgId;

                    return (
                        <div 
                            key={imgId}
                            draggable
                            onDragStart={(e) => handleSortStart(e, index)}
                            onDragEnter={(e) => handleSortEnter(e, index)}
                            onDragEnd={handleSortEnd}
                            onDragOver={(e) => e.preventDefault()}
                            onClick={(e) => toggleImageFocus(e, imgId)}
                            className={cn(
                                "image-card-interactive group relative aspect-square cursor-pointer overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-200 dark:border-slate-700 dark:bg-slate-900",
                                isFocused
                                  ? "z-20 ring-2 ring-primary ring-offset-2 ring-offset-slate-100 shadow-lg dark:ring-offset-slate-950"
                                  : "border-slate-200 hover:shadow-md dark:border-slate-700",
                                isMain && !isFocused && "ring-2 ring-primary/50 border-transparent"
                            )}
                        >
                            <img 
                                src={imgSrc} 
                                alt="Listing" 
                                className="w-full h-full object-cover pointer-events-none" 
                            />

                            <div className={cn(
                                "absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity duration-300",
                                isFocused ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                            )} />

                            <div className={cn(
                                "absolute top-3 left-3 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1 z-10 transition-all",
                                isMain ? "bg-primary text-white" : "bg-black/60 text-white backdrop-blur-md",
                                isFocused && !isMain ? "opacity-0" : "opacity-100"
                            )}>
                                {isMain ? <><Star className="w-3 h-3 fill-current" /> GLAVNA</> : <span>#{index + 1}</span>}
                            </div>

                            <div className={cn(
                                "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white drop-shadow-lg transition-opacity duration-300 pointer-events-none",
                                isFocused ? "opacity-0" : "opacity-0 group-hover:opacity-100"
                            )}>
                                <GripVertical className="w-10 h-10" />
                            </div>

                            <div className={cn(
                                "absolute top-2 right-2 z-30 transition-opacity duration-300",
                                isFocused ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                            )}>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleDeleteImage(img); }}
                                    className="rounded-full bg-white/90 p-1.5 text-red-500 shadow-md transition-colors hover:bg-red-50 hover:text-white dark:bg-slate-900/90 dark:hover:bg-red-500/20"
                                    title="Izbriši sliku"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            {!isMain && (
                                <div className={cn(
                                    "absolute bottom-3 left-3 right-3 z-30 transition-all duration-300 transform",
                                    isFocused ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0"
                                )}>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleSetMain(img); }}
                                        className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-white/95 py-2 text-xs font-bold text-slate-800 shadow-lg backdrop-blur transition-all hover:bg-primary hover:text-white dark:bg-slate-900/90 dark:text-slate-100"
                                    >
                                        <MousePointerClick className="w-3.5 h-3.5" />
                                        Postavi kao glavnu
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
                
                {Object.keys(imageUploadProgress).map((key) => (
                    <div key={key} className="relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/70">
                        <ProgressBar progress={imageUploadProgress[key]} label="Obrada" />
                    </div>
                ))}
            </div>
        )}
      </div>

      {/* --- VIDEO SEKCIJA --- */}
      <div className="space-y-4 border-t border-slate-100 pt-8 dark:border-slate-700">
        <h3 className="flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-slate-100">
            <Play className="w-5 h-5 text-red-500" />
            Video prezentacija
        </h3>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-800 flex items-center gap-2 dark:text-slate-100">
              <Link2 className="w-4 h-4 text-primary" />
              Video URL (YouTube ili direktni link)
            </p>
            {videoLink ? (
              <a
                href={videoLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                Otvori link
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            ) : null}
          </div>

          <input
            type="url"
            value={videoLink}
            onChange={(e) => onVideoLinkChange?.(e.target.value)}
            placeholder="https://youtube.com/watch?v=... ili https://..."
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-200"
          />

          {youtubeEmbedUrl ? (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-black/90 aspect-video dark:border-slate-700">
              <iframe
                src={youtubeEmbedUrl}
                title="YouTube preview"
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
          ) : instagramEmbedUrl ? (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white aspect-video dark:border-slate-700 dark:bg-slate-950">
              <iframe
                src={instagramEmbedUrl}
                title="Instagram preview"
                className="h-full w-full"
                allow="encrypted-media; clipboard-write"
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
          ) : videoLink ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Link će biti prikazan na oglasu nakon objave.
            </p>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Opcionalno: dodajte video URL za bolju konverziju oglasa.
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-800 flex items-center gap-2 dark:text-slate-100">
              <Instagram className="w-4 h-4 text-pink-500" />
              Instagram objava kao izvor
            </p>
            {instagramSourceUrl ? (
              <button
                type="button"
                onClick={() => onUseInstagramAsVideoLink?.()}
                className="inline-flex items-center gap-1 rounded-lg border border-pink-200 px-2.5 py-1 text-xs font-semibold text-pink-600 hover:bg-pink-50 dark:border-pink-400/30 dark:text-pink-300 dark:hover:bg-pink-500/10"
              >
                Koristi kao video link
              </button>
            ) : null}
          </div>

          <input
            type="url"
            value={instagramSourceUrl}
            onChange={(e) => onInstagramSourceUrlChange?.(e.target.value)}
            placeholder="https://www.instagram.com/reel/... ili /p/..."
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none transition-all focus:border-pink-400 focus:ring-2 focus:ring-pink-400/20 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-200"
          />

          <label className="flex items-start gap-3 cursor-pointer select-none rounded-xl border border-pink-100 bg-pink-50/70 px-3 py-2.5 dark:border-pink-400/20 dark:bg-pink-500/10">
            <input
              type="checkbox"
              checked={Boolean(publishToInstagram)}
              onChange={(e) => handleInstagramToggle(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-pink-500 focus:ring-pink-400"
            />
            <span>
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                Objavi i na Instagram
              </span>
              <p className="text-xs text-slate-500 mt-0.5 dark:text-slate-400">
                Nakon objave oglasa, sadržaj će ići u red za Instagram objavu.
              </p>
            </span>
          </label>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/70">
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={Boolean(addVideoToStory)}
              onChange={(e) => handleStoryToggle(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
            />
            <span>
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Dodaj video u Story</span>
              <p className="text-xs text-slate-500 mt-0.5 dark:text-slate-400">
                Video uz oglas ide automatski. Ovdje birate da li isti video ide i u Story objavu.
              </p>
            </span>
          </label>
        </div>

        {!uploadedVideo ? (
            <label
                onDragOver={(e) => { e.preventDefault(); setIsDraggingVideo(true); }}
                onDragLeave={() => setIsDraggingVideo(false)}
                onDrop={(e) => handleDrop(e, 'video')}
                className={cn(
                    "relative flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-slate-50/30 transition-all dark:bg-slate-800/30",
                    isDraggingVideo
                      ? "scale-[1.01] border-red-400 bg-red-50 dark:bg-red-500/10"
                      : "border-slate-300 hover:border-red-300 hover:bg-red-50/10 dark:border-slate-600 dark:hover:border-red-400 dark:hover:bg-red-500/10"
                )}
            >
                <input type="file" accept="video/*" className="hidden" onChange={(e) => handleVideoUpload(e.target.files[0])} />
                {isUploadingVideo ? (
                    <div className="w-full max-w-xs p-4">
                        {isVideoProcessing ? (
                             <div className="text-center text-xs font-bold text-primary animate-pulse">
                                 Obrada na serveru... (sačekajte)
                             </div>
                        ) : (
                             <ProgressBar progress={videoUploadProgress} label="Upload videa..." />
                        )}
                    </div>
                ) : (
                    <div className="flex items-center gap-4 text-slate-500 dark:text-slate-300">
                        <div className="rounded-full bg-white p-3 shadow-sm dark:bg-slate-900">
                            <Play className="w-6 h-6 text-red-500" />
                        </div>
                        <div className="text-left">
                            <p className="font-semibold text-slate-700 dark:text-slate-200">Dodaj video (opcionalno)</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500">Max 50MB • MP4, WEBM</p>
                        </div>
                    </div>
                )}
            </label>
        ) : (
            <div className="group relative aspect-video overflow-hidden rounded-2xl border border-slate-200 bg-black shadow-md dark:border-slate-700 sm:aspect-[21/9]">
                <video id="tmp-video-preview" className="w-full h-full object-contain" src={videoPreviewUrl || undefined} playsInline muted loop controls={false} />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    <button onClick={() => {
                            const el = document.getElementById("tmp-video-preview");
                            if(el.paused) { el.play(); setIsPlaying(true); } else { el.pause(); setIsPlaying(false); }
                        }} className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-all hover:scale-110">
                        {isPlaying ? <Pause className="fill-current w-6 h-6" /> : <Play className="fill-current w-6 h-6 ml-1" />}
                    </button>
                </div>
                <button onClick={handleRemoveVideo} className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-red-500 transition-colors backdrop-blur-sm opacity-0 group-hover:opacity-100" title="Ukloni video">
                    <X className="w-5 h-5" />
                </button>
            </div>
        )}

        <p
          className={cn(
            "text-xs",
            addVideoToStory ? "text-primary" : "text-slate-500 dark:text-slate-400"
          )}
        >
          {addVideoToStory
            ? "Video će biti objavljen i u Story objavi."
            : "Video će biti objavljen uz oglas, ali ne i u Story objavi."}
        </p>

        <p
          className={cn(
            "text-xs",
            publishToInstagram
              ? "text-pink-600 dark:text-pink-300"
              : "text-slate-500 dark:text-slate-400"
          )}
        >
          {publishToInstagram
            ? "Objava je uključena za Instagram."
            : "Instagram objava trenutno nije uključena."}
        </p>
      </div>

      {/* FOOTER */}
      <StickyActionButtons
        secondaryLabel="Nazad"
        onSecondaryClick={handleGoBack}
        primaryLabel="Sljedeći korak"
        onPrimaryClick={() => setStep(5)}
        primaryDisabled={!uploadedImages?.length}
      />
    </div>
  );
};

export default ComponentFour;
