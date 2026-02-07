"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import Api from "@/api/AxiosInterceptors";
import { 
  Upload, X, Play, Pause, Image as ImageIcon, 
  Star, Trash2, Loader2, GripVertical, Plus, CheckCircle2, MousePointerClick
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm z-30 rounded-xl p-2 transition-all animate-in fade-in">
    <div className="w-full max-w-[90%] space-y-1 text-center">
      <div className="flex justify-between text-[10px] font-bold text-slate-500">
        <span>{label}</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
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
  setStep,
  handleGoBack,
  videoSectionRef,
  highlightVideo = false,
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
    if (!file.type?.startsWith("video/")) return toast.error("Pogrešan format");
    
    console.log(`🎥 [Video Upload Start] ${file.name}`);

    if (file.size > 50 * 1024 * 1024) return toast.error("Video max 50MB");

    try {
      setIsUploadingVideo(true);
      setIsVideoProcessing(false);
      setVideoUploadProgress(0);
      
      const data = await uploadFile(file, "video", (p) => {
        setVideoUploadProgress(p);
        if(p === 100) setIsVideoProcessing(true);
      });
      
      setUploadedVideo(data);
      toast.success("Video postavljen");
    } catch (e) {
      toast.error("Upload videa nije uspio");
    } finally {
      setIsUploadingVideo(false);
      setIsVideoProcessing(false);
    }
  };

  const handleRemoveVideo = async () => {
    if (uploadedVideo?.id) await deleteTemp(uploadedVideo.id);
    setUploadedVideo(null);
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

  const toggleImageFocus = (e, id) => {
    e.stopPropagation();
    setFocusedImageId(focusedImageId === id ? null : id);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      
      {/* 📸 SEKCIJA SLIKE */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-primary" />
                  Fotografije
              </h3>
              <p className="text-xs text-slate-500 mt-1 hidden sm:block">
                Prva slika je glavna. Prevucite za promjenu rasporeda.
              </p>
            </div>
            <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-full border shadow-sm">
                <span className={cn("text-xs font-bold", currentCount >= MAX_IMAGES ? "text-red-500" : "text-primary")}>
                    {currentCount} / {MAX_IMAGES}
                </span>
                <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
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
                    "relative group flex flex-col items-center justify-center w-full rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer overflow-hidden bg-slate-50/30 hover:bg-slate-50",
                    isDraggingFile ? "border-primary bg-primary/5 shadow-md" : "border-slate-300 hover:border-primary/50",
                    isCompactMode ? "h-20 flex-row gap-4" : "h-48"
                )}
            >
                <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleImagesUpload(e.target.files)} />
                <div className={cn(
                    "flex items-center justify-center transition-all duration-300",
                    isCompactMode ? "w-10 h-10 bg-primary/10 text-primary rounded-lg" : "p-4 rounded-full bg-white text-slate-400 group-hover:text-primary shadow-sm"
                )}>
                    {isCompactMode ? <Plus className="w-6 h-6" /> : <Upload className="w-8 h-8" />}
                </div>
                <div className={cn("text-center", isCompactMode && "text-left")}>
                    <p className="text-sm font-semibold text-slate-700">
                        {isCompactMode ? "Dodaj još fotografija" : "Klikni ili prevuci slike ovdje"}
                    </p>
                    {!isCompactMode && (
                        <p className="text-[10px] text-slate-400 mt-1">JPG, PNG, WEBP • Max 10MB</p>
                    )}
                </div>
                {Object.keys(imageUploadProgress).length > 0 && (
                    <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-20">
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
                                "image-card-interactive group relative aspect-square rounded-2xl bg-white border shadow-sm transition-all duration-200 cursor-pointer overflow-hidden",
                                isFocused ? "ring-2 ring-primary ring-offset-2 z-20 shadow-lg" : "hover:shadow-md border-slate-200",
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
                                    className="p-1.5 bg-white/90 text-red-500 rounded-full shadow-md hover:bg-red-50 hover:text-white transition-colors"
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
                                        className="w-full py-2 bg-white/95 backdrop-blur text-slate-800 text-xs font-bold rounded-lg shadow-lg hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-1.5"
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
                    <div key={key} className="relative aspect-square rounded-2xl bg-slate-50 border border-slate-200 overflow-hidden flex items-center justify-center">
                        <ProgressBar progress={imageUploadProgress[key]} label="Obrada" />
                    </div>
                ))}
            </div>
        )}
      </div>

      {/* --- VIDEO SEKCIJA --- */}
      <div
        ref={videoSectionRef}
        id="ad-video-section"
        className={cn(
          "space-y-4 pt-8 border-t border-slate-100 scroll-mt-24 transition-all duration-300",
          highlightVideo && "rounded-2xl ring-2 ring-primary/40 shadow-[0_0_0_6px_rgba(255,111,0,0.12)]"
        )}
      >
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Play className="w-5 h-5 text-red-500" />
            Video Prezentacija
        </h3>

        {!uploadedVideo ? (
            <label
                onDragOver={(e) => { e.preventDefault(); setIsDraggingVideo(true); }}
                onDragLeave={() => setIsDraggingVideo(false)}
                onDrop={(e) => handleDrop(e, 'video')}
                className={cn(
                    "relative flex flex-col items-center justify-center w-full h-32 rounded-2xl border-2 border-dashed transition-all cursor-pointer bg-slate-50/30",
                    isDraggingVideo ? "border-red-400 bg-red-50 scale-[1.01]" : "border-slate-300 hover:border-red-300 hover:bg-red-50/10"
                )}
            >
                <input type="file" accept="video/*" className="hidden" onChange={(e) => handleVideoUpload(e.target.files[0])} />
                {isUploadingVideo ? (
                    <div className="w-full max-w-xs p-4">
                        {isVideoProcessing ? (
                             <div className="text-center text-xs font-bold text-primary animate-pulse">
                                 Obrada na serveru... (Sačekajte)
                             </div>
                        ) : (
                             <ProgressBar progress={videoUploadProgress} label="Upload videa..." />
                        )}
                    </div>
                ) : (
                    <div className="flex items-center gap-4 text-slate-500">
                        <div className="p-3 bg-white rounded-full shadow-sm">
                            <Play className="w-6 h-6 text-red-500" />
                        </div>
                        <div className="text-left">
                            <p className="font-semibold text-slate-700">Dodaj video (opcionalno)</p>
                            <p className="text-xs text-slate-400">Max 50MB • MP4, WEBM</p>
                        </div>
                    </div>
                )}
            </label>
        ) : (
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-video sm:aspect-[21/9] shadow-md group border border-slate-200">
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
      </div>

      {/* FOOTER */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50">
        <div className="container mx-auto flex items-center justify-between max-w-7xl">
            <button
            type="button"
            onClick={handleGoBack}
            className="px-6 py-3 rounded-xl text-slate-600 font-semibold hover:bg-slate-100 transition-colors"
            >
            Nazad
            </button>

            <button
            type="button"
            disabled={!uploadedImages?.length}
            onClick={() => setStep(5)}
            className={cn(
                "px-8 py-3 rounded-xl font-bold shadow-lg shadow-primary/20 transition-all text-sm sm:text-base",
                uploadedImages?.length
                ? "bg-primary text-white hover:bg-primary/90 hover:scale-105 active:scale-95"
                : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
            )}
            >
            Sljedeći Korak
            </button>
        </div>
      </div>
    </div>
  );
};

export default ComponentFour;
