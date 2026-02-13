"use client"

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"
import { motion } from "framer-motion"

import { cn } from "@/lib/utils"
import { floatingMotion } from "@/components/ui/ui-motion"

const TooltipProvider = TooltipPrimitive.Provider

const Tooltip = TooltipPrimitive.Root

const TooltipTrigger = TooltipPrimitive.Trigger

const TooltipContent = React.forwardRef(({ className, sideOffset = 4, children, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    asChild
    sideOffset={sideOffset}
    {...props}>
    <motion.div
      {...floatingMotion}
      className={cn(
        "z-[72] overflow-hidden rounded-xl border border-border/70 bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-lg",
        className
      )}>
      {children}
    </motion.div>
  </TooltipPrimitive.Content>
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
