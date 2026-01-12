import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  const [isFocused, setIsFocused] = React.useState(false)
  
  return (
    <div className="relative w-full">
      {/* Subtle glow only on focus */}
      <div className={cn(
        "absolute inset-0 rounded-lg transition-all duration-700 -z-10 pointer-events-none",
        isFocused ? "opacity-30 blur-xl" : "opacity-0",
        "bg-orange-400"
      )} />

      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-lg border bg-background px-4 py-2 text-base transition-all duration-500",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          "placeholder:text-muted-foreground/60 placeholder:transition-colors placeholder:duration-500",
          // TOTALNO uklanjanje svih outline-a
          "outline-0 outline-none focus:outline-0 focus:outline-none focus-visible:outline-0 focus-visible:outline-none active:outline-0 active:outline-none",
          "ring-0 focus:ring-0 focus-visible:ring-0 active:ring-0",
          "-webkit-appearance-none appearance-none",
          "disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          // Minimalistički border
          "border-gray-200 dark:border-gray-800",
          isFocused ? "border-orange-400/50" : "border-gray-200 dark:border-gray-800",
          // Minimalistička placeholder animacija
          isFocused && "placeholder:text-orange-400/70",
          className
        )}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        ref={ref}
        {...props}
      />
    </div>
  );
})
Input.displayName = "Input"

export { Input }