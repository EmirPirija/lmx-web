import { cn } from "@/lib/utils";

const PageLoadingShell = ({
  className = "",
  title = "Učitavanje stranice",
  description = "Pripremamo sadržaj...",
}) => {
  return (
    <section
      role="status"
      aria-live="polite"
      className="mx-auto w-full max-w-6xl px-4 py-10"
    >
      <div
        className={cn(
          "overflow-hidden rounded-3xl border border-slate-200/85 bg-gradient-to-b from-white to-slate-50 p-6 shadow-sm dark:border-slate-700/85 dark:from-slate-900 dark:to-slate-900/70",
          className,
        )}
      >
        <div className="space-y-4">
          <div className="h-6 w-44 animate-pulse rounded-lg bg-slate-200/80 dark:bg-slate-700/80" />
          <div className="h-4 w-64 animate-pulse rounded-lg bg-slate-200/70 dark:bg-slate-700/70" />
          <div className="h-[52vh] animate-pulse rounded-2xl border border-slate-200/70 bg-slate-100/85 dark:border-slate-700/70 dark:bg-slate-800/75" />
        </div>
      </div>
      <p className="sr-only">
        {title}. {description}
      </p>
    </section>
  );
};

export default PageLoadingShell;
