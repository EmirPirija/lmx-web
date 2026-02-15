"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ShieldCheck } from "@/components/Common/UnifiedIconPack";
import {
  PROMO_HEADLINE,
  PROMO_SUBHEAD,
  PROMO_WELCOME_DISMISS_KEY,
  isPromoFreeAccessEnabled,
} from "@/lib/promoMode";

export default function PromoWelcomeModal() {
  const [isReady, setIsReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const promoEnabled = useMemo(() => isPromoFreeAccessEnabled(), []);

  useEffect(() => {
    if (!promoEnabled || typeof window === "undefined") {
      setIsReady(true);
      return;
    }

    const isDismissed = window.localStorage.getItem(PROMO_WELCOME_DISMISS_KEY) === "1";
    setOpen(!isDismissed);
    setDontShowAgain(isDismissed);
    setIsReady(true);
  }, [promoEnabled]);

  const handleContinue = () => {
    if (typeof window !== "undefined") {
      if (dontShowAgain) {
        window.localStorage.setItem(PROMO_WELCOME_DISMISS_KEY, "1");
      } else {
        window.localStorage.removeItem(PROMO_WELCOME_DISMISS_KEY);
      }
    }
    setOpen(false);
  };

  if (!isReady || !promoEnabled) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[560px] border border-slate-200 bg-white/95 p-0 backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/95">
        <div className="rounded-t-xl border-b border-slate-200/80 bg-gradient-to-r from-emerald-50 via-cyan-50 to-white px-6 py-5 dark:border-slate-700 dark:from-emerald-900/20 dark:via-cyan-900/20 dark:to-slate-900">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-700 dark:border-emerald-500/40 dark:bg-slate-900/70 dark:text-emerald-300">
            <ShieldCheck size={14} />
            Promotivni režim
          </div>
          <DialogHeader className="mt-3 space-y-2">
            <DialogTitle className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              Dobrodošli! 🎉
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              Drago nam je što ste ovdje. Trenutno su sve funkcionalnosti aplikacije dostupne potpuno besplatno u okviru promotivne ponude. Istražite sve mogućnosti i uživajte u iskustvu bez ograničenja. Želimo vam sretnu i uspješnu kupoprodaju.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-200">
            <p className="font-semibold text-slate-900 dark:text-slate-100">{PROMO_HEADLINE}</p>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{PROMO_SUBHEAD}</p>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
            <label htmlFor="promo-modal-hide" className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Ne prikazuj više ovu poruku
            </label>
            <Switch
              id="promo-modal-hide"
              checked={dontShowAgain}
              onCheckedChange={setDontShowAgain}
              aria-label="Ne prikazuj više ovu poruku"
            />
          </div>

          <Button className="h-11 w-full rounded-xl text-sm font-semibold" onClick={handleContinue}>
            Nastavi
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
