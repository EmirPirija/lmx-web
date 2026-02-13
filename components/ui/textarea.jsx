import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[120px] w-full resize-none rounded-xl border border-border/70 bg-background px-4 py-3 text-sm text-foreground shadow-sm transition-all duration-200",
        "placeholder:text-muted-foreground/80",
        "outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 focus:ring-offset-0",
        "disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
      ref={ref}
      {...props}
    />
  );
})
Textarea.displayName = "Textarea"

export { Textarea }
