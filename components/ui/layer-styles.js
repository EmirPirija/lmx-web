"use client";

export const LMX_LAYER_OVERLAY_CLASS =
  "lmx-layer-overlay fixed inset-0 !z-[40000] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]";

export const LMX_LAYER_SURFACE_CLASS =
  "lmx-layer-surface outline-none border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950";

export const LMX_LAYER_CLOSE_CLASS =
  "lmx-layer-close absolute right-3 top-3 sm:right-4 sm:top-4 inline-flex h-11 w-11 items-center justify-center rounded-full text-slate-500 dark:text-slate-300 transition-all duration-200 hover:text-slate-900 dark:hover:text-slate-50 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00A19B]/45 focus-visible:ring-offset-2 rtl:right-auto rtl:left-3 sm:rtl:left-4";
