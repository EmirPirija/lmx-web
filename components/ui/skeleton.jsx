import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}) {
  return (
    <div
      className={cn("animate-pulse rounded-xl border border-border/40 bg-muted/70", className)}
      {...props}
    />
  );
}

export { Skeleton }
