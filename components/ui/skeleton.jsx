import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}) {
  return (
    <div
      className={cn(
        "relative isolate overflow-hidden rounded-xl border border-slate-200/80",
        "bg-gradient-to-r from-slate-100 via-slate-200/95 to-slate-100 bg-[length:220%_100%] motion-safe:animate-shimmer",
        "before:absolute before:inset-0 before:-translate-x-full before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent before:motion-safe:animate-[shimmer_1.8s_linear_infinite]",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_1px_2px_rgba(15,23,42,0.04)]",
        "dark:border-slate-700/80 dark:from-slate-800 dark:via-slate-700/95 dark:to-slate-800",
        "dark:before:via-white/15",
        "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_1px_2px_rgba(2,6,23,0.25)]",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton }
