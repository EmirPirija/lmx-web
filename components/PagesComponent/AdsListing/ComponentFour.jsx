"use client";

import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import Api from "@/api/AxiosInterceptors";
import { Upload, X, Play, Pause } from "lucide-react";

const formatFileSize = (bytes) => {
  if (!bytes && bytes !== 0) return "";
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
};

const getMediaUrl = (m) => {
  if (!m) return "";
  if (typeof m === "string") return m;
  if (typeof m === "object" && m.url) return m.url;
  if (typeof m === "object" && m.image) return m.image;
  return "";
};

const getMediaName = (m) => {
  if (!m) return "media";
  if (m.name) return m.name;
  const u = getMediaUrl(m);
  return u ? u.split("/").pop() : "media";
};

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

  const [videoPreviewUrl, setVideoPreviewUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const mainImage = uploadedImages?.[0] ?? null;

  // video preview (radi za {id,url})
  useEffect(() => {
    const u = getMediaUrl(uploadedVideo);
    setVideoPreviewUrl(u || null);
    setIsPlaying(false);
  }, [uploadedVideo]);

  // ============================
  // TEMP UPLOAD HELPERS
  // ============================
  const uploadTempImage = async (file) => {
    const fd = new FormData();
    fd.append("image", file);

    const res = await Api.post("/upload-temp/image", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    if (res?.data?.error !== false) {
      throw new Error(res?.data?.message || "Upload slike nije uspio");
    }
    return res.data.data; // {id,url}
  };

  const uploadTempVideo = async (file) => {
    const fd = new FormData();
    fd.append("video", file);

    const res = await Api.post("/upload-temp/video", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    if (res?.data?.error !== false) {
      throw new Error(res?.data?.message || "Upload videa nije uspio");
    }
    return res.data.data; // {id,url}
  };

  const deleteTemp = async (id) => {
    if (!id) return;
    await Api.delete(`/upload-temp/${id}`);
  };

  // ============================
  // MAIN IMAGE
  // ============================
  const onPickMainImage = async (file) => {
    if (!file) return;
    if (!file.type?.startsWith("image/")) return toast.error("Odaberi sliku");

    try {
      const data = await uploadTempImage(file);
      setUploadedImages([data]);
      toast.success("Glavna slika uploadovana");
    } catch (e) {
      console.error(e);
      toast.error(e?.message || "Upload slike nije uspio");
    }
  };

  const removeMainImage = async () => {
    try {
      const id = mainImage?.id;
      if (id) await deleteTemp(id);
    } catch (e) {
      console.error(e);
    } finally {
      setUploadedImages([]);
    }
  };

  // ============================
  // GALLERY IMAGES
  // ============================
  const onPickOtherImages = async (files) => {
    const arr = Array.from(files || []).filter((f) => f?.type?.startsWith("image/"));
    if (!arr.length) return toast.error("Odaberi validne slike");

    try {
      const uploaded = [];
      for (const f of arr) {
        // eslint-disable-next-line no-await-in-loop
        const data = await uploadTempImage(f);
        uploaded.push(data);
      }
      setOtherImages((prev) => [...(prev || []), ...uploaded]);
      toast.success(`Uploadovano ${uploaded.length} slika`);
    } catch (e) {
      console.error(e);
      toast.error(e?.message || "Upload slika nije uspio");
    }
  };

  const removeOtherImage = async (img) => {
    try {
      if (img?.id) await deleteTemp(img.id);
    } catch (e) {
      console.error(e);
    } finally {
      setOtherImages((prev) => (prev || []).filter((x) => x !== img));
    }
  };

  // ============================
  // VIDEO
  // ============================
  const onPickVideo = async (file) => {
    if (!file) return;
    if (!file.type?.startsWith("video/")) return toast.error("Odaberi video");

    try {
      const data = await uploadTempVideo(file);
      setUploadedVideo(data);
      toast.success("Video uploadovan");
    } catch (e) {
      console.error(e);
      toast.error(e?.message || "Upload videa nije uspio");
    }
  };

  const removeVideo = async () => {
    try {
      if (uploadedVideo?.id) await deleteTemp(uploadedVideo.id);
    } catch (e) {
      console.error(e);
    } finally {
      setUploadedVideo(null);
      setVideoPreviewUrl(null);
      setIsPlaying(false);
    }
  };

  const togglePlay = () => {
    const el = document.getElementById("tmp-video-preview");
    if (!el) return;
    if (el.paused) {
      el.play();
      setIsPlaying(true);
    } else {
      el.pause();
      setIsPlaying(false);
    }
  };

  // ============================
  // DROP HANDLERS
  // ============================
  const onDropMain = async (e) => {
    e.preventDefault();
    setIsDraggingMain(false);
    await onPickMainImage(e.dataTransfer.files?.[0]);
  };

  const onDropOther = async (e) => {
    e.preventDefault();
    setIsDraggingOther(false);
    await onPickOtherImages(e.dataTransfer.files);
  };

  const onDropVideo = async (e) => {
    e.preventDefault();
    setIsDraggingVideo(false);
    await onPickVideo(e.dataTransfer.files?.[0]);
  };

  const canContinue = !!mainImage; // glavna slika obavezna

  return (
    <div className="space-y-6">
      {/* MAIN IMAGE */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-black text-slate-900">Glavna slika</h3>
          {mainImage && (
            <button
              type="button"
              onClick={removeMainImage}
              className="text-red-600 font-bold text-sm flex items-center gap-1"
            >
              <X className="w-4 h-4" /> Ukloni
            </button>
          )}
        </div>

        {!mainImage ? (
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setIsDraggingMain(true);
            }}
            onDragLeave={() => setIsDraggingMain(false)}
            onDrop={onDropMain}
            className={`flex items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-8 cursor-pointer transition ${
              isDraggingMain ? "border-primary bg-primary/5" : "border-slate-300 bg-slate-50"
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center">
              <Upload className="w-6 h-6 text-slate-400" />
            </div>
            <div>
              <p className="font-bold text-slate-800">Odaberi ili prevuci sliku</p>
              <p className="text-sm text-slate-500">JPG/PNG/WEBP do 10MB</p>
            </div>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onPickMainImage(e.target.files?.[0])}
            />
          </label>
        ) : (
          <div className="relative overflow-hidden rounded-2xl bg-slate-100 border border-slate-200">
            <div className="aspect-[16/10] w-full relative">
              <img
                src={getMediaUrl(mainImage)}
                alt={getMediaName(mainImage)}
                className="absolute inset-0 w-full h-full object-cover"
                width={800}
                height={450}
               />
            </div>
            <div className="p-3 flex items-center justify-between">
              <p className="font-bold text-slate-800 truncate">{getMediaName(mainImage)}</p>
              {mainImage?.size ? (
                <p className="text-sm text-slate-500">{formatFileSize(mainImage.size)}</p>
              ) : null}
            </div>
          </div>
        )}
      </div>

      {/* OTHER IMAGES */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-black text-slate-900">Galerija (opcionalno)</h3>
          <span className="text-sm text-slate-500">{(otherImages || []).length} slika</span>
        </div>

        <label
          onDragOver={(e) => {
            e.preventDefault();
            setIsDraggingOther(true);
          }}
          onDragLeave={() => setIsDraggingOther(false)}
          onDrop={onDropOther}
          className={`flex items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-6 cursor-pointer transition ${
            isDraggingOther ? "border-primary bg-primary/5" : "border-slate-300 bg-slate-50"
          }`}
        >
          <Upload className="w-5 h-5 text-slate-400" />
          <p className="font-bold text-slate-800">Dodaj slike</p>
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => onPickOtherImages(e.target.files)}
          />
        </label>

        {(otherImages || []).length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            {otherImages.map((img, idx) => (
              <div
                key={img?.id ?? idx}
                className="relative rounded-xl overflow-hidden bg-slate-100 border border-slate-200"
              >
                <div className="aspect-square relative">
                  <img
                    src={getMediaUrl(img)}
                    alt={getMediaName(img)}
                    className="absolute inset-0 w-full h-full object-cover"
                width={400}
                height={400}
                   />
                </div>
                <button
                  type="button"
                  onClick={() => removeOtherImage(img)}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/55 text-white flex items-center justify-center"
                  aria-label="Ukloni sliku"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* VIDEO */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-black text-slate-900">Video (opcionalno)</h3>
          {uploadedVideo && (
            <button
              type="button"
              onClick={removeVideo}
              className="text-red-600 font-bold text-sm flex items-center gap-1"
            >
              <X className="w-4 h-4" /> Ukloni
            </button>
          )}
        </div>

        {!uploadedVideo ? (
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setIsDraggingVideo(true);
            }}
            onDragLeave={() => setIsDraggingVideo(false)}
            onDrop={onDropVideo}
            className={`flex items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-6 cursor-pointer transition ${
              isDraggingVideo ? "border-red-400 bg-red-50" : "border-slate-300 bg-slate-50"
            }`}
          >
            <Upload className="w-5 h-5 text-slate-400" />
            <p className="font-bold text-slate-800">Dodaj video</p>
            <input
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => onPickVideo(e.target.files?.[0])}
            />
          </label>
        ) : (
          <div className="relative rounded-2xl overflow-hidden bg-black">
            <div className="aspect-[16/10] w-full relative">
              <video
                id="tmp-video-preview"
                className="absolute inset-0 w-full h-full object-cover"
                src={videoPreviewUrl || undefined}
                playsInline
                muted
                loop
                controls
              />
            </div>
            <div className="p-3 flex items-center justify-between bg-slate-900/70">
              <p className="text-white font-bold truncate">{getMediaName(uploadedVideo)}</p>
              <button
                type="button"
                onClick={togglePlay}
                className="w-10 h-10 rounded-xl bg-white/15 hover:bg-white/25 text-white flex items-center justify-center"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ACTIONS */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleGoBack}
          className="px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-black"
        >
          Nazad
        </button>

        <button
          type="button"
          disabled={!canContinue}
          onClick={() => setStep(5)}
          className={`px-5 py-3 rounded-2xl font-black ${
            canContinue
              ? "bg-primary text-white hover:bg-primary/90"
              : "bg-slate-200 text-slate-500 cursor-not-allowed"
          }`}
        >
          Nastavi
        </button>
      </div>
    </div>
  );
};

export default ComponentFour;