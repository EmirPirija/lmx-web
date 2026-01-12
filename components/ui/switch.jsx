"use client"

import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

const Switch = React.forwardRef(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-all duration-500 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 relative overflow-hidden",
      "data-[state=checked]:bg-orange-500",
      "data-[state=unchecked]:bg-gray-300",
      "before:absolute before:inset-0 before:rounded-full before:transition-opacity before:duration-500",
      "data-[state=checked]:before:opacity-100 data-[state=unchecked]:before:opacity-0",
      "data-[state=checked]:shadow-lg data-[state=checked]:shadow-orange-500/50",
      className
    )}
    {...props}
    ref={ref}>
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-all duration-500 ease-out z-10",
        "data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-1",
        "data-[state=checked]:scale-110",
        "rtl:data-[state=checked]:-translate-x-5 rtl:data-[state=unchecked]:translate-x-1"
      )} />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }