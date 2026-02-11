"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronsUpDown,
  ImageIcon,
  Link2,
  Loader2,
  Search,
  Sparkles,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";

import Api from "@/api/AxiosInterceptors";
import { editItemApi, getMyItemsApi } from "@/utils/api";
import { getYouTubeVideoId } from "@/utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const MAX_VIDEO_MB = 50;

const FILTER_ALL = "all";
const FILTER_NO_VIDEO = "no_video";
const FILTER_HAS_VIDEO = "has_video";

const pickMyItems = (res) => {
  const data = res?.data;
  return data?.data?.data || data?.data || [];
};

const joinUrl = (base, path) => {
  const b = String(base || "").replace(/\/+$/, "");
  const p = String(path || "").replace(/^\/+/, "");
  if (!b) return `/${p}`;
  return `${b}/${p}`;
};

const resolveMedia = (src) => {
  if (!src) return "";
  const raw = String(src);
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;

  const base = process.env.NEXT_PUBLIC_ADMIN_URL || "";
  return joinUrl(base, raw);
};

const hasVideoOnItem = (item) => Boolean(item?.video || item?.video_link);

const getItemName = (item) => item?.name || item?.translated_item?.name || `Oglas #${item?.id}`;

const makeQueueId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const normalize = (v) => String(v || "").toLowerCase().trim();

const matchesItemQuery = (item, query) => {
  if (!query) return true;
  const idStr = String(item?.id || "");
  const name = normalize(getItemName(item));
  return idStr.includes(query) || name.includes(query);
};

const buildExistingVideoEntries = (item) => {
  const entries = [];

  if (item?.video) {
    entries.push({
      key: `video-${item.id}`,
      kind: "direct",
      label: "Upload video",
      src: resolveMedia(item.video),
      poster: resolveMedia(item?.image),
    });
  }

  if (item?.video_link) {
    const youtubeId = getYouTubeVideoId(item.video_link);
    if (youtubeId) {
      entries.push({
        key: `yt-${item.id}`,
        kind: "youtube",
        label: "YouTube video",
        src: item.video_link,
        thumb: `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`,
      });
    } else {
      entries.push({
        key: `link-${item.id}`,
        kind: "direct",
        label: "Video link",
        src: resolveMedia(item.video_link),
        poster: resolveMedia(item?.image),
      });
    }
  }

  return entries;
};

const ReelUploadModal = ({ open, onOpenChange, onUploaded }) => {
  const [items, setItems] = useState([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState("");
  const [targetFilter, setTargetFilter] = useState(FILTER_ALL);
  const [selectedItemIds, setSelectedItemIds] = useState([]);

  const [queuedUploads, setQueuedUploads] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFileName, setUploadingFileName] = useState("");

  const [youtubeInput, setYoutubeInput] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState(null);
  const [deleteUnsupported, setDeleteUnsupported] = useState(false);

  const fileInputRef = useRef(null);
  const queuedRef = useRef([]);

  const itemsWithVideo = useMemo(
    () => items.filter((item) => hasVideoOnItem(item)),
    [items]
  );

  const itemsWithoutVideo = useMemo(
    () => items.filter((item) => !hasVideoOnItem(item)),
    [items]
  );

  const filteredByStatus = useMemo(() => {
    if (targetFilter === FILTER_NO_VIDEO) return itemsWithoutVideo;
    if (targetFilter === FILTER_HAS_VIDEO) return itemsWithVideo;
    return items;
  }, [targetFilter, items, itemsWithVideo, itemsWithoutVideo]);

  const normalizedQuery = useMemo(() => normalize(pickerQuery), [pickerQuery]);

  const visiblePickerItems = useMemo(
    () => filteredByStatus.filter((item) => matchesItemQuery(item, normalizedQuery)),
    [filteredByStatus, normalizedQuery]
  );

  const itemById = useMemo(() => {
    const map = {};
    items.forEach((item) => {
      map[String(item.id)] = item;
    });
    return map;
  }, [items]);

  const selectedTargets = useMemo(
    () => selectedItemIds.map((id) => itemById[id]).filter(Boolean),
    [selectedItemIds, itemById]
  );

  const assignedForSelection = useMemo(
    () => queuedUploads.slice(0, selectedTargets.length),
    [queuedUploads, selectedTargets.length]
  );

  const mappingRows = useMemo(
    () => selectedTargets.map((target, idx) => ({ target, video: assignedForSelection[idx], idx })),
    [assignedForSelection, selectedTargets]
  );

  const missingAssignments = Math.max(0, selectedTargets.length - assignedForSelection.length);
  const publishableCount = selectedTargets.length - missingAssignments;

  const canSubmit = selectedTargets.length > 0
    && missingAssignments === 0
    && !isUploading
    && !isSubmitting;

  const selectionLabel = useMemo(() => {
    if (!selectedTargets.length) return "Odaberi oglase";
    if (selectedTargets.length === 1) return getItemName(selectedTargets[0]);
    return `${selectedTargets.length} oglasa odabrano`;
  }, [selectedTargets]);

  const filterCounts = useMemo(() => ({
    [FILTER_ALL]: items.length,
    [FILTER_NO_VIDEO]: itemsWithoutVideo.length,
    [FILTER_HAS_VIDEO]: itemsWithVideo.length,
  }), [items.length, itemsWithVideo.length, itemsWithoutVideo.length]);

  const youtubeInputId = useMemo(() => getYouTubeVideoId(youtubeInput.trim()), [youtubeInput]);

  const footerStatus = useMemo(() => {
    if (isLoadingItems) return "Učitavam vaše oglase...";
    if (!items.length) return "Nemate odobrenih oglasa za reel objavu.";
    if (!selectedTargets.length) return "Odaberite oglase iz dropdowna.";
    if (!queuedUploads.length) return "Dodajte barem jedan video ili YouTube link.";
    if (missingAssignments > 0) return `Dodajte još ${missingAssignments} video(a) za odabrane oglase.`;
    return `Spremno za objavu: ${publishableCount} video(a).`;
  }, [
    isLoadingItems,
    items.length,
    selectedTargets.length,
    queuedUploads.length,
    missingAssignments,
    publishableCount,
  ]);

  const resetState = useCallback(() => {
    setItems([]);
    setPickerOpen(false);
    setPickerQuery("");
    setTargetFilter(FILTER_ALL);
    setSelectedItemIds([]);

    setQueuedUploads([]);
    setIsUploading(false);
    setUploadProgress(0);
    setUploadingFileName("");

    setYoutubeInput("");

    setIsSubmitting(false);
    setDeleteLoadingId(null);
    setDeleteUnsupported(false);
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

  const fetchItems = useCallback(async ({ preserveSelection = false } = {}) => {
    setIsLoadingItems(true);

    try {
      const res = await getMyItemsApi.getMyItems({
        status: "approved",
        page: 1,
        sort_by: "new-to-old",
      });

      const list = pickMyItems(res);
      setItems(list);

      setSelectedItemIds((prev) => {
        if (!preserveSelection) return [];
        const allowed = new Set(list.map((item) => String(item.id)));
        return prev.filter((id) => allowed.has(id));
      });

      return list;
    } catch (e) {
      console.error("Reel items fetch error:", e);
      toast.error("Ne mogu učitati vaše oglase.");
      setItems([]);
      setSelectedItemIds([]);
      return [];
    } finally {
      setIsLoadingItems(false);
    }
  }, []);

  useEffect(() => {
    if (!open) {
      const prevQueue = queuedRef.current;

      prevQueue.forEach((q) => {
        if (q?.localPreviewUrl) URL.revokeObjectURL(q.localPreviewUrl);
      });

      prevQueue
        .filter((q) => q?.kind === "upload" && q?.tempId)
        .forEach((q) => deleteTemp(q.tempId));

      resetState();
      return;
    }

    fetchItems();
  }, [open, deleteTemp, fetchItems, resetState]);

  const uploadFile = async (file, onProgress) => {
    const fd = new FormData();
    fd.append("video", file);

    const res = await Api.post("/upload-temp/video", fd, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (event) => {
        const total = event?.total || file?.size || 1;
        const pct = Math.round((event.loaded * 100) / total);
        onProgress?.(pct);
      },
    });

    const body = res?.data || {};
    if (body?.error === true) {
      throw new Error(body?.message || "Upload nije uspio.");
    }

    const payload = body?.data || body;
    if (!payload?.id) {
      throw new Error("Upload nije uspio. Temp ID nedostaje.");
    }

    return payload;
  };

  const handleVideoUpload = async (filesInput) => {
    const files = Array.from(filesInput || []);
    if (!files.length) return;

    const validFiles = files.filter((file) => {
      const isVideo = file?.type?.startsWith("video/")
        || /\.(mp4|mov|webm|mkv)$/i.test(file?.name || "");

      if (!isVideo) {
        toast.error(`"${file?.name || "Fajl"}" nije video fajl.`);
        return false;
      }

      if (file.size > MAX_VIDEO_MB * 1024 * 1024) {
        toast.error(`"${file.name}" prelazi limit od ${MAX_VIDEO_MB}MB.`);
        return false;
      }

      return true;
    });

    if (!validFiles.length) return;

    try {
      setIsUploading(true);
      const batch = [];

      for (let i = 0; i < validFiles.length; i += 1) {
        const file = validFiles[i];
        const localPreviewUrl = URL.createObjectURL(file);

        setUploadingFileName(file.name || `Video ${i + 1}`);
        setUploadProgress(0);

        try {
          // eslint-disable-next-line no-await-in-loop
          const temp = await uploadFile(file, (p) => setUploadProgress(p));

          batch.push({
            queueId: makeQueueId(),
            kind: "upload",
            tempId: temp.id,
            clientName: file.name,
            localPreviewUrl,
            remotePreviewSrc: resolveMedia(temp.url || temp.path),
          });
        } catch (err) {
          URL.revokeObjectURL(localPreviewUrl);
          throw err;
        }
      }

      setQueuedUploads((prev) => [...prev, ...batch]);
      toast.success(batch.length > 1 ? `Dodana su ${batch.length} videa.` : "Video je dodan.");
    } catch (e) {
      console.error(e);
      toast.error(e?.message || "Ne mogu otpremiti video.");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setUploadingFileName("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAddYoutube = () => {
    const raw = youtubeInput.trim();
    if (!raw) {
      toast.error("Unesite YouTube link.");
      return;
    }

    const id = getYouTubeVideoId(raw);
    if (!id) {
      toast.error("Unesite validan YouTube link.");
      return;
    }

    setQueuedUploads((prev) => [
      ...prev,
      {
        queueId: makeQueueId(),
        kind: "youtube",
        url: raw,
        youtubeId: id,
        thumb: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
        clientName: `YouTube ${id}`,
      },
    ]);

    setYoutubeInput("");
    toast.success("YouTube video je dodan u queue.");
  };

  const removeQueuedVideo = async (queueId) => {
    const target = queuedUploads.find((q) => q.queueId === queueId);
    if (!target) return;

    if (target.kind === "upload" && target.tempId) {
      await deleteTemp(target.tempId);
    }

    if (target.localPreviewUrl) {
      URL.revokeObjectURL(target.localPreviewUrl);
    }

    setQueuedUploads((prev) => prev.filter((q) => q.queueId !== queueId));
  };

  const toggleTarget = (id) => {
    setSelectedItemIds((prev) => (
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    ));
  };

  const removeTarget = (id) => {
    setSelectedItemIds((prev) => prev.filter((v) => v !== id));
  };

  const replaceSelectionWithVisible = () => {
    setSelectedItemIds(visiblePickerItems.map((item) => String(item.id)));
  };

  const addVisibleToSelection = () => {
    const visibleIds = visiblePickerItems.map((item) => String(item.id));
    setSelectedItemIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
  };

  const selectOnlyNoVideo = () => {
    setSelectedItemIds(itemsWithoutVideo.map((item) => String(item.id)));
  };

  const selectOnlyHasVideo = () => {
    setSelectedItemIds(itemsWithVideo.map((item) => String(item.id)));
  };

  const clearTargets = () => {
    setSelectedItemIds([]);
  };

  const handleDeleteExistingVideo = async (item) => {
    if (!item?.id) return;

    if (deleteUnsupported) {
      toast.error("Brisanje videa trenutno nije podržano na backendu.");
      return;
    }

    try {
      setDeleteLoadingId(item.id);

      const res = await editItemApi.editItem({ id: item.id, delete_video: 1 });
      if (res?.data?.error === true) {
        throw new Error(res?.data?.message || "Ne mogu obrisati video.");
      }

      const refreshed = await fetchItems({ preserveSelection: true });
      const updated = refreshed.find((it) => String(it.id) === String(item.id));

      if (updated && hasVideoOnItem(updated)) {
        setDeleteUnsupported(true);
        toast.error("Backend trenutno ignoriše delete_video. Dodavanje novog videa radi normalno.");
        return;
      }

      toast.success("Postojeći video je obrisan.");
      onUploaded?.({ hasAnyVideo: refreshed.some((it) => hasVideoOnItem(it)) });
    } catch (e) {
      console.error(e);
      toast.error(e?.message || "Greška pri brisanju videa.");
    } finally {
      setDeleteLoadingId(null);
    }
  };

  const handleSubmitUploads = async ({ keepOpen = false } = {}) => {
    if (!selectedTargets.length) {
      toast.error("Odaberite barem jedan oglas.");
      return;
    }

    if (!queuedUploads.length) {
      toast.error("Dodajte barem jedan video ili YouTube link.");
      return;
    }

    if (queuedUploads.length < selectedTargets.length) {
      toast.error("Broj videa mora biti isti ili veći od broja odabranih oglasa.");
      return;
    }

    const targets = [...selectedTargets];
    const assigned = queuedUploads.slice(0, targets.length);

    try {
      setIsSubmitting(true);

      const success = [];
      const failed = [];

      for (let i = 0; i < targets.length; i += 1) {
        const targetItem = targets[i];
        const queueVideo = assigned[i];

        if (!queueVideo) {
          failed.push({
            target: targetItem,
            video: queueVideo,
            index: i,
            error: "Nedostaje mapirani video.",
          });
          continue;
        }

        let payload = { id: targetItem.id };

        if (queueVideo.kind === "upload") {
          if (!queueVideo.tempId) {
            failed.push({
              target: targetItem,
              video: queueVideo,
              index: i,
              error: "Nedostaje temp upload ID.",
            });
            continue;
          }
          payload = { ...payload, temp_video_id: queueVideo.tempId };
        }

        if (queueVideo.kind === "youtube") {
          payload = { ...payload, video_link: queueVideo.url };
        }

        try {
          // eslint-disable-next-line no-await-in-loop
          const res = await editItemApi.editItem(payload);
          if (res?.data?.error === true) {
            throw new Error(res?.data?.message || "Objava nije uspjela.");
          }

          success.push({ target: targetItem, video: queueVideo, index: i });
        } catch (err) {
          failed.push({
            target: targetItem,
            video: queueVideo,
            index: i,
            error: err?.message || "Objava nije uspjela.",
          });
        }
      }

      if (success.length > 0) {
        const successQueueIds = new Set(success.map((x) => x.video?.queueId).filter(Boolean));

        setQueuedUploads((prev) => prev.filter((q) => !successQueueIds.has(q.queueId)));

        success.forEach((x) => {
          if (x.video?.localPreviewUrl) {
            URL.revokeObjectURL(x.video.localPreviewUrl);
          }
        });
      }

      const failedIds = Array.from(new Set(failed.map((x) => String(x.target?.id)).filter(Boolean)));
      const refreshed = await fetchItems({ preserveSelection: false });

      if (failedIds.length > 0) {
        setSelectedItemIds(failedIds);
      } else if (keepOpen) {
        setSelectedItemIds([]);
      }

      onUploaded?.({ hasAnyVideo: refreshed.some((it) => hasVideoOnItem(it)) });

      if (failed.length === 0) {
        toast.success(
          keepOpen
            ? `Objavljeno ${success.length} video objava. Možete dodati još.`
            : `Objavljeno ${success.length} video objava.`
        );

        if (!keepOpen) {
          onOpenChange(false);
        }
        return;
      }

      if (success.length > 0) {
        toast.warning(`Objavljeno ${success.length}, ali ${failed.length} nije uspjelo.`);
      } else {
        toast.error("Objava nije uspjela ni za jedan odabrani oglas.");
      }
    } catch (e) {
      console.error(e);
      toast.error(e?.message || "Greška pri objavi videa.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-1rem)] sm:w-full sm:max-w-[1040px] p-0 gap-0 overflow-hidden max-h-[92vh] bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
        <div className="border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 p-4 sm:p-6">
          <div className="flex items-start gap-3 pr-10">
            <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>

            <div className="min-w-0">
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">Reel upload studio</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                Odaberite oglase, pregledajte postojeće videe i dodajte nove upload/YouTube video objave.
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
            <StatPill label="Svi oglasi" value={items.length} />
            <StatPill label="Bez videa" value={itemsWithoutVideo.length} />
            <StatPill label="Sa videom" value={itemsWithVideo.length} />
            <StatPill label="Odabrano" value={selectedTargets.length} />
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto max-h-[calc(92vh-220px)]">
          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">1. Odaberi oglase</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Dropdown sa searchom i bulk selekcijom.</p>
              </div>
            </div>

            <div className="mt-3">
              <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
                <PopoverTrigger asChild>
                  <Button type="button" variant="outline" className="w-full h-11 justify-between text-left px-3">
                    <span className="truncate text-slate-700 dark:text-slate-200">{selectionLabel}</span>
                    <ChevronsUpDown className="w-4 h-4 text-slate-400" />
                  </Button>
                </PopoverTrigger>

                <PopoverContent align="start" className="w-[min(94vw,620px)] p-0 border-slate-200 dark:border-slate-700">
                  <div className="p-3 border-b border-slate-200 dark:border-slate-700">
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                      <input
                        type="text"
                        value={pickerQuery}
                        onChange={(e) => setPickerQuery(e.target.value)}
                        placeholder="Pretraži po nazivu ili ID-u..."
                        className="h-9 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-8 pr-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-primary"
                      />
                    </div>

                    <div className="mt-2 flex items-center gap-1 overflow-x-auto pb-1">
                      <FilterTab active={targetFilter === FILTER_ALL} onClick={() => setTargetFilter(FILTER_ALL)} label={`Svi (${filterCounts[FILTER_ALL]})`} />
                      <FilterTab active={targetFilter === FILTER_NO_VIDEO} onClick={() => setTargetFilter(FILTER_NO_VIDEO)} label={`Bez videa (${filterCounts[FILTER_NO_VIDEO]})`} />
                      <FilterTab active={targetFilter === FILTER_HAS_VIDEO} onClick={() => setTargetFilter(FILTER_HAS_VIDEO)} label={`Sa videom (${filterCounts[FILTER_HAS_VIDEO]})`} />
                    </div>

                    <div className="mt-2 flex flex-wrap gap-1">
                      <Button type="button" size="sm" variant="outline" className="h-7 text-[11px]" onClick={addVisibleToSelection}>Dodaj prikazane</Button>
                      <Button type="button" size="sm" variant="outline" className="h-7 text-[11px]" onClick={replaceSelectionWithVisible}>Zamijeni prikazanim</Button>
                      <Button type="button" size="sm" variant="outline" className="h-7 text-[11px]" onClick={selectOnlyNoVideo}>Samo bez videa</Button>
                      <Button type="button" size="sm" variant="outline" className="h-7 text-[11px]" onClick={selectOnlyHasVideo}>Samo sa videom</Button>
                      <Button type="button" size="sm" variant="outline" className="h-7 text-[11px]" onClick={clearTargets}>Očisti</Button>
                    </div>
                  </div>

                  <div className="max-h-72 overflow-y-auto p-1.5">
                    {visiblePickerItems.length === 0 ? (
                      <p className="text-sm text-slate-500 dark:text-slate-400 px-2 py-4">Nema oglasa za odabrani filter/pretragu.</p>
                    ) : (
                      visiblePickerItems.map((item) => {
                        const id = String(item.id);
                        const selected = selectedItemIds.includes(id);
                        const hasVideo = hasVideoOnItem(item);

                        return (
                          <button
                            key={`picker-${id}`}
                            type="button"
                            onClick={() => toggleTarget(id)}
                            className={cn(
                              "w-full text-left rounded-lg px-2.5 py-2.5 flex items-start gap-3 transition",
                              selected
                                ? "bg-primary/8 border border-primary/30"
                                : "border border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/60"
                            )}
                          >
                            <span className={cn("mt-0.5 flex h-4 w-4 items-center justify-center rounded border", selected ? "border-primary bg-primary text-white" : "border-slate-300 dark:border-slate-600")}>
                              {selected && <Check className="h-3 w-3" />}
                            </span>

                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{getItemName(item)}</p>
                              <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                                <span>ID: {item.id}</span>
                                {hasVideo ? (
                                  <Badge variant="outline" className="border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-300">Ima video</Badge>
                                ) : (
                                  <Badge variant="outline" className="border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-300">Nema video</Badge>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {selectedTargets.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {selectedTargets.map((item) => {
                  const id = String(item.id);
                  const hasVideo = hasVideoOnItem(item);

                  return (
                    <button
                      key={`chip-${id}`}
                      type="button"
                      onClick={() => removeTarget(id)}
                      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[11px] text-slate-700 dark:text-slate-200"
                    >
                      <span className="truncate max-w-[170px]">{getItemName(item)}</span>
                      <span className={cn("px-1.5 py-0.5 rounded-full", hasVideo ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300")}>{hasVideo ? "video" : "bez"}</span>
                      <X className="w-3 h-3" />
                    </button>
                  );
                })}
              </div>
            )}

            {selectedTargets.length > 0 && (
              <div className="mt-4 space-y-2">
                {deleteUnsupported && (
                  <div className="rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
                    Backend trenutno ne podržava `delete_video`. Možete normalno dodati novi video koji zamjenjuje postojeći.
                  </div>
                )}

                {selectedTargets.map((item, idx) => {
                  const existingEntries = buildExistingVideoEntries(item);
                  const assignedVideo = assignedForSelection[idx];

                  return (
                    <div
                      key={`selected-${item.id}`}
                      className={cn(
                        "rounded-xl border p-3",
                        assignedVideo
                          ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/50 dark:bg-emerald-950/20"
                          : "border-slate-200 bg-slate-50/70 dark:border-slate-700 dark:bg-slate-900/50"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        {item?.image ? (
                          <img src={resolveMedia(item.image)} alt="" className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center shrink-0">
                            <ImageIcon className="w-4 h-4 text-slate-500" />
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-[11px] font-semibold text-slate-700 dark:text-slate-200 shrink-0">{idx + 1}</span>
                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{getItemName(item)}</p>
                          </div>

                          {existingEntries.length === 0 ? (
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Nemate videa za ovaj oglas.</p>
                          ) : (
                            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {existingEntries.map((entry) => (
                                <div key={entry.key} className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-100 dark:bg-slate-800">
                                  {entry.kind === "youtube" ? (
                                    <>
                                      <img src={entry.thumb} alt="YouTube" className="w-full aspect-video object-cover" />
                                      <div className="px-2 py-1.5 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300">
                                        <span>{entry.label}</span>
                                        <a href={entry.src} target="_blank" rel="noopener noreferrer" className="underline text-primary">Otvori</a>
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <video
                                        src={entry.src}
                                        poster={entry.poster || undefined}
                                        controls
                                        preload="metadata"
                                        className="w-full aspect-video object-cover bg-black"
                                      />
                                      <div className="px-2 py-1.5 text-[11px] text-slate-600 dark:text-slate-300">{entry.label}</div>
                                    </>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                            {assignedVideo
                              ? `Mapiran video: ${assignedVideo?.clientName || `Video #${idx + 1}`}`
                              : "Nedostaje novi video za mapiranje."}
                          </p>
                        </div>

                        {existingEntries.length > 0 && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteExistingVideo(item)}
                            disabled={deleteLoadingId === item.id || deleteUnsupported}
                            className="text-rose-600 border-rose-200 hover:bg-rose-50 dark:border-rose-900/40 dark:hover:bg-rose-950/40"
                          >
                            {deleteLoadingId === item.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">2. Dodaj video sadržaj</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Upload lokalnog videa i/ili YouTube link u isti queue.</p>
            </div>

            <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 bg-slate-50/70 dark:bg-slate-900/60">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Upload video</p>
                  <Button type="button" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                    {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UploadCloud className="w-4 h-4 mr-2" />}
                    Dodaj fajlove
                  </Button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleVideoUpload(e.target.files)}
                />

                <button
                  type="button"
                  onClick={() => !isUploading && fileInputRef.current?.click()}
                  className={cn(
                    "mt-3 w-full rounded-xl border-2 border-dashed px-4 py-4 text-left transition",
                    isUploading
                      ? "border-primary/40 bg-primary/5"
                      : "border-slate-300 dark:border-slate-700 hover:border-primary/60 hover:bg-white dark:hover:bg-slate-800"
                  )}
                >
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {isUploading ? "Upload je u toku" : "Klikni i dodaj video fajlove"}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Max {MAX_VIDEO_MB}MB po videu.</p>

                  {isUploading && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span className="truncate pr-2">{uploadingFileName || "Upload"}</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="mt-1.5 h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div className="h-full bg-primary transition-all" style={{ width: `${Math.max(0, Math.min(100, uploadProgress))}%` }} />
                      </div>
                    </div>
                  )}
                </button>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 bg-slate-50/70 dark:bg-slate-900/60">
                <div className="flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-slate-500" />
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">YouTube link</p>
                </div>

                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="url"
                    value={youtubeInput}
                    onChange={(e) => setYoutubeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddYoutube();
                      }
                    }}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="h-9 flex-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-primary"
                  />
                  <Button type="button" size="sm" onClick={handleAddYoutube}>Dodaj</Button>
                </div>

                {youtubeInput.trim() && (
                  <div className="mt-3 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-900">
                    {youtubeInputId ? (
                      <>
                        <img src={`https://img.youtube.com/vi/${youtubeInputId}/hqdefault.jpg`} alt="YouTube preview" className="w-full aspect-video object-cover" />
                        <div className="px-2 py-1.5 text-[11px] text-emerald-700 dark:text-emerald-300">YouTube link je validan i spreman za queue.</div>
                      </>
                    ) : (
                      <div className="px-2 py-2 text-[11px] text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Link nije validan YouTube URL.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-3 space-y-2 max-h-56 overflow-y-auto pr-1">
              {queuedUploads.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">Nema dodanih videa u queue-u.</p>
              ) : (
                queuedUploads.map((video, idx) => (
                  <div key={video.queueId} className="rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 flex items-center gap-3 bg-white dark:bg-slate-900">
                    <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-[11px] font-semibold text-slate-600 dark:text-slate-300 shrink-0">{idx + 1}</span>

                    <div className="w-14 h-10 rounded-md overflow-hidden bg-slate-200 dark:bg-slate-800 shrink-0">
                      {video.kind === "youtube" ? (
                        <img src={video.thumb} alt="YouTube" className="w-full h-full object-cover" />
                      ) : (
                        <video src={video.localPreviewUrl || video.remotePreviewSrc} className="w-full h-full object-cover" muted playsInline preload="metadata" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                          {video.kind === "youtube" ? "YouTube video" : (video.clientName || `Video #${idx + 1}`)}
                        </p>
                        <Badge variant="outline" className="text-[10px] h-5">
                          {video.kind === "youtube" ? "YT" : "Upload"}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {video.kind === "youtube" ? video.url : `Temp ID: ${video.tempId || "-"}`}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeQueuedVideo(video.queueId)}
                      className="p-2 rounded-full text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                      aria-label="Ukloni video iz queue-a"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">3. Pregled mapiranja</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Video #1 ide na prvi odabrani oglas, #2 na drugi, itd.</p>
              </div>
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{publishableCount}/{selectedTargets.length} spremno</span>
            </div>

            {mappingRows.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-3">Još nema odabranih oglasa za objavu.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {mappingRows.map(({ target, video, idx }) => (
                  <div key={`map-${target.id}-${idx}`} className={cn("rounded-xl border p-3 flex items-center gap-3", video ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/50 dark:bg-emerald-950/20" : "border-amber-200 bg-amber-50/60 dark:border-amber-900/60 dark:bg-amber-950/20")}>
                    <span className="w-7 h-7 rounded-full bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xs font-semibold text-slate-700 dark:text-slate-200 shrink-0">{idx + 1}</span>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{getItemName(target)}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                        {video
                          ? (video.kind === "youtube"
                            ? `YouTube: ${video.url}`
                            : `Upload: ${video.clientName || `Video #${idx + 1}`}`)
                          : "Nedostaje video za ovaj oglas."}
                      </p>
                    </div>

                    {video ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/70 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">{footerStatus}</p>

          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSubmitUploads({ keepOpen: true })}
              disabled={!canSubmit}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Objavljujem...
                </>
              ) : (
                "Objavi i dodaj još"
              )}
            </Button>

            <Button
              type="button"
              onClick={() => handleSubmitUploads({ keepOpen: false })}
              disabled={!canSubmit}
              className="bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Objavljujem...
                </>
              ) : (
                "Objavi i zatvori"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const FilterTab = ({ active, onClick, label }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "px-2.5 h-7 rounded-md text-[11px] font-medium border transition shrink-0",
      active
        ? "bg-primary text-white border-primary"
        : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
    )}
  >
    {label}
  </button>
);

const StatPill = ({ label, value }) => (
  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 px-3 py-2">
    <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{value}</p>
  </div>
);

export default ReelUploadModal;
