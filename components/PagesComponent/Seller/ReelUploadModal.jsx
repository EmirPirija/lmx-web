"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  Loader2,
  Sparkles,
  Trash2,
  UploadCloud,
  Video,
  ImageIcon,
  Film,
} from "lucide-react";

import Api from "@/api/AxiosInterceptors";
import { editItemApi, getMyItemsApi } from "@/utils/api";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MAX_VIDEO_MB = 50;

const pickMyItems = (res) => {
  const data = res?.data;
  return data?.data?.data || data?.data || [];
};

const resolveMedia = (src) => {
  if (!src) return "";
  if (String(src).startsWith("http")) return src;
  const base = process.env.NEXT_PUBLIC_ADMIN_URL || "";
  return base ? `${base}${src}` : src;
};

const hasVideoOnItem = (item) => Boolean(item?.video || item?.video_link);

const ReelUploadModal = ({ open, onOpenChange, onUploaded }) => {
  const [items, setItems] = useState([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState([]);

  const [queuedUploads, setQueuedUploads] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState(null);

  const queuedRef = useRef([]);

  const itemsWithVideo = useMemo(
    () => items.filter((item) => hasVideoOnItem(item)),
    [items]
  );

  const itemsWithoutVideo = useMemo(
    () => items.filter((item) => !hasVideoOnItem(item)),
    [items]
  );

  const selectedTargets = useMemo(
    () => itemsWithoutVideo.filter((item) => selectedItemIds.includes(String(item.id))),
    [itemsWithoutVideo, selectedItemIds]
  );

  const hasAnyVideo = useMemo(() => items.some((item) => hasVideoOnItem(item)), [items]);

  const resetState = useCallback(() => {
    setItems([]);
    setSelectedItemIds([]);
    setQueuedUploads([]);
    setIsUploading(false);
    setUploadProgress(0);
    setIsSubmitting(false);
    setDeleteLoadingId(null);
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
    queuedRef.current = queuedUploads;
  }, [queuedUploads]);

  const fetchItems = useCallback(async () => {
    setIsLoadingItems(true);
    try {
      const res = await getMyItemsApi.getMyItems({
        status: "approved",
        page: 1,
        sort_by: "new-to-old",
      });
      const list = pickMyItems(res);
      setItems(list);
      const idsWithoutVideo = list.filter((item) => !hasVideoOnItem(item)).map((item) => String(item.id));
      setSelectedItemIds(idsWithoutVideo.slice(0, Math.min(idsWithoutVideo.length, 3)));
    } catch (e) {
      console.error("Reel items fetch error:", e);
      toast.error("Ne mogu učitati vaše oglase.");
      setItems([]);
    } finally {
      setIsLoadingItems(false);
    }
  }, []);

  useEffect(() => {
    if (!open) {
      queuedRef.current.forEach((video) => deleteTemp(video?.id));
      resetState();
      return;
    }
    fetchItems();
  }, [open, deleteTemp, resetState, fetchItems]);

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

    if (res?.data?.error !== false) {
      throw new Error(res?.data?.message || "Upload nije uspio.");
    }
    return res?.data?.data;
  };

  const handleVideoUpload = async (filesInput) => {
    const files = Array.from(filesInput || []);
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
      const nextUploads = [];
      for (let i = 0; i < validFiles.length; i += 1) {
        setUploadProgress(0);
        // eslint-disable-next-line no-await-in-loop
        const temp = await uploadFile(validFiles[i], (p) => setUploadProgress(p));
        nextUploads.push(temp);
      }
      setQueuedUploads((prev) => [...prev, ...nextUploads]);
      toast.success(
        nextUploads.length > 1 ? `Dodana su ${nextUploads.length} videa.` : "Video je dodan."
      );
    } catch (e) {
      console.error(e);
      toast.error(e?.message || "Ne mogu otpremiti video.");
    } finally {
      setIsUploading(false);
    }
  };

  const removeQueuedVideo = async (idx) => {
    const target = queuedUploads[idx];
    if (target?.id) await deleteTemp(target.id);
    setQueuedUploads((prev) => prev.filter((_, i) => i !== idx));
  };

  const toggleTarget = (id) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };

  const handleDeleteExistingVideo = async (item) => {
    if (!item?.id) return;
    try {
      setDeleteLoadingId(item.id);
      const res = await editItemApi.editItem({ id: item.id, delete_video: 1 });
      if (res?.data?.error !== false) {
        throw new Error(res?.data?.message || "Ne mogu obrisati video.");
      }

      const nextItems = items.map((it) => (String(it.id) === String(item.id)
        ? { ...it, video: null, video_link: null }
        : it));
      setItems(nextItems);

      toast.success("Video je obrisan. Oglas je spreman za novi upload.");
      onUploaded?.({ hasAnyVideo: nextItems.some((it) => hasVideoOnItem(it)) });
    } catch (e) {
      console.error(e);
      toast.error(e?.message || "Greška pri brisanju videa.");
    } finally {
      setDeleteLoadingId(null);
    }
  };

  const handleSubmitUploads = async ({ keepOpen } = {}) => {
    if (!selectedTargets.length) {
      toast.error("Odaberite barem jedan oglas bez videa.");
      return;
    }
    if (!queuedUploads.length) {
      toast.error("Dodajte barem jedan video.");
      return;
    }
    if (queuedUploads.length < selectedTargets.length) {
      toast.error("Broj novih videa mora biti isti ili veći od broja odabranih oglasa.");
      return;
    }

    try {
      setIsSubmitting(true);
      let uploadedCount = 0;

      for (let i = 0; i < selectedTargets.length; i += 1) {
        const targetItem = selectedTargets[i];
        const video = queuedUploads[i];
        if (!video?.id) continue;

        // eslint-disable-next-line no-await-in-loop
        const res = await editItemApi.editItem({ id: targetItem.id, temp_video_id: video.id });
        if (res?.data?.error !== false) {
          throw new Error(res?.data?.message || `Ne mogu sačuvati video za oglas #${targetItem.id}`);
        }
        uploadedCount += 1;
      }

      const used = queuedUploads.slice(0, uploadedCount);
      used.forEach((v) => deleteTemp(v?.id));
      const rest = queuedUploads.slice(uploadedCount);
      setQueuedUploads(rest);

      toast.success(`Objavljeno ${uploadedCount} video objava za odabrane oglase.`);
      await fetchItems();
      onUploaded?.({ hasAnyVideo: true });

      if (!keepOpen) onOpenChange(false);
    } catch (e) {
      console.error(e);
      toast.error(e?.message || "Greška pri objavi videa.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl p-0 overflow-hidden max-h-[92vh] bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
        <div className="p-5 md:p-6 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-slate-100">Novi Reel upload studio</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">Uploadujte više videa i rasporedite ih na više oglasa bez prepisivanja postojećih video objava.</p>
            </div>
          </div>
        </div>

        <div className="p-5 md:p-6 grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-5 overflow-y-auto max-h-[calc(92vh-98px)]">
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Oglasi koji već imaju video</p>
                <span className="text-xs text-slate-500 dark:text-slate-400">{itemsWithVideo.length}</span>
              </div>
              {isLoadingItems ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">Učitavam oglase...</p>
              ) : itemsWithVideo.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">Nemate trenutno nijedan oglas sa videom.</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {itemsWithVideo.map((item) => (
                    <div key={item.id} className="rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 bg-slate-50/60 dark:bg-slate-900/40 flex items-center gap-3">
                      {item?.image ? (
                        <img src={resolveMedia(item.image)} alt="" className="w-11 h-11 rounded-lg object-cover border border-slate-200 dark:border-slate-700" />
                      ) : (
                        <div className="w-11 h-11 rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center"><ImageIcon className="w-4 h-4 text-slate-500" /></div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{item?.name || `Oglas #${item.id}`}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">Prvo obrišite ako želite novi video na istom oglasu.</p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => handleDeleteExistingVideo(item)}
                        disabled={deleteLoadingId === item.id}
                        className="text-rose-600 border-rose-200 hover:bg-rose-50 dark:border-rose-900/40 dark:hover:bg-rose-950/40"
                      >
                        {deleteLoadingId === item.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Odaberite oglase bez videa</p>
                <span className="text-xs text-slate-500 dark:text-slate-400">{selectedTargets.length} odabrano</span>
              </div>
              {itemsWithoutVideo.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">Nema oglasa bez videa. Obrišite postojeći video da biste dodali novi.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                  {itemsWithoutVideo.map((item) => {
                    const active = selectedItemIds.includes(String(item.id));
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleTarget(String(item.id))}
                        className={cn(
                          "rounded-xl border p-2.5 flex items-center gap-3 text-left transition",
                          active
                            ? "border-primary bg-primary/10"
                            : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                        )}
                      >
                        {item?.image ? (
                          <img src={resolveMedia(item.image)} alt="" className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-slate-700" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center"><ImageIcon className="w-4 h-4 text-slate-500" /></div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{item?.name || `Oglas #${item.id}`}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">Spreman za novi reel</p>
                        </div>
                        {active && <CheckCircle2 className="w-4 h-4 text-primary" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <label className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900 p-5 flex flex-col items-center text-center gap-3 cursor-pointer hover:border-primary/70 transition">
              <input type="file" accept="video/*" multiple className="hidden" onChange={(e) => handleVideoUpload(e.target.files)} />
              {isUploading ? <Loader2 className="w-7 h-7 animate-spin text-primary" /> : <UploadCloud className="w-7 h-7 text-primary" />}
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Dodajte više videa odjednom</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Učitani video ide redom na odabrane oglase • max {MAX_VIDEO_MB}MB po videu</p>
              </div>
              {isUploading && <p className="text-xs text-slate-500 dark:text-slate-400">Upload: {uploadProgress}%</p>}
            </label>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Red objave videa</p>
                <span className="text-xs text-slate-500 dark:text-slate-400">{queuedUploads.length} video(a)</span>
              </div>
              {queuedUploads.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">Niste dodali video zapise.</p>
              ) : (
                <div className="space-y-2 max-h-[360px] overflow-y-auto">
                  {queuedUploads.map((video, idx) => (
                    <div key={`${video?.id}-${idx}`} className="flex items-center gap-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2.5">
                      <div className="w-10 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center"><Video className="w-4 h-4 text-slate-500" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">Video #{idx + 1}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">Temp ID: {video?.id}</p>
                      </div>
                      <button type="button" onClick={() => removeQueuedVideo(idx)} className="p-1.5 rounded-full hover:bg-rose-50 text-rose-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 text-xs text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900">
              <p className="font-semibold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-2"><Film className="w-4 h-4" />Kako radi?</p>
              <ul className="space-y-1.5 list-disc pl-4">
                <li>Na vrhu vidite oglase koji već imaju video (i možete ih obrisati).</li>
                <li>Sredina je lista oglasa bez videa koje birate za novu objavu.</li>
                <li>Svaki uploadani video ide redom na jedan odabrani oglas.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => handleSubmitUploads({ keepOpen: true })} disabled={isSubmitting || !queuedUploads.length}>
                {isSubmitting ? "Spremam..." : "Objavi i ostani"}
              </Button>
              <Button onClick={() => handleSubmitUploads({ keepOpen: false })} disabled={isSubmitting || !queuedUploads.length} className="bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white">
                {isSubmitting ? "Spremam..." : "Objavi sve"}
              </Button>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 text-right">
              Seller trenutno ima videa: <span className="font-semibold text-slate-700 dark:text-slate-200">{hasAnyVideo ? "Da" : "Ne"}</span>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReelUploadModal;
