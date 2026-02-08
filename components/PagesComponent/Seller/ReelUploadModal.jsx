"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  CheckCircle2,
  Loader2,
  Play,
  Trash2,
  UploadCloud,
  Video,
} from "lucide-react";

import Api from "@/api/AxiosInterceptors";
import { editItemApi, getMyItemsApi } from "@/utils/api";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MAX_VIDEO_MB = 50;

const pickMyItems = (res) => {
  const data = res?.data;
  return data?.data?.data || data?.data || [];
};

const ReelUploadModal = ({ open, onOpenChange, onUploaded }) => {
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [items, setItems] = useState([]);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [uploadedVideo, setUploadedVideo] = useState(null);
  const [queuedVideos, setQueuedVideos] = useState([]);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingMore, setIsSubmittingMore] = useState(false);
  const [confirmReplace, setConfirmReplace] = useState(false);
  const uploadedRef = useRef(null);
  const queuedRef = useRef([]);

  const allUploads = useMemo(
    () => (uploadedVideo ? [uploadedVideo, ...queuedVideos] : [...queuedVideos]),
    [uploadedVideo, queuedVideos]
  );

  const selectedItem = useMemo(
    () => items.find((item) => String(item?.id) === String(selectedItemId)),
    [items, selectedItemId]
  );
  const hasExistingVideo = Boolean(
    selectedItem?.video || selectedItem?.video_link
  );

  const resetState = useCallback(() => {
    setSelectedItemId("");
    setUploadedVideo(null);
    setQueuedVideos([]);
    setVideoPreviewUrl(null);
    setIsUploading(false);
    setUploadProgress(0);
    setIsSubmitting(false);
    setConfirmReplace(false);
  }, []);

  const deleteTemp = useCallback(async (id) => {
    if (!id) return;
    try {
      await Api.delete(`/upload-temp/${id}`);
    } catch (e) {
      console.error("Temp video delete error:", e);
    }
  }, []);

  useEffect(() => {
    uploadedRef.current = uploadedVideo;
  }, [uploadedVideo]);

  useEffect(() => {
    queuedRef.current = queuedVideos;
  }, [queuedVideos]);

  useEffect(() => {
    if (!open) {
      const prevUploaded = uploadedRef.current;
      const prevQueued = queuedRef.current;
      if (prevUploaded?.id) deleteTemp(prevUploaded.id);
      prevQueued.forEach((video) => deleteTemp(video?.id));
      resetState();
      return;
    }

    const fetchItems = async () => {
      setIsLoadingItems(true);
      try {
        const res = await getMyItemsApi.getMyItems({
          status: "approved",
          page: 1,
          sort_by: "new-to-old",
        });
        setItems(pickMyItems(res));
      } catch (e) {
        console.error("Reel items fetch error:", e);
        toast.error("Ne mogu učitati vaše oglase.");
        setItems([]);
      } finally {
        setIsLoadingItems(false);
      }
    };

    fetchItems();
  }, [open, deleteTemp, resetState]);

  useEffect(() => {
    if (!uploadedVideo) {
      setVideoPreviewUrl(null);
      return;
    }

    const url = uploadedVideo?.url || uploadedVideo?.path || null;
    setVideoPreviewUrl(url);
  }, [uploadedVideo]);

  useEffect(() => {
    setConfirmReplace(false);
  }, [selectedItemId]);

  const uploadFile = async (file, onProgress) => {
    const fd = new FormData();
    fd.append("video", file);
    const res = await Api.post("/upload-temp/video", fd, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (progressEvent) => {
        const percent = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress?.(percent);
      },
    });
    if (res?.data?.error !== false) {
      throw new Error(res?.data?.message || "Upload nije uspio");
    }
    return res.data.data;
  };

  const handleVideoUpload = async (input) => {
    const files = Array.isArray(input) ? input : input ? [input] : [];
    if (!files.length) return;

    const validFiles = files.filter((file) => {
      if (!file?.type?.startsWith("video/")) {
        toast.error("Odaberite validan video fajl.");
        return false;
      }
      if (file.size > MAX_VIDEO_MB * 1024 * 1024) {
        toast.error(`Video je prevelik. Maksimum je ${MAX_VIDEO_MB}MB.`);
        return false;
      }
      return true;
    });

    if (!validFiles.length) return;

    try {
      setIsUploading(true);
      const uploads = [];

      for (let i = 0; i < validFiles.length; i += 1) {
        setUploadProgress(0);
        // eslint-disable-next-line no-await-in-loop
        const data = await uploadFile(validFiles[i], (p) => setUploadProgress(p));
        uploads.push(data);
      }

      if (!uploadedVideo && uploads.length > 0) {
        setUploadedVideo(uploads[0]);
        setQueuedVideos(uploads.slice(1));
      } else {
        setQueuedVideos((prev) => [...prev, ...uploads]);
      }

      toast.success(
        uploads.length > 1
          ? `Otpremljeno ${uploads.length} videa.`
          : "Video je uspješno otpremljen."
      );
    } catch (e) {
      console.error(e);
      toast.error(e?.message || "Video nije moguće otpremiti.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveVideo = async (index = 0) => {
    if (index === 0) {
      if (uploadedVideo?.id) await deleteTemp(uploadedVideo.id);
      if (queuedVideos.length > 0) {
        const [next, ...rest] = queuedVideos;
        setUploadedVideo(next);
        setQueuedVideos(rest);
        return;
      }
      setUploadedVideo(null);
      setVideoPreviewUrl(null);
      return;
    }

    const queueIndex = index - 1;
    const videoToRemove = queuedVideos[queueIndex];
    if (videoToRemove?.id) await deleteTemp(videoToRemove.id);
    setQueuedVideos((prev) => prev.filter((_, idx) => idx !== queueIndex));
  };

  const handleSelectUpload = (index) => {
    if (index === 0) return;
    const queueIndex = index - 1;
    const nextVideo = queuedVideos[queueIndex];
    if (!nextVideo) return;

    setQueuedVideos((prev) => {
      const updated = [...prev];
      updated.splice(queueIndex, 1);
      if (uploadedVideo) updated.unshift(uploadedVideo);
      return updated;
    });
    setUploadedVideo(nextVideo);
  };

  const handleSubmit = async ({ keepOpen } = {}) => {
    if (!selectedItemId) {
      toast.error("Odaberite oglas za koji dodajete reel.");
      return;
    }
    if (hasExistingVideo && !confirmReplace) {
      toast.error("Ovaj oglas već ima video. Potvrdite zamjenu.");
      return;
    }
    if (!uploadedVideo?.id) {
      toast.error("Prvo otpremite video.");
      return;
    }

    try {
      if (keepOpen) setIsSubmittingMore(true);
      else setIsSubmitting(true);
      const res = await editItemApi.editItem({
        id: selectedItemId,
        temp_video_id: uploadedVideo.id,
      });

      if (res?.data?.error === false) {
        toast.success(
          keepOpen
            ? "Reel je dodan. Možete postaviti još jedan."
            : "Reel je spreman za Home Reels."
        );
        onUploaded?.(selectedItem);
        if (keepOpen || queuedVideos.length > 0) {
          if (queuedVideos.length > 0) {
            const [next, ...rest] = queuedVideos;
            setUploadedVideo(next);
            setQueuedVideos(rest);
          } else {
            setUploadedVideo(null);
          }
          setVideoPreviewUrl(null);
          setConfirmReplace(false);
          return;
        }
        onOpenChange(false);
        return;
      }

      throw new Error(res?.data?.message || "Ne mogu sačuvati video.");
    } catch (e) {
      console.error(e);
      toast.error(e?.message || "Nešto je pošlo po zlu.");
    } finally {
      setIsSubmitting(false);
      setIsSubmittingMore(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl p-0 overflow-hidden bg-slate-950 text-white">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#F7941D] via-[#E1306C] to-[#833AB4] p-[2px]">
              <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center">
                <Play className="w-5 h-5 text-[#E1306C]" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                Objavi video priče
              </h3>
              <p className="text-sm text-slate-300">
                Dodajte više videa za svoje oglase - svaki video postaje dio vaše priče.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6">
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-200">
                Odaberite oglas
              </label>
              <Select
                value={selectedItemId}
                onValueChange={setSelectedItemId}
                disabled={isLoadingItems}
              >
                <SelectTrigger className="w-full bg-slate-900 border-white/10 text-white">
                  <SelectValue
                    placeholder={
                      isLoadingItems
                        ? "Učitavam oglase..."
                        : "Izaberite oglas"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {items.length === 0 ? (
                    <SelectItem value="no-items" disabled>
                      Nema aktivnih oglasa
                    </SelectItem>
                  ) : (
                    items.map((item) => (
                      <SelectItem key={item.id} value={String(item.id)}>
                        {item?.name || `Oglas #${item.id}`}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {hasExistingVideo && (
                <div className="mt-3 rounded-xl border border-amber-400/40 bg-amber-500/10 p-3 text-xs text-amber-200">
                  <p className="font-semibold">Ovaj oglas već ima video.</p>
                  <p className="mt-1">
                    Ako nastavite, trenutni video će biti zamijenjen novim reel
                    videom.
                  </p>
                  <label className="mt-2 flex items-center gap-2 text-amber-100">
                    <input
                      type="checkbox"
                      checked={confirmReplace}
                      onChange={(e) => setConfirmReplace(e.target.checked)}
                      className="h-4 w-4 rounded border-amber-300 text-amber-500 focus:ring-amber-400"
                    />
                    Svjestan/na sam da mijenjam postojeći video.
                  </label>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-200">
                Video za reel
              </label>

              {!uploadedVideo ? (
                <motion.label
                  whileHover={{ scale: 1.01 }}
                  className={cn(
                    "flex flex-col items-center justify-center gap-3",
                    "border border-dashed border-white/15 rounded-2xl",
                    "bg-slate-900/60 px-6 py-10 text-center cursor-pointer",
                    "transition-colors hover:border-[#E1306C]/60 hover:bg-[#E1306C]/10"
                  )}
                >
                  <input
                    type="file"
                    accept="video/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleVideoUpload(Array.from(e.target.files || []))}
                  />
                  <div className="w-12 h-12 rounded-2xl bg-white/10 shadow-sm flex items-center justify-center">
                    {isUploading ? (
                      <Loader2 className="w-6 h-6 animate-spin text-[#E1306C]" />
                    ) : (
                      <UploadCloud className="w-6 h-6 text-[#E1306C]" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      Otpremite video
                    </p>
                    <p className="text-xs text-slate-400">
                      MP4, MOV ili WEBM do {MAX_VIDEO_MB}MB
                    </p>
                  </div>

                  <AnimatePresence>
                    {isUploading && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="w-full max-w-xs"
                      >
                        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                          <span>Upload u toku</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#F7941D] to-[#E1306C] transition-all"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.label>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-slate-900/60 shadow-sm p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                        <Video className="w-6 h-6 text-slate-300" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">
                          Video je spreman
                        </p>
                        <p className="text-xs text-slate-400">
                          Možete dodati više videa i objaviti ih redom.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveVideo(0)}
                      className="p-2 rounded-full hover:bg-red-500/20 text-red-300 transition-colors"
                      aria-label="Ukloni video"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  {videoPreviewUrl && (
                    <div className="mt-4 rounded-2xl overflow-hidden bg-black">
                      <video
                        className="w-full h-56 object-contain"
                        src={videoPreviewUrl}
                        playsInline
                        muted
                        loop
                        controls
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                {queuedVideos.length > 0
                  ? `Spremno još ${queuedVideos.length} videa.`
                  : "Reel se prikazuje nakon što oglas ostane aktivan."}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleSubmit({ keepOpen: true })}
                  disabled={
                    isSubmitting ||
                    isSubmittingMore ||
                    (hasExistingVideo && !confirmReplace)
                  }
                >
                  {isSubmittingMore ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Spremam...
                    </>
                  ) : (
                    "Objavi i dodaj još"
                  )}
                </Button>
                <Button
                  onClick={() => handleSubmit({ keepOpen: false })}
                  disabled={
                    isSubmitting ||
                    isSubmittingMore ||
                    (hasExistingVideo && !confirmReplace)
                  }
                  className="min-w-[160px] bg-gradient-to-r from-[#F7941D] to-[#E1306C] hover:opacity-90"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Spremam...
                    </>
                  ) : (
                    "Objavi reel"
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-white">
                Spremni reelovi
              </h4>
              <span className="text-xs text-slate-400">
                {allUploads.length} video(a)
              </span>
            </div>

            {allUploads.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 text-center text-sm text-slate-400">
                Dodajte video kako biste ga vidjeli ovdje.
              </div>
            ) : (
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {allUploads.map((vid, index) => (
                  <motion.button
                    key={vid?.id || index}
                    type="button"
                    whileHover={{ scale: 1.01 }}
                    onClick={() => handleSelectUpload(index)}
                    className={cn(
                      "w-full flex items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                      index === 0
                        ? "border-[#E1306C] bg-[#E1306C]/15"
                        : "border-white/10 bg-slate-900/40 hover:bg-slate-900/60"
                    )}
                  >
                    <div className="w-12 h-16 rounded-lg bg-black flex items-center justify-center">
                      <Play className="w-4 h-4 text-white/70" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white">
                        Reel #{index + 1}
                      </p>
                      <p className="text-xs text-slate-400">
                        {index === 0 ? "Spreman za objavu" : "Na čekanju"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveVideo(index);
                      }}
                      className="p-2 rounded-full hover:bg-red-500/20 text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReelUploadModal;