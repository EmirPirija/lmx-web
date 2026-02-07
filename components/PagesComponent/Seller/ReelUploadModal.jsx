"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  const [videoPreviewUrl, setVideoPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedItem = useMemo(
    () => items.find((item) => String(item?.id) === String(selectedItemId)),
    [items, selectedItemId]
  );

  const resetState = useCallback(() => {
    setSelectedItemId("");
    setUploadedVideo(null);
    setVideoPreviewUrl(null);
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
    if (!open) {
      if (uploadedVideo?.id) deleteTemp(uploadedVideo.id);
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
  }, [open, deleteTemp, resetState, uploadedVideo?.id]);

  useEffect(() => {
    if (!uploadedVideo) {
      setVideoPreviewUrl(null);
      return;
    }

    const url = uploadedVideo?.url || uploadedVideo?.path || null;
    setVideoPreviewUrl(url);
  }, [uploadedVideo]);

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

  const handleVideoUpload = async (file) => {
    if (!file) return;
    if (!file.type?.startsWith("video/")) {
      toast.error("Odaberite validan video fajl.");
      return;
    }
    if (file.size > MAX_VIDEO_MB * 1024 * 1024) {
      toast.error(`Video je prevelik. Maksimum je ${MAX_VIDEO_MB}MB.`);
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);
      const data = await uploadFile(file, (p) => setUploadProgress(p));
      setUploadedVideo(data);
      toast.success("Video je uspješno otpremljen.");
    } catch (e) {
      console.error(e);
      toast.error(e?.message || "Video nije moguće otpremiti.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveVideo = async () => {
    if (uploadedVideo?.id) await deleteTemp(uploadedVideo.id);
    setUploadedVideo(null);
    setVideoPreviewUrl(null);
  };

  const handleSubmit = async () => {
    if (!selectedItemId) {
      toast.error("Odaberite oglas za koji dodajete reel.");
      return;
    }
    if (!uploadedVideo?.id) {
      toast.error("Prvo otpremite video.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await editItemApi.editItem({
        id: selectedItemId,
        temp_video_id: uploadedVideo.id,
      });

      if (res?.data?.error === false) {
        toast.success("Reel je spreman za Home Reels.");
        onUploaded?.(selectedItem);
        onOpenChange(false);
        return;
      }

      throw new Error(res?.data?.message || "Ne mogu sačuvati video.");
    } catch (e) {
      console.error(e);
      toast.error(e?.message || "Nešto je pošlo po zlu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden bg-white">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#F7941D] via-[#E1306C] to-[#833AB4] p-[2px]">
              <div className="w-full h-full rounded-[14px] bg-white flex items-center justify-center">
                <Play className="w-5 h-5 text-[#E1306C]" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Dodaj video za Home Reels
              </h3>
              <p className="text-sm text-slate-500">
                Odaberite svoj oglas i postavite video koji će se prikazati u
                Reels sekciji.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
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

            {!uploadedVideo ? (
              <motion.label
                whileHover={{ scale: 1.01 }}
                className={cn(
                  "flex flex-col items-center justify-center gap-3",
                  "border border-dashed border-slate-300 rounded-2xl",
                  "bg-slate-50 px-6 py-10 text-center cursor-pointer",
                  "transition-colors hover:border-primary/60 hover:bg-primary/5"
                )}
              >
                <input
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => handleVideoUpload(e.target.files?.[0])}
                />
                <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center">
                  {isUploading ? (
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  ) : (
                    <UploadCloud className="w-6 h-6 text-primary" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700">
                    Otpremite video
                  </p>
                  <p className="text-xs text-slate-500">
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
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                      <Video className="w-6 h-6 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        Video je spreman
                      </p>
                      <p className="text-xs text-slate-500">
                        Kliknite sa strane da uklonite ako želite drugačiji.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveVideo}
                    className="p-2 rounded-full hover:bg-red-50 text-red-500 transition-colors"
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
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Reel se prikazuje nakon što oglas ostane aktivan.
            </div>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="min-w-[160px]"
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
      </DialogContent>
    </Dialog>
  );
};

export default ReelUploadModal;
