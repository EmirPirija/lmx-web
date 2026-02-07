"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Play, X } from "lucide-react";

import { allItemApi } from "@/utils/api";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const pickItemsArray = (apiResponse) => {
  const d = apiResponse?.data;
  return d?.data?.data || d?.data || d?.items || d?.result || [];
};

const pickVideoUrl = (item) => {
  const url = item?.video || null;
  if (!url) return null;
  if (typeof url === "string" && url.startsWith("/")) {
    const base = process.env.NEXT_PUBLIC_ADMIN_URL || "";
    return base ? `${base}${url}` : url;
  }
  return url;
};

const ReelViewerModal = ({ open, onOpenChange, userId }) => {
  const [items, setItems] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const activeItem = useMemo(
    () => items.find((item) => String(item?.id) === String(activeId)),
    [items, activeId]
  );

  const fetchReels = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const res = await allItemApi.getItems({
        user_id: userId,
        has_video: 1,
        status: "approved",
        limit: 30,
        sort_by: "new-to-old",
      });

      const list = pickItemsArray(res);
      const withVideo = list.filter((item) => !!pickVideoUrl(item));
      setItems(withVideo);
      setActiveId(withVideo?.[0]?.id || null);
    } catch (e) {
      console.error(e);
      toast.error("Ne mogu učitati reelove.");
      setItems([]);
      setActiveId(null);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (open) fetchReels();
  }, [open, fetchReels]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-white">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Reelovi</h3>
            <p className="text-xs text-slate-500">
              Pregledajte sve video objave ovog prodavača.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-500"
            aria-label="Zatvori"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-0">
          <div className="bg-black flex items-center justify-center min-h-[360px]">
            {activeItem ? (
              <video
                key={activeItem.id}
                className="w-full h-full object-contain max-h-[520px]"
                src={pickVideoUrl(activeItem) || undefined}
                controls
                playsInline
              />
            ) : (
              <div className="text-sm text-slate-300">
                {isLoading ? "Učitavam reelove..." : "Nema dostupnih videa."}
              </div>
            )}
          </div>

          <div className="p-4 space-y-3 max-h-[520px] overflow-y-auto">
            <AnimatePresence>
              {items.map((item) => {
                const isActive = String(item?.id) === String(activeId);
                return (
                  <motion.button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveId(item.id)}
                    whileHover={{ scale: 1.01 }}
                    className={cn(
                      "w-full flex items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                      isActive
                        ? "border-[#11b7b0] bg-[#11b7b0]/10"
                        : "border-slate-200 hover:bg-slate-50"
                    )}
                  >
                    <div className="w-14 h-20 rounded-lg bg-slate-900 flex items-center justify-center overflow-hidden">
                      <Play className="w-5 h-5 text-white/80" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {item?.name || "Video objava"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {item?.price ? `${item.price} KM` : "Na upit"}
                      </p>
                    </div>
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReelViewerModal;
