"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Loader2, Link2, Trash2, UploadCloud, Video } from "lucide-react";

import Api from "@/api/AxiosInterceptors";
import { editItemApi, getMyItemsApi } from "@/utils/api";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getYouTubeVideoId } from "@/utils";

const MAX_VIDEO_MB = 50;

const pickMyItems = (res) => {
  const data = res?.data;
  return data?.data?.data || data?.data || [];
};

const ReelUploadModal = ({ open, onOpenChange, onUploaded }) => {
  const [items, setItems] = useState([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState([]);

  const [uploadedVideos, setUploadedVideos] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [videoLink, setVideoLink] = useState("");
  const [isLinkValid, setIsLinkValid] = useState(false);
  const [linkPreview, setLinkPreview] = useState("");

  const [existingAction, setExistingAction] = useState("replace");
  const [reuseLastVideo, setReuseLastVideo] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const uploadedRef = useRef([]);

  const selectedItems = useMemo(
    () => items.filter((item) => selectedItemIds.includes(String(item?.id))),
    [items, selectedItemIds]
  );

  const hasExistingVideo = useMemo(
    () => selectedItems.some((item) => item?.video || item?.video_link),
    [selectedItems]
  );

  const isUsingLink = videoLink.trim().length > 0;

  const resetState = useCallback(() => {
    setSelectedItemIds([]);
    setUploadedVideos([]);
    setVideoLink("");
    setIsLinkValid(false);
    setLinkPreview("");
    setUploadProgress(0);
    setIsUploading(false);
    setIsSubmitting(false);
    setExistingAction("replace");
    setReuseLastVideo(false);
  }, []);

  const deleteTemp = useCallback(async (id) => {
    if (!id) return;
    try {
      await Api.delete(`/upload-temp/${id}`);
    } catch (e) {
      console.error("Greška brisanja temp videa:", e);
    }
  }, []);

  useEffect(() => {
    uploadedRef.current = uploadedVideos;
  }, [uploadedVideos]);

  useEffect(() => {
    if (!open) {
      uploadedRef.current.forEach((video) => deleteTemp(video?.id));
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
      } finally {
        setIsLoadingItems(false);
      }
    };

    fetchItems();
  }, [open, deleteTemp, resetState]);

  useEffect(() => {
    if (!videoLink.trim()) {
      setIsLinkValid(false);
      setLinkPreview("");
      return;
    }
    const id = getYouTubeVideoId(videoLink.trim());
    setIsLinkValid(Boolean(id));
    setLinkPreview(id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : "");
  }, [videoLink]);

  const uploadFile = async (file, onProgress) => {
    const fd = new FormData();
    fd.append("video", file);
    const res = await Api.post("/upload-temp/video", fd, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (progressEvent) => {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress?.(percent);
      },
    });

    if (res?.data?.error !== false) throw new Error(res?.data?.message || "Upload nije uspio.");
    return res?.data?.data;
  };

  const handleVideoUpload = async (filesInput) => {
    const files = Array.isArray(filesInput) ? filesInput : Array.from(filesInput || []);
    if (!files.length) return;

    if (videoLink.trim()) {
      setVideoLink("");
      setIsLinkValid(false);
      setLinkPreview("");
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
      const nextUploads = [];

      for (let i = 0; i < validFiles.length; i += 1) {
        setUploadProgress(0);
        // eslint-disable-next-line no-await-in-loop
        const up = await uploadFile(validFiles[i], (p) => setUploadProgress(p));
        nextUploads.push(up);
      }

      setUploadedVideos((prev) => [...prev, ...nextUploads]);
      toast.success(`Dodano ${nextUploads.length} video zapisa u seriju.`);
    } catch (e) {
      console.error(e);
      toast.error(e?.message || "Ne mogu otpremiti video.");
    } finally {
      setIsUploading(false);
    }
  };

  const removeQueuedVideo = async (idx) => {
    const target = uploadedVideos[idx];
    if (target?.id) await deleteTemp(target.id);
    setUploadedVideos((prev) => prev.filter((_, i) => i !== idx));
  };

  const toggleItem = (id) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = async ({ keepOpen }) => {
    if (selectedItemIds.length === 0) {
      toast.error("Odaberite barem jedan oglas.");
      return;
    }

    if (isUsingLink && !isLinkValid) {
      toast.error("Unesite ispravan YouTube link.");
      return;
    }

    if (!isUsingLink && uploadedVideos.length === 0 && existingAction !== "delete") {
      toast.error("Dodajte video ili YouTube link.");
      return;
    }

    if (!isUsingLink && uploadedVideos.length < selectedItemIds.length && !reuseLastVideo && existingAction !== "delete") {
      toast.error("Za svaki oglas treba video. Uključite opciju ponavljanja zadnjeg videa ili smanjite broj oglasa.");
      return;
    }

    try {
      setIsSubmitting(true);
      let usedVideos = 0;

      for (let i = 0; i < selectedItemIds.length; i += 1) {
        const targetId = selectedItemIds[i];
        const assignedVideo = uploadedVideos[i] || (reuseLastVideo ? uploadedVideos[uploadedVideos.length - 1] : null);
        const payload = {
          id: targetId,
          ...(hasExistingVideo && existingAction === "delete" ? { delete_video: 1 } : {}),
          ...(isUsingLink ? { video_link: videoLink.trim() } : assignedVideo?.id ? { temp_video_id: assignedVideo.id } : {}),
        };

        // eslint-disable-next-line no-await-in-loop
        const res = await editItemApi.editItem(payload);
        if (res?.data?.error !== false) throw new Error(res?.data?.message || "Ne mogu spremiti reel.");
        if (!isUsingLink && assignedVideo?.id && i < uploadedVideos.length) usedVideos += 1;
      }

      const restVideos = uploadedVideos.slice(usedVideos);
      if (usedVideos > 0) {
        uploadedVideos.slice(0, usedVideos).forEach((v) => deleteTemp(v?.id));
      }

      toast.success(
        isUsingLink
          ? "YouTube priče su objavljene za odabrane oglase."
          : `Objavljeno ${Math.max(usedVideos, selectedItemIds.length)} reel objava.`
      );

      onUploaded?.();

      if (keepOpen) {
        setUploadedVideos(restVideos);
        setVideoLink("");
        setIsLinkValid(false);
        setLinkPreview("");
        return;
      }

      onOpenChange(false);
    } catch (e) {
      console.error(e);
      toast.error(e?.message || "Greška pri objavi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl p-0 overflow-hidden max-h-[92vh] bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Novi reel studio</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">Odaberite više oglasa i objavite seriju videa kao Instagram priče.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6 p-6 overflow-y-auto max-h-[calc(92vh-100px)]">
          <div className="space-y-5">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Odaberite oglase za seriju</p>
              <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
                {isLoadingItems && <p className="text-sm text-slate-500 dark:text-slate-400">Učitavam oglase...</p>}
                {!isLoadingItems && items.length === 0 && (
                  <p className="text-sm text-slate-500 dark:text-slate-400">Nemate aktivnih oglasa.</p>
                )}
                {items.map((item) => {
                  const id = String(item?.id);
                  const checked = selectedItemIds.includes(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => toggleItem(id)}
                      className={cn(
                        "w-full flex items-center justify-between rounded-xl border px-3 py-2 text-left transition",
                        checked
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                      )}
                    >
                      <span className="text-sm font-medium truncate">{item?.name || `Oglas #${id}`}</span>
                      {checked && <CheckCircle2 className="w-4 h-4" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900 p-5 flex flex-col items-center text-center gap-3 cursor-pointer hover:border-primary/70 transition">
              <input type="file" accept="video/*" multiple className="hidden" onChange={(e) => handleVideoUpload(e.target.files)} />
              {isUploading ? <Loader2 className="w-7 h-7 animate-spin text-primary" /> : <UploadCloud className="w-7 h-7 text-primary" />}
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Dodajte više videa odjednom</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">MP4/MOV/WEBM do {MAX_VIDEO_MB}MB po videu</p>
              </div>
              {isUploading && <p className="text-xs text-slate-500 dark:text-slate-400">Upload: {uploadProgress}%</p>}
            </label>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100"><Link2 className="w-4 h-4" /> YouTube alternativa</div>
              <input
                value={videoLink}
                onChange={(e) => {
                  setVideoLink(e.target.value);
                  if (uploadedVideos.length > 0) setUploadedVideos([]);
                }}
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-700 dark:text-slate-200"
              />
              {videoLink.trim() && (
                <p className={cn("text-xs", isLinkValid ? "text-emerald-600" : "text-amber-600")}>
                  {isLinkValid ? "Link je spreman za objavu." : "Unesite validan YouTube link."}
                </p>
              )}
              {linkPreview && <img src={linkPreview} alt="YouTube preview" className="rounded-xl border border-slate-200 dark:border-slate-700 w-full h-40 object-cover" />}
            </div>

            <div className="flex flex-wrap gap-2 items-center text-xs">
              <button type="button" onClick={() => setExistingAction("replace")} className={cn("px-3 py-1.5 rounded-full", existingAction === "replace" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300")}>Zamijeni postojeće</button>
              <button type="button" onClick={() => setExistingAction("delete")} className={cn("px-3 py-1.5 rounded-full", existingAction === "delete" ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300")}>Prvo obriši pa objavi</button>
              <label className="ml-auto flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <input type="checkbox" checked={reuseLastVideo} onChange={(e) => setReuseLastVideo(e.target.checked)} />
                Ponavljaj zadnji video
              </label>
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => handleSubmit({ keepOpen: true })} disabled={isSubmitting}>
                {isSubmitting ? "Spremam..." : "Objavi i ostani"}
              </Button>
              <Button onClick={() => handleSubmit({ keepOpen: false })} disabled={isSubmitting} className="bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white">
                {isSubmitting ? "Spremam..." : "Objavi seriju"}
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-4">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-3">Red objave</p>
              {uploadedVideos.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">Niste dodali video zapise.</p>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {uploadedVideos.map((video, idx) => (
                    <div key={`${video?.id}-${idx}`} className="flex items-center gap-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2.5">
                      <div className="w-10 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center"><Video className="w-4 h-4 text-slate-500" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">Video #{idx + 1}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">ID: {video?.id}</p>
                      </div>
                      <button type="button" onClick={() => removeQueuedVideo(idx)} className="p-1.5 rounded-full hover:bg-rose-50 text-rose-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 text-xs text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900">
              <p className="font-semibold text-slate-700 dark:text-slate-200 mb-2">Pametni savjet</p>
              <p>Najbolje radi kada za svaki odabrani oglas imate poseban video. Tako seller dobija "story" niz bez ponavljanja.</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReelUploadModal;
