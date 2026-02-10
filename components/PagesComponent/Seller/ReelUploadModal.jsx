"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  ChevronDown,
  Loader2,
  Play,
  Trash2,
  UploadCloud,
  Video,
  Sparkles,
  ImageIcon,
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
  const [selectedItemId, setSelectedItemId] = useState("");
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);

  const [queuedUploads, setQueuedUploads] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeletingVideo, setIsDeletingVideo] = useState(false);

  const queuedRef = useRef([]);

  const selectedItem = useMemo(
    () => items.find((item) => String(item?.id) === String(selectedItemId)),
    [items, selectedItemId]
  );

  const existingVideoUrl = useMemo(
    () => resolveMedia(selectedItem?.video || ""),
    [selectedItem?.video]
  );

  const hasAnyVideo = useMemo(() => items.some((item) => hasVideoOnItem(item)), [items]);

  const resetState = useCallback(() => {
    setSelectedItemId("");
    setQueuedUploads([]);
    setIsUploading(false);
    setUploadProgress(0);
    setIsSubmitting(false);
    setIsDeletingVideo(false);
    setIsSelectorOpen(false);
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

  useEffect(() => {
    if (!open) {
      queuedRef.current.forEach((video) => deleteTemp(video?.id));
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
        const list = pickMyItems(res);
        setItems(list);
        if (list.length) setSelectedItemId(String(list[0].id));
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
      toast.success(nextUploads.length > 1 ? `Dodana su ${nextUploads.length} videa.` : "Video je dodan.");
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

  const handleDeleteExistingVideo = async () => {
    if (!selectedItemId) {
      toast.error("Prvo izaberite oglas.");
      return;
    }
    if (!hasVideoOnItem(selectedItem)) {
      toast.info("Ovaj oglas trenutno nema video.");
      return;
    }

    try {
      setIsDeletingVideo(true);
      const res = await editItemApi.editItem({ id: selectedItemId, delete_video: 1 });
      if (res?.data?.error !== false) {
        throw new Error(res?.data?.message || "Ne mogu obrisati video.");
      }

      setItems((prev) => prev.map((item) => (String(item.id) === String(selectedItemId)
        ? { ...item, video: null, video_link: null }
        : item)));

      toast.success("Postojeći video je obrisan.");
      onUploaded?.({ hasAnyVideo: items.some((item) => String(item.id) !== String(selectedItemId) && hasVideoOnItem(item)) });
    } catch (e) {
      console.error(e);
      toast.error(e?.message || "Greška pri brisanju videa.");
    } finally {
      setIsDeletingVideo(false);
    }
  };

  const handleSubmitUpload = async ({ keepOpen } = {}) => {
    if (!selectedItemId) {
      toast.error("Izaberite oglas.");
      return;
    }
    if (!queuedUploads.length) {
      toast.error("Prvo dodajte video za upload.");
      return;
    }

    try {
      setIsSubmitting(true);
      const [first, ...rest] = queuedUploads;
      const res = await editItemApi.editItem({ id: selectedItemId, temp_video_id: first.id });
      if (res?.data?.error !== false) {
        throw new Error(res?.data?.message || "Ne mogu sačuvati video.");
      }

      setItems((prev) => prev.map((item) => (String(item.id) === String(selectedItemId)
        ? { ...item, video: first?.path || first?.url || item?.video, video_link: null }
        : item)));

      setQueuedUploads(rest);
      if (first?.id) deleteTemp(first.id);

      toast.success(keepOpen ? "Video je sačuvan. Možete dodati još jedan." : "Video je uspješno objavljen.");
      onUploaded?.({ hasAnyVideo: true });

      if (!keepOpen) {
        onOpenChange(false);
      }
    } catch (e) {
      console.error(e);
      toast.error(e?.message || "Greška pri objavi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden max-h-[92vh] bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
        <div className="p-5 md:p-6 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-slate-100">Video priča za oglas</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">Izaberite oglas, pogledajte postojeći video i po potrebi dodajte novi upload.</p>
            </div>
          </div>
        </div>

        <div className="p-5 md:p-6 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-5 overflow-y-auto max-h-[calc(92vh-98px)]">
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 md:p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">Dostupni oglasi</p>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsSelectorOpen((p) => !p)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 px-3 py-2.5 flex items-center gap-3 text-left"
                >
                  {selectedItem?.image ? (
                    <img src={resolveMedia(selectedItem.image)} alt="" className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-slate-700" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center"><ImageIcon className="w-4 h-4 text-slate-500" /></div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{selectedItem?.name || (isLoadingItems ? "Učitavam..." : "Izaberite oglas")}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{selectedItem ? `ID #${selectedItem.id}` : "Kliknite da otvorite listu"}</p>
                  </div>
                  <ChevronDown className={cn("w-4 h-4 text-slate-500 transition-transform", isSelectorOpen && "rotate-180")} />
                </button>

                {isSelectorOpen && (
                  <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl p-2 max-h-64 overflow-y-auto">
                    {items.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setSelectedItemId(String(item.id));
                          setIsSelectorOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 rounded-xl p-2.5 text-left transition",
                          String(item.id) === String(selectedItemId)
                            ? "bg-primary/10 text-primary"
                            : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                        )}
                      >
                        {item?.image ? (
                          <img src={resolveMedia(item.image)} alt="" className="w-11 h-11 rounded-lg object-cover border border-slate-200 dark:border-slate-700" />
                        ) : (
                          <div className="w-11 h-11 rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center"><ImageIcon className="w-4 h-4 text-slate-500" /></div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{item?.name || `Oglas #${item.id}`}</p>
                          <p className="text-[11px] opacity-80">{hasVideoOnItem(item) ? "Već ima video" : "Nema video"}</p>
                        </div>
                        {String(item.id) === String(selectedItemId) && <CheckCircle2 className="w-4 h-4" />}
                      </button>
                    ))}
                    {!items.length && <p className="text-sm text-slate-500 dark:text-slate-400 p-3">Nemate dostupnih oglasa.</p>}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Postojeći video</p>
                <Button variant="outline" onClick={handleDeleteExistingVideo} disabled={isDeletingVideo || !selectedItemId || !hasVideoOnItem(selectedItem)} className="text-rose-600 border-rose-200 hover:bg-rose-50 dark:border-rose-900/40 dark:hover:bg-rose-950/40">
                  {isDeletingVideo ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />} Obriši video
                </Button>
              </div>

              {hasVideoOnItem(selectedItem) ? (
                <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                  {selectedItem?.video ? (
                    <video src={existingVideoUrl} controls className="w-full h-56 object-contain bg-black" />
                  ) : (
                    <div className="p-4 text-sm text-slate-600 dark:text-slate-300">
                      Ovaj oglas ima YouTube video link. Brisanjem uklanjate trenutni video zapis.
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-6 text-sm text-slate-500 dark:text-slate-400 text-center">
                  Trenutno nema videa na ovom oglasu.
                </div>
              )}
            </div>

            <label className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900 p-5 flex flex-col items-center text-center gap-3 cursor-pointer hover:border-primary/70 transition">
              <input type="file" accept="video/*" multiple className="hidden" onChange={(e) => handleVideoUpload(e.target.files)} />
              {isUploading ? <Loader2 className="w-7 h-7 animate-spin text-primary" /> : <UploadCloud className="w-7 h-7 text-primary" />}
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Dodajte novi video</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">MP4/MOV/WEBM do {MAX_VIDEO_MB}MB • možete dodati više i objaviti redom</p>
              </div>
              {isUploading && <p className="text-xs text-slate-500 dark:text-slate-400">Upload: {uploadProgress}%</p>}
            </label>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-4">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-3">Spremni uploadi</p>
              {queuedUploads.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">Niste dodali novi video.</p>
              ) : (
                <div className="space-y-2 max-h-[360px] overflow-y-auto">
                  {queuedUploads.map((video, idx) => (
                    <div key={`${video?.id}-${idx}`} className="flex items-center gap-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2.5">
                      <div className="w-10 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center"><Video className="w-4 h-4 text-slate-500" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">Novi video #{idx + 1}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">Temp ID: {video?.id}</p>
                      </div>
                      <button type="button" onClick={() => removeQueuedVideo(idx)} className="p-1.5 rounded-full hover:bg-rose-50 text-rose-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 text-xs text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900">
              <p className="font-semibold text-slate-700 dark:text-slate-200 mb-2">Brzi vodič</p>
              <ul className="space-y-1.5 list-disc pl-4">
                <li>Prvo izaberite oglas iz dropdown liste sa slikama.</li>
                <li>Ako oglas već ima video, možete ga obrisati jednim klikom.</li>
                <li>Novi upload ide ispod i objavljuje se na izabranom oglasu.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => handleSubmitUpload({ keepOpen: true })} disabled={isSubmitting || !queuedUploads.length}>
                {isSubmitting ? "Spremam..." : "Objavi i dodaj još"}
              </Button>
              <Button onClick={() => handleSubmitUpload({ keepOpen: false })} disabled={isSubmitting || !queuedUploads.length} className="bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white">
                {isSubmitting ? "Spremam..." : "Objavi video"}
              </Button>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 text-right">
              Aktivni oglasi sa videom: <span className="font-semibold text-slate-700 dark:text-slate-200">{hasAnyVideo ? "Da" : "Ne"}</span>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReelUploadModal;
