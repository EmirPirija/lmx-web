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
const MAX_IMAGES = 15;

// =======================================================
// MEDIA HELPERS
// =======================================================
const isFileLike = (v) => typeof File !== "undefined" && (v instanceof File || v instanceof Blob);
const isBlobUrl = (v) => typeof v === "string" && v.startsWith("blob:");
const isLikelyImageFile = (file) => {
  if (!file) return false;
  const type = String(file.type || "").toLowerCase();
  const name = String(file.name || "").toLowerCase();
  if (type.startsWith("image/")) return true;
  return /\.(jpe?g|png|webp|heic|heif|avif)$/i.test(name);
};

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

const extractTempUploadId = (value) => {
  if (!value || typeof value !== "object") return null;
  return (
    value?.id ??
    value?.temp_id ??
    value?.tempId ??
    value?.upload_id ??
    value?.uploadId ??
    value?.media_id ??
    value?.mediaId ??
    value?.file_id ??
    value?.fileId ??
    null
  );
};

const normalizeTempUploadEntity = (value) => {
  if (!value || typeof value !== "object") return value;
  const id = extractTempUploadId(value);
  const url =
    value?.url ||
    value?.image ||
    value?.original_url ||
    value?.path ||
    value?.file_url ||
    "";
  return {
    ...value,
    ...(id !== null && id !== undefined ? { id } : {}),
    ...(url ? { url } : {}),
  };
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
  } catch (e) {
    // Mobile browseri ponekad ne mogu dekodirati određene image formate u canvas.
    // U tom slučaju vraćamo original i puštamo server-side obradu.
    console.warn("Image decode fallback:", e);
    return file;
  } finally {
    if (isBlobUrl(src)) {
      try {
        URL.revokeObjectURL(src);
      } catch {}
    }
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
// MAIN COMPONENT (Edit flow)
// - UI/UX identičan kao ComponentFour
// - Podržava postojeće (DB) slike + temp upload slike
// - Kod brisanja: temp ide na /upload-temp/:id, postojeće ide u setDeleteImagesId
// =======================================================
const EditComponentThree = ({
  uploadedImages,
  setUploadedImages,
  OtherImages: otherImages,
  setOtherImages,
  video: uploadedVideo,
  setVideo: setUploadedVideo,
  addVideoToStory,
  setAddVideoToStory,
  publishToInstagram,
  setPublishToInstagram,
  instagramConnected = false,
  instagramStatusLoading = false,
  onConnectInstagram,
  socialPostingUnavailable = false,
  socialPostingUnavailableMessage = "Privremeno nedostupno, hvala na razumijevanju.",
  instagramSourceUrl = "",
  onInstagramSourceUrlChange,
  onUseInstagramAsVideoLink,
  videoLink = "",
  onVideoLinkChange,
  onVideoSelected,
  onVideoDeleted,
  handleGoBack,
  handleImageSubmit,
  setDeleteImagesId,
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
  const hasAnyVideoSource = Boolean(
    (videoLink && String(videoLink).trim()) || videoPreviewUrl
  );

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
      onUploadProgress: (progressEvent) => {
        const loaded = Number(progressEvent?.loaded || 0);
        const total = Number(progressEvent?.total || loaded || 1);
        const percent = Math.min(100, Math.round((loaded * 100) / total));
        if(onProgress) onProgress(percent);
      },
    });
    if (res?.data?.error !== false) throw new Error(res?.data?.message || `Upload nije uspio`);
    const raw = Array.isArray(res?.data?.data) ? res.data.data?.[0] : res?.data?.data;
    return normalizeTempUploadEntity(raw);
  };

  const deleteTemp = async (id) => {
    if (!id) return;
    try { await Api.delete(`/upload-temp/${id}`); } catch (e) { console.error(e); }
  };

  // --- Edit-specific helpers ---
  // Temp upload (upload-temp endpoint) obično vraća { id, url }
  const isTempUpload = (v) =>
    Boolean(v && typeof v === "object" && extractTempUploadId(v) && v?.url && !v?.image);
  // Postojeća slika iz DB-a (najčešće { id, image: "https://..." })
  const isExistingDbImage = (v) => !!(v && typeof v === "object" && v.id && (v.image || v.original_url || v.path));
  const pushDeleteId = (id) => {
    if (!id || typeof setDeleteImagesId !== "function") return;
    setDeleteImagesId((prev) => {
      const parts = String(prev || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const strId = String(id);
      if (!parts.includes(strId)) parts.push(strId);
      return parts.join(",");
    });
  };

  // Handlers
  const handleImagesUpload = async (files) => {
    const rawArr = Array.from(files || []).filter((f) => isLikelyImageFile(f));
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
        const errorMsg =
          e?.response?.data?.message ||
          e?.message ||
          "Upload slike nije uspio.";
        toast.error(`Greška (${file.name}): ${errorMsg}`);
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
        const normalizedBatch = newUploadsBatch.map(normalizeTempUploadEntity).filter(Boolean);
        if (!normalizedBatch.length) return;
        if (uploadedImages.length === 0) {
            setUploadedImages([normalizedBatch[0]]);
            setOtherImages(prev => [...(prev || []), ...normalizedBatch.slice(1)]);
        } else {
            setOtherImages(prev => [...(prev || []), ...normalizedBatch]);
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
      // ✅ Edit fix:
      // - temp upload slike brišemo sa /upload-temp/:id
      // - postojeće DB slike samo označimo za brisanje (setDeleteImagesId)
      const targetId = extractTempUploadId(targetImg);
      if (isTempUpload(targetImg) && targetId) {
        await deleteTemp(targetId);
      } else if (isExistingDbImage(targetImg) && targetImg?.id) {
        pushDeleteId(targetImg.id);
      }
      
      const newAll = allImages.filter((img) => {
        const imgId = extractTempUploadId(img);
        if (targetId && imgId) return String(imgId) !== String(targetId);
        return img !== targetImg;
      });
      
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
    const targetId = extractTempUploadId(targetImg);
    const newAll = [
      targetImg,
      ...allImages.filter((img) => {
        const imgId = extractTempUploadId(img);
        if (targetId && imgId) return String(imgId) !== String(targetId);
        return img !== targetImg;
      }),
    ];
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
      
      setUploadedVideo(normalizeTempUploadEntity(data));
      onVideoSelected?.();
      toast.success("Video postavljen");
    } catch (e) {
      toast.error("Upload videa nije uspio");
    } finally {
      setIsUploadingVideo(false);
      setIsVideoProcessing(false);
    }
  };

  const handleRemoveVideo = async () => {
    // Ukloni temp video sa servera, a za postojeći (string / DB) samo očisti state
    const videoTempId = extractTempUploadId(uploadedVideo);
    if (isTempUpload(uploadedVideo) && videoTempId) await deleteTemp(videoTempId);
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
    if (checked && !hasAnyVideoSource) {
      toast.info("Story objava je dostupna tek kada dodate video ili video URL.");
      return;
    }
    setAddVideoToStory?.(checked);
  };

  useEffect(() => {
    if (!hasAnyVideoSource && addVideoToStory) {
      setAddVideoToStory?.(false);
    }
  }, [hasAnyVideoSource, addVideoToStory, setAddVideoToStory]);

  useEffect(() => {
    if (socialPostingUnavailable && publishToInstagram) {
      setPublishToInstagram?.(false);
    }
  }, [socialPostingUnavailable, publishToInstagram, setPublishToInstagram]);

  const handleInstagramToggle = (checked) => {
    if (socialPostingUnavailable) {
      toast.info(socialPostingUnavailableMessage);
      setPublishToInstagram?.(false);
      return;
    }

    if (checked && !instagramConnected) {
      toast.info("Instagram nije povezan. Povežite Instagram u Postavkama.");
      setPublishToInstagram?.(false);
      return;
    }
    setPublishToInstagram?.(checked);
  };

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
                    const imgId = extractTempUploadId(img) ?? img?.id ?? img?.url ?? index;
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
      <div className="space-y-4 pt-8 border-t border-slate-100">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Play className="w-5 h-5 text-red-500" />
            Video Prezentacija
        </h3>

        <div className="grid gap-4 xl:grid-cols-2">
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
                Link će biti prikazan na oglasu nakon izmjene.
              </p>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Opciono: dodajte video URL za bolju konverziju oglasa.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 dark:border-slate-700 dark:bg-slate-900">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Upload videa (MP4/WEBM)
            </p>
            {!uploadedVideo ? (
              <label
                  onDragOver={(e) => { e.preventDefault(); setIsDraggingVideo(true); }}
                  onDragLeave={() => setIsDraggingVideo(false)}
                  onDrop={(e) => handleDrop(e, 'video')}
                  className={cn(
                      "relative flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-slate-50/30 transition-all dark:bg-slate-800/30",
                      isDraggingVideo ? "border-red-400 bg-red-50 scale-[1.01] dark:bg-red-500/10" : "border-slate-300 hover:border-red-300 hover:bg-red-50/10 dark:border-slate-600 dark:hover:border-red-400 dark:hover:bg-red-500/10"
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
                      <div className="flex items-center gap-4 text-slate-500 dark:text-slate-300">
                          <div className="p-3 bg-white rounded-full shadow-sm dark:bg-slate-900">
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
              <div className="relative rounded-2xl overflow-hidden bg-black aspect-video sm:aspect-[21/9] shadow-md group border border-slate-200 dark:border-slate-700">
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
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-800 flex items-center gap-2 dark:text-slate-100">
                <Instagram className="w-4 h-4 text-pink-500" />
                Instagram objava kao izvor
              </p>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold",
                    socialPostingUnavailable
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"
                      : instagramConnected
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                      : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                  )}
                >
                  {socialPostingUnavailable
                    ? "Privremeno nedostupno"
                    : instagramStatusLoading
                    ? "Provjera..."
                    : instagramConnected
                    ? "Povezan"
                    : "Nije povezan"}
                </span>
                {socialPostingUnavailable ? (
                  <span className="text-[11px] text-amber-600 dark:text-amber-300">
                    {socialPostingUnavailableMessage}
                  </span>
                ) : !instagramConnected ? (
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Povežite Instagram u postavkama prije objave.
                  </span>
                ) : null}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {socialPostingUnavailable ? (
                <button
                  type="button"
                  disabled
                  className="inline-flex items-center gap-1 rounded-lg border border-amber-200 px-2.5 py-1 text-xs font-semibold text-amber-700 opacity-70 dark:border-amber-400/30 dark:text-amber-300"
                >
                  Privremeno nedostupno
                </button>
              ) : !instagramConnected ? (
                <button
                  type="button"
                  onClick={() => onConnectInstagram?.()}
                  disabled={instagramStatusLoading}
                  className="inline-flex items-center gap-1 rounded-lg border border-pink-200 px-2.5 py-1 text-xs font-semibold text-pink-600 hover:bg-pink-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-pink-400/30 dark:text-pink-300 dark:hover:bg-pink-500/10"
                >
                  {instagramStatusLoading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Povezujem...
                    </>
                  ) : (
                    "Poveži Instagram"
                  )}
                </button>
              ) : null}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-800 flex items-center gap-2 dark:text-slate-100">
              <Instagram className="w-4 h-4 text-pink-500" />
              Instagram link
            </p>
            {instagramSourceUrl ? (
              <button
                type="button"
                onClick={() => onUseInstagramAsVideoLink?.()}
                disabled={socialPostingUnavailable}
                className="inline-flex items-center gap-1 rounded-lg border border-pink-200 px-2.5 py-1 text-xs font-semibold text-pink-600 hover:bg-pink-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-pink-400/30 dark:text-pink-300 dark:hover:bg-pink-500/10"
              >
                Koristi kao video link
              </button>
            ) : null}
          </div>

          <input
            type="url"
            value={instagramSourceUrl}
            onChange={(e) => onInstagramSourceUrlChange?.(e.target.value)}
            disabled={socialPostingUnavailable}
            placeholder="https://www.instagram.com/reel/... ili /p/..."
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none transition-all focus:border-pink-400 focus:ring-2 focus:ring-pink-400/20 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-200"
          />

          <label className="flex items-start gap-3 cursor-pointer select-none rounded-xl border border-pink-100 bg-pink-50/70 px-3 py-2.5 dark:border-pink-400/20 dark:bg-pink-500/10">
            <input
              type="checkbox"
              checked={Boolean(publishToInstagram)}
              onChange={(e) => handleInstagramToggle(e.target.checked)}
              disabled={socialPostingUnavailable || !instagramConnected || instagramStatusLoading}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-pink-500 focus:ring-pink-400"
            />
            <span>
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                Objavi i na Instagram
              </span>
              <p className="text-xs text-slate-500 mt-0.5 dark:text-slate-400">
                {socialPostingUnavailable
                  ? socialPostingUnavailableMessage
                  : instagramConnected
                  ? "Nakon izmjene oglasa, sadržaj će ići u red za Instagram objavu."
                  : "Opcija je zaključana dok ne povežete Instagram nalog."}
              </p>
            </span>
          </label>
        </div>

        {hasAnyVideoSource ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/70">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={Boolean(addVideoToStory)}
                onChange={(e) => handleStoryToggle(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
              />
              <span>
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Objavi video i na story</span>
                <p className="text-xs text-slate-500 mt-0.5 dark:text-slate-400">
                  Maksimalno 5 aktivnih story objava po profilu.
                </p>
              </span>
            </label>
          </div>
        ) : null}

        <p
          className={cn(
            "text-xs",
            addVideoToStory ? "text-primary" : "text-slate-500"
          )}
        >
          {hasAnyVideoSource && addVideoToStory
            ? "Video će biti objavljen i na story."
            : hasAnyVideoSource
            ? "Video će biti objavljen na oglasu, ali ne i na story."
            : "Dodajte video da biste mogli uključiti story objavu."}
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
        primaryLabel="Sljedeći Korak"
        onPrimaryClick={() => handleImageSubmit?.()}
        primaryDisabled={!uploadedImages?.length}
      />
    </div>
  );
};

export default EditComponentThree;
