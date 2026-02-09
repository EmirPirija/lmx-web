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
  Link2,
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
import { getYouTubeVideoId } from "@/utils";

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
  const [videoLink, setVideoLink] = useState("");
  const [linkPreview, setLinkPreview] = useState(null);
  const [isLinkValid, setIsLinkValid] = useState(false);
  const [existingAction, setExistingAction] = useState("keep");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingMore, setIsSubmittingMore] = useState(false);
  const uploadedRef = useRef(null);
  const queuedRef = useRef([]);

  const allUploads = useMemo(() => {
    const uploads = uploadedVideo ? [uploadedVideo, ...queuedVideos] : [...queuedVideos];
    if (videoLink.trim() && isLinkValid) {
      uploads.unshift({ id: "link", type: "youtube", url: videoLink.trim(), preview: linkPreview });
    }
    return uploads;
  }, [uploadedVideo, queuedVideos, videoLink, linkPreview, isLinkValid]);

  const selectedItem = useMemo(
    () => items.find((item) => String(item?.id) === String(selectedItemId)),
    [items, selectedItemId]
  );
  const hasExistingVideo = Boolean(
    selectedItem?.video || selectedItem?.video_link
  );
  const isUsingLink = videoLink.trim().length > 0;

  const existingVideos = useMemo(() => {
    if (!selectedItem) return [];
    const list = [];
    if (selectedItem?.video) {
      list.push({
        id: "existing-upload",
        type: "upload",
        label: "Postojeći upload",
        src: selectedItem.video,
        preview: selectedItem?.image || null,
      });
    }
    if (selectedItem?.video_link) {
      const id = getYouTubeVideoId(selectedItem.video_link);
      list.push({
        id: "existing-yt",
        type: "youtube",
        label: "YouTube link",
        src: selectedItem.video_link,
        preview: id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null,
      });
    }
    return list;
  }, [selectedItem]);

  const resetState = useCallback(() => {
    setSelectedItemId("");
    setUploadedVideo(null);
    setQueuedVideos([]);
    setVideoPreviewUrl(null);
    setVideoLink("");
    setLinkPreview(null);
    setIsLinkValid(false);
    setExistingAction("keep");
    setIsUploading(false);
    setUploadProgress(0);
    setIsSubmitting(false);
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
    if (!videoLink.trim()) {
      setIsLinkValid(false);
      setLinkPreview(null);
      return;
    }
    const id = getYouTubeVideoId(videoLink.trim());
    setIsLinkValid(Boolean(id));
    setLinkPreview(id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null);
  }, [videoLink]);

  useEffect(() => {
    setExistingAction("keep");
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
    if (videoLink.trim()) {
      setVideoLink("");
      setLinkPreview(null);
      setIsLinkValid(false);
    }

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

  const handleRemoveVideo = async (index = 0, isLink = false) => {
    if (isLink) {
      setVideoLink("");
      setLinkPreview(null);
      setIsLinkValid(false);
      return;
    }

    const offset = videoLink.trim() ? 1 : 0;
    const adjustedIndex = index - offset;
    if (adjustedIndex <= 0) {
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

    const queueIndex = adjustedIndex - 1;
    const videoToRemove = queuedVideos[queueIndex];
    if (videoToRemove?.id) await deleteTemp(videoToRemove.id);
    setQueuedVideos((prev) => prev.filter((_, idx) => idx !== queueIndex));
  };

  const handleSelectUpload = (index, isLink = false) => {
    if (isLink) {
      if (!videoLink.trim()) return;
      setUploadedVideo(null);
      setQueuedVideos([]);
      return;
    }

    const offset = videoLink.trim() ? 1 : 0;
    const adjustedIndex = index - offset;
    if (adjustedIndex === 0) return;
    const queueIndex = adjustedIndex - 1;
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
    if (isUsingLink && !isLinkValid) {
      toast.error("Unesite validan YouTube link.");
      return;
    }
    if (!isUsingLink && !uploadedVideo?.id) {
      if (existingAction === "delete" && hasExistingVideo) {
        // delete only
      } else {
        toast.error("Prvo otpremite video ili dodajte YouTube link.");
        return;
      }
    }

    if (hasExistingVideo && (isUsingLink || uploadedVideo?.id)) {
      if (existingAction === "keep") {
        toast.error("Odaberite da li želite zamijeniti ili obrisati postojeći video.");
        return;
      }
    }

    try {
      if (keepOpen) setIsSubmittingMore(true);
      else setIsSubmitting(true);
      const shouldDelete = hasExistingVideo && existingAction === "delete";
      const res = await editItemApi.editItem({
        id: selectedItemId,
        ...(shouldDelete ? { delete_video: 1 } : {}),
        ...(isUsingLink ? { video_link: videoLink.trim() } : uploadedVideo?.id ? { temp_video_id: uploadedVideo.id } : {}),
      });

      if (res?.data?.error === false) {
        toast.success(
          keepOpen
            ? "Reel je dodan. Možete postaviti još jedan."
            : shouldDelete
              ? "Video je obrisan."
              : "Reel je spreman za Home Reels."
        );
        onUploaded?.(selectedItem);
        if (keepOpen || queuedVideos.length > 0 || isUsingLink) {
          if (isUsingLink) {
            setVideoLink("");
            setLinkPreview(null);
            setIsLinkValid(false);
            setExistingAction("keep");
          } else if (queuedVideos.length > 0) {
            const [next, ...rest] = queuedVideos;
            setUploadedVideo(next);
            setQueuedVideos(rest);
          } else {
            setUploadedVideo(null);
          }
          setVideoPreviewUrl(null);
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
      <DialogContent className="max-w-5xl p-0 overflow-hidden bg-white rounded-2xl max-h-[92vh]">
        <div className="p-6 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Play className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Objavi video priče
              </h3>
              <p className="text-sm text-slate-500">
                Dodajte više videa za svoje oglase - svaki video postaje dio vaše priče.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-[1.3fr_0.7fr] gap-6 overflow-y-auto max-h-[calc(92vh-88px)]">
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                Odaberite oglas
              </label>
              <Select
                value={selectedItemId}
                onValueChange={setSelectedItemId}
                disabled={isLoadingItems}
              >
                <SelectTrigger className="w-full bg-slate-50 border-slate-200">
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
            </div>

            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-700">
                Video za reel
              </label>

              {hasExistingVideo && (
                <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-900">Postojeći video</p>
                    <span className="text-xs text-slate-400">{existingVideos.length} video(a)</span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {existingVideos.map((vid) => (
                      <div
                        key={vid.id}
                        className={cn(
                          "rounded-xl border p-3 flex items-center gap-3 bg-slate-50",
                          existingAction === "delete" ? "border-rose-200 bg-rose-50" : "border-slate-200 bg-slate-50"
                        )}
                      >
                        <div className="w-12 h-16 rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center">
                          {vid.preview ? (
                            <img src={vid.preview} alt={vid.label} className="w-full h-full object-cover" />
                          ) : (
                            <Video className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-slate-700">{vid.label}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="inline-flex items-center rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                              {vid.type === "youtube" ? "YouTube" : "Upload"}
                            </span>
                            {vid.type === "youtube" && vid.src && (
                              <span className="text-[10px] text-slate-400 truncate max-w-[140px]">
                                {vid.src}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setExistingAction("delete")}
                          className="p-2 rounded-full text-rose-500 hover:bg-rose-100 transition"
                          aria-label="Obriši postojeći video"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: "keep", label: "Zadrži postojeći", tone: "bg-slate-100 text-slate-700" },
                      { id: "replace", label: "Zamijeni novim", tone: "bg-amber-100 text-amber-700" },
                      { id: "delete", label: "Obriši postojeći", tone: "bg-rose-100 text-rose-700" },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setExistingAction(opt.id)}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs font-semibold border transition",
                          existingAction === opt.id
                            ? "border-transparent shadow-sm"
                            : "border-slate-200 hover:border-slate-300",
                          opt.tone
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 justify-between">
                    <p className="text-[11px] text-slate-500">
                      Odaberite šta radite sa postojećim videom prije objave novog.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setExistingAction("delete");
                        handleSubmit({ keepOpen: false });
                      }}
                      className="text-[11px] font-semibold text-rose-600 hover:text-rose-700"
                    >
                      Obriši odmah
                    </button>
                  </div>
                </div>
              )}

              {!uploadedVideo ? (
                <motion.label
                  whileHover={{ scale: 1.01 }}
                  className={cn(
                    "flex flex-col items-center justify-center gap-3",
                    "border border-dashed border-slate-200 rounded-2xl",
                    "bg-slate-50/70 px-6 py-10 text-center cursor-pointer",
                    "transition-colors hover:border-primary/60 hover:bg-primary/5",
                    isUsingLink && "opacity-60 cursor-not-allowed"
                  )}
                >
                  <input
                    type="file"
                    accept="video/*"
                    multiple
                    className="hidden"
                    disabled={isUsingLink}
                    onChange={(e) => handleVideoUpload(Array.from(e.target.files || []))}
                  />
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 shadow-sm flex items-center justify-center">
                    {isUploading ? (
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    ) : (
                      <UploadCloud className="w-6 h-6 text-primary" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
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
                        <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                          <span>Upload u toku</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.label>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 shadow-sm p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                        <Video className="w-6 h-6 text-slate-500" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
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
                      className="p-2 rounded-full hover:bg-red-50 text-red-500 transition-colors"
                      aria-label="Ukloni video"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  {videoPreviewUrl && (
                    <div className="mt-4 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
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

              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-[11px] text-slate-400 font-medium">ili</span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
                    <Link2 className="w-4 h-4 text-slate-500" />
                  </div>
                  YouTube link
                </div>
                <input
                  type="url"
                  value={videoLink}
                  onChange={(e) => {
                    setVideoLink(e.target.value);
                    if (uploadedVideo || queuedVideos.length > 0) {
                      setUploadedVideo(null);
                      setQueuedVideos([]);
                      setVideoPreviewUrl(null);
                    }
                  }}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className={cn(
                    "w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition",
                    isUsingLink
                      ? isLinkValid
                        ? "border-emerald-300 focus:border-emerald-500"
                        : "border-amber-300 focus:border-amber-400"
                      : "border-slate-200 focus:border-slate-400"
                  )}
                />
                {isUsingLink && (
                  <p className={cn("text-xs", isLinkValid ? "text-emerald-600" : "text-amber-600")}>
                    {isLinkValid ? "YouTube link je spreman za objavu." : "Link mora biti YouTube video."}
                  </p>
                )}
                {linkPreview && (
                  <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                    <img src={linkPreview} alt="YouTube preview" className="w-full h-44 object-cover" />
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                {isUsingLink
                  ? "YouTube link će se prikazivati kao priča."
                  : queuedVideos.length > 0
                    ? `Spremno još ${queuedVideos.length} videa.`
                    : "Reel se prikazuje nakon što oglas ostane aktivan."}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleSubmit({ keepOpen: true })}
                  disabled={
                    isSubmitting ||
                    isSubmittingMore
                  }
                  className="border-slate-200 text-slate-700 hover:bg-slate-50"
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
                    isSubmittingMore
                  }
                  className="min-w-[160px] bg-slate-900 hover:bg-slate-800 text-white"
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
              <h4 className="text-sm font-semibold text-slate-900">
                Spremni reelovi
              </h4>
              <span className="text-xs text-slate-400">
                {allUploads.length} video(a)
              </span>
            </div>

            {allUploads.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 text-center text-sm text-slate-400">
                Dodajte video kako biste ga vidjeli ovdje.
              </div>
            ) : (
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {allUploads.map((vid, index) => {
                  const isLinkItem = vid?.type === "youtube";
                  return (
                  <motion.button
                    key={vid?.id || index}
                    type="button"
                    whileHover={{ scale: 1.01 }}
                    onClick={() => handleSelectUpload(index, isLinkItem)}
                    className={cn(
                      "w-full flex items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                      index === 0
                        ? "border-primary bg-primary/5"
                        : "border-slate-200 bg-slate-50/50 hover:bg-slate-50"
                    )}
                  >
                    <div className="w-12 h-16 rounded-lg bg-slate-100 flex items-center justify-center">
                      {isLinkItem ? <Link2 className="w-4 h-4 text-slate-400" /> : <Play className="w-4 h-4 text-slate-400" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900">
                        {isLinkItem ? "YouTube reel" : `Reel #${index + 1}`}
                      </p>
                      <p className="text-xs text-slate-400">
                        {index === 0 ? "Spreman za objavu" : "Na čekanju"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveVideo(index, isLinkItem);
                      }}
                      className="p-2 rounded-full hover:bg-red-50 text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.button>
                );
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReelUploadModal;
