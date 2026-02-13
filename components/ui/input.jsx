import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-xl border border-border/70 bg-background px-4 py-2 text-sm text-foreground shadow-sm transition-all duration-200",
        "placeholder:text-muted-foreground/80",
        "outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 focus:ring-offset-0",
        "disabled:cursor-not-allowed disabled:opacity-60",
        "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Input.displayName = "Input"

export { Input }
